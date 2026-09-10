
import { pool } from '../db.js'
import { getDisplayNames } from './groupUtils.js'

/**
 * @param {object} o
 * @param {number[]} o.to          recipient user ids (actor is skipped automatically)
 * @param {number}   o.actorId     who did it
 * @param {string}   o.type        task_created | assignment_created | task_comment
 * @param {string}   o.text        one-line heading
 * @param {string}   o.link        frontend route to open
 * @param {number}   o.objectId    task id
 * @param {object}   o.meta        { title, task, assignment, group, by, for } — any subset
 */
export async function notify({ to, actorId, type, text, link, objectId, meta = {} }) {
  const recipients = [...new Set((to || []).map(Number).filter((id) => id && id !== Number(actorId)))]
  if (!recipients.length) return

  const names = await getDisplayNames([actorId, ...recipients])
  const by = meta.by || names.get(Number(actorId)) || 'Someone'

  const rows = recipients.map((uid) => [
    uid,
    'user',
    actorId,
    'group_task',
    objectId || 0,
    type,
    JSON.stringify({
      text,
      link,
      meta: { ...meta, by, for: meta.for || names.get(uid) || undefined },
    }),
  ])

  await pool.query(
    `INSERT INTO engine4_activity_notifications
       (user_id, subject_type, subject_id, object_type, object_id, type, params, \`read\`, mitigated, date)
     VALUES ${rows.map(() => '(?, ?, ?, ?, ?, ?, ?, 0, 0, NOW())').join(', ')}`,
    rows.flat(),
  )
}