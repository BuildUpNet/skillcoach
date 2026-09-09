import { Router } from 'express'
import { pool, hasMembershipDateColumn } from '../db.js'
import { asyncHandler, formatDate } from '../lib/groupUtils.js'
import { sendGroupInviteMail } from '../lib/mailer.js'
export const membersRouter = Router({ mergeParams: true })

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
  res.json(
    rows.map((r) => ({
      id: r.user_id,
      name: r.displayname,
      role: r.user_id === r.owner_id ? 'Owner' : 'Member',
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