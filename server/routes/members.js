import { Router } from 'express'
import { pool, hasMembershipDateColumn } from '../db.js'
import { asyncHandler, formatDate } from '../lib/groupUtils.js'

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

  const [userRows] = await pool.query(
    'SELECT user_id, email FROM engine4_users WHERE email = ? LIMIT 1',
    [email.trim()],
  )
  if (!userRows.length) return res.status(404).json({ error: 'No account found with that email' })
  const invitedUserId = userRows[0].user_id

  const [existing] = await pool.query(
    'SELECT resource_id FROM engine4_group_membership WHERE resource_id = ? AND user_id = ? LIMIT 1',
    [groupId, invitedUserId],
  )
  if (existing.length) return res.status(409).json({ error: 'This user is already a member or has a pending invite' })

  if (hasMembershipDateColumn) {
    await pool.query(
      `INSERT INTO engine4_group_membership (resource_id, user_id, active, resource_approved, user_approved, created_date)
       VALUES (?, ?, 1, 1, 0, NOW())`,
      [groupId, invitedUserId],
    )
  } else {
    await pool.query(
      `INSERT INTO engine4_group_membership (resource_id, user_id, active, resource_approved, user_approved)
       VALUES (?, ?, 1, 1, 0)`,
      [groupId, invitedUserId],
    )
  }
  // No email — legacy confirmed sends none for invites, in-app notification only (not built).

  res.status(201).json({
    id: invitedUserId,
    email: userRows[0].email,
    sentDate: hasMembershipDateColumn ? formatDate(new Date()) : null,
  })
}))
