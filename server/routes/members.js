import { Router } from 'express'
import { pool, hasMembershipDateColumn } from '../db.js'
import { asyncHandler, formatDate } from '../lib/groupUtils.js'
import { sendGroupInviteMail } from '../lib/mailer.js'
import { getGroupRole, demoteOfficer, isAllowedByPrivacy, getOfficerIds } from '../lib/groupPermissions.js'
export const membersRouter = Router({ mergeParams: true })

// Owner or officer only — used by both remove-member and cancel-invite below.
async function requireManager(groupId, userId) {
  const [[group]] = await pool.query('SELECT user_id FROM engine4_group_groups WHERE group_id = ?', [groupId])
  if (!group) return { ok: false, status: 404, error: 'Group not found' }
  const role = await getGroupRole(groupId, userId, group.user_id)
  if (role !== 'owner' && role !== 'officer') {
    return { ok: false, status: 403, error: 'Only the group owner or an officer can do this' }
  }
  return { ok: true, ownerId: group.user_id }
}

membersRouter.get('/', asyncHandler(async (req, res) => {
  const { groupId } = req.params
  const dateCol = hasMembershipDateColumn ? 'm.created_date' : 'NULL'
  const [rows] = await pool.query(
    `SELECT m.user_id, ${dateCol} AS joined_date, u.displayname, g.user_id AS owner_id
     FROM engine4_group_membership m
     JOIN engine4_users u ON u.user_id = m.user_id
     JOIN engine4_group_groups g ON g.group_id = m.resource_id
     WHERE m.resource_id = ? AND m.active = 1 AND m.resource_approved = 1 AND m.user_approved = 1
     ORDER BY u.displayname`,
    [groupId],
  )
  const officerIds = new Set(await getOfficerIds(groupId))
  res.json(
    rows.map((r) => ({
      id: r.user_id,
      name: r.displayname,
      role: r.user_id === r.owner_id ? 'Owner' : officerIds.has(r.user_id) ? 'Officer' : 'Member',
      joined: formatDate(r.joined_date),
    })),
  )
}))

membersRouter.get('/invites', asyncHandler(async (req, res) => {
  const { groupId } = req.params
  const dateCol = hasMembershipDateColumn ? 'm.created_date' : 'NULL'
  const orderCol = hasMembershipDateColumn ? 'm.created_date' : 'm.user_id'
  const [rows] = await pool.query(
    `SELECT m.user_id, ${dateCol} AS sent_date, u.email
     FROM engine4_group_membership m
     JOIN engine4_users u ON u.user_id = m.user_id
     WHERE m.resource_id = ? AND m.resource_approved = 1 AND m.user_approved = 0
     ORDER BY ${orderCol} DESC`,
    [groupId],
  )
  res.json(rows.map((r) => ({ id: r.user_id, email: r.email, sentDate: formatDate(r.sent_date) })))
}))
membersRouter.post('/invite', asyncHandler(async (req, res) => {
  const { groupId } = req.params
  const { email } = req.body || {}
  if (!email?.trim()) return res.status(400).json({ error: 'Email is required' })

  const [[group]] = await pool.query('SELECT user_id FROM engine4_group_groups WHERE group_id = ?', [groupId])
  if (!group) return res.status(404).json({ error: 'Group not found' })
  const role = await getGroupRole(groupId, req.userId, group.user_id)
  if (!(await isAllowedByPrivacy(groupId, 'invite', role))) {
    return res.status(403).json({ error: "This group's privacy settings don't allow you to send invites" })
  }

  const [[user]] = await pool.query(
    'SELECT user_id, email, displayname FROM engine4_users WHERE email = ? LIMIT 1',
    [email.trim().toLowerCase()],
  )
  if (!user) return res.status(404).json({ error: 'No SkillCoach account uses that email' })

  const [[existing]] = await pool.query(
    'SELECT active, user_approved FROM engine4_group_membership WHERE resource_id = ? AND user_id = ? LIMIT 1',
    [groupId, user.user_id],
  )
  if (existing?.active) return res.status(409).json({ error: 'That person is already a member' })
  if (existing) return res.status(409).json({ error: 'An invite is already pending for that email' })

  // invite = row exists, group approved it, user hasn't accepted yet
  await pool.query(
    hasMembershipDateColumn
      ? `INSERT INTO engine4_group_membership (resource_id, user_id, active, resource_approved, user_approved, created_date) VALUES (?, ?, 0, 1, 0, NOW())`
      : `INSERT INTO engine4_group_membership (resource_id, user_id, active, resource_approved, user_approved) VALUES (?, ?, 0, 1, 0)`,
    [groupId, user.user_id],
  )

  try {
    const [[grp]] = await pool.query('SELECT title FROM engine4_group_groups WHERE group_id = ?', [groupId])
    const [[inviter]] = await pool.query('SELECT displayname FROM engine4_users WHERE user_id = ?', [req.userId])
    await sendGroupInviteMail({ to: user.email, userId: user.user_id, displayName: user.displayname, inviterId: req.userId, inviterName: inviter?.displayname, groupTitle: grp?.title, groupId })
  } catch (err) {
    console.error('invite mail failed:', err.message)
  }

  res.status(201).json({ id: user.user_id, email: user.email, name: user.displayname, sentDate: formatDate(new Date()) })
}))

// Remove an existing active member. Legacy had zero server-side check on
// this action (any member could call it); this enforces owner-or-officer.
membersRouter.delete('/:userId', asyncHandler(async (req, res) => {
  const { groupId, userId } = req.params
  const manager = await requireManager(groupId, req.userId)
  if (!manager.ok) return res.status(manager.status).json({ error: manager.error })
  if (Number(userId) === Number(manager.ownerId)) {
    return res.status(400).json({ error: 'The group owner cannot be removed' })
  }

  const [result] = await pool.query(
    'DELETE FROM engine4_group_membership WHERE resource_id = ? AND user_id = ? AND active = 1',
    [groupId, userId],
  )
  if (!result.affectedRows) return res.status(404).json({ error: 'That person is not an active member' })

  await demoteOfficer(groupId, userId) // an ex-member can't stay an officer
  await pool.query('UPDATE engine4_group_groups SET member_count = GREATEST(member_count - 1, 0) WHERE group_id = ?', [groupId])
  res.status(204).end()
}))

// Cancel a pending invite that hasn't been accepted yet.
membersRouter.delete('/invites/:userId', asyncHandler(async (req, res) => {
  const { groupId, userId } = req.params
  const manager = await requireManager(groupId, req.userId)
  if (!manager.ok) return res.status(manager.status).json({ error: manager.error })

  const [result] = await pool.query(
    'DELETE FROM engine4_group_membership WHERE resource_id = ? AND user_id = ? AND resource_approved = 1 AND user_approved = 0',
    [groupId, userId],
  )
  if (!result.affectedRows) return res.status(404).json({ error: 'No pending invite for that person' })
  res.status(204).end()
}))