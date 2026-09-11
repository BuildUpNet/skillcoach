import express from "express";
import crypto from "crypto";
import { findOrCreateSocialUser } from "../lib/socialAuth.js";
import { signSession, setSessionCookie } from "../auth.js";

export const facebookRouter = express.Router();

const FB_VERSION = "v21.0";
const isProd = process.env.NODE_ENV === "production";
const API_URL = process.env.API_URL || (isProd ? null : `http://localhost:${process.env.PORT || 4000}`);
const FRONTEND_URL = process.env.FRONTEND_URL || process.env.APP_URL || (isProd ? null : "http://localhost:5173");
const CALLBACK = () => `${API_URL}/api/auth/facebook/callback`;

const fail = (res, msg) => {
  if (!FRONTEND_URL) return res.status(500).json({ error: `Config error: ${msg}` });
  res.redirect(`${FRONTEND_URL}/?error=${encodeURIComponent(msg)}`);
};

facebookRouter.get("/facebook/start", (req, res) => {
  if (!process.env.FACEBOOK_APP_ID)
    return fail(res, "FACEBOOK_APP_ID missing in env");
  if (!API_URL)
    return fail(res, "API_URL missing in env");

  const state = crypto.randomBytes(16).toString("hex");
  res.cookie("fb_state", state, {
    httpOnly: true,
    sameSite: isProd ? "none" : "lax",
    secure: isProd,
    maxAge: 10 * 60 * 1000,
    path: "/",
  });

  const u = new URL(`https://www.facebook.com/${FB_VERSION}/dialog/oauth`);
  u.searchParams.set("client_id", process.env.FACEBOOK_APP_ID);
  u.searchParams.set("redirect_uri", CALLBACK());
  u.searchParams.set("response_type", "code");
  u.searchParams.set("scope", "email,public_profile");
  u.searchParams.set("state", state);
  res.redirect(u.toString());
});

facebookRouter.get("/facebook/callback", async (req, res) => {
  try {
    const { code, state, error_description, error } = req.query;
    if (error) return fail(res, error_description || "Facebook sign-in cancelled");
    if (!code || !state || state !== req.cookies?.fb_state)
      return fail(res, "Invalid state, please try again");
    res.clearCookie("fb_state", { path: "/" });

    const tokenUrl = new URL(`https://graph.facebook.com/${FB_VERSION}/oauth/access_token`);
    tokenUrl.searchParams.set("client_id", process.env.FACEBOOK_APP_ID);
    tokenUrl.searchParams.set("client_secret", process.env.FACEBOOK_APP_SECRET);
    tokenUrl.searchParams.set("redirect_uri", CALLBACK());
    tokenUrl.searchParams.set("code", code);

    const token = await (await fetch(tokenUrl)).json();
    if (!token.access_token)
      return fail(res, token.error?.message || "Token exchange failed");

    // appsecret_proof — FB ka recommended server-side safeguard
    const proof = crypto
      .createHmac("sha256", process.env.FACEBOOK_APP_SECRET)
      .update(token.access_token)
      .digest("hex");

    const meUrl = new URL(`https://graph.facebook.com/${FB_VERSION}/me`);
    meUrl.searchParams.set("fields", "id,name,email,picture.type(large)");
    meUrl.searchParams.set("access_token", token.access_token);
    meUrl.searchParams.set("appsecret_proof", proof);

    const me = await (await fetch(meUrl)).json();
    if (!me.id) return fail(res, me.error?.message || "Could not read Facebook profile");

    if (!me.email)
      return fail(res, "Your Facebook account has no email. Please sign up with email instead.");

    const user = await findOrCreateSocialUser({
      provider: "facebook",
      providerUid: me.id,
      email: me.email,
      emailVerified: true,          // FB apne emails verify karke deta hai
      name: me.name,
      avatarUrl: me.picture?.data?.url || null,
      tokens: token,
    });

    setSessionCookie(res, signSession(user));
    res.redirect(`${FRONTEND_URL}/home`);
  }  catch (e) {
    console.error("facebook callback:", e);
    fail(res, e.message || "Facebook sign-in failed");
  }
});
