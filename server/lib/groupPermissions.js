import { pool } from '../db.js'

// --- Officers (group-scoped co-manager tier) --------------------------------
// Mirrors the legacy mechanism exactly: a generic "list" (engine4_group_lists)
// owned by the group, with one listitem per officer user_id — this is real
// legacy schema, not an additive table, so it stays compatible if this
// backend ever points at the live DB.
const OFFICER_LIST_TITLE = 'GROUP_OFFICERS'

async function getOfficerListId(groupId) {
  const [[existing]] = await pool.query(
    'SELECT list_id FROM engine4_group_lists WHERE owner_id = ? AND title = ?',
    [groupId, OFFICER_LIST_TITLE],
  )
  return existing?.list_id || null
}

async function ensureOfficerListId(groupId) {
  const existing = await getOfficerListId(groupId)
  if (existing) return existing
  const [result] = await pool.query(
    'INSERT INTO engine4_group_lists (title, owner_id, child_count) VALUES (?, ?, 0)',
    [OFFICER_LIST_TITLE, groupId],
  )
  return result.insertId
}

export async function getOfficerIds(groupId) {
  const listId = await getOfficerListId(groupId)
  if (!listId) return []
  const [rows] = await pool.query('SELECT child_id FROM engine4_group_listitems WHERE list_id = ?', [listId])
  return rows.map((r) => r.child_id)
}

export async function isOfficer(groupId, userId) {
  const ids = await getOfficerIds(groupId)
  return ids.includes(Number(userId))
}

export async function promoteToOfficer(groupId, userId) {
  const listId = await ensureOfficerListId(groupId)
  const [[existing]] = await pool.query(
    'SELECT listitem_id FROM engine4_group_listitems WHERE list_id = ? AND child_id = ?',
    [listId, userId],
  )
  if (existing) return
  await pool.query('INSERT INTO engine4_group_listitems (list_id, child_id) VALUES (?, ?)', [listId, userId])
  await pool.query('UPDATE engine4_group_lists SET child_count = child_count + 1 WHERE list_id = ?', [listId])
}

export async function demoteOfficer(groupId, userId) {
  const listId = await getOfficerListId(groupId)
  if (!listId) return
  const [result] = await pool.query(
    'DELETE FROM engine4_group_listitems WHERE list_id = ? AND child_id = ?',
    [listId, userId],
  )
  if (result.affectedRows) {
    await pool.query('UPDATE engine4_group_lists SET child_count = GREATEST(child_count - 1, 0) WHERE list_id = ?', [listId])
  }
}

// A user's standing in one group: 'owner' | 'officer' | 'member' | 'registered'.
export async function getGroupRole(groupId, userId, ownerId) {
  if (Number(userId) === Number(ownerId)) return 'owner'
  if (await isOfficer(groupId, userId)) return 'officer'
  const [[membership]] = await pool.query(
    'SELECT 1 FROM engine4_group_membership WHERE resource_id = ? AND user_id = ? AND active = 1 LIMIT 1',
    [groupId, userId],
  )
  return membership ? 'member' : 'registered'
}

const ROLE_RANK = { registered: 0, everyone: 0, member: 1, officer: 2, owner: 3 }
export function roleRank(role) {
  return ROLE_RANK[role] ?? 0
}

// --- Privacy dials ----------------------------------------------------------
// Legacy stores these as rows in the generic engine4_authorization_allow ACL
// table (one row per role per action, evaluated like a real Zend_Acl). That
// table's primary key includes `role`, so a clean "minimum role" cutoff (what
// the Manage Group UI actually wants — one dropdown per action) doesn't map
// onto it without re-implementing full ACL resolution. Rather than half-fake
// that, this uses a small purpose-built additive table (same pattern as
// engine4_group_group_photos) that directly stores the cutoff value.
export const PRIVACY_ACTIONS = ['view', 'comment', 'photo', 'event', 'invite']
const DEFAULT_MIN_ROLE = 'member'

export async function getPrivacySettings(groupId) {
  const [rows] = await pool.query('SELECT action, min_role FROM engine4_group_privacy WHERE group_id = ?', [groupId])
  const map = Object.fromEntries(rows.map((r) => [r.action, r.min_role]))
  return Object.fromEntries(PRIVACY_ACTIONS.map((a) => [a, map[a] || DEFAULT_MIN_ROLE]))
}

export async function setPrivacySetting(groupId, action, minRole) {
  await pool.query(
    `INSERT INTO engine4_group_privacy (group_id, action, min_role) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE min_role = VALUES(min_role)`,
    [groupId, action, minRole],
  )
}

// True if a user of `role` may perform `action`, per this group's privacy
// settings (defaults to 'member' if never configured).
export async function isAllowedByPrivacy(groupId, action, role) {
  const settings = await getPrivacySettings(groupId)
  return roleRank(role) >= roleRank(settings[action])
}
