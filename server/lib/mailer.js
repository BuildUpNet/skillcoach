import nodemailer from "nodemailer";
import { pool } from "../db.js";
import { createNotifications } from "./notify.js";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_PORT === "465",
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  connectionTimeout: 10_000,
  greetingTimeout: 10_000,
  socketTimeout: 15_000,
});

const FROM = process.env.MAIL_FROM || '"SkillCoach" <noreply@skillcoach.org>';
const APP = () => process.env.APP_URL || "http://localhost:5173";

// ---------- helpers ----------

// email + displayname for a list of user ids — de-duplicated, blank emails dropped
export async function getUserContacts(userIds) {
  const ids = [...new Set(userIds.filter(Boolean).map(Number))];
  if (!ids.length) return [];
  const [rows] = await pool.query(
    "SELECT user_id, email, displayname FROM engine4_users WHERE user_id IN (?)",
    [ids],
  );
  return rows.filter((r) => r.email);
}

function layout(title, body, ctaUrl, ctaText) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#1f2a27">
      <h2 style="color:#22433B">${title}</h2>
      ${body}
      <p style="margin:28px 0">
        <a href="${ctaUrl}" style="background:#22433B;color:#fff;padding:12px 22px;border-radius:10px;text-decoration:none;font-weight:bold">${ctaText}</a>
      </p>
    </div>`;
}

async function sendOne(to, mail) {
  const info = await transporter.sendMail({ from: FROM, to, ...mail });
  console.log(`mail sent to ${to}:`, info.messageId);
}

// one mail per recipient (a failure for one never blocks the others),
// then one in-app notification row per recipient
async function sendMany(recipients, buildMail, notify) {
  for (const r of recipients) {
    try {
      await sendOne(r.email, buildMail(r));
    } catch (err) {
      console.error(`mail to ${r.email} failed:`, err.message);
    }
  }
  if (notify) {
    try {
      await createNotifications({
        ...notify,
        // never notify the person who performed the action
        userIds: recipients.map((r) => r.user_id).filter((id) => id !== Number(notify.actorId)),
      });
    } catch (err) {
      console.error("notification insert failed:", err.message);
    }
  }
}

// ---------- group created -> owner ----------

export async function sendGroupCreatedMail({ to, displayName, groupTitle, groupId }) {
  await sendOne(to, {
    subject: `Your group "${groupTitle}" has been created`,
    html: layout(
      `Hi ${displayName},`,
      `<p>Your group <strong>${groupTitle}</strong> is now live on SkillCoach.</p>
       <p>You're the owner, so you can invite members, edit settings, and approve requests.</p>
       <p style="color:#777;font-size:13px">If you didn't create this group, please contact support.</p>`,
      `${APP()}/projects/${groupId}`,
      "Open your group",
    ),
  });
}

// ---------- task created -> creator + assignee ----------

export async function sendTaskCreatedMail({ groupId, groupTitle, taskId, taskTitle, taskDescription, creatorId, assigneeId }) {
  const [creator] = await getUserContacts([creatorId]);
  const recipients = await getUserContacts([creatorId, assigneeId]);
  const url = `${APP()}/projects/${groupId}/tasks/${taskId}`;
  const who = creator?.displayname || "Someone";

  await sendMany(
    recipients,
    (r) => ({
      subject: `New task in ${groupTitle}: ${taskTitle}`,
      html: layout(
        `Hi ${r.displayname},`,
        `<p>${r.user_id === Number(assigneeId) ? "A task has been assigned to you" : "You created a task"} in <strong>${groupTitle}</strong>.</p>
         <p style="font-size:17px"><strong>${taskTitle}</strong></p>
         <div style="padding:12px 16px;background:#f4f6f5;border-radius:10px">${taskDescription || ""}</div>
         <p style="color:#777;font-size:13px">Created by ${who}</p>`,
        url,
        "Open task",
      ),
    }),
    { actorId: creatorId, groupId, type: "task_created", text: `${who} assigned you a task: "${taskTitle}" in ${groupTitle}`, link: `/projects/${groupId}/tasks/${taskId}` },
  );
}

// ---------- comment on task -> commenter + task creator ----------

export async function sendTaskCommentMail({ groupId, groupTitle, taskId, taskTitle, commentText, commenterId, taskCreatorId }) {
  const [commenter] = await getUserContacts([commenterId]);
  const recipients = await getUserContacts([commenterId, taskCreatorId]);
  const url = `${APP()}/projects/${groupId}/tasks/${taskId}`;
  const who = commenter?.displayname || "Someone";

  await sendMany(
    recipients,
    (r) => ({
      subject: `New comment on "${taskTitle}"`,
      html: layout(
        `Hi ${r.displayname},`,
        `<p><strong>${who}</strong> commented on <strong>${taskTitle}</strong> in ${groupTitle}:</p>
         <blockquote style="margin:0;padding:12px 16px;background:#f4f6f5;border-left:4px solid #D9A441;border-radius:6px">${commentText}</blockquote>`,
        url,
        "View comment",
      ),
    }),
    { actorId: commenterId, groupId, type: "task_comment", text: `${who} commented on "${taskTitle}"`, link: `/projects/${groupId}/tasks/${taskId}` },
  );
}

// ---------- assignment created -> assignee + creator + task creator + task manager ----------

export async function sendAssignmentCreatedMail({ groupId, groupTitle, taskId, taskTitle, assignmentTitle, details, creatorId, assigneeId, taskCreatorId, taskManagerId }) {
  const [creator] = await getUserContacts([creatorId]);
  const recipients = await getUserContacts([assigneeId, creatorId, taskCreatorId, taskManagerId]);
  const url = `${APP()}/projects/${groupId}/tasks/${taskId}`;
  const who = creator?.displayname || "Someone";

  await sendMany(
    recipients,
    (r) => ({
      subject: `New assignment in "${taskTitle}": ${assignmentTitle}`,
      html: layout(
        `Hi ${r.displayname},`,
        `<p>${r.user_id === Number(assigneeId) ? "An assignment has been given to you" : "A new assignment was added"} under task <strong>${taskTitle}</strong> in ${groupTitle}.</p>
         <p style="font-size:17px"><strong>${assignmentTitle}</strong></p>
         <div style="padding:12px 16px;background:#f4f6f5;border-radius:10px">${details || ""}</div>
         <p style="color:#777;font-size:13px">Created by ${who}</p>`,
        url,
        "Open task",
      ),
    }),
    { actorId: creatorId, groupId, type: "assignment_created", text: `${who} added assignment "${assignmentTitle}" in "${taskTitle}"`, link: `/projects/${groupId}/tasks/${taskId}` },
  );
}

// ---------- group invite -> invited user ----------

export async function sendGroupInviteMail({ to, userId, displayName, inviterId, inviterName, groupTitle, groupId }) {
  const who = inviterName || "Someone";
  await sendOne(to, {
    subject: `${who} invited you to join "${groupTitle}"`,
    html: layout(
      `Hi ${displayName},`,
      `<p><strong>${who}</strong> has invited you to join the group <strong>${groupTitle}</strong> on SkillCoach.</p>
       <p>Sign in to accept or decline the invitation.</p>`,
      `${APP()}/projects`,
      "View invitation",
    ),
  });
  if (userId) {
    try {
      await createNotifications({ userIds: [userId], actorId: inviterId, groupId, type: "group_invite", text: `${who} invited you to join "${groupTitle}"`, link: "/projects" });
    } catch (err) {
      console.error("notification insert failed:", err.message);
    }
  }
}

// ---------- invite accepted / declined -> group owner ----------

export async function sendInviteResponseMail({ ownerId, memberId, memberName, groupTitle, groupId, accepted }) {
  const [owner] = await getUserContacts([ownerId]);
  if (!owner) return;
  const text = accepted
    ? `${memberName} joined "${groupTitle}"`
    : `${memberName} declined your invite to "${groupTitle}"`;
  await sendOne(owner.email, {
    subject: text,
    html: layout(
      `Hi ${owner.displayname},`,
      accepted
        ? `<p><strong>${memberName}</strong> accepted your invitation and is now a member of <strong>${groupTitle}</strong>.</p>`
        : `<p><strong>${memberName}</strong> declined your invitation to join <strong>${groupTitle}</strong>.</p>`,
      `${APP()}/projects/${groupId}/members`,
      accepted ? "View members" : "Open group",
    ),
  });
  try {
    await createNotifications({ userIds: [ownerId], actorId: memberId, groupId, type: accepted ? "invite_accepted" : "invite_declined", text, link: `/projects/${groupId}/members` });
  } catch (err) {
    console.error("notification insert failed:", err.message);
  }
}