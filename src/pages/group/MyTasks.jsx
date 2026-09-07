import { Link, useOutletContext, useParams } from "react-router-dom";
import { Card, EmptyState, PriorityBadge, StatusBadge } from "../../components/group/GroupUI";

export default function GroupMyTasks() {
  const { groupId } = useParams();
  const { workspace } = useOutletContext();
  const { myTasks } = workspace;

  return (
    <Card title={`My Tasks (${myTasks.length})`}>
      {myTasks.length ? (
        <ul className="space-y-2.5">
          {myTasks.map((t) => (
            <li key={t.id}>
              <Link
                to={`/projects/${groupId}/tasks/${t.id}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-mist/50 px-4 py-3.5 transition-colors hover:border-forest/30 hover:bg-forest-soft/60"
              >
                <div>
                  <p className="text-[15px] font-semibold text-ink">{t.title}</p>
                  <p className="text-[13px] italic text-ink/50">{t.date}</p>
                </div>
                <div className="flex items-center gap-2">
                  <PriorityBadge priority={t.priority} />
                  <StatusBadge status={t.status} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState>No tasks are assigned to you right now.</EmptyState>
      )}
    </Card>
  );
}
