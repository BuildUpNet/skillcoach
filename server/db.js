import mysql from 'mysql2/promise'
import 'dotenv/config'

export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3307,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  timezone: 'Z',    
  waitForConnections: true,
  connectionLimit: 10,
})

// engine4_group_membership has no date column on the live production schema.
// Locally we've added one (see server/routes/members.js), but this must never
// be hard-depended on — there's no permission to alter the live schema, so
// every query touching it branches on this flag instead of assuming the
// column exists.
export const hasMembershipDateColumn = await pool
  .query("SHOW COLUMNS FROM engine4_group_membership LIKE 'created_date'")
  .then(([rows]) => rows.length > 0)
  .catch(() => false)

// Group photos are a new capability with no legacy equivalent table, so this
// is a brand-new, purely additive table (never touches engine4_group_groups)
// rather than a column added to an existing legacy table. Created
// idempotently on every boot so it self-provisions wherever this runs.
await pool.query(`
  CREATE TABLE IF NOT EXISTS engine4_group_group_photos (
    photo_id INT AUTO_INCREMENT PRIMARY KEY,
    group_id INT NOT NULL UNIQUE,
    data_url LONGTEXT NOT NULL,
    created_date DATETIME NOT NULL
  )
`)

// engine4_authorization_levels holds real role data on live production
// (Admin/Normal User/Public/Skillcoach — confirmed from the production SQL
// dump), but a fresh full-schema import (structure only, no rows) leaves it
// empty, which breaks anything role-based (default signup level, admin
// checks). Seed only when empty — never touches a DB that already has real
// rows, local or live.
await pool.query(`
  CREATE TABLE IF NOT EXISTS engine4_authorization_levels (
    level_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(64) NOT NULL,
    description TEXT,
    type VARCHAR(32) DEFAULT NULL,
    flag VARCHAR(32) DEFAULT NULL
  )
`)

const [[{ levelCount }]] = await pool.query(
  'SELECT COUNT(*) AS levelCount FROM engine4_authorization_levels',
)
if (levelCount === 0) {
  await pool.query(`
    INSERT INTO engine4_authorization_levels (level_id, title, description, type, flag) VALUES
      (1, 'Admin', 'Full administrative access to every module.', 'admin', 'superadmin'),
      (4, 'Normal User', 'Default role assigned to every new registered member.', 'user', 'default'),
      (5, 'Public', 'Visitors who are not signed in.', 'public', 'public'),
      (7, 'Skillcoach', 'Can moderate user-side content.', 'moderator', NULL)
  `)
}

// Per-group privacy cutoffs (view/comment/photo/event/invite -> minimum
// role). No legacy equivalent column/table cleanly fits this (see
// server/lib/groupPermissions.js for why engine4_authorization_allow isn't
// used) — brand new, purely additive, same self-provisioning pattern as
// engine4_group_group_photos above.
await pool.query(`
  CREATE TABLE IF NOT EXISTS engine4_group_privacy (
    group_id INT UNSIGNED NOT NULL,
    action VARCHAR(16) NOT NULL,
    min_role VARCHAR(16) NOT NULL,
    PRIMARY KEY (group_id, action)
  )
`)
