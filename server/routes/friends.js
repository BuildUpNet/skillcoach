import { Router } from 'express'
import { pool } from '../db.js'
import { asyncHandler } from '../lib/groupUtils.js'
import { sendFriendRequestMail, sendFriendResponseMail, sendReportMail } from '../lib/friendMail.js'

export const friendsRouter = Router()

const SITE = process.env.OLD_SITE_URL || 'https://skillcoach.org'
const photoUrl = (p) => (p ? `${SITE}/${p.replace(/^\/+/, '')}` : null)
const PAGE_SIZE = 12

// Optional tables — the local DB may not have them
const hasTable = async (t) => pool.query('SHOW TABLES LIKE ?', [t]).then(([r]) => r.length > 0).catch(() => false)
const HAS_LEVELS = await hasTable('engine4_authorization_levels')
const HAS_BLOCK = await hasTable('engine4_user_block')
const HAS_REPORTS = await hasTable('engine4_core_reports')
console.log(`[friends] levels:${HAS_LEVELS} block:${HAS_BLOCK} reports:${HAS_REPORTS}`)

/* SocialEngine friendship = two rows in engine4_user_membership
   A → B request:  (resource_id=A, user_id=B, active=0, resource_approved=1, user_approved=0)
                   (resource_id=B, user_id=A, active=0, resource_approved=0, user_approved=1)
   accepted:       both rows active=1, resource_approved=1, user_approved=1                       */

async function relation(me, other) {
  if (!me || me === other) return 'self'
  const [[row]] = await pool.query(
    'SELECT active, resource_approved, user_approved FROM engine4_user_membership WHERE resource_id = ? AND user_id = ? LIMIT 1',
    [me, other],
  )
  if (!row) return 'none'
  if (Number(row.active)) return 'friends'
  // from my row: I approved (resource_approved=1) but they haven't → I sent it
  if (Number(row.resource_approved) && !Number(row.user_approved)) return 'requested'
  return 'incoming'
}

const relationSql = `
  CASE
    WHEN m.user_id IS NULL THEN 'none'
    WHEN m.active = 1 THEN 'friends'
    WHEN m.resource_approved = 1 AND m.user_approved = 0 THEN 'requested'
    ELSE 'incoming'
  END`

async function notifyUser({ to, actorId, type, text, link }) {
  await pool.query(
    `INSERT INTO engine4_activity_notifications (user_id, subject_type, subject_id, object_type, object_id, type, params, \`read\`, mitigated, date)
     VALUES (?, 'user', ?, 'user', ?, ?, ?, 0, 0, NOW())`,
    [to, actorId, actorId, type, JSON.stringify({ text, link })],
  ).catch((e) => console.error('[friends] notification failed:', e.message))
}

async function userBrief(id) {
  const [[u]] = await pool.query(
    `SELECT u.user_id, u.username, u.displayname, u.email, f.storage_path, ss.avatar_url
     FROM engine4_users u
     LEFT JOIN engine4_storage_files f ON f.file_id = u.photo_id
     LEFT JOIN sc_user_settings ss ON ss.user_id = u.user_id
     WHERE u.user_id = ? AND u.enabled = 1`,
    [id],
  )
  return u || null
}

/* ---------- GET /api/members?q=&type=&photo=1&page=1 ---------- */
friendsRouter.get('/', asyncHandler(async (req, res) => {
  const me = Number(req.userId || 0)
  const q = String(req.query.q || '').trim()
  const type = String(req.query.type || '').trim()
  const onlyPhoto = req.query.photo === '1'
  const page = Math.max(1, Number(req.query.page) || 1)

  const where = ['u.enabled = 1', 'u.approved = 1']
  const params = []
  if (q) { where.push('(u.displayname LIKE ? OR u.username LIKE ?)'); params.push(`%${q}%`, `%${q}%`) }
  if (type && HAS_LEVELS) { where.push('l.title = ?'); params.push(type) }
  if (HAS_BLOCK) { where.push('NOT EXISTS (SELECT 1 FROM engine4_user_block b WHERE b.user_id = u.user_id AND b.blocked_user_id = ?)'); params.push(me) }
  if (onlyPhoto) where.push('(u.photo_id > 0 OR ss.avatar_url IS NOT NULL)')

  const base = `
    FROM engine4_users u
    ${HAS_LEVELS ? 'LEFT JOIN engine4_authorization_levels l ON l.level_id = u.level_id' : ''}
    LEFT JOIN engine4_storage_files f ON f.file_id = u.photo_id
    LEFT JOIN sc_user_settings ss ON ss.user_id = u.user_id
    LEFT JOIN engine4_user_membership m ON m.resource_id = ? AND m.user_id = u.user_id
    WHERE ${where.join(' AND ')}`

  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total ${base}`, [me, ...params])
  const [list] = await pool.query(
    `SELECT u.user_id, u.username, u.displayname, u.creation_date, u.member_count,
            ${HAS_LEVELS ? 'l.title' : 'NULL'} AS level, f.storage_path, ss.avatar_url, ${relationSql} AS relation
     ${base}
     ORDER BY u.displayname
     LIMIT ? OFFSET ?`,
    [me, ...params, PAGE_SIZE, (page - 1) * PAGE_SIZE],
  )
  const [levels] = HAS_LEVELS ? await pool.query('SELECT title FROM engine4_authorization_levels ORDER BY level_id').catch(() => [[]]) : [[]]

  res.json({
    total,
    page,
    pageSize: PAGE_SIZE,
    pages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    levels: levels.map((l) => l.title),
    members: list.map((u) => ({
      id: u.user_id,
      name: u.displayname,
      username: u.username || String(u.user_id),
      type: u.level || 'Member',
      avatar: u.avatar_url || photoUrl(u.storage_path),
      friends: u.member_count ?? 0,
      relation: u.user_id === me ? 'self' : u.relation,
    })),
  })
}))

/* ---------- GET /api/members/requests — incoming pending requests ---------- */
friendsRouter.get('/requests', asyncHandler(async (req, res) => {
  const me = Number(req.userId)
  const [list] = await pool.query(
    `SELECT u.user_id, u.username, u.displayname, f.storage_path, ss.avatar_url
     FROM engine4_user_membership m
     JOIN engine4_users u ON u.user_id = m.user_id
     LEFT JOIN engine4_storage_files f ON f.file_id = u.photo_id
     LEFT JOIN sc_user_settings ss ON ss.user_id = u.user_id
     WHERE m.resource_id = ? AND m.active = 0 AND m.resource_approved = 0 AND m.user_approved = 1`,
    [me],
  )
  res.json(list.map((u) => ({ id: u.user_id, name: u.displayname, username: u.username || String(u.user_id), avatar: u.avatar_url || photoUrl(u.storage_path) })))
}))

/* ---------- POST /api/members/:id/request — send friend request ---------- */
friendsRouter.post('/:id/request', asyncHandler(async (req, res) => {
  const me = Number(req.userId)
  const other = Number(req.params.id)
  if (!other || other === me) return res.status(400).json({ error: 'Invalid member' })
  const target = await userBrief(other)
  if (!target) return res.status(404).json({ error: 'Member not found' })

  const rel = await relation(me, other)
  if (rel === 'friends') return res.status(409).json({ error: 'You are already friends' })
  if (rel === 'requested') return res.status(409).json({ error: 'Request already sent' })
  if (rel === 'incoming') return res.status(409).json({ error: 'This member already sent you a request — accept it instead' })

  await pool.query(
    `INSERT INTO engine4_user_membership (resource_id, user_id, active, resource_approved, user_approved)
     VALUES (?, ?, 0, 1, 0), (?, ?, 0, 0, 1)`,
    [me, other, other, me],
  )

  const actor = await userBrief(me)
  const link = '/members?tab=requests'
  await notifyUser({ to: other, actorId: me, type: 'friend_request', text: `${actor.displayname} sent you a friend request`, link })
  sendFriendRequestMail({ to: target, from: actor }).catch((e) => console.error('[friends] mail failed:', e.message))

  res.status(201).json({ relation: 'requested' })
}))

/* ---------- DELETE /api/members/:id/request — cancel my request ---------- */
friendsRouter.delete('/:id/request', asyncHandler(async (req, res) => {
  const me = Number(req.userId)
  const other = Number(req.params.id)
  await pool.query(
    'DELETE FROM engine4_user_membership WHERE active = 0 AND ((resource_id = ? AND user_id = ?) OR (resource_id = ? AND user_id = ?))',
    [me, other, other, me],
  )
  // remove the pending notification too
  await pool.query(
    "DELETE FROM engine4_activity_notifications WHERE user_id = ? AND subject_id = ? AND type = 'friend_request' AND `read` = 0",
    [other, me],
  ).catch(() => {})
  res.json({ relation: 'none' })
}))

/* ---------- POST /api/members/:id/accept ---------- */
friendsRouter.post('/:id/accept', asyncHandler(async (req, res) => {
  const me = Number(req.userId)
  const other = Number(req.params.id)
  if ((await relation(me, other)) !== 'incoming') return res.status(404).json({ error: 'No pending request from this member' })

  await pool.query(
    'UPDATE engine4_user_membership SET active = 1, resource_approved = 1, user_approved = 1 WHERE (resource_id = ? AND user_id = ?) OR (resource_id = ? AND user_id = ?)',
    [me, other, other, me],
  )
  await pool.query('UPDATE engine4_users SET member_count = member_count + 1 WHERE user_id IN (?, ?)', [me, other]).catch(() => {})

  // activity feed entry like SocialEngine ("X is now friends with Y")
  try {
    const [r] = await pool.query(
      `INSERT INTO engine4_activity_actions (type, subject_type, subject_id, object_type, object_id, params, body, attachment_count, comment_count, like_count, date)
       VALUES ('friends', 'user', ?, 'user', ?, NULL, '', 0, 0, 0, NOW())`,
      [me, other],
    )
    await pool.query(
      `INSERT IGNORE INTO engine4_activity_stream (target_type, target_id, subject_type, subject_id, object_type, object_id, type, action_id)
       VALUES ('user', ?, 'user', ?, 'user', ?, 'friends', ?), ('user', ?, 'user', ?, 'user', ?, 'friends', ?)`,
      [me, me, other, r.insertId, other, me, other, r.insertId],
    )
  } catch (e) { console.error('[friends] activity failed:', e.message) }

  const [actor, target] = await Promise.all([userBrief(me), userBrief(other)])
  await pool.query("UPDATE engine4_activity_notifications SET `read` = 1, mitigated = 1 WHERE user_id = ? AND subject_id = ? AND type = 'friend_request'", [me, other]).catch(() => {})
  await notifyUser({ to: other, actorId: me, type: 'friend_accepted', text: `${actor.displayname} accepted your friend request`, link: `/profile/${actor.username || me}` })
  sendFriendResponseMail({ to: target, from: actor, accepted: true }).catch((e) => console.error('[friends] mail failed:', e.message))

  res.json({ relation: 'friends' })
}))

/* ---------- POST /api/members/:id/decline ---------- */
friendsRouter.post('/:id/decline', asyncHandler(async (req, res) => {
  const me = Number(req.userId)
  const other = Number(req.params.id)
  if ((await relation(me, other)) !== 'incoming') return res.status(404).json({ error: 'No pending request from this member' })

  await pool.query(
    'DELETE FROM engine4_user_membership WHERE active = 0 AND ((resource_id = ? AND user_id = ?) OR (resource_id = ? AND user_id = ?))',
    [me, other, other, me],
  )
  await pool.query("UPDATE engine4_activity_notifications SET `read` = 1, mitigated = 1 WHERE user_id = ? AND subject_id = ? AND type = 'friend_request'", [me, other]).catch(() => {})

  const [actor, target] = await Promise.all([userBrief(me), userBrief(other)])
  sendFriendResponseMail({ to: target, from: actor, accepted: false }).catch((e) => console.error('[friends] mail failed:', e.message))

  res.json({ relation: 'none' })
}))

/* ---------- DELETE /api/members/:id/friend — unfriend ---------- */
friendsRouter.delete('/:id/friend', asyncHandler(async (req, res) => {
  const me = Number(req.userId)
  const other = Number(req.params.id)
  const [r] = await pool.query(
    'DELETE FROM engine4_user_membership WHERE active = 1 AND ((resource_id = ? AND user_id = ?) OR (resource_id = ? AND user_id = ?))',
    [me, other, other, me],
  )
  if (r.affectedRows) await pool.query('UPDATE engine4_users SET member_count = GREATEST(member_count - 1, 0) WHERE user_id IN (?, ?)', [me, other]).catch(() => {})
  res.json({ relation: 'none' })
}))

/* ---------- Block / unblock (engine4_user_block: user_id blocks blocked_user_id) ---------- */
friendsRouter.post('/:id/block', asyncHandler(async (req, res) => {
  if (!HAS_BLOCK) return res.status(501).json({ error: 'Blocking is not available on this server' })
  const me = Number(req.userId), other = Number(req.params.id)
  if (!other || other === me) return res.status(400).json({ error: 'Invalid member' })
  await pool.query('INSERT IGNORE INTO engine4_user_block (user_id, blocked_user_id) VALUES (?, ?)', [me, other])
  // blocking also ends any friendship / pending request, like SocialEngine
  await pool.query(
    'DELETE FROM engine4_user_membership WHERE (resource_id = ? AND user_id = ?) OR (resource_id = ? AND user_id = ?)',
    [me, other, other, me],
  )
  res.json({ blocked: true, relation: 'none' })
}))

friendsRouter.delete('/:id/block', asyncHandler(async (req, res) => {
  if (!HAS_BLOCK) return res.status(501).json({ error: 'Blocking is not available on this server' })
  const me = Number(req.userId), other = Number(req.params.id)
  await pool.query('DELETE FROM engine4_user_block WHERE user_id = ? AND blocked_user_id = ?', [me, other])
  res.json({ blocked: false })
}))

/* ---------- Report a member (engine4_core_reports if present, always emails support) ---------- */
friendsRouter.post('/:id/report', asyncHandler(async (req, res) => {
  const me = Number(req.userId), other = Number(req.params.id)
  const category = String(req.body?.category || 'other').slice(0, 32)
  const description = String(req.body?.description || '').trim().slice(0, 2000)
  if (!description) return res.status(400).json({ error: 'Please describe the problem' })
  const target = await userBrief(other)
  if (!target) return res.status(404).json({ error: 'Member not found' })

  if (HAS_REPORTS) {
    await pool.query(
      `INSERT INTO engine4_core_reports (user_id, subject_type, subject_id, category, description, creation_date)
       VALUES (?, 'user', ?, ?, ?, NOW())`,
      [me, other, category, description],
    ).catch((e) => console.error('[friends] report insert failed:', e.message))
  }
  const reporter = await userBrief(me)
  sendReportMail({ reporter, target, category, description }).catch((e) => console.error('[friends] report mail failed:', e.message))
  res.status(201).json({ ok: true })
}))