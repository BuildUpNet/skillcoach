import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { pool } from '../db.js'
import { award } from '../lib/credits.js';
import {
  generateUserSalt,
  hashPassword,
  verifyPassword,
  signSession,
  setSessionCookie,
  clearSessionCookie,
  requireAuth,
  publicUser,
  getDefaultLevelId,
  verifySessionToken,
  IMPERSONATE_COOKIE,
  clearImpersonateCookie,
} from '../auth.js'

export const authRouter = Router()

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const USERNAME_RE = /^[a-zA-Z0-9_-]{3,30}$/

async function logAttempt(pool, { user_id = null, email, ip, state }) {
  await pool.query(
    `INSERT INTO engine4_user_logins (user_id, email, ip, timestamp, state, active)
     VALUES (?, ?, INET6_ATON(?), NOW(), ?, 0)`,
    [user_id, email, ip, state],
  )
}

// Generic, slightly generous limiter for signup (abuse prevention, not the main defense)
const registerLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 20 })
// Tighter limiter for login — the key defense against password brute-forcing
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 })

authRouter.post('/register', registerLimiter, async (req, res) => {
  const { email, username, displayname, password } = req.body || {}

  if (!email || !EMAIL_RE.test(email)) return res.status(400).json({ error: 'A valid email is required' })
  if (!username || !USERNAME_RE.test(username)) {
    return res.status(400).json({ error: 'Username must be 3-30 characters (letters, numbers, hyphen, underscore only)' })
  }
  if (!displayname?.trim()) return res.status(400).json({ error: 'Display name is required' })
  if (!password || password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' })

  const [existing] = await pool.query(
    'SELECT user_id FROM engine4_users WHERE email = ? OR username = ? LIMIT 1',
    [email, username],
  )
  if (existing.length) return res.status(409).json({ error: 'An account with that email or username already exists' })

  const salt = generateUserSalt()
  const hashed = await hashPassword(password, salt)
  const levelId = await getDefaultLevelId()

  const [result] = await pool.query(
    `INSERT INTO engine4_users
       (email, username, displayname, password, salt, level_id,
        verified, enabled, approved, creation_date, creation_ip, modified_date)
     VALUES (?, ?, ?, ?, ?, ?, 1, 1, 1, NOW(), INET6_ATON(?), NOW())`,
    [email, username, displayname.trim(), hashed, salt, levelId, req.ip],
  )

  const [rows] = await pool.query('SELECT * FROM engine4_users WHERE user_id = ?', [result.insertId])
  const user = rows[0]

  try {
    await award(user.user_id, 'signup')
  } catch (err) {
    console.error('signup award failed:', err.message)
  }
  const token = signSession(user)
  setSessionCookie(res, token)
  res.status(201).json({ user: await publicUser(user) })
})

// authRouter.post('/login', loginLimiter, async (req, res) => {
//   const { email, password } = req.body || {}
//   if (!email || !password) return res.status(400).json({ error: 'Email and password are required' })

//   const [rows] = await pool.query('SELECT * FROM engine4_users WHERE email = ? LIMIT 1', [email])
//   const user = rows[0]

//   // Same generic message either way — never reveal whether the email exists.
//   const invalidCreds = () => res.status(401).json({ error: 'Invalid email or password' })

//   if (!user) {
//     await logAttempt(pool, { email, ip: req.ip, state: 'no-member' })
//     return invalidCreds()
//   }

//   const ok = await verifyPassword(password, user.salt, user.password)
//   if (!ok) {
//     await logAttempt(pool, { user_id: user.user_id, email, ip: req.ip, state: 'bad-password' })
//     return invalidCreds()
//   }

//   if (!user.enabled || !user.verified || !user.approved) {
//     await logAttempt(pool, { user_id: user.user_id, email, ip: req.ip, state: 'disabled' })
//     return res.status(403).json({ error: 'This account is disabled or not yet approved' })
//   }

//   await pool.query(
//     `UPDATE engine4_users SET lastlogin_date = NOW(), lastlogin_ip = INET6_ATON(?) WHERE user_id = ?`,
//     [req.ip, user.user_id],
//   )
//   await logAttempt(pool, { user_id: user.user_id, email, ip: req.ip, state: 'success' })

//   const token = signSession(user)
//   setSessionCookie(res, token)
//   res.json({ user: publicUser(user) })
// })


authRouter.post('/login', loginLimiter, async (req, res) => {
  console.log('LOGIN START')

  const { email, password } = req.body || {}
  if (!email || !password) {
    console.log('LOGIN: missing credentials')
    return res.status(400).json({ error: 'Email and password are required' })
  }

  console.log('LOGIN: before SELECT')

  const [rows] = await pool.query(
    'SELECT * FROM engine4_users WHERE email = ? LIMIT 1',
    [email],
  )

  console.log('LOGIN: after SELECT')

  const user = rows[0]

  if (!user) {
    console.log('LOGIN: user not found')
    await logAttempt(pool, { email, ip: req.ip, state: 'no-member' })
    return res.status(401).json({ error: 'Invalid email or password' })
  }

  console.log('LOGIN: before verifyPassword')

  const ok = await verifyPassword(password, user.salt, user.password)

    console.log('LOGIN: after verifyPassword', ok)

  if (!ok) {
    await logAttempt(pool, {
      user_id: user.user_id,
      email: user.email,
      ip: req.ip,
      state: 'bad-password',
    })

    console.log('LOGIN: bad password')

    return res.status(401).json({
      error: 'Invalid email or password',
    })
  }

  if (!user.enabled || !user.verified || !user.approved) {
    console.log('LOGIN: account disabled/unapproved')

    await logAttempt(pool, {
      user_id: user.user_id,
      email: user.email,
      ip: req.ip,
      state: 'disabled',
    })

    return res.status(403).json({
      error: 'This account is disabled or not yet approved',
    })
  }

  console.log('LOGIN: before lastlogin UPDATE')

  await pool.query(
    `UPDATE engine4_users
     SET lastlogin_date = NOW(), lastlogin_ip = INET6_ATON(?)
     WHERE user_id = ?`,
    [req.ip, user.user_id],
  )

  console.log('LOGIN: after lastlogin UPDATE')

  await logAttempt(pool, {
    user_id: user.user_id,
    email: user.email,
    ip: req.ip,
    state: 'success',
  })

  console.log('LOGIN: attempt logged')

  const token = signSession(user)

  console.log('LOGIN: JWT created')

  setSessionCookie(res, token)

  console.log('LOGIN: sending response')
  try {
    await award(user.user_id, 'user_login')
  } catch (err) {
    console.error('login award failed:', err.message)
  }
  return res.json({
    user: await publicUser(user),
  })
})

authRouter.post('/logout', (req, res) => {
  clearSessionCookie(res)
  clearImpersonateCookie(res)
  res.status(204).end()
})

authRouter.get('/me', requireAuth, async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM engine4_users WHERE user_id = ?', [req.userId])
  if (!rows.length) return res.status(401).json({ error: 'Account no longer exists' })
  res.json({
    user: await publicUser(rows[0]),
    impersonating: !!req.cookies?.[IMPERSONATE_COOKIE],
  })
})

// Restores the admin's own session after a "login as user" — works even
// though the caller is currently signed in as someone else (only requires
// the impersonate cookie an admin action itself set, not another admin check).
authRouter.post('/stop-impersonating', requireAuth, async (req, res) => {
  const stashedToken = req.cookies?.[IMPERSONATE_COOKIE]
  if (!stashedToken) return res.status(400).json({ error: 'Not currently impersonating anyone' })

  let payload
  try {
    payload = verifySessionToken(stashedToken)
  } catch {
    clearImpersonateCookie(res)
    return res.status(401).json({ error: 'Your original session expired — please sign in again' })
  }

  const [rows] = await pool.query('SELECT * FROM engine4_users WHERE user_id = ?', [payload.sub])
  if (!rows.length) {
    clearImpersonateCookie(res)
    return res.status(404).json({ error: 'Your original account no longer exists' })
  }

  clearImpersonateCookie(res)
  setSessionCookie(res, stashedToken)
  res.json({ user: await publicUser(rows[0]) })
})

authRouter.put('/me/password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {}
  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters' })
  }

  const [rows] = await pool.query('SELECT * FROM engine4_users WHERE user_id = ?', [req.userId])
  const user = rows[0]
  if (!user) return res.status(401).json({ error: 'Account no longer exists' })

  const ok = await verifyPassword(currentPassword || '', user.salt, user.password)
  if (!ok) return res.status(401).json({ error: 'Current password is incorrect' })

  const salt = generateUserSalt()
  const hashed = await hashPassword(newPassword, salt)
  await pool.query(
    'UPDATE engine4_users SET password = ?, salt = ?, modified_date = NOW() WHERE user_id = ?',
    [hashed, salt, user.user_id],
  )
  res.status(204).end()
})
