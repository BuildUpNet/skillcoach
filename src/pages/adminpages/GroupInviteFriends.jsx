// src/pages/adminpages/GroupInviteFriends.jsx
// Redesign of legacy skillcoach.org/groups/invite/:id  (Invite Friends).
// Same tokens as the rest of the redesign: #19352d → #122721 green, #d99b26 amber, mist #f4f6f3, Manrope.
// Deps: react-router-dom, lucide-react.  Rendered inside AppLayout (navbar + footer already there).

import { useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
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
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Data (verbatim from the legacy page)                               */
/* ------------------------------------------------------------------ */
const GROUP = { id: 34, name: "STD work", description: "Work on Stock Traders Daily" };

const SERVICES = ["facebook", "Gmail", "LinkedIn"];

const FRIENDS = [
  "SIVAREDDY",
  "Zahir Shah",
  "Neetu Pandey",
  "Ravindra Pandey",
  "Kyle Spaulding",
  "saravanan p",
  "zach m",
  "Bijay Joshi",
  "Danilo Visnich",
  "shawn cunningham",
  "Dipesh Jadam",
  "Jessica Jess",
  "Mitchell Holland",
  "Mohit Sharma",
  "Sakthi Veerarajan",
  "Sheik Mohaideen",
  "Mubarak Ali",
  "Soru",
  "Balaji",
  "Vishnu",
  "Mubarak",
  "mubarakalicolan",
  "John",
];

const CONTACT_FILE_TYPES = ["Outlook", "Outlook Express", "Thunderbird", "Other (.csv / .vcf)"];

/* ------------------------------------------------------------------ */
/*  Primitives                                                         */
/* ------------------------------------------------------------------ */
const inputCls =
  "block w-full rounded-xl border border-gray-200/80 bg-white px-4 py-3 text-[15px] text-[#19352d] placeholder:text-[#19352d]/40 focus:border-[#19352d]/40 focus:outline-none focus:ring-2 focus:ring-[#d99b26]/40";

const primaryBtn =
  "inline-flex items-center justify-center gap-2 rounded-full bg-[#d99b26] px-7 py-3 text-[15px] font-bold text-[#122721] shadow-[0_10px_30px_-10px_rgba(217,155,38,0.8)] transition-colors hover:bg-[#e6ab3a] disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#d99b26]/40";

const initials = (n) => n.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

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
/*  1. Import your contacts                                            */
/* ------------------------------------------------------------------ */
function ImportContacts() {
  const [provider, setProvider] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="space-y-6">
      <p className="text-[15px] text-[#19352d]/80">How do you talk to the people you know? Choose a service:</p>

      <div className="flex flex-wrap gap-2">
        {SERVICES.map((s) => {
          const active = provider === s;
          return (
            <button
              key={s}
              type="button"
              onClick={() => setProvider(s)}
              aria-pressed={active}
              className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[15px] font-semibold ring-1 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d99b26] ${
                active ? "bg-[#19352d] text-white ring-[#19352d]" : "bg-white text-[#19352d] ring-gray-200/80 hover:bg-[#f4f6f3]"
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${active ? "bg-[#d99b26]" : "bg-[#19352d]/30"}`} />
              {s}
            </button>
          );
        })}
      </div>

      <div className="space-y-5 border-t border-gray-200/80 pt-6">
        <Field label="Provider" htmlFor="provider">
          <input id="provider" type="text" value={provider} onChange={(e) => setProvider(e.target.value)} className={`${inputCls} sm:max-w-sm`} />
        </Field>
        <Field label="Email" htmlFor="import-email">
          <input id="import-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`${inputCls} sm:max-w-sm`} />
        </Field>
        <Field label="Password" htmlFor="import-password">
          <input id="import-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={`${inputCls} sm:max-w-sm`} />
        </Field>
        <div className="sm:pl-[calc(9rem+1.5rem)]">
          <button type="button" disabled={!provider || !email || !password} className={primaryBtn}>
            <Download className="h-4 w-4" />
            Import Contacts
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  2. Invite members                                                  */
/* ------------------------------------------------------------------ */
function InviteMembers() {
  const [selected, setSelected] = useState([]);
  const [q, setQ] = useState("");
  const [message, setMessage] = useState("");

  const list = useMemo(() => FRIENDS.filter((f) => f.toLowerCase().includes(q.trim().toLowerCase())), [q]);
  const all = selected.length === FRIENDS.length;

  const toggle = (f) => setSelected((s) => (s.includes(f) ? s.filter((x) => x !== f) : [...s, f]));
  const toggleAll = () => setSelected(all ? [] : [...FRIENDS]);

  return (
    <div className="space-y-6">
      <p className="text-[15px] text-[#19352d]/80">Choose the people you want to invite to this group.</p>

      <Field label="Members">
        <div className="rounded-xl border border-gray-200/80 bg-white">
          {/* toolbar */}
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

          {/* list */}
          <ul className="grid max-h-80 grid-cols-1 gap-1 overflow-y-auto p-2 sm:grid-cols-2">
            {list.map((f) => {
              const on = selected.includes(f);
              return (
                <li key={f}>
                  <label className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-[15px] ${on ? "bg-[#19352d] text-white" : "text-[#19352d] hover:bg-[#f4f6f3]"}`}>
                    <input type="checkbox" className="sr-only" checked={on} onChange={() => toggle(f)} />
                    <Checkbox checked={on} />
                    <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold ${on ? "bg-white/15 text-white" : "bg-[#19352d] text-white"}`}>
                      {initials(f)}
                    </span>
                    <span className="truncate font-medium">{f}</span>
                  </label>
                </li>
              );
            })}
            {list.length === 0 && <li className="col-span-full px-3 py-6 text-center text-sm text-[#19352d]/50">No friends match "{q}"</li>}
          </ul>

          <p className="border-t border-gray-200/80 px-4 py-2 text-sm text-[#19352d]/60">
            {selected.length} of {FRIENDS.length} selected
          </p>
        </div>
      </Field>

      <Field label="Message" htmlFor="invite-message">
        <textarea id="invite-message" rows={4} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Write custom message" className={`${inputCls} resize-y leading-7`} />
      </Field>

      <div className="sm:pl-[calc(9rem+1.5rem)]">
        <button type="button" disabled={selected.length === 0} className={primaryBtn}>
          <Send className="h-4 w-4" />
          Send Invitations{selected.length > 0 && ` (${selected.length})`}
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  3. Upload your contacts                                            */
/* ------------------------------------------------------------------ */
function UploadContacts() {
  const [file, setFile] = useState(null);
  const inputRef = useRef(null);

  return (
    <div className="space-y-6">
      <p className="max-w-2xl text-[15px] leading-7 text-[#19352d]/80">
        Upload a contact file and we will tell you which of your contacts are on site and which you can invite to join.
      </p>
      <a href="#" className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-[#8a5f0f] underline underline-offset-4 hover:text-[#19352d]">
        <Info className="h-4 w-4" />
        How to create a contact file...
      </a>

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

      <button type="button" disabled={!file} className={primaryBtn}>
        <Upload className="h-4 w-4" />
        Upload Contacts
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  4. Add single addresses                                            */
/* ------------------------------------------------------------------ */
function SingleAddresses() {
  const [recipients, setRecipients] = useState("");
  const [message, setMessage] = useState(`You are invited to join in group  ${GROUP.name}`);
  const emails = recipients.split(/[\s,;]+/).filter((e) => /\S+@\S+\.\S+/.test(e));

  return (
    <div className="space-y-6">
      <p className="max-w-2xl text-[15px] leading-7 text-[#19352d]/80">
        Invite your friends to join! Enter email addresses separated by commas in the recipients box below. If your friends
        decide to sign up, a friend request from you will be waiting for them when they first sign in.
      </p>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="recipients" className="text-[15px] font-semibold text-[#19352d]">Recipients</label>
          <textarea id="recipients" rows={6} value={recipients} onChange={(e) => setRecipients(e.target.value)} className={`${inputCls} mt-2 resize-y leading-7`} />
          <p className="mt-1.5 text-sm text-[#19352d]/60">
            Comma-separated list, or one-email-per-line.
            {emails.length > 0 && <span className="ml-2 font-semibold text-[#19352d]">{emails.length} valid</span>}
          </p>
        </div>
        <div>
          <label htmlFor="single-message" className="text-[15px] font-semibold text-[#19352d]">Message</label>
          <textarea id="single-message" rows={6} value={message} onChange={(e) => setMessage(e.target.value)} className={`${inputCls} mt-2 resize-y leading-7`} />
        </div>
      </div>

      <button type="button" disabled={emails.length === 0} className={primaryBtn}>
        <Send className="h-4 w-4" />
        Send Invitations
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
const SECTIONS = [
  { id: "import", title: "Import your contacts", icon: Download, body: ImportContacts },
  { id: "members", title: "Invite members", icon: Users, body: InviteMembers },
  { id: "upload", title: "Upload your contacts", icon: Upload, body: UploadContacts },
  { id: "single", title: "Add single addresses", icon: AtSign, body: SingleAddresses },
];

export default function GroupInviteFriends() {
  const { id } = useParams(); // /groups/invite/:id — wire GROUP fetch to this later
  const [open, setOpen] = useState("import"); // one section open at a time, like the legacy page

  return (
    <div className="bg-[#f4f6f3] font-[Manrope,ui-sans-serif,system-ui] text-[#19352d]">
      <div className="mx-auto max-w-5xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        {/* Header */}
        <section className="rounded-3xl bg-gradient-to-br from-[#19352d] to-[#122721] px-6 py-7 text-white shadow-[0_24px_60px_-30px_rgba(18,39,33,0.6)] sm:px-10 sm:py-9">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-white/60">
            <Link to="/projects" className="hover:text-white">Projects</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link to={`/group/${GROUP.id}`} className="hover:text-white">{GROUP.name}</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-white/90">Invite Friends</span>
          </nav>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">Invite Friends</h1>
          <p className="mt-2 text-base text-white/75 sm:text-lg">Grow {GROUP.name} by inviting the people you know.</p>
        </section>

        {/* Instructions callout */}
        <aside className="mt-8 flex gap-4 rounded-2xl border border-[#d99b26]/40 bg-[#d99b26]/10 p-5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#d99b26] text-[#122721]">
            <Info className="h-5 w-5" />
          </span>
          <p className="text-[15px] leading-7 text-[#19352d]">
            <span className="font-bold">Instructions:</span> Each of the invitations options below should be used separately.
            When you invite your contacts, they will receive an email with a custom message from you, and they will be able to
            use that to join your group.
          </p>
        </aside>

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
