import { Router } from 'express'
import { pool } from '../db.js'
import { asyncHandler } from '../lib/groupUtils.js'
import { loadFields } from './profileEdit.js'

export const profilesRouter = Router()

const SITE = process.env.OLD_SITE_URL || 'https://skillcoach.org'
const photoUrl = (path) => (path ? `${SITE}/${path.replace(/^\/+/, '')}` : null)

const fmtLong = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : null

// Same-year → "May 27", older → "May 27, 2025" (SocialEngine feed style)
const fmtShort = (d) => {
  if (!d) return null
  const dt = new Date(d)
  const opts = { month: 'long', day: 'numeric' }
  if (dt.getFullYear() !== new Date().getFullYear()) opts.year = 'numeric'
  return dt.toLocaleDateString('en-US', opts)
}

// COUNT that returns 0 if the table doesn't exist (e.g. Pages module missing)
async function count(sql, params) {
  try {
    const [[row]] = await pool.query(sql, params)
    return Number(row?.n ?? 0)
  } catch {
    return 0
  }
}

// SELECT that returns [] (and logs) if the table/column is missing in this DB
async function rows(label, sql, params) {
  try {
    const [r] = await pool.query(sql, params)
    return r
  } catch (err) {
    console.error(`[profiles] ${label} failed:`, err.message)
    return []
  }
}

/* ---------- Activity feed (SocialEngine Activity module) ----------
   actions  = engine4_activity_actions (who/what, params JSON, counts)
   stream   = engine4_activity_stream  (which profile shows the action)
   template = engine4_activity_actiontypes.body, e.g. "{item:$subject} is now friends with {item:$object}."
   Placeholders: {item:$subject} {item:$object} {item:$owner} {body} {var:$name}                       */

const itemLink = (type, id, username) =>
  type === 'user' ? `/profile/${username || id}`
  : type === 'group' ? `/projects/${id}`
  : type === 'group_task' ? `/projects/${id}`
  : '#'

// Render one action into [string | { t, to }] for the UI
function renderAction(a, template) {
  let params = {}
  try { params = a.params ? JSON.parse(a.params) : {} } catch { /* ignore */ }
  const tpl = template || a.body || '{item:$subject} {body}'
  const items = {
    subject: { title: a.subject_title, type: a.subject_type, id: a.subject_id, username: a.subject_username },
    object: { title: a.object_title, type: a.object_type, id: a.object_id, username: a.object_username },
    owner: { title: params.owner_title, type: params.owner_type, id: params.owner_id },
  }
  const parts = []
  const re = /\{item:\$(\w+)(?::\$?(\w+))?\}|\{body\}|\{var:\$(\w+)\}/g
  let last = 0
  let m
  while ((m = re.exec(tpl))) {
    if (m.index > last) parts.push(tpl.slice(last, m.index))
    if (m[0] === '{body}') {
      if (params.body) parts.push(String(params.body))
    } else if (m[3]) {
      parts.push(String(params[m[3]] ?? ''))
    } else {
      const it = items[m[1]] || {}
      const label = (m[2] && params[m[2]]) || it.title || params[`${m[1]}_title`] || ''
      if (label) parts.push({ t: label, to: itemLink(it.type, it.id, it.username) })
    }
    last = re.lastIndex
  }
  if (last < tpl.length) parts.push(tpl.slice(last))
  // SE templates start with the subject; the UI prints the author name itself, so drop a leading subject link
  if (parts[0] && typeof parts[0] === 'object' && parts[0].t === a.subject_title) parts.shift()
  const out = parts.map((x) => (typeof x === 'string' ? x.replace(/\s+/g, ' ') : x)).filter((x) => x !== '' && x !== ' ')
  if (typeof out[0] === 'string') out[0] = out[0].replace(/^\s+/, '')
  return out.length ? out : ['posted an update']
}

// Load templates once (small table)
let ACTION_TEMPLATES = null
async function actionTemplates() {
  if (ACTION_TEMPLATES) return ACTION_TEMPLATES
  const list = await rows('actiontypes', 'SELECT type, body FROM engine4_activity_actiontypes', [])
  ACTION_TEMPLATES = Object.fromEntries(list.map((r) => [r.type, r.body]))
  return ACTION_TEMPLATES
}

// Attachments: photos (album_photo) and links (core_link)
async function attachmentsFor(actionIds) {
  if (!actionIds.length) return {}
  const list = await rows('attachments',
    `SELECT at.action_id, at.type, at.id,
            f.storage_path, l.uri, l.title AS link_title, l.description AS link_desc
     FROM engine4_activity_attachments at
     LEFT JOIN engine4_album_photos ph ON at.type = 'album_photo' AND ph.photo_id = at.id
     LEFT JOIN engine4_storage_files f ON f.file_id = ph.file_id
     LEFT JOIN engine4_core_links l ON at.type = 'core_link' AND l.link_id = at.id
     WHERE at.action_id IN (?)`,
    [actionIds],
  )
  const out = {}
  for (const r of list) {
    const item = r.type === 'album_photo' && r.storage_path ? { kind: 'photo', url: photoUrl(r.storage_path) }
      : r.type === 'core_link' && r.uri ? { kind: 'link', url: r.uri, title: r.link_title || r.uri, description: r.link_desc || '' }
      : null
    if (item) (out[r.action_id] ||= []).push(item)
  }
  return out
}

async function loadFeed(uid, viewerId = 0) {
  const actions = await rows('activity feed',
    `SELECT a.action_id AS id, a.type, a.body, a.params, a.date, a.like_count AS likes, a.comment_count AS comments,
            a.subject_type, a.subject_id, a.object_type, a.object_id,
            COALESCE(us.displayname, gs.title) AS subject_title, us.username AS subject_username,
            fs.storage_path AS subject_photo, ss.avatar_url AS subject_avatar,
            COALESCE(uo.displayname, go.title) AS object_title, uo.username AS object_username
     FROM engine4_activity_stream st
     JOIN engine4_activity_actions a ON a.action_id = st.action_id
     LEFT JOIN engine4_users us ON a.subject_type = 'user' AND us.user_id = a.subject_id
     LEFT JOIN engine4_storage_files fs ON fs.file_id = us.photo_id
     LEFT JOIN sc_user_settings ss ON ss.user_id = us.user_id
     LEFT JOIN engine4_group_groups gs ON a.subject_type = 'group' AND gs.group_id = a.subject_id
     LEFT JOIN engine4_users uo ON a.object_type = 'user' AND uo.user_id = a.object_id
     LEFT JOIN engine4_group_groups go ON a.object_type = 'group' AND go.group_id = a.object_id
     WHERE st.target_type = 'user' AND st.target_id = ?
     GROUP BY a.action_id
     ORDER BY a.date DESC
     LIMIT 50`,
    [uid],
  )
  const ids = actions.map((a) => a.id)
  const [templates, attachments, likedRows] = await Promise.all([
    actionTemplates(),
    attachmentsFor(ids),
    viewerId && ids.length
      ? rows('my likes', 'SELECT resource_id FROM engine4_activity_likes WHERE poster_type = \'user\' AND poster_id = ? AND resource_id IN (?)', [viewerId, ids])
      : [],
  ])
  const liked = new Set(likedRows.map((r) => r.resource_id))
  return actions.map((a) => ({
    id: a.id,
    type: a.type,
    author: {
      user_id: a.subject_id,
      name: a.subject_title || 'Member',
      username: a.subject_username || String(a.subject_id),
      avatar: a.subject_avatar || photoUrl(a.subject_photo),
    },
    text: renderAction(a, templates[a.type]),
    attachments: attachments[a.id] || [],
    date: fmtShort(a.date),
    likes: a.likes ?? 0,
    liked: liked.has(a.id),
    comments: a.comments ?? 0,
  }))
}

/* ---------- Personal info sections (SocialEngine profile fields) ---------- */

async function loadInfo(uid) {
  const info = []
  try {
    const fields = await loadFields(uid)
    let current = { heading: 'Personal information', items: [] }
    const fmtValue = (f) => {
      const v = f.value
      if (v === '' || v === null || v === undefined || (Array.isArray(v) && !v.length)) return null
      if (f.options?.length) {
        const map = new Map(f.options.map((o) => [String(o.value), o.label]))
        return [].concat(v).map((x) => map.get(String(x)) || x).join(', ')
      }
      if (f.type === 'checkbox') return Number(v) ? 'Yes' : null
      if (['date', 'birthdate'].includes(f.type)) return fmtLong(v) || String(v)
      return String(v)
    }
    for (const f of fields) {
      if (f.type === 'heading') {
        if (current.items.length) info.push(current)
        current = { heading: f.label, items: [] }
        continue
      }
      if (f.type === 'profile_type') continue
      const val = fmtValue(f)
      if (val) current.items.push({ label: f.label, value: val, type: f.type })
    }
    if (current.items.length) info.push(current)
  } catch (e) {
    console.error('[profiles] info fields failed:', e.message)
  }
  return info
}

/* ---------- GET /api/profiles/:username ---------- */

profilesRouter.get('/:username', asyncHandler(async (req, res) => {
  const viewerId = Number(req.userId || 0)
  // accept /profile/<username> or /profile/<user_id>; old SE URLs may have "+" for spaces
  const key = decodeURIComponent(req.params.username).replace(/\+/g, ' ')
  const numericId = /^\d+$/.test(key) ? Number(key) : 0

  let [u] = await rows('user+photo',
    `SELECT u.user_id, u.username, u.displayname, u.creation_date, u.status_date, u.status,
            u.view_count, u.level_id, f.storage_path, ss.avatar_url, ss.about, ss.show_intro
     FROM engine4_users u
     LEFT JOIN engine4_storage_files f ON f.file_id = u.photo_id
     LEFT JOIN sc_user_settings ss ON ss.user_id = u.user_id
     WHERE (u.username = ? OR u.user_id = ?) AND u.enabled = 1
     LIMIT 1`,
    [key, numericId],
  )
  if (!u) {
    // storage table / columns may be missing locally — plain lookup
    const [[plain]] = await pool.query(
      'SELECT * FROM engine4_users WHERE (username = ? OR user_id = ?) AND enabled = 1 LIMIT 1',
      [key, numericId],
    )
    u = plain
  }
  if (!u) return res.status(404).json({ error: 'Member not found' })
  const uid = u.user_id

  const [friendsN, groupsN, pagesN, lessonsN] = await Promise.all([
    count('SELECT COUNT(*) n FROM engine4_user_membership WHERE resource_id = ? AND active = 1', [uid]),
    count('SELECT COUNT(*) n FROM engine4_group_membership WHERE user_id = ? AND active = 1 AND resource_approved = 1 AND user_approved = 1', [uid]),
    count('SELECT COUNT(*) n FROM engine4_page_membership WHERE user_id = ? AND active = 1', [uid]),
    // TODO: replace with SkillCoach's real "lessons taken" table
    Promise.resolve(0),
  ])

  const groups = await rows('groups',
    `SELECT g.group_id AS id, g.title AS name, g.member_count AS members, f.storage_path
     FROM engine4_group_membership gm
     JOIN engine4_group_groups g ON g.group_id = gm.resource_id
     LEFT JOIN engine4_storage_files f ON f.file_id = g.photo_id
     WHERE gm.user_id = ? AND gm.active = 1 AND gm.resource_approved = 1 AND gm.user_approved = 1
     ORDER BY g.title`,
    [uid],
  )

  // Friends list (SE stores friendship as user_membership rows: resource_id = the member, user_id = the friend)
  const friends = await rows('friends',
    `SELECT fr.user_id, fr.username, fr.displayname AS name, f.storage_path, ss.avatar_url
     FROM engine4_user_membership um
     JOIN engine4_users fr ON fr.user_id = um.user_id
     LEFT JOIN engine4_storage_files f ON f.file_id = fr.photo_id
     LEFT JOIN sc_user_settings ss ON ss.user_id = fr.user_id
     WHERE um.resource_id = ? AND um.active = 1 AND fr.enabled = 1
     ORDER BY fr.displayname
     LIMIT 100`,
    [uid],
  )

  let mutual = []
  if (viewerId && viewerId !== uid) {
    mutual = await rows('mutual friends',
      `SELECT fr.user_id, fr.username, fr.displayname AS name, f.storage_path
       FROM engine4_user_membership a
       JOIN engine4_user_membership b ON b.user_id = a.user_id AND b.resource_id = ? AND b.active = 1
       JOIN engine4_users fr ON fr.user_id = a.user_id
       LEFT JOIN engine4_storage_files f ON f.file_id = fr.photo_id
       WHERE a.resource_id = ? AND a.active = 1
       LIMIT 12`,
      [viewerId, uid],
    )
  }

  const [posts, info] = await Promise.all([loadFeed(uid, viewerId), loadInfo(uid)])

  // friendship between viewer and this profile (same rule as routes/friends.js)
  let relation = viewerId === uid ? 'self' : 'none'
  if (viewerId && viewerId !== uid) {
    const [[rel]] = await pool.query(
      'SELECT active, resource_approved, user_approved FROM engine4_user_membership WHERE resource_id = ? AND user_id = ? LIMIT 1',
      [viewerId, uid],
    ).catch(() => [[null]])
    if (rel) relation = Number(rel.active) ? 'friends' : (Number(rel.resource_approved) && !Number(rel.user_approved)) ? 'requested' : 'incoming'
  }
  const [[blk]] = viewerId && viewerId !== uid
    ? await pool.query('SELECT 1 AS b FROM engine4_user_block WHERE user_id = ? AND blocked_user_id = ?', [viewerId, uid]).catch(() => [[null]])
    : [[null]]
  const blocked = !!blk

  // TODO: swap for the real badge table if one exists; using group photos for now
  const badges = groups.slice(0, 4).map((g) => photoUrl(g.storage_path)).filter(Boolean)

  res.json({
    user_id: uid,
    relation,
    blocked,
    name: u.displayname,
    username: u.username || String(uid),
    avatar: u.avatar_url || photoUrl(u.storage_path),
    about: u.about || null,
    info,
    badges,
    stats: {
      views: u.view_count ?? 0,
      friends: friendsN,
      lastUpdate: fmtShort(u.status_date) || '—',
      joined: fmtLong(u.creation_date),
    },
    counts: { friends: friendsN, groups: groupsN, pages: pagesN, lessons: lessonsN },
    status: u.status || null,
    friends: friends.map((m) => ({
      user_id: m.user_id, name: m.name, username: m.username || String(m.user_id),
      avatar: m.avatar_url || photoUrl(m.storage_path),
    })),
    mutualFriends: mutual.map((m) => ({ name: m.name, username: m.username || String(m.user_id), avatar: photoUrl(m.storage_path) })),
    groups: groups.map((g) => ({
      id: g.id, name: g.name, members: g.members ?? 0,
      image: photoUrl(g.storage_path) || '/groups/std.png',
    })),
    posts,
  })
}))

/* ---------- POST /api/profiles/status  { text } — share a status to your own feed ---------- */

profilesRouter.post('/status', asyncHandler(async (req, res) => {
  const uid = Number(req.userId || 0)
  if (!uid) return res.status(401).json({ error: 'Sign in required' })
  const text = (req.body?.text || '').trim()
  if (!text) return res.status(400).json({ error: 'Text is required' })
  if (text.length > 1000) return res.status(400).json({ error: 'Status is too long' })

  const [r] = await pool.query(
    `INSERT INTO engine4_activity_actions
       (type, subject_type, subject_id, object_type, object_id, params, body, attachment_count, comment_count, like_count, date)
     VALUES ('status', 'user', ?, 'user', ?, ?, '', 0, 0, 0, NOW())`,
    [uid, uid, JSON.stringify({ body: text })],
  )
  // make it show on the user's own profile feed (SE reads the feed from the stream table)
  await pool.query(
    'INSERT INTO engine4_activity_stream (action_id, target_type, target_id) VALUES (?, ?, ?)',
    [r.insertId, 'user', uid],
  ).catch((e) => console.error('[profiles] stream insert failed:', e.message))
  await pool.query('UPDATE engine4_users SET status = ?, status_date = NOW() WHERE user_id = ?', [text, uid])

  const [[me]] = await pool.query(
    `SELECT u.displayname, u.username, f.storage_path, ss.avatar_url
     FROM engine4_users u
     LEFT JOIN engine4_storage_files f ON f.file_id = u.photo_id
     LEFT JOIN sc_user_settings ss ON ss.user_id = u.user_id
     WHERE u.user_id = ?`,
    [uid],
  ).catch(() => [[{}]])

  res.status(201).json({
    id: r.insertId,
    type: 'status',
    author: {
      user_id: uid,
      name: me?.displayname || 'You',
      username: me?.username || String(uid),
      avatar: me?.avatar_url || photoUrl(me?.storage_path),
    },
    text: [text],
    attachments: [],
    date: fmtShort(new Date()),
    likes: 0,
    liked: false,
    comments: 0,
  })
}))

/* ---------- Likes & comments on feed posts (engine4_activity_likes / engine4_activity_comments) ---------- */

const authorSelect = `u.user_id, u.displayname AS name, u.username, f.storage_path, ss.avatar_url`
const authorJoins = `LEFT JOIN engine4_storage_files f ON f.file_id = u.photo_id
                     LEFT JOIN sc_user_settings ss ON ss.user_id = u.user_id`
const toAuthor = (r) => ({ user_id: r.user_id, name: r.name, username: r.username || String(r.user_id), avatar: r.avatar_url || photoUrl(r.storage_path) })

// POST /api/profiles/posts/:id/like  → toggles, returns { liked, likes }
profilesRouter.post('/posts/:id/like', asyncHandler(async (req, res) => {
  const uid = Number(req.userId || 0)
  if (!uid) return res.status(401).json({ error: 'Sign in required' })
  const actionId = Number(req.params.id)
  const [[action]] = await pool.query('SELECT action_id FROM engine4_activity_actions WHERE action_id = ?', [actionId])
  if (!action) return res.status(404).json({ error: 'Post not found' })

  const [[existing]] = await pool.query(
    "SELECT like_id FROM engine4_activity_likes WHERE resource_id = ? AND poster_type = 'user' AND poster_id = ?",
    [actionId, uid],
  )
  if (existing) {
    await pool.query('DELETE FROM engine4_activity_likes WHERE like_id = ?', [existing.like_id])
    await pool.query('UPDATE engine4_activity_actions SET like_count = GREATEST(like_count - 1, 0) WHERE action_id = ?', [actionId])
  } else {
    await pool.query(
      "INSERT INTO engine4_activity_likes (resource_id, poster_type, poster_id) VALUES (?, 'user', ?)",
      [actionId, uid],
    )
    await pool.query('UPDATE engine4_activity_actions SET like_count = like_count + 1 WHERE action_id = ?', [actionId])
  }
  const [[row]] = await pool.query('SELECT like_count FROM engine4_activity_actions WHERE action_id = ?', [actionId])
  res.json({ liked: !existing, likes: row?.like_count ?? 0 })
}))

// GET /api/profiles/posts/:id/comments
profilesRouter.get('/posts/:id/comments', asyncHandler(async (req, res) => {
  const list = await rows('comments',
    `SELECT c.comment_id AS id, c.body, c.creation_date, ${authorSelect}
     FROM engine4_activity_comments c
     JOIN engine4_users u ON u.user_id = c.poster_id
     ${authorJoins}
     WHERE c.resource_id = ?
     ORDER BY c.creation_date ASC
     LIMIT 200`,
    [Number(req.params.id)],
  )
  res.json(list.map((c) => ({ id: c.id, body: c.body, date: fmtShort(c.creation_date), author: toAuthor(c) })))
}))

// POST /api/profiles/posts/:id/comments  { body }
profilesRouter.post('/posts/:id/comments', asyncHandler(async (req, res) => {
  const uid = Number(req.userId || 0)
  if (!uid) return res.status(401).json({ error: 'Sign in required' })
  const actionId = Number(req.params.id)
  const body = String(req.body?.body || '').trim()
  if (!body) return res.status(400).json({ error: 'Comment is required' })
  if (body.length > 2000) return res.status(400).json({ error: 'Comment is too long' })

  const [[action]] = await pool.query('SELECT action_id FROM engine4_activity_actions WHERE action_id = ?', [actionId])
  if (!action) return res.status(404).json({ error: 'Post not found' })

  const [r] = await pool.query(
    `INSERT INTO engine4_activity_comments (resource_id, poster_type, poster_id, body, creation_date, like_count)
     VALUES (?, 'user', ?, ?, NOW(), 0)`,
    [actionId, uid, body],
  )
  await pool.query('UPDATE engine4_activity_actions SET comment_count = comment_count + 1 WHERE action_id = ?', [actionId])
  const [[me]] = await pool.query(`SELECT ${authorSelect} FROM engine4_users u ${authorJoins} WHERE u.user_id = ?`, [uid])
  res.status(201).json({ id: r.insertId, body, date: fmtShort(new Date()), author: toAuthor(me) })
}))