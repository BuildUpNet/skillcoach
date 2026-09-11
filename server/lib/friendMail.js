import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_PORT === '465',
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  connectionTimeout: 10_000,
  greetingTimeout: 10_000,
  socketTimeout: 15_000,
})

const FROM = process.env.MAIL_FROM || '"SkillCoach" <noreply@skillcoach.org>'
const APP = () => process.env.APP_URL || 'http://localhost:5173'

function layout(title, body, ctaUrl, ctaText) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#1f2a27">
      <h2 style="color:#22433B">${title}</h2>
      ${body}
      <p style="margin:28px 0">
        <a href="${ctaUrl}" style="background:#22433B;color:#fff;padding:12px 22px;border-radius:10px;text-decoration:none;font-weight:bold">${ctaText}</a>
      </p>
    </div>`
}

async function send(to, mail) {
  if (!to?.email) return
  const info = await transporter.sendMail({ from: FROM, to: to.email, ...mail })
  console.log(`mail sent to ${to.email}:`, info.messageId)
}

// "X sent you a friend request" → recipient
export async function sendFriendRequestMail({ to, from }) {
  await send(to, {
    subject: `${from.displayname} sent you a friend request on SkillCoach`,
    html: layout(
      `Hi ${to.displayname},`,
      `<p><strong>${from.displayname}</strong> wants to add you as a friend on SkillCoach.</p>
       <p>Sign in to accept or decline the request.</p>`,
      `${APP()}/members?tab=requests`,
      'View request',
    ),
  })
}

// accepted / declined → the person who sent the request
export async function sendFriendResponseMail({ to, from, accepted }) {
  await send(to, {
    subject: accepted
      ? `${from.displayname} accepted your friend request`
      : `${from.displayname} declined your friend request`,
    html: layout(
      `Hi ${to.displayname},`,
      accepted
        ? `<p><strong>${from.displayname}</strong> accepted your friend request. You're now friends on SkillCoach.</p>`
        : `<p><strong>${from.displayname}</strong> declined your friend request.</p>`,
      `${APP()}/profile/${from.username || from.user_id}`,
      accepted ? 'View profile' : 'Browse members',
    ),
  })
}

// member report → site support inbox
export async function sendReportMail({ reporter, target, category, description }) {
  const to = process.env.SUPPORT_EMAIL || 'support@skillcoach.org'
  const info = await transporter.sendMail({
    from: FROM,
    to,
    subject: `[Report] ${reporter.displayname} reported ${target.displayname} (${category})`,
    html: layout(
      'Member report',
      `<p><strong>${reporter.displayname}</strong> (#${reporter.user_id}) reported <strong>${target.displayname}</strong> (#${target.user_id}).</p>
       <p><strong>Category:</strong> ${category}</p>
       <p><strong>Details:</strong><br>${description.replace(/</g, '&lt;').replace(/\n/g, '<br>')}</p>`,
      `${APP()}/profile/${target.username || target.user_id}`,
      'View reported profile',
    ),
  })
  console.log(`report mail sent to ${to}:`, info.messageId)
}