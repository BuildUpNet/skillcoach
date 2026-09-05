import { useState } from "react";
import { Link } from "react-router-dom";
import GroupCard from "../components/GroupCard";

const TABS = [
  { key: "browse", label: "Browse groups" },
  { key: "mine", label: "My groups" },
  { key: "create", label: "Create new group" },
];

const initialGroups = [
  { id: 1, name: "STD work", description: "Work on Stock Traders Daily", members: 10, leader: "Thomas Kee", image: "/groups/std.png" },
];

export default function Projects() {
  const [tab, setTab] = useState("mine");
  const [groups, setGroups] = useState(initialGroups);
  const [q, setQ] = useState("");

  const leaveGroup = (id) => setGroups((g) => g.filter((x) => x.id !== id));
  const visible = groups.filter((g) => g.name.toLowerCase().includes(q.toLowerCase()));
  const people = groups.reduce((n, g) => n + g.members, 0);

  return (
    <div className="mx-auto max-w-[1200px] px-5">
      {/* announcement */}
      <Link to="/personal-projects" className="mt-6 flex items-center gap-4 rounded-2xl border border-gold/40 bg-gold-soft px-5 py-3 text-[15px] transition-colors hover:border-gold">
        <span className="rounded-full bg-forest px-2.5 py-px text-[12px] font-bold text-white">New</span>
        <span className="text-ink/85">Personal project management — organize your life.</span>
        <span className="ml-auto font-bold text-forest">Explore →</span>
      </Link>

      {/* hero */}
      <section className="relative mt-6 overflow-hidden rounded-[28px] bg-[radial-gradient(120%_140%_at_0%_0%,#2f5a4f_0%,#22433b_45%,#162d27_100%)] text-white shadow-[0_40px_80px_-40px_rgba(22,45,39,.6)]">
        <div className="pointer-events-none absolute inset-3 rounded-[20px] border border-gold/30" />
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-gold/25 blur-[90px]" />

        <div className="relative grid gap-10 px-8 py-12 lg:grid-cols-[1.35fr_1fr] lg:items-center lg:px-14 lg:py-16">
          <div>
            <p className="font-display text-[17px] italic text-gold">skillcoach.org</p>
            <h1 className="mt-3 font-display text-[46px] font-semibold leading-[1.05] lg:text-[66px]">
              Your groups,<br />your <span className="italic text-gold">projects.</span>
            </h1>
            <p className="mt-6 max-w-[46ch] text-[17px] leading-7 text-white/80">
              Join groups, work alongside coaches and peers, and keep every project moving in one place.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link to="/become-a-skillcoach" className="rounded-full bg-gold px-6 py-3 text-[15px] font-bold text-ink shadow-[0_12px_28px_-12px_rgba(217,164,65,.9)] transition-all hover:-translate-y-px hover:bg-white">
                Become a SkillCoach
              </Link>
              <span className="text-[15px] text-white/70">SkillCoaches can create groups.</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-gold/40 bg-white/[.06] p-6 backdrop-blur">
              <div className="font-display text-[52px] font-semibold leading-none text-gold">{groups.length}</div>
              <div className="mt-3 text-[14.5px] text-white/75">groups joined</div>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/[.06] p-6 backdrop-blur">
              <div className="font-display text-[52px] font-semibold leading-none">{people}</div>
              <div className="mt-3 text-[14.5px] text-white/75">people alongside you</div>
            </div>
          </div>
        </div>
      </section>

      {/* controls */}
      <section className="mt-12 flex flex-wrap items-center justify-between gap-4">
        <div role="tablist" className="inline-flex rounded-full border border-line bg-white p-1.5">
          {TABS.map((t) => (
            <button key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)}
              className={`rounded-full px-5 py-2.5 text-[15px] font-semibold transition-colors ${tab === t.key ? "bg-forest text-white" : "text-ink/60 hover:text-forest"}`}>
              {t.label}
              {t.key === "mine" && <span className={`ml-2 rounded-full px-2 py-px text-[12px] font-bold ${tab === t.key ? "bg-gold text-ink" : "bg-cream text-ink/60"}`}>{groups.length}</span>}
            </button>
          ))}
        </div>

        <label className="relative w-full sm:w-80">
          <svg className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/40" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search groups"
            className="w-full rounded-full border border-line bg-white py-3 pl-11 pr-4 text-[15px] outline-none placeholder:text-ink/40 focus:border-gold focus:ring-2 focus:ring-gold/30" />
        </label>
      </section>

      {/* grid */}
      <section className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((g) => <GroupCard key={g.id} group={g} onLeave={leaveGroup} />)}

        <button onClick={() => setTab("create")}
          className="group flex min-h-[330px] flex-col items-center justify-center rounded-[22px] border-2 border-dashed border-gold/60 bg-white p-8 text-center transition-colors hover:border-gold hover:bg-gold-soft">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-forest text-3xl font-bold text-white transition-transform group-hover:scale-110">+</span>
          <span className="mt-5 font-display text-[22px] font-semibold">Create a new group</span>
          <span className="mt-1.5 max-w-[26ch] text-[14.5px] text-ink/60">Available to SkillCoaches. Invite members and start a project.</span>
        </button>
      </section>

      {!visible.length && q && <p className="mt-6 text-center text-[15px] text-ink/60">No groups match "{q}".</p>}
    </div>
  );
}
