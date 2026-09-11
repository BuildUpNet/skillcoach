// src/pages/adminpages/GroupAccepted.jsx
// Redesign of legacy group/:id "Accepted" view. Header / sidebar / action bar come from GroupShell.
// Tokens: #19352d → #122721 green, #d99b26 amber, mist #f4f6f3, Manrope.

import { useMemo, useState } from "react";
import GroupShell, { Dropdown } from "../../components/GroupShell";
import { Pencil, Trash2, ChevronDown, ChevronLeft, ChevronRight, Info, Download, Plus, Check } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Filter options (verbatim from the legacy page)                      */
/* ------------------------------------------------------------------ */
const MODULE_TYPES = ["All", "work to do"];
const TASK_OWNERS = ["All", "Thomas Kee", "Rahath Navith"];
const SORT_OPTIONS = ["Date (newest to oldest)", "Priority", "A-Z", "Date (oldest to newest)", "Recent Activity"];
const PAGE_SIZE = 5; // legacy shows 5 assignments per page

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */
const A = (id, title, assignee, date, extra = {}) => ({
  id, title, assignee, date, done: true, details: [], comments: [], hours: [], ...extra,
});
const fill = (base, n, title, assignee, date) =>
  Array.from({ length: n }, (_, i) => A(base + i, `${title} ${i + 1}`, assignee, date));

// TODO: GET /api/groups/:id/tasks?view=accepted
const TASKS = [
  {
    id: 1, title: "Fix FTP", priority: "High", members: 1, moduleType: "work to do",
    owner: "djcurr", manager: "djcurr", created: "March 4, 2025", description: "",
    headerLabel: { name: "djcurr", date: "March 4, 2025" }, // legacy shows owner + date instead of "1 Members"
    assignments: [A(11, "Please run the FTP function in evening", "", "March 4, 2025")],
  },
  {
    id: 2, title: "BUGS2", priority: "Normal", members: 1, moduleType: "work to do",
    owner: "Thomas Kee", manager: "Thomas Kee", created: "March 3, 2023", description: "Task to take care of assignments",
    assignments: [
      A(21, "Change page titles", "Bret Delchambre", "March 3, 2023"),
      A(22, "Priority insert adsense", "Bret Delchambre", "March 3, 2023"),
      A(23, "throttle setting change caused break", "Karthick", "March 3, 2023"),
      A(24, "original not matching vendor at sign up anymore", "Karthick", "March 15, 2023"),
      A(25, "std admin updating members side", "Karthick", "April 19, 2023"),
      A(26, "insert image bug", "Karthick", "April 25, 2023"),
      A(27, "Important: Tradepub default settings", "Karthick", "April 26, 2023"),
      A(28, "GOLD users no Macro emails", "Karthick", "May 4, 2023"),
      A(29, "netline no nightly newsletter", "Karthick", "May 4, 2023"),
      A(30, "bullet points", "Bret Delchambre", "May 10, 2023"),
      ...fill(31, 10, "Bug fix", "Karthick", "May 2023"),
    ],
  },
  {
    id: 3, title: "News Page Server Speed", priority: "Highest", members: 1, moduleType: "work to do",
    owner: "Thomas Kee", manager: "Thomas Kee", created: "January 31, 2023", description: "",
    assignments: [
      A(41, "Share information about news pages", "Bret Delchambre", "February 12, 2023"),
      A(42, "The Throttle from admin vs news pages", "Karthick", "February 12, 2023"),
      A(43, "copy database structure test-test news page", "Karthick", "February 12, 2023"),
      A(44, "PRIORITY Assignment: Add tag manager", "Bret Delchambre", "February 12, 2023"),
      A(45, "Add facebook ad - tag to GTM", "Bret Delchambre", "February 12, 2023"),
      ...fill(46, 8, "News page speed item", "Karthick", "January 31, 2023"),
      A(54, "Tag manager and UA GA tags on news pages", "Bret Delchambre", "January 31, 2023"),
      A(55, "IMPORTANT: Change video on pop up", "Bret Delchambre", "January 31, 2023"),
      A(56, "add text to trial pages gold sections", "Bret Delchambre", "January 31, 2023"),
      A(57, "PRIORITY: Fix titles of News Pages", "Bret Delchambre", "February 24, 2023"),
    ],
  },
  { id: 4, title: "New Sign Up Page", priority: "High", members: 2, moduleType: "work to do", owner: "Thomas Kee", manager: "Thomas Kee", created: "January 10, 2023", description: "", assignments: fill(60, 13, "Sign up item", "Bret Delchambre", "January 10, 2023") },
  { id: 5, title: "new home page", priority: "High", members: 3, moduleType: "work to do", owner: "Rahath Navith", manager: "Thomas Kee", created: "December 1, 2022", description: "", assignments: fill(80, 57, "Home page item", "Karthick", "December 2022") },
  { id: 6, title: ".NET prep work", priority: "Normal", members: 1, moduleType: "work to do", owner: "Thomas Kee", manager: "Thomas Kee", created: "November 20, 2022", description: "", assignments: fill(140, 1, "Prep item", "Bret Delchambre", "November 20, 2022") },
  { id: 7, title: "QuoteMedia fix", priority: "Normal", members: 1, moduleType: "work to do", owner: "Thomas Kee", manager: "Thomas Kee", created: "November 5, 2022", description: "", assignments: fill(150, 1, "QuoteMedia item", "Karthick", "November 5, 2022") },
  { id: 8, title: "page speed issues 2", priority: "High", members: 1, moduleType: "work to do", owner: "Rahath Navith", manager: "Thomas Kee", created: "October 12, 2022", description: "", assignments: fill(160, 7, "Speed item", "Karthick", "October 2022") },
  { id: 9, title: "Many issues with upgrade", priority: "Highest", members: 2, moduleType: "work to do", owner: "Thomas Kee", manager: "Thomas Kee", created: "September 3, 2022", description: "", assignments: fill(170, 14, "Upgrade issue", "Bret Delchambre", "September 2022") },
  { id: 10, title: "Bugs", priority: "Normal", members: 4, moduleType: "work to do", owner: "Thomas Kee", manager: "Thomas Kee", created: "June 1, 2022", description: "", assignments: fill(200, 71, "Bug", "Karthick", "2022") },
];

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
    <button type="button" title={label} aria-label={label} onClick={onClick}
      className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d99b26] ${ICON_TONES[tone]} ${className}`}>
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

function Btn({ children, tone = "green", onClick, className = "", disabled }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      className={`inline-flex h-10 items-center gap-2 rounded-full px-4 text-[15px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d99b26] disabled:cursor-not-allowed disabled:opacity-40 ${BTN_TONES[tone]} ${className}`}>
      {children}
    </button>
  );
}

const PersonLink = ({ name }) =>
  name ? (
    <a href="#" className="font-semibold text-[#19352d] underline decoration-[#d99b26] decoration-2 underline-offset-4 hover:text-[#8a5f0f]">{name}</a>
  ) : <span className="text-[#19352d]/40">—</span>;

/* ------------------------------------------------------------------ */
/*  Pagination                                                         */
/* ------------------------------------------------------------------ */
function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null;
  return (
    <nav aria-label="Assignments pages" className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
      <Btn tone="outline" disabled={page === 1} onClick={() => onChange(page - 1)}><ChevronLeft className="h-4 w-4" /> Previous</Btn>
      {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)} aria-current={n === page ? "page" : undefined}
          className={`grid h-10 w-10 place-items-center rounded-full text-[15px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d99b26] ${
            n === page ? "bg-[#19352d] text-white" : "text-[#19352d] ring-1 ring-gray-200/80 hover:bg-[#f4f6f3]"}`}>
          {n}
        </button>
      ))}
      <Btn tone="outline" disabled={page === pages} onClick={() => onChange(page + 1)}>Next <ChevronRight className="h-4 w-4" /></Btn>
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/*  Assignment row                                                     */
/* ------------------------------------------------------------------ */
function AssignmentRow({ a, onToggleDone }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-gray-200/80 bg-white">
      <div className="flex flex-wrap items-start gap-3 p-4 sm:p-5">
        <button type="button" onClick={() => onToggleDone(a.id)}
          aria-label={a.done ? "Mark as not completed" : "Mark done and notify project manager"}
          className={`mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d99b26] ${a.done ? "border-emerald-600 bg-emerald-600 text-white" : "border-rose-600 bg-rose-600"}`}>
          {a.done && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
        </button>

        <div className="min-w-0 flex-1">
          <h4 className="text-[17px] font-bold text-[#19352d]">{a.title}</h4>
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

        <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-label={open ? "Hide details" : "Show details"}
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d99b26] ${open ? ICON_TONES.amber : ICON_TONES.ghost}`}>
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
/*  Task detail table                                                  */
/* ------------------------------------------------------------------ */
function TaskDetails({ t }) {
  const rows = [
    ["Title", t.title], ["Module Type", t.moduleType],
    ["Group/Task Owner", <PersonLink name={t.owner} />], ["Project Manager", <PersonLink name={t.manager} />],
    ["Description", t.description || "—"], ["Created date", t.created], ["Priority", <PriorityChip level={t.priority} />],
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
/*  Task card                                                          */
/* ------------------------------------------------------------------ */
function TaskCard({ task, onToggleDone }) {
  const [expanded, setExpanded] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [filter, setFilter] = useState("All");
  const [page, setPage] = useState(1);

  const visible = task.assignments.filter((a) => (filter === "All" ? true : filter === "Finished" ? a.done : !a.done));
  const pages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const safePage = Math.min(page, pages);
  const paged = visible.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const changeFilter = (k) => { setFilter(k); setPage(1); };

  return (
    <article className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-[0_18px_40px_-28px_rgba(18,39,33,0.45)]">
      {expanded && (
        <div className="flex flex-wrap items-center gap-3 border-b border-gray-200/80 bg-[#f4f6f3] px-4 py-3 sm:px-5">
          <PriorityChip level={task.priority} />
          {task.headerLabel ? (
            <>
              <PersonLink name={task.headerLabel.name} />
              <span className="text-[14px] font-semibold text-[#19352d]/60">{task.headerLabel.date}</span>
            </>
          ) : (
            <>
              <h2 className="text-[18px] font-extrabold text-[#19352d]">{task.title}</h2>
              <span className="text-[14px] font-semibold text-[#19352d]/60">{task.members} {task.members === 1 ? "Member" : "Members"}</span>
            </>
          )}
          <div className="ml-auto flex items-center gap-2">
            <IconBtn icon={Trash2} tone="danger" label="Delete task" />
            <button type="button" onClick={() => setShowDetails((v) => !v)} aria-expanded={showDetails}
              aria-label={showDetails ? "Hide task details" : "Show task details"}
              className={`grid h-9 w-9 place-items-center rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d99b26] ${showDetails ? ICON_TONES.green : ICON_TONES.amber}`}>
              <ChevronDown className={`h-4 w-4 transition-transform ${showDetails ? "rotate-180" : ""}`} />
            </button>
          </div>
        </div>
      )}

      {expanded && showDetails && <div className="p-4 sm:p-5"><TaskDetails t={task} /></div>}

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
            <span className="inline-flex items-center gap-1"><span className="inline-block h-3.5 w-3.5 rounded-[3px] bg-emerald-600" aria-hidden="true" /> Completed.</span>
          </p>

          <div className="flex flex-wrap gap-2">
            {[["All", "All"], ["Finished", "Finished Assignments"], ["Unfinished", "Not Finished Assignments"]].map(([key, label]) => (
              <button key={key} type="button" onClick={() => changeFilter(key)} aria-pressed={filter === key}
                className={`h-10 rounded-full px-4 text-[15px] font-semibold ring-1 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d99b26] ${
                  filter === key ? "bg-[#19352d] text-white ring-[#19352d]" : "bg-[#f4f6f3] text-[#19352d] ring-gray-200/80 hover:bg-[#d99b26]/20"}`}>
                {label}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {paged.length
              ? paged.map((a) => <AssignmentRow key={a.id} a={a} onToggleDone={(id) => onToggleDone(task.id, id)} />)
              : <p className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-[15px] text-[#19352d]/55">No assignments match this filter.</p>}
          </div>

          <Pagination page={safePage} pages={pages} onChange={setPage} />
        </div>
      )}
    </article>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function GroupAccepted() {
  const [tasks, setTasks] = useState(TASKS);
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
    <GroupShell crumb="Accepted" onRefresh={() => setTasks(TASKS)}>
      <div className="rounded-2xl border border-gray-200/80 bg-white shadow-[0_18px_40px_-28px_rgba(18,39,33,0.45)]">
        <div className="flex flex-wrap items-center gap-3 border-b border-gray-200/80 px-6 py-5">
          <h2 className="text-2xl font-bold text-[#19352d]">Accepted</h2>
          <span className="rounded-full bg-[#f4f6f3] px-3 py-1 text-sm font-semibold text-[#19352d]">{filtered.length} tasks</span>
        </div>

        <div className="flex flex-wrap gap-3 border-b border-gray-200/80 bg-[#f4f6f3] px-6 py-4">
          <Dropdown label="Module Type" value={moduleType} options={MODULE_TYPES} onChange={setModuleType} className="sm:w-60" />
          <Dropdown label="Task Owner" value={owner} options={TASK_OWNERS} onChange={setOwner} className="sm:w-56" />
          <Dropdown label="Sort By" value={sort} options={SORT_OPTIONS} onChange={setSort} className="sm:w-72" />
        </div>

        <div className="space-y-4 p-4 sm:p-6">
          {filtered.length
            ? filtered.map((t) => <TaskCard key={t.id} task={t} onToggleDone={toggleDone} />)
            : <p className="rounded-2xl border border-dashed border-gray-300 p-10 text-center text-[16px] text-[#19352d]/55">No tasks.</p>}
        </div>
      </div>
    </GroupShell>
  );
}
