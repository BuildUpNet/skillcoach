import express from "express";
import crypto from "crypto";
import { pool } from "../db.js";
import {
  hashPassword, generateUserSalt, signSession, setSessionCookie, publicUser,
} from "../auth.js";
import { sendForgotPasswordMail } from "../lib/mailer.js";

export const passwordResetRouter = express.Router();

const APP = () => process.env.APP_URL || process.env.FRONTEND_URL || "http://localhost:5173";
const CODE_TTL_HOURS = 24;
const RESEND_COOLDOWN_SECONDS = 60;

// Code + uid dono match hone chahiye, aur code expire na hua ho.
async function findValidCode(code, uid) {
  if (!code || !uid) return null;
  const [[row]] = await pool.query(
    `SELECT u.user_id, u.email, u.displayname, f.code
       FROM engine4_user_forgot f
       JOIN engine4_users u ON u.user_id = f.user_id
      WHERE f.user_id = ?
        AND f.creation_date > DATE_SUB(NOW(), INTERVAL ? HOUR)
        AND u.enabled = 1
      LIMIT 1`,
    [uid, CODE_TTL_HOURS],
  );
  if (!row) return null;

  const a = Buffer.from(String(code));
  const b = Buffer.from(String(row.code));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return row;
}

function maskEmail(email) {
  const [name, domain] = String(email).split("@");
  if (!domain) return "";
  const head = name.slice(0, 2);
  return `${head}${"•".repeat(Math.max(name.length - 2, 2))}@${domain}`;
}

// POST /api/auth/forgot  { email }
passwordResetRouter.post("/forgot", async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();

  // Jawab hamesha same — warna koi bhi guess karke pata kar lega
  // ki kaunsa email registered hai.
  const ok = {
    ok: true,
    message: "If that email is registered, a reset link is on its way.",
  };

  try {
    if (!email) return res.status(400).json({ error: "Email address is required" });

    const [[user]] = await pool.query(
      "SELECT user_id, email, displayname FROM engine4_users WHERE email = ? AND enabled = 1 LIMIT 1",
      [email],
    );
    if (!user) return res.json(ok);

    // throttle — 60s ke andar dobara mail nahi
    const [[existing]] = await pool.query(
      `SELECT TIMESTAMPDIFF(SECOND, creation_date, NOW()) AS age
         FROM engine4_user_forgot WHERE user_id = ?`,
      [user.user_id],
    );
    if (existing && existing.age < RESEND_COOLDOWN_SECONDS) return res.json(ok);

    const code = crypto.randomBytes(24).toString("hex"); // 48 chars, varchar(64) mein fit
    await pool.query(
      `INSERT INTO engine4_user_forgot (user_id, code, creation_date)
       VALUES (?, ?, NOW())
       ON DUPLICATE KEY UPDATE code = VALUES(code), creation_date = NOW()`,
      [user.user_id, code],
    );

    await sendForgotPasswordMail({
      to: user.email,
      displayName: user.displayname || "there",
      resetUrl: `${APP()}/reset?code=${code}&uid=${user.user_id}`,
      hours: CODE_TTL_HOURS,
    });

    res.json(ok);
  } catch (err) {
    console.error("forgot-password:", err);
    res.status(500).json({ error: "Could not send the reset email, please try again." });
  }
});

// GET /api/auth/reset/verify?code=..&uid=..  — page load pe link check
passwordResetRouter.get("/reset/verify", async (req, res) => {
  try {
    const row = await findValidCode(req.query.code, req.query.uid);
    if (!row) return res.status(400).json({ error: "This reset link is invalid or has expired." });
    res.json({ ok: true, email: maskEmail(row.email), displayname: row.displayname });
  } catch (err) {
    console.error("reset-verify:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/auth/reset  { code, uid, password }
passwordResetRouter.post("/reset", async (req, res) => {
  try {
    const { code, uid, password } = req.body || {};
    if (!password || String(password).length < 8)
      return res.status(400).json({ error: "Password must be at least 8 characters in length" });

    const row = await findValidCode(code, uid);
    if (!row) return res.status(400).json({ error: "This reset link is invalid or has expired." });

    // legacy-compatible hashing — purani PHP site bhi isi password se login karegi
    const salt = generateUserSalt();
    const hash = await hashPassword(password, salt);

    await pool.query(
      "UPDATE engine4_users SET password = ?, salt = ?, modified_date = NOW() WHERE user_id = ?",
      [hash, salt, row.user_id],
    );
    await pool.query("DELETE FROM engine4_user_forgot WHERE user_id = ?", [row.user_id]);

    await pool.query(
      `INSERT INTO engine4_user_logins (user_id, email, ip, timestamp, state, source, active)
       VALUES (?, ?, ?, NOW(), 'success', 'password-reset', 1)`,
      [row.user_id, row.email, Buffer.from("00000000000000000000000000000001", "hex")],
    );

    // reset ke baad seedha sign in
    const [[user]] = await pool.query("SELECT * FROM engine4_users WHERE user_id = ?", [row.user_id]);
    setSessionCookie(res, signSession(user));
    res.json({ ok: true, user: await publicUser(user) });
  } catch (err) {
    console.error("reset-password:", err);
    res.status(500).json({ error: "Could not reset your password, please try again." });
  }
});