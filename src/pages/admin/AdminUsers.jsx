import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch, FiLogIn } from "react-icons/fi";
import { getAdminUsers, getAdminLevels, updateUserLevel, setUserStatus, impersonateUser } from "../../lib/api";
import { useAuth } from "../../lib/AuthContext";

export default function AdminUsers() {
  const { user: me, signIn, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState(null);
  const [levels, setLevels] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState(null);

  const load = (q = search) =>
    getAdminUsers(q).then(setUsers).catch((e) => setError(e.message));

  useEffect(() => {
    getAdminLevels().then(setLevels).catch(() => {});
    load("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => load(search), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleChangeLevel = async (userId, levelId) => {
    setSavingId(userId);
    setError("");
    try {
      await updateUserLevel(userId, Number(levelId));
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSavingId(null);
    }
  };

  const handleToggleStatus = async (u) => {
    setSavingId(u.user_id);
    setError("");
    try {
      await setUserStatus(u.user_id, !u.enabled);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSavingId(null);
    }
  };

  const handleImpersonate = async (u) => {
    if (!confirm(`Log in as ${u.displayname || u.username}? You can return to your admin account any time.`)) return;
    setSavingId(u.user_id);
    setError("");
    try {
      const { user } = await impersonateUser(u.user_id);
      signIn(user);
      await refreshUser();
      navigate("/home");
    } catch (e) {
      setError(e.message);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, username or email"
          className="w-full rounded-xl border border-line bg-white py-2.5 pl-9 pr-3.5 text-[14px] text-ink outline-none focus:border-forest focus:ring-2 focus:ring-forest/15"
        />
        <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
      </div>

      {error && <p className="text-[14px] font-medium text-crimson">{error}</p>}

      {!users ? (
        <p className="text-[14px] text-ink/60">Loading users…</p>
      ) : users.length === 0 ? (
        <div className="rounded-2xl border border-line bg-white p-8 text-center text-[14px] text-ink/60">
          No users match that search.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-white shadow-sm">
          <table className="w-full min-w-[700px] text-left text-[14px]">
            <thead>
              <tr className="border-b border-line text-xs font-bold uppercase tracking-wide text-ink/50">
                <th className="px-4 py-3">Member</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isSelf = u.user_id === me?.user_id;
                const busy = savingId === u.user_id;
                return (
                  <tr key={u.user_id} className="border-b border-line last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-bold text-ink">{u.displayname || u.username}</p>
                      <p className="text-[13px] text-ink/55">{u.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleStatus(u)}
                        disabled={busy || isSelf}
                        title={isSelf ? "You can't disable your own account" : "Toggle enabled/disabled"}
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold disabled:opacity-60 ${
                          u.enabled ? "bg-forest-soft text-forest" : "bg-crimson/10 text-crimson"
                        }`}
                      >
                        {u.enabled ? "Enabled" : "Disabled"}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={u.level_id || ""}
                        disabled={busy || isSelf}
                        onChange={(e) => handleChangeLevel(u.user_id, e.target.value)}
                        title={isSelf ? "You can't change your own role" : undefined}
                        className="rounded-xl border border-line bg-mist/60 px-3 py-2 text-[13px] font-semibold text-ink outline-none focus:border-forest disabled:opacity-60"
                      >
                        {levels.map((l) => (
                          <option key={l.level_id} value={l.level_id}>{l.title}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleImpersonate(u)}
                        disabled={busy || isSelf}
                        title={isSelf ? "You're already signed in as yourself" : "Log in as this user"}
                        className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1.5 text-[13px] font-semibold text-ink/70 hover:border-forest hover:text-forest disabled:opacity-50"
                      >
                        <FiLogIn /> Login as
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
