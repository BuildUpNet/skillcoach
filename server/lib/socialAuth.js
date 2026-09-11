import crypto from "crypto";
import { pool } from "../db.js";        // <-- jo path auth.js mein hai wahi
import { getDefaultLevelId, generateUserSalt } from "../auth.js";

const levelId = await getDefaultLevelId();
const DEFAULT_IP = Buffer.from("00000000000000000000000000000001", "hex");
const rand = (n = 16) => crypto.randomBytes(n).toString("hex");

async function uniqueUsername(conn, input) {
  const base =
    String(input || "user").split("@")[0].toLowerCase()
      .replace(/[^a-z0-9_-]/g, "").slice(0, 20) || "user";
  let candidate = base;
  for (let i = 0; i < 15; i++) {
    const [rows] = await conn.query(
      "SELECT user_id FROM engine4_users WHERE username = ? LIMIT 1", [candidate]);
    if (!rows.length) return candidate;
    candidate = `${base}${Math.floor(Math.random() * 90000) + 10000}`;
  }
  return `${base}${Date.now()}`;
}

export async function findOrCreateSocialUser({
  provider, providerUid, email, emailVerified = false, name, avatarUrl, tokens = {},
}) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1) pehle se linked?
    const [linked] = await conn.query(
      `SELECT u.* FROM sc_user_social s
       JOIN engine4_users u ON u.user_id = s.user_id
       WHERE s.provider = ? AND s.provider_uid = ? LIMIT 1`,
      [provider, String(providerUid)]
    );
    let user = linked[0];

    // 2) verified email se existing account auto-link
    if (!user && email && emailVerified) {
      const [byEmail] = await conn.query(
        "SELECT * FROM engine4_users WHERE email = ? LIMIT 1", [email]);
      user = byEmail[0];
    }

 if (!user) {
  if (!email) throw new Error("Email not provided by provider");
  const username = await uniqueUsername(conn, name || email);
  const levelId = await getDefaultLevelId();          // <-- ye line honi chahiye
  const [ins] = await conn.query(
    `INSERT INTO engine4_users
      (email, username, displayname, password, salt, level_id,
       enabled, verified, approved, creation_date, creation_ip, modified_date)
     VALUES (?, ?, ?, ?, ?, ?, 1, 1, 1, NOW(), ?, NOW())`,
    [
      email,
      username,
      name || username,
      crypto.createHash("md5").update(rand(32)).digest("hex"),  // password
      generateUserSalt(),                                        // salt
      levelId,                                                   // level_id
      DEFAULT_IP,                                                // creation_ip
    ]
  );
    }

    if (!user.enabled) throw new Error("Account disabled");

    // 4) link save
    const expiresAt = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000) : null;
    await conn.query(
      `INSERT INTO sc_user_social
         (user_id, provider, provider_uid, email, name, avatar_url,
          access_token, refresh_token, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         user_id = VALUES(user_id), email = VALUES(email), name = VALUES(name),
         avatar_url = VALUES(avatar_url), access_token = VALUES(access_token),
         refresh_token = VALUES(refresh_token), expires_at = VALUES(expires_at)`,
      [user.user_id, provider, String(providerUid), email || null, name || null,
       avatarUrl || null, tokens.access_token || null, tokens.refresh_token || null, expiresAt]
    );
if (provider === "facebook") {
  await conn.query(
    `INSERT INTO engine4_user_facebook (user_id, facebook_uid, access_token)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE access_token = VALUES(access_token)`,
    [user.user_id, providerUid, tokens.access_token || ""]
  );
}
    // 5) login log + lastlogin
    await conn.query(
      `INSERT INTO engine4_user_logins (user_id, email, ip, timestamp, state, source, active)
       VALUES (?, ?, ?, NOW(), 'third-party', ?, 1)`,
      [user.user_id, user.email, DEFAULT_IP, provider]);
    await conn.query(
      "UPDATE engine4_users SET lastlogin_date = NOW(), lastlogin_ip = ? WHERE user_id = ?",
      [DEFAULT_IP, user.user_id]);

    await conn.commit();
    return user;
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}