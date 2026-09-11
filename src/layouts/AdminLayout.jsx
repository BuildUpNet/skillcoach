import { NavLink, Outlet } from "react-router-dom";
import { FiShield } from "react-icons/fi";

const tabs = [
  { to: "/admin/roles", label: "Roles" },
  { to: "/admin/users", label: "Users" },
  { to: "/admin/groups", label: "Groups" },
  // Temporarily disabled — no clear use case for this yet, kept for later.
  // { to: "/admin/settings", label: "Settings" },
  { to: "/admin/logs", label: "Activity logs" },
];

export default function AdminLayout() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <header className="mb-6 flex items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-forest text-white">
          <FiShield size={20} />
        </span>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-gold-deep">Admin</p>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            Roles &amp; Access
          </h1>
        </div>
      </header>

      <nav className="mb-6 flex w-fit max-w-full flex-wrap gap-1 rounded-2xl border border-line bg-white p-1 shadow-sm sm:rounded-full">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            className={({ isActive }) =>
              `whitespace-nowrap rounded-full px-4 py-2 text-[14px] font-semibold transition-colors ${
                isActive ? "bg-forest text-white" : "text-ink/60 hover:bg-forest-soft hover:text-forest"
              }`
            }
          >
            {t.label}
          </NavLink>
        ))}
      </nav>

      <Outlet />
    </div>
  );
}
