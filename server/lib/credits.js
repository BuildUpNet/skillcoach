// src/server/lib/credits.js
//
// Credits service layer. Ported from the legacy SocialEngine Credit module
// (Api/Core.php, Model/Balance.php, Model/DbTable/Logs.php).
//
// Two invariants this file exists to protect:
//   1. Every balance change is accompanied by exactly one log row.
//   2. Both happen inside one transaction, with the balance row locked.
//
// The legacy code did neither, which is how balances drift from history.

import { pool } from '../db.js';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

// Legacy read these per-level from engine4_authorization_permissions
// (credit.max_send / credit.max_received), defaulting to 1500 when unset.
// We have no permissions table wired up yet, so the defaults are the rule.
const DAILY_SEND_LIMIT = Number(process.env.CREDIT_MAX_SEND ?? 1500);
const DAILY_RECEIVE_LIMIT = Number(process.env.CREDIT_MAX_RECEIVED ?? 1500);

// Actions a user may only ever be paid for once, regardless of max_credit.
const ONCE_ONLY = new Set(['signup']);

export class CreditError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.name = 'CreditError';
    this.code = code;
    this.status = status;
  }
}

// ---------------------------------------------------------------------------
// Transaction plumbing
// ---------------------------------------------------------------------------

/**
 * Run fn inside a transaction. If an existing connection is passed in, join
 * that caller's transaction instead of opening a new one — this is how you
 * award credits as part of a larger operation (e.g. inside "create group")
 * so that a failure rolls back both.
 */
async function withConn(conn, fn) {
  if (conn) return fn(conn);

  const c = await pool.getConnection();
  try {
    await c.beginTransaction();
    const result = await fn(c);
    await c.commit();
    return result;
  } catch (err) {
    try { await c.rollback(); } catch { /* connection already dead */ }
    throw err;
  } finally {
    c.release();
  }
}

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

/** Create the balance row if missing, then lock it for the rest of the txn. */
async function ensureBalance(conn, userId) {
  await conn.query(
    'INSERT IGNORE INTO engine4_credit_balances (balance_id) VALUES (?)',
    [userId],
  );
  const [rows] = await conn.query(
    'SELECT * FROM engine4_credit_balances WHERE balance_id = ? FOR UPDATE',
    [userId],
  );
  return rows[0];
}

async function getAction(conn, actionType) {
  const [rows] = await conn.query(
    `SELECT * FROM engine4_credit_actiontypes
      WHERE action_type = ? AND enabled = 1 LIMIT 1`,
    [actionType],
  );
  return rows[0] ?? null;
}

/** Sum of credits already earned for this action inside its rollover window. */
async function usedInWindow(conn, userId, action) {
  if (action.rollover_period > 0) {
    const [rows] = await conn.query(
      `SELECT COALESCE(SUM(credit), 0) AS used
         FROM engine4_credit_logs
        WHERE user_id = ? AND action_id = ?
          AND creation_date > DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [userId, action.action_id, action.rollover_period],
    );
    return Number(rows[0].used);
  }
  const [rows] = await conn.query(
    `SELECT COALESCE(SUM(credit), 0) AS used
       FROM engine4_credit_logs
      WHERE user_id = ? AND action_id = ?`,
    [userId, action.action_id],
  );
  return Number(rows[0].used);
}

/** Has this user already been paid for this exact object? */
async function alreadyPaidFor(conn, userId, actionId, objectType, objectId) {
  const [rows] = await conn.query(
    `SELECT log_id FROM engine4_credit_logs
      WHERE user_id = ? AND action_id = ? AND object_type = ? AND object_id = ?
      LIMIT 1`,
    [userId, actionId, objectType, objectId],
  );
  return rows.length > 0;
}

async function writeLog(conn, { userId, actionId, credit, objectType = '', objectId = 0, body = null }) {
  const [res] = await conn.query(
    `INSERT INTO engine4_credit_logs
       (user_id, action_id, credit, object_type, object_id, body, creation_date)
     VALUES (?, ?, ?, ?, ?, ?, NOW())`,
    [userId, actionId, credit, objectType, objectId, body],
  );
  return res.insertId;
}

/**
 * Apply a signed delta to the balance.
 * Mirrors Balance::setCredits — current always moves, and the magnitude also
 * accumulates into earned (if positive) or spent (if negative).
 */
async function applyDelta(conn, userId, delta) {
  await conn.query(
    `UPDATE engine4_credit_balances
        SET current_credit = current_credit + ?,
            earned_credit  = earned_credit  + ?,
            spent_credit   = spent_credit   + ?,
            modified_date  = NOW()
      WHERE balance_id = ?`,
    [delta, delta > 0 ? delta : 0, delta < 0 ? -delta : 0, userId],
  );
}

function fail(res, err) {
  if (err instanceof CreditError) {
    return res.status(err.status).json({ error: err.message, code: err.code });
  }
  console.error('[credits]', err);
  return res.status(500).json({ error: 'Something went wrong.' });
}

// ---------------------------------------------------------------------------
// Earning
// ---------------------------------------------------------------------------

/**
 * Award credits for an action. Never throws on "not eligible" — it returns
 * { awarded: 0, reason } so callers can fire-and-forget without try/catch
 * around every business action.
 *
 *   await award(userId, 'group_create', { objectType: 'group', objectId: id });
 *
 * opts.count      – multiplier (bulk uploads); default 1
 * opts.objectType – what earned it, also used for duplicate prevention
 * opts.objectId   – ditto
 * opts.body       – free text shown in the history row
 * opts.conn       – join an existing transaction
 */
async function readBalance(conn, userId) {
  const [rows] = await conn.query(
    'SELECT * FROM engine4_credit_balances WHERE balance_id = ?',
    [userId],
  );
  const b = rows[0];
  return {
    balance_id: userId,
    current_credit: Number(b?.current_credit ?? 0),
    earned_credit: Number(b?.earned_credit ?? 0),
    spent_credit: Number(b?.spent_credit ?? 0),
  };
}
export async function award(userId, actionType, opts = {}) {
  const { count = 1, objectType = '', objectId = 0, body = null, conn = null } = opts;

  if (!userId) return { awarded: 0, reason: 'no_user' };

  return withConn(conn, async (c) => {
    const action = await getAction(c, actionType);
    if (!action) return { awarded: 0, reason: 'unknown_or_disabled_action' };
    if (action.credit <= 0) return { awarded: 0, reason: 'action_awards_nothing' };

    await ensureBalance(c, userId);

    if (ONCE_ONLY.has(actionType)) {
      const [dup] = await c.query(
        'SELECT log_id FROM engine4_credit_logs WHERE user_id = ? AND action_id = ? LIMIT 1',
        [userId, action.action_id],
      );
      if (dup.length) return { awarded: 0, reason: 'already_awarded' };
    }

    // Replaces the legacy checkJoin()/checkLike() special cases with one rule:
    // you get paid once per (action, object).
    if (objectType && objectId) {
      if (await alreadyPaidFor(c, userId, action.action_id, objectType, objectId)) {
        return { awarded: 0, reason: 'already_awarded' };
      }
    }

    let amount = action.credit * count;

    // Cap. Note this is the INTENDED legacy behaviour — the original
    // getAvailableCredits() had `=` instead of `==` on its signup check and
    // returned early every time, so partial awards never actually happened.
    if (action.max_credit > 0) {
      const used = await usedInWindow(c, userId, action);
      const left = action.max_credit - used;
      if (left <= 0) return { awarded: 0, reason: 'cap_reached' };
      if (left < amount) amount = left;
    }

    await writeLog(c, {
      userId, actionId: action.action_id, credit: amount, objectType, objectId, body,
    });
    await applyDelta(c, userId, amount);

    return { awarded: amount, reason: 'ok', balance: await readBalance(c, userId) };
  });
}

// ---------------------------------------------------------------------------
// Spending
// ---------------------------------------------------------------------------

/**
 * Deduct credits. Unlike award(), this THROWS when it can't proceed — a failed
 * spend must stop whatever the user was buying.
 */
export async function spend(userId, actionType, amount, opts = {}) {
  const { objectType = '', objectId = 0, body = null, conn = null } = opts;

  const cost = Math.trunc(Number(amount));
  if (!Number.isFinite(cost) || cost <= 0) {
    throw new CreditError('INVALID_AMOUNT', 'Amount must be a positive whole number.');
  }

  return withConn(conn, async (c) => {
    const action = await getAction(c, actionType);
    if (!action) throw new CreditError('UNKNOWN_ACTION', `No credit action type "${actionType}".`, 500);

    const balance = await ensureBalance(c, userId);
    if (balance.current_credit < cost) {
      throw new CreditError('INSUFFICIENT_CREDIT', 'You do not have enough credits.');
    }

    const logId = await writeLog(c, {
      userId, actionId: action.action_id, credit: -cost, objectType, objectId, body,
    });
    await applyDelta(c, userId, -cost);

    return { spent: cost, logId, balance: await readBalance(c, userId) };
  });
}

/** Refund a spend (legacy cancelOrder): returns credit and unwinds spent_credit. */
export async function refund(userId, amount, opts = {}) {
  const { body = null, conn = null } = opts;
  const value = Math.trunc(Number(amount));
  if (value <= 0) throw new CreditError('INVALID_AMOUNT', 'Refund must be positive.');

  return withConn(conn, async (c) => {
    const action = await getAction(c, 'cancel_order');
    await ensureBalance(c, userId);

    await writeLog(c, { userId, actionId: action.action_id, credit: value, body });
    // Deliberately not applyDelta: a refund should not inflate earned_credit.
    await c.query(
      `UPDATE engine4_credit_balances
          SET current_credit = current_credit + ?,
              spent_credit   = GREATEST(spent_credit - ?, 0),
              modified_date  = NOW()
        WHERE balance_id = ?`,
      [value, value, userId],
    );

    return { refunded: value, balance: await readBalance(c, userId) };
  });
}

// ---------------------------------------------------------------------------
// Transfers
// ---------------------------------------------------------------------------

async function movedInLastDay(conn, userId, actionType) {
  const [rows] = await conn.query(
    `SELECT COALESCE(SUM(ABS(l.credit)), 0) AS total
       FROM engine4_credit_logs l
       JOIN engine4_credit_actiontypes a ON a.action_id = l.action_id
      WHERE l.user_id = ? AND a.action_type = ?
        AND l.creation_date > DATE_SUB(NOW(), INTERVAL 1 DAY)`,
    [userId, actionType],
  );
  return Number(rows[0].total);
}

/**
 * Move credits between two members. Writes the legacy paired rows: a negative
 * transfer_to on the sender and a positive transfer_from on the recipient.
 *
 * kind: 'gift'  → transfer_to / transfer_from        (member sends credits)
 *       'notes' → transfer_to_bynotes / transfer_from_bynotes  (paying for notes)
 */
export async function transfer(senderId, recipientId, amount, opts = {}) {
  const { kind = 'gift', conn = null } = opts;

  const value = Math.trunc(Number(amount));
  if (!Number.isFinite(value) || value <= 0) {
    throw new CreditError('INVALID_AMOUNT', 'Enter a positive number of credits.');
  }
  if (Number(senderId) === Number(recipientId)) {
    throw new CreditError('SELF_TRANSFER', 'You cannot send credits to yourself.');
  }

  const [toType, fromType] = kind === 'notes'
    ? ['transfer_to_bynotes', 'transfer_from_bynotes']
    : ['transfer_to', 'transfer_from'];

  return withConn(conn, async (c) => {
    const toAction = await getAction(c, toType);
    const fromAction = await getAction(c, fromType);
    if (!toAction || !fromAction) {
      throw new CreditError('UNKNOWN_ACTION', 'Transfer action types are missing.', 500);
    }

    const [recipient] = await c.query(
      'SELECT user_id, displayname FROM engine4_users WHERE user_id = ? LIMIT 1',
      [recipientId],
    );
    if (!recipient.length) {
      throw new CreditError('NO_RECIPIENT', 'That member does not exist.', 404);
    }

    // Lock in a stable order so two simultaneous opposite transfers can't deadlock.
    const [first, second] = senderId < recipientId ? [senderId, recipientId] : [recipientId, senderId];
    await ensureBalance(c, first);
    await ensureBalance(c, second);

    const senderBalance = await readBalance(c, senderId);
    if (senderBalance.current_credit < value) {
      throw new CreditError('INSUFFICIENT_CREDIT', 'You do not have enough credits.');
    }

    // Rolling 24h caps, only for member-to-member gifts.
    if (kind === 'gift') {
      const sentToday = await movedInLastDay(c, senderId, 'transfer_to');
      if (sentToday + value > DAILY_SEND_LIMIT) {
        throw new CreditError('SEND_LIMIT', 'You have reached your daily sending limit.');
      }
      const receivedToday = await movedInLastDay(c, recipientId, 'transfer_from');
      if (receivedToday + value > DAILY_RECEIVE_LIMIT) {
        throw new CreditError('RECEIVE_LIMIT', 'This member has reached their daily receiving limit.');
      }
    }

    await writeLog(c, {
      userId: senderId, actionId: toAction.action_id, credit: -value,
      objectType: 'user', objectId: recipientId,
      body: recipient[0].displayname,
    });
    await applyDelta(c, senderId, -value);

    await writeLog(c, {
      userId: recipientId, actionId: fromAction.action_id, credit: value,
      objectType: 'user', objectId: senderId,
    });
    await applyDelta(c, recipientId, value);

    return {
      sent: value,
      recipient: recipient[0],
      balance: await readBalance(c, senderId),
    };
  });
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

/** Add credits with no cap and no throttle (legacy giveCredits). */
export async function giveCredits(userId, amount, opts = {}) {
  const { conn = null } = opts;
  const value = Math.trunc(Number(amount));
  if (!Number.isFinite(value) || value === 0) {
    throw new CreditError('INVALID_AMOUNT', 'Enter a non-zero number of credits.');
  }

  return withConn(conn, async (c) => {
    const action = await getAction(c, 'give_credits');
    await ensureBalance(c, userId);
    await writeLog(c, { userId, actionId: action.action_id, credit: value });
    await applyDelta(c, userId, value);
    return { balance: await readBalance(c, userId) };
  });
}

/**
 * Overwrite a balance to an absolute figure (legacy setCredits).
 * Logs the delta but leaves earned/spent lifetime totals alone — that is
 * intentional in the original and keeps admin corrections out of user stats.
 */
export async function setBalance(userId, credits, opts = {}) {
  const { conn = null } = opts;
  const target = Math.trunc(Number(credits));
  if (!Number.isFinite(target) || target < 0) {
    throw new CreditError('INVALID_AMOUNT', 'Balance must be zero or more.');
  }

  return withConn(conn, async (c) => {
    const action = await getAction(c, 'set_credits');
    const balance = await ensureBalance(c, userId);
    const delta = target - balance.current_credit;

    await writeLog(c, {
      userId, actionId: action.action_id, credit: delta, body: String(target),
    });
    await c.query(
      `UPDATE engine4_credit_balances
          SET current_credit = ?, modified_date = NOW()
        WHERE balance_id = ?`,
      [target, userId],
    );

    return { balance: await readBalance(c, userId) };
  });
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export async function getBalance(userId) {
  const [rows] = await pool.query(
    'SELECT * FROM engine4_credit_balances WHERE balance_id = ?',
    [userId],
  );
  const b = rows[0];
  const current = b ? Number(b.current_credit) : 0;

  // Rank = how many members sit above you, plus one.
  const [[{ ahead }]] = await pool.query(
    'SELECT COUNT(*) AS ahead FROM engine4_credit_balances WHERE current_credit > ?',
    [current],
  );

  return {
    current,
    earned: b ? Number(b.earned_credit) : 0,
    spent: b ? Number(b.spent_credit) : 0,
    rank: Number(ahead) + 1,
  };
}

/** Paginated transaction history for one user, newest first. */
export async function getHistory(userId, { page = 1, limit = 20, actionId = null } = {}) {
  const size = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const current = Math.max(Number(page) || 1, 1);
  const offset = (current - 1) * size;

  const where = ['l.user_id = ?'];
  const params = [userId];
  if (actionId) {
    where.push('l.action_id = ?');
    params.push(actionId);
  }
  const clause = where.join(' AND ');

  const [rows] = await pool.query(
    `SELECT l.log_id, l.credit, l.object_type, l.object_id, l.body, l.creation_date,
            a.action_type, a.action_name, a.action_module, a.group_type
       FROM engine4_credit_logs l
       JOIN engine4_credit_actiontypes a ON a.action_id = l.action_id
      WHERE ${clause}
      ORDER BY l.log_id DESC
      LIMIT ? OFFSET ?`,
    [...params, size, offset],
  );

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM engine4_credit_logs l WHERE ${clause}`,
    params,
  );

  return {
    items: rows.map((r) => ({
      id: r.log_id,
      credit: Number(r.credit),
      label: r.action_name || r.action_type,
      actionType: r.action_type,
      module: r.action_module,
      groupType: r.group_type,
      objectType: r.object_type || null,
      objectId: r.object_id || null,
      body: r.body,
      date: r.creation_date,
    })),
    page: current,
    limit: size,
    total: Number(total),
    pages: Math.ceil(Number(total) / size),
  };
}

/** The FAQ table: every way to earn, grouped by module. */
export async function getEarningRules() {
  const [rows] = await pool.query(
    `SELECT action_type, action_name, action_module, credit, max_credit, rollover_period
       FROM engine4_credit_actiontypes
      WHERE enabled = 1 AND credit > 0 AND action_module IS NOT NULL
      ORDER BY action_module ASC, credit DESC`,
  );

  const groups = new Map();
  for (const r of rows) {
    if (!groups.has(r.action_module)) groups.set(r.action_module, []);
    groups.get(r.action_module).push({
      actionType: r.action_type,
      label: r.action_name,
      credit: Number(r.credit),
      maxCredit: Number(r.max_credit),
      rolloverDays: Number(r.rollover_period),
    });
  }

  return [...groups].map(([module, actions]) => ({ module, actions }));
}

/**
 * How much of each cap the user has used today — lets the UI show
 * "18 / 100 earned today" instead of silently paying nothing.
 */
export async function getDailyProgress(userId) {
  const [rows] = await pool.query(
    `SELECT a.action_type, a.action_name, a.max_credit, a.rollover_period,
            COALESCE(SUM(l.credit), 0) AS used
       FROM engine4_credit_actiontypes a
       LEFT JOIN engine4_credit_logs l
              ON l.action_id = a.action_id
             AND l.user_id = ?
             AND (a.rollover_period = 0
                  OR l.creation_date > DATE_SUB(NOW(), INTERVAL a.rollover_period DAY))
      WHERE a.enabled = 1 AND a.credit > 0 AND a.action_module IS NOT NULL
      GROUP BY a.action_id
      ORDER BY a.action_module, a.credit DESC`,
    [userId],
  );

  return rows.map((r) => ({
    actionType: r.action_type,
    label: r.action_name,
    used: Number(r.used),
    max: Number(r.max_credit),
    rolloverDays: Number(r.rollover_period),
  }));
}