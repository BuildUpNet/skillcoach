// src/pages/Messages.jsx
// Redesign of legacy skillcoach.org/messages/*  (My Messages: Inbox · Sent Messages · Compose Message).
// Same tokens as the rest of the redesign: #19352d → #122721 green, #d99b26 amber, mist #f4f6f3, Manrope.
// Deps: react-router-dom, lucide-react.  Rendered inside AppLayout (navbar + footer already there).
//
// Routes (add to AppRoutes.jsx):
//   /messages                              → <Navigate to="/messages/inbox" />
//   /messages/inbox                        → <Messages tab="inbox" />
//   /messages/outbox                       → <Messages tab="outbox" />
//   /messages/outbox/page/:page            → <Messages tab="outbox" />
//   /messages/compose                      → <Messages tab="compose" />
//   /messages/compose/to/:groupId/multi/group → <Messages tab="compose" />   (Message Members from a group)

import { useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  Inbox,
  Send,
  PenSquare,
  Search,
  Lightbulb,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Users,
  X,
  Image as ImageIcon,
  Link2,
  Music,
  Video,
  Check,
  MailOpen,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Dummy data (from the legacy Sent Messages list)                    */
/* ------------------------------------------------------------------ */
const GROUPS = { 34: "STD work" };

const SENT = [
  { id: 1, to: "Bret Delchambre", date: "March 27, 2025", subject: "test", body: "this is just a test - please tell me if you get this" },
  { id: 2, to: "Karthick", date: "December 26, 2023", subject: "I changed use for assignment to Karthick", body: "Karthick, I changed the user on an assignment that was made for Sathish, and the assignment is now yours. he is having trouble finding the text. The assignment is the first assignment in the miscellaneous task. I tried to send you a new comment using the function in skillcoach, but after changing the user and refreshing the page, you still were not available in the 'for field' in the new comment. This is a BUG with skillcoach that will eventually need to be fixed. For now, please find the text for linked, twitter, etc. It seems we are sending some static text and it is not dynamic. Review the assignment please." },
  { id: 3, to: "Harinath Reddy", date: "July 4, 2020", subject: "test", body: "test" },
  { id: 4, to: "shawn cunningham", date: "January 18, 2019", subject: "Made you officer", body: "I made you an officer of the group so you can create tasks and assignments. Whatever you need me to do, post there and I'll get it done." },
  { id: 5, to: "Danilo Visnich", date: "December 22, 2018", subject: "The $18 Loan", body: "Look in the Group for Two Bridges by clicking on Groups. There you will see 'my assignments.' Select that and then click on hours. Type 3.25 (text box requires decimals) in the box, and provide any details you want. Save the hours, and then check the red button. Once you have done this, click submit." },
  { id: 6, to: "Danilo Visnich", date: "December 18, 2018", subject: "Yo", body: "D. Please reply to this test message when you can." },
  { id: 7, to: "2 people", group: true, date: "January 25, 2015", subject: "Design Elements for SkillCoach", body: "Hari: I have brought Kyle on to help us with basic design issues. He will be working as he has time to help us improve our menus, our emails, and our page designs as he sees fit. Please supply him with anything he needs. If he needs something from you he will post it as an assignment in the task. For example, if he needs code from a template he will ask you how to get it or for a copy. Please note, you may supply Kyle with admin login for social engine. If required you may upgrade him to admin and allow him to see socialengine admin so that he can access templates etc. Thanks. Tom." },
  { id: 8, to: "Harinath Reddy", date: "December 21, 2014", subject: "4 new tasks added.", body: "Hari, I have added 4 new tasks. Please do the group menu fixes tasks last. When we finish these tasks we should be able to add users for the first time. I am excited about this!!!" },
  { id: 9, to: "SkillCoach", date: "September 1, 2014", subject: "Important change to our process...", body: "We are significantly behind schedule. The reason we are behind schedule is that we were disorganized. That is my fault because I did not force anyone of you to be organized. That is going to change and I will require everyone to be organized from this point forward. Before, when I assigned tasks, I did so to help you become organized, and I did so in a way that would have prepared you for other assignments if you completed the assignments that were requested in the order that they were assigned to you…" },
  { id: 10, to: "SkillCoach", date: "July 9, 2014", subject: "New Group Member", body: "Hello Everyone: I have added a new group member to our Group, his name is Kyle. He will be creating a template for us for the initial design of the home page, group pages, and probably a few others. He is only creating the template though, it will be up to us to take that template and integrate it into all pages, etc. Please expect some ideas from him in the next few days. I will start to assign tasks to him today." },
  { id: 11, to: "0 people", group: true, date: "May 11, 2013", subject: "want to come?", body: "we are having a food event" },
];

const INBOX = []; // "You have 0 new messages, 0 total"
const PAGE_SIZE = 10;
const MAX_RECIPIENTS = 10;

/* ------------------------------------------------------------------ */
/*  Primitives                                                         */
/* ------------------------------------------------------------------ */
const initials = (n) => n.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

function Avatar({ name, group }) {
  return (
    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#19352d] to-[#122721] text-sm font-bold text-white ring-2 ring-[#d99b26]/30">
      {group ? <Users className="h-5 w-5 text-[#d99b26]" /> : initials(name)}
    </span>
  );
}

const inputCls =
  "block w-full rounded-xl border border-gray-200/80 bg-white px-4 py-3 text-[15px] text-[#19352d] placeholder:text-[#19352d]/40 focus:border-[#19352d]/40 focus:outline-none focus:ring-2 focus:ring-[#d99b26]/40";

const card = "rounded-2xl border border-gray-200/80 bg-white shadow-[0_18px_40px_-28px_rgba(18,39,33,0.45)]";

/* ------------------------------------------------------------------ */
/*  Header + tabs                                                      */
/* ------------------------------------------------------------------ */
const TABS = [
  { key: "inbox", label: "Inbox", icon: Inbox, to: "/messages/inbox", count: INBOX.length },
  { key: "outbox", label: "Sent Messages", icon: Send, to: "/messages/outbox", count: SENT.length },
  { key: "compose", label: "Compose Message", icon: PenSquare, to: "/messages/compose" },
];

function Header({ tab }) {
  return (
    <section className="rounded-3xl bg-gradient-to-br from-[#19352d] to-[#122721] px-6 py-7 text-white shadow-[0_24px_60px_-30px_rgba(18,39,33,0.6)] sm:px-10 sm:py-9">
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">My Messages</h1>
      <p className="mt-2 text-base text-white/75 sm:text-lg">Private messages with members and groups.</p>

      <nav aria-label="Message folders" className="mt-6 inline-flex flex-wrap gap-1 rounded-full bg-white/10 p-1.5 ring-1 ring-white/15">
        {TABS.map(({ key, label, icon: Icon, to, count }) => {
          const active = key === tab;
          return (
            <Link
              key={key}
              to={to}
              aria-current={active ? "page" : undefined}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-[15px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d99b26] ${
                active ? "bg-[#d99b26] text-[#122721]" : "text-white/85 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
              {typeof count === "number" && count > 0 && (
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${active ? "bg-[#122721]/15" : "bg-white/15"}`}>
                  {count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Inbox                                                              */
/* ------------------------------------------------------------------ */
function InboxView() {
  const [q, setQ] = useState("");
  const unread = INBOX.filter((m) => !m.read).length;

  return (
    <div className={`${card} p-6 sm:p-8`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[15px] text-[#19352d]/80">
          You have <span className="font-bold text-[#19352d]">{unread}</span> new messages,{" "}
          <span className="font-bold text-[#19352d]">{INBOX.length}</span> total
        </p>
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#19352d]/45" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search"
            aria-label="Search messages"
            className={`${inputCls} pl-10`}
          />
        </div>
      </div>

      {INBOX.length === 0 ? (
        <div className="mt-8 flex flex-col items-center rounded-2xl border border-dashed border-[#d99b26]/50 bg-[#d99b26]/10 px-6 py-12 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-[#d99b26] text-[#122721]">
            <Lightbulb className="h-6 w-6" />
          </span>
          <p className="mt-4 text-[15px] text-[#19352d]">
            <span className="font-semibold">Tip:</span>{" "}
            <Link to="/messages/compose" className="font-semibold text-[#8a5f0f] underline underline-offset-4 hover:text-[#19352d]">
              Click here
            </Link>{" "}
            to compose a new message!
          </p>
        </div>
      ) : (
        <MessageList items={INBOX} page={1} basePath="/messages/inbox" />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Message list (shared by Inbox + Sent) with select + pagination      */
/* ------------------------------------------------------------------ */
function MessageList({ items, page, basePath }) {
  const [selected, setSelected] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const navigate = useNavigate();

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const current = Math.min(Math.max(1, page), totalPages);
  const slice = items.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const allChecked = slice.length > 0 && slice.every((m) => selected.includes(m.id));

  const toggle = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const toggleAll = () =>
    setSelected((s) => (allChecked ? s.filter((id) => !slice.some((m) => m.id === id)) : [...new Set([...s, ...slice.map((m) => m.id)])]));

  const pageHref = (p) => (p === 1 ? basePath : `${basePath}/page/${p}`);

  const handleDelete = () => {
    // TODO: DELETE /api/messages  { ids: selected }
    alert(`Delete ${selected.length} message(s)`);
    setSelected([]);
  };

  return (
    <div>
      {/* toolbar */}
      <div className="flex flex-col gap-3 rounded-xl bg-[#f4f6f3] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="inline-flex cursor-pointer items-center gap-3 text-[15px] text-[#19352d]">
          <input type="checkbox" className="sr-only" checked={allChecked} onChange={toggleAll} />
          <span className={`grid h-5 w-5 place-items-center rounded-md border-2 ${allChecked ? "border-[#d99b26] bg-[#d99b26] text-[#122721]" : "border-[#19352d]/30 bg-white"}`}>
            {allChecked && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
          </span>
          Select all on this page
        </label>
        <p className="text-sm text-[#19352d]/60">
          Showing {(current - 1) * PAGE_SIZE + 1}–{Math.min(current * PAGE_SIZE, items.length)} of {items.length}
        </p>
      </div>

      {/* rows */}
      <ul className="mt-4 space-y-3">
        {slice.map((m) => {
          const on = selected.includes(m.id);
          const open = expanded === m.id;
          return (
            <li
              key={m.id}
              className={`rounded-2xl border transition-colors ${
                on ? "border-[#19352d] bg-[#19352d]/[0.03]" : "border-gray-200/80 bg-white hover:border-[#19352d]/25"
              }`}
            >
              <div className="flex items-start gap-4 p-4 sm:p-5">
                <label className="mt-3 inline-flex cursor-pointer">
                  <input type="checkbox" className="sr-only" checked={on} onChange={() => toggle(m.id)} aria-label={`Select message ${m.subject}`} />
                  <span className={`grid h-5 w-5 place-items-center rounded-md border-2 ${on ? "border-[#d99b26] bg-[#d99b26] text-[#122721]" : "border-[#19352d]/30 bg-white"}`}>
                    {on && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                  </span>
                </label>

                <Avatar name={m.to} group={m.group} />

                <button
                  type="button"
                  onClick={() => setExpanded(open ? null : m.id)}
                  className="min-w-0 flex-1 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#19352d]/30 rounded-lg"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <p className="text-[15px] font-semibold text-[#19352d]">{m.to}</p>
                    <p className="text-sm text-[#19352d]/55">{m.date}</p>
                  </div>
                  <p className="mt-1 text-base font-semibold text-[#19352d]">{m.subject}</p>
                  <p className={`mt-1 text-[15px] leading-6 text-[#19352d]/70 ${open ? "" : "line-clamp-2"}`}>{m.body}</p>
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      {/* footer: delete + pagination */}
      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={handleDelete}
          disabled={selected.length === 0}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#19352d] px-6 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-[#122721] disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d99b26]"
        >
          <Trash2 className="h-4 w-4" />
          Delete Selected{selected.length > 0 && ` (${selected.length})`}
        </button>

        {totalPages > 1 && (
          <nav aria-label="Pagination" className="inline-flex items-center gap-1 self-end rounded-full border border-gray-200/80 bg-white p-1">
            <button
              type="button"
              disabled={current === 1}
              onClick={() => navigate(pageHref(current - 1))}
              className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-[15px] font-medium text-[#19352d] hover:bg-[#f4f6f3] disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </button>
            {Array.from({ length: totalPages }).map((_, i) => {
              const p = i + 1;
              return (
                <Link
                  key={p}
                  to={pageHref(p)}
                  aria-current={p === current ? "page" : undefined}
                  className={`grid h-9 w-9 place-items-center rounded-full text-[15px] font-semibold ${
                    p === current ? "bg-[#d99b26] text-[#122721]" : "text-[#19352d] hover:bg-[#f4f6f3]"
                  }`}
                >
                  {p}
                </Link>
              );
            })}
            <button
              type="button"
              disabled={current === totalPages}
              onClick={() => navigate(pageHref(current + 1))}
              className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-[15px] font-medium text-[#19352d] hover:bg-[#f4f6f3] disabled:opacity-30"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </nav>
        )}
      </div>
    </div>
  );
}

function SentView({ page }) {
  return (
    <div className={`${card} p-6 sm:p-8`}>
      <div className="mb-6 flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#19352d]/[0.06] text-[#19352d]">
          <MailOpen className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-xl font-bold text-[#19352d]">Sent Messages</h2>
          <p className="text-sm text-[#19352d]/60">{SENT.length} messages</p>
        </div>
      </div>
      <MessageList items={SENT} page={page} basePath="/messages/outbox" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Compose                                                            */
/* ------------------------------------------------------------------ */
const ATTACH = [
  { key: "photo", label: "Add Photo", icon: ImageIcon, placeholder: "Choose a photo to attach" },
  { key: "link", label: "Add Link", icon: Link2, placeholder: "https://" },
  { key: "music", label: "Add Music", icon: Music, placeholder: "Paste a music link" },
  { key: "video", label: "Add Video", icon: Video, placeholder: "Paste a video link" },
];

function ComposeView({ groupId }) {
  const groupName = groupId ? GROUPS[groupId] : null;
  const [recipients, setRecipients] = useState(groupName ? [{ name: groupName, group: true }] : []);
  const [draft, setDraft] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [attach, setAttach] = useState(null);
  const [attachValue, setAttachValue] = useState("");
  const [sending, setSending] = useState(false);
  const navigate = useNavigate();

  const addRecipient = () => {
    const name = draft.trim();
    if (!name || recipients.length >= MAX_RECIPIENTS || recipients.some((r) => r.name === name)) return;
    setRecipients((r) => [...r, { name }]);
    setDraft("");
  };
  const removeRecipient = (name) => setRecipients((r) => r.filter((x) => x.name !== name));

  const canSend = recipients.length > 0 && subject.trim() && message.trim();

  const handleSend = () => {
    setSending(true);
    // TODO: POST /api/messages { recipients, subject, message, attachment }
    setTimeout(() => {
      setSending(false);
      navigate("/messages/outbox");
    }, 800);
  };

  return (
    <div className={`${card} p-6 sm:p-8`}>
      <h2 className="text-2xl font-bold text-[#19352d]">Compose Message</h2>
      <p className="mt-2 max-w-2xl text-[15px] leading-7 text-[#19352d]/70">
        Create your new message with the form below. Your message can be addressed to up to {MAX_RECIPIENTS} recipients.
      </p>

      <div className="mt-8 space-y-6">
        {/* Send To */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[9rem_1fr] sm:gap-6">
          <label htmlFor="sendTo" className="pt-3 text-[15px] font-semibold text-[#19352d]">
            Send To
          </label>
          <div>
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-200/80 bg-white p-2 focus-within:border-[#19352d]/40 focus-within:ring-2 focus-within:ring-[#d99b26]/40">
              {recipients.map((r) => (
                <span
                  key={r.name}
                  className={`inline-flex items-center gap-1.5 rounded-full py-1.5 pl-3 pr-1.5 text-sm font-semibold ${
                    r.group ? "bg-[#d99b26] text-[#122721]" : "bg-[#19352d] text-white"
                  }`}
                >
                  {r.group && <Users className="h-3.5 w-3.5" />}
                  {r.name}
                  <button
                    type="button"
                    onClick={() => removeRecipient(r.name)}
                    aria-label={`Remove ${r.name}`}
                    className="grid h-5 w-5 place-items-center rounded-full hover:bg-black/10"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              {recipients.length < MAX_RECIPIENTS && (
                <input
                  id="sendTo"
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      addRecipient();
                    }
                  }}
                  onBlur={addRecipient}
                  placeholder={recipients.length ? "Add another…" : "Start typing a member's name"}
                  className="min-w-[10rem] flex-1 bg-transparent px-2 py-1.5 text-[15px] text-[#19352d] placeholder:text-[#19352d]/40 focus:outline-none"
                />
              )}
            </div>
            <p className="mt-1.5 text-sm text-[#19352d]/55">
              {recipients.length}/{MAX_RECIPIENTS} recipients · press Enter to add
            </p>
          </div>
        </div>

        {/* Subject */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[9rem_1fr] sm:gap-6">
          <label htmlFor="subject" className="pt-3 text-[15px] font-semibold text-[#19352d]">
            Subject
          </label>
          <input id="subject" type="text" value={subject} onChange={(e) => setSubject(e.target.value)} className={`${inputCls} sm:max-w-lg`} />
        </div>

        {/* Message */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[9rem_1fr] sm:gap-6">
          <label htmlFor="message" className="pt-3 text-[15px] font-semibold text-[#19352d]">
            Message
          </label>
          <div>
            <textarea
              id="message"
              rows={8}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className={`${inputCls} resize-y leading-7`}
            />

            {/* attachments */}
            <div className="mt-3 flex flex-wrap gap-2">
              {ATTACH.map(({ key, label, icon: Icon }) => {
                const active = attach === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setAttach(active ? null : key)}
                    aria-pressed={active}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-[15px] font-medium ring-1 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d99b26] ${
                      active
                        ? "bg-[#19352d] text-white ring-[#19352d]"
                        : "bg-white text-[#19352d] ring-gray-200/80 hover:bg-[#f4f6f3]"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                );
              })}
            </div>
            {attach && (
              <div className="mt-3 flex gap-2">
                <input
                  type={attach === "photo" ? "file" : "url"}
                  accept={attach === "photo" ? "image/*" : undefined}
                  value={attach === "photo" ? undefined : attachValue}
                  onChange={(e) => setAttachValue(attach === "photo" ? e.target.files?.[0]?.name ?? "" : e.target.value)}
                  placeholder={ATTACH.find((a) => a.key === attach).placeholder}
                  className={`${inputCls} file:mr-3 file:rounded-full file:border-0 file:bg-[#19352d] file:px-4 file:py-1.5 file:text-sm file:font-semibold file:text-white`}
                />
                <button type="button" onClick={() => { setAttach(null); setAttachValue(""); }} aria-label="Remove attachment" className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-gray-200/80 text-[#19352d]/60 hover:bg-[#f4f6f3]">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col-reverse gap-3 border-t border-gray-200/80 pt-6 sm:flex-row sm:items-center">
        <Link to="/messages/inbox" className="inline-flex justify-center rounded-full px-6 py-3.5 text-base font-semibold text-[#19352d]/70 hover:bg-[#f4f6f3] hover:text-[#19352d]">
          Cancel
        </Link>
        <button
          type="button"
          onClick={handleSend}
          disabled={!canSend || sending}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#d99b26] px-8 py-3.5 text-base font-bold text-[#122721] shadow-[0_10px_30px_-10px_rgba(217,155,38,0.8)] transition-colors hover:bg-[#e6ab3a] disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#d99b26]/40 sm:ml-auto"
        >
          <Send className="h-4 w-4" />
          {sending ? "Sending…" : "Send Message"}
        </button>
      </div>
    </div>
  );
}


export default function GroupMessages({ tab = "inbox" }) {
  const { page, groupId } = useParams();
  const pageNum = Number(page) || 1;

  const view = useMemo(() => {
    if (tab === "outbox") return <SentView page={pageNum} />;
    if (tab === "compose") return <ComposeView groupId={groupId} />;
    return <InboxView />;
  }, [tab, pageNum, groupId]);

  return (
    <div className="bg-[#f4f6f3] font-[Manrope,ui-sans-serif,system-ui] text-[#19352d]">
      <div className="mx-auto max-w-5xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <Header tab={tab} />
        <div className="mt-8">{view}</div>
      </div>
    </div>
  );
}
