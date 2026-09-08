import mysql from 'mysql2/promise'
import 'dotenv/config'

export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
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
