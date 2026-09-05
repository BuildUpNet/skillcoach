import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

const TABS = [
  { id: "mine", label: "My Badges" },
  { id: "categories", label: "Categories" },
  { id: "getmore", label: "Get More Badges" },
];

// TODO: dummy data
const CATEGORIES = [
  { id: "demo-category", name: "Demo Category", badges: 12, tint: "bg-forest-soft text-forest" },
  { id: "skillcoach-2", name: "SkillCoach 2", badges: 8, tint: "bg-gold/15 text-gold-deep" },
  { id: "stock-traders-daily", name: "Stock Traders Daily", badges: 24, tint: "bg-forest-soft text-forest" },
  { id: "global-markets", name: "Global Markets", badges: 16, tint: "bg-gold/15 text-gold-deep" },
  { id: "testing-group", name: "Testing Group", badges: 3, tint: "bg-forest-soft text-forest" },
  { id: "leadership", name: "Leadership", badges: 5, tint: "bg-gold/15 text-gold-deep" },
];


const MY_BADGES = [];

export default function Badges() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = TABS.some((t) => t.id === searchParams.get("tab"))
    ? searchParams.get("tab")
    : "mine";
  const [tab, setTab] = useState(initialTab);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("name"); 

  function goTo(id) {
    setTab(id);
    setSearchParams(id === "mine" ? {} : { tab: id });
  }

  const categories = useMemo(() => {
    const filtered = CATEGORIES.filter((c) =>
      c.name.toLowerCase().includes(query.toLowerCase())
    );
    return [...filtered].sort((a, b) =>
      sort === "badges" ? b.badges - a.badges : a.name.localeCompare(b.name)
    );
  }, [query, sort]);

  const totalBadges = MY_BADGES.length;
  const categoriesExplored = new Set(MY_BADGES.map((b) => b.categoryId)).size;

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-ink">Badges</h1>
        <p className="mt-1 text-ink/60">
          Pass a quiz, earn a badge, prove what you know.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-3 rounded-2xl border border-line bg-white p-5 shadow-sm">
        <Stat value={totalBadges} label="Badges earned" />
        <Stat value={categoriesExplored} label="Categories explored" />
        <Stat value={CATEGORIES.length} label="Categories available" />
      </div>

      <div className="mb-6 inline-flex flex-wrap gap-1 rounded-full border border-line bg-white p-1 shadow-sm">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => goTo(t.id)}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
              tab === t.id
                ? "bg-forest text-white"
                : "text-ink/70 hover:bg-forest-soft hover:text-forest"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "mine" && <MyBadgesPanel onExplore={() => goTo("categories")} />}
      {tab === "categories" && (
        <CategoriesPanel
          categories={categories}
          query={query}
          setQuery={setQuery}
          sort={sort}
          setSort={setSort}
        />
      )}
      {tab === "getmore" && <GetMorePanel />}
    </div>
  );
}

function Stat({ value, label }) {
  return (
    <div>
      <p className="text-3xl font-bold text-forest">{value}</p>
      <p className="text-sm text-ink/60">{label}</p>
    </div>
  );
}

function MedalIcon({ className = "h-7 w-7" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <circle cx="12" cy="14" r="6" />
      <path d="M9.5 8.5L7 3M14.5 8.5L17 3" strokeLinecap="round" />
      <path d="M10 14l1.5 1.5L15 12" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MyBadgesPanel({ onExplore }) {
  if (MY_BADGES.length === 0) {
    return (
      <div className="rounded-2xl border border-line bg-white p-10 text-center shadow-sm">
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-forest-soft text-forest">
          <MedalIcon />
        </div>
        <h2 className="text-lg font-bold text-ink">You don't have any badges yet</h2>
        <p className="mx-auto mt-2 max-w-md text-ink/60">
          Pass a quiz for any lesson to earn your first badge. It only takes a few minutes.
        </p>
        <button
          onClick={onExplore}
          className="mt-6 rounded-full bg-gold px-6 py-2.5 text-sm font-bold text-ink shadow-[0_8px_20px_-10px_rgba(217,164,65,.9)] transition-transform hover:-translate-y-px hover:bg-gold-deep hover:text-white"
        >
          Browse categories
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {MY_BADGES.map((b) => (
        <div key={b.id} className="rounded-2xl border border-line bg-white p-5 shadow-sm">
          <div className="mb-3 grid h-12 w-12 place-items-center rounded-xl bg-forest-soft text-forest">
            <MedalIcon className="h-6 w-6" />
          </div>
          <p className="font-bold text-ink">{b.categoryName}</p>
          <p className="text-sm text-ink/60">{b.count} sub-badges earned</p>
        </div>
      ))}
    </div>
  );
}

function CategoriesPanel({ categories, query, setQuery, sort, setSort }) {
  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search categories"
            className="w-full rounded-full border border-line bg-white py-2 pl-9 pr-4 text-sm text-ink placeholder:text-ink/40 focus:border-forest focus:outline-none"
          />
        </div>

        <div className="flex gap-1 rounded-full border border-line bg-white p-1">
          {[
            { id: "name", label: "A–Z" },
            { id: "badges", label: "Most badges" },
          ].map((s) => (
            <button
              key={s.id}
              onClick={() => setSort(s.id)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                sort === s.id
                  ? "bg-forest text-white"
                  : "text-ink/60 hover:bg-forest-soft hover:text-forest"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {categories.length === 0 ? (
        <div className="rounded-2xl border border-line bg-white p-10 text-center text-ink/60 shadow-sm">
          No categories match "{query}".
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <div
              key={c.id}
              className="rounded-2xl border border-line bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className={`grid h-12 w-12 place-items-center rounded-xl text-lg font-bold ${c.tint}`}>
                  {c.name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-ink">{c.name}</p>
                  <p className="text-sm text-ink/60">{c.badges} badges available</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-forest-soft px-3 py-1 text-xs font-semibold text-forest">
                  Not started
                </span>
                <button className="text-sm font-semibold text-forest hover:text-gold-deep">
                  View badges
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function GetMorePanel() {
  const steps = [
    { n: 1, title: "Pick a lesson", body: "Choose any lesson in a category you're curious about." },
    { n: 2, title: "Pass the quiz", body: "Every lesson has a short quiz that checks what you learned." },
    { n: 3, title: "Earn the badge", body: "Pass it and the badge lands in My Badges right away." },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {steps.map((s) => (
          <div key={s.n} className="rounded-2xl border border-line bg-white p-5 shadow-sm">
            <div className="mb-3 grid h-9 w-9 place-items-center rounded-full bg-forest text-sm font-bold text-white">
              {s.n}
            </div>
            <p className="font-bold text-ink">{s.title}</p>
            <p className="mt-1 text-sm text-ink/60">{s.body}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
          <p className="font-bold text-ink">Compare with peers</p>
          <p className="mt-1 text-sm text-ink/60">
            More badges in a category means more quizzes passed there. Ten badges in Mathematics,
            mostly Algebra, tells people your focus without you having to explain it.
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
          <p className="font-bold text-ink">Share with employers</p>
          <p className="mt-1 text-sm text-ink/60">
            Your badge profile is a quick way to show an employer you've done the work for a role
            you're being considered for.
          </p>
        </div>
      </div>
    </div>
  );
}