import express from 'express'
import cors from 'cors'
import { pool } from './db.js'

const app = express()
app.use(cors())

app.get('/api/health', async (req, res) => {
  const [rows] = await pool.query('SELECT 1 AS ok')
  res.json({ status: 'ok', db: rows[0].ok === 1 })
})

app.get('/api/groups', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM engine4_group_groups')
  res.json(rows)
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
app.listen(port, () => console.log(`API server running on http://localhost:${port}`))
