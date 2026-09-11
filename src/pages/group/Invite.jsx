import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Card, EmptyState } from "../../components/group/GroupUI";
import { inviteMember, cancelInvite } from "../../lib/api";
import { useToast } from "../../components/Toast";
const inputBase = "w-full rounded-xl border border-line bg-white px-4 py-3 text-[15px] text-ink outline-none transition-all placeholder:text-ink/40 hover:border-forest/40 focus:border-forest focus:ring-4 focus:ring-forest/10";

export default function GroupInvite() {
  const { workspace, setWorkspace } = useOutletContext();
  const { invitesPending: pending, manage } = workspace;
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [cancelingId, setCancelingId] = useState(null);
  const canManage = manage?.yourRole === "owner" || manage?.yourRole === "officer";
const toast = useToast();

  const handleCancel = async (invite) => {
    setCancelingId(invite.id);
    try {
      await cancelInvite(workspace.info.id, invite.id);
      setWorkspace((prev) => ({ ...prev, invitesPending: prev.invitesPending.filter((p) => p.id !== invite.id) }));
    } catch (e) {
      setError(e.message);
    } finally {
      setCancelingId(null);
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    setError("");
    try {
      const invite = await inviteMember(workspace.info.id, email.trim());
      setWorkspace((prev) => ({ ...prev, invitesPending: [invite, ...prev.invitesPending] }));
      setEmail("");
      setSent(true);
      toast(`Invite sent to ${invite.email}`);
      setTimeout(() => setSent(false), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
      <Card title="Invite members">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="invite-email" className="mb-2 block text-[15px] font-semibold text-ink">Email address</label>
            <input
              id="invite-email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputBase}
            />
          </div>
          {error && <p className="text-center text-[13.5px] font-semibold text-crimson">{error}</p>}
          <button type="submit" disabled={busy} className="w-full rounded-xl bg-forest px-4 py-3 text-[15px] font-bold text-white transition-colors hover:bg-forest-deep disabled:opacity-60">
            Send invite
          </button>
          {sent && <p className="text-center text-[13.5px] font-semibold text-forest">Invite sent.</p>}
        </form>
      </Card>

      <Card title={`Pending invites (${pending.length})`}>
        {pending.length ? (
          <ul className="space-y-2.5">
            {pending.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-mist/50 px-4 py-3.5">
                <span className="text-[15px] font-medium text-ink">{p.email}</span>
                <div className="flex items-center gap-2.5">
                  <span className="text-[13px] italic text-ink/50">Sent {p.sentDate}</span>
                  {canManage && (
                    <button
                      onClick={() => handleCancel(p)}
                      disabled={cancelingId === p.id}
                      className="rounded-full border border-line px-2.5 py-1 text-[12px] font-semibold text-ink/50 hover:border-crimson hover:text-crimson disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState>No pending invites.</EmptyState>
        )}
      </Card>
    </div>
  );
}
