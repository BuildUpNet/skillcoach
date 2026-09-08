import { Router } from 'express'
import { pool } from '../db.js'
import { asyncHandler, formatDate, getDisplayNames } from '../lib/groupUtils.js'

export const timeRouter = Router({ mergeParams: true })

timeRouter.get('/timesheet', asyncHandler(async (req, res) => {
  const { groupId } = req.params
  const [rows] = await pool.query(
    `SELECT ts.timesheet_id, ts.hours_worked, ts.description,
            DATE_FORMAT(ts.task_made_date, '%Y-%m-%d') AS made_date,
            t.course_title
     FROM engine4_group_timesheets ts
     LEFT JOIN engine4_group_tasks t ON t.task_id = ts.task_id
     WHERE ts.group_id = ? AND ts.user_id = ?
     ORDER BY ts.task_made_date DESC`,
    [groupId, req.userId],
  )
  // Plain ISO dates here (not the pretty "August 28" label) — the frontend
  // buckets these into Yesterday/Today/This week/This month itself, which
  // needs a real parseable date to compare against "today" client-side.
  res.json(
    rows.map((r) => ({
      id: r.timesheet_id,
      task: r.course_title || 'General',
      date: r.made_date,
      hours: Number(r.hours_worked),
      note: r.description || '',
    })),
  )
}))

timeRouter.get('/time-summary', asyncHandler(async (req, res) => {
  const { groupId } = req.params
  const [rows] = await pool.query(
    `SELECT ts.user_id, g.user_id AS owner_id, SUM(ts.hours_worked) AS total_hours
     FROM engine4_group_timesheets ts
     JOIN engine4_group_groups g ON g.group_id = ts.group_id
     WHERE ts.group_id = ?
     GROUP BY ts.user_id
     ORDER BY total_hours DESC`,
    [groupId],
  )
  const names = await getDisplayNames(rows.map((r) => r.user_id))
  res.json(
    rows.map((r) => ({
      member: names.get(r.user_id) || 'Unknown',
      role: r.user_id === r.owner_id ? 'Owner' : 'Member',
      hours: Number(r.total_hours),
    })),
  )
}))

timeRouter.get('/timeline', asyncHandler(async (req, res) => {
  const { groupId } = req.params
  const [tasks] = await pool.query(
    'SELECT task_id, course_title, created_date FROM engine4_group_tasks WHERE group_id = ?',
    [groupId],
  )
  if (!tasks.length) return res.json([])
  const taskIds = tasks.map((t) => t.task_id)
  const titleByTaskId = new Map(tasks.map((t) => [t.task_id, t.course_title]))

  const [processes] = await pool.query(
    `SELECT tp.taskprocesse_id, tp.process_title, tp.task_id, tp.created_date, pu.process_status, pu.completed_date
     FROM engine4_group_taskprocesses tp
     LEFT JOIN engine4_group_processusers pu ON pu.processe_id = tp.taskprocesse_id
     WHERE tp.task_id IN (?)`,
    [taskIds],
  )
  const [comments] = await pool.query(
    `SELECT taskcomment_id, task_id, created_date FROM engine4_group_taskcomments WHERE task_id IN (?)`,
    [taskIds],
  )

  // Simplified, Group-tables-only feed — legacy pulls this from a separate,
  // app-wide generic Activity module with no other consumer in this rewrite.
  const events = []
  tasks.forEach((t) =>
    events.push({ id: `task-${t.task_id}`, text: `New task "${t.course_title}" created`, date: t.created_date }),
  )
  processes.forEach((p) => {
    events.push({
      id: `assign-${p.taskprocesse_id}`,
      text: `New assignment "${p.process_title}" added to "${titleByTaskId.get(p.task_id)}"`,
      date: p.created_date,
    })
    if (p.process_status) {
      events.push({
        id: `done-${p.taskprocesse_id}`,
        text: `Assignment "${p.process_title}" marked complete`,
        date: p.completed_date,
      })
    }
  })
  comments.forEach((c) =>
    events.push({
      id: `comment-${c.taskcomment_id}`,
      text: `New comment on "${titleByTaskId.get(c.task_id)}"`,
      date: c.created_date,
    }),
  )

  events.sort((a, b) => new Date(b.date) - new Date(a.date))
  res.json(events.slice(0, 30).map((e) => ({ id: e.id, text: e.text, date: formatDate(e.date) })))
}))
