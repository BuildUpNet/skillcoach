import { useMemo, useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

const TABS = [
  { id: "mine", label: "My Notes", icon: "📝" },
  { id: "shared", label: "Shared Notes", icon: "👥" },
  { id: "received", label: "Received Notes", icon: "📥" },
  { id: "purchased", label: "Purchased Notes", icon: "🛍️" },
  { id: "sold", label: "Sold Notes", icon: "🏷️" },
];

const LESSONS = [
  "All Lesson",
  "Reading the Market",
  "Options 101",
  "Risk Management",
  "Leadership Basics",
];

// Dummy data
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
      updatedAt: "Sep 1",
      excerpt: "Framework for setting clear milestones while giving teammates space to execute.",
    },
    {
      id: "s2",
      title: "Reading the Market — week 1 summary",
      lesson: "Reading the Market",
      sharedWith: "STD Work group",
      updatedAt: "Aug 25",
      excerpt: "Consolidated key insights and market trends discussed in the team room.",
    },
  ],
  received: [
    {
      id: "r1",
      title: "Options greeks, explained simply",
      lesson: "Options 101",
      receivedFrom: "Priya Nair",
      updatedAt: "Aug 29",
      excerpt: "Delta, Gamma, Theta, and Vega broken down with real trade scenarios.",
    },
  ],
  purchased: [
    {
      id: "p1",
      title: "Full risk management playbook",
      lesson: "Risk Management",
      purchasedFrom: "Marcus Webb",
      updatedAt: "Aug 30",
      price: 12,
      excerpt: "Complete guide on drawdown mitigation and portfolio diversification.",
    },
    {
      id: "p2",
      title: "Leadership 1:1 templates",
      lesson: "Leadership Basics",
      purchasedFrom: "Dana Kimura",
      updatedAt: "Aug 20",
      price: 8,
      excerpt: "Effective agenda templates and tracking sheets for weekly one-on-ones.",
    },
  ],
  sold: [
    {
      id: "so1",
      title: "Support & resistance cheat sheet",
      lesson: "Reading the Market",
      soldTo: "Jordan Blake",
      updatedAt: "Sep 3",
      price: 5,
      excerpt: "Key levels to watch before entering a trade, plus how to spot a false breakout.",
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

function LessonDropdown({ value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative w-full sm:w-60 min-w-0 shrink-0">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="w-full min-w-0 flex items-center justify-between px-4 py-3 bg-[#fbfcfb] border border-gray-200 rounded-xl text-sm font-medium text-gray-800 transition-colors hover:border-[#19352d]/40 focus:border-[#19352d] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#19352d]/15 shadow-2xs"
      >
        <span className="truncate">{value}</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`shrink-0 ml-2 text-gray-500 transition-transform duration-200 ${
            open ? "rotate-180 text-[#19352d]" : ""
          }`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 w-full max-w-full mt-1.5 z-50 bg-white border border-gray-200/90 rounded-xl shadow-lg overflow-hidden py-1 animate-in fade-in slide-in-from-top-1 duration-150"
        >
          {options.map((opt) => {
            const isSelected = opt === value;
            return (
              <li key={opt}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(opt);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? "bg-[#19352d] text-white font-semibold"
                      : "text-gray-700 hover:bg-[#f2f4f2] hover:text-[#19352d]"
                  }`}
                >
                  <span className="truncate">{opt}</span>
                  {isSelected && (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="shrink-0 ml-2 text-white"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function Notes() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = TABS.some((t) => t.id === searchParams.get("tab"))
    ? searchParams.get("tab")
    : "mine";
  const [tab, setTab] = useState(initialTab);
  const [lesson, setLesson] = useState("All Lesson");
  const [query, setQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setMobileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function goTo(id) {
    setTab(id);
    setSearchParams(id === "mine" ? {} : { tab: id });
    setMobileMenuOpen(false);
  }

  const activeTabObj = TABS.find((t) => t.id === tab) || TABS[0];
  const activeCount = NOTES[tab]?.length || 0;

  const notes = useMemo(() => {
    return NOTES[tab].filter((n) => {
      const matchesLesson = lesson === "All Lesson" || n.lesson === lesson;
      const matchesQuery = n.title.toLowerCase().includes(query.toLowerCase());
      return matchesLesson && matchesQuery;
    });
  }, [tab, lesson, query]);

  return (
    <div className="overflow-x-hidden w-full max-w-full">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-wider text-[#d99b26]">
            WORKSPACE
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold text-[#19352d] tracking-tight">
            Notes
          </h1>
          <p className="mt-1 text-sm sm:text-base text-[#6b7a75]">
            Everything you've written, shared, and traded, in one place.
          </p>
        </div>

        {/* Top Filter & Search Controls */}
        <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-gray-200/80 bg-white p-3 sm:p-4 shadow-sm sm:flex-row sm:items-center">
          <LessonDropdown
            value={lesson}
            options={LESSONS}
            onChange={setLesson}
          />

          <div className="relative flex-1 min-w-0">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
            </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search notes by title..."
              className="w-full h-11 sm:h-12 rounded-xl border border-gray-200 bg-[#fbfcfb] py-2.5 pl-10 pr-4 text-sm text-[#19352d] placeholder:text-gray-400 transition-colors hover:border-[#19352d]/40 focus:border-[#19352d] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#19352d]/15"
            />
          </div>
        </div>

        {/* Category Navigation - Mobile Dropdown (< 640px) */}
        <div ref={dropdownRef} className="relative w-full min-w-0 max-w-full mb-6 sm:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            className="flex h-12 w-full min-w-0 items-center justify-between rounded-2xl border border-gray-200/90 bg-white px-4 shadow-sm transition-all hover:border-[#19352d]/40 active:scale-[0.99]"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-base shrink-0">{activeTabObj.icon}</span>
              <span className="text-sm font-bold text-[#19352d] truncate">
                {activeTabObj.label}
              </span>
              <span className="rounded-full bg-[#19352d] px-2.5 py-0.5 text-xs font-bold text-white shadow-xs shrink-0">
                {activeCount}
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-gray-400 shrink-0">
              <span>Filter</span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`transition-transform duration-200 ${mobileMenuOpen ? "rotate-180 text-[#19352d]" : ""}`}
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
          </button>

          {/* Mobile Popover Menu */}
          {mobileMenuOpen && (
            <div className="absolute left-0 right-0 top-14 z-30 w-full min-w-full max-w-full overflow-hidden rounded-2xl border border-gray-200 bg-white p-2 shadow-xl animate-in fade-in slide-in-from-top-2 duration-150">
              <p className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                Select Category
              </p>
              <div className="flex flex-col gap-1">
                {TABS.map((t) => {
                  const count = NOTES[t.id].length;
                  const isActive = tab === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => goTo(t.id)}
                      className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-sm font-semibold transition-colors ${
                        isActive
                          ? "bg-[#19352d] text-white shadow-xs"
                          : "text-gray-700 hover:bg-gray-50 active:bg-gray-100"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span>{t.icon}</span>
                        <span>{t.label}</span>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-gray-100 text-[#19352d]"
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Category Navigation - Desktop Pill Bar (>= 640px) */}
        <div className="mb-6 hidden sm:flex items-center gap-1.5 rounded-full border border-gray-200/80 bg-white p-1.5 shadow-sm">
          {TABS.map((t) => {
            const count = NOTES[t.id].length;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => goTo(t.id)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all whitespace-nowrap ${
                  active
                    ? "bg-[#19352d] text-white shadow-sm"
                    : "text-gray-700 hover:bg-emerald-50 hover:text-[#19352d] bg-transparent"
                }`}
              >
                <span>{t.label}</span>
                {count > 0 && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-bold leading-none ${
                      active ? "bg-white/20 text-white" : "bg-[#d99b26]/20 text-[#19352d]"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content Grid */}
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
    </div>
  );
}

function EmptyState({ tab, hasFilters }) {
  const copy = EMPTY_COPY[tab];

  if (hasFilters) {
    return (
      <div className="rounded-2xl border border-gray-200/80 bg-white p-8 sm:p-10 text-center text-sm sm:text-base text-[#6b7a75] shadow-sm">
        No notes match your search.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200/80 bg-white p-8 sm:p-10 text-center shadow-sm">
      <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-emerald-50 text-[#19352d]">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-7 w-7">
          <path d="M6 4h9l3 3v13a1 1 0 01-1 1H6a1 1 0 01-1-1V5a1 1 0 011-1z" strokeLinejoin="round" />
          <path d="M9 10h6M9 14h6M9 18h3" strokeLinecap="round" />
        </svg>
      </div>
      <h2 className="text-lg font-bold text-[#19352d]">{copy.title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-[#6b7a75] leading-relaxed">{copy.body}</p>
      {copy.cta && (
        <button className="mt-6 rounded-full bg-[#d99b26] px-6 py-2.5 text-sm font-bold text-[#19352d] shadow-[0_8px_20px_-10px_rgba(217,164,65,.9)] transition-transform hover:-translate-y-px hover:bg-[#c9952f] hover:text-white">
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
    <div className="rounded-2xl border border-gray-200/80 bg-white p-4 sm:p-5 shadow-sm transition-all hover:shadow-md hover:border-[#19352d]/30 flex flex-col justify-between">
      <div>
        <h3 className="font-bold text-[15px] sm:text-[16px] leading-snug text-[#19352d]">
          {note.title}
        </h3>
        <span className="inline-block mt-1.5 text-[11.5px] font-semibold text-[#19352d] bg-emerald-50 px-2.5 py-0.5 rounded-full">
          {note.lesson}
        </span>
        {note.excerpt && (
          <p className="mt-2.5 line-clamp-2 text-[13px] sm:text-[13.5px] leading-relaxed text-[#6b7a75]">
            {note.excerpt}
          </p>
        )}
      </div>
      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
        <span className="text-xs font-medium text-[#6b7a75]">{meta}</span>
        {typeof note.price === "number" && (
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-[#d99b26]">
            ${note.price}
          </span>
        )}
      </div>
    </div>
  );
}