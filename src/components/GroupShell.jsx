// src/components/GroupShell.jsx
// Shared layout for all legacy group/:id admin pages (Create Task, Assigned, ...).
// Header + sidebar + top action bar + modals live here; each page only renders its own content.
// Tokens: #19352d → #122721 green, #d99b26 amber, mist #f4f6f3, Manrope.

import { useState, useRef, useEffect } from "react";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import DeleteGroupModal from "./DeleteGroupModal";
import ShareGroupModal from "./ShareGroupModal";
import {
  Pencil, Trash2, Share2, Mail, UserPlus, Users, Eye, Clock,
  ChevronDown, ChevronRight, RefreshCw, Check, Crown, Shield,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Shared data                                                        */
/* ------------------------------------------------------------------ */
export const GROUP = {
  id: 34,
  name: "STD work",
  category: "Business -- Finance",
  description: "Work on Stock Traders Daily",
  logoText: ["STOCK", "TRADERS", "DAILY"],
  owner: "Thomas Kee",
  officers: ["Rajkumar vivid", "Rajkumar vivid", "Rahath Navith", "djcurr"],
  views: "8,019",
  members: 10,
  updated: "September 4, 2024",
};

const OPTIONS = [
  { label: "Edit Group Details", icon: Pencil, to: `/groups/edit/${GROUP.id}` },
  { label: "Delete Group", icon: Trash2, action: "delete", danger: true },
  { label: "Share Group", icon: Share2, action: "share" },
  { label: "Message Members", icon: Mail, to: `/messages/compose/to/${GROUP.id}/multi/group` },
  { label: "Invite Friends", icon: UserPlus, to: `/groups/invite/${GROUP.id}` },
];

export const MEMBER_VIEWS = [`Members(${GROUP.members})`, "Invite", "Timeline", "Lessons(2)", "Tasks"];

// label → route slug under /group/:id/
export const ACTIONS = [
  { label: "Dashboard",       to: (id) => `/projects/${id}` },
  { label: "My Tasks",        to: (id) => `/projects/${id}/my-tasks` },
  { label: "My Assignments",  to: (id) => `/projects/${id}/my-assignments` },
  { label: "My Timesheet",    to: (id) => `/projects/${id}/my-timesheet` },
  { label: "Create Task",     to: (id) => `/group/${id}/create-task` },
  { label: "Assigned",        to: (id) => `/group/${id}/assigned` },
  { label: "Accepted",        to: (id) => `/group/${id}/accepted` },
  { label: "Ready to Accept", to: (id) => `/group/${id}/ready-to-accept` },
  { label: "Time Summary",    to: (id) => `/group/${id}/time-summary` },
];

/* ------------------------------------------------------------------ */
/*  Primitives                                                         */
/* ------------------------------------------------------------------ */
const initials = (name) =>
  name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

export function Avatar({ name, className = "" }) {
  return (
    <span className={`grid shrink-0 place-items-center rounded-full bg-[#19352d] text-white text-[13px] font-bold ${className}`}>
      {initials(name)}
    </span>
  );
}

/** Accessible custom dropdown (single select). */
export function Dropdown({ value, options, onChange, renderOption, className = "", tone = "light", icon: Icon, label }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const dark = tone === "dark";

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-[15px] font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d99b26]
          ${dark
            ? "bg-white/10 text-white ring-1 ring-white/15 hover:bg-white/15"
            : "bg-white text-[#19352d] border border-gray-200/80 hover:border-[#19352d]/30"}`}
      >
        <span className="flex items-center gap-2 truncate">
          {Icon && <Icon className="h-4 w-4 opacity-70" />}
          {label && <span className="opacity-60">{label}:</span>}
          {renderOption ? renderOption(value) : value}
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <ul role="listbox" className="absolute z-20 mt-2 max-h-72 w-full min-w-[12rem] overflow-y-auto rounded-xl border border-gray-200/80 bg-white p-1.5 shadow-xl">
          {options.map((opt, i) => {
            const val = typeof opt === "string" ? opt : opt.value ?? opt.label;
            const selected = val === value;
            return (
              <li key={`${val}-${i}`} role="option" aria-selected={selected}>
                <button
                  type="button"
                  onClick={() => { onChange(val); setOpen(false); }}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-[15px] text-[#19352d] hover:bg-[#f4f6f3] ${selected ? "bg-[#f4f6f3] font-semibold" : ""}`}
                >
                  <span className="flex items-center gap-2">{renderOption ? renderOption(val) : val}</span>
                  {selected && <Check className="h-4 w-4 text-[#d99b26]" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Header                                                             */
/* ------------------------------------------------------------------ */
function GroupHeader({ crumb }) {
  return (
    <section className="rounded-3xl bg-gradient-to-br from-[#19352d] to-[#122721] px-6 py-7 text-white shadow-[0_24px_60px_-30px_rgba(18,39,33,0.6)] sm:px-10 sm:py-9">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-white/60">
        <Link to="/projects" className="hover:text-white">Projects</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-white/90">{GROUP.name}</span>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-white/90">{crumb}</span>
      </nav>

      <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{GROUP.name.toUpperCase()}</h1>
          <p className="mt-2 text-base text-white/75 sm:text-lg">{GROUP.description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#d99b26] px-3.5 py-1.5 text-sm font-semibold text-[#122721]">
            <Crown className="h-3.5 w-3.5" /> You own this group
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-sm font-medium ring-1 ring-white/15">
            <Users className="h-3.5 w-3.5" /> {GROUP.members} members
          </span>
          <span className="inline-flex items-center rounded-full bg-white/10 px-3.5 py-1.5 text-sm font-medium ring-1 ring-white/15">
            {GROUP.category}
          </span>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Sidebar                                                            */
/* ------------------------------------------------------------------ */
function GroupCard() {
  return (
    <div className="rounded-2xl border border-gray-200/80 bg-white p-6 text-center shadow-[0_18px_40px_-28px_rgba(18,39,33,0.45)]">
      <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-[#19352d] to-[#122721] ring-4 ring-[#d99b26]/30">
        <span className="text-[11px] font-black leading-tight tracking-wider text-white">
          {GROUP.logoText.map((l) => <span key={l} className="block">{l}</span>)}
        </span>
      </div>
      <h2 className="mt-4 text-xl font-bold text-[#19352d]">{GROUP.name}</h2>
      <p className="mt-1 text-[15px] text-[#19352d]/60">{GROUP.category}</p>
      <dl className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-[#f4f6f3] px-3 py-3">
          <dt className="text-xs font-semibold uppercase tracking-wide text-[#19352d]/55">Members</dt>
          <dd className="mt-0.5 text-2xl font-extrabold text-[#19352d]">{GROUP.members}</dd>
        </div>
        <div className="rounded-xl bg-[#f4f6f3] px-3 py-3">
          <dt className="text-xs font-semibold uppercase tracking-wide text-[#19352d]/55">Views</dt>
          <dd className="mt-0.5 text-2xl font-extrabold text-[#19352d]">{GROUP.views}</dd>
        </div>
      </dl>
    </div>
  );
}

function OptionsList({ activeAction, onAction }) {
  return (
    <nav aria-label="Group options" className="rounded-2xl border border-gray-200/80 bg-white p-3 shadow-[0_18px_40px_-28px_rgba(18,39,33,0.45)]">
      <p className="px-3 pb-2 pt-1 text-sm font-bold uppercase tracking-wide text-[#19352d]/55">Options</p>
      <ul className="space-y-0.5">
        {OPTIONS.map(({ label, icon: Icon, to, action, danger }) => {
          const active = action && action === activeAction;
          const cls = `group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[15px] font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#19352d]/30 ${
            danger ? "text-rose-700 hover:bg-rose-50" : active ? "bg-[#19352d] text-white" : "text-[#19352d] hover:bg-[#f4f6f3]"}`;
          const iconCls = `grid h-9 w-9 place-items-center rounded-lg ${
            danger ? "bg-rose-50 text-rose-600" : active ? "bg-[#d99b26] text-[#122721]" : "bg-[#19352d]/[0.06] text-[#19352d] group-hover:bg-[#d99b26]/20 group-hover:text-[#8a5f0f]"}`;
          const inner = (<><span className={iconCls}><Icon className="h-4 w-4" /></span>{label}</>);
          return (
            <li key={label}>
              {action
                ? <button type="button" onClick={() => onAction(action)} aria-pressed={active} className={cls}>{inner}</button>
                : <Link to={to} className={cls}>{inner}</Link>}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function GroupInfo() {
  return (
    <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-[0_18px_40px_-28px_rgba(18,39,33,0.45)]">
      <p className="text-sm font-bold uppercase tracking-wide text-[#19352d]/55">Group Info</p>
      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#19352d]/50">Owner</p>
        <div className="mt-2 flex items-center gap-3">
          <Avatar name={GROUP.owner} className="h-9 w-9" />
          <div>
            <p className="text-[15px] font-semibold text-[#19352d]">{GROUP.owner}</p>
            <p className="text-sm text-[#19352d]/60">owner</p>
          </div>
        </div>
      </div>
      <div className="mt-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#19352d]/50">Officers</p>
        <ul className="mt-2 space-y-2">
          {GROUP.officers.map((o, i) => (
            <li key={`${o}-${i}`} className="flex items-center gap-3">
              <Avatar name={o} className="h-8 w-8 bg-[#19352d]/80 text-xs" />
              <span className="text-[15px] text-[#19352d]">{o}</span>
              <Shield className="ml-auto h-3.5 w-3.5 text-[#d99b26]" aria-label="officer" />
            </li>
          ))}
        </ul>
      </div>
      <dl className="mt-5 space-y-2.5 border-t border-gray-200/80 pt-5 text-[15px]">
        <div className="flex items-center gap-2.5 text-[#19352d]/80"><Eye className="h-4 w-4 text-[#19352d]/50" /><dd>{GROUP.views} total views</dd></div>
        <div className="flex items-center gap-2.5 text-[#19352d]/80"><Users className="h-4 w-4 text-[#19352d]/50" /><dd>{GROUP.members} total members</dd></div>
        <div className="flex items-center gap-2.5 text-[#19352d]/80"><Clock className="h-4 w-4 text-[#19352d]/50" /><dd>Last updated <span className="font-semibold text-[#19352d]">{GROUP.updated}</span></dd></div>
      </dl>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Top action bar — Members(10) / Action / Refresh                     */
/*  Action dropdown navigates to /group/:id/<slug>                      */
/* ------------------------------------------------------------------ */
function TopActionBar({ onRefresh }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [memberFilter, setMemberFilter] = useState(MEMBER_VIEWS[0]);

   const gid = id ?? GROUP.id;
  const current = ACTIONS.find((a) => a.to && pathname === a.to(gid))?.label ?? "Create Task";

  const handleAction = (label) => {
    const a = ACTIONS.find((x) => x.label === label);
    if (a?.to) navigate(a.to(gid));
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-gradient-to-br from-[#19352d] to-[#142e27] p-4 shadow-[0_18px_40px_-28px_rgba(18,39,33,0.6)] sm:flex-row sm:items-center">
      <Dropdown tone="dark" icon={Users} value={memberFilter} options={MEMBER_VIEWS} onChange={setMemberFilter} className="sm:w-56" />
      <Dropdown tone="dark" value={current} options={ACTIONS.map((a) => a.label)} onChange={handleAction} className="sm:w-56" />
      <button
        type="button"
        aria-label="Refresh"
        onClick={onRefresh}
        className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#d99b26] text-[#122721] transition-colors hover:bg-[#e6ab3a] focus:outline-none focus-visible:ring-2 focus-visible:ring-white sm:ml-auto"
      >
        <RefreshCw className="h-5 w-5" />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Shell                                                              */
/* ------------------------------------------------------------------ */
export default function GroupShell({ crumb, children, onRefresh }) {
  const [activeAction, setActiveAction] = useState(null);

  return (
    <div className="bg-[#f4f6f3] font-[Manrope,ui-sans-serif,system-ui] text-[#19352d]">
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <GroupHeader crumb={crumb} />
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[18rem_1fr] lg:gap-8">
          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <GroupCard />
            <OptionsList activeAction={activeAction} onAction={setActiveAction} />
            <GroupInfo />
          </aside>
          <main className="space-y-6">
            <TopActionBar onRefresh={onRefresh} />
            {children}
          </main>
        </div>
      </div>

      <DeleteGroupModal open={activeAction === "delete"} onClose={() => setActiveAction(null)} groupName={GROUP.name} onConfirm={() => alert("Group deleted")} />
      <ShareGroupModal open={activeAction === "share"} onClose={() => setActiveAction(null)} group={GROUP} onShare={(message) => console.log("share:", message)} />
    </div>
  );
}
