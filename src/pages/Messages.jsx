import { useMemo, useState } from "react";
import Icon from "../components/group/icons";

/*  Dummy data:API required*/

function initialsOf(name) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("") || "?";
}

const INBOX_INITIAL = [
  {
    id: "m1",
    from: "Thomas Kee",
    subject: "Welcome to STD work",
    preview:
      "Glad to have you in the group — take a look at the Getting Started lessons when you get a chance, and let me know if anything's unclear.",
    time: "2h ago",
    unread: true,
  },
  {
    id: "m2",
    from: "SkillCoach Team",
    subject: "Your weekly summary is ready",
    preview:
      "You completed 3 lessons this week and joined 1 new group. Keep it up — you're ahead of most of the cohort.",
    time: "Yesterday",
    unread: true,
  },
  {
    id: "m3",
    from: "Priya Nair",
    subject: "Question about the custom filter lesson",
    preview:
      "Hey, quick one — does the filter preset carry over between groups, or do I need to rebuild it each time?",
    time: "2 days ago",
    unread: false,
  },
  {
    id: "m4",
    from: "SkillCoach Team",
    subject: "New badge unlocked: Fast Starter",
    preview:
      "Nice work finishing your first 3 lessons in under a week. Your badge is live on your profile.",
    time: "5 days ago",
    unread: false,
  },
];

const SENT_INITIAL = [
  {
    id: "s1",
    to: "Thomas Kee",
    subject: "Re: Welcome to STD work",
    preview: "Thanks Thomas — starting on the Trend Tracker lessons today.",
    time: "1h ago",
  },
];

const TABS = [
  { id: "inbox", label: "Inbox", icon: "mail" },
  { id: "sent", label: "Sent", icon: "send" },
  { id: "compose", label: "Compose", icon: "edit" },
];


/*  Small pieces */


function Avatar({ name }) {
  return (
    <div className="flex-none w-10 h-10 rounded-full bg-forest-soft text-forest font-bold text-sm flex items-center justify-center">
      {initialsOf(name)}
    </div>
  );
}

function MessageRow({ message, direction, expanded, onToggle }) {
  const person = direction === "inbox" ? message.from : message.to;
  const label = direction === "inbox" ? "From" : "To";

  return (
    <li className="border-b border-line last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-start gap-3 px-5 py-4 text-left hover:bg-mist transition-colors"
      >
        <Avatar name={person} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className={`text-[13px] text-ink/50 ${message.unread ? "font-semibold text-ink/70" : ""}`}>
              {label}: {person}
            </p>
            <span className="text-xs text-ink/40 shrink-0">{message.time}</span>
          </div>
          <p className={`text-[15px] mt-0.5 truncate ${message.unread ? "font-bold text-ink" : "font-medium text-ink/85"}`}>
            {message.subject}
          </p>
          <p className={`text-[13.5px] text-ink/55 mt-1 ${expanded ? "" : "truncate"}`}>{message.preview}</p>
        </div>
        {message.unread && <span className="mt-1.5 w-2 h-2 rounded-full bg-gold shrink-0" aria-label="Unread" />}
      </button>
    </li>
  );
}

function EmptyTip({ text, actionLabel, onAction }) {
  return (
    <div className="m-5 flex items-center gap-3 bg-gold-soft border border-gold/30 rounded-xl px-4 py-3.5">
      <span className="text-lg">💡</span>
      <p className="text-[14px] text-ink/70">
        {text}{" "}
        {actionLabel && (
          <button type="button" onClick={onAction} className="font-semibold text-forest hover:text-gold-deep underline underline-offset-2">
            {actionLabel}
          </button>
        )}
      </p>
    </div>
  );
}

/*  Page */

export default function Messages() {
  const [tab, setTab] = useState("inbox");
  const [inbox, setInbox] = useState(INBOX_INITIAL);
  const [sent, setSent] = useState(SENT_INITIAL);
  const [inboxQuery, setInboxQuery] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [compose, setCompose] = useState({ to: "", subject: "", body: "" });
  const [justSent, setJustSent] = useState(false);

  const unreadCount = inbox.filter((m) => m.unread).length;

  const filteredInbox = useMemo(() => {
    const q = inboxQuery.trim().toLowerCase();
    if (!q) return inbox;
    return inbox.filter(
      (m) =>
        m.from.toLowerCase().includes(q) ||
        m.subject.toLowerCase().includes(q) ||
        m.preview.toLowerCase().includes(q)
    );
  }, [inbox, inboxQuery]);

  const toggleRow = (id, list, setList) => {
    setExpandedId((cur) => (cur === id ? null : id));
    setList((cur) => cur.map((m) => (m.id === id ? { ...m, unread: false } : m)));
  };

  const insertToken = (token) => {
    setCompose((c) => ({ ...c, body: c.body ? `${c.body} ${token}` : token }));
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!compose.to.trim() || !compose.subject.trim()) return;
    const newMessage = {
      id: `s${Date.now()}`,
      to: compose.to.trim(),
      subject: compose.subject.trim(),
      preview: compose.body.trim() || "(no message body)",
      time: "Just now",
    };
    setSent((s) => [newMessage, ...s]);
    setCompose({ to: "", subject: "", body: "" });
    setJustSent(true);
    setTab("sent");
    setTimeout(() => setJustSent(false), 3000);
  };

  const tabPill = (isActive) =>
    `inline-flex items-center gap-2 rounded-full px-4 py-2 text-[14px] font-semibold transition-colors ${
      isActive ? "bg-forest text-white" : "bg-white text-ink/65 border border-line hover:border-gold"
    }`;

  return (
    <div className="max-w-[1400px] mx-auto px-8 py-6">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div>
          <p className="text-gold-deep text-sm font-semibold mb-1">Messages</p>
          <h1 className="text-3xl font-extrabold text-ink">Talk to your coaches and group.</h1>
        </div>
        <button
          type="button"
          onClick={() => setTab("compose")}
          className="inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-[15px] font-bold text-ink shadow-[0_8px_20px_-10px_rgba(217,164,65,.9)] transition-transform hover:-translate-y-px hover:bg-gold-deep hover:text-white"
        >
          <Icon name="edit" className="h-4 w-4" />
          New Message
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map((t) => (
          <button key={t.id} type="button" onClick={() => setTab(t.id)} className={tabPill(tab === t.id)}>
            <Icon name={t.icon} className="h-4 w-4" />
            {t.label}
            {t.id === "inbox" && unreadCount > 0 && (
              <span className="bg-crimson text-white text-[11px] font-bold rounded-full px-1.5 py-px leading-none">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="bg-white border border-line rounded-2xl shadow-sm overflow-hidden">
        {tab === "inbox" && (
          <>
            <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-line flex-wrap">
              <p className="text-[14px] text-ink/60">
                You have <span className="font-semibold text-ink">{unreadCount} new</span> messages,{" "}
                {inbox.length} total
              </p>
              <div className="flex items-center gap-2 bg-mist border border-line rounded-full px-3.5 py-2 w-full sm:w-64">
                <Icon name="search" className="h-4 w-4 text-ink/40 shrink-0" />
                <input
                  type="text"
                  value={inboxQuery}
                  onChange={(e) => setInboxQuery(e.target.value)}
                  placeholder="Search messages"
                  className="bg-transparent outline-none text-sm w-full placeholder-ink/40"
                />
              </div>
            </div>

            {filteredInbox.length === 0 ? (
              inboxQuery ? (
                <p className="text-center text-ink/50 py-14">No messages match &ldquo;{inboxQuery}&rdquo;.</p>
              ) : (
                <EmptyTip
                  text="Your inbox is empty."
                  actionLabel="Compose a new message"
                  onAction={() => setTab("compose")}
                />
              )
            ) : (
              <ul>
                {filteredInbox.map((m) => (
                  <MessageRow
                    key={m.id}
                    message={m}
                    direction="inbox"
                    expanded={expandedId === m.id}
                    onToggle={() => toggleRow(m.id, inbox, setInbox)}
                  />
                ))}
              </ul>
            )}
          </>
        )}

        {tab === "sent" && (
          <>
            <div className="px-5 py-4 border-b border-line">
              <p className="text-[14px] text-ink/60">
                <span className="font-semibold text-ink">{sent.length}</span> sent message
                {sent.length === 1 ? "" : "s"}
              </p>
            </div>
            {sent.length === 0 ? (
              <EmptyTip text="You haven't sent anything yet." actionLabel="Write your first message" onAction={() => setTab("compose")} />
            ) : (
              <ul>
                {sent.map((m) => (
                  <MessageRow
                    key={m.id}
                    message={m}
                    direction="sent"
                    expanded={expandedId === m.id}
                    onToggle={() => setExpandedId((cur) => (cur === m.id ? null : m.id))}
                  />
                ))}
              </ul>
            )}
          </>
        )}

        {tab === "compose" && (
          <form onSubmit={handleSend} className="p-6 max-w-xl">
            <h2 className="text-xl font-bold text-ink mb-1.5">Compose Message</h2>
            <p className="text-[13.5px] text-ink/55 mb-6">
              Your message can be addressed to up to 10 recipients.
            </p>

            {justSent && (
              <div className="mb-5 flex items-center gap-2 bg-forest-soft text-forest text-sm font-medium px-4 py-2.5 rounded-lg">
                <Icon name="check" className="h-4 w-4" />
                Message sent.
              </div>
            )}

            <label className="block mb-4">
              <span className="block text-[13px] font-semibold text-ink/70 mb-1.5">Send To</span>
              <input
                type="text"
                value={compose.to}
                onChange={(e) => setCompose((c) => ({ ...c, to: e.target.value }))}
                placeholder="Name or names, separated by commas"
                required
                className="w-full bg-mist border border-line rounded-lg px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold"
              />
            </label>

            <label className="block mb-4">
              <span className="block text-[13px] font-semibold text-ink/70 mb-1.5">Subject</span>
              <input
                type="text"
                value={compose.subject}
                onChange={(e) => setCompose((c) => ({ ...c, subject: e.target.value }))}
                required
                className="w-full bg-mist border border-line rounded-lg px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold"
              />
            </label>

            <label className="block mb-2">
              <span className="block text-[13px] font-semibold text-ink/70 mb-1.5">Message</span>
              <textarea
                value={compose.body}
                onChange={(e) => setCompose((c) => ({ ...c, body: e.target.value }))}
                rows={5}
                className="w-full bg-mist border border-line rounded-lg px-3.5 py-2.5 text-sm outline-none resize-none focus:ring-2 focus:ring-gold/40 focus:border-gold"
              />
            </label>

            <div className="flex items-center gap-4 mb-6">
              <button
                type="button"
                onClick={() => insertToken("[link]")}
                className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink/55 hover:text-forest"
              >
                <Icon name="link" className="h-4 w-4" />
                Add Link
              </button>
              <button
                type="button"
                onClick={() => insertToken("[music]")}
                className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink/55 hover:text-forest"
              >
                <Icon name="music" className="h-4 w-4" />
                Add Music
              </button>
            </div>

            <button
              type="submit"
              disabled={!compose.to.trim() || !compose.subject.trim()}
              className="inline-flex items-center gap-2 rounded-full bg-gold px-6 py-2.5 text-[15px] font-bold text-ink shadow-[0_8px_20px_-10px_rgba(217,164,65,.9)] transition-transform hover:-translate-y-px hover:bg-gold-deep hover:text-white disabled:opacity-40 disabled:pointer-events-none"
            >
              <Icon name="send" className="h-4 w-4" />
              Send Message
            </button>
          </form>
        )}
      </div>
    </div>
  );
}