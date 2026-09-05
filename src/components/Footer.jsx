import { Link } from "react-router-dom";
import logo from "../assets/logo.png";

const cols = [
  ["Learn", [["Projects", "/projects"], ["Instruction", "/instruction"], ["Badges", "/badges"], ["Notes", "/notes"], ["Credits", "/credits"]]],
  ["Community", [["Coaches corner", "/coaches-corner"], ["Members", "/members"], ["Forum", "/forum"], ["Messages", "/messages"]]],
];

export default function Footer() {
  return (
    <footer className="mt-20 px-4 pb-4">
      <div className="mx-auto max-w-[1200px] overflow-hidden rounded-3xl bg-forest text-white">
        <div className="relative grid gap-10 px-8 py-12 lg:grid-cols-[1.6fr_1fr_1fr_1.2fr] lg:px-12">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gold/25 blur-3xl" />

          <div className="relative">
            <div className="inline-block rounded-2xl bg-white px-4 py-3">
              <img src={logo} alt="SkillCoach" className="h-11 w-auto" />
            </div>
            <p className="mt-6 text-[26px] font-extrabold leading-tight tracking-tight">
              A portal for growth. <span className="text-gold">Free, for everyone.</span>
            </p>
            <p className="mt-3 max-w-[48ch] text-[15px] leading-7 text-white/70">
              Collaborate, share, and succeed on any project, assignment, or goal — with education,
              collaboration, and performance tools that cost nothing.
            </p>
          </div>

          {cols.map(([title, items]) => (
            <div key={title} className="relative">
              <p className="text-[13px] font-bold uppercase tracking-wider text-gold">{title}</p>
              <ul className="mt-4 space-y-3 text-[15px] text-white/80">
                {items.map(([label, to]) => <li key={to}><Link to={to} className="hover:text-gold">{label}</Link></li>)}
              </ul>
            </div>
          ))}

          <div className="relative">
            <p className="text-[13px] font-bold uppercase tracking-wider text-gold">Contact</p>
            <address className="mt-4 text-[15px] leading-7 text-white/80 not-italic">
              SkillCoach<br />PO Box 922<br />La Jolla CA 92038<br />
              <a href="mailto:support@skillcoach.org" className="text-white underline decoration-gold/60 underline-offset-4 hover:decoration-gold">support@skillcoach.org</a>
            </address>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-8 py-5 text-[14px] text-white/55 lg:px-12">
          <span>© {new Date().getFullYear()} SkillCoach</span>
          <div className="flex gap-6">
            <Link to="/privacy" className="hover:text-gold">Privacy</Link>
            <Link to="/terms" className="hover:text-gold">Terms of Service</Link>
            <Link to="/contact" className="hover:text-gold">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
