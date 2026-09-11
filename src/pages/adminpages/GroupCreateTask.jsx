// src/pages/adminpages/GroupCreateTask.jsx
// Redesign of legacy skillcoach.org/group/:id  (STD WORK → Post Task).
// Same tokens as MemberHome: #19352d → #122721 green, #d99b26 amber, mist #f4f6f3, Manrope.
// Deps: react-router-dom, lucide-react.  Rendered inside AppLayout (navbar + footer already there).
//
// Wired to the real backend: group/members fetch, task creation, group
// delete and group style all hit real API endpoints. Task Type / Module Type
// / Attach Video have no corresponding backend field yet (module types table
// is empty even on the legacy DB, and "shared_users" multi-assign isn't part
// of this rebuild's task model) — they stay as visual-only inputs and are
// not sent to the server. Share Group has no legacy backend equivalent
// either (no shareAction in the legacy GroupController), so it stays a
// client-only preview + working "copy link".

import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import GroupStylesModal from "../../components/GroupStylesModal";
import DeleteGroupModal from "../../components/DeleteGroupModal";
import ShareGroupModal from "../../components/ShareGroupModal";
import {
  getGroup,
  getGroupMembers,
  getGroupManage,
  createGroupTask,
  deleteGroup,
  getGroupStyle,
  setGroupStyle,
} from "../../lib/api";

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
  Video,
  Search,
  Check,
  Bold,
  Italic,
  List,
  ListOrdered,
  Link2,
  ChevronRight,
  Crown,
  Shield,
  Loader2,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Static reference lists — cosmetic only (no backend field yet)      */
/* ------------------------------------------------------------------ */
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

const TASK_TYPES = ["Single User Task", "Collaborative Task"];

// Matches the real legacy priority_type enum (1=Lowest .. 5=Highest),
// confirmed against Group_TaskController.php — backend now persists all 5.
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
  (name || "?")
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
function GroupHeader({ group }) {
  return (
    <section className="rounded-3xl bg-gradient-to-br from-[#19352d] to-[#122721] px-6 py-7 text-white shadow-[0_24px_60px_-30px_rgba(18,39,33,0.6)] sm:px-10 sm:py-9">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-white/60">
        <Link to="/projects" className="hover:text-white">
          Projects
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-white/90">{group.title}</span>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-white/90">Post Task</span>
      </nav>

      <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{group.title?.toUpperCase()}</h1>
          <p className="mt-2 text-base text-white/75 sm:text-lg">{group.description}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {group.isOwner && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#d99b26] px-3.5 py-1.5 text-sm font-semibold text-[#122721]">
              <Crown className="h-3.5 w-3.5" /> You own this group
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-sm font-medium ring-1 ring-white/15">
            <Users className="h-3.5 w-3.5" /> {group.member_count} members
          </span>
          {group.category_title && (
            <span className="inline-flex items-center rounded-full bg-white/10 px-3.5 py-1.5 text-sm font-medium ring-1 ring-white/15">
              {group.category_title}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Sidebar                                                            */
/* ------------------------------------------------------------------ */
function GroupCard({ group }) {
  return (
    <div className="rounded-2xl border border-gray-200/80 bg-white p-6 text-center shadow-[0_18px_40px_-28px_rgba(18,39,33,0.45)]">
      <div className="mx-auto grid h-24 w-24 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-[#19352d] to-[#122721] ring-4 ring-[#d99b26]/30">
        {group.photo_data_url ? (
          <img src={group.photo_data_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="text-lg font-black text-white">{initials(group.title)}</span>
        )}
      </div>
      <h2 className="mt-4 text-xl font-bold text-[#19352d]">{group.title}</h2>
      <p className="mt-1 text-[15px] text-[#19352d]/60">{group.category_title || "Uncategorized"}</p>

      <dl className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-[#f4f6f3] px-3 py-3">
          <dt className="text-xs font-semibold uppercase tracking-wide text-[#19352d]/55">Members</dt>
          <dd className="mt-0.5 text-2xl font-extrabold text-[#19352d]">{group.member_count}</dd>
        </div>
        <div className="rounded-xl bg-[#f4f6f3] px-3 py-3">
          <dt className="text-xs font-semibold uppercase tracking-wide text-[#19352d]/55">Views</dt>
          <dd className="mt-0.5 text-2xl font-extrabold text-[#19352d]">{group.view_count ?? 0}</dd>
        </div>
      </dl>
    </div>
  );
}

function OptionsList({ groupId, activeAction, onAction }) {
  const options = [
    { label: "Edit Group Details", icon: Pencil, to: `/groups/edit/${groupId}` },
    { label: "Edit Group Style", icon: Palette, action: "styles" },
    { label: "Delete Group", icon: Trash2, action: "delete", danger: true },
    { label: "Share Group", icon: Share2, action: "share" },
    { label: "Message Members", icon: Mail, to: `/messages/compose/to/${groupId}/multi/group` },
    { label: "Invite Friends", icon: UserPlus, to: `/groups/invite/${groupId}` },
  ];

  return (
    <nav aria-label="Group options" className="rounded-2xl border border-gray-200/80 bg-white p-3 shadow-[0_18px_40px_-28px_rgba(18,39,33,0.45)]">
      <p className="px-3 pb-2 pt-1 text-sm font-bold uppercase tracking-wide text-[#19352d]/55">Options</p>
      <ul className="space-y-0.5">
        {options.map(({ label, icon: Icon, to, action, danger }) => {
          const active = action && action === activeAction;
          const cls = `group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[15px] font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#19352d]/30 ${
            danger
              ? "text-rose-700 hover:bg-rose-50"
              : active
              ? "bg-[#19352d] text-white"
              : "text-[#19352d] hover:bg-[#f4f6f3]"
          }`;
          const iconCls = `grid h-9 w-9 place-items-center rounded-lg ${
            danger
              ? "bg-rose-50 text-rose-600"
              : active
              ? "bg-[#d99b26] text-[#122721]"
              : "bg-[#19352d]/[0.06] text-[#19352d] group-hover:bg-[#d99b26]/20 group-hover:text-[#8a5f0f]"
          }`;
          const inner = (
            <>
              <span className={iconCls}><Icon className="h-4 w-4" /></span>
              {label}
            </>
          );
          return (
            <li key={label}>
              {action ? (
                <button type="button" onClick={() => onAction(action)} aria-pressed={active} className={cls}>
                  {inner}
                </button>
              ) : (
                <Link to={to} className={cls}>{inner}</Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function GroupInfo({ group, officers }) {
  return (
    <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-[0_18px_40px_-28px_rgba(18,39,33,0.45)]">
      <p className="text-sm font-bold uppercase tracking-wide text-[#19352d]/55">Group Info</p>

      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#19352d]/50">Owner</p>
        <div className="mt-2 flex items-center gap-3">
          <Avatar name={group.owner_displayname} className="h-9 w-9" />
          <div>
            <p className="text-[15px] font-semibold text-[#19352d]">{group.owner_displayname || "Unknown"}</p>
            <p className="text-sm text-[#19352d]/60">owner</p>
          </div>
        </div>
      </div>

      {officers.length > 0 && (
        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#19352d]/50">Officers</p>
          <ul className="mt-2 space-y-2">
            {officers.map((o) => (
              <li key={o.user_id} className="flex items-center gap-3">
                <Avatar name={o.displayname} className="h-8 w-8 bg-[#19352d]/80 text-xs" />
                <span className="text-[15px] text-[#19352d]">{o.displayname || `User #${o.user_id}`}</span>
                <Shield className="ml-auto h-3.5 w-3.5 text-[#d99b26]" aria-label="officer" />
              </li>
            ))}
          </ul>
        </div>
      )}

      <dl className="mt-5 space-y-2.5 border-t border-gray-200/80 pt-5 text-[15px]">
        <div className="flex items-center gap-2.5 text-[#19352d]/80">
          <Eye className="h-4 w-4 text-[#19352d]/50" />
          <dd>{group.view_count ?? 0} total views</dd>
        </div>
        <div className="flex items-center gap-2.5 text-[#19352d]/80">
          <Users className="h-4 w-4 text-[#19352d]/50" />
          <dd>{group.member_count} total members</dd>
        </div>
        {group.modified_date && (
          <div className="flex items-center gap-2.5 text-[#19352d]/80">
            <Clock className="h-4 w-4 text-[#19352d]/50" />
            <dd>
              Last updated{" "}
              <span className="font-semibold text-[#19352d]">
                {new Date(group.modified_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </span>
            </dd>
          </div>
        )}
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

/** Single-assignee member picker — the real task model has one task_manager
    per task (multi-person work happens via separate Assignments afterwards,
    already built in TaskDetail.jsx), so this is a single-select list, not a
    multi-select. */
function MemberPicker({ members, selected, onSelect }) {
  if (!members.length) {
    return <p className="rounded-xl border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-[#19352d]/50">No other members in this group yet.</p>;
  }
  return (
    <div className="rounded-xl border border-gray-200/80 bg-white p-2">
      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {members.map((m) => {
          const checked = selected === m.id;
          return (
            <label
              key={m.id}
              className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
                checked ? "bg-[#19352d] text-white" : "hover:bg-[#f4f6f3] text-[#19352d]"
              }`}
            >
              <input type="radio" name="assignee" className="peer sr-only" checked={checked} onChange={() => onSelect(m.id)} />
              <span
                className={`grid h-5 w-5 place-items-center rounded-md border-2 ${
                  checked ? "border-[#d99b26] bg-[#d99b26] text-[#122721]" : "border-[#19352d]/30 bg-white"
                }`}
              >
                {checked && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
              </span>
              <Avatar name={m.name} className={`h-8 w-8 text-xs ${checked ? "bg-white/15" : ""}`} />
              <span className="text-[15px] font-medium">{m.name}</span>
              {m.role !== "Member" && (
                <span className={`ml-auto rounded-full px-2 py-0.5 text-xs font-semibold ${checked ? "bg-white/15" : "bg-[#d99b26]/15 text-[#8a5f0f]"}`}>
                  {m.role}
                </span>
              )}
            </label>
          );
        })}
      </div>
    </div>
  );
}

function PostTaskForm({ groupId, members, onCreated }) {
  const [taskType, setTaskType] = useState(TASK_TYPES[0]);
  const [title, setTitle] = useState("");
  const [moduleType, setModuleType] = useState("work to do");
  const [priority, setPriority] = useState("Normal");
  const [description, setDescription] = useState("");
  const [videoQuery, setVideoQuery] = useState("");
  const [videoSource, setVideoSource] = useState(VIDEO_SOURCES[0]);
  const [assignee, setAssignee] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const priorityMeta = PRIORITIES.find((p) => p.value === priority);

  const canSave = title.trim() && description.trim() && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    setError("");
    try {
      const task = await createGroupTask(groupId, {
        title: title.trim(),
        description: description.trim(),
        priority,
        assignee: assignee || undefined,
      });
      onCreated(task);
    } catch (err) {
      setError(err.message || "Could not create the task");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Form card */}
      <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-[0_18px_40px_-28px_rgba(18,39,33,0.45)] sm:p-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-[#19352d]">Post Task</h2>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ring-1 ${priorityMeta.chip}`}>
            <span className={`h-2 w-2 rounded-full ${priorityMeta.dot}`} />
            {priority}
          </span>
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {error}
          </div>
        )}

        <div className="mt-8 space-y-6">
          <Field label="Task Type" htmlFor="taskType" hint="Not persisted yet — multi-person work is handled via Assignments after the task is created.">
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

          <Field label="Attach Video" htmlFor="video" hint="Optional: Start typing the name of your video — video attachments aren't wired up yet (no Video module in this rebuild).">
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

          <Field label="Assign To" htmlFor="members" hint="Optional — leave unassigned to assign it to yourself.">
            <MemberPicker members={members} selected={assignee} onSelect={setAssignee} />
          </Field>
        </div>

        {/* Footer buttons */}
        <div className="mt-8 flex flex-col-reverse gap-3 border-t border-gray-200/80 pt-6 sm:flex-row sm:items-center">
          <Link
            to={`/projects/${groupId}`}
            className="inline-flex justify-center rounded-full px-6 py-3.5 text-base font-semibold text-[#19352d]/70 hover:bg-[#f4f6f3] hover:text-[#19352d] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#19352d]/30"
          >
            Cancel
          </Link>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#d99b26] px-8 py-3.5 text-base font-bold text-[#122721] shadow-[0_10px_30px_-10px_rgba(217,155,38,0.8)] transition-colors hover:bg-[#e6ab3a] disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#d99b26]/40 sm:ml-auto"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" strokeWidth={3} />}
            {saving ? "Saving…" : "Save Task"}
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
  const { id: groupId } = useParams();
  const navigate = useNavigate();
  const [activeAction, setActiveAction] = useState(null);
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [groupCss, setGroupCss] = useState("");
  const [styleLoaded, setStyleLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError("");
    Promise.all([getGroup(groupId), getGroupMembers(groupId), getGroupManage(groupId).catch(() => null)])
      .then(([g, memberList, manage]) => {
        if (cancelled) return;
        setGroup({ ...g, isOwner: manage ? manage.yourRole === "owner" : undefined });
        setMembers(memberList);
        setOfficers(manage?.officers?.filter((o) => o.displayname) || []);
      })
      .catch((err) => !cancelled && setLoadError(err.message || "Could not load this group"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [groupId]);

  useEffect(() => {
    if (activeAction !== "styles" || styleLoaded) return;
    getGroupStyle(groupId)
      .then((res) => setGroupCss(res.style || ""))
      .catch(() => {})
      .finally(() => setStyleLoaded(true));
  }, [activeAction, groupId, styleLoaded]);

  if (loading) {
    return (
      <div className="grid min-h-[60vh] place-items-center bg-[#f4f6f3]">
        <Loader2 className="h-8 w-8 animate-spin text-[#19352d]/40" />
      </div>
    );
  }

  if (loadError || !group) {
    return (
      <div className="grid min-h-[60vh] place-items-center bg-[#f4f6f3] px-4 text-center">
        <div>
          <p className="text-lg font-semibold text-[#19352d]">{loadError || "Group not found"}</p>
          <Link to="/projects" className="mt-3 inline-block text-[#8a5f0f] underline underline-offset-4">
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f4f6f3] font-[Manrope,ui-sans-serif,system-ui] text-[#19352d]">
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <GroupHeader group={group} />
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[18rem_1fr] lg:gap-8">
          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <GroupCard group={group} />
            <OptionsList groupId={groupId} activeAction={activeAction} onAction={setActiveAction} />
            <GroupInfo group={group} officers={officers} />
          </aside>
          <main>
            <PostTaskForm
              groupId={groupId}
              members={members}
              onCreated={() => navigate(`/projects/${groupId}/tasks`)}
            />
          </main>
        </div>
      </div>

      <GroupStylesModal
        open={activeAction === "styles"}
        onClose={() => setActiveAction(null)}
        initialCss={groupCss}
        onSave={async (css) => {
          await setGroupStyle(groupId, css);
          setGroupCss(css);
        }}
      />
      <DeleteGroupModal
        open={activeAction === "delete"}
        onClose={() => setActiveAction(null)}
        groupName={group.title}
        onConfirm={async () => {
          await deleteGroup(groupId);
          navigate("/projects");
        }}
      />
      <ShareGroupModal
        open={activeAction === "share"}
        onClose={() => setActiveAction(null)}
        group={{ id: groupId, name: group.title, description: group.description, photo: group.photo_data_url }}
        onShare={(message) => {
          // No legacy backend equivalent exists for this action (no shareAction
          // in Group_GroupController) — this stays a client-only preview.
          console.log("share:", message);
        }}
      />
    </div>
  );
}
