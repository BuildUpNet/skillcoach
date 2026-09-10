import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Card, Avatar, EmptyState } from "../../components/group/GroupUI";
import { promoteOfficer, demoteOfficer, setGroupPrivacy } from "../../lib/api";
import { useToast } from "../../components/Toast";

const PRIVACY_LABELS = {
  view: "Who can view this group",
  comment: "Who can comment",
  photo: "Who can add photos",
  event: "Who can create events",
  invite: "Who can invite new members",
};

const ROLE_OPTIONS = [
  { value: "officer", label: "Officers only" },
  { value: "member", label: "Members" },
  { value: "registered", label: "Any signed-in user" },
  { value: "everyone", label: "Everyone" },
];

export default function GroupManage() {
  const { workspace, setWorkspace } = useOutletContext();
  const { members, manage } = workspace;
  const toast = useToast();
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");

  const isOwner = manage?.yourRole === "owner";
  const promotable = members.filter((m) => m.role === "Member");

  const patchManage = (patch) =>
    setWorkspace((prev) => ({ ...prev, manage: { ...prev.manage, ...patch } }));

  const handlePromote = async (userId) => {
    setBusy(userId);
    setError("");
    try {
      await promoteOfficer(workspace.info.id, userId);
      const m = members.find((x) => x.id === userId);
      patchManage({ officers: [...(manage.officers || []), { user_id: userId, displayname: m?.name }] });
      setWorkspace((prev) => ({
        ...prev,
        members: prev.members.map((x) => (x.id === userId ? { ...x, role: "Officer" } : x)),
      }));
      toast(`${m?.name || "Member"} is now an officer`);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  };

  const handleDemote = async (userId) => {
    setBusy(userId);
    setError("");
    try {
      await demoteOfficer(workspace.info.id, userId);
      patchManage({ officers: (manage.officers || []).filter((o) => o.user_id !== userId) });
      setWorkspace((prev) => ({
        ...prev,
        members: prev.members.map((x) => (x.id === userId ? { ...x, role: "Member" } : x)),
      }));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  };

  const handlePrivacyChange = async (action, minRole) => {
    setBusy(action);
    setError("");
    try {
      await setGroupPrivacy(workspace.info.id, action, minRole);
      patchManage({ privacy: { ...manage.privacy, [action]: minRole } });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  };

  if (!manage) return null;

  return (
    <div className="space-y-6">
      {error && <p className="text-[14px] font-semibold text-crimson">{error}</p>}

      <Card title="Officers" action={!isOwner && <span className="text-[13px] font-medium text-ink/50">Owner only</span>}>
        <p className="mb-4 text-[14px] text-ink/60">
          Officers can remove members and cancel invites, same as the owner — a co-manager tier for bigger groups.
        </p>
        {manage.officers.length === 0 ? (
          <EmptyState>No officers yet.</EmptyState>
        ) : (
          <ul className="mb-4 grid gap-2.5 sm:grid-cols-2">
            {manage.officers.map((o) => (
              <li key={o.user_id} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-mist/50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <Avatar name={o.displayname || "?"} size={36} />
                  <span className="text-[14.5px] font-semibold text-ink">{o.displayname}</span>
                </div>
                {isOwner && (
                  <button
                    onClick={() => handleDemote(o.user_id)}
                    disabled={busy === o.user_id}
                    className="rounded-full border border-line px-3 py-1 text-[13px] font-semibold text-ink/60 hover:border-crimson hover:text-crimson disabled:opacity-50"
                  >
                    Remove
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        {isOwner && (
          promotable.length ? (
            <div className="flex flex-wrap gap-2 border-t border-line pt-4">
              {promotable.map((m) => (
                <button
                  key={m.id}
                  onClick={() => handlePromote(m.id)}
                  disabled={busy === m.id}
                  className="rounded-full bg-forest-soft px-3.5 py-1.5 text-[13px] font-semibold text-forest hover:bg-forest hover:text-white disabled:opacity-50"
                >
                  + Make {m.name} an officer
                </button>
              ))}
            </div>
          ) : null
        )}
      </Card>

      <Card title="Privacy" action={!isOwner && <span className="text-[13px] font-medium text-ink/50">Owner only</span>}>
        <div className="space-y-4">
          {Object.entries(PRIVACY_LABELS).map(([action, label]) => (
            <div key={action} className="flex flex-col gap-1.5 border-b border-line pb-4 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-[14.5px] font-semibold text-ink">{label}</span>
              <select
                value={manage.privacy[action]}
                disabled={!isOwner || busy === action}
                onChange={(e) => handlePrivacyChange(action, e.target.value)}
                className="w-full rounded-xl border border-line bg-mist/60 px-3.5 py-2 text-[14px] font-semibold text-ink outline-none focus:border-forest disabled:opacity-60 sm:w-56"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[13px] text-ink/50">
          "Who can add photos" and "Who can create events" are stored now for when those features ship — they don't restrict anything yet.
        </p>
      </Card>
    </div>
  );
}
