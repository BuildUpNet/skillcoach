import { useEffect, useRef, useState } from "react";
import { NavLink, Link } from "react-router-dom";
import logo from "../assets/logo.png";

const links = [
  { to: "/projects", label: "Projects" },
  { to: "/instruction", label: "Instruction" },
  { to: "/badges", label: "Badges" },
  { to: "/notes", label: "Notes" },
  { to: "/credits", label: "Credits" },
];

const more = [
  ["Community", [["Coaches corner", "/coaches-corner"], ["Members", "/members"], ["Forum", "/forum"], ["Summary", "/summary"]]],
  ["Account", [["My profile", "/profile"], ["Messages", "/messages"], ["Settings", "/settings"]]],
];

export default function Navbar({ updates = 0 }) {
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => ref.current && !ref.current.contains(e.target) && setMenu(false);
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const item =
    "relative px-4 py-2 text-[15px] font-semibold text-ink/70 transition-colors hover:text-forest after:absolute after:inset-x-4 after:-bottom-[15px] after:h-[2px] after:origin-left after:scale-x-0 after:bg-gold after:transition-transform hover:after:scale-x-100";

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ivory/90 backdrop-blur-lg">
      <div className="h-[3px] bg-[linear-gradient(90deg,#22433b,#d9a441_50%,#22433b)]" />
      <div className="mx-auto flex max-w-[1200px] items-center gap-6 px-5 py-3.5">
        <Link to="/" aria-label="SkillCoach home" className="flex-none">
          <img src={logo} alt="SkillCoach — skillcoach.org" className="h-12 w-auto" />
        </Link>

        <nav className="mx-auto hidden items-center lg:flex">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className={({ isActive }) => `${item} ${isActive ? "text-forest after:scale-x-100" : ""}`}>
              {l.label}
            </NavLink>
          ))}
          <div ref={ref} className="relative">
            <button onClick={() => setMenu((m) => !m)} aria-expanded={menu} className={`${item} inline-flex items-center gap-1.5 ${menu ? "text-forest" : ""}`}>
              More
              <svg width="11" height="11" viewBox="0 0 12 12" className={`transition-transform ${menu ? "rotate-180" : ""}`}><path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            </button>
            {menu && (
              <div className="absolute right-0 mt-5 grid w-[440px] grid-cols-2 gap-2 rounded-2xl border border-line bg-white p-4 shadow-[0_30px_70px_-30px_rgba(28,21,23,.45)]">
                <div className="col-span-2 h-px bg-[linear-gradient(90deg,transparent,#d9a441,transparent)]" />
                {more.map(([title, items]) => (
                  <div key={title}>
                    <p className="px-3 pb-1 pt-1 font-display text-[15px] italic text-gold-deep">{title}</p>
                    {items.map(([label, to]) => (
                      <Link key={to} to={to} onClick={() => setMenu(false)} className="block rounded-lg px-3 py-2 text-[15px] font-medium text-ink/80 hover:bg-forest-soft hover:text-forest">{label}</Link>
                    ))}
                  </div>
                ))}
                <Link to="/logout" className="col-span-2 mt-1 border-t border-line px-3 pt-3 text-[14.5px] font-medium text-ink/50 hover:text-forest">Sign out</Link>
              </div>
            )}
          </div>
        </nav>

        <div className="ml-auto hidden items-center gap-3 lg:flex">
          <Link to="/updates" className="relative grid h-11 w-11 place-items-center rounded-full border border-line bg-white text-ink/70 hover:border-gold hover:text-forest" aria-label={`${updates} updates`}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 8a6 6 0 0112 0v5l2 3H4l2-3zM10 20a2 2 0 004 0" /></svg>
            {updates > 0 && <span className="absolute -right-1.5 -top-1.5 rounded-full bg-forest px-1.5 py-px text-[11px] font-bold text-white ring-2 ring-ivory">{updates}</span>}
          </Link>
          <Link to="/become-a-skillcoach" className="rounded-full bg-forest px-6 py-3 text-[15px] font-bold text-white shadow-[0_10px_24px_-12px_rgba(34,67,59,.8)] ring-1 ring-inset ring-white/10 transition-all hover:-translate-y-px hover:bg-forest-deep">
            Become a SkillCoach
          </Link>
        </div>

        <button onClick={() => setOpen((o) => !o)} aria-label="Toggle menu" aria-expanded={open} className="ml-auto rounded-full border border-line bg-white p-2.5 lg:hidden">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={open ? "M6 6l12 12M18 6L6 18" : "M4 7h16M4 12h16M4 17h16"} /></svg>
        </button>
      </div>

      {open && (
        <div className="border-t border-line bg-white px-5 py-4 lg:hidden">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} onClick={() => setOpen(false)} className={({ isActive }) => `block rounded-xl px-4 py-3 text-[16px] font-semibold ${isActive ? "bg-forest-soft text-forest" : "text-ink/80"}`}>{l.label}</NavLink>
          ))}
          {more.map(([title, items]) => (
            <div key={title} className="mt-3 border-t border-line pt-3">
              <p className="px-4 pb-1 font-display text-[15px] italic text-gold-deep">{title}</p>
              {items.map(([label, to]) => <Link key={to} to={to} onClick={() => setOpen(false)} className="block rounded-xl px-4 py-2.5 text-[15px] font-medium text-ink/80">{label}</Link>)}
            </div>
          ))}
          <Link to="/become-a-skillcoach" className="mt-4 block rounded-xl bg-forest px-4 py-3 text-center text-[16px] font-bold text-white">Become a SkillCoach</Link>
        </div>
      )}
    </header>
  );
}
