import { useEffect, useState } from "react";
import { FiSearch, FiTrash2, FiPlus } from "react-icons/fi";
import {
  getAdminGroups,
  deleteAdminGroup,
  getAdminCategories,
  createAdminCategory,
  deleteAdminCategory,
} from "../../lib/api";

function CategoryManager() {
  const [categories, setCategories] = useState(null);
  const [newTitle, setNewTitle] = useState("");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = () => getAdminCategories().then(setCategories).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setBusyId("new");
    try {
      await createAdminCategory(newTitle.trim());
      setNewTitle("");
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (c) => {
    setBusyId(c.category_id);
    try {
      await deleteAdminCategory(c.category_id);
      await load();
    } catch (err) {
      alert(err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="rounded-2xl border border-line bg-white p-4 shadow-sm sm:p-5">
      <h3 className="text-[15px] font-bold text-ink">Categories</h3>
      {error && <p className="mt-1 text-[13px] font-medium text-crimson">{error}</p>}
      {!categories ? (
        <p className="mt-2 text-[14px] text-ink/60">Loading…</p>
      ) : (
        <div className="mt-2 flex flex-wrap gap-2">
          {categories.map((c) => (
            <span key={c.category_id} className="inline-flex items-center gap-1.5 rounded-full bg-forest-soft px-3 py-1.5 text-[13px] font-semibold text-forest">
              {c.title}
              <button
                onClick={() => handleDelete(c)}
                disabled={busyId === c.category_id}
                title="Delete category"
                className="text-forest/60 hover:text-crimson disabled:opacity-50"
              >
                <FiTrash2 size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
      <form onSubmit={handleAdd} className="mt-3 flex gap-2">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="New category name"
          className="w-full max-w-xs rounded-xl border border-line bg-mist/60 px-3.5 py-2 text-[14px] text-ink outline-none focus:border-forest focus:ring-2 focus:ring-forest/15"
        />
        <button type="submit" disabled={busyId === "new"} className="inline-flex items-center gap-1 rounded-xl bg-forest px-3.5 py-2 text-[13px] font-semibold text-white hover:bg-forest-deep disabled:opacity-60">
          <FiPlus /> Add
        </button>
      </form>
    </div>
  );
}

export default function AdminGroups() {
  const [groups, setGroups] = useState(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = (q = search) =>
    getAdminGroups(q).then(setGroups).catch((e) => setError(e.message));

  useEffect(() => { load(""); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const t = setTimeout(() => load(search), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleDelete = async (group) => {
    if (!confirm(`Delete "${group.title}"? This removes all its tasks, comments and timesheets too.`)) return;
    setBusyId(group.group_id);
    try {
      await deleteAdminGroup(group.group_id);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <CategoryManager />

      <div className="relative max-w-sm">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search group title"
          className="w-full rounded-xl border border-line bg-white py-2.5 pl-9 pr-3.5 text-[14px] text-ink outline-none focus:border-forest focus:ring-2 focus:ring-forest/15"
        />
        <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
      </div>

      {error && <p className="text-[14px] font-medium text-crimson">{error}</p>}

      {!groups ? (
        <p className="text-[14px] text-ink/60">Loading groups…</p>
      ) : groups.length === 0 ? (
        <div className="rounded-2xl border border-line bg-white p-8 text-center text-[14px] text-ink/60">
          No groups match that search.
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((g) => (
            <div key={g.group_id} className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="truncate text-[15px] font-bold text-ink">{g.title}</p>
                <p className="mt-0.5 text-[13px] text-ink/55">
                  {g.category_title || "Uncategorized"} · {g.member_count} member{g.member_count === 1 ? "" : "s"} · owner {g.owner_name || g.owner_email || "unknown"}
                </p>
              </div>
              <button
                onClick={() => handleDelete(g)}
                disabled={busyId === g.group_id}
                className="inline-flex shrink-0 items-center gap-1 self-start rounded-full border border-line px-3 py-1.5 text-[13px] font-semibold text-crimson hover:bg-crimson/5 disabled:opacity-50 sm:self-auto"
              >
                <FiTrash2 /> Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
