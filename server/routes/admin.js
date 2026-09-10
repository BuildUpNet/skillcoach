import { Router } from 'express'
import { pool } from '../db.js'
import { asyncHandler } from '../lib/groupUtils.js'
import { AUTH_COOKIE, signSession, setSessionCookie, setImpersonateCookie, publicUser } from '../auth.js'

export const adminRouter = Router()

// --- Roles / levels ---------------------------------------------------

adminRouter.get('/levels', asyncHandler(async (_req, res) => {
  const [rows] = await pool.query(
    'SELECT level_id, title, description, type, flag FROM engine4_authorization_levels ORDER BY level_id',
  )
  res.json(rows)
}))

adminRouter.post('/levels', asyncHandler(async (req, res) => {
  const { title, description, type } = req.body || {}
  if (!title?.trim()) return res.status(400).json({ error: 'title is required' })
  const validTypes = ['public', 'user', 'moderator', 'admin']
  if (!validTypes.includes(type)) return res.status(400).json({ error: `type must be one of ${validTypes.join(', ')}` })

  const [result] = await pool.query(
    'INSERT INTO engine4_authorization_levels (title, description, type) VALUES (?, ?, ?)',
    [title.trim(), description?.trim() || '', type],
  )
  const [rows] = await pool.query('SELECT level_id, title, description, type, flag FROM engine4_authorization_levels WHERE level_id = ?', [result.insertId])
  res.status(201).json(rows[0])
}))

adminRouter.put('/levels/:id', asyncHandler(async (req, res) => {
  const { title, description, type } = req.body || {}
  const [existing] = await pool.query('SELECT flag FROM engine4_authorization_levels WHERE level_id = ?', [req.params.id])
  if (!existing.length) return res.status(404).json({ error: 'Level not found' })

  if (!title?.trim()) return res.status(400).json({ error: 'title is required' })
  const validTypes = ['public', 'user', 'moderator', 'admin']
  if (!validTypes.includes(type)) return res.status(400).json({ error: `type must be one of ${validTypes.join(', ')}` })

  // The 3 system-flagged rows (superadmin/default/public) keep their `type` —
  // changing it could break requireAdmin or the signup-default lookup.
  if (existing[0].flag) {
    await pool.query(
      'UPDATE engine4_authorization_levels SET title = ?, description = ? WHERE level_id = ?',
      [title.trim(), description?.trim() || '', req.params.id],
    )
  } else {
    await pool.query(
      'UPDATE engine4_authorization_levels SET title = ?, description = ?, type = ? WHERE level_id = ?',
      [title.trim(), description?.trim() || '', type, req.params.id],
    )
  }
  const [rows] = await pool.query('SELECT level_id, title, description, type, flag FROM engine4_authorization_levels WHERE level_id = ?', [req.params.id])
  res.json(rows[0])
}))

adminRouter.delete('/levels/:id', asyncHandler(async (req, res) => {
  const [existing] = await pool.query('SELECT flag FROM engine4_authorization_levels WHERE level_id = ?', [req.params.id])
  if (!existing.length) return res.status(404).json({ error: 'Level not found' })
  if (existing[0].flag) return res.status(400).json({ error: 'System roles (Admin/Default/Public) cannot be deleted' })

  const [[{ userCount }]] = await pool.query('SELECT COUNT(*) AS userCount FROM engine4_users WHERE level_id = ?', [req.params.id])
  if (userCount > 0) return res.status(400).json({ error: `${userCount} user(s) still have this role — reassign them first` })

  await pool.query('DELETE FROM engine4_authorization_levels WHERE level_id = ?', [req.params.id])
  res.status(204).end()
}))

// Sets which level new registrants get (engine4_users.level_id on signup).
adminRouter.put('/levels/:id/set-default', asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT flag FROM engine4_authorization_levels WHERE level_id = ?', [req.params.id])
  if (!rows.length) return res.status(404).json({ error: 'Level not found' })
  if (rows[0].flag === 'superadmin' || rows[0].flag === 'public') {
    return res.status(400).json({ error: 'Admin and Public roles cannot be the default signup role' })
  }

  await pool.query("UPDATE engine4_authorization_levels SET flag = NULL WHERE flag = 'default'")
  await pool.query("UPDATE engine4_authorization_levels SET flag = 'default' WHERE level_id = ?", [req.params.id])
  const [levels] = await pool.query('SELECT level_id, title, description, type, flag FROM engine4_authorization_levels ORDER BY level_id')
  res.json(levels)
}))

// --- Users --------------------------------------------------------------

adminRouter.get('/users', asyncHandler(async (req, res) => {
  const search = (req.query.search || '').trim()
  const limit = Math.min(Number(req.query.limit) || 50, 200)
  const params = []
  let where = ''
  if (search) {
    where = 'WHERE u.email LIKE ? OR u.username LIKE ? OR u.displayname LIKE ?'
    params.push(`%${search}%`, `%${search}%`, `%${search}%`)
  }
  params.push(limit)

  const [rows] = await pool.query(
    `SELECT u.user_id, u.email, u.username, u.displayname, u.level_id, u.enabled, u.verified,
            u.approved, u.creation_date, al.title AS level_title
     FROM engine4_users u
     LEFT JOIN engine4_authorization_levels al ON al.level_id = u.level_id
     ${where}
     ORDER BY u.creation_date DESC
     LIMIT ?`,
    params,
  )
  res.json(rows)
}))

adminRouter.put('/users/:id/level', asyncHandler(async (req, res) => {
  const { levelId } = req.body || {}
  if (!levelId) return res.status(400).json({ error: 'levelId is required' })

  const [[targetUser]] = await pool.query('SELECT user_id, level_id FROM engine4_users WHERE user_id = ?', [req.params.id])
  if (!targetUser) return res.status(404).json({ error: 'User not found' })

  const [[currentLevel]] = await pool.query('SELECT flag FROM engine4_authorization_levels WHERE level_id = ?', [targetUser.level_id])
  const [[newLevel]] = await pool.query('SELECT flag FROM engine4_authorization_levels WHERE level_id = ?', [levelId])
  if (!newLevel) return res.status(400).json({ error: 'Target role does not exist' })

  // Never allow the last admin in the system to be demoted away.
  if (currentLevel?.flag === 'superadmin' && newLevel.flag !== 'superadmin') {
    const [[{ adminCount }]] = await pool.query(
      `SELECT COUNT(*) AS adminCount FROM engine4_users u
       JOIN engine4_authorization_levels al ON al.level_id = u.level_id
       WHERE al.flag = 'superadmin'`,
    )
    if (adminCount <= 1) return res.status(400).json({ error: 'Cannot remove the last remaining admin' })
  }

  await pool.query('UPDATE engine4_users SET level_id = ?, modified_date = NOW() WHERE user_id = ?', [levelId, req.params.id])
  res.status(204).end()
}))

// Enable/disable an account (disabled accounts are already refused at login
// by the existing `enabled` check in routes/auth.js).
adminRouter.patch('/users/:id/status', asyncHandler(async (req, res) => {
  const { enabled } = req.body || {}
  if (typeof enabled !== 'boolean') return res.status(400).json({ error: 'enabled (boolean) is required' })
  if (Number(req.params.id) === Number(req.userId)) {
    return res.status(400).json({ error: "You can't disable your own account" })
  }

  const [[user]] = await pool.query('SELECT user_id FROM engine4_users WHERE user_id = ?', [req.params.id])
  if (!user) return res.status(404).json({ error: 'User not found' })

  await pool.query('UPDATE engine4_users SET enabled = ?, modified_date = NOW() WHERE user_id = ?', [enabled ? 1 : 0, req.params.id])
  res.status(204).end()
}))

// "Login as user" — swaps the session cookie to the target user's identity,
// stashing the admin's own (still valid) token so /api/auth/stop-impersonating
// can restore it. Never requires the target's password.
adminRouter.post('/users/:id/impersonate', asyncHandler(async (req, res) => {
  if (Number(req.params.id) === Number(req.userId)) {
    return res.status(400).json({ error: "You're already signed in as yourself" })
  }
  const [[target]] = await pool.query('SELECT * FROM engine4_users WHERE user_id = ?', [req.params.id])
  if (!target) return res.status(404).json({ error: 'User not found' })
  if (!target.enabled) return res.status(400).json({ error: 'Cannot impersonate a disabled account' })

  const adminToken = req.cookies?.[AUTH_COOKIE]
  if (adminToken) setImpersonateCookie(res, adminToken)

  setSessionCookie(res, signSession(target))
  res.json({ user: await publicUser(target) })
}))

// --- Groups ---------------------------------------------------------------

adminRouter.get('/groups', asyncHandler(async (req, res) => {
  const search = (req.query.search || '').trim()
  const params = []
  let where = ''
  if (search) {
    where = 'WHERE g.title LIKE ?'
    params.push(`%${search}%`)
  }
  const [rows] = await pool.query(
    `SELECT g.group_id, g.title, g.member_count, g.creation_date,
            c.title AS category_title, u.displayname AS owner_name, u.email AS owner_email
     FROM engine4_group_groups g
     LEFT JOIN engine4_group_categories c ON c.category_id = g.category_id
     LEFT JOIN engine4_users u ON u.user_id = g.user_id
     ${where}
     ORDER BY g.creation_date DESC`,
    params,
  )
  res.json(rows)
}))

// Full cascade delete (mirrors the owner-delete cascade in tasks.js, just
// scoped to every task in the group instead of one) — an admin removing a
// group shouldn't leave orphaned tasks/comments/timesheets behind.
adminRouter.delete('/groups/:id', asyncHandler(async (req, res) => {
  const groupId = req.params.id
  const [[group]] = await pool.query('SELECT group_id FROM engine4_group_groups WHERE group_id = ?', [groupId])
  if (!group) return res.status(404).json({ error: 'Group not found' })

  const [tasks] = await pool.query('SELECT task_id FROM engine4_group_tasks WHERE group_id = ?', [groupId])
  for (const { task_id } of tasks) {
    await pool.query('DELETE FROM engine4_group_taskcomments WHERE task_id = ?', [task_id])
    await pool.query('DELETE FROM engine4_group_timesheets WHERE task_id = ?', [task_id])
    await pool.query('DELETE FROM engine4_group_processusers WHERE task_id = ?', [task_id])
    await pool.query('DELETE FROM engine4_group_taskprocesses WHERE task_id = ?', [task_id])
    await pool.query('DELETE FROM engine4_group_taskusers WHERE task_id = ?', [task_id])
  }
  await pool.query('DELETE FROM engine4_group_tasks WHERE group_id = ?', [groupId])
  await pool.query('DELETE FROM engine4_group_group_photos WHERE group_id = ?', [groupId])
  await pool.query('DELETE FROM engine4_group_membership WHERE resource_id = ?', [groupId])
  await pool.query('DELETE FROM engine4_group_groups WHERE group_id = ?', [groupId])
  res.status(204).end()
}))

// --- Group categories -------------------------------------------------------

adminRouter.get('/categories', asyncHandler(async (_req, res) => {
  const [rows] = await pool.query('SELECT category_id, title FROM engine4_group_categories ORDER BY title')
  res.json(rows)
}))

adminRouter.post('/categories', asyncHandler(async (req, res) => {
  const { title } = req.body || {}
  if (!title?.trim()) return res.status(400).json({ error: 'title is required' })
  const [result] = await pool.query('INSERT INTO engine4_group_categories (title) VALUES (?)', [title.trim()])
  res.status(201).json({ category_id: result.insertId, title: title.trim() })
}))

adminRouter.put('/categories/:id', asyncHandler(async (req, res) => {
  const { title } = req.body || {}
  if (!title?.trim()) return res.status(400).json({ error: 'title is required' })
  const [result] = await pool.query('UPDATE engine4_group_categories SET title = ? WHERE category_id = ?', [title.trim(), req.params.id])
  if (!result.affectedRows) return res.status(404).json({ error: 'Category not found' })
  res.json({ category_id: Number(req.params.id), title: title.trim() })
}))

adminRouter.delete('/categories/:id', asyncHandler(async (req, res) => {
  const [[{ groupCount }]] = await pool.query('SELECT COUNT(*) AS groupCount FROM engine4_group_groups WHERE category_id = ?', [req.params.id])
  if (groupCount > 0) return res.status(400).json({ error: `${groupCount} group(s) still use this category — reassign them first` })
  await pool.query('DELETE FROM engine4_group_categories WHERE category_id = ?', [req.params.id])
  res.status(204).end()
}))

// --- Activity / login logs -------------------------------------------------

adminRouter.get('/login-logs', asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 100, 500)
  const [rows] = await pool.query(
    `SELECT login_id, user_id, email, timestamp, state, INET6_NTOA(ip) AS ip
     FROM engine4_user_logins ORDER BY timestamp DESC LIMIT ?`,
    [limit],
  )
  res.json(rows)
}))

adminRouter.delete('/login-logs', asyncHandler(async (_req, res) => {
  await pool.query('DELETE FROM engine4_user_logins')
  res.status(204).end()
}))

// --- Site settings ----------------------------------------------------------
// Generic key/value editor over engine4_core_settings. Many legacy values are
// PHP-serialized (arrays/objects), not plain strings — this exposes raw
// editing (same power a legacy admin panel would have) but refuses to touch
// `core.secret`, since that's the static salt every existing password hash
// depends on (see server/auth.js) and changing it would break every login.
const PROTECTED_SETTING = 'core.secret'

adminRouter.get('/settings', asyncHandler(async (_req, res) => {
  const [rows] = await pool.query(
    'SELECT name, value FROM engine4_core_settings WHERE name != ? ORDER BY name',
    [PROTECTED_SETTING],
  )
  res.json(rows)
}))

adminRouter.put('/settings/:name', asyncHandler(async (req, res) => {
  if (req.params.name === PROTECTED_SETTING) {
    return res.status(400).json({ error: 'This setting cannot be changed here' })
  }
  const { value } = req.body || {}
  if (typeof value !== 'string') return res.status(400).json({ error: 'value (string) is required' })
  await pool.query(
    'INSERT INTO engine4_core_settings (name, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value)',
    [req.params.name, value],
  )
  res.status(204).end()
}))

adminRouter.delete('/settings/:name', asyncHandler(async (req, res) => {
  if (req.params.name === PROTECTED_SETTING) {
    return res.status(400).json({ error: 'This setting cannot be deleted' })
  }
  await pool.query('DELETE FROM engine4_core_settings WHERE name = ?', [req.params.name])
  res.status(204).end()
}))
