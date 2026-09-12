import { Router } from "express";
import { pool } from "../db.js";
import { notify } from "../lib/notify.js";
export const messagesRouter = Router();

const PAGE_SIZE = 20;

/* ---------- helpers ---------- */

async function getUnreadCount(userId) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS c
       FROM engine4_messages_recipients r
      WHERE r.user_id = ?
        AND r.inbox_deleted = 0
        AND (r.inbox_read = 0 OR r.inbox_read IS NULL)`,
    [userId]
  );
  return rows[0]?.c || 0;
}

async function otherParticipants(conversationId, viewerId) {
  const [rows] = await pool.query(
    `SELECT u.user_id, u.username, u.displayname
       FROM engine4_messages_recipients r
       JOIN engine4_users u ON u.user_id = r.user_id
      WHERE r.conversation_id = ? AND r.user_id != ?`,
    [conversationId, viewerId]
  );
  return rows;
}

async function isFriend(a, b) {
  const [[row]] = await pool.query(
    `SELECT active FROM engine4_user_membership
      WHERE resource_id = ? AND user_id = ? LIMIT 1`,
    [a, b]
  );
  return !!row?.active;
}

// The friends-only messaging rule lives in engine4_authorization_permissions
// on the live/production DB — local/dev DBs may not have that table at all,
// so this check is cached once per server start and the rule is skipped
// entirely when the table is missing.
let HAS_PERMISSIONS_TABLE = null;
async function hasPermissionsTable() {
  if (HAS_PERMISSIONS_TABLE !== null) return HAS_PERMISSIONS_TABLE;
  try {
    const [rows] = await pool.query("SHOW TABLES LIKE 'engine4_authorization_permissions'");
    HAS_PERMISSIONS_TABLE = rows.length > 0;
  } catch {
    HAS_PERMISSIONS_TABLE = false;
  }
  return HAS_PERMISSIONS_TABLE;
}

async function resolveRecipient(conn, token, viewerId) {
  if (/^\d+$/.test(token)) {
    const [[u]] = await conn.query(
      `SELECT user_id, username FROM engine4_users WHERE user_id = ? AND user_id != ?`,
      [token, viewerId]
    );
    if (u) return u;
  }
  const [[byUsername]] = await conn.query(
    `SELECT user_id, username FROM engine4_users WHERE username = ? AND user_id != ?`,
    [token, viewerId]
  );
  if (byUsername) return byUsername;

  const [matches] = await conn.query(
    `SELECT user_id, username FROM engine4_users
      WHERE displayname LIKE ? AND user_id != ?
      ORDER BY (displayname = ?) DESC, displayname ASC
      LIMIT 1`,
    [`%${token}%`, viewerId, token]
  );
  return matches[0] || null;
}

/* ---------- inbox ---------- */

messagesRouter.get("/inbox", async (req, res) => {
  try {
    const viewerId = req.userId;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const offset = (page - 1) * PAGE_SIZE;

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total
         FROM engine4_messages_recipients r
        WHERE r.user_id = ? AND r.inbox_deleted = 0`,
      [viewerId]
    );

    const [convos] = await pool.query(
      `SELECT c.conversation_id, c.title AS subject, c.locked, c.modified,
              r.inbox_read
         FROM engine4_messages_recipients r
         JOIN engine4_messages_conversations c ON c.conversation_id = r.conversation_id
        WHERE r.user_id = ? AND r.inbox_deleted = 0
        ORDER BY c.modified DESC
        LIMIT ? OFFSET ?`,
      [viewerId, PAGE_SIZE, offset]
    );

    const withMeta = await Promise.all(
      convos.map(async (c) => {
        const others = await otherParticipants(c.conversation_id, viewerId);
        const [[last]] = await pool.query(
          `SELECT body, user_id, date
             FROM engine4_messages_messages
            WHERE conversation_id = ?
            ORDER BY message_id DESC LIMIT 1`,
          [c.conversation_id]
        );
        return {
          id: c.conversation_id,
          subject: c.subject,
          locked: !!c.locked,
          unread: !c.inbox_read,
          from: others.map((o) => o.displayname || o.username).join(", "),
          preview: last?.body?.slice(0, 140) || "",
          time: c.modified,
        };
      })
    );

    res.json({
      conversations: withMeta,
      page,
      pageSize: PAGE_SIZE,
      total,
      pages: Math.ceil(total / PAGE_SIZE),
      unread: await getUnreadCount(viewerId),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Couldn't load inbox." });
  }
});

/* ---------- outbox ---------- */

messagesRouter.get("/outbox", async (req, res) => {
  try {
    const viewerId = req.userId;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const offset = (page - 1) * PAGE_SIZE;

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total
         FROM engine4_messages_recipients r
        WHERE r.user_id = ? AND r.outbox_deleted = 0`,
      [viewerId]
    );

    const [convos] = await pool.query(
      `SELECT c.conversation_id, c.title AS subject, c.locked, c.modified
         FROM engine4_messages_recipients r
         JOIN engine4_messages_conversations c ON c.conversation_id = r.conversation_id
        WHERE r.user_id = ? AND r.outbox_deleted = 0
        ORDER BY c.modified DESC
        LIMIT ? OFFSET ?`,
      [viewerId, PAGE_SIZE, offset]
    );

    const withMeta = await Promise.all(
      convos.map(async (c) => {
        const others = await otherParticipants(c.conversation_id, viewerId);
        return {
          id: c.conversation_id,
          subject: c.subject,
          to: others.map((o) => o.displayname || o.username).join(", "),
          time: c.modified,
        };
      })
    );

    res.json({ conversations: withMeta, page, pageSize: PAGE_SIZE, total, pages: Math.ceil(total / PAGE_SIZE) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Couldn't load sent messages." });
  }
});

/* ---------- view a conversation thread ---------- */

messagesRouter.get("/conversation/:id", async (req, res) => {
  const viewerId = req.userId;
  const { id } = req.params;
  const conn = await pool.getConnection();
  try {
    const [[recipientRow]] = await conn.query(
      `SELECT * FROM engine4_messages_recipients WHERE conversation_id = ? AND user_id = ?`,
      [id, viewerId]
    );
    if (!recipientRow) return res.status(403).json({ error: "Not part of this conversation." });

    const [[convo]] = await conn.query(
      `SELECT * FROM engine4_messages_conversations WHERE conversation_id = ?`,
      [id]
    );
    if (!convo) return res.status(404).json({ error: "Conversation not found." });

    const [messages] = await conn.query(
      `SELECT m.message_id, m.user_id AS owner_id, m.body, m.date,
              u.username, u.displayname
         FROM engine4_messages_messages m
         JOIN engine4_users u ON u.user_id = m.user_id
        WHERE m.conversation_id = ?
        ORDER BY m.message_id ASC`,
      [id]
    );

    const recipients = await otherParticipants(id, viewerId);

    await conn.query(
      `UPDATE engine4_messages_recipients
          SET inbox_read = 1, inbox_updated = NOW()
        WHERE conversation_id = ? AND user_id = ?`,
      [id, viewerId]
    );

    res.json({
      id: convo.conversation_id,
      subject: convo.title,
      locked: !!convo.locked,
      recipients,
      messages: messages.map((m) => ({
        id: m.message_id,
        body: m.body,
        time: m.date,
        from: { id: m.owner_id, name: m.displayname || m.username },
        self: m.owner_id === Number(viewerId),
      })),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Couldn't load conversation." });
  } finally {
    conn.release();
  }
});

/* ---------- reply ---------- */

messagesRouter.post("/conversation/:id/reply", async (req, res) => {
  const viewerId = req.userId;
  const { id } = req.params;
  const { body } = req.body;
  if (!body?.trim()) return res.status(400).json({ error: "Message can't be empty." });

  const conn = await pool.getConnection();
  try {
    const [[convo]] = await conn.query(
      `SELECT * FROM engine4_messages_conversations WHERE conversation_id = ?`,
      [id]
    );
    if (!convo) return res.status(404).json({ error: "Conversation not found." });
    if (convo.locked) return res.status(403).json({ error: "This conversation is locked." });

    const [participants] = await conn.query(
      `SELECT user_id FROM engine4_messages_recipients WHERE conversation_id = ?`,
      [id]
    );
    const isParticipant = participants.some((p) => p.user_id === Number(viewerId));
    if (!isParticipant) return res.status(403).json({ error: "Not part of this conversation." });

    await conn.beginTransaction();

    const [msgResult] = await conn.query(
      `INSERT INTO engine4_messages_messages (conversation_id, user_id, title, body, date)
       VALUES (?, ?, '', ?, NOW())`,
      [id, viewerId, body.trim()]
    );
    const newMessageId = msgResult.insertId;

    await conn.query(
      `UPDATE engine4_messages_conversations SET modified = NOW() WHERE conversation_id = ?`,
      [id]
    );

    await conn.query(
      `UPDATE engine4_messages_recipients
          SET outbox_updated = NOW(), outbox_deleted = 0, outbox_message_id = ?,
              inbox_read = 1, inbox_updated = NOW()
        WHERE conversation_id = ? AND user_id = ?`,
      [newMessageId, id, viewerId]
    );

    await conn.query(
      `UPDATE engine4_messages_recipients
          SET inbox_updated = NOW(), inbox_read = 0, inbox_deleted = 0, inbox_message_id = ?
        WHERE conversation_id = ? AND user_id != ?`,
      [newMessageId, id, viewerId]
    );

    await conn.commit();

    const others = participants.map((p) => p.user_id).filter((uid) => uid !== Number(viewerId));
    await notify({
      to: others,
      actorId: viewerId,
      type: "message_new",
      text: "New Reply",
      link: `/messages?conversation=${id}`,
      objectId: Number(id),
      meta: { title: convo.title },
    });

    res.json({ ok: true });
  } catch (e) {
    await conn.rollback();
    console.error(e);
    res.status(500).json({ error: "Couldn't send reply." });
  } finally {
    conn.release();
  }
});

/* ---------- compose (new conversation) ---------- */

messagesRouter.post("/compose", async (req, res) => {
  const viewerId = req.userId;
  const { to, subject, body } = req.body;
  if (!subject?.trim() || !body?.trim()) {
    return res.status(400).json({ error: "Subject and message are required." });
  }

  let recipientIds = Array.isArray(to) ? to : String(to || "").split(",").map((s) => s.trim());
  recipientIds = [...new Set(recipientIds.filter(Boolean))].slice(0, 10);
  if (recipientIds.length === 0) {
    return res.status(400).json({ error: "Add at least one recipient." });
  }

  const conn = await pool.getConnection();
  try {
    const resolved = await Promise.all(recipientIds.map((t) => resolveRecipient(conn, t, viewerId)));
    const users = [];
    const seen = new Set();
    for (const u of resolved) {
      if (u && !seen.has(u.user_id)) { seen.add(u.user_id); users.push(u); }
    }
    if (users.length === 0) return res.status(400).json({ error: "No valid recipients found." });

    // friends-only check — only runs if the permissions table actually exists
    if (await hasPermissionsTable()) {
      const [[me]] = await conn.query(
        `SELECT level_id FROM engine4_users WHERE user_id = ?`,
        [viewerId]
      );
      const [[perm]] = await conn.query(
        `SELECT params FROM engine4_authorization_permissions
          WHERE level_id = ? AND type = 'messages' AND name = 'auth' LIMIT 1`,
        [me?.level_id]
      );
      if (perm?.params === "friends") {
        for (const u of users) {
          const friends = (await isFriend(viewerId, u.user_id)) || (await isFriend(u.user_id, viewerId));
          if (!friends) {
            return res.status(403).json({ error: `${u.username} is not in your friends list.` });
          }
        }
      }
    }

    await conn.beginTransaction();

    const [convoResult] = await conn.query(
      `INSERT INTO engine4_messages_conversations
         (title, user_id, recipients, modified, locked, resource_type, resource_id)
       VALUES (?, ?, ?, NOW(), 0, '', 0)`,
      [subject.trim(), viewerId, users.length + 1]
    );
    const conversationId = convoResult.insertId;

    const [msgResult] = await conn.query(
      `INSERT INTO engine4_messages_messages (conversation_id, user_id, title, body, date)
       VALUES (?, ?, ?, ?, NOW())`,
      [conversationId, viewerId, subject.trim(), body.trim()]
    );
    const messageId = msgResult.insertId;

    await conn.query(
      `INSERT INTO engine4_messages_recipients
         (user_id, conversation_id, outbox_message_id, outbox_updated, outbox_deleted)
       VALUES (?, ?, ?, NOW(), 0)`,
      [viewerId, conversationId, messageId]
    );

    for (const u of users) {
      await conn.query(
        `INSERT INTO engine4_messages_recipients
           (user_id, conversation_id, inbox_message_id, inbox_updated, inbox_read, inbox_deleted)
         VALUES (?, ?, ?, NOW(), 0, 0)`,
        [u.user_id, conversationId, messageId]
      );
    }

    await conn.commit();

    await notify({
      to: users.map((u) => u.user_id),
      actorId: viewerId,
      type: "message_new",
      text: "New Message",
      link: `/messages?conversation=${conversationId}`,
      objectId: conversationId,
      meta: { title: subject.trim() },
    });

    res.json({ ok: true, conversationId });
  } catch (e) {
    await conn.rollback();
    console.error(e);
    res.status(500).json({ error: "Couldn't send message." });
  } finally {
    conn.release();
  }
});

/* ---------- delete (soft) ---------- */

messagesRouter.post("/delete", async (req, res) => {
  const viewerId = req.userId;
  const { conversationIds, place } = req.body;
  if (!Array.isArray(conversationIds) || conversationIds.length === 0) {
    return res.status(400).json({ error: "No conversations selected." });
  }
  try {
    const column = place === "outbox" ? "outbox_deleted" : "inbox_deleted";
    await pool.query(
      `UPDATE engine4_messages_recipients
          SET ${column} = 1
        WHERE user_id = ? AND conversation_id IN (?)`,
      [viewerId, conversationIds]
    );
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Couldn't delete." });
  }
});

/* ---------- search ---------- */

messagesRouter.get("/search", async (req, res) => {
  const viewerId = req.userId;
  const q = `%${req.query.query || ""}%`;
  try {
    const [rows] = await pool.query(
      `SELECT DISTINCT c.conversation_id, c.title AS subject, c.modified
         FROM engine4_messages_messages m
         JOIN engine4_messages_conversations c ON c.conversation_id = m.conversation_id
         JOIN engine4_messages_recipients r ON r.conversation_id = c.conversation_id
        WHERE r.user_id = ? AND (c.title LIKE ? OR m.body LIKE ?)
        ORDER BY c.modified DESC`,
      [viewerId, q, q]
    );
    res.json({ results: rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Search failed." });
  }
});