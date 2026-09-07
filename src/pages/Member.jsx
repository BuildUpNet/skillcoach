import { useMemo, useState } from "react";

const TONES = [
  "bg-forest text-white",
  "bg-gold text-ink",
  "bg-crimson text-white",
  "bg-ink text-white",
];

const USER_TYPES = ["All", "Admin", "Normal User", "Public", "Skillcoach", "Super admin"];
const GENDERS = ["Any", "Male", "Female"];
const AGES = Array.from({ length: 100 - 13 + 1 }, (_, i) => 13 + i);

// TODO: replace with real member data once this is wired up to your API
const MEMBERS = [
  { id: 1, name: "shreegemsandjewel", type: "Normal User", gender: "Female", age: 24, hasPhoto: false },
  { id: 2, name: "AlcaGunn", type: "Normal User", gender: "Female", age: 31, hasPhoto: false },
  { id: 3, name: "Sofia Roy", type: "Skillcoach", gender: "Female", age: 28, hasPhoto: true },
  { id: 4, name: "Jofaboy160", type: "Normal User", gender: "Male", age: 22, hasPhoto: false },
  { id: 5, name: "David Johnyy", type: "Normal User", gender: "Male", age: 35, hasPhoto: false },
  { id: 6, name: "Sourabh", type: "Normal User", gender: "Male", age: 27, hasPhoto: false, isSelf: true },
  { id: 7, name: "Hudson Chris", type: "Skillcoach", gender: "Male", age: 41, hasPhoto: true },
  { id: 8, name: "Austinjohn", type: "Normal User", gender: "Male", age: 19, hasPhoto: false },
  { id: 9, name: "Robert James127", type: "Normal User", gender: "Male", age: 33, hasPhoto: false },
  { id: 10, name: "vapormoYxr", type: "Public", gender: "Male", age: 26, hasPhoto: false },
  { id: 11, name: "Priya Nair", type: "Admin", gender: "Female", age: 38, hasPhoto: true },
  { id: 12, name: "Marcus Webb", type: "Normal User", gender: "Male", age: 45, hasPhoto: false },
];

const TOTAL_MEMBERS = "49,086";
const PAGE_SIZE = 8;

function initials(name) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function Avatar({ name, tone }) {
  return (
    <div className={`grid h-16 w-16 place-items-center rounded-2xl text-lg font-bold ${tone}`}>
      {initials(name)}
    </div>
  );
}

function MemberCard({ member, index }) {
  const tone = TONES[index % TONES.length];

  return (
    <div className="rounded-2xl border border-line bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center gap-4">
        <Avatar name={member.name} tone={tone} />
        <div className="min-w-0">
          <p className="truncate font-bold text-ink">{member.name}</p>
          <p className="text-sm text-ink/55">{member.type}</p>
        </div>
      </div>

      {member.isSelf ? (
        <span className="mt-4 flex w-full items-center justify-center rounded-full border border-line py-2.5 text-sm font-semibold text-ink/40">
          That's you
        </span>
      ) : (
        <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-forest py-2.5 text-sm font-semibold text-white transition-colors hover:bg-forest-deep">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
            <circle cx="9" cy="8" r="3" />
            <path d="M3.5 19c.6-3 2.8-4.6 5.5-4.6s4.9 1.6 5.5 4.6" strokeLinecap="round" />
            <path d="M18 8v5M15.5 10.5h5" strokeLinecap="round" />
          </svg>
          Add friend
        </button>
      )}
    </div>
  );
}

const initialFilters = {
  query: "",
  userType: "All",
  gender: "Any",
  ageMin: "",
  ageMax: "",
  hasPhoto: false,
};

export default function Members() {
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);

  function updateFilter(key, value) {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  }

  function resetFilters() {
    setFilters(initialFilters);
    setPage(1);
  }

  const filtered = useMemo(() => {
    return MEMBERS.filter((m) => {
      const matchesQuery = m.name.toLowerCase().includes(filters.query.toLowerCase());
      const matchesType = filters.userType === "All" || m.type === filters.userType;
      const matchesGender = filters.gender === "Any" || m.gender === filters.gender;
      const matchesMin = !filters.ageMin || m.age >= Number(filters.ageMin);
      const matchesMax = !filters.ageMax || m.age <= Number(filters.ageMax);
      const matchesPhoto = !filters.hasPhoto || m.hasPhoto;
      return matchesQuery && matchesType && matchesGender && matchesMin && matchesMax && matchesPhoto;
    });
  }, [filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const filtersActive =
    filters.query ||
    filters.userType !== "All" ||
    filters.gender !== "Any" ||
    filters.ageMin ||
    filters.ageMax ||
    filters.hasPhoto;

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8">
      <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-forest to-forest-deep px-8 py-9 sm:px-10">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(rgba(244,246,245,0.14) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />
        <div className="pointer-events-none absolute -top-28 -left-20 h-80 w-80 rounded-full bg-gold/30 blur-[90px]" />
        <div className="pointer-events-none absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-crimson/20 blur-[100px]" />

        <div className="relative z-10">
          <p className="mb-2 text-sm font-semibold text-gold">Community</p>
          <h1 className="text-3xl font-extrabold text-white sm:text-4xl">
            {TOTAL_MEMBERS} members strong.
          </h1>
          <p className="mt-2 max-w-lg text-[15px] leading-relaxed text-white/70">
            Find people to learn alongside, add a friend, and see what they're working on.
          </p>
        </div>
      </div>

      {/* Filter panel */}
      <div className="mb-6 rounded-2xl border border-line bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink/60">Name</label>
            <input
              value={filters.query}
              onChange={(e) => updateFilter("query", e.target.value)}
              placeholder="Search by name"
              className="w-full rounded-full border border-line px-4 py-2 text-sm text-ink placeholder:text-ink/40 focus:border-forest focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-ink/60">User type</label>
            <select
              value={filters.userType}
              onChange={(e) => updateFilter("userType", e.target.value)}
              className="w-full rounded-full border border-line px-4 py-2 text-sm text-ink focus:border-forest focus:outline-none"
            >
              {USER_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-ink/60">Gender</label>
            <select
              value={filters.gender}
              onChange={(e) => updateFilter("gender", e.target.value)}
              className="w-full rounded-full border border-line px-4 py-2 text-sm text-ink focus:border-forest focus:outline-none"
            >
              {GENDERS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-ink/60">Age range</label>
            <div className="flex items-center gap-2">
              <select
                value={filters.ageMin}
                onChange={(e) => updateFilter("ageMin", e.target.value)}
                className="w-full rounded-full border border-line px-3 py-2 text-sm text-ink focus:border-forest focus:outline-none"
              >
                <option value="">Min</option>
                {AGES.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
              <span className="text-ink/40">–</span>
              <select
                value={filters.ageMax}
                onChange={(e) => updateFilter("ageMax", e.target.value)}
                className="w-full rounded-full border border-line px-3 py-2 text-sm text-ink focus:border-forest focus:outline-none"
              >
                <option value="">Max</option>
                {AGES.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <label className="inline-flex items-center gap-2 text-sm text-ink/70">
            <input
              type="checkbox"
              checked={filters.hasPhoto}
              onChange={(e) => updateFilter("hasPhoto", e.target.checked)}
              className="h-4 w-4 rounded border-line accent-forest"
            />
            Only members with photos
          </label>

          {filtersActive && (
            <button onClick={resetFilters} className="text-sm font-semibold text-forest hover:text-gold-deep">
              Clear filters
            </button>
          )}
        </div>
      </div>

      <p className="mb-4 text-sm text-ink/50">
        {filtered.length} member{filtered.length === 1 ? "" : "s"} found
      </p>

      {pageItems.length === 0 ? (
        <div className="rounded-2xl border border-line bg-white p-10 text-center text-ink/60 shadow-sm">
          No members match your filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {pageItems.map((m, i) => (
            <MemberCard key={m.id} member={m} index={i} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`h-8 w-8 rounded-full text-sm font-semibold transition-colors ${
                page === p ? "bg-forest text-white" : "text-ink/60 hover:bg-forest-soft hover:text-forest"
              }`}
            >
              {p}
            </button>
          ))}
          {page < totalPages && (
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="ml-1 rounded-full px-3 py-1.5 text-sm font-semibold text-ink/60 hover:bg-forest-soft hover:text-forest"
            >
              Next »
            </button>
          )}
        </div>
      )}
    </div>
  );
}