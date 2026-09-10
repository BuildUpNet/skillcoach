import { Router } from 'express'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { pool } from '../db.js'
import { asyncHandler } from '../lib/groupUtils.js'

export const profileEditRouter = Router()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const AVATAR_DIR = path.join(__dirname, '..', 'uploads', 'avatars')
const API_URL = process.env.API_URL || 'http://localhost:4000'

// Our own settings table — keeps SocialEngine's schema untouched
await pool.query(`
  CREATE TABLE IF NOT EXISTS sc_user_settings (
    user_id            INT UNSIGNED NOT NULL PRIMARY KEY,
    about              TEXT NULL,
    show_intro         TINYINT(1) NOT NULL DEFAULT 0,
    avatar_url         VARCHAR(500) NULL,
    timeline_replace   TINYINT(1) NOT NULL DEFAULT 1,
    custom_css         TEXT NULL,
    interests          JSON NULL,
    interests_privacy  VARCHAR(40) NOT NULL DEFAULT 'everyone',
    personal           JSON NULL,
    updated_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )
`).catch((e) => console.error('[profileEdit] create table failed:', e.message))
// column added after the table first shipped — add it if missing
await pool.query('ALTER TABLE sc_user_settings ADD COLUMN personal JSON NULL').catch(() => {})

const requireUser = (req, res) => {
  const uid = Number(req.userId || 0)
  if (!uid) res.status(401).json({ error: 'Sign in required' })
  return uid
}

const getSettings = async (uid) => {
  const [[row]] = await pool.query('SELECT * FROM sc_user_settings WHERE user_id = ?', [uid])
  return {
    about: row?.about || '',
    show_intro: !!row?.show_intro,
    avatar_url: row?.avatar_url || null,
    timeline_replace: row ? !!row.timeline_replace : true,
    custom_css: row?.custom_css || '',
    interests: row?.interests ? (typeof row.interests === 'string' ? JSON.parse(row.interests) : row.interests) : {},
    interests_privacy: row?.interests_privacy || 'everyone',
    personal: row?.personal ? (typeof row.personal === 'string' ? JSON.parse(row.personal) : row.personal) : {},
  }
}

const upsert = async (uid, patch) => {
  const cols = Object.keys(patch)
  if (!cols.length) return
  const sql = `INSERT INTO sc_user_settings (user_id, ${cols.join(', ')})
               VALUES (?, ${cols.map(() => '?').join(', ')})
               ON DUPLICATE KEY UPDATE ${cols.map((c) => `${c} = VALUES(${c})`).join(', ')}`
  await pool.query(sql, [uid, ...cols.map((c) => patch[c])])
}

/* ---------- SocialEngine tables: introduction, style, interests ---------- */

// engine4_inviter_introductions (introduction_id, user_id, body, publish, creation_date, ...)
async function readIntro(uid) {
  const [[row]] = await pool.query('SELECT body, publish FROM engine4_inviter_introductions WHERE user_id = ? LIMIT 1', [uid])
  return { about: row?.body || '', show_intro: !!Number(row?.publish ?? 0) }
}
async function writeIntro(uid, about, show) {
  await pool.query(
    `INSERT INTO engine4_inviter_introductions (user_id, body, publish, creation_date)
     VALUES (?, ?, ?, NOW())
     ON DUPLICATE KEY UPDATE body = VALUES(body), publish = VALUES(publish)`,
    [uid, about, show ? 1 : 0],
  )
}

// engine4_core_styles (type, id, style) — type 'user'
async function readStyle(uid) {
  const [[row]] = await pool.query("SELECT style FROM engine4_core_styles WHERE type = 'user' AND id = ? LIMIT 1", [uid])
  return row?.style || ''
}
async function writeStyle(uid, css) {
  if (!css.trim()) return pool.query("DELETE FROM engine4_core_styles WHERE type = 'user' AND id = ?", [uid])
  return pool.query(
    "INSERT INTO engine4_core_styles (type, id, style) VALUES ('user', ?, ?) ON DUPLICATE KEY UPDATE style = VALUES(style)",
    [uid, css],
  )
}

// engine4_like_likes (like_id, resource_type, resource_title, poster_type, poster_id)
// resource_type = category (page, event, classified, group, music, blog, video, album, poll)
const INTEREST_TYPES = { pages: 'page', events: 'event', classifieds: 'classified', groups: 'group', music: 'music', blogs: 'blog', videos: 'video', albums: 'album', polls: 'poll' }
const TYPE_TO_KEY = Object.fromEntries(Object.entries(INTEREST_TYPES).map(([k, v]) => [v, k]))

async function readInterests(uid) {
  const [rows] = await pool.query(
    "SELECT resource_type, resource_title FROM engine4_like_likes WHERE poster_type = 'user' AND poster_id = ? ORDER BY like_id",
    [uid],
  )
  const out = {}
  for (const r of rows) {
    const key = TYPE_TO_KEY[r.resource_type] || r.resource_type
    ;(out[key] ||= []).push(r.resource_title)
  }
  return out
}
async function writeInterests(uid, interests) {
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()
    await conn.query("DELETE FROM engine4_like_likes WHERE poster_type = 'user' AND poster_id = ?", [uid])
    for (const [key, list] of Object.entries(interests || {})) {
      const type = INTEREST_TYPES[key] || key
      for (const title of [...new Set((list || []).map((t) => String(t).trim()).filter(Boolean))]) {
        await conn.query(
          "INSERT INTO engine4_like_likes (resource_type, resource_title, poster_type, poster_id) VALUES (?, ?, 'user', ?)",
          [type.slice(0, 32), title.slice(0, 128), uid],
        )
      }
    }
    await conn.commit()
  } catch (e) {
    await conn.rollback(); throw e
  } finally {
    conn.release()
  }
}

/* ---------- SocialEngine profile fields (dynamic) ---------- */

const TEXT_TYPES = new Set(['text', 'first_name', 'last_name', 'website', 'twitter', 'facebook', 'aim', 'url', 'email'])
const SELECT_TYPES = new Set(['select', 'radio', 'gender', 'profile_type'])
const MULTI_TYPES = new Set(['multi_checkbox', 'multiselect'])

async function children(fieldId, optionId) {
  const [rows] = await pool.query(
    `SELECT m.child_id AS field_id, f.type, f.label, f.description, f.required
     FROM engine4_user_fields_maps m
     JOIN engine4_user_fields_meta f ON f.field_id = m.child_id
     WHERE m.field_id = ? AND m.option_id = ?
     ORDER BY m.\`order\``,
    [fieldId, optionId],
  )
  return rows
}

async function optionsFor(fieldId) {
  const [rows] = await pool.query(
    'SELECT option_id AS value, label FROM engine4_user_fields_options WHERE field_id = ? ORDER BY `order`',
    [fieldId],
  )
  return rows
}

// Default SocialEngine profile form (same as the old site's Personal Info tab)
export const DEFAULT_FIELDS = [
  { id: 'h_personal', type: 'heading', label: 'Personal information' },
  { id: 'first_name', type: 'first_name', label: 'First name' },
  { id: 'last_name', type: 'last_name', label: 'Last name' },
  { id: 'gender', type: 'gender', label: 'Gender', options: [{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }] },
  { id: 'birthdate', type: 'birthdate', label: 'Birthday' },
  { id: 'h_contact', type: 'heading', label: 'Contact information' },
  { id: 'website', type: 'website', label: 'Website' },
  { id: 'twitter', type: 'twitter', label: 'Twitter' },
  { id: 'facebook', type: 'facebook', label: 'Facebook' },
  { id: 'aim', type: 'aim', label: 'AIM' },
  { id: 'h_details', type: 'heading', label: 'Personal details' },
  { id: 'about_me', type: 'textarea', label: 'About me' },
]
const DEFAULT_TYPE_ORDER = ['first_name', 'last_name', 'gender', 'birthdate', 'website', 'twitter', 'facebook', 'aim', 'textarea']

async function userValues(uid) {
  const [valueRows] = await pool.query(
    'SELECT field_id, `index`, value FROM engine4_user_fields_values WHERE item_id = ? ORDER BY `index`',
    [uid],
  )
  const values = {}
  for (const v of valueRows) {
    if (values[v.field_id] === undefined) values[v.field_id] = v.value
    else values[v.field_id] = [].concat(values[v.field_id], v.value)
  }
  return values
}

// Level 1: SocialEngine field tree (maps → meta), as configured by the admin
async function fieldsFromMaps(uid, values) {
  const out = []
  const walk = async (fieldId, optionId, depth = 0) => {
    if (depth > 4) return
    for (const f of await children(fieldId, optionId)) {
      const field = { id: f.field_id, type: f.type, label: f.label, description: f.description || '', required: !!f.required }
      if (SELECT_TYPES.has(f.type) || MULTI_TYPES.has(f.type) || f.type === 'checkbox') field.options = await optionsFor(f.field_id)
      if (f.type !== 'heading') {
        field.value = values[f.field_id] ?? (MULTI_TYPES.has(f.type) ? [] : '')
        if (f.type === 'profile_type' && !field.value && field.options?.length) field.value = String(field.options[0].value)
      }
      out.push(field)
      if (f.type === 'heading') await walk(f.field_id, 0, depth + 1)
      if (f.type === 'profile_type' && field.value) await walk(f.field_id, Number(field.value), depth + 1)
    }
  }
  await walk(0, 0)
  return out.some((f) => f.type !== 'heading' && f.type !== 'profile_type') ? out : []
}

// Level 2: meta table only (no maps) — pick the standard fields by type
async function fieldsFromMeta(uid, values) {
  const [meta] = await pool.query(
    'SELECT field_id, type, label FROM engine4_user_fields_meta WHERE type IN (?) ORDER BY field_id',
    [DEFAULT_TYPE_ORDER],
  )
  if (!meta.length) return []
  const byType = new Map()
  for (const m of meta) if (!byType.has(m.type)) byType.set(m.type, m)
  const out = []
  for (const d of DEFAULT_FIELDS) {
    if (d.type === 'heading') { out.push({ ...d }); continue }
    const m = byType.get(d.type)
    if (!m) continue
    const field = { id: m.field_id, type: m.type, label: m.label || d.label, description: '', required: false, value: values[m.field_id] ?? '' }
    if (SELECT_TYPES.has(m.type)) {
      const opts = await optionsFor(m.field_id)
      field.options = opts.length ? opts : d.options
    }
    out.push(field)
  }
  // drop headings with no fields under them
  return out.filter((f, i) => f.type !== 'heading' || (out[i + 1] && out[i + 1].type !== 'heading'))
}

// Level 3: fixed default form stored in sc_user_settings.personal
async function fieldsFromDefaults(uid) {
  const { personal } = await getSettings(uid)
  return DEFAULT_FIELDS.map((d) => (d.type === 'heading' ? { ...d } : { ...d, description: '', required: false, value: personal?.[d.id] ?? '' }))
}

// Returns the flat, ordered field list for this user (headings included), with current values
export async function loadFields(uid) {
  let values = {}
  try { values = await userValues(uid) } catch { /* table missing → defaults */ }
  try { const f = await fieldsFromMaps(uid, values); if (f.length) return f } catch (e) { console.error('[profileEdit] maps:', e.message) }
  try { const f = await fieldsFromMeta(uid, values); if (f.length) return f } catch (e) { console.error('[profileEdit] meta:', e.message) }
  return fieldsFromDefaults(uid)
}

/* ---------- routes (mounted at /api/me/profile) ---------- */

// GET /api/me/profile  → everything the edit page needs
profileEditRouter.get('/', asyncHandler(async (req, res) => {
  const uid = requireUser(req, res); if (!uid) return
  const [[u]] = await pool.query('SELECT user_id, username, displayname, email FROM engine4_users WHERE user_id = ?', [uid])
  const settings = await getSettings(uid)
  const [intro, css, interests] = await Promise.all([
    readIntro(uid).catch((e) => (console.error('[profileEdit] read intro:', e.message), null)),
    readStyle(uid).catch((e) => (console.error('[profileEdit] read style:', e.message), null)),
    readInterests(uid).catch((e) => (console.error('[profileEdit] read interests:', e.message), null)),
  ])
  if (intro) Object.assign(settings, intro)
  if (css !== null) settings.custom_css = css
  if (interests) settings.interests = interests
  let fields = []
  try { fields = await loadFields(uid) } catch (e) { console.error('[profileEdit] fields failed:', e.message) }
  res.json({ user: u, settings, fields })
}))

// PUT /api/me/profile/introduction  { about, show_intro }
profileEditRouter.put('/introduction', asyncHandler(async (req, res) => {
  const uid = requireUser(req, res); if (!uid) return
  const about = String(req.body?.about ?? '').slice(0, 2000)
  const show = !!req.body?.show_intro
  await writeIntro(uid, about, show)
  await upsert(uid, { about, show_intro: show ? 1 : 0 }) // mirror so the profile page can read it cheaply
  res.json({ ok: true })
}))

// PUT /api/me/profile/fields  { values: { [field_id]: value | value[] } }
profileEditRouter.put('/fields', asyncHandler(async (req, res) => {
  const uid = requireUser(req, res); if (!uid) return
  const values = req.body?.values || {}
  const fields = await loadFields(uid)
  const allowed = new Map(fields.filter((f) => f.type !== 'heading').map((f) => [String(f.id), f]))

  const isDefaultForm = fields.some((f) => f.type !== 'heading' && !/^\d+$/.test(String(f.id)))
  let first = null, last = null

  if (isDefaultForm) {
    // no SocialEngine field tables → keep everything in sc_user_settings.personal
    const personal = {}
    for (const [id, raw] of Object.entries(values)) {
      const f = allowed.get(String(id)); if (!f) continue
      personal[id] = Array.isArray(raw) ? raw : String(raw ?? '').slice(0, 4000)
      if (f.type === 'first_name') first = String(raw || '').trim()
      if (f.type === 'last_name') last = String(raw || '').trim()
    }
    await upsert(uid, { personal: JSON.stringify(personal) })
  } else {
    const conn = await pool.getConnection()
    try {
      await conn.beginTransaction()
      for (const [id, raw] of Object.entries(values)) {
        const f = allowed.get(String(id)); if (!f) continue
        await conn.query('DELETE FROM engine4_user_fields_values WHERE item_id = ? AND field_id = ?', [uid, id])
        const list = Array.isArray(raw) ? raw : [raw]
        let i = 0
        for (const v of list) {
          if (v === '' || v === null || v === undefined) continue
          await conn.query(
            'INSERT INTO engine4_user_fields_values (item_id, field_id, `index`, value) VALUES (?, ?, ?, ?)',
            [uid, id, i++, String(v).slice(0, 4000)],
          )
        }
        if (f.type === 'first_name') first = String(raw || '').trim()
        if (f.type === 'last_name') last = String(raw || '').trim()
      }
      await conn.commit()
    } catch (e) {
      await conn.rollback(); throw e
    } finally {
      conn.release()
    }
  }

  // keep displayname in sync like SocialEngine does
  const dn = [first, last].filter(Boolean).join(' ')
  if (dn) await pool.query('UPDATE engine4_users SET displayname = ? WHERE user_id = ?', [dn, uid])

  res.json({ ok: true, fields: await loadFields(uid) })
}))

// PUT /api/me/profile/photo  { dataUrl }
profileEditRouter.put('/photo', asyncHandler(async (req, res) => {
  const uid = requireUser(req, res); if (!uid) return
  const m = /^data:image\/(png|jpe?g|webp|gif);base64,(.+)$/i.exec(req.body?.dataUrl || '')
  if (!m) return res.status(400).json({ error: 'Choose a PNG, JPG, WEBP or GIF image' })
  const buf = Buffer.from(m[2], 'base64')
  if (buf.length > 5 * 1024 * 1024) return res.status(400).json({ error: 'Image must be under 5 MB' })
  await fs.mkdir(AVATAR_DIR, { recursive: true })
  const ext = m[1].toLowerCase() === 'jpeg' ? 'jpg' : m[1].toLowerCase()
  const name = `${uid}-${Date.now()}.${ext}`
  await fs.writeFile(path.join(AVATAR_DIR, name), buf)
  const avatar_url = `${API_URL}/uploads/avatars/${name}`
  await upsert(uid, { avatar_url })
  res.json({ avatar_url })
}))

// DELETE /api/me/profile/photo
profileEditRouter.delete('/photo', asyncHandler(async (req, res) => {
  const uid = requireUser(req, res); if (!uid) return
  await upsert(uid, { avatar_url: null })
  res.status(204).end()
}))

// PUT /api/me/profile/settings  { timeline_replace?, custom_css?, interests?, interests_privacy? }
profileEditRouter.put('/settings', asyncHandler(async (req, res) => {
  const uid = requireUser(req, res); if (!uid) return
  const b = req.body || {}
  const patch = {}
  if ('timeline_replace' in b) patch.timeline_replace = b.timeline_replace ? 1 : 0
  if ('custom_css' in b) {
    patch.custom_css = String(b.custom_css).slice(0, 20000)
    await writeStyle(uid, patch.custom_css)
  }
  if ('interests' in b) {
    await writeInterests(uid, b.interests)
    patch.interests = JSON.stringify(b.interests || {})
  }
  if ('interests_privacy' in b) patch.interests_privacy = String(b.interests_privacy).slice(0, 40)
  await upsert(uid, patch)
  const settings = await getSettings(uid)
  settings.custom_css = await readStyle(uid)
  settings.interests = await readInterests(uid)
  res.json(settings)
}))