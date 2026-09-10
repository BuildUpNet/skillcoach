import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import 'dotenv/config'
import { pool } from './db.js'

// --- Legacy-compatible password hashing ------------------------------------
// Matches the live PHP app exactly (User_Model_User::_insert /
// User_Api_Core::getAuthAdapter): password = MD5(staticSalt + plain + userSalt).
// This is intentionally NOT upgraded to bcrypt/argon2 — the `password` column
// is a fixed CHAR(32) (MD5-hash-sized) and this backend must be able to point
// at the live production DB unmodified, so it has to speak the same format
// the existing PHP app and its existing users already use.

let cachedStaticSalt = null

// engine4_core_settings.value stores PHP-serialized scalars, e.g. s:10:"abc123xyz9";
function unserializePhpString(raw) {
  const match = /^s:\d+:"([\s\S]*)";$/.exec(raw.trim())
  return match ? match[1] : raw
}

export async function getStaticSalt() {
  if (cachedStaticSalt !== null) return cachedStaticSalt
  const [rows] = await pool.query(
    "SELECT value FROM engine4_core_settings WHERE name = 'core.secret' LIMIT 1",
  )
  cachedStaticSalt = rows.length ? unserializePhpString(rows[0].value) : 'staticSalt'
  return cachedStaticSalt
}

export function generateUserSalt() {
  // Matches legacy: (string) rand(1000000, 9999999)
  return String(crypto.randomInt(1000000, 10000000))
}

export async function hashPassword(plainPassword, userSalt) {
  const staticSalt = await getStaticSalt()
  return crypto.createHash('md5').update(staticSalt + plainPassword + userSalt).digest('hex')
}

export async function verifyPassword(plainPassword, userSalt, storedHash) {
  const computed = await hashPassword(plainPassword, userSalt)
  const a = Buffer.from(computed, 'hex')
  const b = Buffer.from(storedHash, 'hex')
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b) // constant-time compare, avoids timing attacks
}

// --- Session (JWT in an httpOnly cookie) ------------------------------------

export const AUTH_COOKIE = 'sc_session'

export function signSession(user) {
  return jwt.sign({ sub: user.user_id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  })
}

export function setSessionCookie(res, token) {
  res.cookie(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: 'none',
    secure: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  })
}

export function clearSessionCookie(res) {
  res.clearCookie(AUTH_COOKIE)
}

export function requireAuth(req, res, next) {
  const token = req.cookies?.[AUTH_COOKIE]
  if (!token) return res.status(401).json({ error: 'Not signed in' })
  try {
    req.userId = jwt.verify(token, process.env.JWT_SECRET).sub
    next()
  } catch {
    res.status(401).json({ error: 'Session expired, please sign in again' })
  }
}

export function verifySessionToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET)
}

// --- "Login as user" (impersonation) ---------------------------------------
// While impersonating, the primary session cookie is swapped to the target
// user's token and the admin's own (still-valid) token is stashed in a
// second httpOnly cookie so /api/auth/stop-impersonating can restore it.

export const IMPERSONATE_COOKIE = 'sc_impersonate'

export function setImpersonateCookie(res, token) {
  res.cookie(IMPERSONATE_COOKIE, token, {
    httpOnly: true,
    sameSite: 'none',
    secure: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  })
}

export function clearImpersonateCookie(res) {
  res.clearCookie(IMPERSONATE_COOKIE)
}

// The level a brand-new registrant gets, read live from
// engine4_authorization_levels (flag='default') so it always matches
// whatever the connected DB actually considers "default" — falls back to
// DEFAULT_LEVEL_ID only if no row is flagged yet.
export async function getDefaultLevelId() {
  const [rows] = await pool.query(
    "SELECT level_id FROM engine4_authorization_levels WHERE flag = 'default' LIMIT 1",
  )
  if (rows.length) return rows[0].level_id
  return process.env.DEFAULT_LEVEL_ID || null
}

// Must run after requireAuth. Admin = the level flagged 'superadmin' in
// engine4_authorization_levels (matches the legacy app's own notion of
// "admin" — never a hardcoded level_id, since that value can differ between
// environments).
export async function requireAdmin(req, res, next) {
  const [rows] = await pool.query(
    `SELECT al.flag FROM engine4_users u
     JOIN engine4_authorization_levels al ON al.level_id = u.level_id
     WHERE u.user_id = ?`,
    [req.userId],
  )
  if (!rows.length || rows[0].flag !== 'superadmin') {
    return res.status(403).json({ error: 'Admin access required' })
  }
  next()
}

// Only ever return these — never password/salt. Async because it looks up
// the user's role title/flag so the frontend can gate admin UI off
// `user.role.isAdmin` instead of hardcoding a level_id.
export async function publicUser(u) {
  const [levelRows] = await pool.query(
    'SELECT title, flag FROM engine4_authorization_levels WHERE level_id = ?',
    [u.level_id],
  )
  const level = levelRows[0]
  return {
    user_id: u.user_id,
    email: u.email,
    username: u.username,
    displayname: u.displayname,
    level_id: u.level_id,
    role: level ? { title: level.title, isAdmin: level.flag === 'superadmin' } : null,
    enabled: !!u.enabled,
    verified: !!u.verified,
    approved: !!u.approved,
  }
}
