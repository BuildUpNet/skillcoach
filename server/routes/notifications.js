import { Router } from 'express'
import { pool } from '../db.js'
import { asyncHandler } from '../lib/groupUtils.js'

export const notificationsRouter = Router()

notificationsRouter.get('/', asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200)
  const [rows] = await pool.query(
    `SELECT n.notification_id, n.type, n.\`read\`, n.date, n.params, u.displayname AS actor
     FROM engine4_activity_notifications n
     LEFT JOIN engine4_users u ON u.user_id = n.subject_id
     WHERE n.user_id = ? ORDER BY n.date DESC LIMIT ?`,
    [req.userId, limit],
  )
  const [[{ unread }]] = await pool.query(
    'SELECT COUNT(*) AS unread FROM engine4_activity_notifications WHERE user_id = ? AND `read` = 0',
    [req.userId],
  )
  res.json({
    unread,
    items: rows.map((r) => {
      let p = {}
      try { p = JSON.parse(r.params || '{}') } catch {}
      return { id: r.notification_id, type: r.type, read: !!r.read, date: r.date, actor: r.actor, text: p.text || '', link: p.link || null }
    }),
  })
}))

notificationsRouter.patch('/read-all', asyncHandler(async (req, res) => {
  await pool.query('UPDATE engine4_activity_notifications SET `read` = 1 WHERE user_id = ?', [req.userId])
  res.status(204).end()
}))

notificationsRouter.patch('/:id/read', asyncHandler(async (req, res) => {
  await pool.query('UPDATE engine4_activity_notifications SET `read` = 1 WHERE notification_id = ? AND user_id = ?', [req.params.id, req.userId])
  res.status(204).end()
}))