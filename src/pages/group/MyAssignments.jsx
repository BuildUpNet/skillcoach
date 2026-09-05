import { Link, useOutletContext, useParams } from "react-router-dom";
import { Card, EmptyState } from "../../components/group/GroupUI";
import Icon from "../../components/group/icons";

export default function GroupMyAssignments() {
  const { groupId } = useParams();
  const { workspace } = useOutletContext();
  const { myAssignments } = workspace;

  return (
    <Card title={`My Assignments (${myAssignments.length})`}>
      {myAssignments.length ? (
        <ul className="space-y-2.5">
          {myAssignments.map((a) => (
            <li key={`${a.taskId}-${a.id}`}>
              <Link
                to={`/projects/${groupId}/tasks/${a.taskId}?assignment=${a.id}`}
                className="flex items-center justify-between gap-4 rounded-xl border border-line bg-mist/50 px-4 py-3.5 transition-colors hover:border-forest/30 hover:bg-forest-soft/60"
              >
                <div className="flex items-center gap-3">
                  <span className={`grid h-5 w-5 flex-none place-items-center rounded-md ${a.done ? "bg-forest text-white" : "bg-crimson/15 text-crimson"}`}>
                    {a.done && <Icon name="check" className="h-3 w-3" />}
                  </span>
                  <div>
                    <p className="text-[15px] font-semibold text-ink">{a.title}</p>
                    <p className="text-[13px] text-ink/50">Part of <span className="font-medium text-ink/70">{a.taskTitle}</span></p>
                  </div>
                </div>
                <p className="flex-none text-[13px] italic text-ink/50">{a.date}</p>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState>You have no assignments in this group yet.</EmptyState>
      )}
    </Card>
  );
}
