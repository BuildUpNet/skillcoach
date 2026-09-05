import { useOutletContext } from "react-router-dom";
import { Avatar, Card, RoleBadge } from "../../components/group/GroupUI";

export default function GroupTimeSummary() {
  const { workspace } = useOutletContext();
  const { timeSummary } = workspace;
  const total = timeSummary.reduce((n, m) => n + m.hours, 0);
  const max = Math.max(...timeSummary.map((m) => m.hours));

  return (
    <Card
      title="Time Summary"
      action={<span className="text-[14px] font-semibold text-ink/55">Total: <span className="text-ink">{total}h</span></span>}
    >
      <ul className="space-y-4">
        {timeSummary.map((m) => (
          <li key={m.member}>
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Avatar name={m.member} size={36} />
                <div>
                  <p className="text-[15px] font-semibold text-ink">{m.member}</p>
                  <RoleBadge role={m.role} />
                </div>
              </div>
              <span className="text-[15px] font-bold text-ink">{m.hours}h</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-mist">
              <div className="h-full rounded-full bg-gradient-to-r from-forest to-forest-deep" style={{ width: `${(m.hours / max) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
