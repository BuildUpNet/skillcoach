import { NavLink } from "react-router-dom";
import Icon from "./icons";

export default function GroupSidebar({ groupId, info }) {
  const base = `/projects/${groupId}`;

  const sections = [
    { label: "Overview", items: [{ to: base, label: "Dashboard", icon: "grid", end: true }] },
    {
      label: "Workspace",
      items: [
        { to: `${base}/my-tasks`, label: "My Tasks", icon: "check" },
        { to: `${base}/my-assignments`, label: "My Assignments", icon: "clipboard" },
        { to: `${base}/tasks`, label: "All Tasks", icon: "list" },
        { to: `${base}/time-summary`, label: "Time Summary", icon: "chart" },
        { to: `${base}/my-timesheet`, label: "My Timesheet", icon: "clock" },
      ],
    },
    {
      label: "People",
      items: [
        { to: `${base}/members`, label: "Members", icon: "users", badge: info.memberCount },
        { to: `${base}/invite`, label: "Invite", icon: "userPlus" },
      ],
    },
    { label: "Activity", items: [{ to: `${base}/timeline`, label: "Timeline", icon: "pulse" }] },
    { label: "Learn", items: [{ to: `${base}/lessons`, label: "Lessons", icon: "book", badge: info.lessonCount }] },
  ];

  const linkCls = ({ isActive }) =>
    `group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[14.5px] font-semibold transition-colors ${
      isActive ? "bg-gold text-ink shadow-[0_8px_20px_-10px_rgba(217,164,65,.7)]" : "text-white/65 hover:bg-white/8 hover:text-white"
    }`;

  return (
    <nav aria-label="Group navigation" className="flex flex-col gap-6">
      {sections.map((section) => (
        <div key={section.label}>
          <p className="mb-2 px-3.5 text-[14px] font-bold uppercase tracking-wider text-white/50">{section.label}</p>
          <div className="flex flex-col gap-1">
            {section.items.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={linkCls}>
                {({ isActive }) => (
                  <>
                    <Icon name={item.icon} className="h-[18px] w-[18px] flex-none" />
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badge != null && (
                      <span className={`rounded-full px-2 py-0.5 text-[13px] font-bold ${isActive ? "bg-ink/10" : "bg-white/15"}`}>
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}
