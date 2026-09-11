// src/pages/adminpages/GroupReadyToAccept.jsx
// Redesign of legacy group/:id "Ready to Accept" view. Header / sidebar / action bar come from GroupShell.
// Tokens: #19352d → #122721 green, #d99b26 amber, mist #f4f6f3, Manrope.

import { useState } from "react";
import GroupShell, { Dropdown } from "../../components/GroupShell";

/* ------------------------------------------------------------------ */
/*  Data (verbatim from the legacy page)                                */
/* ------------------------------------------------------------------ */
const MODULE_TYPES = ["All", "Project Definition", "Updates", "work to do", "Design", "Server Data"];
const TASK_OWNERS = ["All", "Thomas Kee"];
const SORT_OPTIONS = ["Date (newest to oldest)", "Priority", "A-Z", "Date (oldest to newest)", "Recent Activity"];

// TODO: GET /api/groups/:id/tasks?view=ready-to-accept
const TASKS = [];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function GroupReadyToAccept() {
  const [tasks, setTasks] = useState(TASKS);
  const [moduleType, setModuleType] = useState("All");
  const [owner, setOwner] = useState("All");
  const [sort, setSort] = useState(SORT_OPTIONS[0]);

  const filtered = tasks.filter(
    (t) => (moduleType === "All" || t.moduleType === moduleType) && (owner === "All" || t.owner === owner)
  );

  return (
    <GroupShell crumb="Ready to Accept" onRefresh={() => setTasks(TASKS)}>
      <div className="rounded-2xl border border-gray-200/80 bg-white shadow-[0_18px_40px_-28px_rgba(18,39,33,0.45)]">
        <div className="flex flex-wrap items-center gap-3 border-b border-gray-200/80 px-6 py-5">
          <h2 className="text-2xl font-bold text-[#19352d]">Ready to Accept</h2>
          <span className="rounded-full bg-[#f4f6f3] px-3 py-1 text-sm font-semibold text-[#19352d]">
            {filtered.length} tasks
          </span>
        </div>

        <div className="flex flex-wrap gap-3 border-b border-gray-200/80 bg-[#f4f6f3] px-6 py-4">
          <Dropdown label="Module Type" value={moduleType} options={MODULE_TYPES} onChange={setModuleType} className="sm:w-60" />
          <Dropdown label="Task Owner" value={owner} options={TASK_OWNERS} onChange={setOwner} className="sm:w-52" />
          <Dropdown label="Sort By" value={sort} options={SORT_OPTIONS} onChange={setSort} className="sm:w-72" />
        </div>

        <div className="p-4 sm:p-6">
          {filtered.length ? (
            <ul className="space-y-4">
              {filtered.map((t) => (
                <li key={t.id} className="rounded-2xl bg-gradient-to-br from-[#19352d] to-[#142e27] px-5 py-3 text-[17px] font-bold text-white">
                  {t.title}
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-2xl border border-dashed border-gray-300 p-10 text-center text-[16px] text-[#19352d]/55">
              No tasks.
            </p>
          )}
        </div>
      </div>
    </GroupShell>
  );
}
