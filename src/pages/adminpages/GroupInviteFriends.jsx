// src/pages/adminpages/GroupInviteFriends.jsx
// Redesign of legacy skillcoach.org/groups/invite/:id  (Invite Friends).
// Same tokens as the rest of the redesign: #19352d → #122721 green, #d99b26 amber, mist #f4f6f3, Manrope.
// Deps: react-router-dom, lucide-react.  Rendered inside AppLayout (navbar + footer already there).
//
// Wired to the real backend for three of the four sections:
//  - "Invite Members" lists this account's real friends (the same
//    relationship legacy's Group_MemberController::inviteAction() reads via
//    $viewer->membership()->getMembers()) who aren't already in the group,
//    and sends real invites via POST /members/invite-user.
//  - "Add Single Addresses" sends real by-email invites — this is exactly
//    what the existing POST /members/invite endpoint already does.
//  - "Import your contacts" redirects to server/routes/contactsImport.js for
//    a fresh Google/Facebook OAuth consent (contacts.readonly / user_friends
//    — the login flow's stored token doesn't have that scope), matches
//    returned emails against engine4_users, and invites by user id or email.
//    Facebook only ever returns friends who also use this app — a Graph API
//    platform limit since v2.0, not something this code can widen.
// "Upload your contacts" (parsing an exported contacts file) has no backend
// behind it — no file-parsing importer exists in this rebuild — so it stays
// static/cosmetic. LinkedIn import was intentionally left out.

import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  ChevronDown,
  ChevronRight,
  Check,
  Info,
  Download,
  Users,
  Upload,
  AtSign,
  Search,
  Send,
  FileText,
  Mail,
  Loader2,
  X,
} from "lucide-react";
import {
  getGroup,
  getGroupMembers,
  getGroupInvites,
  getMembers,
  inviteMemberById,
  inviteMember,
  cancelInvite,
  googleContactsImportUrl,
  facebookContactsImportUrl,
  getImportedContacts,
} from "../../lib/api";

const CONTACT_FILE_TYPES = ["Outlook", "Outlook Express", "Thunderbird", "Other (.csv / .vcf)"];
const MAX_FRIEND_PAGES = 10; // sane cap while paging through /api/members

/* ------------------------------------------------------------------ */
/*  Primitives                                                         */
/* ------------------------------------------------------------------ */
const inputCls =
  "block w-full rounded-xl border border-gray-200/80 bg-white px-4 py-3 text-[15px] text-[#19352d] placeholder:text-[#19352d]/40 focus:border-[#19352d]/40 focus:outline-none focus:ring-2 focus:ring-[#d99b26]/40";

const primaryBtn =
  "inline-flex items-center justify-center gap-2 rounded-full bg-[#d99b26] px-7 py-3 text-[15px] font-bold text-[#122721] shadow-[0_10px_30px_-10px_rgba(217,155,38,0.8)] transition-colors hover:bg-[#e6ab3a] disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#d99b26]/40";

const initials = (n) => (n || "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

function Field({ label, htmlFor, children, hint }) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-[9rem_1fr] sm:items-start sm:gap-6">
      <label htmlFor={htmlFor} className="pt-3 text-[15px] font-semibold text-[#19352d]">
        {label}
      </label>
      <div>
        {children}
        {hint && <p className="mt-1.5 text-sm text-[#19352d]/60">{hint}</p>}
      </div>
    </div>
  );
}

function Checkbox({ checked }) {
  return (
    <span
      className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 ${
        checked ? "border-[#d99b26] bg-[#d99b26] text-[#122721]" : "border-[#19352d]/30 bg-white"
      }`}
    >
      {checked && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
    </span>
  );
}

function ResultBanner({ result }) {
  if (!result) return null;
  const tone = result.failed.length
    ? "border-amber-300 bg-amber-50 text-amber-900"
    : "border-emerald-300 bg-emerald-50 text-emerald-900";
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm leading-6 ${tone}`}>
      {result.sent.length > 0 && <p>Invited: {result.sent.join(", ")}</p>}
      {result.failed.length > 0 && (
        <p className="mt-1">
          Couldn't invite: {result.failed.map((f) => `${f.label} (${f.error})`).join(", ")}
        </p>
      )}
    </div>
  );
}

/** Accordion section — header is the green bar, body only renders when open. */
function Section({ id, title, icon: Icon, open, onToggle, children }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-[0_18px_40px_-28px_rgba(18,39,33,0.45)]">
      <h2>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={`${id}-panel`}
          className={`flex w-full items-center justify-between gap-4 px-6 py-4 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#d99b26] ${
            open ? "bg-gradient-to-r from-[#19352d] to-[#142e27] text-white" : "bg-white text-[#19352d] hover:bg-[#f4f6f3]"
          }`}
        >
          <span className="flex items-center gap-3">
            <span className={`grid h-9 w-9 place-items-center rounded-lg ${open ? "bg-[#d99b26] text-[#122721]" : "bg-[#19352d]/[0.06] text-[#19352d]"}`}>
              <Icon className="h-4 w-4" />
            </span>
            <span className="text-base font-bold uppercase tracking-wide sm:text-lg">{title}</span>
          </span>
          <ChevronDown className={`h-5 w-5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </h2>
      {open && (
        <div id={`${id}-panel`} className="border-t border-gray-200/80 p-6 sm:p-8">
          {children}
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  1. Import your contacts — real Google/Facebook OAuth               */
/* ------------------------------------------------------------------ */
function ImportContacts({ groupId, excludeIds, imported, importError }) {
  const [selected, setSelected] = useState([]);
  const [q, setQ] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  const contacts = useMemo(
    () => (imported?.contacts || []).filter((c) => !(c.userId && excludeIds.has(c.userId))),
    [imported, excludeIds],
  );
  const list = useMemo(
    () => contacts.filter((c) => c.name.toLowerCase().includes(q.trim().toLowerCase()) || c.email.toLowerCase().includes(q.trim().toLowerCase())),
    [contacts, q],
  );
  const all = contacts.length > 0 && selected.length === contacts.length;
  const toggle = (email) => setSelected((s) => (s.includes(email) ? s.filter((x) => x !== email) : [...s, email]));
  const toggleAll = () => setSelected(all ? [] : contacts.map((c) => c.email));

  const handleSend = async () => {
    setSending(true);
    setResult(null);
    const sent = [];
    const failed = [];
    for (const email of selected) {
      const c = contacts.find((x) => x.email === email);
      try {
        if (c.userId) await inviteMemberById(groupId, c.userId);
        else await inviteMember(groupId, c.email);
        sent.push(c.name || c.email);
      } catch (err) {
        failed.push({ label: c?.name || email, error: err.message || "failed" });
      }
    }
    setSelected([]);
    setResult({ sent, failed });
    setSending(false);
  };

  return (
    <div className="space-y-6">
      <p className="text-[15px] text-[#19352d]/80">How do you talk to the people you know? Choose a service:</p>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => { window.location.href = googleContactsImportUrl(groupId); }}
          className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[15px] font-semibold text-[#19352d] ring-1 ring-gray-200/80 transition-colors hover:bg-[#f4f6f3]"
        >
          <span className="h-2 w-2 rounded-full bg-[#d99b26]" />
          Gmail
        </button>
        <button
          type="button"
          onClick={() => { window.location.href = facebookContactsImportUrl(groupId); }}
          className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[15px] font-semibold text-[#19352d] ring-1 ring-gray-200/80 transition-colors hover:bg-[#f4f6f3]"
        >
          <span className="h-2 w-2 rounded-full bg-[#d99b26]" />
          Facebook
        </button>
      </div>

      <p className="rounded-xl border border-dashed border-[#19352d]/20 bg-[#f4f6f3] px-4 py-3 text-sm text-[#19352d]/60">
        <Info className="mr-1.5 inline h-4 w-4 align-text-bottom" />
        Gmail brings in your Google contacts directly. Facebook only returns friends who have also signed into
        SkillCoach with Facebook — that's a platform limit Meta applies to every app, not something we can widen.
      </p>

      {importError && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{importError}</p>
      )}

      {imported && (
        contacts.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[#19352d]/20 bg-[#f4f6f3] px-4 py-6 text-center text-sm text-[#19352d]/60">
            No invitable contacts came back from {imported.source === "google" ? "Gmail" : "Facebook"}.
          </p>
        ) : (
          <>
            <div className="rounded-xl border border-gray-200/80 bg-white">
              <div className="flex flex-col gap-3 border-b border-gray-200/80 p-3 sm:flex-row sm:items-center sm:justify-between">
                <label className="inline-flex cursor-pointer items-center gap-3 px-1 text-[15px] font-semibold text-[#19352d]">
                  <input type="checkbox" className="sr-only" checked={all} onChange={toggleAll} />
                  <Checkbox checked={all} />
                  Choose All
                </label>
                <div className="relative sm:w-64">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#19352d]/45" />
                  <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search contacts" className={`${inputCls} py-2.5 pl-10`} />
                </div>
              </div>

              <ul className="grid max-h-80 grid-cols-1 gap-1 overflow-y-auto p-2 sm:grid-cols-2">
                {list.map((c) => {
                  const on = selected.includes(c.email);
                  return (
                    <li key={c.email}>
                      <label className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-[15px] ${on ? "bg-[#19352d] text-white" : "text-[#19352d] hover:bg-[#f4f6f3]"}`}>
                        <input type="checkbox" className="sr-only" checked={on} onChange={() => toggle(c.email)} />
                        <Checkbox checked={on} />
                        <span className="min-w-0 flex-1 truncate">
                          <span className="block truncate font-medium">{c.name}</span>
                          <span className={`block truncate text-[13px] ${on ? "text-white/70" : "text-[#19352d]/55"}`}>{c.email}</span>
                        </span>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11.5px] font-bold uppercase tracking-wide ${on ? "bg-white/15" : c.userId ? "bg-emerald-100 text-emerald-800" : "bg-[#19352d]/[0.06] text-[#19352d]/60"}`}>
                          {c.userId ? "On SkillCoach" : "By email"}
                        </span>
                      </label>
                    </li>
                  );
                })}
                {list.length === 0 && <li className="col-span-full px-3 py-6 text-center text-sm text-[#19352d]/50">No contacts match "{q}"</li>}
              </ul>

              <p className="border-t border-gray-200/80 px-4 py-2 text-sm text-[#19352d]/60">
                {selected.length} of {contacts.length} selected
              </p>
            </div>

            <ResultBanner result={result} />

            <button type="button" onClick={handleSend} disabled={selected.length === 0 || sending} className={primaryBtn}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {sending ? "Sending…" : `Import & Invite${selected.length > 0 ? ` (${selected.length})` : ""}`}
            </button>
          </>
        )
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  2. Invite members — real friends, real invite                      */
/* ------------------------------------------------------------------ */
function InviteMembers({ groupId, excludeIds }) {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [q, setQ] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const all = [];
      let page = 1;
      let pages = 1;
      do {
        const res = await getMembers({ page });
        all.push(...res.members.filter((m) => m.relation === "friends"));
        pages = res.pages;
        page += 1;
      } while (page <= pages && page <= MAX_FRIEND_PAGES);
      if (!cancelled) {
        setFriends(all.filter((f) => !excludeIds.has(f.id)));
        setLoading(false);
      }
    })().catch(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [excludeIds]);

  const list = useMemo(() => friends.filter((f) => f.name.toLowerCase().includes(q.trim().toLowerCase())), [friends, q]);
  const all = friends.length > 0 && selected.length === friends.length;

  const toggle = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const toggleAll = () => setSelected(all ? [] : friends.map((f) => f.id));

  const handleSend = async () => {
    setSending(true);
    setResult(null);
    const sent = [];
    const failed = [];
    for (const id of selected) {
      const friend = friends.find((f) => f.id === id);
      try {
        await inviteMemberById(groupId, id);
        sent.push(friend?.name || `#${id}`);
      } catch (err) {
        failed.push({ label: friend?.name || `#${id}`, error: err.message || "failed" });
      }
    }
    setFriends((f) => f.filter((x) => !sent.includes(x.name) || failed.some((e) => e.label === x.name)));
    setSelected([]);
    setResult({ sent, failed });
    setSending(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10 text-[#19352d]/50">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-[15px] text-[#19352d]/80">Choose the people you want to invite to this group.</p>

      {friends.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[#19352d]/20 bg-[#f4f6f3] px-4 py-6 text-center text-sm text-[#19352d]/60">
          You have no friends who can be invited — either add friends first, or everyone you're friends with is
          already in this group.
        </p>
      ) : (
        <>
          <Field label="Members">
            <div className="rounded-xl border border-gray-200/80 bg-white">
              <div className="flex flex-col gap-3 border-b border-gray-200/80 p-3 sm:flex-row sm:items-center sm:justify-between">
                <label className="inline-flex cursor-pointer items-center gap-3 px-1 text-[15px] font-semibold text-[#19352d]">
                  <input type="checkbox" className="sr-only" checked={all} onChange={toggleAll} />
                  <Checkbox checked={all} />
                  Choose All Friends
                </label>
                <div className="relative sm:w-64">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#19352d]/45" />
                  <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search friends" className={`${inputCls} py-2.5 pl-10`} />
                </div>
              </div>

              <ul className="grid max-h-80 grid-cols-1 gap-1 overflow-y-auto p-2 sm:grid-cols-2">
                {list.map((f) => {
                  const on = selected.includes(f.id);
                  return (
                    <li key={f.id}>
                      <label className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-[15px] ${on ? "bg-[#19352d] text-white" : "text-[#19352d] hover:bg-[#f4f6f3]"}`}>
                        <input type="checkbox" className="sr-only" checked={on} onChange={() => toggle(f.id)} />
                        <Checkbox checked={on} />
                        <span className={`grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full text-xs font-bold ${on ? "bg-white/15 text-white" : "bg-[#19352d] text-white"}`}>
                          {f.avatar ? <img src={f.avatar} alt="" className="h-full w-full object-cover" /> : initials(f.name)}
                        </span>
                        <span className="truncate font-medium">{f.name}</span>
                      </label>
                    </li>
                  );
                })}
                {list.length === 0 && <li className="col-span-full px-3 py-6 text-center text-sm text-[#19352d]/50">No friends match "{q}"</li>}
              </ul>

              <p className="border-t border-gray-200/80 px-4 py-2 text-sm text-[#19352d]/60">
                {selected.length} of {friends.length} selected
              </p>
            </div>
          </Field>

          <ResultBanner result={result} />

          <div className="sm:pl-[calc(9rem+1.5rem)]">
            <button type="button" onClick={handleSend} disabled={selected.length === 0 || sending} className={primaryBtn}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {sending ? "Sending…" : `Send Invitations${selected.length > 0 ? ` (${selected.length})` : ""}`}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  3. Upload your contacts — no file-parsing backend exists            */
/* ------------------------------------------------------------------ */
function UploadContacts() {
  const [file, setFile] = useState(null);
  const inputRef = useRef(null);

  return (
    <div className="space-y-6">
      <p className="max-w-2xl text-[15px] leading-7 text-[#19352d]/80">
        Upload a contact file and we will tell you which of your contacts are on site and which you can invite to join.
      </p>
      <p className="rounded-xl border border-dashed border-[#19352d]/20 bg-[#f4f6f3] px-4 py-3 text-sm text-[#19352d]/60">
        <Info className="mr-1.5 inline h-4 w-4 align-text-bottom" />
        Contact-file parsing isn't wired up yet — this needs a backend importer for Outlook/Thunderbird/CSV exports
        that hasn't been built.
      </p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_auto] lg:items-start">
        <div>
          <p className="text-[15px] font-semibold text-[#19352d]">Add Contacts File</p>
          <input ref={inputRef} type="file" accept=".csv,.vcf,.txt" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          <div className="mt-2 flex flex-col items-start gap-3 rounded-xl border-2 border-dashed border-[#19352d]/20 bg-[#f4f6f3] p-5 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-full border border-[#19352d]/20 bg-white px-5 py-2.5 text-[15px] font-semibold text-[#19352d] hover:border-[#19352d]/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d99b26]"
            >
              <Upload className="h-4 w-4" />
              Choose File
            </button>
            <p className="flex items-center gap-1.5 text-[15px] text-[#19352d]/60">
              <FileText className="h-4 w-4" />
              {file ? file.name : "No file chosen"}
            </p>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#19352d]/55">Supported exports</p>
          <ul className="mt-2 flex flex-wrap gap-2 lg:flex-col">
            {CONTACT_FILE_TYPES.map((t) => (
              <li key={t} className="inline-flex items-center gap-2 rounded-full bg-[#19352d]/[0.06] px-3.5 py-1.5 text-sm font-medium text-[#19352d]">
                <Mail className="h-3.5 w-3.5 text-[#d99b26]" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <button type="button" disabled className={primaryBtn}>
        <Upload className="h-4 w-4" />
        Upload Contacts
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  4. Add single addresses — real by-email invite                     */
/* ------------------------------------------------------------------ */
function SingleAddresses({ groupId, groupName }) {
  const [recipients, setRecipients] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const emails = recipients.split(/[\s,;]+/).filter((e) => /\S+@\S+\.\S+/.test(e));

  const handleSend = async () => {
    setSending(true);
    setResult(null);
    const sent = [];
    const failed = [];
    for (const email of emails) {
      try {
        await inviteMember(groupId, email);
        sent.push(email);
      } catch (err) {
        failed.push({ label: email, error: err.message || "failed" });
      }
    }
    setResult({ sent, failed });
    if (!failed.length) setRecipients("");
    setSending(false);
  };

  return (
    <div className="space-y-6">
      <p className="max-w-2xl text-[15px] leading-7 text-[#19352d]/80">
        Invite your friends to join {groupName}! Enter email addresses separated by commas, spaces, or one per line.
        Each address must already have a SkillCoach account.
      </p>

      <div>
        <label htmlFor="recipients" className="text-[15px] font-semibold text-[#19352d]">Recipients</label>
        <textarea id="recipients" rows={6} value={recipients} onChange={(e) => setRecipients(e.target.value)} className={`${inputCls} mt-2 resize-y leading-7`} />
        <p className="mt-1.5 text-sm text-[#19352d]/60">
          Comma-separated list, or one-email-per-line.
          {emails.length > 0 && <span className="ml-2 font-semibold text-[#19352d]">{emails.length} valid</span>}
        </p>
      </div>

      <ResultBanner result={result} />

      <button type="button" onClick={handleSend} disabled={emails.length === 0 || sending} className={primaryBtn}>
        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {sending ? "Sending…" : "Send Invitations"}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  5. Pending invites — same cancel-invite feature the old, simpler   */
/*     group/Invite.jsx page had; kept here so nothing is lost now     */
/*     that this page is what the sidebar's "Invite" link opens.       */
/* ------------------------------------------------------------------ */
function PendingInvites({ groupId, invites, onCancelled }) {
  const [cancelingId, setCancelingId] = useState(null);

  const handleCancel = async (invite) => {
    setCancelingId(invite.id);
    try {
      await cancelInvite(groupId, invite.id);
      onCancelled(invite.id);
    } catch {
      // leave it in the list — user can retry
    } finally {
      setCancelingId(null);
    }
  };

  if (!invites.length) return null;

  return (
    <section className="mt-6 overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-[0_18px_40px_-28px_rgba(18,39,33,0.45)]">
      <div className="px-6 py-4 sm:px-8">
        <h2 className="text-base font-bold uppercase tracking-wide text-[#19352d] sm:text-lg">
          Pending invites ({invites.length})
        </h2>
      </div>
      <ul className="divide-y divide-gray-200/80 border-t border-gray-200/80">
        {invites.map((inv) => (
          <li key={inv.id} className="flex items-center justify-between gap-3 px-6 py-3.5 sm:px-8">
            <span className="text-[15px] font-medium text-[#19352d]">{inv.email}</span>
            <div className="flex items-center gap-3">
              <span className="text-[13px] italic text-[#19352d]/50">Sent {inv.sentDate}</span>
              <button
                type="button"
                disabled={cancelingId === inv.id}
                onClick={() => handleCancel(inv)}
                className="inline-flex items-center gap-1 rounded-full border border-gray-200/80 px-2.5 py-1 text-[12px] font-semibold text-[#19352d]/50 transition-colors hover:border-red-400 hover:text-red-600 disabled:opacity-50"
              >
                <X className="h-3 w-3" /> Cancel
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function GroupInviteFriends() {
  const { id: groupId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [open, setOpen] = useState("members"); // real, working section opens first
  const [group, setGroup] = useState(null);
  const [excludeIds, setExcludeIds] = useState(null);
  const [invites, setInvites] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [imported, setImported] = useState(null);
  const [importError, setImportError] = useState("");

  useEffect(() => {
    let cancelled = false;
    Promise.all([getGroup(groupId), getGroupMembers(groupId), getGroupInvites(groupId)])
      .then(([g, members, invites]) => {
        if (cancelled) return;
        setGroup(g);
        setInvites(invites);
        setExcludeIds(new Set([...members.map((m) => m.id), ...invites.map((i) => i.id)]));
      })
      .catch((err) => !cancelled && setLoadError(err.message || "Could not load this group"));
    return () => {
      cancelled = true;
    };
  }, [groupId]);

  const handleInviteCancelled = (userId) => {
    setInvites((list) => list.filter((i) => i.id !== userId));
    setExcludeIds((ids) => {
      const next = new Set(ids);
      next.delete(userId);
      return next;
    });
  };

  // returning from the Google/Facebook "import contacts" OAuth redirect
  useEffect(() => {
    const importId = searchParams.get("importId");
    const source = searchParams.get("imported");
    const err = searchParams.get("importError");
    if (!importId && !err) return;

    setOpen("import");
    if (err) setImportError(err);
    if (importId) {
      getImportedContacts(importId)
        .then((r) => setImported({ source, contacts: r.contacts }))
        .catch((e) => setImportError(e.message || "Could not load imported contacts"));
    }
    setSearchParams((p) => { p.delete("importId"); p.delete("imported"); p.delete("importError"); return p; }, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loadError) {
    return (
      <div className="grid min-h-[60vh] place-items-center bg-[#f4f6f3] px-4 text-center">
        <div>
          <p className="text-lg font-semibold text-[#19352d]">{loadError}</p>
          <Link to="/projects" className="mt-3 inline-block text-[#8a5f0f] underline underline-offset-4">
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  if (!group || !excludeIds) {
    return (
      <div className="grid min-h-[60vh] place-items-center bg-[#f4f6f3]">
        <Loader2 className="h-8 w-8 animate-spin text-[#19352d]/40" />
      </div>
    );
  }

  const SECTIONS = [
    { id: "import", title: "Import your contacts", icon: Download, body: () => <ImportContacts groupId={groupId} excludeIds={excludeIds} imported={imported} importError={importError} /> },
    { id: "members", title: "Invite members", icon: Users, body: () => <InviteMembers groupId={groupId} excludeIds={excludeIds} /> },
    { id: "upload", title: "Upload your contacts", icon: Upload, body: () => <UploadContacts /> },
    { id: "single", title: "Add single addresses", icon: AtSign, body: () => <SingleAddresses groupId={groupId} groupName={group.title} /> },
  ];

  return (
    <div className="bg-[#f4f6f3] font-[Manrope,ui-sans-serif,system-ui] text-[#19352d]">
      <div className="mx-auto max-w-5xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        {/* Header */}
        <section className="rounded-3xl bg-gradient-to-br from-[#19352d] to-[#122721] px-6 py-7 text-white shadow-[0_24px_60px_-30px_rgba(18,39,33,0.6)] sm:px-10 sm:py-9">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-white/60">
            <Link to="/projects" className="hover:text-white">Projects</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link to={`/projects/${groupId}`} className="hover:text-white">{group.title}</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-white/90">Invite Friends</span>
          </nav>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">Invite Friends</h1>
          <p className="mt-2 text-base text-white/75 sm:text-lg">Grow {group.title} by inviting the people you know.</p>
        </section>

        {/* Instructions callout */}
        <aside className="mt-8 flex gap-4 rounded-2xl border border-[#d99b26]/40 bg-[#d99b26]/10 p-5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#d99b26] text-[#122721]">
            <Info className="h-5 w-5" />
          </span>
          <p className="text-[15px] leading-7 text-[#19352d]">
            <span className="font-bold">Instructions:</span> Each of the invitations options below should be used separately.
            "Invite members", "Add single addresses" and "Import your contacts" (Gmail/Facebook) send real, working
            invites — "Upload your contacts" needs a file-parsing backend that isn't built yet (see that section for
            details).
          </p>
        </aside>

        <PendingInvites groupId={groupId} invites={invites} onCancelled={handleInviteCancelled} />

        {/* Accordion */}
        <div className="mt-6 space-y-4">
          {SECTIONS.map(({ id: sid, title, icon, body: Body }) => (
            <Section key={sid} id={sid} title={title} icon={icon} open={open === sid} onToggle={() => setOpen(open === sid ? null : sid)}>
              <Body />
            </Section>
          ))}
        </div>
      </div>
    </div>
  );
}
