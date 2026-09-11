import { pool } from '../db.js'

// Wraps an async Express handler so a thrown/rejected error reaches the
// global error middleware instead of leaving the request hanging forever.
export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)
}

// Pretty display date, e.g. "August 28" — matches the mock data's style.
export function formatDate(value) {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
}

// user_id -> displayname lookup for a batch of ids (comments/hours/assignees).
export async function getDisplayNames(userIds) {
  const ids = [...new Set(userIds.filter((id) => id != null))]
  if (!ids.length) return new Map()
  const [rows] = await pool.query(
    'SELECT user_id, displayname FROM engine4_users WHERE user_id IN (?)',
    [ids],
  )
  return new Map(rows.map((r) => [r.user_id, r.displayname]))
}

// Matches the legacy Group_TaskController's real 5-level priority_type enum
// (Lowest=1 .. Highest=5) — confirmed against the legacy PHP source.
export const PRIORITY_TO_INT = { Lowest: 1, Low: 2, Normal: 3, High: 4, Highest: 5 }
const INT_TO_PRIORITY = { 1: 'Lowest', 2: 'Low', 3: 'Normal', 4: 'High', 5: 'Highest' }
export function priorityToInt(label) {
  return PRIORITY_TO_INT[label] ?? 3
}
export function priorityToLabel(value) {
  return INT_TO_PRIORITY[value] || 'Normal'
}

// Blocks access to a group's internal workspace (tasks/members/timesheet/
// etc.) to anyone who isn't an approved, active member of that group —
// requireAuth alone only proves "logged in", not "belongs to this group".
export function requireGroupMember(req, res, next) {
  pool
    .query(
      `SELECT 1 FROM engine4_group_membership
       WHERE resource_id = ? AND user_id = ? AND active = 1 AND resource_approved = 1 AND user_approved = 1
       LIMIT 1`,
      [req.params.groupId, req.userId],
    )
    .then(([rows]) => {
      if (!rows.length) return res.status(403).json({ error: 'You are not a member of this group' })
      next()
    })
    .catch(next)
}

// Ensures a taskusers "membership in this task" row exists for a user —
// internal bookkeeping only, never read back for display. No unique key
// exists on (task_id, user_id) so this is select-then-insert.
export async function ensureTaskUser(taskId, userId) {
  const [rows] = await pool.query(
    'SELECT taskuser_id FROM engine4_group_taskusers WHERE task_id = ? AND user_id = ? LIMIT 1',
    [taskId, userId],
  )
  if (rows.length) return
  await pool.query(
    `INSERT INTO engine4_group_taskusers (task_id, user_id, task_status, created_date, task_order)
     VALUES (?, ?, 1, NOW(), 0)`,
    [taskId, userId],
  )
}
