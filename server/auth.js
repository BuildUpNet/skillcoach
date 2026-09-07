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
    sameSite: 'lax',
    secure: process.env.COOKIE_SECURE === 'true',
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

// Only ever return these — never password/salt.
export function publicUser(u) {
  return {
    user_id: u.user_id,
    email: u.email,
    username: u.username,
    displayname: u.displayname,
    enabled: !!u.enabled,
    verified: !!u.verified,
    approved: !!u.approved,
  }
}
