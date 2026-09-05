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
    <div className="mx-auto max-w-[1200px] px-4 pt-6">
      <section className="relative overflow-hidden rounded-3xl bg-forest px-8 py-12 text-white lg:px-14 lg:py-16">
        <div className="pointer-events-none absolute -left-20 -top-32 h-96 w-96 rounded-full bg-gold/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 right-0 h-96 w-96 rounded-full bg-crimson/40 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,.08)_1px,transparent_0)] bg-[size:28px_28px]" />

        <div className="relative grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:items-end">
          <div>
            <Link to="/personal-projects" className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-[14px] font-semibold ring-1 ring-white/20 backdrop-blur hover:bg-white/15">
              <span className="rounded-full bg-gold px-2 py-px text-[12px] font-bold text-ink">New</span>
              Personal project management — organize your life
              <span aria-hidden>→</span>
            </Link>
            <h1 className="mt-6 text-[44px] font-extrabold leading-[1.05] tracking-tight lg:text-[64px]">
              Your groups,<br />your projects.
            </h1>
            <p className="mt-5 max-w-[46ch] text-[17px] leading-7 text-white/75">
              Join groups, work alongside coaches and peers, and keep every project moving in one place.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/10 p-5 ring-1 ring-white/15 backdrop-blur">
              <div className="text-[40px] font-extrabold leading-none text-gold">{groups.length}</div>
              <div className="mt-2 text-[14.5px] text-white/70">groups joined</div>
            </div>
            <div className="rounded-2xl bg-white/10 p-5 ring-1 ring-white/15 backdrop-blur">
              <div className="text-[40px] font-extrabold leading-none">{people}</div>
              <div className="mt-2 text-[14.5px] text-white/70">people alongside you</div>
            </div>
            <div className="col-span-2 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 text-ink">
              <span className="text-[15px] font-medium text-ink/70">SkillCoaches can create groups.</span>
              <Link to="/become-a-skillcoach" className="rounded-xl bg-gold px-4 py-2.5 text-[15px] font-bold text-ink hover:bg-gold-deep hover:text-white">Become a SkillCoach</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-10 flex flex-wrap items-center justify-between gap-4">
        <div role="tablist" className="inline-flex rounded-2xl bg-white p-1.5 ring-1 ring-line">
          {TABS.map((t) => (
            <button key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)}
              className={`rounded-xl px-5 py-2.5 text-[15px] font-semibold transition-colors ${tab === t.key ? "bg-forest text-white shadow" : "text-ink/60 hover:text-ink"}`}>
              {t.label}
              {t.key === "mine" && <span className={`ml-2 rounded-full px-2 py-px text-[12px] font-bold ${tab === t.key ? "bg-gold text-ink" : "bg-mist text-ink/60"}`}>{groups.length}</span>}
            </button>
          ))}
        </div>

        <label className="relative w-full sm:w-80">
          <svg className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/40" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search groups"
            className="w-full rounded-2xl bg-white py-3 pl-11 pr-4 text-[15px] outline-none ring-1 ring-line placeholder:text-ink/40 focus:ring-2 focus:ring-forest" />
        </label>
      </section>

      <section className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((g) => <GroupCard key={g.id} group={g} onLeave={leaveGroup} />)}

        <button onClick={() => setTab("create")}
          className="group flex min-h-[320px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gold/60 bg-gold-soft/60 p-8 text-center transition-colors hover:border-gold hover:bg-gold-soft">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-gold text-3xl font-bold text-ink transition-transform group-hover:scale-110">+</span>
          <span className="mt-4 text-[18px] font-extrabold">Create a new group</span>
          <span className="mt-1 max-w-[26ch] text-[14.5px] text-ink/60">Available to SkillCoaches. Invite members and start a project.</span>
        </button>
      </section>

      {!visible.length && q && <p className="mt-6 text-center text-[15px] text-ink/60">No groups match "{q}".</p>}
    </div>
  );
}
