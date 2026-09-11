// src/pages/adminpages/GroupAssigned.jsx
// Redesign of legacy group/:id "Assigned" view. Header / sidebar / action bar come from GroupShell.
// Tokens: #19352d → #122721 green, #d99b26 amber, mist #f4f6f3, Manrope.

import { useMemo, useState } from "react";
import GroupShell, { Dropdown } from "../../components/GroupShell";
import { Pencil, Trash2, ChevronDown, Info, Download, Plus, Check } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Data (verbatim from the legacy page)                                */
/* ------------------------------------------------------------------ */
const MODULE_TYPES = ["All", "Project Definition", "Updates", "work to do", "Design", "Server Data"];
const TASK_OWNERS = ["All", "Thomas Kee"];
const SORT_OPTIONS = ["Date (newest to oldest)", "Priority", "A-Z", "Date (oldest to newest)", "Recent Activity"];

const mk = (n, base, title, assignee, date, everyDone) =>
  Array.from({ length: n }, (_, i) => ({
    id: base + i, title: `${title} ${i + 1}`, assignee, date,
    done: everyDone ? i % everyDone === 0 : false, details: [], comments: [], hours: [],
  }));

const TASKS = [
  {
    id: 1, title: "Automated Market Analysis", priority: "Highest", members: 1, moduleType: "work to do",
    owner: "Thomas Kee", manager: "Thomas Kee", created: "August 26",
    description: "We need to build this outside of the PHP framework we currently have and make it something that other programs can call. Kubernetes probably?",
    assignments: [
      {
        id: 11, title: "Please start a chat with claude", assignee: "Damini", date: "August 26", done: false,
        details: ["you already did this --- just open page and check it off as done.", "You had claude match the near term analysis."],
        comments: [], hours: [],
      },
      { id: 12, title: "get data source from the server", assignee: "Damini", date: "August 26", done: false, details: [], comments: [], hours: [] },
      { id: 13, title: "News Page Design Vendor Structure", assignee: "Sourabh Khurana", date: "August 28", done: false, details: [], comments: [], hours: [] },
    ],
  },
  { id: 2, title: "Chat Room and Live Help", priority: "High", members: 3, moduleType: "work to do", owner: "Thomas Kee", manager: "Thomas Kee", created: "August 12", description: "", assignments: mk(18, 200, "Chat assignment", "Rajkumar vivid", "August 12", 3) },
  { id: 3, title: "Page fixes", priority: "Normal", members: 2, moduleType: "Updates", owner: "Thomas Kee", manager: "Thomas Kee", created: "July 30", description: "", assignments: mk(29, 300, "Page fix", "Sourabh Khurana", "July 30", 2) },
  { id: 4, title: "Fix news and market analysis", priority: "High", members: 4, moduleType: "Design", owner: "Thomas Kee", manager: "Thomas Kee", created: "July 18", description: "", assignments: mk(52, 400, "News fix", "Rahath Navith", "July 18", 4) },
  { id: 5, title: "Global Rollout", priority: "Highest", members: 6, moduleType: "Project Definition", owner: "Thomas Kee", manager: "Thomas Kee", created: "July 2", description: "", assignments: mk(52, 500, "Rollout step", "djcurr", "July 2", 0) },
  { id: 6, title: "Performance Tracking", priority: "Normal", members: 2, moduleType: "Server Data", owner: "Thomas Kee", manager: "Thomas Kee", created: "June 20", description: "", assignments: mk(45, 600, "Tracking item", "Damini", "June 20", 5) },
];

// same chips as the Create Task page
const PRIORITIES = {
  Lowest: { dot: "bg-slate-400", chip: "bg-slate-50 text-slate-700 ring-slate-200", rank: 4 },
  Low: { dot: "bg-emerald-400", chip: "bg-emerald-50 text-emerald-800 ring-emerald-200", rank: 3 },
  Normal: { dot: "bg-sky-400", chip: "bg-sky-50 text-sky-800 ring-sky-200", rank: 2 },
  High: { dot: "bg-[#d99b26]", chip: "bg-amber-50 text-amber-800 ring-amber-200", rank: 1 },
  Highest: { dot: "bg-rose-500", chip: "bg-rose-50 text-rose-800 ring-rose-200", rank: 0 },
};

/* ------------------------------------------------------------------ */
/*  Primitives                                                         */
/* ------------------------------------------------------------------ */
function PriorityChip({ level }) {
  const p = PRIORITIES[level] ?? PRIORITIES.Normal;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ring-1 ${p.chip}`}>
      <span className={`h-2 w-2 rounded-full ${p.dot}`} />{level}
    </span>
  );
}

const ICON_TONES = {
  green: "bg-[#19352d] text-white hover:bg-[#122721]",
  amber: "bg-[#d99b26] text-[#122721] hover:bg-[#e6ab3a]",
  danger: "bg-rose-50 text-rose-600 ring-1 ring-rose-200 hover:bg-rose-100",
  ghost: "bg-[#19352d]/[0.06] text-[#19352d] hover:bg-[#d99b26]/20",
};

function IconBtn({ icon: Icon, tone = "green", label, onClick, className = "" }) {
  return (
    <button
      type="button" title={label} aria-label={label} onClick={onClick}
      className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d99b26] ${ICON_TONES[tone]} ${className}`}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

const BTN_TONES = {
  green: "bg-[#19352d] text-white hover:bg-[#122721]",
  amber: "bg-[#d99b26] text-[#122721] hover:bg-[#e6ab3a]",
  outline: "ring-1 ring-[#19352d]/30 text-[#19352d] hover:bg-[#f4f6f3]",
  onDark: "ring-1 ring-white/40 text-white hover:bg-white/10",
  mint: "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200 hover:bg-emerald-100",
};

function Btn({ children, tone = "green", onClick, className = "" }) {
  return (
    <button
      type="button" onClick={onClick}
      className={`inline-flex h-10 items-center gap-2 rounded-full px-4 text-[15px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d99b26] ${BTN_TONES[tone]} ${className}`}
    >
      {children}
    </button>
  );
}

const PersonLink = ({ name }) => (
  <a href="#" className="font-semibold text-[#19352d] underline decoration-[#d99b26] decoration-2 underline-offset-4 hover:text-[#8a5f0f]">
    {name}
  </a>
);

/* ------------------------------------------------------------------ */
/*  Assignment row (legacy image 4 / 5)                                */
/* ------------------------------------------------------------------ */
function AssignmentRow({ a, onToggleDone }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-gray-200/80 bg-white">
      <div className="flex flex-wrap items-start gap-3 p-4 sm:p-5">
        {/* red = not done → click notifies PM/task owner; green = completed */}
        <button
          type="button" onClick={() => onToggleDone(a.id)}
          aria-label={a.done ? "Mark as not completed" : "Mark done and notify project manager"}
          className={`mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d99b26] ${a.done ? "border-emerald-600 bg-emerald-600 text-white" : "border-rose-600 bg-rose-600"}`}
        >
          {a.done && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
        </button>

        <div className="min-w-0 flex-1">
          <h4 className={`text-[17px] font-bold text-[#19352d] ${a.done ? "line-through opacity-60" : ""}`}>{a.title}</h4>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[14px] text-[#19352d]/65">
            <span>For <PersonLink name={a.assignee} /></span>
            <span aria-hidden="true">|</span>
            <button type="button" aria-label="Assignment info" className="text-[#19352d]/70 hover:text-[#19352d]"><Info className="h-4 w-4" /></button>
            <span aria-hidden="true">|</span>
            <span>{a.date}</span>
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Btn tone="mint">Add Hours</Btn>
            <IconBtn icon={Trash2} tone="danger" label="Delete assignment" />
            <IconBtn icon={Pencil} tone="green" label="Edit assignment" />
          </div>
        </div>

        <button
          type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open}
          aria-label={open ? "Hide details" : "Show details"}
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d99b26] ${open ? ICON_TONES.amber : ICON_TONES.ghost}`}
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      {open && (
        <div className="space-y-3 border-t border-gray-200/80 bg-[#f4f6f3] p-4 sm:p-5">
          <section className="rounded-xl bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <h5 className="text-[16px] font-bold text-[#19352d]">Details</h5>
              <Btn tone="outline">Download PDF <Download className="h-4 w-4" /></Btn>
            </div>
            {a.details.length
              ? <div className="mt-2 space-y-1.5 text-[15px] leading-7 text-[#19352d]/85">{a.details.map((l, i) => <p key={i}>{l}</p>)}</div>
              : <p className="mt-2 text-[15px] text-[#19352d]/55">No details added yet.</p>}
          </section>

          <section className="rounded-xl bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <h5 className="text-[16px] font-bold text-[#19352d]">Comments ({a.comments.length})</h5>
              <Btn tone="green">New Comment</Btn>
            </div>
            {a.comments.length
              ? <ul className="mt-2 space-y-2 text-[15px] text-[#19352d]/85">{a.comments.map((c, i) => <li key={i}>{c}</li>)}</ul>
              : <p className="mt-2 text-[15px] text-[#19352d]/55">No comments</p>}
          </section>

          <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <h5 className="text-[16px] font-bold text-[#19352d]">Worked Hours</h5>
            <p className="mt-1 text-[15px] text-[#19352d]/85">{a.hours.length ? a.hours.join(", ") : "No hours worked yet."}</p>
          </section>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Task detail table (legacy image 6)                                  */
/* ------------------------------------------------------------------ */
function TaskDetails({ t }) {
  const rows = [
    ["Title", t.title],
    ["Module Type", t.moduleType],
    ["Group/Task Owner", <PersonLink name={t.owner} />],
    ["Project Manager", <PersonLink name={t.manager} />],
    ["Description", t.description || "—"],
    ["Created date", t.created],
    ["Priority", <PriorityChip level={t.priority} />],
  ];
  return (
    <div className="rounded-2xl border border-gray-200/80 bg-white">
      <div className="flex items-center justify-between border-b border-gray-200/80 px-4 py-3">
        <span className="text-[15px] font-bold text-[#19352d]">Task details</span>
        <IconBtn icon={Pencil} tone="green" label="Edit task" />
      </div>
      <dl className="divide-y divide-gray-200/80">
        {rows.map(([k, v]) => (
          <div key={k} className="grid gap-1 px-4 py-3 sm:grid-cols-[11rem_1fr] sm:gap-4">
            <dt className="text-[14px] font-semibold text-[#19352d]/60">{k}</dt>
            <dd className="text-[15px] text-[#19352d]">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="px-4 py-3">
        <a href="#" className="text-[14px] font-semibold text-[#8a5f0f] underline underline-offset-4 hover:text-[#19352d]">Edit</a>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Task card (collapsed → image 1, expanded → image 4)                 */
/* ------------------------------------------------------------------ */
function TaskCard({ task, onToggleDone }) {
  const [expanded, setExpanded] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [filter, setFilter] = useState("All");

  const visible = task.assignments.filter((a) => (filter === "All" ? true : filter === "Finished" ? a.done : !a.done));

  return (
    <article className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-[0_18px_40px_-28px_rgba(18,39,33,0.45)]">
      {expanded && (
        <div className="flex flex-wrap items-center gap-3 border-b border-gray-200/80 bg-[#f4f6f3] px-4 py-3 sm:px-5">
          <PriorityChip level={task.priority} />
          <h2 className="text-[18px] font-extrabold text-[#19352d]">{task.title}</h2>
          <span className="text-[14px] font-semibold text-[#19352d]/60">{task.members} {task.members === 1 ? "Member" : "Members"}</span>
          <div className="ml-auto flex items-center gap-2">
            <IconBtn icon={Trash2} tone="danger" label="Delete task" />
            <IconBtn icon={Pencil} tone="green" label="Edit task" />
            <button
              type="button" onClick={() => setShowDetails((v) => !v)} aria-expanded={showDetails}
              aria-label={showDetails ? "Hide task details" : "Show task details"}
              className={`grid h-9 w-9 place-items-center rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d99b26] ${showDetails ? ICON_TONES.green : ICON_TONES.amber}`}
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${showDetails ? "rotate-180" : ""}`} />
            </button>
          </div>
        </div>
      )}

      {expanded && showDetails && <div className="p-4 sm:p-5"><TaskDetails t={task} /></div>}

      {/* title bar */}
      <div className="flex flex-wrap items-center gap-3 bg-gradient-to-br from-[#19352d] to-[#142e27] px-4 py-3 text-white sm:px-5">
        <h3 className="text-[17px] font-bold">
          {task.title} <span className="font-medium text-white/70">: Assignments ({task.assignments.length})</span>
        </h3>
        <div className="ml-auto flex items-center gap-2">
          <Btn tone="onDark" onClick={() => setExpanded((v) => !v)}>{expanded ? "Collapse All" : "Expand All"}</Btn>
          <Btn tone="amber"><Plus className="h-4 w-4" strokeWidth={3} /> New</Btn>
        </div>
      </div>

      {expanded && (
        <div className="space-y-4 p-4 sm:p-5">
          <p className="flex flex-wrap items-center gap-2 text-[14px] text-[#19352d]/65">
            Check red boxes to notify project managers / task owners when done
            <span className="inline-block h-3.5 w-3.5 rounded-[3px] bg-rose-600" aria-hidden="true" />
            <span className="inline-flex items-center gap-1">
              <span className="inline-block h-3.5 w-3.5 rounded-[3px] bg-emerald-600" aria-hidden="true" /> Completed.
            </span>
          </p>

          <div className="flex flex-wrap gap-2">
            {[["All", "All"], ["Finished", "Finished Assignments"], ["Unfinished", "Not Finished Assignments"]].map(([key, label]) => (
              <button
                key={key} type="button" onClick={() => setFilter(key)} aria-pressed={filter === key}
                className={`h-10 rounded-full px-4 text-[15px] font-semibold ring-1 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d99b26] ${
                  filter === key ? "bg-[#19352d] text-white ring-[#19352d]" : "bg-[#f4f6f3] text-[#19352d] ring-gray-200/80 hover:bg-[#d99b26]/20"}`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {visible.length
              ? visible.map((a) => <AssignmentRow key={a.id} a={a} onToggleDone={(id) => onToggleDone(task.id, id)} />)
              : <p className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-[15px] text-[#19352d]/55">No assignments match this filter.</p>}
          </div>
        </div>
      )}
    </article>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function GroupAssigned() {
  const [tasks, setTasks] = useState(TASKS); // TODO: GET /api/groups/:id/tasks?view=assigned
  const [moduleType, setModuleType] = useState("All");
  const [owner, setOwner] = useState("All");
  const [sort, setSort] = useState(SORT_OPTIONS[0]);

  const toggleDone = (taskId, aId) =>
    setTasks((prev) => prev.map((t) => (t.id !== taskId ? t : {
      ...t, assignments: t.assignments.map((a) => (a.id === aId ? { ...a, done: !a.done } : a)),
    })));

  const filtered = useMemo(() => {
    let list = tasks.filter((t) => (moduleType === "All" || t.moduleType === moduleType) && (owner === "All" || t.owner === owner));
    if (sort === "A-Z") list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    if (sort === "Priority") list = [...list].sort((a, b) => PRIORITIES[a.priority].rank - PRIORITIES[b.priority].rank);
    if (sort === "Date (oldest to newest)") list = [...list].reverse();
    return list;
  }, [tasks, moduleType, owner, sort]);

  return (
    <GroupShell crumb="Assigned" onRefresh={() => setTasks(TASKS)}>
      <div className="rounded-2xl border border-gray-200/80 bg-white shadow-[0_18px_40px_-28px_rgba(18,39,33,0.45)]">
        <div className="flex flex-wrap items-center gap-3 border-b border-gray-200/80 px-6 py-5">
          <h2 className="text-2xl font-bold text-[#19352d]">Assigned</h2>
          <span className="rounded-full bg-[#f4f6f3] px-3 py-1 text-sm font-semibold text-[#19352d]">{filtered.length} tasks</span>
        </div>

        <div className="flex flex-wrap gap-3 border-b border-gray-200/80 bg-[#f4f6f3] px-6 py-4">
          <Dropdown label="Module Type" value={moduleType} options={MODULE_TYPES} onChange={setModuleType} className="sm:w-60" />
          <Dropdown label="Task Owner" value={owner} options={TASK_OWNERS} onChange={setOwner} className="sm:w-52" />
          <Dropdown label="Sort By" value={sort} options={SORT_OPTIONS} onChange={setSort} className="sm:w-72" />
        </div>

        <div className="space-y-4 p-4 sm:p-6">
          {filtered.length
            ? filtered.map((t) => <TaskCard key={t.id} task={t} onToggleDone={toggleDone} />)
            : <p className="rounded-2xl border border-dashed border-gray-300 p-10 text-center text-[16px] text-[#19352d]/55">No tasks match these filters. Change Module Type or Task Owner to see more.</p>}
        </div>
      </div>
    </GroupShell>
  );
}
