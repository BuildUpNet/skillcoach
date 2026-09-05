import { useMemo, useRef, useState } from "react";

const CATEGORIES = [
  {
    id: "getting-started",
    name: "Getting Started",
    blurb: "The essentials, in order.",
    lessons: [
      {
        id: "gs-1",
        title: "Welcome to SkillCoach",
        level: "Beginner",
        duration: "3:12",
        views: "1.2k",
        seed: [30, 45, 40, 60, 55, 70, 65, 80, 75, 90, 85, 95],
        description: "A tour of the dashboard, groups, and where everything lives.",
      },
      {
        id: "gs-2",
        title: "Setting Up Your Profile",
        level: "Beginner",
        duration: "2:04",
        views: "864",
        seed: [50, 40, 55, 45, 60, 50, 65, 55, 70, 60, 75, 65],
        description: "Photo, bio, and notification preferences in under two minutes.",
      },
      {
        id: "gs-3",
        title: "Joining Your First Group",
        level: "Beginner",
        duration: "4:41",
        views: "2.3k",
        seed: [70, 60, 75, 55, 80, 50, 85, 45, 90, 40, 95, 35],
        description: "Find a group led by a coach and start working alongside peers.",
      },
      {
        id: "gs-4",
        title: "Reading the Dashboard",
        level: "Beginner",
        duration: "5:00",
        views: "1.9k",
        seed: [40, 55, 50, 65, 60, 75, 70, 85, 80, 90, 88, 92],
        description: "What every card, badge, and counter on your dashboard means.",
      },
    ],
  },
  {
    id: "trend-tracker",
    name: "Trend Tracker",
    blurb: "Spotting and following market moves.",
    lessons: [
      {
        id: "tt-1",
        title: "Trend Tracker Intro",
        level: "Beginner",
        duration: "5:00",
        views: "2.2k",
        seed: [60, 65, 55, 70, 50, 75, 45, 80, 40, 85, 35, 90],
        description: "Get started using Trend Tracker to follow live market signals.",
      },
      {
        id: "tt-2",
        title: "Reading the Signals",
        level: "Intermediate",
        duration: "7:26",
        views: "1.4k",
        seed: [45, 60, 50, 65, 55, 70, 60, 75, 65, 80, 70, 85],
        description: "What each signal color and shape is telling you, and when to act.",
      },
      {
        id: "tt-3",
        title: "Setting Custom Alerts",
        level: "Intermediate",
        duration: "4:18",
        views: "930",
        seed: [80, 60, 70, 50, 65, 45, 75, 55, 85, 40, 90, 35],
        description: "Get pinged the moment a symbol you're watching crosses a level.",
      },
    ],
  },
  {
    id: "filters",
    name: "Filters & Search",
    blurb: "Cut the noise down to what matters.",
    lessons: [
      {
        id: "f-1",
        title: "Building a Custom Filter",
        level: "Intermediate",
        duration: "8:58",
        views: "1.1k",
        seed: [50, 65, 45, 70, 40, 75, 55, 80, 60, 85, 65, 90],
        description: "Combine conditions to surface exactly the setups you care about.",
      },
      {
        id: "f-2",
        title: "Saving & Sharing Presets",
        level: "Intermediate",
        duration: "3:37",
        views: "612",
        seed: [40, 50, 60, 45, 55, 65, 50, 60, 70, 55, 65, 75],
        description: "Save a filter once, reuse it everywhere, share it with your group.",
      },
      {
        id: "f-3",
        title: "Keyword Search Tips",
        level: "Beginner",
        duration: "2:46",
        views: "480",
        seed: [55, 45, 60, 50, 65, 55, 70, 60, 75, 65, 80, 70],
        description: "Search operators that narrow results fast across lessons and notes.",
      },
    ],
  },
  {
    id: "groups",
    name: "Working With Groups",
    blurb: "Coaches, peers, and shared projects.",
    lessons: [
      {
        id: "g-1",
        title: "Creating Your First Group",
        level: "Intermediate",
        duration: "6:12",
        views: "1.6k",
        seed: [65, 55, 70, 50, 75, 60, 80, 55, 85, 65, 90, 70],
        description: "Set up a workspace, invite members, and pick a lead structure.",
      },
      {
        id: "g-2",
        title: "Assigning Tasks to Members",
        level: "Intermediate",
        duration: "4:55",
        views: "740",
        seed: [45, 55, 65, 50, 60, 70, 55, 65, 75, 60, 70, 80],
        description: "Break a project down and hand out ownership without the chaos.",
      },
      {
        id: "g-3",
        title: "Tracking Timesheets",
        level: "Advanced",
        duration: "9:03",
        views: "398",
        seed: [70, 50, 65, 45, 60, 40, 75, 55, 80, 50, 85, 60],
        description: "Log hours against tasks and pull a clean weekly summary.",
      },
    ],
  },
];

const CONTINUE_WATCHING = [
  { id: "gs-1", progress: 72 },
  { id: "tt-1", progress: 35 },
  { id: "f-1", progress: 90 },
];

const LEVELS = ["All", "Beginner", "Intermediate", "Advanced"];
const SORTS = [
  { id: "recent", label: "Most Recent" },
  { id: "popular", label: "Most Viewed" },
  { id: "shortest", label: "Shortest First" },
  { id: "longest", label: "Longest First" },
];

const LEVEL_STYLE = {
  Beginner: "text-forest",
  Intermediate: "text-gold-deep",
  Advanced: "text-crimson",
};


function parseViews(v) {
  if (v.toLowerCase().endsWith("k")) return parseFloat(v) * 1000;
  return parseInt(v.replace(/,/g, ""), 10) || 0;
}

function parseDuration(d) {
  const [m, s] = d.split(":").map(Number);
  return m * 60 + (s || 0);
}

function sortLessons(lessons, sortBy) {
  const list = [...lessons];
  if (sortBy === "popular") list.sort((a, b) => parseViews(b.views) - parseViews(a.views));
  else if (sortBy === "shortest") list.sort((a, b) => parseDuration(a.duration) - parseDuration(b.duration));
  else if (sortBy === "longest") list.sort((a, b) => parseDuration(b.duration) - parseDuration(a.duration));
  // "recent" keeps authored order
  return list;
}


function ChartThumb({ lesson }) {
  return (
    <div className="relative h-[132px] rounded-t-2xl overflow-hidden bg-gradient-to-br from-forest to-forest-deep flex items-end p-3.5">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(244,246,245,0.07) 0 1px, transparent 1px 26px)",
        }}
      />
      <div className="relative z-10 flex items-end gap-1 h-[68px] w-full">
        {lesson.seed.map((h, i) => (
          <span
            key={i}
            className="flex-1 rounded-t-sm"
            style={{
              height: `${h}%`,
              background: i % 3 === 0 ? "#d9a441" : "rgba(244,246,245,0.28)",
            }}
          />
        ))}
      </div>
      <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center text-ivory">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M7 5.5v13l11-6.5-11-6.5Z" fill="currentColor" />
        </svg>
      </div>
      <span className="absolute bottom-2.5 right-3 z-10 bg-black/70 text-ivory text-[11px] px-2 py-0.5 rounded">
        {lesson.duration}
      </span>
    </div>
  );
}

function LessonCard({ lesson, categoryName, progress }) {
  return (
    <button
      type="button"
      aria-label={`Play ${lesson.title}`}
      className="group flex-none w-[250px] text-left bg-white border border-line rounded-2xl overflow-hidden hover:border-gold hover:-translate-y-0.5 transition-all"
    >
      <ChartThumb lesson={lesson} />
      {typeof progress === "number" && (
        <div className="h-[3px] bg-line">
          <div className="h-full bg-gold" style={{ width: `${progress}%` }} />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center gap-1.5 text-xs text-ink/55 mb-1.5">
          <span className={`font-semibold ${LEVEL_STYLE[lesson.level]}`}>{lesson.level}</span>
          <span>·</span>
          <span>{lesson.views} views</span>
        </div>
        <h3 className="text-[15px] font-semibold leading-snug mb-1.5 text-ink">{lesson.title}</h3>
        <p className="text-[13px] text-ink/60 leading-relaxed">{lesson.description}</p>
        {categoryName && (
          <span className="inline-block mt-2.5 text-[11px] text-forest bg-forest-soft px-2 py-0.5 rounded-full">
            {categoryName}
          </span>
        )}
      </div>
    </button>
  );
}

function Shelf({ category, lessons }) {
  const trackRef = useRef(null);
  const scrollBy = (dir) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <section className="mb-9">
      <div className="flex items-end justify-between mb-3.5">
        <div>
          <h2 className="text-xl font-bold text-ink">{category.name}</h2>
          <p className="text-[13.5px] text-ink/55 mt-0.5">{category.blurb}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            aria-label="Scroll left"
            className="w-8 h-8 rounded-full border border-line bg-white text-ink hover:bg-forest hover:text-white hover:border-forest transition-colors"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => scrollBy(1)}
            aria-label="Scroll right"
            className="w-8 h-8 rounded-full border border-line bg-white text-ink hover:bg-forest hover:text-white hover:border-forest transition-colors"
          >
            ›
          </button>
        </div>
      </div>
      <div ref={trackRef} className="flex gap-4 overflow-x-auto pb-2 scroll-smooth snap-x snap-proximity">
        {lessons.map((lesson) => (
          <div key={lesson.id} className="snap-start">
            <LessonCard lesson={lesson} />
          </div>
        ))}
      </div>
    </section>
  );
}

export default function Instruction() {
  const [query, setQuery] = useState("");
  const [activeChip, setActiveChip] = useState("All");
  const [level, setLevel] = useState("All");
  const [sortBy, setSortBy] = useState("recent");

  const allLessons = useMemo(
    () => CATEGORIES.flatMap((c) => c.lessons.map((l) => ({ ...l, categoryName: c.name }))),
    []
  );

  const isDefaultView = !query.trim() && activeChip === "All" && level === "All";

  const continueWatching = useMemo(
    () =>
      CONTINUE_WATCHING.map((cw) => ({
        ...allLessons.find((l) => l.id === cw.id),
        progress: cw.progress,
      })).filter((l) => l && l.title),
    [allLessons]
  );

  // Category shelves, filtered by level + sorted, categories hidden by chip / when empty
  const shelves = useMemo(() => {
    const cats = activeChip === "All" ? CATEGORIES : CATEGORIES.filter((c) => c.name === activeChip);
    return cats
      .map((c) => {
        const filtered = level === "All" ? c.lessons : c.lessons.filter((l) => l.level === level);
        return { category: c, lessons: sortLessons(filtered, sortBy) };
      })
      .filter((s) => s.lessons.length > 0);
  }, [activeChip, level, sortBy]);

  // Flat search results, filtered by level + sorted
  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    const matched = allLessons.filter(
      (l) =>
        (l.title.toLowerCase().includes(q) ||
          l.description.toLowerCase().includes(q) ||
          l.categoryName.toLowerCase().includes(q)) &&
        (level === "All" || l.level === level)
    );
    return sortLessons(matched, sortBy);
  }, [query, level, sortBy, allLessons]);

  const chips = ["All", ...CATEGORIES.map((c) => c.name)];
  const totalLessons = allLessons.length;

  return (
    <div className="max-w-[1400px] mx-auto px-8 py-6">

      {/*Hero Section*/}

      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-forest to-forest-deep px-10 py-10 grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-8">
        {/* dot-grid texture */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(rgba(244,246,245,0.14) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />
        {/* warm glow accents */}
        <div className="pointer-events-none absolute -top-28 -left-20 h-80 w-80 rounded-full bg-gold/30 blur-[90px]" />
        <div className="pointer-events-none absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-crimson/20 blur-[100px]" />

        <div className="relative z-10">
          <p className="text-gold text-sm font-semibold mb-3">Instruction</p>
          <h1 className="text-white text-4xl font-extrabold leading-tight max-w-xl">
            Learn the platform, one lesson at a time.
          </h1>
          <p className="text-white/70 mt-3.5 max-w-md text-[15px] leading-relaxed">
            Short videos from your coaches, organized by what you're trying to get done — not a
            wall of uploads to scroll through.
          </p>

          <div className="mt-7 flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-4 py-2.5 max-w-md">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/50 shrink-0">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='Search lessons — try "filter" or "trend tracker"'
              className="bg-transparent outline-none text-white placeholder-white/45 text-sm w-full"
            />
          </div>
        </div>

        <div className="relative z-10 flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/8 border border-white/10 rounded-2xl p-4">
              <strong className="block text-2xl font-extrabold text-gold">{totalLessons}</strong>
              <span className="text-xs text-white/60">Lessons</span>
            </div>
            <div className="bg-white/8 border border-white/10 rounded-2xl p-4">
              <strong className="block text-2xl font-extrabold text-gold">{CATEGORIES.length}</strong>
              <span className="text-xs text-white/60">Categories</span>
            </div>
            <div className="bg-white/8 border border-white/10 rounded-2xl p-4">
              <strong className="block text-2xl font-extrabold text-gold">~2.5h</strong>
              <span className="text-xs text-white/60">Runtime</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg flex-1 flex flex-col justify-center">
            <p className="text-ink font-semibold text-[15px] mb-1">
              Only SkillCoaches can publish lessons.
            </p>
            <p className="text-ink/55 text-[13px] mb-4">
              Become a coach to record lessons and share them with your group.
            </p>
            <button
              type="button"
              className="self-start bg-gold hover:bg-gold-deep text-ink font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors"
            >
              Become a SkillCoach
            </button>
          </div>
        </div>
      </div>

      {/*  Filter bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mt-6">
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => setActiveChip(chip)}
              className={`px-4 py-2 rounded-full text-sm border transition-colors ${
                activeChip === chip
                  ? "bg-forest text-white border-forest"
                  : "bg-white text-ink/65 border-line hover:border-gold"
              }`}
            >
              {chip}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            aria-label="Filter by level"
            className="bg-white border border-line rounded-full px-4 py-2 text-sm text-ink/75 cursor-pointer focus:outline-none focus:ring-2 focus:ring-gold/40"
          >
            {LEVELS.map((lvl) => (
              <option key={lvl} value={lvl}>
                {lvl === "All" ? "All Levels" : lvl}
              </option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label="Sort lessons"
            className="bg-white border border-line rounded-full px-4 py-2 text-sm text-ink/75 cursor-pointer focus:outline-none focus:ring-2 focus:ring-gold/40"
          >
            {SORTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      <main className="mt-8">
        {searchResults ? (
          searchResults.length ? (
            <section className="mb-9">
              <div className="mb-3.5">
                <h2 className="text-xl font-bold text-ink">Results for &ldquo;{query}&rdquo;</h2>
                <p className="text-[13.5px] text-ink/55 mt-0.5">
                  {searchResults.length} lesson{searchResults.length === 1 ? "" : "s"} found
                </p>
              </div>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4">
                {searchResults.map((lesson) => (
                  <LessonCard key={lesson.id} lesson={lesson} categoryName={lesson.categoryName} />
                ))}
              </div>
            </section>
          ) : (
            <p className="text-center text-ink/55 py-16">
              No lessons match &ldquo;{query}&rdquo;. Try a different keyword or clear your level filter.
            </p>
          )
        ) : (
          <>
            {isDefaultView && continueWatching.length > 0 && (
              <section className="mb-9">
                <div className="mb-3.5">
                  <h2 className="text-xl font-bold text-ink">Continue Watching</h2>
                  <p className="text-[13.5px] text-ink/55 mt-0.5">Pick up right where you left off.</p>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {continueWatching.map((lesson) => (
                    <LessonCard key={lesson.id} lesson={lesson} progress={lesson.progress} />
                  ))}
                </div>
              </section>
            )}

            {shelves.length > 0 ? (
              shelves.map(({ category, lessons }) => (
                <Shelf key={category.id} category={category} lessons={lessons} />
              ))
            ) : (
              <p className="text-center text-ink/55 py-16">
                No lessons at this level yet in this category. Try “All Levels”.
              </p>
            )}
          </>
        )}
      </main>
    </div>
  );
}