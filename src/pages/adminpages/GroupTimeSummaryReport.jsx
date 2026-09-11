// src/pages/adminpages/GroupTimeSummaryReport.jsx
// Redesign of legacy group/:id "Time Summary" view. Header / sidebar / action bar come from GroupShell.
// Tokens: #19352d → #122721 green, #d99b26 amber, mist #f4f6f3, Manrope.

import { useMemo, useState } from "react";
import GroupShell, { Dropdown } from "../../components/GroupShell";
import { Calendar, Clock } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Filter options (verbatim from the legacy page)                      */
/* ------------------------------------------------------------------ */
const DATE_RANGES = ["Yesterday", "Last Week", "Last Month", "Last Year", "Custom Date Range"];
const SORT_BY = ["Users", "Tasks", "Assignments"];
const MEMBERS = [
  "All Members", "bluemonkey66", "Equity Logic", "Bret", "Karthick", "RahathNavith",
  "RajkumarN", "DerekCurry", "JohnAlduenda", "Sourabh khurana", "DaminiKhurana",
];
const ORDER_BY = ["Highest Hours", "Date Ascending", "Date Descending"];

// TODO: GET /api/groups/:id/time-summary?range=&sortBy=&member=&order=
// Row shape: { id, member, task, assignment, hours, date }
const RECORDS = [];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function GroupTimeSummaryReport() {
  const [records, setRecords] = useState(RECORDS);
  const [range, setRange] = useState(DATE_RANGES[0]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sortBy, setSortBy] = useState(SORT_BY[0]);
  const [member, setMember] = useState(MEMBERS[0]);
  const [order, setOrder] = useState(ORDER_BY[0]);

  const rows = useMemo(() => {
    let list = records.filter((r) => member === "All Members" || r.member === member);
    if (order === "Highest Hours") list = [...list].sort((a, b) => b.hours - a.hours);
    if (order === "Date Ascending") list = [...list].sort((a, b) => new Date(a.date) - new Date(b.date));
    if (order === "Date Descending") list = [...list].sort((a, b) => new Date(b.date) - new Date(a.date));
    return list;
  }, [records, member, order]);

  const totalHours = rows.reduce((s, r) => s + (r.hours || 0), 0);
  const groupKey = sortBy === "Users" ? "member" : sortBy === "Tasks" ? "task" : "assignment";

  return (
    <GroupShell crumb="Time Summary" onRefresh={() => setRecords(RECORDS)}>
      <div className="rounded-2xl border border-gray-200/80 bg-white shadow-[0_18px_40px_-28px_rgba(18,39,33,0.45)]">
        <div className="flex flex-wrap items-center gap-3 border-b border-gray-200/80 px-6 py-5">
          <h2 className="text-2xl font-bold text-[#19352d]">Time Summary</h2>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f4f6f3] px-3 py-1 text-sm font-semibold text-[#19352d]">
            <Clock className="h-3.5 w-3.5 text-[#d99b26]" /> {totalHours} hrs
          </span>
        </div>

        {/* Filters */}
        <div className="space-y-3 border-b border-gray-200/80 bg-[#f4f6f3] px-6 py-4">
          <div className="flex flex-wrap gap-3">
            <Dropdown label="Date" icon={Calendar} value={range} options={DATE_RANGES} onChange={setRange} className="sm:w-64" />
            <Dropdown label="Sort By" value={sortBy} options={SORT_BY} onChange={setSortBy} className="sm:w-48" />
            <Dropdown label="Members" value={member} options={MEMBERS} onChange={setMember} className="sm:w-60" />
            <Dropdown label="Order by" value={order} options={ORDER_BY} onChange={setOrder} className="sm:w-60" />
          </div>

          {range === "Custom Date Range" && (
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-[15px] font-medium text-[#19352d]">
                <span className="opacity-60">From:</span>
                <input
                  type="date" value={from} onChange={(e) => setFrom(e.target.value)}
                  className="rounded-xl border border-gray-200/80 bg-white px-4 py-2.5 text-[15px] text-[#19352d] focus:border-[#19352d]/40 focus:outline-none focus:ring-2 focus:ring-[#d99b26]/40"
                />
              </label>
              <label className="flex items-center gap-2 text-[15px] font-medium text-[#19352d]">
                <span className="opacity-60">To:</span>
                <input
                  type="date" value={to} onChange={(e) => setTo(e.target.value)}
                  className="rounded-xl border border-gray-200/80 bg-white px-4 py-2.5 text-[15px] text-[#19352d] focus:border-[#19352d]/40 focus:outline-none focus:ring-2 focus:ring-[#d99b26]/40"
                />
              </label>
              <button
                type="button"
                className="inline-flex h-11 items-center rounded-full bg-[#d99b26] px-5 text-[15px] font-bold text-[#122721] transition-colors hover:bg-[#e6ab3a] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#19352d]/40"
              >
                Apply
              </button>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="p-4 sm:p-6">
          {rows.length ? (
            <div className="overflow-x-auto rounded-2xl border border-gray-200/80">
              <table className="w-full text-left text-[15px]">
                <thead className="bg-gradient-to-br from-[#19352d] to-[#142e27] text-white">
                  <tr>
                    <th className="px-4 py-3 font-semibold">{sortBy === "Users" ? "Member" : sortBy === "Tasks" ? "Task" : "Assignment"}</th>
                    <th className="px-4 py-3 font-semibold">Task</th>
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 text-right font-semibold">Hours</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/80 text-[#19352d]">
                  {rows.map((r) => (
                    <tr key={r.id} className="hover:bg-[#f4f6f3]">
                      <td className="px-4 py-3 font-semibold">{r[groupKey]}</td>
                      <td className="px-4 py-3 text-[#19352d]/75">{r.task}</td>
                      <td className="px-4 py-3 text-[#19352d]/75">{r.date}</td>
                      <td className="px-4 py-3 text-right font-bold">{r.hours}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-gray-300 p-10 text-center text-[16px] text-[#19352d]/55">
              No records found.
            </p>
          )}
        </div>
      </div>
    </GroupShell>
  );
}
