import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { pool } from './db.js'
import { authRouter } from './routes/auth.js'

const app = express()
app.set('trust proxy', 1)
// credentials:true + an explicit origin (not "*") is required for the
// httpOnly session cookie to be sent/accepted cross-origin
app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'https://skillcoach-pi.vercel.app',
    ],
    credentials: true,
  }),
)

app.use(express.json())
app.use(cookieParser())

app.use('/api/auth', authRouter)
// No auth system yet — every group is created/owned by this fixed user id.
const CURRENT_USER_ID = 1

app.get('/api/health', async (req, res) => {
  const [rows] = await pool.query('SELECT 1 AS ok')
  res.json({ status: 'ok', db: rows[0].ok === 1 })
})

app.get('/api/categories', async (req, res) => {
  const [rows] = await pool.query(
    'SELECT category_id, title FROM engine4_group_categories ORDER BY title',
  )
  res.json(rows)
})

app.get('/api/groups', async (req, res) => {
  const [rows] = await pool.query(
    `SELECT g.*, c.title AS category_title
     FROM engine4_group_groups g
     LEFT JOIN engine4_group_categories c ON c.category_id = g.category_id
     ORDER BY g.creation_date DESC`,
  )
  res.json(rows)
})

app.get('/api/groups/:id', async (req, res) => {
  const [rows] = await pool.query(
    `SELECT g.*, c.title AS category_title
     FROM engine4_group_groups g
     LEFT JOIN engine4_group_categories c ON c.category_id = g.category_id
     WHERE g.group_id = ?`,
    [req.params.id],
  )
  if (!rows.length) return res.status(404).json({ error: 'Group not found' })
  res.json(rows[0])
})

app.post('/api/groups', async (req, res) => {
  const { title, description, category_id, search, invite, approval, summary_emails } = req.body
  if (!title?.trim()) return res.status(400).json({ error: 'title is required' })
  if (!description?.trim()) return res.status(400).json({ error: 'description is required' })

  const [result] = await pool.query(
    `INSERT INTO engine4_group_groups
       (user_id, title, description, category_id, search, invite, approval,
        summary_emails, creation_date, modified_date, member_count, view_count)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), 1, 0)`,
    [
      CURRENT_USER_ID,
      title.trim(),
      description.trim(),
      category_id || 0,
      search ? 1 : 0,
      invite ? 1 : 0,
      approval ? 1 : 0,
      summary_emails ? 1 : 0,
    ],
  )
  // owner is automatically an active/approved member
  await pool.query(
    `INSERT INTO engine4_group_membership (resource_id, user_id, active, resource_approved, user_approved)
     VALUES (?, ?, 1, 1, 1)`,
    [result.insertId, CURRENT_USER_ID],
  )

  const [rows] = await pool.query('SELECT * FROM engine4_group_groups WHERE group_id = ?', [result.insertId])
  res.status(201).json(rows[0])
})

app.put('/api/groups/:id', async (req, res) => {
  const { title, description, category_id, search, invite, approval, summary_emails } = req.body
  if (!title?.trim()) return res.status(400).json({ error: 'title is required' })
  if (!description?.trim()) return res.status(400).json({ error: 'description is required' })

  const [result] = await pool.query(
    `UPDATE engine4_group_groups
     SET title = ?, description = ?, category_id = ?, search = ?, invite = ?,
         approval = ?, summary_emails = ?, modified_date = NOW()
     WHERE group_id = ?`,
    [
      title.trim(),
      description.trim(),
      category_id || 0,
      search ? 1 : 0,
      invite ? 1 : 0,
      approval ? 1 : 0,
      summary_emails ? 1 : 0,
      req.params.id,
    ],
  )
  if (!result.affectedRows) return res.status(404).json({ error: 'Group not found' })

  const [rows] = await pool.query('SELECT * FROM engine4_group_groups WHERE group_id = ?', [req.params.id])
  res.json(rows[0])
})

app.delete('/api/groups/:id', async (req, res) => {
  const [result] = await pool.query('DELETE FROM engine4_group_groups WHERE group_id = ?', [req.params.id])
  if (!result.affectedRows) return res.status(404).json({ error: 'Group not found' })
  await pool.query('DELETE FROM engine4_group_membership WHERE resource_id = ?', [req.params.id])
  res.status(204).end()
})

app.get('/api/groups/:groupId/tasks', async (req, res) => {
  const { groupId } = req.params
  const [tasks] = await pool.query(
    'SELECT * FROM engine4_group_tasks WHERE group_id = ?',
    [groupId],
  )
  const [taskusers] = await pool.query(
    `SELECT tu.* FROM engine4_group_taskusers tu
     JOIN engine4_group_tasks t ON t.task_id = tu.task_id
     WHERE t.group_id = ?`,
    [groupId],
  )
  const tasksWithAssignments = tasks.map((task) => ({
    ...task,
    assignments: taskusers.filter((tu) => tu.task_id === task.task_id),
  }))
  res.json(tasksWithAssignments)
})

const port = process.env.PORT || 4000

if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`API server running on http://localhost:${port}`)
  })
}

export default app
