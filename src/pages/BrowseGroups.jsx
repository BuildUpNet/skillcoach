import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getGroups, getCategories, joinGroup } from "../lib/api";
import { useAuth } from "../lib/AuthContext";

const VIEWS = ["Everyone's Groups", "My Groups", "Groups I Lead"];
const SORTS = ["Recently Created", "Most Members", "Alphabetical"];
const PER_PAGE = 6;

const TABS = [
  { key: "browse", label: "Browse groups", to: "/groups" },
  { key: "mine", label: "My groups", to: "/projects" },
  { key: "create", label: "Create new group", to: "/group/create" },
];

const select = "w-full cursor-pointer appearance-none rounded-xl border border-line bg-white py-3 pl-4 pr-10 text-[15px] text-ink outline-none transition-all hover:border-forest/40 focus:border-forest focus:ring-4 focus:ring-forest/10";

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-bold uppercase tracking-wider text-ink/50">{label}</span>
      <span className="relative block">
        {children}
        <svg className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
      </span>
    </label>
  );
}

function Avatar({ group }) {
  if (group.image) return <img src={group.image} alt="" className="h-20 w-20 flex-none rounded-2xl object-cover ring-1 ring-line" />;
  return (
    <div className="grid h-20 w-20 flex-none place-items-center rounded-2xl bg-forest-soft text-[26px] font-extrabold text-forest ring-1 ring-line">
      {(group.name || "?").trim()[0]?.toUpperCase() || "?"}
    </div>
  );
}

function GroupRow({ group, onJoin }) {
  const [open, setOpen] = useState(false);
  const [joining, setJoining] = useState(false);
  const long = group.description.length > 180;
  const text = open || !long ? group.description : group.description.slice(0, 180).trimEnd() + "…";

  const handleJoin = async () => {
    if (group.mine || group.approvalRequired) return;
    setJoining(true);
    try {
      await onJoin(group.id);
    } catch (err) {
      alert(err.message || "Could not join this group");
    } finally {
      setJoining(false);
    }
  };

  return (
    <li className="group flex gap-5 p-5 transition-colors hover:bg-forest-soft/40 sm:p-6">
      <Avatar group={group} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <Link to={`/projects/${group.id}`} className="block text-[20px] font-extrabold leading-tight tracking-tight text-ink hover:text-forest">
              {group.name}
            </Link>
            <p className="mt-1 text-[14px] text-ink/55">
              {group.members} {group.members === 1 ? "member" : "members"} · led by <span className="font-semibold text-ink/80">{group.leader}</span>
            </p>
          </div>
          <div className="flex flex-none items-center gap-2">
            <span className="rounded-full bg-gold-soft px-2.5 py-1 text-[12.5px] font-bold text-gold-deep">{group.category}</span>
            <button
              onClick={handleJoin}
              disabled={group.mine || joining || group.approvalRequired}
              title={group.approvalRequired ? "This group requires owner approval to join" : undefined}
              className={`rounded-lg px-3.5 py-2 text-[14px] font-bold transition-colors disabled:cursor-not-allowed ${
                group.mine ? "bg-mist text-ink/60" : group.approvalRequired ? "bg-mist text-ink/40" : "bg-forest text-white hover:bg-forest-deep disabled:opacity-60"
              }`}
            >
              {group.mine ? "Joined" : joining ? "Joining…" : group.approvalRequired ? "Approval required" : "Join"}
            </button>
          </div>
        </div>
        {group.description && (
          <p className="mt-3 text-[15px] leading-6 text-ink/70">
            {text}{" "}
            {long && (
              <button onClick={() => setOpen((o) => !o)} className="font-bold text-forest hover:underline">{open ? "less" : "more"}</button>
            )}
          </p>
        )}
      </div>
    </li>
  );
}

export default function BrowseGroups() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [rawGroups, setRawGroups] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [q, setQ] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [view, setView] = useState(VIEWS[0]);
  const [sort, setSort] = useState(SORTS[0]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getGroups(), getCategories()])
      .then(([groups, cats]) => {
        if (cancelled) return;
        setRawGroups(groups);
        setCategories(cats);
      })
      .catch((err) => !cancelled && setLoadError(err.message || "Could not load groups"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const groups = useMemo(
    () =>
      rawGroups.map((g) => ({
        id: g.group_id,
        name: g.title,
        leader: g.owner_displayname || "Unknown",
        isLeader: user && g.user_id === user.user_id,
        members: g.member_count,
        category: g.category_title || "Uncategorized",
        created: g.creation_date,
        mine: !!g.is_member,
        approvalRequired: !!g.approval,
        image: g.photo_data_url,
        description: g.description || "",
      })),
    [rawGroups, user],
  );

  const results = useMemo(() => {
    let list = groups.filter(
      (g) =>
        (g.name + " " + g.description).toLowerCase().includes(q.toLowerCase()) &&
        (category === "All Categories" || g.category === category) &&
        (view === "Everyone's Groups" || (view === "My Groups" && g.mine) || (view === "Groups I Lead" && g.isLeader)),
    );
    if (sort === "Recently Created") list = [...list].sort((a, b) => b.created.localeCompare(a.created));
    if (sort === "Most Members") list = [...list].sort((a, b) => b.members - a.members);
    if (sort === "Alphabetical") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [groups, q, category, view, sort]);

  const pages = Math.max(1, Math.ceil(results.length / PER_PAGE));
  const current = Math.min(page, pages);
  const slice = results.slice((current - 1) * PER_PAGE, current * PER_PAGE);
  const reset = (setter) => (v) => { setter(v); setPage(1); };

  const handleJoin = async (groupId) => {
    await joinGroup(groupId);
    setRawGroups((rows) =>
      rows.map((r) => (r.group_id === groupId ? { ...r, is_member: true, member_count: r.member_count + 1 } : r)),
    );
  };

  if (loading) {
    return (
      <div className="mx-auto grid max-w-[1200px] min-h-[50vh] place-items-center px-4">
        <p className="text-ink/50">Loading groups…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto grid max-w-[1200px] min-h-[50vh] place-items-center px-4 text-center">
        <p className="text-[16px] font-semibold text-ink">{loadError}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px] px-4 pt-6">
      {/* header band */}
      <section className="relative overflow-hidden rounded-3xl bg-forest px-8 py-10 text-white lg:px-14">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gold/30 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,.08)_1px,transparent_0)] bg-[size:28px_28px]" />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-[13px] font-bold uppercase tracking-wider text-gold">Browse groups</p>
            <h1 className="mt-2 text-[34px] font-extrabold leading-tight tracking-tight lg:text-[44px]">
              Create a project, instructional group,<br className="hidden lg:block" /> or personal project management portal.
            </h1>
          </div>
          <div className="rounded-2xl bg-white/10 px-5 py-4 ring-1 ring-white/15 backdrop-blur">
            <div className="text-[32px] font-extrabold leading-none text-gold">{groups.length}</div>
            <div className="mt-1 text-[14px] text-white/70">groups to explore</div>
          </div>
        </div>
      </section>

      {/* tabs */}
      <div role="tablist" className="mt-8 inline-flex rounded-2xl bg-white p-1.5 ring-1 ring-line">
        {TABS.map((t) => (
          <button key={t.key} role="tab" aria-selected={t.key === "browse"} onClick={() => navigate(t.to)}
            className={`rounded-xl px-5 py-2.5 text-[15px] font-semibold transition-colors ${t.key === "browse" ? "bg-forest text-white shadow" : "text-ink/60 hover:text-ink"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* filters */}
      <section className="mt-4 grid gap-4 rounded-3xl bg-white p-5 ring-1 ring-line md:grid-cols-[1.6fr_1fr_1fr_1fr]">
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-bold uppercase tracking-wider text-ink/50">Search groups</span>
          <span className="relative block">
            <svg className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-ink/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
            <input value={q} onChange={(e) => reset(setQ)(e.target.value)} placeholder="Search by name or description"
              className="w-full rounded-xl border border-line bg-white py-3 pl-11 pr-4 text-[15px] outline-none transition-all placeholder:text-ink/40 hover:border-forest/40 focus:border-forest focus:ring-4 focus:ring-forest/10" />
          </span>
        </label>
        <Field label="Category">
          <select value={category} onChange={(e) => reset(setCategory)(e.target.value)} className={select}>
            <option>All Categories</option>
            {categories.map((c) => <option key={c.category_id}>{c.title}</option>)}
          </select>
        </Field>
        <Field label="View">
          <select value={view} onChange={(e) => reset(setView)(e.target.value)} className={select}>
            {VIEWS.map((v) => <option key={v}>{v}</option>)}
          </select>
        </Field>
        <Field label="List by">
          <select value={sort} onChange={(e) => reset(setSort)(e.target.value)} className={select}>
            {SORTS.map((s) => <option key={s}>{s}</option>)}
          </select>
        </Field>
      </section>

      {/* results */}
      <div className="mt-6 flex items-center justify-between text-[14.5px] text-ink/60">
        <span>
          Showing <span className="font-bold text-ink">{slice.length ? (current - 1) * PER_PAGE + 1 : 0}–{(current - 1) * PER_PAGE + slice.length}</span> of{" "}
          <span className="font-bold text-ink">{results.length}</span> groups
        </span>
        {(q || category !== "All Categories" || view !== VIEWS[0]) && (
          <button onClick={() => { setQ(""); setCategory("All Categories"); setView(VIEWS[0]); setPage(1); }} className="font-bold text-forest hover:underline">Clear filters</button>
        )}
      </div>

      <section className="mt-3 overflow-hidden rounded-3xl bg-white ring-1 ring-line">
        {slice.length ? (
          <ul className="divide-y divide-line">{slice.map((g) => <GroupRow key={g.id} group={g} onJoin={handleJoin} />)}</ul>
        ) : (
          <div className="px-6 py-16 text-center">
            <p className="text-[20px] font-extrabold">No groups found</p>
            <p className="mt-1 text-[15px] text-ink/60">Try a different search or category.</p>
          </div>
        )}
      </section>

      {/* pagination */}
      {pages > 1 && (
        <nav className="mt-6 flex flex-wrap items-center justify-center gap-1.5 pb-4" aria-label="Pagination">
          <button disabled={current === 1} onClick={() => setPage(current - 1)} className="rounded-xl border border-line bg-white px-4 py-2.5 text-[15px] font-semibold text-ink/70 hover:border-forest hover:text-forest disabled:opacity-40">« Prev</button>
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
            <button key={n} onClick={() => setPage(n)} aria-current={n === current ? "page" : undefined}
              className={`h-11 w-11 rounded-xl text-[15px] font-bold transition-colors ${n === current ? "bg-forest text-white" : "border border-line bg-white text-ink/70 hover:border-forest hover:text-forest"}`}>
              {n}
            </button>
          ))}
          <button disabled={current === pages} onClick={() => setPage(current + 1)} className="rounded-xl border border-line bg-white px-4 py-2.5 text-[15px] font-semibold text-ink/70 hover:border-forest hover:text-forest disabled:opacity-40">Next »</button>
        </nav>
      )}
    </div>
  );
}
