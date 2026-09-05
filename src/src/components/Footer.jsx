import { Link } from "react-router-dom";
import logo from "../assets/logo.png";

const cols = [
  ["Learn", [["Projects", "/projects"], ["Instruction", "/instruction"], ["Badges", "/badges"], ["Notes", "/notes"], ["Credits", "/credits"]]],
  ["Community", [["Coaches corner", "/coaches-corner"], ["Members", "/members"], ["Forum", "/forum"], ["Messages", "/messages"]]],
];

export default function Footer() {
  return (
    <footer className="relative mt-24 overflow-hidden bg-ink text-white">
      <div className="h-[3px] bg-[linear-gradient(90deg,#22433b,#d9a441_50%,#22433b)]" />
      <div className="pointer-events-none absolute -left-32 top-10 h-96 w-96 rounded-full bg-forest/40 blur-[120px]" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-gold/20 blur-[100px]" />

      <div className="relative mx-auto grid max-w-[1200px] gap-12 px-5 py-16 lg:grid-cols-[1.6fr_1fr_1fr_1.2fr]">
        <div>
          <div className="inline-block rounded-2xl bg-white p-3">
            <img src={logo} alt="SkillCoach" className="h-11 w-auto" />
          </div>
          <p className="mt-7 font-display text-[30px] font-semibold leading-tight">
            A portal for growth.<br /><span className="italic text-gold">Free, for everyone.</span>
          </p>
          <p className="mt-4 max-w-[46ch] text-[15px] leading-7 text-white/65">
            Collaborate, share, and succeed on any project, assignment, or goal — with education,
            collaboration, and performance tools that cost nothing.
          </p>
        </div>

        {cols.map(([title, items]) => (
          <div key={title}>
            <p className="font-display text-[17px] italic text-gold">{title}</p>
            <ul className="mt-5 space-y-3 text-[15px] text-white/75">
              {items.map(([label, to]) => <li key={to}><Link to={to} className="hover:text-gold">{label}</Link></li>)}
            </ul>
          </div>
        ))}

        <div>
          <p className="font-display text-[17px] italic text-gold">Contact</p>
          <address className="mt-5 text-[15px] leading-7 text-white/75 not-italic">
            SkillCoach<br />PO Box 922<br />La Jolla CA 92038<br />
            <a href="mailto:support@skillcoach.org" className="text-white underline decoration-gold/60 underline-offset-4 hover:decoration-gold">support@skillcoach.org</a>
          </address>
        </div>
      </div>

      <div className="relative border-t border-white/10">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-3 px-5 py-5 text-[14px] text-white/50">
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
