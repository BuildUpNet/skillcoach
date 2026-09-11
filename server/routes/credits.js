// src/server/routes/credits.js
//
// Thin HTTP layer. All rules live in lib/credits.js.

import express from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../auth.js';
import {
  CreditError,
  getBalance,
  getHistory,
  getEarningRules,
  getDailyProgress,
  transfer,
} from '../lib/credits.js';

export const creditsRouter = express.Router();

// requireAuth sets req.userId from the JWT's `sub` claim.
const currentUserId = (req) => req.userId ?? null;

function fail(res, err) {
  if (err instanceof CreditError) {
    return res.status(err.status).json({ error: err.message, code: err.code });
  }
  console.error('[credits]', err);
  return res.status(500).json({
    error: 'Something went wrong.',
    detail: err.code ?? err.message,   // TEMP — remove before deploying
    sql: err.sqlMessage,               // TEMP
  });
}

// GET /api/credits/balance
creditsRouter.get('/balance', requireAuth, async (req, res) => {
  try {
    res.json(await getBalance(currentUserId(req)));
  } catch (err) { fail(res, err); }
});

// GET /api/credits/history?page=1&limit=20
creditsRouter.get('/history', requireAuth, async (req, res) => {
  try {
    res.json(await getHistory(currentUserId(req), {
      page: req.query.page,
      limit: req.query.limit,
      actionId: req.query.actionId,
    }));
  } catch (err) { fail(res, err); }
});

// GET /api/credits/rules — the "how to earn" table. Public on purpose, so it
// can render for signed-out visitors and doubles as a health check.
creditsRouter.get('/rules', async (_req, res) => {
  try {
    res.json(await getEarningRules());
  } catch (err) { fail(res, err); }
});

// GET /api/credits/progress — today's usage against each cap
creditsRouter.get('/progress', requireAuth, async (req, res) => {
  try {
    res.json(await getDailyProgress(currentUserId(req)));
  } catch (err) { fail(res, err); }
});

// GET /api/credits/overview — one call for the whole page
creditsRouter.get('/overview', requireAuth, async (req, res) => {
  try {
    const userId = currentUserId(req);
    const [balance, history, rules] = await Promise.all([
      getBalance(userId),
      getHistory(userId, { page: 1, limit: 10 }),
      getEarningRules(),
    ]);
    res.json({ balance, recent: history.items, rules });
  } catch (err) { fail(res, err); }
});

// GET /api/credits/recipients?q=ali — friends the viewer can send credits to
creditsRouter.get('/recipients', requireAuth, async (req, res) => {
  try {
    const userId = currentUserId(req);
    const q = `%${(req.query.q ?? '').toString().trim()}%`;

    // engine4_user_membership stores friendships as two rows; this reads the
    // viewer's accepted friends. Cross-check against routes/members.js and
    // reuse that query if it differs.
    const [rows] = await pool.query(
      `SELECT u.user_id, u.displayname, u.username, u.photo_id
         FROM engine4_user_membership m
         JOIN engine4_users u ON u.user_id = m.resource_id
        WHERE m.user_id = ? AND m.active = 1 AND m.resource_id <> ?
          AND u.displayname LIKE ?
        ORDER BY u.displayname
        LIMIT 20`,
      [userId, userId, q],
    );

    res.json(rows.map((r) => ({
      id: r.user_id,
      name: r.displayname,
      username: r.username,
      photoId: r.photo_id,
    })));
  } catch (err) { fail(res, err); }
});

// POST /api/credits/send  { recipientId, credits }
creditsRouter.post('/send', requireAuth, async (req, res) => {
  try {
    const { recipientId, credits } = req.body ?? {};
    if (!recipientId) return res.status(400).json({ error: 'Choose someone to send credits to.' });

    const result = await transfer(currentUserId(req), Number(recipientId), credits);

    res.json({
      ok: true,
      message: `${result.sent} credits sent to ${result.recipient.displayname}.`,
      balance: result.balance,
    });
  } catch (err) { fail(res, err); }
});

export default creditsRouter;