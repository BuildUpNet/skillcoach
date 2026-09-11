import express from "express";
import crypto from "crypto";
import { findOrCreateSocialUser } from "../lib/socialAuth.js";
import { signSession, setSessionCookie } from "../auth.js";

export const googleRouter = express.Router();

const API_URL = process.env.API_URL || `http://localhost:${process.env.PORT || 4000}`;
const FRONTEND_URL = process.env.FRONTEND_URL || process.env.APP_URL || "http://localhost:5173";
const isProd = process.env.NODE_ENV === "production";
const CALLBACK = () => `${API_URL}/api/auth/google/callback`;

const fail = (res, msg) =>
  res.redirect(`${FRONTEND_URL}/?error=${encodeURIComponent(msg)}`);

googleRouter.get("/google", (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID)
    return fail(res, "GOOGLE_CLIENT_ID missing in env");

  const state = crypto.randomBytes(16).toString("hex");
  res.cookie("g_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    maxAge: 10 * 60 * 1000,
    path: "/",
  });

  const u = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  u.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID);
  u.searchParams.set("redirect_uri", CALLBACK());
  u.searchParams.set("response_type", "code");
  u.searchParams.set("scope", "openid email profile");
  u.searchParams.set("state", state);
  u.searchParams.set("prompt", "select_account");
  res.redirect(u.toString());
});

googleRouter.get("/google/callback", async (req, res) => {
  try {
    const { code, state, error } = req.query;
    if (error) return fail(res, "Google sign-in cancelled");
    if (!code || !state || state !== req.cookies?.g_state)
      return fail(res, "Invalid state, please try again");
    res.clearCookie("g_state", { path: "/" });

    const token = await (await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: CALLBACK(),
        grant_type: "authorization_code",
      }),
    })).json();

    if (!token.access_token)
      return fail(res, token.error_description || "Token exchange failed");

    const me = await (await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${token.access_token}` },
    })).json();

    if (!me.sub) return fail(res, "Could not read Google profile");

    const user = await findOrCreateSocialUser({
      provider: "google",
      providerUid: me.sub,
      email: me.email,
      emailVerified: !!me.email_verified,
      name: me.name,
      avatarUrl: me.picture,
      tokens: token,
    });

    // same session cookie (sc_session) as the email login
    setSessionCompat(res, user);

    res.redirect(`${FRONTEND_URL}/home`);
  } catch (e) {
    console.error("google callback:", e);
    fail(res, e.message || "Google sign-in failed");
  }
});

function setSessionCompat(res, user) {
  setSessionCookie(res, signSession(user));
}