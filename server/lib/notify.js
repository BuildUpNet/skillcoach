import { pool } from '../db.js'

// one row per recipient; params holds what the UI needs to render it
export async function createNotifications({ userIds, actorId, groupId, type, text, link }) {
  const ids = [...new Set(userIds.filter(Boolean).map(Number))]
  if (!ids.length) return
  const params = JSON.stringify({ text, link })
  await pool.query(
    `INSERT INTO engine4_activity_notifications
       (user_id, subject_type, subject_id, object_type, object_id, type, \`read\`, mitigated, date, params)
     VALUES ${ids.map(() => '(?, "user", ?, "group", ?, ?, 0, 0, NOW(), ?)').join(',')}`,
    ids.flatMap((uid) => [uid, actorId || 0, groupId || 0, type, params]),
  )
}