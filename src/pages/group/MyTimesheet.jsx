import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Card, EmptyState } from "../../components/group/GroupUI";

const RANGES = ["Yesterday", "Today", "This week", "This month"];

export default function GroupMyTimesheet() {
  const { workspace } = useOutletContext();
  const [range, setRange] = useState("Yesterday");
  const entries = workspace.timesheet[range] || [];
  const total = entries.reduce((n, e) => n + e.hours, 0);

  return (
    <Card
      title="My Timesheet"
      action={
        <select
          value={range}
          onChange={(e) => setRange(e.target.value)}
          className="cursor-pointer rounded-xl border border-line bg-white px-3.5 py-2 text-[14px] font-semibold text-ink outline-none focus:border-forest focus:ring-4 focus:ring-forest/10"
        >
          {RANGES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      }
    >
      {entries.length ? (
        <>
          <ul className="space-y-2.5">
            {entries.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-mist/50 px-4 py-3.5">
                <div>
                  <p className="text-[15px] font-semibold text-ink">{e.task}</p>
                  <p className="text-[13px] text-ink/55">{e.note}{e.date ? ` · ${e.date}` : ""}</p>
                </div>
                <span className="rounded-full bg-forest-soft px-3 py-1 text-[13.5px] font-bold text-forest">{e.hours}h</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-right text-[14px] font-semibold text-ink/60">Total: <span className="text-ink">{total}h</span></p>
        </>
      ) : (
        <EmptyState>No records found for {range.toLowerCase()}.</EmptyState>
      )}
    </Card>
  );
}
