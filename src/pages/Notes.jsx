import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

const TABS = [
  { id: "mine", label: "My Notes" },
  { id: "shared", label: "Shared Notes" },
  { id: "received", label: "Received Notes" },
  { id: "purchased", label: "Purchased Notes" },
  { id: "sold", label: "Sold Notes" },
];

const LESSONS = [
  "All Lesson",
  "Reading the Market",
  "Options 101",
  "Risk Management",
  "Leadership Basics",
];

// TODO: dummy data API reqired
const NOTES = {
  mine: [
    {
      id: "m1",
      title: "Support & resistance cheat sheet",
      lesson: "Reading the Market",
      updatedAt: "Sep 2",
      excerpt: "Key levels to watch before entering a trade, plus how to spot a false breakout.",
    },
    {
      id: "m2",
      title: "Covered calls, step by step",
      lesson: "Options 101",
      updatedAt: "Aug 28",
      excerpt: "Walkthrough of opening a covered call position and when to roll it forward.",
    },
    {
      id: "m3",
      title: "Position sizing rules I actually follow",
      lesson: "Risk Management",
      updatedAt: "Aug 21",
      excerpt: "Never risk more than 2% of the account on a single idea. Examples inside.",
    },
  ],
  shared: [
    {
      id: "s1",
      title: "Delegating without micromanaging",
      lesson: "Leadership Basics",
      sharedWith: "Thomas Kee",
    },
    {
      id: "s2",
      title: "Reading the Market — week 1 summary",
      lesson: "Reading the Market",
      sharedWith: "STD Work group",
    },
  ],
  received: [
    {
      id: "r1",
      title: "Options greeks, explained simply",
      lesson: "Options 101",
      receivedFrom: "Priya Nair",
    },
  ],
  purchased: [
    {
      id: "p1",
      title: "Full risk management playbook",
      lesson: "Risk Management",
      purchasedFrom: "Marcus Webb",
      price: 12,
    },
    {
      id: "p2",
      title: "Leadership 1:1 templates",
      lesson: "Leadership Basics",
      purchasedFrom: "Dana Kimura",
      price: 8,
    },
  ],
  sold: [
    {
      id: "so1",
      title: "Support & resistance cheat sheet",
      lesson: "Reading the Market",
      soldTo: "Jordan Blake",
      price: 5,
    },
  ],
};

const EMPTY_COPY = {
  mine: {
    title: "You haven't created any notes yet",
    body: "Notes you take on a lesson will show up here so you can find them again fast.",
    cta: "Browse lessons",
  },
  shared: {
    title: "You haven't shared any notes yet",
    body: "Share a note from any lesson and it'll be listed here for you to track.",
  },
  received: {
    title: "No one has shared a note with you yet",
    body: "Notes other members share with you will show up in this tab.",
  },
  purchased: {
    title: "You haven't purchased any notes yet",
    body: "Notes you buy from other members will be listed here.",
  },
  sold: {
    title: "You haven't sold any notes yet",
    body: "Once you sell a note, the sale will show up here.",
  },
};

export default function Notes() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = TABS.some((t) => t.id === searchParams.get("tab"))
    ? searchParams.get("tab")
    : "mine";
  const [tab, setTab] = useState(initialTab);
  const [lesson, setLesson] = useState("All Lesson");
  const [query, setQuery] = useState("");

  function goTo(id) {
    setTab(id);
    setSearchParams(id === "mine" ? {} : { tab: id });
  }

  const notes = useMemo(() => {
    return NOTES[tab].filter((n) => {
      const matchesLesson = lesson === "All Lesson" || n.lesson === lesson;
      const matchesQuery = n.title.toLowerCase().includes(query.toLowerCase());
      return matchesLesson && matchesQuery;
    });
  }, [tab, lesson, query]);

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-ink">Notes</h1>
        <p className="mt-1 text-ink/60">Everything you've written, shared, and traded, in one place.</p>
      </div>

      <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-line bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <select
          value={lesson}
          onChange={(e) => setLesson(e.target.value)}
          className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-ink focus:border-forest focus:outline-none sm:w-56"
        >
          {LESSONS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>

        <div className="relative flex-1">
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
            placeholder="Search notes by title"
            className="w-full rounded-full border border-line bg-white py-2 pl-9 pr-4 text-sm text-ink placeholder:text-ink/40 focus:border-forest focus:outline-none"
          />
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-1 rounded-full border border-line bg-white p-1 shadow-sm">
        {TABS.map((t) => {
          const count = NOTES[t.id].length;
          return (
            <button
              key={t.id}
              onClick={() => goTo(t.id)}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                tab === t.id
                  ? "bg-forest text-white"
                  : "text-ink/70 hover:bg-forest-soft hover:text-forest"
              }`}
            >
              {t.label}
              {count > 0 && (
                <span
                  className={`rounded-full px-1.5 py-px text-[11px] font-bold ${
                    tab === t.id ? "bg-white/25 text-white" : "bg-crimson text-white"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {notes.length === 0 ? (
        <EmptyState tab={tab} hasFilters={query.length > 0 || lesson !== "All Lesson"} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {notes.map((n) => (
            <NoteCard key={n.id} note={n} tab={tab} />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ tab, hasFilters }) {
  const copy = EMPTY_COPY[tab];

  if (hasFilters) {
    return (
      <div className="rounded-2xl border border-line bg-white p-10 text-center text-ink/60 shadow-sm">
        No notes match your search.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-line bg-white p-10 text-center shadow-sm">
      <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-forest-soft text-forest">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-7 w-7">
          <path d="M6 4h9l3 3v13a1 1 0 01-1 1H6a1 1 0 01-1-1V5a1 1 0 011-1z" strokeLinejoin="round" />
          <path d="M9 10h6M9 14h6M9 18h3" strokeLinecap="round" />
        </svg>
      </div>
      <h2 className="text-lg font-bold text-ink">{copy.title}</h2>
      <p className="mx-auto mt-2 max-w-md text-ink/60">{copy.body}</p>
      {copy.cta && (
        <button className="mt-6 rounded-full bg-gold px-6 py-2.5 text-sm font-bold text-ink shadow-[0_8px_20px_-10px_rgba(217,164,65,.9)] transition-transform hover:-translate-y-px hover:bg-gold-deep hover:text-white">
          {copy.cta}
        </button>
      )}
    </div>
  );
}

function NoteCard({ note, tab }) {
  const meta = {
    mine: note.updatedAt && `Updated ${note.updatedAt}`,
    shared: note.sharedWith && `Shared with ${note.sharedWith}`,
    received: note.receivedFrom && `From ${note.receivedFrom}`,
    purchased: note.purchasedFrom && `Bought from ${note.purchasedFrom}`,
    sold: note.soldTo && `Sold to ${note.soldTo}`,
  }[tab];

  return (
    <div className="rounded-2xl border border-line bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <p className="font-bold text-ink">{note.title}</p>
      <p className="mt-1 text-sm text-ink/60">{note.lesson}</p>
      {note.excerpt && <p className="mt-3 line-clamp-2 text-sm text-ink/70">{note.excerpt}</p>}
      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs font-medium text-ink/50">{meta}</span>
        {typeof note.price === "number" && (
          <span className="rounded-full bg-gold/15 px-3 py-1 text-xs font-bold text-gold-deep">
            ${note.price}
          </span>
        )}
      </div>
    </div>
  );
}