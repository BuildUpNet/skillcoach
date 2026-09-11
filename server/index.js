import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

import { pool, hasMembershipDateColumn } from './db.js'
import { authRouter } from './routes/auth.js'
import { requireAuth, requireAdmin } from './auth.js'
import { tasksRouter } from './routes/tasks.js'
import { membersRouter } from './routes/members.js'
import { timeRouter } from './routes/time.js'
import { asyncHandler, getDisplayNames, requireGroupMember } from './lib/groupUtils.js'
import { sendGroupCreatedMail, sendInviteResponseMail } from './lib/mailer.js'
import { notificationsRouter } from './routes/notifications.js'
import { creditsRouter } from './routes/credits.js'
import { award } from './lib/credits.js'
import { adminRouter } from './routes/admin.js'
import { groupSettingsRouter } from './routes/groupSettings.js'
import { profilesRouter } from './routes/profiles.js'
import { profileEditRouter } from './routes/profileEdit.js'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { friendsRouter } from './routes/friends.js'  
import { googleRouter } from "./routes/google.js";
import { facebookRouter } from "./routes/facebook.js";
import { passwordResetRouter } from "./routes/passwordReset.js";
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()

app.set('trust proxy', 1)

app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'https://skillcoach-pi.vercel.app',
    ],
    credentials: true,
  }),
)

app.use(express.json({ limit: '6mb' }))
app.use(cookieParser())
app.use('/api/auth', passwordResetRouter)
app.use('/api/auth', authRouter)
app.use('/api/auth', googleRouter) 
app.use('/api/auth', facebookRouter) 

app.use('/api/credits', creditsRouter);
app.use('/api/notifications', requireAuth, notificationsRouter)
app.use('/api/admin', requireAuth, requireAdmin, adminRouter)
app.use('/api/profiles', requireAuth, profilesRouter)
app.use('/api/me/profile', requireAuth, profileEditRouter)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))
app.use('/api/members', requireAuth, friendsRouter)
const IMAGE_DATA_URL_RE = /^data:image\/(png|jpe?g|webp);base64,/
const MAX_PHOTO_DATA_URL_LENGTH = 3_500_000 // ~2.5MB decoded

// Photos are looked up in a separate, try/catch-guarded query rather than a
// JOIN in the main groups query — a missing/misbehaving photos table should
// never take down core group listing, it should just mean no photos show.
async function getPhotoMap(groupIds) {
  if (!groupIds.length) return new Map()
  try {
    const [rows] = await pool.query(
      'SELECT group_id, data_url FROM engine4_group_group_photos WHERE group_id IN (?)',
      [groupIds],
    )
    return new Map(rows.map((r) => [r.group_id, r.data_url]))
  } catch {
    return new Map()
  }
}

app.get('/api/health', asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT 1 AS ok')
  res.json({ status: 'ok', db: rows[0].ok === 1 })
}))
app.get('/api/envcheck', (req, res) => {
  res.json({
    GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
    API_URL: process.env.API_URL || null,
    FRONTEND_URL: process.env.FRONTEND_URL || null,
    JWT_SECRET: !!process.env.JWT_SECRET,
  })
})
app.get('/api/categories', asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    'SELECT category_id, title FROM engine4_group_categories ORDER BY title',
  )
  res.json(rows)
}))

app.get('/api/groups', requireAuth, asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT g.*, c.title AS category_title,
            (m.user_id IS NOT NULL) AS is_member
     FROM engine4_group_groups g
     LEFT JOIN engine4_group_categories c ON c.category_id = g.category_id
     LEFT JOIN engine4_group_membership m
            ON m.resource_id = g.group_id AND m.user_id = ? AND m.active = 1
     ORDER BY g.creation_date DESC`,
    [req.userId],
  )
  const [photos, names] = await Promise.all([
    getPhotoMap(rows.map((r) => r.group_id)),
    getDisplayNames(rows.map((r) => r.user_id)),
  ])
  res.json(
    rows.map((r) => ({
      ...r,
      photo_data_url: photos.get(r.group_id) || null,
      owner_displayname: names.get(r.user_id) || null,
    })),
  )
}))

app.get('/api/groups/:id', requireAuth, asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT g.*, c.title AS category_title
     FROM engine4_group_groups g
     LEFT JOIN engine4_group_categories c ON c.category_id = g.category_id
     WHERE g.group_id = ?`,
    [req.params.id],
  )
  if (!rows.length) return res.status(404).json({ error: 'Group not found' })
  const [photos, names] = await Promise.all([
    getPhotoMap([rows[0].group_id]),
    getDisplayNames([rows[0].user_id]),
  ])
  res.json({
    ...rows[0],
    photo_data_url: photos.get(rows[0].group_id) || null,
    owner_displayname: names.get(rows[0].user_id) || null,
  })
}))

app.post('/api/groups', requireAuth, asyncHandler(async (req, res) => {
  const { title, description, category_id, search, invite, approval, summary_emails } = req.body
  if (!title?.trim()) return res.status(400).json({ error: 'title is required' })
  if (!description?.trim()) return res.status(400).json({ error: 'description is required' })

  const [result] = await pool.query(
    `INSERT INTO engine4_group_groups
       (user_id, title, description, category_id, search, invite, approval,
        summary_emails, creation_date, modified_date, member_count, view_count)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), 1, 0)`,
    [
      req.userId,
      title.trim(),
      description.trim(),
      category_id || 0,
      search ? 1 : 0,
      invite ? 1 : 0,
      approval ? 1 : 0,
      summary_emails ? 1 : 0,
    ],
  )
  // owner is automatically an active/approved member
  if (hasMembershipDateColumn) {
    await pool.query(
      `INSERT INTO engine4_group_membership (resource_id, user_id, active, resource_approved, user_approved, created_date)
       VALUES (?, ?, 1, 1, 1, NOW())`,
      [result.insertId, req.userId],
    )
  } else {
    await pool.query(
      `INSERT INTO engine4_group_membership (resource_id, user_id, active, resource_approved, user_approved)
       VALUES (?, ?, 1, 1, 1)`,
      [result.insertId, req.userId],
    )
  }

  const [rows] = await pool.query('SELECT * FROM engine4_group_groups WHERE group_id = ?', [result.insertId])
  // credits for creating a group — never fail the create if this fails
  try {
    await award(req.userId, 'group_create', { objectType: 'group', objectId: result.insertId })
  } catch (err) {
    console.error('group-create award failed:', err.message)
  }
  // email the creator — never fail the create if mail fails
  try {
    const [[owner]] = await pool.query(
      'SELECT email, displayname FROM engine4_users WHERE user_id = ?',
      [req.userId],
    )
    if (owner?.email) {
      await sendGroupCreatedMail({
        to: owner.email,
        displayName: owner.displayname || 'there',
        groupTitle: title.trim(),
        groupId: result.insertId,
      })
    }
  } catch (err) {
    console.error('group-created mail failed:', err.message)
  }

  res.status(201).json(rows[0])
}))

app.put('/api/groups/:id', requireAuth, asyncHandler(async (req, res) => {
  const { title, description, category_id, sub_category_id, search, invite, approval, summary_emails, lessons } = req.body
  if (!title?.trim()) return res.status(400).json({ error: 'title is required' })
  if (!description?.trim()) return res.status(400).json({ error: 'description is required' })

  const [existing] = await pool.query('SELECT user_id FROM engine4_group_groups WHERE group_id = ?', [req.params.id])
  if (!existing.length) return res.status(404).json({ error: 'Group not found' })
  if (existing[0].user_id !== Number(req.userId)) return res.status(403).json({ error: 'Only the group owner can edit this group' })

  const [result] = await pool.query(
    `UPDATE engine4_group_groups
     SET title = ?, description = ?, category_id = ?, sub_category_id = ?, search = ?, invite = ?,
         approval = ?, summary_emails = ?, lessons = ?, modified_date = NOW()
     WHERE group_id = ?`,
    [
      title.trim(),
      description.trim(),
      category_id || 0,
      sub_category_id || 0,
      search ? 1 : 0,
      invite ? 1 : 0,
      approval ? 1 : 0,
      summary_emails ? 1 : 0,
      lessons ?? null,
      req.params.id,
    ],
  )
  if (!result.affectedRows) return res.status(404).json({ error: 'Group not found' })

  const [rows] = await pool.query('SELECT * FROM engine4_group_groups WHERE group_id = ?', [req.params.id])
  res.json(rows[0])
}))

// Self-join a public group from Browse Groups — mirrors legacy's
// Group_MemberController::joinAction() for the "approve immediately" case
// only. Groups with `approval = 1` need an owner-approval queue that
// doesn't exist in this rebuild yet (no request-to-join list/approve UI),
// so those are refused here rather than silently creating an invisible,
// unapprovable pending row.
app.post('/api/groups/:id/join', requireAuth, asyncHandler(async (req, res) => {
  const [[group]] = await pool.query('SELECT group_id, approval FROM engine4_group_groups WHERE group_id = ?', [req.params.id])
  if (!group) return res.status(404).json({ error: 'Group not found' })

  const [[existing]] = await pool.query(
    'SELECT active FROM engine4_group_membership WHERE resource_id = ? AND user_id = ? LIMIT 1',
    [req.params.id, req.userId],
  )
  if (existing?.active) return res.status(409).json({ error: 'You are already a member of this group' })
  if (group.approval) {
    return res.status(400).json({ error: 'This group requires the owner to approve new members — that request flow is not available yet' })
  }

  if (existing) {
    await pool.query(
      'UPDATE engine4_group_membership SET active = 1, resource_approved = 1, user_approved = 1 WHERE resource_id = ? AND user_id = ?',
      [req.params.id, req.userId],
    )
  } else {
    await pool.query(
      hasMembershipDateColumn
        ? `INSERT INTO engine4_group_membership (resource_id, user_id, active, resource_approved, user_approved, created_date) VALUES (?, ?, 1, 1, 1, NOW())`
        : `INSERT INTO engine4_group_membership (resource_id, user_id, active, resource_approved, user_approved) VALUES (?, ?, 1, 1, 1)`,
      [req.params.id, req.userId],
    )
  }
  await pool.query('UPDATE engine4_group_groups SET member_count = member_count + 1 WHERE group_id = ?', [req.params.id])
  try {
    await award(req.userId, 'group_join', { objectType: 'group', objectId: Number(req.params.id) })
  } catch (err) {
    console.error('group-join award failed:', err.message)
  }

  const [rows] = await pool.query('SELECT * FROM engine4_group_groups WHERE group_id = ?', [req.params.id])
  res.status(201).json(rows[0])
}))

// Group custom CSS ("Edit Group Style" in the legacy app) — stored in the
// generic engine4_core_styles table (type='group', id=group_id), same table
// legacy uses, so this stays schema-compatible if ever pointed at live.
app.get('/api/groups/:groupId/style', requireAuth, requireGroupMember, asyncHandler(async (req, res) => {
  const [[row]] = await pool.query(
    "SELECT style FROM engine4_core_styles WHERE type = 'group' AND id = ? LIMIT 1",
    [req.params.groupId],
  )
  res.json({ style: row?.style || '' })
}))

app.put('/api/groups/:groupId/style', requireAuth, requireGroupMember, asyncHandler(async (req, res) => {
  const [existing] = await pool.query('SELECT user_id FROM engine4_group_groups WHERE group_id = ?', [req.params.groupId])
  if (!existing.length) return res.status(404).json({ error: 'Group not found' })
  if (existing[0].user_id !== Number(req.userId)) return res.status(403).json({ error: 'Only the group owner can change this' })

  const style = String((req.body || {}).style ?? '')
  await pool.query(
    `INSERT INTO engine4_core_styles (type, id, style) VALUES ('group', ?, ?)
     ON DUPLICATE KEY UPDATE style = VALUES(style)`,
    [req.params.groupId, style],
  )
  res.status(204).end()
}))

app.delete('/api/groups/:id', requireAuth, asyncHandler(async (req, res) => {
  const [existing] = await pool.query('SELECT user_id FROM engine4_group_groups WHERE group_id = ?', [req.params.id])
  if (!existing.length) return res.status(404).json({ error: 'Group not found' })
  if (existing[0].user_id !== Number(req.userId)) return res.status(403).json({ error: 'Only the group owner can delete this group' })

  await pool.query('DELETE FROM engine4_group_groups WHERE group_id = ?', [req.params.id])
  await pool.query('DELETE FROM engine4_group_membership WHERE resource_id = ?', [req.params.id])
  res.status(204).end()
}))

app.put('/api/groups/:id/photo', requireAuth, asyncHandler(async (req, res) => {
  const [existing] = await pool.query('SELECT user_id FROM engine4_group_groups WHERE group_id = ?', [req.params.id])
  if (!existing.length) return res.status(404).json({ error: 'Group not found' })
  if (existing[0].user_id !== Number(req.userId)) return res.status(403).json({ error: 'Only the group owner can change this photo' })

  const { dataUrl } = req.body || {}
  if (!dataUrl || !IMAGE_DATA_URL_RE.test(dataUrl)) return res.status(400).json({ error: 'A valid PNG, JPG or WEBP image is required' })
  if (dataUrl.length > MAX_PHOTO_DATA_URL_LENGTH) return res.status(400).json({ error: 'Image is too large' })

  await pool.query(
    `INSERT INTO engine4_group_group_photos (group_id, data_url, created_date)
     VALUES (?, ?, NOW())
     ON DUPLICATE KEY UPDATE data_url = VALUES(data_url), created_date = NOW()`,
    [req.params.id, dataUrl],
  )
  res.status(204).end()
}))

app.delete('/api/groups/:id/photo', requireAuth, asyncHandler(async (req, res) => {
  const [existing] = await pool.query('SELECT user_id FROM engine4_group_groups WHERE group_id = ?', [req.params.id])
  if (!existing.length) return res.status(404).json({ error: 'Group not found' })
  if (existing[0].user_id !== Number(req.userId)) return res.status(403).json({ error: 'Only the group owner can change this photo' })

  await pool.query('DELETE FROM engine4_group_group_photos WHERE group_id = ?', [req.params.id])
  res.status(204).end()
}))
// my pending invites
app.get('/api/invites', requireAuth, asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT g.group_id, g.title, g.description, g.member_count, u.displayname AS owner_name
     FROM engine4_group_membership m
     JOIN engine4_group_groups g ON g.group_id = m.resource_id
     LEFT JOIN engine4_users u ON u.user_id = g.user_id
     WHERE m.user_id = ? AND m.active = 0 AND m.resource_approved = 1 AND m.user_approved = 0
     ORDER BY g.group_id DESC`,
    [req.userId],
  )
  res.json(rows.map((r) => ({ groupId: r.group_id, title: r.title, description: r.description, members: r.member_count, ownerName: r.owner_name })))
}))

app.post('/api/invites/:groupId/accept', requireAuth, asyncHandler(async (req, res) => {
  const [result] = await pool.query(
    `UPDATE engine4_group_membership SET active = 1, user_approved = 1
     WHERE resource_id = ? AND user_id = ? AND active = 0 AND resource_approved = 1`,
    [req.params.groupId, req.userId],
  )
  if (!result.affectedRows) return res.status(404).json({ error: 'Invite not found' })
  await pool.query('UPDATE engine4_group_groups SET member_count = member_count + 1 WHERE group_id = ?', [req.params.groupId])
  try {
    await award(req.userId, 'group_join', { objectType: 'group', objectId: Number(req.params.groupId) })
  } catch (err) {
    console.error('group-join award failed:', err.message)
  }
  const [[group]] = await pool.query('SELECT * FROM engine4_group_groups WHERE group_id = ?', [req.params.groupId])
    try {
    const [[me]] = await pool.query('SELECT displayname FROM engine4_users WHERE user_id = ?', [req.userId])
    await sendInviteResponseMail({ ownerId: group.user_id, memberId: req.userId, memberName: me?.displayname || 'A member', groupTitle: group.title, groupId: group.group_id, accepted: true })
  } catch (err) {
    console.error('invite-accepted mail failed:', err.message)
  }
  res.json(group)
}))
app.post('/api/invites/:groupId/reject', requireAuth, asyncHandler(async (req, res) => {
  const [[group]] = await pool.query('SELECT group_id, user_id, title FROM engine4_group_groups WHERE group_id = ?', [req.params.groupId])
  await pool.query(
    'DELETE FROM engine4_group_membership WHERE resource_id = ? AND user_id = ? AND active = 0',
    [req.params.groupId, req.userId],
  )
  if (group) {
    try {
      const [[me]] = await pool.query('SELECT displayname FROM engine4_users WHERE user_id = ?', [req.userId])
      await sendInviteResponseMail({ ownerId: group.user_id, memberId: req.userId, memberName: me?.displayname || 'A member', groupTitle: group.title, groupId: group.group_id, accepted: false })
    } catch (err) {
      console.error('invite-declined mail failed:', err.message)
    }
  }
  res.status(204).end()
}))
app.use('/api/groups/:groupId/tasks', requireAuth, requireGroupMember, tasksRouter)
app.use('/api/groups/:groupId/members', requireAuth, requireGroupMember, membersRouter)
app.use('/api/groups/:groupId/settings', requireAuth, requireGroupMember, groupSettingsRouter)
app.use('/api/groups/:groupId', requireAuth, requireGroupMember, timeRouter)

// Global error handler — must be registered last. Without this, a thrown/
// rejected error in any async route above just leaves the request hanging
// (Express 4 doesn't auto-forward async errors), so this is the safety net
// asyncHandler() relies on.
app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: 'Server error' })
})

const port = process.env.PORT || 4000

if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`API server running on http://localhost:${port}`)
  })
}

export default app
