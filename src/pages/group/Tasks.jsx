import { Link, useOutletContext, useParams } from "react-router-dom";
import { Avatar, Card, PriorityBadge, StatusBadge } from "../../components/group/GroupUI";

export default function GroupTasks() {
  const { groupId } = useParams();
  const { workspace } = useOutletContext();
  const { tasks } = workspace;

  return (
    <Card title={`All Tasks (${tasks.length})`}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-separate border-spacing-y-2.5 text-left">
          <thead>
            <tr className="text-[12.5px] uppercase tracking-wider text-ink/45">
              <th className="px-4 pb-1 font-bold">Task</th>
              <th className="px-4 pb-1 font-bold">Assignee</th>
              <th className="px-4 pb-1 font-bold">Due</th>
              <th className="px-4 pb-1 font-bold">Priority</th>
              <th className="px-4 pb-1 font-bold">Status</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((t) => (
              <tr key={t.id} className="rounded-xl bg-mist/50 transition-colors hover:bg-forest-soft/60">
                <td className="rounded-l-xl px-4 py-3.5">
                  <Link to={`/projects/${groupId}/tasks/${t.id}`} className="text-[15px] font-semibold text-ink hover:text-forest hover:underline">
                    {t.title}
                  </Link>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <Avatar name={t.assignee} size={28} />
                    <span className="text-[14px] font-medium text-ink/80">{t.assignee}</span>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-[14px] italic text-ink/55">{t.date}</td>
                <td className="px-4 py-3.5"><PriorityBadge priority={t.priority} /></td>
                <td className="rounded-r-xl px-4 py-3.5"><StatusBadge status={t.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
