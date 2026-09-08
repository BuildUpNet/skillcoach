import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { pool, hasMembershipDateColumn } from './db.js'
import { authRouter } from './routes/auth.js'
import { requireAuth } from './auth.js'
import { tasksRouter } from './routes/tasks.js'
import { membersRouter } from './routes/members.js'
import { timeRouter } from './routes/time.js'
import { asyncHandler, getDisplayNames, requireGroupMember } from './lib/groupUtils.js'

const app = express()
app.set('trust proxy', 1)
// credentials:true + an explicit origin (not "*") is required for the
// httpOnly session cookie to be sent/accepted cross-origin
app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'https://skillcoach-pi.vercel.app',
    ],
    credentials: true,
  }),
)

// Raised above the default 100kb so a resized group-photo data URL (a few
// hundred KB, base64-encoded) fits in the request body.
app.use(express.json({ limit: '6mb' }))
app.use(cookieParser())

app.use('/api/auth', authRouter)

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

app.get('/api/categories', asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    'SELECT category_id, title FROM engine4_group_categories ORDER BY title',
  )
  res.json(rows)
}))

app.get('/api/groups', requireAuth, asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT g.*, c.title AS category_title
     FROM engine4_group_groups g
     LEFT JOIN engine4_group_categories c ON c.category_id = g.category_id
     ORDER BY g.creation_date DESC`,
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
  res.status(201).json(rows[0])
}))

app.put('/api/groups/:id', requireAuth, asyncHandler(async (req, res) => {
  const { title, description, category_id, search, invite, approval, summary_emails } = req.body
  if (!title?.trim()) return res.status(400).json({ error: 'title is required' })
  if (!description?.trim()) return res.status(400).json({ error: 'description is required' })

  const [existing] = await pool.query('SELECT user_id FROM engine4_group_groups WHERE group_id = ?', [req.params.id])
  if (!existing.length) return res.status(404).json({ error: 'Group not found' })
  if (existing[0].user_id !== Number(req.userId)) return res.status(403).json({ error: 'Only the group owner can edit this group' })

  const [result] = await pool.query(
    `UPDATE engine4_group_groups
     SET title = ?, description = ?, category_id = ?, search = ?, invite = ?,
         approval = ?, summary_emails = ?, modified_date = NOW()
     WHERE group_id = ?`,
    [
      title.trim(),
      description.trim(),
      category_id || 0,
      search ? 1 : 0,
      invite ? 1 : 0,
      approval ? 1 : 0,
      summary_emails ? 1 : 0,
      req.params.id,
    ],
  )
  if (!result.affectedRows) return res.status(404).json({ error: 'Group not found' })

  const [rows] = await pool.query('SELECT * FROM engine4_group_groups WHERE group_id = ?', [req.params.id])
  res.json(rows[0])
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

app.use('/api/groups/:groupId/tasks', requireAuth, requireGroupMember, tasksRouter)
app.use('/api/groups/:groupId/members', requireAuth, requireGroupMember, membersRouter)
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
