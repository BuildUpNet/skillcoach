import { Router } from 'express'
import { pool } from '../db.js'
import { asyncHandler, getDisplayNames } from '../lib/groupUtils.js'
import {
  getOfficerIds,
  promoteToOfficer,
  demoteOfficer,
  getGroupRole,
  getPrivacySettings,
  setPrivacySetting,
  PRIVACY_ACTIONS,
} from '../lib/groupPermissions.js'

export const groupSettingsRouter = Router({ mergeParams: true })

async function getGroupOwnerId(groupId) {
  const [[group]] = await pool.query('SELECT user_id FROM engine4_group_groups WHERE group_id = ?', [groupId])
  return group?.user_id ?? null
}

function requireOwner(ownerId, userId) {
  return Number(ownerId) === Number(userId)
}

// Everything this group's "Manage" page needs in one call: the viewer's own
// role, the officer list (with display names), and the current privacy dials.
groupSettingsRouter.get('/manage', asyncHandler(async (req, res) => {
  const { groupId } = req.params
  const ownerId = await getGroupOwnerId(groupId)
  if (!ownerId) return res.status(404).json({ error: 'Group not found' })

  const [yourRole, officerIds, privacy] = await Promise.all([
    getGroupRole(groupId, req.userId, ownerId),
    getOfficerIds(groupId),
    getPrivacySettings(groupId),
  ])
  const names = await getDisplayNames(officerIds)

  res.json({
    ownerId,
    yourRole,
    officers: officerIds.map((id) => ({ user_id: id, displayname: names.get(id) || null })),
    privacy,
  })
}))

groupSettingsRouter.post('/officers', asyncHandler(async (req, res) => {
  const { groupId } = req.params
  const { userId } = req.body || {}
  if (!userId) return res.status(400).json({ error: 'userId is required' })

  const ownerId = await getGroupOwnerId(groupId)
  if (!ownerId) return res.status(404).json({ error: 'Group not found' })
  if (!requireOwner(ownerId, req.userId)) return res.status(403).json({ error: 'Only the group owner can promote officers' })
  if (Number(userId) === Number(ownerId)) return res.status(400).json({ error: 'The owner is already in charge of this group' })

  const [[membership]] = await pool.query(
    'SELECT 1 FROM engine4_group_membership WHERE resource_id = ? AND user_id = ? AND active = 1 LIMIT 1',
    [groupId, userId],
  )
  if (!membership) return res.status(400).json({ error: 'Only current members can be made officers' })

  await promoteToOfficer(groupId, userId)
  res.status(204).end()
}))

groupSettingsRouter.delete('/officers/:userId', asyncHandler(async (req, res) => {
  const { groupId, userId } = req.params
  const ownerId = await getGroupOwnerId(groupId)
  if (!ownerId) return res.status(404).json({ error: 'Group not found' })
  if (!requireOwner(ownerId, req.userId)) return res.status(403).json({ error: 'Only the group owner can demote officers' })

  await demoteOfficer(groupId, userId)
  res.status(204).end()
}))

groupSettingsRouter.put('/privacy/:action', asyncHandler(async (req, res) => {
  const { groupId, action } = req.params
  const { minRole } = req.body || {}
  const validRoles = ['everyone', 'registered', 'member', 'officer']

  if (!PRIVACY_ACTIONS.includes(action)) return res.status(400).json({ error: 'Unknown privacy action' })
  if (!validRoles.includes(minRole)) return res.status(400).json({ error: `minRole must be one of ${validRoles.join(', ')}` })

  const ownerId = await getGroupOwnerId(groupId)
  if (!ownerId) return res.status(404).json({ error: 'Group not found' })
  if (!requireOwner(ownerId, req.userId)) return res.status(403).json({ error: 'Only the group owner can change privacy settings' })

  await setPrivacySetting(groupId, action, minRole)
  res.status(204).end()
}))
