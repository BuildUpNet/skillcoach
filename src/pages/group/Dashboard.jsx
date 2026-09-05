import { useState } from "react";
import { Link, useOutletContext, useParams } from "react-router-dom";
import { Card, EmptyState, PriorityBadge, StatTile, StatusBadge } from "../../components/group/GroupUI";
import Icon from "../../components/group/icons";

export default function GroupDashboard() {
  const { groupId } = useParams();
  const { workspace } = useOutletContext();
  const { myAssignments, myTasks, timesheet, forum, lessons } = workspace;
  const [focus, setFocus] = useState("tasks");

  const openTasks = myTasks.filter((t) => t.status !== "Completed").length;
  const hoursThisWeek = timesheet["This week"].reduce((n, e) => n + e.hours, 0);
  const today = timesheet.Today;
  const activeLesson = lessons.find((l) => l.progress < 100) || lessons[0];

  const list = focus === "tasks" ? myTasks : myAssignments;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile value={openTasks} label="Open tasks" accent="crimson" />
        <StatTile value={myAssignments.length} label="Assignments" accent="gold" />
        <StatTile value={`${hoursThisWeek}h`} label="Logged this week" />
        <StatTile value={forum.posts} label="Forum posts" accent="gold" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2" title={null}>
          <div className="-m-6 mb-0 flex items-center gap-1 border-b border-line px-3 pt-2">
            {[
              { key: "tasks", label: "My Tasks" },
              { key: "assignments", label: "My Assignments" },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setFocus(t.key)}
                className={`rounded-t-xl px-4 py-3 text-[15px] font-bold transition-colors ${
                  focus === t.key ? "border-b-2 border-forest text-forest" : "text-ink/45 hover:text-ink/70"
                }`}
              >
                {t.label}
              </button>
            ))}
            <Link
              to={focus === "tasks" ? "my-tasks" : "my-assignments"}
              className="ml-auto mr-1 hidden text-[13.5px] font-bold text-forest hover:underline sm:inline"
            >
              View all
            </Link>
          </div>

          <ul className="mt-5 space-y-2.5">
            {list.map((item) => (
              <li key={item.id}>
                <Link
                  to={focus === "tasks" ? `/projects/${groupId}/tasks/${item.id}` : `/projects/${groupId}/tasks/${item.taskId}?assignment=${item.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line px-4 py-3.5 transition-colors hover:border-forest/30 hover:bg-forest-soft/40"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold text-ink">{item.title}</p>
                    <p className="text-[13px] italic text-ink/50">{item.date}</p>
                  </div>
                  {focus === "tasks" && (
                    <div className="flex items-center gap-2">
                      <PriorityBadge priority={item.priority} />
                      <StatusBadge status={item.status} />
                    </div>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        <div className="space-y-6">
          <Card title="Today">
            {today.length ? (
              <ul className="space-y-2.5">
                {today.map((e) => (
                  <li key={e.id} className="rounded-xl bg-mist/60 px-4 py-3">
                    <p className="text-[14.5px] font-semibold text-ink">{e.task}</p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-[13px] text-ink/50">
                      <Icon name="clock" className="h-3.5 w-3.5" /> {e.hours}h logged
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState>No time logged today.</EmptyState>
            )}
            <Link to="my-timesheet" className="mt-4 block text-center text-[13.5px] font-bold text-forest hover:underline">
              Open timesheet
            </Link>
          </Card>

          <Card title="Forum">
            <div className="flex items-center justify-between rounded-xl bg-mist/60 px-4 py-3.5">
              <div>
                <p className="text-[14.5px] font-semibold text-ink">{forum.title}</p>
                <p className="text-[12.5px] uppercase tracking-wider text-gold-deep">{forum.subtitle}</p>
              </div>
              <div className="flex gap-5 text-center">
                <div>
                  <div className="text-[18px] font-extrabold leading-none text-forest">{forum.topics}</div>
                  <div className="text-[11px] uppercase tracking-wider text-ink/45">Topics</div>
                </div>
                <div>
                  <div className="text-[18px] font-extrabold leading-none text-forest">{forum.posts}</div>
                  <div className="text-[11px] uppercase tracking-wider text-ink/45">Posts</div>
                </div>
              </div>
            </div>
          </Card>

          {activeLesson && (
            <Card title="Keep learning">
              <p className="text-[14.5px] font-semibold text-ink">{activeLesson.title}</p>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-mist">
                <div className="h-full rounded-full bg-gradient-to-r from-forest to-forest-deep" style={{ width: `${activeLesson.progress}%` }} />
              </div>
              <Link to="lessons" className="mt-4 block text-center text-[13.5px] font-bold text-forest hover:underline">
                {activeLesson.progress > 0 ? "Continue lesson" : "Start lesson"}
              </Link>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
