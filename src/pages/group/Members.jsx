import { Link, useOutletContext } from "react-router-dom";
import { useState } from "react";
import { Avatar, Card, RoleBadge } from "../../components/group/GroupUI";
import { removeMember } from "../../lib/api";

export default function GroupMembers() {
  const { workspace, setWorkspace } = useOutletContext();
  const { members, manage } = workspace;
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const canManage = manage?.yourRole === "owner" || manage?.yourRole === "officer";

  const handleRemove = async (member) => {
    if (!confirm(`Remove ${member.name} from this group?`)) return;
    setBusyId(member.id);
    setError("");
    try {
      await removeMember(workspace.info.id, member.id);
      setWorkspace((prev) => ({ ...prev, members: prev.members.filter((m) => m.id !== member.id) }));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Card
      title={`Members (${members.length})`}
      action={<Link to="../invite" relative="path" className="rounded-xl bg-forest px-4 py-2 text-[14px] font-bold text-white hover:bg-forest-deep">Invite members</Link>}
    >
      {error && <p className="mb-3 text-[13.5px] font-semibold text-crimson">{error}</p>}
      <ul className="grid gap-3 sm:grid-cols-2">
        {members.map((m) => (
          <li key={m.id} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-mist/50 px-4 py-3.5">
            <div className="flex items-center gap-3">
              <Avatar name={m.name} />
              <div>
                <p className="text-[15px] font-semibold text-ink">{m.name}</p>
                <p className="text-[13px] text-ink/50">Joined {m.joined}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <RoleBadge role={m.role} />
              {canManage && m.role !== "Owner" && (
                <button
                  onClick={() => handleRemove(m)}
                  disabled={busyId === m.id}
                  className="rounded-full border border-line px-2.5 py-1 text-[12px] font-semibold text-ink/50 hover:border-crimson hover:text-crimson disabled:opacity-50"
                >
                  Remove
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
