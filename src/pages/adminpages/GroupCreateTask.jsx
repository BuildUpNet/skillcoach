// src/pages/adminpages/GroupCreateTask.jsx
// Post Task form only — header / sidebar / action bar come from GroupShell.
// Tokens: #19352d → #122721 green, #d99b26 amber, mist #f4f6f3, Manrope.

import { useState } from "react";
import { Link } from "react-router-dom";
import GroupShell, { GROUP, Dropdown, Avatar } from "../../components/GroupShell";
import {
  Users, Video, Search, Check, Info, Bold, Italic, List, ListOrdered, Link2, RefreshCw,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */
const MEMBERS = [
  "All Group Members", "New Group Members",
  "Thomas Kee", "Thomas Kee", "Bret Delchambre", "Karthick", "Rahath Navith",
  "Rajkumar vivid", "djcurr", "John", "Sourabh", "Damini",
];

const TASK_TYPES = ["Single User Task", "Collaborative Task"];

const MODULE_TYPES = [
  "Select Type", "Lesson", "Supplement", "New Information", "Project Definition",
  "General instructions", "Help Video", "Personal Assistance", "Issues", "EPS Graph",
  "Earnings", "Design", "New functionality", "Formatting", "Text Changes", "Repeat Fixes",
  "Estimates", "ERROR", "Updates",
  "Server certificates", "scraping", "News-wizard", "General Tasks", "various bugs",
  "New Business", "Loan", "Water Board", "Invoice", "Check for the new assignment mail template",
  "Check for task", "Check for assignment delete- RED X task", "work to do", "Design",
  "Server Data", "Details", "automated", "Health", "Priority", "Other",
];

const PRIORITIES = [
  { value: "Lowest",  dot: "bg-slate-400",  chip: "bg-slate-50 text-slate-700 ring-slate-200" },
  { value: "Low",     dot: "bg-emerald-400",chip: "bg-emerald-50 text-emerald-800 ring-emerald-200" },
  { value: "Normal",  dot: "bg-sky-400",    chip: "bg-sky-50 text-sky-800 ring-sky-200" },
  { value: "High",    dot: "bg-[#d99b26]",  chip: "bg-amber-50 text-amber-800 ring-amber-200" },
  { value: "Highest", dot: "bg-rose-500",   chip: "bg-rose-50 text-rose-800 ring-rose-200" },
];

const VIDEO_SOURCES = ["My Videos", "All"];

/* ------------------------------------------------------------------ */
/*  Form pieces                                                        */
/* ------------------------------------------------------------------ */
function Field({ label, htmlFor, children, hint }) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-[11rem_1fr] sm:items-start sm:gap-6">
      <label htmlFor={htmlFor} className="pt-3 text-[15px] font-semibold text-[#19352d]">{label}</label>
      <div>
        {children}
        {hint && <p className="mt-1.5 text-sm text-[#19352d]/60">{hint}</p>}
      </div>
    </div>
  );
}

function DescriptionEditor({ value, onChange }) {
  return (
    <div className="rounded-2xl border border-gray-200/80 bg-white shadow-sm focus-within:border-[#19352d]/40 focus-within:ring-2 focus-within:ring-[#d99b26]/40">
      <div className="flex flex-wrap items-center gap-1 border-b border-gray-200/80 px-3 py-2 text-[#19352d]/70">
        {[
          { label: "Bold", icon: Bold },
          { label: "Italic", icon: Italic },
          { label: "List", icon: List },
          { label: "Numbered list", icon: ListOrdered },
          { label: "Insert link", icon: Link2 },
        ].map((btn) => {
          const Icon = btn.icon;
          return (
            <button
              key={btn.label}
              type="button"
              title={btn.label}
              onClick={() => {}}
              className="grid h-8 w-8 place-items-center rounded-lg hover:bg-[#f4f6f3] hover:text-[#19352d]"
            >
              <Icon className="h-4 w-4" />
            </button>
          );
        })}
      </div>
      <textarea
        id="description"
        rows={7}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Describe what needs to be done, requirements, links to assets..."
        className="block w-full resize-y rounded-b-2xl border-0 p-4 text-[15px] text-[#19352d] placeholder:text-[#19352d]/40 focus:outline-none"
      />
    </div>
  );
}

function MemberPicker({ selected, onSelect }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = MEMBERS.filter((m) =>
    m.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="rounded-2xl border border-gray-200/80 bg-white p-3 shadow-sm">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#19352d]/45" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search members to assign..."
          className="block w-full rounded-xl border border-gray-200/80 bg-white py-2.5 pl-10 pr-4 text-sm text-[#19352d] placeholder:text-[#19352d]/40 focus:border-[#19352d]/40 focus:outline-none focus:ring-2 focus:ring-[#d99b26]/40"
        />
      </div>

      <div className="mt-2 max-h-48 overflow-y-auto space-y-1 pr-1">
        {filtered.map((m, i) => {
          const active = selected.includes(m);
          return (
            <button
              key={`${m}-${i}`}
              type="button"
              onClick={() => onSelect(m)}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                active ? "bg-[#19352d] text-white" : "text-[#19352d] hover:bg-[#f4f6f3]"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Avatar name={m} className={active ? "bg-white text-[#19352d]" : ""} />
                <span className="font-medium">{m}</span>
              </span>
              {active && <Check className="h-4 w-4 text-[#d99b26]" strokeWidth={3} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Form body                                                          */
/* ------------------------------------------------------------------ */
function PostTaskForm() {
  const [taskType, setTaskType] = useState(TASK_TYPES[0]);
  const [moduleType, setModuleType] = useState(MODULE_TYPES[0]);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState(PRIORITIES[2].value);
  const [description, setDescription] = useState("");
  const [videoQuery, setVideoQuery] = useState("");
  const [videoSource, setVideoSource] = useState(VIDEO_SOURCES[0]);
  const [assignee, setAssignee] = useState(MEMBERS[2]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="rounded-3xl border border-gray-200/80 bg-white p-6 shadow-[0_20px_50px_-30px_rgba(18,39,33,0.35)] sm:p-10">
      <div className="flex flex-col gap-4 border-b border-gray-200/80 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#19352d] sm:text-3xl">Post a Task</h2>
          <p className="mt-1 text-sm text-[#19352d]/70">Define work, assign members, set priorities, and attach training videos.</p>
        </div>
        <div className="w-full sm:w-60">
          <Dropdown
            value={taskType}
            options={TASK_TYPES}
            onChange={setTaskType}
            tone="light"
            icon={Users}
          />
        </div>
      </div>

      {saved && (
        <div className="mt-6 flex items-center gap-3 rounded-2xl bg-emerald-500/10 p-4 text-emerald-900 ring-1 ring-emerald-500/30">
          <Check className="h-5 w-5 text-emerald-700" />
          <span className="text-sm font-semibold">Task saved successfully!</span>
        </div>
      )}

      <div className="mt-8 space-y-6">
        <Field label="Task Module Type" htmlFor="moduleType">
          <Dropdown value={moduleType} options={MODULE_TYPES} onChange={setModuleType} />
        </Field>

        <Field label="Task Title *" htmlFor="title">
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Implement the new checkout flow"
            className="block w-full rounded-xl border border-gray-200/80 bg-white px-4 py-3 text-[15px] text-[#19352d] placeholder:text-[#19352d]/40 focus:border-[#19352d]/40 focus:outline-none focus:ring-2 focus:ring-[#d99b26]/40"
          />
        </Field>

        <Field label="Priority" htmlFor="priority">
          <div className="flex flex-wrap gap-2">
            {PRIORITIES.map((p) => {
              const active = priority === p.value;
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

        <Field label="Attach Video" htmlFor="video" hint="Optional: start typing the name of your video.">
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
          <MemberPicker selected={assignee} onSelect={setAssignee} />
        </Field>
      </div>

      <aside className="mt-8 flex gap-4 rounded-2xl border border-[#d99b26]/40 bg-[#d99b26]/10 p-5">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#d99b26] text-[#122721]"><Info className="h-5 w-5" /></span>
        <div className="text-[15px] leading-7 text-[#19352d]">
          <p>
            Optional –{" "}
            <a href="#" className="font-semibold text-[#8a5f0f] underline underline-offset-4 hover:text-[#19352d]">Create Initial Assignments</a>{" "}
            – The contents of Initial Assignments are NOT emailed to users; users will need to click to see the contents. Initial assignments good for Sensitive Materials as a result.
          </p>
          <p className="mt-3">
            Project Managers can set an initial assignment for all Current or NEW Project Group Members. Imagine having documentation in the initial assignments that gets everyone up to speed. Create one assignment, assign it to all NEW Group Members, and everyone who joins the Project will get that Task + Assignment automatically. Users can do the initial assignments at their own pace, and you save time.
          </p>
        </div>
      </aside>

      <div className="mt-8 flex flex-col-reverse gap-3 border-t border-gray-200/80 pt-6 sm:flex-row sm:items-center">
        <Link to={`/group/${GROUP.id}`} className="inline-flex justify-center rounded-full px-6 py-3.5 text-base font-semibold text-[#19352d]/70 hover:bg-[#f4f6f3] hover:text-[#19352d] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#19352d]/30">
          Cancel
        </Link>
        <button
          type="button" onClick={handleSave} disabled={saving || !title.trim()}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#d99b26] px-8 py-3.5 text-base font-bold text-[#122721] shadow-[0_10px_30px_-10px_rgba(217,155,38,0.8)] transition-colors hover:bg-[#e6ab3a] disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#d99b26]/40 sm:ml-auto"
        >
          {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" strokeWidth={3} />}
          Save Task
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function GroupCreateTask() {
  return (
    <GroupShell crumb="Post Task">
      <PostTaskForm />
    </GroupShell>
  );
}
