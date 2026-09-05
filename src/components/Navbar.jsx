import { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import logo from "../assets/logo.png";

const links = [
  { to: "/projects", label: "Projects" },
  { to: "/instruction", label: "Instruction" },
  { to: "/badges", label: "Badges" },
  { to: "/notes", label: "Notes" },
  { to: "/credits", label: "Credits" },
];

const linkBase =
  "px-4 py-2.5 rounded-lg text-[15px] font-medium transition-colors hover:bg-page";

export default function Navbar({ updates = 0 }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="bg-white border-b-[3px] border-crimson">
      <div className="mx-auto w-[min(1180px,100%-40px)]">
        <div className="flex items-center justify-end gap-5 pt-2.5 text-[13px] text-gray-500">
          <Link to="/become-a-skillcoach" className="hover:text-crimson">
            Become a SkillCoach
          </Link>
          {updates > 0 && (
            <span className="rounded-full bg-orange px-2.5 py-1 text-xs font-semibold text-white">
              {updates} updates
            </span>
          )}
        </div>

        <div className="relative flex items-center justify-between gap-6 pb-3.5 pt-2">
          <Link to="/" aria-label="SkillCoach home" className="flex items-center">
            <img src={logo} alt="SkillCoach — skillcoach.org" className="h-14 w-auto md:h-[72px]" />
          </Link>

          <button
            className="rounded-lg border border-gray-200 px-2.5 py-2 md:hidden"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            ☰
          </button>

          <nav
            className={`${open ? "flex" : "hidden"} absolute left-0 right-0 top-full z-20 flex-col gap-1 border-b border-gray-200 bg-white px-5 pb-4 pt-2
                        md:static md:flex md:flex-row md:items-center md:gap-1.5 md:border-0 md:p-0`}
          >
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? "bg-orange text-white hover:bg-orange" : "text-ink"}`
                }
              >
                {l.label}
              </NavLink>
            ))}
            <button type="button" className={`${linkBase} inline-flex items-center gap-1.5 text-left text-ink`}>
              More <span className="text-xs">▾</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
