import { Router } from 'express'
import { pool } from '../db.js'
import {
  asyncHandler,
  formatDate,
  getDisplayNames,
  priorityToInt,
  priorityToLabel,
  ensureTaskUser,
} from '../lib/groupUtils.js'
import { sendTaskCreatedMail, sendTaskCommentMail, sendAssignmentCreatedMail } from '../lib/mailer.js'
import { notify } from '../lib/notify.js'
export const tasksRouter = Router({ mergeParams: true })

// Loads a task and confirms it belongs to the group in the URL — every
// nested route (assignments/comments/hours) depends on this check so a user
// can never read/write across group boundaries by guessing an id.
async function getTaskInGroup(taskId, groupId) {
  const [rows] = await pool.query(
    'SELECT * FROM engine4_group_tasks WHERE task_id = ? AND group_id = ? LIMIT 1',
    [taskId, groupId],
  )
  return rows[0] || null
}

async function getAssignmentInTask(assignmentId, taskId) {
  const [rows] = await pool.query(
    'SELECT * FROM engine4_group_taskprocesses WHERE taskprocesse_id = ? AND task_id = ? LIMIT 1',
    [assignmentId, taskId],
  )
  return rows[0] || null
}

async function getGroupTitle(groupId) {
  const [[grp]] = await pool.query('SELECT title FROM engine4_group_groups WHERE group_id = ?', [groupId])
  return grp?.title || 'your group'
}

// Like getTaskInGroup, but also carries the group owner's id — used by the
// delete routes, where "task creator OR group owner" may manage/remove
// things (legacy's only real permission check, on task accept/reject,
// follows this same pattern — generalized here since legacy's delete
// actions had no server-side check at all, which the rebuild deliberately
// does not copy).
async function getTaskWithOwner(taskId, groupId) {
  const [rows] = await pool.query(
    `SELECT t.*, g.user_id AS group_owner_id
     FROM engine4_group_tasks t
     JOIN engine4_group_groups g ON g.group_id = t.group_id
     WHERE t.task_id = ? AND t.group_id = ?
     LIMIT 1`,
    [taskId, groupId],
  )
  return rows[0] || null
}

function canManageTask(task, userId) {
  return task.user_id === Number(userId) || task.group_owner_id === Number(userId)
}

async function deleteCommentWithReplies(commentId, taskId) {
  await pool.query('DELETE FROM engine4_group_taskcomments WHERE parent_id = ? AND task_id = ?', [commentId, taskId])
  await pool.query('DELETE FROM engine4_group_taskcomments WHERE taskcomment_id = ?', [commentId])
}

function buildCommentTree(comments, replies, names, matchScope) {
  return comments
    .filter(matchScope)
    .map((c) => ({
      id: c.taskcomment_id,
      author: names.get(c.user_id) || 'Unknown',
      authorId: c.user_id,
      text: c.comment,
      date: formatDate(c.created_date),
      replies: replies
        .filter((r) => matchScope(r) && r.parent_id === c.taskcomment_id)
        .map((r) => ({
          id: r.taskcomment_id,
          author: names.get(r.user_id) || 'Unknown',
          authorId: r.user_id,
          text: r.comment,
          date: formatDate(r.created_date),
          parentId: r.parent_id,
        })),
    }))
}

tasksRouter.get('/', asyncHandler(async (req, res) => {
  const { groupId } = req.params
  const [tasks] = await pool.query(
    'SELECT * FROM engine4_group_tasks WHERE group_id = ? ORDER BY task_id DESC',
    [groupId],
  )
  if (!tasks.length) return res.json([])

  const taskIds = tasks.map((t) => t.task_id)
  const [processes] = await pool.query(
    `SELECT tp.*, pu.process_status, pu.completed_date AS pu_completed_date
     FROM engine4_group_taskprocesses tp
     LEFT JOIN engine4_group_processusers pu ON pu.processe_id = tp.taskprocesse_id
     WHERE tp.task_id IN (?)
     ORDER BY tp.taskprocesse_id DESC`,
    [taskIds],
  )
  // Comments with assignment_id = 0 are task-level (general) comments;
  // non-zero ties a comment to a specific assignment.
  const [comments] = await pool.query(
    `SELECT * FROM engine4_group_taskcomments
     WHERE task_id IN (?) AND parent_id = 0
     ORDER BY created_date ASC`,
    [taskIds],
  )
  // Replies (parent_id != 0). Legacy's 2-level parent_id/sub_parent_id model
  // (reply vs. reply-to-a-reply) is flattened here into one "replies" list
  // per top-level comment, ordered by date — matches how most simple
  // comment/reply UIs actually render a thread.
  const [replies] = await pool.query(
    `SELECT * FROM engine4_group_taskcomments
     WHERE task_id IN (?) AND parent_id != 0
     ORDER BY created_date ASC`,
    [taskIds],
  )
  const [hours] = await pool.query(
    `SELECT * FROM engine4_group_timesheets WHERE task_id IN (?) ORDER BY created_date ASC`,
    [taskIds],
  )
  // task_status for the task's own assignee (task_manager) — this is what
  // "mark this task complete" toggles; distinct from a sub-assignment's own
  // done-checkbox (engine4_group_processusers).
  const [taskUserRows] = await pool.query(
    `SELECT task_id, user_id, task_status FROM engine4_group_taskusers WHERE task_id IN (?)`,
    [taskIds],
  )

  const userIds = []
  tasks.forEach((t) => userIds.push(t.task_manager, t.user_id))
  processes.forEach((p) => userIds.push(p.user_id))
  comments.forEach((c) => userIds.push(c.user_id))
  replies.forEach((r) => userIds.push(r.user_id))
  hours.forEach((h) => userIds.push(h.user_id))
  const names = await getDisplayNames(userIds)

  const result = tasks.map((task) => {
    const taskProcesses = processes.filter((p) => p.task_id === task.task_id)
    const assignments = taskProcesses.map((p) => ({
      id: p.taskprocesse_id,
      title: p.process_title,
      assignee: names.get(p.user_id) || 'Unassigned',
      assigneeId: p.user_id,
      date: formatDate(p.created_date),
      done: !!p.process_status,
      details: p.assignment || '',
      comments: buildCommentTree(comments, replies, names, (c) => c.assignment_id === p.taskprocesse_id),
      workedHours: hours
        .filter((h) => h.assignment_id === p.taskprocesse_id)
        .map((h) => ({
          id: h.timesheet_id,
          person: names.get(h.user_id) || 'Unknown',
          hours: Number(h.hours_worked),
          date: formatDate(h.task_made_date),
        })),
    }))

    const ownTaskUser = taskUserRows.find((tu) => tu.task_id === task.task_id && tu.user_id === task.task_manager)
    const taskDone = ownTaskUser?.task_status === 3
    const doneCount = assignments.filter((a) => a.done).length
    const status = taskDone
      ? 'Completed'
      : assignments.length === 0
      ? 'Not started'
      : doneCount === assignments.length
      ? 'Completed'
      : 'In progress'

    return {
      id: task.task_id,
      title: task.course_title,
      assignee: names.get(task.task_manager) || 'Unassigned',
      assigneeId: task.task_manager,
      creatorId: task.user_id,
      date: formatDate(task.created_date),
      priority: priorityToLabel(task.priority_type),
      status,
      done: taskDone,
      description: task.description || '',
      comments: buildCommentTree(comments, replies, names, (c) => c.assignment_id === 0),
      assignments,
    }
  })
  res.json(result)
}))

tasksRouter.post('/', asyncHandler(async (req, res) => {
  const { groupId } = req.params
  const { title, description, priority, assignee } = req.body || {}
  if (!title?.trim()) return res.status(400).json({ error: 'Title is required' })
  if (!description?.trim()) return res.status(400).json({ error: 'Description is required' })

  const taskManager = assignee || req.userId

  const [result] = await pool.query(
    `INSERT INTO engine4_group_tasks
       (task_type, task_manager, group_id, course_title, user_id, shared_users,
        description, status, priority_type, created_date)
     VALUES (1, ?, ?, ?, ?, ?, ?, 1, ?, NOW())`,
    [taskManager, groupId, title.trim(), req.userId, String(taskManager), description.trim(), priorityToInt(priority)],
  )
  await ensureTaskUser(result.insertId, taskManager)

  const groupTitle = await getGroupTitle(groupId)
  try {
    await sendTaskCreatedMail({
      groupId,
      groupTitle,
      taskId: result.insertId,
      taskTitle: title.trim(),
      taskDescription: description.trim(),
      creatorId: req.userId,
      assigneeId: taskManager,
    })
  } catch (err) {
    console.error('task-created mail failed:', err.message)
  }
  try {
    await notify({
      to: [taskManager],
      actorId: req.userId,
      type: 'task_created',
      text: 'New Task',
      link: `/groups/${groupId}`,
      objectId: result.insertId,
      meta: { title: title.trim(), group: groupTitle },
    })
  } catch (err) {
    console.error('task-created notify failed:', err.message)
  }

  const names = await getDisplayNames([taskManager])
  res.status(201).json({
    id: result.insertId,
    title: title.trim(),
    assignee: names.get(Number(taskManager)) || 'Unassigned',
    assigneeId: Number(taskManager),
    creatorId: Number(req.userId),
    date: formatDate(new Date()),
    priority: priorityToLabel(priorityToInt(priority)),
    status: 'Not started',
    done: false,
    description: description.trim(),
    comments: [],
    assignments: [],
  })
}))

tasksRouter.put('/:taskId', asyncHandler(async (req, res) => {
  const { groupId, taskId } = req.params
  const task = await getTaskInGroup(taskId, groupId)
  if (!task) return res.status(404).json({ error: 'Task not found' })
  if (task.user_id !== Number(req.userId)) {
    return res.status(403).json({ error: 'Only the person who created this task can edit it' })
  }

  const { title, description, priority, assignee } = req.body || {}
  if (!title?.trim()) return res.status(400).json({ error: 'Title is required' })
  if (!description?.trim()) return res.status(400).json({ error: 'Description is required' })

  const taskManager = assignee || task.task_manager
  await pool.query(
    `UPDATE engine4_group_tasks
     SET course_title = ?, description = ?, priority_type = ?, task_manager = ?
     WHERE task_id = ?`,
    [title.trim(), description.trim(), priorityToInt(priority), taskManager, taskId],
  )
  await ensureTaskUser(taskId, taskManager)

  const names = await getDisplayNames([taskManager])
  res.json({
    id: Number(taskId),
    title: title.trim(),
    assignee: names.get(Number(taskManager)) || 'Unassigned',
    assigneeId: Number(taskManager),
    date: formatDate(task.created_date),
    priority: priorityToLabel(priorityToInt(priority)),
    description: description.trim(),
  })
}))

tasksRouter.delete('/:taskId', asyncHandler(async (req, res) => {
  const { groupId, taskId } = req.params
  const task = await getTaskWithOwner(taskId, groupId)
  if (!task) return res.status(404).json({ error: 'Task not found' })
  if (!canManageTask(task, req.userId)) {
    return res.status(403).json({ error: 'Only the task creator or group owner can delete this task' })
  }

  await pool.query('DELETE FROM engine4_group_taskcomments WHERE task_id = ?', [taskId])
  await pool.query('DELETE FROM engine4_group_timesheets WHERE task_id = ?', [taskId])
  await pool.query('DELETE FROM engine4_group_processusers WHERE task_id = ?', [taskId])
  await pool.query('DELETE FROM engine4_group_taskprocesses WHERE task_id = ?', [taskId])
  await pool.query('DELETE FROM engine4_group_taskusers WHERE task_id = ?', [taskId])
  await pool.query('DELETE FROM engine4_group_tasks WHERE task_id = ?', [taskId])
  res.status(204).end()
}))

tasksRouter.patch('/:taskId/done', asyncHandler(async (req, res) => {
  const { groupId, taskId } = req.params
  const task = await getTaskInGroup(taskId, groupId)
  if (!task) return res.status(404).json({ error: 'Task not found' })
  if (task.task_manager !== Number(req.userId)) {
    return res.status(403).json({ error: 'Only the person this task is assigned to can mark it done' })
  }

  const done = !!(req.body || {}).done
  await ensureTaskUser(taskId, req.userId)
  await pool.query(
    `UPDATE engine4_group_taskusers
     SET task_status = ?, completed_date = ?
     WHERE task_id = ? AND user_id = ?`,
    [done ? 3 : 1, done ? new Date() : null, taskId, req.userId],
  )
  // TODO notifyGroupTaskStatus(groupOwner) — deferred, no email system yet.

  res.json({ id: Number(taskId), done })
}))

tasksRouter.post('/:taskId/comments', asyncHandler(async (req, res) => {
  const { groupId, taskId } = req.params
  const task = await getTaskInGroup(taskId, groupId)
  if (!task) return res.status(404).json({ error: 'Task not found' })

  const { text, parentId } = req.body || {}
  if (!text?.trim()) return res.status(400).json({ error: 'Comment text is required' })

  let parent = 0
  if (parentId) {
    const [parentRows] = await pool.query(
      'SELECT taskcomment_id FROM engine4_group_taskcomments WHERE taskcomment_id = ? AND task_id = ? AND assignment_id = 0 AND parent_id = 0 LIMIT 1',
      [parentId, taskId],
    )
    if (!parentRows.length) return res.status(400).json({ error: 'Comment being replied to was not found' })
    parent = parentRows[0].taskcomment_id
  }

  const [result] = await pool.query(
    `INSERT INTO engine4_group_taskcomments
       (user_id, task_id, assignment_id, comment, comment_status, created_date, parent_id, sub_parent_id)
     VALUES (?, ?, 0, ?, 1, NOW(), ?, 0)`,
    [req.userId, taskId, text.trim(), parent],
  )

  const groupTitle = await getGroupTitle(groupId)
  try {
    await sendTaskCommentMail({
      groupId,
      groupTitle,
      taskId,
      taskTitle: task.course_title,
      commentText: text.trim(),
      commenterId: req.userId,
      taskCreatorId: task.user_id,
    })
  } catch (err) {
    console.error('task-comment mail failed:', err.message)
  }
  try {
    await notify({
      to: [task.user_id, task.task_manager],
      actorId: req.userId,
      type: 'task_comment',
      text: parent ? 'New Reply' : 'New Comment',
      link: `/groups/${groupId}`,
      objectId: Number(taskId),
      meta: { task: task.course_title, group: groupTitle },
    })
  } catch (err) {
    console.error('task-comment notify failed:', err.message)
  }

  const names = await getDisplayNames([req.userId])
  res.status(201).json({
    id: result.insertId,
    author: names.get(Number(req.userId)) || 'You',
    authorId: Number(req.userId),
    text: text.trim(),
    date: formatDate(new Date()),
    parentId: parent || undefined,
  })
}))

tasksRouter.delete('/:taskId/comments/:commentId', asyncHandler(async (req, res) => {
  const { groupId, taskId, commentId } = req.params
  const task = await getTaskWithOwner(taskId, groupId)
  if (!task) return res.status(404).json({ error: 'Task not found' })

  const [rows] = await pool.query(
    'SELECT * FROM engine4_group_taskcomments WHERE taskcomment_id = ? AND task_id = ? AND assignment_id = 0 LIMIT 1',
    [commentId, taskId],
  )
  if (!rows.length) return res.status(404).json({ error: 'Comment not found' })
  const comment = rows[0]
  if (!canManageTask(task, req.userId) && comment.user_id !== Number(req.userId)) {
    return res.status(403).json({ error: 'You can only delete your own comments' })
  }

  await deleteCommentWithReplies(commentId, taskId)
  res.status(204).end()
}))

tasksRouter.post('/:taskId/assignments', asyncHandler(async (req, res) => {
  const { groupId, taskId } = req.params
  const task = await getTaskInGroup(taskId, groupId)
  if (!task) return res.status(404).json({ error: 'Task not found' })

  const { title, assignee, details } = req.body || {}
  if (!title?.trim()) return res.status(400).json({ error: 'Title is required' })
  if (!assignee) return res.status(400).json({ error: 'An assignee is required' })

  const [result] = await pool.query(
    `INSERT INTO engine4_group_taskprocesses
       (process_title, assignment, status, created_date, task_id, user_id, task_type, assignee_id)
     VALUES (?, ?, 1, NOW(), ?, ?, 1, 0)`,
    [title.trim(), details?.trim() || '', taskId, assignee],
  )
  await pool.query(
    `INSERT INTO engine4_group_processusers (user_id, processe_id, created_date, process_status, task_id)
     VALUES (?, ?, NOW(), 0, ?)`,
    [assignee, result.insertId, taskId],
  )
  await ensureTaskUser(taskId, assignee)

  const groupTitle = await getGroupTitle(groupId)
  try {
    await sendAssignmentCreatedMail({
      groupId,
      groupTitle,
      taskId,
      taskTitle: task.course_title,
      assignmentTitle: title.trim(),
      details: details?.trim() || '',
      creatorId: req.userId,
      assigneeId: assignee,
      taskCreatorId: task.user_id,
      taskManagerId: task.task_manager,
    })
  } catch (err) {
    console.error('assignment mail failed:', err.message)
  }
  try {
    await notify({
      to: [assignee, task.user_id, task.task_manager],
      actorId: req.userId,
      type: 'assignment_created',
      text: 'New Assignment',
      link: `/groups/${groupId}`,
      objectId: Number(taskId),
      meta: { title: title.trim(), task: task.course_title, group: groupTitle },
    })
  } catch (err) {
    console.error('assignment notify failed:', err.message)
  }

  const names = await getDisplayNames([assignee])
  res.status(201).json({
    id: result.insertId,
    title: title.trim(),
    assignee: names.get(Number(assignee)) || 'Unassigned',
    assigneeId: Number(assignee),
    date: formatDate(new Date()),
    done: false,
    details: details?.trim() || '',
    comments: [],
    workedHours: [],
  })
}))

tasksRouter.patch('/:taskId/assignments/:assignmentId', asyncHandler(async (req, res) => {
  const { groupId, taskId, assignmentId } = req.params
  const task = await getTaskInGroup(taskId, groupId)
  if (!task) return res.status(404).json({ error: 'Task not found' })
  const assignment = await getAssignmentInTask(assignmentId, taskId)
  if (!assignment) return res.status(404).json({ error: 'Assignment not found' })
  if (assignment.user_id !== Number(req.userId)) {
    return res.status(403).json({ error: 'Only the person this assignment belongs to can mark it done' })
  }

  const done = !!(req.body || {}).done
  await pool.query(
    `UPDATE engine4_group_processusers
     SET process_status = ?, completed_date = ?
     WHERE processe_id = ?`,
    [done ? 1 : 0, done ? new Date() : null, assignmentId],
  )
  // TODO notifyGroupTaskActivity(otherTaskUsers, groupOwner) — deferred, no email system yet.

  res.json({ id: Number(assignmentId), done })
}))

tasksRouter.delete('/:taskId/assignments/:assignmentId', asyncHandler(async (req, res) => {
  const { groupId, taskId, assignmentId } = req.params
  const task = await getTaskWithOwner(taskId, groupId)
  if (!task) return res.status(404).json({ error: 'Task not found' })
  if (!canManageTask(task, req.userId)) {
    return res.status(403).json({ error: 'Only the task creator or group owner can delete this assignment' })
  }
  const assignment = await getAssignmentInTask(assignmentId, taskId)
  if (!assignment) return res.status(404).json({ error: 'Assignment not found' })

  await pool.query('DELETE FROM engine4_group_taskcomments WHERE assignment_id = ?', [assignmentId])
  await pool.query('DELETE FROM engine4_group_timesheets WHERE assignment_id = ?', [assignmentId])
  await pool.query('DELETE FROM engine4_group_processusers WHERE processe_id = ?', [assignmentId])
  await pool.query('DELETE FROM engine4_group_taskprocesses WHERE taskprocesse_id = ?', [assignmentId])
  res.status(204).end()
}))

tasksRouter.delete('/:taskId/assignments/:assignmentId/comments/:commentId', asyncHandler(async (req, res) => {
  const { groupId, taskId, assignmentId, commentId } = req.params
  const task = await getTaskWithOwner(taskId, groupId)
  if (!task) return res.status(404).json({ error: 'Task not found' })
  const assignment = await getAssignmentInTask(assignmentId, taskId)
  if (!assignment) return res.status(404).json({ error: 'Assignment not found' })

  const [rows] = await pool.query(
    'SELECT * FROM engine4_group_taskcomments WHERE taskcomment_id = ? AND assignment_id = ? LIMIT 1',
    [commentId, assignmentId],
  )
  if (!rows.length) return res.status(404).json({ error: 'Comment not found' })
  const comment = rows[0]
  if (!canManageTask(task, req.userId) && comment.user_id !== Number(req.userId)) {
    return res.status(403).json({ error: 'You can only delete your own comments' })
  }

  await deleteCommentWithReplies(commentId, taskId)
  res.status(204).end()
}))

tasksRouter.post('/:taskId/assignments/:assignmentId/comments', asyncHandler(async (req, res) => {
  const { groupId, taskId, assignmentId } = req.params
  const task = await getTaskInGroup(taskId, groupId)
  if (!task) return res.status(404).json({ error: 'Task not found' })
  const assignment = await getAssignmentInTask(assignmentId, taskId)
  if (!assignment) return res.status(404).json({ error: 'Assignment not found' })

  const { text, parentId } = req.body || {}
  if (!text?.trim()) return res.status(400).json({ error: 'Comment text is required' })

  let parent = 0
  if (parentId) {
    const [parentRows] = await pool.query(
      'SELECT taskcomment_id FROM engine4_group_taskcomments WHERE taskcomment_id = ? AND assignment_id = ? AND parent_id = 0 LIMIT 1',
      [parentId, assignmentId],
    )
    if (!parentRows.length) return res.status(400).json({ error: 'Comment being replied to was not found' })
    parent = parentRows[0].taskcomment_id
  }

  const [result] = await pool.query(
    `INSERT INTO engine4_group_taskcomments
       (user_id, task_id, assignment_id, comment, comment_status, created_date, parent_id, sub_parent_id)
     VALUES (?, ?, ?, ?, 1, NOW(), ?, 0)`,
    [req.userId, taskId, assignmentId, text.trim(), parent],
  )

  try {
    const groupTitle = await getGroupTitle(groupId)
    await notify({
      to: [assignment.user_id, task.user_id, task.task_manager],
      actorId: req.userId,
      type: 'task_comment',
      text: parent ? 'New Reply' : 'New Comment',
      link: `/groups/${groupId}`,
      objectId: Number(taskId),
      meta: { assignment: assignment.process_title, task: task.course_title, group: groupTitle },
    })
  } catch (err) {
    console.error('assignment-comment notify failed:', err.message)
  }

  const names = await getDisplayNames([req.userId])
  res.status(201).json({
    id: result.insertId,
    author: names.get(Number(req.userId)) || 'You',
    authorId: Number(req.userId),
    text: text.trim(),
    date: formatDate(new Date()),
    parentId: parent || undefined,
  })
}))

tasksRouter.post('/:taskId/assignments/:assignmentId/hours', asyncHandler(async (req, res) => {
  const { groupId, taskId, assignmentId } = req.params
  const task = await getTaskInGroup(taskId, groupId)
  if (!task) return res.status(404).json({ error: 'Task not found' })
  const assignment = await getAssignmentInTask(assignmentId, taskId)
  if (!assignment) return res.status(404).json({ error: 'Assignment not found' })

  const { hours, note, date } = req.body || {}
  const hoursNum = Number(hours)
  if (!hoursNum || hoursNum <= 0) return res.status(400).json({ error: 'Hours must be a positive number' })

  const madeDate = date || new Date().toISOString().slice(0, 10)
  const [result] = await pool.query(
    `INSERT INTO engine4_group_timesheets
       (user_id, group_id, hours_worked, assignment_id, task_id, created_date, updated_date, task_made_date, description)
     VALUES (?, ?, ?, ?, ?, NOW(), NOW(), ?, ?)`,
    [req.userId, groupId, hoursNum.toFixed(2), assignmentId, taskId, madeDate, note?.trim() || null],
  )
  // No notification hook — legacy sends no email for timesheets.

  const names = await getDisplayNames([req.userId])
  res.status(201).json({
    id: result.insertId,
    person: names.get(Number(req.userId)) || 'You',
    hours: hoursNum,
    date: formatDate(madeDate),
  })
}))