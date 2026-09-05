import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Card, EmptyState } from "../../components/group/GroupUI";

const inputBase = "w-full rounded-xl border border-line bg-white px-4 py-3 text-[15px] text-ink outline-none transition-all placeholder:text-ink/40 hover:border-forest/40 focus:border-forest focus:ring-4 focus:ring-forest/10";

export default function GroupInvite() {
  const { workspace } = useOutletContext();
  const [pending, setPending] = useState(workspace.invitesPending);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setPending((p) => [{ id: Date.now(), email: email.trim(), sentDate: "Just now" }, ...p]);
    setEmail("");
    setSent(true);
    setTimeout(() => setSent(false), 2000);
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
          <button type="submit" className="w-full rounded-xl bg-forest px-4 py-3 text-[15px] font-bold text-white transition-colors hover:bg-forest-deep">
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
                <span className="text-[13px] italic text-ink/50">Sent {p.sentDate}</span>
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
