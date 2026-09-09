import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import GroupCard from "../components/GroupCard";
import { deleteGroup, getGroups } from "../lib/api";
import { useAuth } from "../lib/AuthContext";
import InvitesBanner from "../components/InvitesBanner";
const TABS = [
  { key: "browse", label: "Browse groups", to: "/group/browser" },
  { key: "mine", label: "My groups" },
  { key: "create", label: "Create new group", to: "/group/create" },
];

const toCard = (g, currentUserId) => {
  const isOwner = g.user_id === currentUserId;
    const isMember = isOwner || !!g.is_member || (Array.isArray(g.members) && 
 g.members.some((m) => m.user_id === currentUserId));

  return {
    id: g.group_id,
    ownerId: g.user_id,
    name: g.title,
    description: g.description,
    members: g.member_count,
    leader: isOwner ? "You" : g.owner_displayname || `User #${g.user_id}`,
    image: g.photo_data_url || null,
    isOwner,
    isMember,
    memberList: g.members || [],
  };
};

export default function Projects() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [tab, setTab] = useState("mine");
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");

  useEffect(() => {
    getGroups()
      .then((rows) => setGroups(rows.map((g) => toCard(g, user?.user_id))))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user]);

  // pick up a group created on /group/create
  useEffect(() => {
    const g = location.state?.newGroup;
    if (g) {
      setGroups((prev) => (prev.some((x) => x.id === g.id) ? prev : [...prev, g]));
      setTab("mine");
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location, navigate]);

  const selectTab = (t) => (t.to ? navigate(t.to) : setTab(t.key));
  const leaveGroup = async (id) => {
    await deleteGroup(id);
    setGroups((g) => g.filter((x) => x.id !== id));
  };
  const mine = groups.filter((g) => g.isMember);
  const visible = mine.filter((g) => g.name.toLowerCase().includes(q.toLowerCase()));
  const people = mine.reduce((n, g) => n + g.members, 0);

  return (
    <div className="w-full max-w-full overflow-x-hidden min-h-screen">
      <div className="mx-auto max-w-[1200px] px-4 py-4 sm:px-6 lg:px-8 sm:py-6">
        {/* hero */}
        <section className="relative w-full max-w-full overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-b from-[#19352d] to-[#122721] p-5 sm:p-8 lg:p-12 text-white">
          <div className="pointer-events-none absolute -left-20 -top-32 h-72 w-72 sm:h-96 sm:w-96 rounded-full bg-[#d99b26]/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-40 right-0 h-72 w-72 sm:h-96 sm:w-96 rounded-full bg-red-500/20 blur-3xl" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,.08)_1px,transparent_0)] bg-[size:28px_28px]" />

          <div className="relative grid gap-6 sm:gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-end">
            <div>
              <Link
                to="/personal-projects"
                className="inline-flex max-w-full items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs sm:text-sm font-semibold ring-1 ring-white/20 backdrop-blur hover:bg-white/15 transition-colors"
              >
                <span className="rounded-full bg-[#d99b26] px-2 py-0.5 text-[11px] font-bold text-[#19352d]">
                  New
                </span>
                <span className="truncate">Personal project management</span>
                <span aria-hidden>→</span>
              </Link>
              <h1 className="mt-4 sm:mt-6 text-2xl sm:text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight">
                Your groups,<br />your projects.
              </h1>
              <p className="mt-3 sm:mt-4 max-w-[46ch] text-sm sm:text-base leading-relaxed text-white/75">
                Join groups, work alongside coaches and peers, and keep every project moving in one place.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 w-full">
              <div className="rounded-2xl bg-white/10 p-4 sm:p-5 ring-1 ring-white/15 backdrop-blur">
                <div className="text-3xl sm:text-4xl font-extrabold leading-none text-[#d99b26]">
                  {mine.length}
                </div>
                <div className="mt-2 text-xs sm:text-sm text-white/70 font-medium">
                  groups joined
                </div>
              </div>
              <div className="rounded-2xl bg-white/10 p-4 sm:p-5 ring-1 ring-white/15 backdrop-blur">
                <div className="text-3xl sm:text-4xl font-extrabold leading-none">
                  {people}
                </div>
                <div className="mt-2 text-xs sm:text-sm text-white/70 font-medium">
                  people alongside you
                </div>
              </div>
              <div className="col-span-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-white p-3.5 sm:p-4 text-[#19352d]">
                <span className="text-xs sm:text-sm font-medium text-gray-700">
                  SkillCoaches can create groups.
                </span>
                <Link
                  to="/become-a-skillcoach"
                  className="inline-flex justify-center rounded-xl bg-[#d99b26] px-4 py-2 text-xs sm:text-sm font-bold text-[#19352d] transition-colors hover:bg-[#c9932f] hover:text-white"
                >
                  Become a SkillCoach
                </Link>
              </div>
            </div>
          </div>
        </section>
 <InvitesBanner
          onAccepted={(group) =>
            setGroups((prev) =>
              prev.some((x) => x.id === group.group_id) ? prev : [toCard({ ...group, is_member: true }, user?.user_id), ...prev]
            )
          }
        />
        {/* tabs + search */}
        <section className="mt-6 sm:mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div
            role="tablist"
            className="w-full max-w-full grid grid-cols-3 gap-1.5 p-1.5 bg-white border border-gray-200/80 rounded-2xl shadow-sm sm:w-auto sm:flex sm:items-center"
          >
            {TABS.map((t) => (
              <button
                key={t.key}
                role="tab"
                aria-selected={tab === t.key}
                onClick={() => selectTab(t)}
                className={`flex flex-col sm:flex-row items-center justify-center text-center p-2 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition ${
                  tab === t.key
                    ? "bg-[#19352d] text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <span>{t.label}</span>
                {t.key === "mine" && (
                  <span
                    className={`mt-1 sm:mt-0 sm:ml-2 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                      tab === t.key
                        ? "bg-[#d99b26] text-[#19352d]"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {mine.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          <label className="relative w-full sm:w-80 min-w-0 max-w-full">
            <svg
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search groups"
              className="w-full rounded-xl bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 outline-none border border-gray-200 placeholder:text-gray-400 transition focus:border-[#19352d] focus:ring-2 focus:ring-[#19352d]/15 shadow-2xs"
            />
          </label>
        </section>

        {error && (
          <p className="mt-6 w-full rounded-xl p-3 bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm font-medium text-center">
            {error}
          </p>
        )}

        {/* grid */}
        {!error && (
          <section className="mt-6 grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              <p className="text-sm text-gray-500">Loading groups…</p>
            ) : (
              visible.map((g) => (
                <GroupCard
                  key={g.id}
                  group={g}
                  onLeave={leaveGroup}
                  onOpen={(id) => navigate(`/projects/${id}`)}
                />
              ))
            )}

            <button
              onClick={() => navigate("/group/create")}
              className="group flex min-h-[260px] sm:min-h-[320px] flex-col items-center justify-center rounded-2xl sm:rounded-3xl border-2 border-dashed border-[#d99b26]/60 bg-amber-50/50 p-6 sm:p-8 text-center transition-colors hover:border-[#d99b26] hover:bg-amber-50"
            >
              <span className="grid h-12 w-12 sm:h-14 sm:w-14 place-items-center rounded-full bg-[#d99b26] text-2xl sm:text-3xl font-bold text-[#19352d] transition-transform group-hover:scale-110">
                +
              </span>
              <span className="mt-3 sm:mt-4 text-base sm:text-lg font-extrabold text-[#19352d]">
                Create a new group
              </span>
              <span className="mt-1 max-w-[26ch] text-xs sm:text-sm text-gray-600">
                Available to SkillCoaches. Invite members and start a project.
              </span>
            </button>
          </section>
        )}

        {!loading && !visible.length && q && (
          <p className="mt-6 text-center text-sm text-gray-500">
            No groups match "{q}".
          </p>
        )}
      </div>
    </div>
  );
}