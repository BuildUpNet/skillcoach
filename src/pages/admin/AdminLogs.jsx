import { useEffect, useState } from "react";
import { FiTrash2 } from "react-icons/fi";
import { getLoginLogs, clearLoginLogs } from "../../lib/api";

const STATE_STYLE = {
  success: "bg-forest-soft text-forest",
  "bad-password": "bg-crimson/10 text-crimson",
  "no-member": "bg-crimson/10 text-crimson",
  disabled: "bg-gold-soft text-gold-deep",
};

export default function AdminLogs() {
  const [logs, setLogs] = useState(null);
  const [error, setError] = useState("");
  const [clearing, setClearing] = useState(false);

  const load = () => getLoginLogs(200).then(setLogs).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const handleClear = async () => {
    if (!confirm("Clear all login attempt logs? This can't be undone.")) return;
    setClearing(true);
    try {
      await clearLoginLogs();
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[14px] text-ink/60">Recent sign-in attempts, most recent first.</p>
        <button
          onClick={handleClear}
          disabled={clearing || !logs?.length}
          className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-[13px] font-semibold text-crimson hover:bg-crimson/5 disabled:opacity-50"
        >
          <FiTrash2 /> Clear all
        </button>
      </div>

      {error && <p className="text-[14px] font-medium text-crimson">{error}</p>}

      {!logs ? (
        <p className="text-[14px] text-ink/60">Loading…</p>
      ) : logs.length === 0 ? (
        <div className="rounded-2xl border border-line bg-white p-8 text-center text-[14px] text-ink/60">
          No login attempts logged yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-white shadow-sm">
          <table className="w-full min-w-[560px] text-left text-[14px]">
            <thead>
              <tr className="border-b border-line text-xs font-bold uppercase tracking-wide text-ink/50">
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Result</th>
                <th className="px-4 py-3">IP</th>
                <th className="px-4 py-3">When</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.login_id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 text-ink">{l.email || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${STATE_STYLE[l.state] || "bg-line/60 text-ink/60"}`}>
                      {l.state}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink/60">{l.ip}</td>
                  <td className="px-4 py-3 text-ink/60">{new Date(l.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
