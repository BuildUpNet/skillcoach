// src/pages/adminpages/GroupCreateTask.jsx
// Redesign of legacy skillcoach.org/group/:id  (STD WORK → Post Task).
// Same tokens as MemberHome: #19352d → #122721 green, #d99b26 amber, mist #f4f6f3, Manrope.
// Deps: react-router-dom, lucide-react.  Rendered inside AppLayout (navbar + footer already there).

import { useState, useRef, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Pencil,
  Palette,
  Trash2,
  Share2,
  Mail,
  UserPlus,
  Users,
  Eye,
  Clock,
  ChevronDown,
  RefreshCw,
  Video,
  Search,
  Check,
  Info,
  Bold,
  Italic,
  List,
  ListOrdered,
  Link2,
  ChevronRight,
  Crown,
  Shield,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Dummy data (verbatim from the legacy page)                         */
/* ------------------------------------------------------------------ */
const GROUP = {
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
  { label: "Edit Group Details", icon: Pencil, to: "#" },
  { label: "Edit Group Style", icon: Palette, to: "#" },
  { label: "Delete Group", icon: Trash2, to: "#", danger: true },
  { label: "Share Group", icon: Share2, to: "#" },
  { label: "Message Members", icon: Mail, to: "#" },
  { label: "Invite Friends", icon: UserPlus, to: "#" },
];

const MEMBERS = [
  "All Group Members",
  "New Group Members",
  "Thomas Kee",
  "Thomas Kee",
  "Bret Delchambre",
  "Karthick",
  "Rahath Navith",
  "Rajkumar vivid",
  "djcurr",
  "John",
  "Sourabh",
  "Damini",
];

const MEMBER_VIEWS = [`Members(${GROUP.members})`, "Invite", "Timeline", "Lessons(2)", "Tasks"];

const ACTIONS = [
  "Dashboard",
  "My Tasks",
  "My Assignments",
  "My Timesheet",
  "Create Task",
  "Assigned",
  "Accepted",
  "Ready to Accept",
  "Time Summary",
];

const TASK_TYPES = ["Single User Task", "Collaborative Task"];

const MODULE_TYPES = [
  "Select Type",
  "Lesson",
  "Supplement",
  "New Information",
  "Project Definition",
  "General instructions",
  "Help Video",
  "Personal Assistance",
  "Issues",
  "EPS Graph",
  "Earnings",
  "Design",
  "New functionality",
  "Formatting",
  "Text Changes",
  "Repeat Fixes",
  "Estimates",
  "ERROR",
  "Updates",
  // TODO: legacy list has more items between "Updates" and "Server certificates" (not in screenshots)
  "Server certificates",
  "scraping",
  "News-wizard",
  "General Tasks",
  "various bugs",
  "New Business",
  "Loan",
  "Water Board",
  "Invoice",
  "Check for the new assignment mail template",
  "Check for task",
  "Check for assignment delete- RED X task",
  "work to do",
  "Design",
  "Server Data",
  "Details",
  "automated",
  "Health",
  "Priority",
  "Other",
];

const PRIORITIES = [
  { value: "Lowest", dot: "bg-slate-400", chip: "bg-slate-50 text-slate-700 ring-slate-200" },
  { value: "Low", dot: "bg-emerald-400", chip: "bg-emerald-50 text-emerald-800 ring-emerald-200" },
  { value: "Normal", dot: "bg-sky-400", chip: "bg-sky-50 text-sky-800 ring-sky-200" },
  { value: "High", dot: "bg-[#d99b26]", chip: "bg-amber-50 text-amber-800 ring-amber-200" },
  { value: "Highest", dot: "bg-rose-500", chip: "bg-rose-50 text-rose-800 ring-rose-200" },
];

const VIDEO_SOURCES = ["My Videos", "All"];

/* ------------------------------------------------------------------ */
/*  Small primitives                                                   */
/* ------------------------------------------------------------------ */
const initials = (name) =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

function Avatar({ name, className = "" }) {
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full bg-[#19352d] text-white text-[13px] font-bold ${className}`}
    >
      {initials(name)}
    </span>
  );
}

/** Accessible custom dropdown (single select). */
function Dropdown({ value, options, onChange, renderOption, className = "", tone = "light", icon: Icon }) {
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
          ${
            dark
              ? "bg-white/10 text-white ring-1 ring-white/15 hover:bg-white/15"
              : "bg-white text-[#19352d] border border-gray-200/80 hover:border-[#19352d]/30"
          }`}
      >
        <span className="flex items-center gap-2 truncate">
          {Icon && <Icon className="h-4 w-4 opacity-70" />}
          {renderOption ? renderOption(value) : value}
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute z-20 mt-2 max-h-72 w-full min-w-[12rem] overflow-y-auto rounded-xl border border-gray-200/80 bg-white p-1.5 shadow-xl"
        >
          {options.map((opt, i) => {
            const val = typeof opt === "string" ? opt : opt.value;
            const selected = val === value;
            return (
              <li key={`${val}-${i}`} role="option" aria-selected={selected}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(val);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-[15px] text-[#19352d] hover:bg-[#f4f6f3] ${
                    selected ? "bg-[#f4f6f3] font-semibold" : ""
                  }`}
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

function Field({ label, htmlFor, children, hint }) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-[11rem_1fr] sm:items-start sm:gap-6">
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

/* ------------------------------------------------------------------ */
/*  Header                                                             */
/* ------------------------------------------------------------------ */
function GroupHeader() {
  return (
    <section className="rounded-3xl bg-gradient-to-br from-[#19352d] to-[#122721] px-6 py-7 text-white shadow-[0_24px_60px_-30px_rgba(18,39,33,0.6)] sm:px-10 sm:py-9">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-white/60">
        <Link to="/projects" className="hover:text-white">
          Projects
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-white/90">{GROUP.name}</span>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-white/90">Post Task</span>
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
      {/* Avatar — swap for <img src={group.photo}> when wired up */}
      <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-[#19352d] to-[#122721] ring-4 ring-[#d99b26]/30">
        <span className="text-[11px] font-black leading-tight tracking-wider text-white">
          {GROUP.logoText.map((l) => (
            <span key={l} className="block">
              {l}
            </span>
          ))}
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

function OptionsList() {
  return (
    <nav aria-label="Group options" className="rounded-2xl border border-gray-200/80 bg-white p-3 shadow-[0_18px_40px_-28px_rgba(18,39,33,0.45)]">
      <p className="px-3 pb-2 pt-1 text-sm font-bold uppercase tracking-wide text-[#19352d]/55">Options</p>
      <ul className="space-y-0.5">
        {OPTIONS.map(({ label, icon: Icon, to, danger }) => (
          <li key={label}>
            <Link
              to={to}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#19352d]/30 ${
                danger
                  ? "text-rose-700 hover:bg-rose-50"
                  : "text-[#19352d] hover:bg-[#f4f6f3]"
              }`}
            >
              <span
                className={`grid h-9 w-9 place-items-center rounded-lg ${
                  danger ? "bg-rose-50 text-rose-600" : "bg-[#19352d]/[0.06] text-[#19352d] group-hover:bg-[#d99b26]/20 group-hover:text-[#8a5f0f]"
                }`}
              >
                <Icon className="h-4 w-4" />
              </span>
              {label}
            </Link>
          </li>
        ))}
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
        <div className="flex items-center gap-2.5 text-[#19352d]/80">
          <Eye className="h-4 w-4 text-[#19352d]/50" />
          <dd>{GROUP.views} total views</dd>
        </div>
        <div className="flex items-center gap-2.5 text-[#19352d]/80">
          <Users className="h-4 w-4 text-[#19352d]/50" />
          <dd>{GROUP.members} total members</dd>
        </div>
        <div className="flex items-center gap-2.5 text-[#19352d]/80">
          <Clock className="h-4 w-4 text-[#19352d]/50" />
          <dd>
            Last updated <span className="font-semibold text-[#19352d]">{GROUP.updated}</span>
          </dd>
        </div>
      </dl>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Post Task form                                                     */
/* ------------------------------------------------------------------ */
function DescriptionEditor({ value, onChange }) {
  const tools = [
    { icon: Bold, label: "Bold" },
    { icon: Italic, label: "Italic" },
    { icon: List, label: "Bulleted list" },
    { icon: ListOrdered, label: "Numbered list" },
    { icon: Link2, label: "Insert link" },
  ];
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200/80 bg-white focus-within:border-[#19352d]/40 focus-within:ring-2 focus-within:ring-[#d99b26]/40">
      <div className="flex items-center gap-1 border-b border-gray-200/80 bg-[#f4f6f3] px-2 py-1.5">
        {tools.map(({ icon: Icon, label }) => (
          <button
            key={label}
            type="button"
            aria-label={label}
            className="grid h-8 w-8 place-items-center rounded-md text-[#19352d]/70 hover:bg-white hover:text-[#19352d]"
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
      </div>
      <textarea
        id="description"
        rows={10}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Describe the task, expected outcome, and any links your members will need…"
        className="block w-full resize-y bg-transparent px-4 py-3 text-[15px] leading-7 text-[#19352d] placeholder:text-[#19352d]/40 focus:outline-none"
      />
    </div>
  );
}

function MemberPicker({ selected, onToggle }) {
  const specials = MEMBERS.slice(0, 2);
  const people = MEMBERS.slice(2);
  const count = selected.length;

  return (
    <div className="rounded-xl border border-gray-200/80 bg-white p-2">
      <div className="flex items-center justify-between px-2 pb-2 pt-1">
        <p className="text-sm text-[#19352d]/60">
          {count ? `${count} selected` : "No one selected yet"}
        </p>
        {count > 0 && (
          <button
            type="button"
            onClick={() => selected.forEach(onToggle)}
            className="text-sm font-semibold text-[#19352d]/70 hover:text-[#19352d]"
          >
            Clear
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {specials.map((m) => (
          <MemberRow key={m} name={m} checked={selected.includes(m)} onToggle={onToggle} special />
        ))}
      </div>
      <div className="my-2 border-t border-gray-200/80" />
      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {people.map((m, i) => (
          <MemberRow key={`${m}-${i}`} name={m} checked={selected.includes(`${m}-${i}`)} onToggle={() => onToggle(`${m}-${i}`)} />
        ))}
      </div>
    </div>
  );
}

function MemberRow({ name, checked, onToggle, special }) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
        checked ? "bg-[#19352d] text-white" : "hover:bg-[#f4f6f3] text-[#19352d]"
      }`}
    >
      <input type="checkbox" className="peer sr-only" checked={checked} onChange={() => onToggle(name)} />
      <span
        className={`grid h-5 w-5 place-items-center rounded-md border-2 ${
          checked ? "border-[#d99b26] bg-[#d99b26] text-[#122721]" : "border-[#19352d]/30 bg-white"
        }`}
      >
        {checked && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
      </span>
      {special ? (
        <span className={`grid h-8 w-8 place-items-center rounded-full ${checked ? "bg-white/15" : "bg-[#d99b26]/20 text-[#8a5f0f]"}`}>
          <Users className="h-4 w-4" />
        </span>
      ) : (
        <Avatar name={name} className={`h-8 w-8 text-xs ${checked ? "bg-white/15" : ""}`} />
      )}
      <span className="text-[15px] font-medium">{name}</span>
    </label>
  );
}

function PostTaskForm() {
  const [memberFilter, setMemberFilter] = useState(`Members(${GROUP.members})`);
  const [action, setAction] = useState("Create Task");
  const [taskType, setTaskType] = useState(TASK_TYPES[0]);
  const [title, setTitle] = useState("");
  const [moduleType, setModuleType] = useState("work to do");
  const [priority, setPriority] = useState("Normal");
  const [description, setDescription] = useState("");
  const [videoQuery, setVideoQuery] = useState("");
  const [videoSource, setVideoSource] = useState(VIDEO_SOURCES[0]);
  const [selected, setSelected] = useState([]);
  const [saving, setSaving] = useState(false);

  const toggleMember = (key) =>
    setSelected((s) => (s.includes(key) ? s.filter((x) => x !== key) : [...s, key]));

  const priorityMeta = PRIORITIES.find((p) => p.value === priority);
  const renderPriority = (val) => {
    const p = PRIORITIES.find((x) => x.value === val);
    return (
      <>
        <span className={`h-2.5 w-2.5 rounded-full ${p.dot}`} />
        {val}
      </>
    );
  };

  const handleSave = () => {
    setSaving(true);
    // TODO: POST /api/groups/:id/tasks
    setTimeout(() => setSaving(false), 800);
  };

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col gap-3 rounded-2xl bg-gradient-to-br from-[#19352d] to-[#142e27] p-4 shadow-[0_18px_40px_-28px_rgba(18,39,33,0.6)] sm:flex-row sm:items-center">
        <Dropdown
          tone="dark"
          icon={Users}
          value={memberFilter}
          options={MEMBER_VIEWS}
          onChange={setMemberFilter}
          className="sm:w-56"
        />
        <Dropdown tone="dark" value={action} options={ACTIONS} onChange={setAction} className="sm:w-56" />
        <button
          type="button"
          aria-label="Refresh"
          className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#d99b26] text-[#122721] transition-colors hover:bg-[#e6ab3a] focus:outline-none focus-visible:ring-2 focus-visible:ring-white sm:ml-auto"
        >
          <RefreshCw className="h-5 w-5" />
        </button>
      </div>

      {/* Form card */}
      <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-[0_18px_40px_-28px_rgba(18,39,33,0.45)] sm:p-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-[#19352d]">Post Task</h2>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ring-1 ${priorityMeta.chip}`}>
            <span className={`h-2 w-2 rounded-full ${priorityMeta.dot}`} />
            {priority}
          </span>
        </div>

        <div className="mt-8 space-y-6">
          <Field label="Task Type" htmlFor="taskType">
            <Dropdown value={taskType} options={TASK_TYPES} onChange={setTaskType} className="sm:max-w-xs" />
          </Field>

          <Field label="Title" htmlFor="title">
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give the task a clear, short title"
              className="block w-full rounded-xl border border-gray-200/80 bg-white px-4 py-3 text-[15px] text-[#19352d] placeholder:text-[#19352d]/40 focus:border-[#19352d]/40 focus:outline-none focus:ring-2 focus:ring-[#d99b26]/40 sm:max-w-lg"
            />
          </Field>

          <Field label="Module Type" htmlFor="moduleType">
            <Dropdown value={moduleType} options={MODULE_TYPES} onChange={setModuleType} className="sm:max-w-md" />
          </Field>

          <Field label="Priority Type" htmlFor="priority">
            <div className="flex flex-wrap gap-2">
              {PRIORITIES.map((p) => {
                const active = p.value === priority;
                return (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPriority(p.value)}
                    aria-pressed={active}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-[15px] font-medium ring-1 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d99b26] ${
                      active
                        ? "bg-[#19352d] text-white ring-[#19352d]"
                        : `${p.chip} hover:brightness-95`
                    }`}
                  >
                    <span className={`h-2.5 w-2.5 rounded-full ${p.dot}`} />
                    {p.value}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Task Description" htmlFor="description">
            <DescriptionEditor value={description} onChange={setDescription} />
          </Field>

          <Field label="Attach Video" htmlFor="video" hint="Optional: Start typing the name of your video">
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#19352d]/45" />
                <input
                  id="video"
                  type="search"
                  value={videoQuery}
                  onChange={(e) => setVideoQuery(e.target.value)}
                  placeholder="Search videos"
                  className="block w-full rounded-xl border border-gray-200/80 bg-white py-3 pl-10 pr-4 text-[15px] text-[#19352d] placeholder:text-[#19352d]/40 focus:border-[#19352d]/40 focus:outline-none focus:ring-2 focus:ring-[#d99b26]/40"
                />
              </div>
              <Dropdown icon={Video} value={videoSource} options={VIDEO_SOURCES} onChange={setVideoSource} className="sm:w-48" />
            </div>
          </Field>

          <Field label="Select Members" htmlFor="members">
            <MemberPicker selected={selected} onToggle={toggleMember} />
          </Field>
        </div>

        {/* Initial assignments callout */}
        <aside className="mt-8 flex gap-4 rounded-2xl border border-[#d99b26]/40 bg-[#d99b26]/10 p-5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#d99b26] text-[#122721]">
            <Info className="h-5 w-5" />
          </span>
          <div className="text-[15px] leading-7 text-[#19352d]">
            <p>
              Optional –{" "}
              <a href="#" className="font-semibold text-[#8a5f0f] underline underline-offset-4 hover:text-[#19352d]">
                Create Initial Assignments
              </a>{" "}
              – The contents of Initial Assignments are NOT emailed to users; users will need to click to see the
              contents. Initial assignments good for Sensitive Materials as a result.
            </p>
            <p className="mt-3">
              Project Managers can set an initial assignment for all Current or NEW Project Group Members. Imagine
              having documentation in the initial assignments that gets everyone up to speed. Create one assignment,
              assign it to all NEW Group Members, and everyone who joins the Project will get that Task + Assignment
              automatically. Users can do the initial assignments at their own pace, and you save time.
            </p>
          </div>
        </aside>

        {/* Footer buttons */}
        <div className="mt-8 flex flex-col-reverse gap-3 border-t border-gray-200/80 pt-6 sm:flex-row sm:items-center">
          <Link
            to={`/group/${GROUP.id}`}
            className="inline-flex justify-center rounded-full px-6 py-3.5 text-base font-semibold text-[#19352d]/70 hover:bg-[#f4f6f3] hover:text-[#19352d] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#19352d]/30"
          >
            Cancel
          </Link>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !title.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#d99b26] px-8 py-3.5 text-base font-bold text-[#122721] shadow-[0_10px_30px_-10px_rgba(217,155,38,0.8)] transition-colors hover:bg-[#e6ab3a] disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#d99b26]/40 sm:ml-auto"
          >
            {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" strokeWidth={3} />}
            Save Task
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function GroupCreateTask() {
  const { id } = useParams(); // e.g. /group/34 — wire GROUP fetch to this later

  return (
    <div className="bg-[#f4f6f3] font-[Manrope,ui-sans-serif,system-ui] text-[#19352d]">
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <GroupHeader />

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[18rem_1fr] lg:gap-8">
          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <GroupCard />
            <OptionsList />
            <GroupInfo />
          </aside>

          <main>
            <PostTaskForm />
          </main>
        </div>
      </div>
    </div>
  );
}
