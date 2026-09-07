import { useState, useMemo, useRef, useEffect } from "react";
import { Link } from "react-router-dom";

const USER_TYPES = ["All Types", "Normal User", "SkillCoach", "Admin"];
const GENDERS = ["All Genders", "Male", "Female", "Other"];

const INITIAL_MEMBERS = [
  {
    id: "m1",
    username: "shreegemsandjewel",
    name: "Shree Gems & Jewel",
    role: "Normal User",
    gender: "Other",
    hasPhoto: true,
    avatar: "SG",
    joined: "Aug 2026",
    mutualFriends: 2,
  },
  {
    id: "m2",
    username: "priyanair",
    name: "Priya Nair",
    role: "SkillCoach",
    gender: "Female",
    hasPhoto: true,
    avatar: "PN",
    joined: "Jul 2026",
    mutualFriends: 5,
  },
  {
    id: "m3",
    username: "thomaskee",
    name: "Thomas Kee",
    role: "SkillCoach",
    gender: "Male",
    hasPhoto: true,
    avatar: "TK",
    joined: "Jun 2026",
    mutualFriends: 8,
  },
  {
    id: "m4",
    username: "marcuswebb",
    name: "Marcus Webb",
    role: "Normal User",
    gender: "Male",
    hasPhoto: false,
    avatar: "MW",
    joined: "May 2026",
    mutualFriends: 1,
  },
  {
    id: "m5",
    username: "danakimura",
    name: "Dana Kimura",
    role: "SkillCoach",
    gender: "Female",
    hasPhoto: true,
    avatar: "DK",
    joined: "Apr 2026",
    mutualFriends: 4,
  },
  {
    id: "m6",
    username: "jordanblake",
    name: "Jordan Blake",
    role: "Normal User",
    gender: "Male",
    hasPhoto: true,
    avatar: "JB",
    joined: "Mar 2026",
    mutualFriends: 0,
  },
];

function CustomDropdown({ id, label, value, options, onChange }) {
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
    <div ref={ref} className="relative w-full min-w-0 max-w-full">
      <label htmlFor={id} className="block text-xs font-semibold text-[#19352d] mb-1.5">
        {label}
      </label>
      <button
        id={id}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="w-full h-11 sm:h-12 flex items-center justify-between rounded-xl border border-gray-200 bg-[#fbfcfb] px-3.5 sm:px-4 text-sm font-medium text-[#19352d] outline-none transition-all hover:border-[#19352d]/40 focus:border-[#19352d] focus:bg-white focus:ring-2 focus:ring-[#19352d]/15 shadow-2xs text-left"
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
          className={`shrink-0 ml-2 text-[#19352d]/60 transition-transform duration-200 ${
            open ? "rotate-180 text-[#19352d]" : ""
          }`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={label}
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 w-full min-w-full max-w-full rounded-xl border border-gray-200/90 bg-white py-1 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150"
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
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 text-sm text-left transition-colors ${
                    isSelected
                      ? "bg-emerald-50 text-[#19352d] font-bold"
                      : "text-gray-700 hover:bg-gray-50 active:bg-gray-100"
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
                      className="shrink-0 ml-2 text-[#19352d]"
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

export default function Members() {
  const [searchName, setSearchName] = useState("");
  const [userType, setUserType] = useState("All Types");
  const [gender, setGender] = useState("All Genders");
  const [onlyPhotos, setOnlyPhotos] = useState(false);
  const [friendsList, setFriendsList] = useState({});

  const filteredMembers = useMemo(() => {
    return INITIAL_MEMBERS.filter((m) => {
      const matchName =
        !searchName ||
        m.username.toLowerCase().includes(searchName.toLowerCase()) ||
        m.name.toLowerCase().includes(searchName.toLowerCase());
      const matchType = userType === "All Types" || m.role === userType;
      const matchGender = gender === "All Genders" || m.gender === gender;
      const matchPhoto = !onlyPhotos || m.hasPhoto;
      return matchName && matchType && matchGender && matchPhoto;
    });
  }, [searchName, userType, gender, onlyPhotos]);

  const toggleFriend = (id) => {
    setFriendsList((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="w-full overflow-x-hidden">
      <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Page Title */}
        <header className="mb-6">
          <p className="text-xs font-bold uppercase tracking-wider text-[#d99b26]">
            COMMUNITY
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold text-[#19352d] tracking-tight">
            Members Directory
          </h1>
          <p className="mt-1 text-sm text-[#6b7a75]">
            Discover coaches, peers, and fellow members across the platform.
          </p>
        </header>

        {/* Search & Filter Card */}
        <section className="mb-6 rounded-2xl border border-gray-200/80 bg-white p-4 sm:p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Search by Name */}
            <div className="relative w-full min-w-0 max-w-full">
              <label htmlFor="member-search" className="block text-xs font-semibold text-[#19352d] mb-1.5">
                Search Name / Username
              </label>
              <div className="relative w-full">
                <input
                  id="member-search"
                  type="text"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  placeholder="e.g. shreegems"
                  className="w-full h-11 sm:h-12 rounded-xl border border-gray-200 bg-[#fbfcfb] px-3.5 pl-9 text-sm text-[#19352d] placeholder:text-gray-400 outline-none transition-colors hover:border-[#19352d]/40 focus:border-[#19352d] focus:bg-white focus:ring-2 focus:ring-[#19352d]/15"
                />
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            {/* User Type Custom Dropdown */}
            <CustomDropdown
              id="user-type-dropdown"
              label="User Type"
              value={userType}
              options={USER_TYPES}
              onChange={setUserType}
            />

            {/* Gender Custom Dropdown */}
            <CustomDropdown
              id="gender-dropdown"
              label="Gender"
              value={gender}
              options={GENDERS}
              onChange={setGender}
            />
          </div>

          {/* Checkbox Section */}
          <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
            <label className="group flex cursor-pointer select-none items-center gap-2.5 text-sm text-[#19352d]">
              <input
                type="checkbox"
                checked={onlyPhotos}
                onChange={(e) => setOnlyPhotos(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 accent-[#19352d] cursor-pointer"
              />
              <span className="text-sm font-medium text-[#19352d]/80 group-hover:text-[#19352d]">
                Only members with photos
              </span>
            </label>

            {(searchName || userType !== "All Types" || gender !== "All Genders" || onlyPhotos) && (
              <button
                type="button"
                onClick={() => {
                  setSearchName("");
                  setUserType("All Types");
                  setGender("All Genders");
                  setOnlyPhotos(false);
                }}
                className="text-xs font-semibold text-[#d99b26] hover:underline"
              >
                Reset filters
              </button>
            )}
          </div>
        </section>

        {/* Result Meta Header */}
        <div className="mb-4 flex items-center justify-between px-1">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
            {filteredMembers.length} {filteredMembers.length === 1 ? "member" : "members"} found
          </p>
        </div>

        {/* Member Result Listing */}
        {filteredMembers.length === 0 ? (
          <div className="rounded-2xl border border-gray-200/80 bg-white p-10 text-center text-sm text-[#6b7a75] shadow-sm">
            <p className="text-base font-semibold text-[#19352d] mb-1">No members found</p>
            <p>Try clearing your filters or searching with a different name.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMembers.map((member) => {
              const isFriend = !!friendsList[member.id];
              return (
                <article
                  key={member.id}
                  className="rounded-2xl border border-gray-200/80 bg-white p-4 sm:p-5 shadow-sm transition-all hover:border-[#19352d]/30 hover:shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="relative grid h-12 w-12 sm:h-13 sm:w-13 shrink-0 place-items-center rounded-full bg-[#19352d] font-bold text-white shadow-sm">
                      {member.avatar}
                      {member.hasPhoto && (
                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          to={`/profile/${member.username}`}
                          className="truncate font-bold text-[15px] sm:text-base text-[#19352d] hover:text-[#d99b26] transition-colors"
                        >
                          {member.username}
                        </Link>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            member.role === "SkillCoach"
                              ? "bg-amber-100 text-[#d99b26]"
                              : "bg-emerald-50 text-[#19352d]"
                          }`}
                        >
                          {member.role}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-[#6b7a75]">
                        Joined {member.joined}
                        {member.mutualFriends > 0 && ` · ${member.mutualFriends} mutual friends`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                    <button
                      type="button"
                      onClick={() => toggleFriend(member.id)}
                      className={`w-full sm:w-auto px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-all active:scale-[0.98] shadow-sm ${
                        isFriend
                          ? "border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100"
                          : "bg-[#19352d] hover:bg-[#122721] text-white"
                      }`}
                    >
                      {isFriend ? "✓ Friend Request Sent" : "+ Add friend"}
                    </button>
                    <Link
                      to={`/profile/${member.username}`}
                      className="hidden sm:inline-flex items-center justify-center px-3 py-2.5 text-xs font-semibold text-[#19352d] rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      View profile
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
