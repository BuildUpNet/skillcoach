// Real "Import Your Contacts" for the Invite Friends page — Google + Facebook.
//
// The existing Google/Facebook login (routes/google.js, routes/facebook.js)
// only requests `profile`/`public_profile` scope, so the access token it
// stores in sc_user_social can't read contacts/friends. This is a separate
// OAuth round-trip that asks for the extra scope, fetches the contact list,
// matches emails against engine4_users, and hands the result back to the
// Invite Friends page.
//
// Facebook note: Meta's Graph API has not returned a user's full friend list
// since API v2.0 (2015) — /me/friends only returns friends who have ALSO
// logged into this exact app. That's a platform limit, not a bug here; the
// frontend copy says so.
import express from "express"
import crypto from "crypto"
import { pool } from "../db.js"
import { requireAuth } from "../auth.js"

export const contactsImportRouter = express.Router()

const FB_VERSION = "v21.0"
const isProd = process.env.NODE_ENV === "production"
const API_URL = process.env.API_URL || (isProd ? null : `http://localhost:${process.env.PORT || 4000}`)
const FRONTEND_URL = process.env.FRONTEND_URL || process.env.APP_URL || (isProd ? null : "http://localhost:5173")

const cookieOpts = {
  httpOnly: true,
  sameSite: isProd ? "none" : "lax",
  secure: isProd,
  maxAge: 10 * 60 * 1000,
  path: "/",
}

// short-lived, single-process store for a parsed contact list between the
// OAuth callback (server redirect) and the page fetching its result
const pendingResults = new Map() // importId -> { userId, contacts, expires }
const RESULT_TTL = 5 * 60 * 1000
setInterval(() => {
  const now = Date.now()
  for (const [id, entry] of pendingResults) if (entry.expires < now) pendingResults.delete(id)
}, 60_000).unref()

function failRedirect(res, groupId, msg) {
  if (!FRONTEND_URL) return res.status(500).json({ error: msg })
  const back = groupId ? `/groups/invite/${groupId}` : "/projects"
  res.redirect(`${FRONTEND_URL}${back}?importError=${encodeURIComponent(msg)}`)
}

async function matchExistingUsers(emails) {
  if (!emails.length) return new Map()
  const [rows] = await pool.query(
    "SELECT user_id, email, displayname FROM engine4_users WHERE email IN (?)",
    [emails],
  )
  return new Map(rows.map((r) => [r.email.toLowerCase(), r]))
}

async function storeContacts({ userId, groupId, rawContacts }) {
  const seen = new Set()
  const dedup = rawContacts.filter((c) => {
    if (!c.email) return false
    const key = c.email.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
  const matches = await matchExistingUsers(dedup.map((c) => c.email.toLowerCase()))
  const contacts = dedup.map((c) => {
    const m = matches.get(c.email.toLowerCase())
    return { name: c.name || c.email, email: c.email, userId: m?.user_id || null }
  })
  const importId = crypto.randomBytes(16).toString("hex")
  pendingResults.set(importId, { userId, contacts, expires: Date.now() + RESULT_TTL })
  return importId
}

/* ------------------------------------------------------------------ */
/*  Google — People API contacts.readonly                             */
/* ------------------------------------------------------------------ */
contactsImportRouter.get("/google/start", requireAuth, (req, res) => {
  const groupId = req.query.groupId
  if (!process.env.GOOGLE_CLIENT_ID) return failRedirect(res, groupId, "GOOGLE_CLIENT_ID missing in env")
  if (!API_URL) return failRedirect(res, groupId, "API_URL missing in env")

  const state = crypto.randomBytes(16).toString("hex")
  res.cookie("gc_state", state, cookieOpts)
  res.cookie("gc_group", String(groupId || ""), cookieOpts)
  res.cookie("gc_uid", String(req.userId), cookieOpts)

  const u = new URL("https://accounts.google.com/o/oauth2/v2/auth")
  u.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID)
  u.searchParams.set("redirect_uri", `${API_URL}/api/contacts/google/callback`)
  u.searchParams.set("response_type", "code")
  u.searchParams.set("scope", "openid email profile https://www.googleapis.com/auth/contacts.readonly")
  u.searchParams.set("state", state)
  u.searchParams.set("prompt", "consent")
  res.redirect(u.toString())
})

contactsImportRouter.get("/google/callback", async (req, res) => {
  const groupId = req.cookies?.gc_group
  try {
    const { code, state, error } = req.query
    if (error) return failRedirect(res, groupId, "Google sign-in cancelled")
    if (!code || !state || state !== req.cookies?.gc_state)
      return failRedirect(res, groupId, "Invalid state, please try again")
    res.clearCookie("gc_state", { path: "/" })

    const token = await (await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${API_URL}/api/contacts/google/callback`,
        grant_type: "authorization_code",
      }),
    })).json()
    if (!token.access_token) return failRedirect(res, groupId, token.error_description || "Token exchange failed")

    const people = await (await fetch(
      "https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses&pageSize=1000",
      { headers: { Authorization: `Bearer ${token.access_token}` } },
    )).json()
    if (people.error) return failRedirect(res, groupId, people.error.message || "Could not read Google contacts")

    const rawContacts = (people.connections || []).map((p) => ({
      name: p.names?.[0]?.displayName || "",
      email: p.emailAddresses?.[0]?.value || "",
    }))

    const importId = await storeContacts({ userId: Number(req.cookies?.gc_uid), groupId, rawContacts })
    res.redirect(`${FRONTEND_URL}/groups/invite/${groupId}?imported=google&importId=${importId}`)
  } catch (e) {
    console.error("google contacts import:", e)
    failRedirect(res, groupId, e.message || "Could not import Google contacts")
  }
})

/* ------------------------------------------------------------------ */
/*  Facebook — /me/friends (only returns friends who also use this app) */
/* ------------------------------------------------------------------ */
contactsImportRouter.get("/facebook/start", requireAuth, (req, res) => {
  const groupId = req.query.groupId
  if (!process.env.FACEBOOK_APP_ID) return failRedirect(res, groupId, "FACEBOOK_APP_ID missing in env")
  if (!API_URL) return failRedirect(res, groupId, "API_URL missing in env")

  const state = crypto.randomBytes(16).toString("hex")
  res.cookie("fc_state", state, cookieOpts)
  res.cookie("fc_group", String(groupId || ""), cookieOpts)
  res.cookie("fc_uid", String(req.userId), cookieOpts)

  const u = new URL(`https://www.facebook.com/${FB_VERSION}/dialog/oauth`)
  u.searchParams.set("client_id", process.env.FACEBOOK_APP_ID)
  u.searchParams.set("redirect_uri", `${API_URL}/api/contacts/facebook/callback`)
  u.searchParams.set("response_type", "code")
  u.searchParams.set("scope", "email,public_profile,user_friends")
  u.searchParams.set("state", state)
  res.redirect(u.toString())
})

contactsImportRouter.get("/facebook/callback", async (req, res) => {
  const groupId = req.cookies?.fc_group
  try {
    const { code, state, error, error_description } = req.query
    if (error) return failRedirect(res, groupId, error_description || "Facebook sign-in cancelled")
    if (!code || !state || state !== req.cookies?.fc_state)
      return failRedirect(res, groupId, "Invalid state, please try again")
    res.clearCookie("fc_state", { path: "/" })

    const tokenUrl = new URL(`https://graph.facebook.com/${FB_VERSION}/oauth/access_token`)
    tokenUrl.searchParams.set("client_id", process.env.FACEBOOK_APP_ID)
    tokenUrl.searchParams.set("client_secret", process.env.FACEBOOK_APP_SECRET)
    tokenUrl.searchParams.set("redirect_uri", `${API_URL}/api/contacts/facebook/callback`)
    tokenUrl.searchParams.set("code", code)

    const token = await (await fetch(tokenUrl)).json()
    if (!token.access_token) return failRedirect(res, groupId, token.error?.message || "Token exchange failed")

    const proof = crypto
      .createHmac("sha256", process.env.FACEBOOK_APP_SECRET)
      .update(token.access_token)
      .digest("hex")

    const friendsUrl = new URL(`https://graph.facebook.com/${FB_VERSION}/me/friends`)
    friendsUrl.searchParams.set("fields", "id,name,email")
    friendsUrl.searchParams.set("access_token", token.access_token)
    friendsUrl.searchParams.set("appsecret_proof", proof)

    const friends = await (await fetch(friendsUrl)).json()
    if (friends.error) return failRedirect(res, groupId, friends.error.message || "Could not read Facebook friends")

    const rawContacts = (friends.data || []).map((f) => ({ name: f.name || "", email: f.email || "" }))

    const importId = await storeContacts({ userId: Number(req.cookies?.fc_uid), groupId, rawContacts })
    res.redirect(`${FRONTEND_URL}/groups/invite/${groupId}?imported=facebook&importId=${importId}`)
  } catch (e) {
    console.error("facebook contacts import:", e)
    failRedirect(res, groupId, e.message || "Could not import Facebook friends")
  }
})

/* ------------------------------------------------------------------ */
/*  Result fetch — one-time, scoped to the user who started the import */
/* ------------------------------------------------------------------ */
contactsImportRouter.get("/result/:importId", requireAuth, (req, res) => {
  const entry = pendingResults.get(req.params.importId)
  if (!entry || entry.userId !== Number(req.userId)) {
    return res.status(404).json({ error: "Import result not found or expired" })
  }
  pendingResults.delete(req.params.importId)
  res.json({ contacts: entry.contacts })
})
