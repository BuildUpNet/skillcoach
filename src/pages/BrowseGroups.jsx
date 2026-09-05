import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const CATEGORIES = [
  "Arts & Culture", "Business", "Entertainment", "Family & Home", "Health & Wellness", "Sports", "Technology", "Other",
  "Mathematics", "Design", "Engineering", "Languages", "Economics & Social Science", "Economics", "Science", "Investing", "Law",
];
const VIEWS = ["Everyone's Groups", "My Groups", "Groups I Lead"];
const SORTS = ["Recently Created", "Most Members", "Alphabetical"];
const PER_PAGE = 6;

// demo data — replace with API response
const GROUPS = [
  { id: 1, name: "Online Discussion Group", leader: "Robert james127", members: 1, category: "Health & Wellness", created: "2026-08-30", mine: false, image: null,
    description: "Managing Business Change in Healthcare: A Guide for Nursing Professionals. Healthcare organizations operate in an environment of constant change. New technologies, evolving patient expectations, workforce challenges, regulatory requirements, and changing care models mean nurses must adapt constantly." },
  { id: 2, name: "echten", leader: "cachorro", members: 1, category: "Other", created: "2026-08-28", mine: false, image: null,
    description: "Een echt rijbewijs, geregistreerd op onze website, zonder dat een examen of praktijktest nodig is. We hebben alleen uw gegevens nodig en deze worden binnen acht dagen in ons systeem geregistreerd." },
  { id: 3, name: "Apply for Turkey Visa Your Complete Online Application Guide", leader: "Valena Drixell", members: 1, category: "Law", created: "2026-08-25", mine: false, image: null,
    description: "Getting my Turkey visa online was far easier than I expected. The whole process took about ten minutes from start to finish. You simply fill in your personal details, passport information, and travel dates, then upload a clear scan of your passport bio page." },
  { id: 4, name: "The Wiki Creators", leader: "Hudson Chris", members: 1, category: "Business", created: "2026-08-20", mine: false, image: "/groups/wiki.png",
    description: "Welcome to The Wiki Creators community — a place for businesses, entrepreneurs, authors, executives, and public figures who want to learn more about building a credible presence on Wikipedia. This group is dedicated to sharing valuable insights, practical tips and real experiences." },
  { id: 5, name: "reports", leader: "miasreports", members: 1, category: "Economics", created: "2026-08-18", mine: false, image: null, description: "research reports" },
  { id: 6, name: "STD work", leader: "Thomas Kee", members: 10, category: "Investing", created: "2026-07-01", mine: true, image: "/groups/std.png", description: "Work on Stock Traders Daily" },
  { id: 7, name: "fiwfan", leader: "fiwfan", members: 1, category: "Entertainment", created: "2026-08-10", mine: false, image: null,
    description: "Travel and modern life have changed the way people meet and connect. Today, many people are looking for more than just entertainment or sightseeing. They want real conversations, trusted friendships, and meaningful experiences." },
  { id: 8, name: "Decor", leader: "Cherishx decor", members: 1, category: "Design", created: "2026-08-08", mine: false, image: null, description: "" },
  { id: 9, name: "Book Illustration", leader: "Steven Hawk", members: 1, category: "Arts & Culture", created: "2026-08-05", mine: false, image: null,
    description: "Book Illustration is at the top of the list for those looking for a skilled illustrator in England. We have a team of very creative professionals which we put to work on your children's books, eBooks, comics, educational materials, and custom story telling." },
  { id: 10, name: "wordle unlimited", leader: "reduce drosella", members: 1, category: "Entertainment", created: "2026-08-01", mine: false, image: null,
    description: "While it's not literally a store management game, the mental skills it hones — resource allocation, strategic thinking, and adaptation — are surprisingly similar to those required to run a successful shop. And it's addictive fun to boot." },
];

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
      {group.name.trim()[0].toUpperCase()}
    </div>
  );
}

function GroupRow({ group }) {
  const [open, setOpen] = useState(false);
  const long = group.description.length > 180;
  const text = open || !long ? group.description : group.description.slice(0, 180).trimEnd() + "…";

  return (
    <li className="group flex gap-5 p-5 transition-colors hover:bg-forest-soft/40 sm:p-6">
      <Avatar group={group} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <Link to={`/groups/${group.id}`} className="block text-[20px] font-extrabold leading-tight tracking-tight text-ink hover:text-forest">
              {group.name}
            </Link>
            <p className="mt-1 text-[14px] text-ink/55">
              {group.members} {group.members === 1 ? "member" : "members"} · led by <span className="font-semibold text-ink/80">{group.leader}</span>
            </p>
          </div>
          <div className="flex flex-none items-center gap-2">
            <span className="rounded-full bg-gold-soft px-2.5 py-1 text-[12.5px] font-bold text-gold-deep">{group.category}</span>
            <button className={`rounded-lg px-3.5 py-2 text-[14px] font-bold transition-colors ${group.mine ? "bg-mist text-ink/60" : "bg-forest text-white hover:bg-forest-deep"}`}>
              {group.mine ? "Joined" : "Join"}
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
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [view, setView] = useState(VIEWS[0]);
  const [sort, setSort] = useState(SORTS[0]);
  const [page, setPage] = useState(1);

  const results = useMemo(() => {
    let list = GROUPS.filter((g) =>
      (g.name + " " + g.description).toLowerCase().includes(q.toLowerCase()) &&
      (category === "All Categories" || g.category === category) &&
      (view === "Everyone's Groups" || (view === "My Groups" && g.mine) || (view === "Groups I Lead" && g.leader === "You"))
    );
    if (sort === "Recently Created") list = [...list].sort((a, b) => b.created.localeCompare(a.created));
    if (sort === "Most Members") list = [...list].sort((a, b) => b.members - a.members);
    if (sort === "Alphabetical") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [q, category, view, sort]);

  const pages = Math.max(1, Math.ceil(results.length / PER_PAGE));
  const current = Math.min(page, pages);
  const slice = results.slice((current - 1) * PER_PAGE, current * PER_PAGE);
  const reset = (setter) => (v) => { setter(v); setPage(1); };

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
            <div className="text-[32px] font-extrabold leading-none text-gold">{GROUPS.length}</div>
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
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
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
          <ul className="divide-y divide-line">{slice.map((g) => <GroupRow key={g.id} group={g} />)}</ul>
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
