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
  ["Account", [["My profile", "/profile/:sourabh"], ["Messages", "/messages"], ["Settings", "/settings"]]],
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

  const pill = "rounded-full px-4 py-2 text-[15px] font-semibold text-ink/70 transition-colors hover:bg-forest-soft hover:text-forest";

  return (
    <div className="sticky top-0 z-40 px-4 pt-4">
      <header className="mx-auto flex w-full max-w-[1200px] items-center gap-4 rounded-2xl border border-white/60 bg-white/85 px-4 py-2.5 shadow-[0_10px_40px_-18px_rgba(20,26,24,.35)] backdrop-blur-xl lg:rounded-full lg:px-5">
        <Link to="/" aria-label="SkillCoach home" className="flex-none">
          <img src={logo} alt="SkillCoach — skillcoach.org" className="h-11 w-auto" />
        </Link>

        <nav className="mx-auto hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className={({ isActive }) => `${pill} ${isActive ? "bg-forest text-white hover:bg-forest hover:text-white" : ""}`}>
              {l.label}
            </NavLink>
          ))}

          <div ref={ref} className="relative">
            <button onClick={() => setMenu((m) => !m)} aria-expanded={menu} className={`${pill} inline-flex items-center gap-1.5 ${menu ? "bg-forest-soft text-forest" : ""}`}>
              More
              <svg width="12" height="12" viewBox="0 0 12 12" className={`transition-transform ${menu ? "rotate-180" : ""}`}><path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            </button>
            {menu && (
              <div className="absolute right-0 mt-3 grid w-[420px] grid-cols-2 gap-1 rounded-2xl border border-line bg-white p-3 shadow-[0_24px_60px_-24px_rgba(20,26,24,.4)]">
                {more.map(([title, items]) => (
                  <div key={title}>
                    <p className="px-3 pb-1 pt-2 text-xs font-bold uppercase tracking-wider text-gold-deep">{title}</p>
                    {items.map(([label, to]) => (
                      <Link key={to} to={to} onClick={() => setMenu(false)} className="block rounded-lg px-3 py-2 text-[15px] font-medium text-ink/80 hover:bg-forest-soft hover:text-forest">{label}</Link>
                    ))}
                  </div>
                ))}
                <Link to="/signin" className="col-span-2 mt-1 rounded-lg border-t border-line px-3 pb-1 pt-3 text-[14px] font-medium text-ink/50 hover:text-crimson">Sign out</Link>
              </div>
            )}
          </div>
        </nav>

        <div className="ml-auto hidden items-center gap-2 lg:flex">
          <Link to="/updates" className="relative grid h-10 w-10 place-items-center rounded-full border border-line text-ink/70 hover:border-forest hover:text-forest" aria-label={`${updates} updates`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M6 8a6 6 0 0112 0v5l2 3H4l2-3zM10 20a2 2 0 004 0" /></svg>
            {updates > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-crimson px-1.5 py-px text-[11px] font-bold text-white">{updates}</span>}
          </Link>
          <Link to="/become-a-skillcoach" className="rounded-full bg-gold px-5 py-2.5 text-[15px] font-bold text-ink shadow-[0_8px_20px_-10px_rgba(217,164,65,.9)] transition-transform hover:-translate-y-px hover:bg-gold-deep hover:text-white">
            Become a SkillCoach
          </Link>
        </div>

        <button onClick={() => setOpen((o) => !o)} aria-label="Toggle menu" aria-expanded={open} className="ml-auto rounded-full border border-line p-2.5 lg:hidden">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={open ? "M6 6l12 12M18 6L6 18" : "M4 7h16M4 12h16M4 17h16"} /></svg>
        </button>
      </header>

      {open && (
        <div className="mx-auto mt-2 w-full max-w-[1200px] rounded-2xl border border-line bg-white p-3 shadow-xl lg:hidden">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} onClick={() => setOpen(false)} className={({ isActive }) => `block rounded-xl px-4 py-3 text-[16px] font-semibold ${isActive ? "bg-forest text-white" : "text-ink/80"}`}>{l.label}</NavLink>
          ))}
          {more.map(([title, items]) => (
            <div key={title} className="mt-2 border-t border-line pt-2">
              <p className="px-4 pb-1 text-xs font-bold uppercase tracking-wider text-gold-deep">{title}</p>
              {items.map(([label, to]) => <Link key={to} to={to} onClick={() => setOpen(false)} className="block rounded-xl px-4 py-2.5 text-[15px] font-medium text-ink/80">{label}</Link>)}
            </div>
          ))}
          <Link to="/become-a-skillcoach" className="mt-3 block rounded-xl bg-gold px-4 py-3 text-center text-[16px] font-bold text-ink">Become a SkillCoach</Link>
        </div>
      )}
    </div>
  );
}
