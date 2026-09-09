import { useEffect, useState } from "react";
import { acceptInvite, getMyInvites, rejectInvite } from "../lib/api";
import { useToast } from "./Toast";

export default function InvitesBanner({ onAccepted }) {
  const [invites, setInvites] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const toast = useToast();

  useEffect(() => {
    getMyInvites().then(setInvites).catch(() => {});
  }, []);

  if (!invites.length) return null;

  const act = async (inv, accept) => {
    setBusyId(inv.groupId);
    try {
      if (accept) {
        const group = await acceptInvite(inv.groupId);
        toast(`You joined ${inv.title}`);
        onAccepted?.(group);
      } else {
        await rejectInvite(inv.groupId);
        toast("Invitation declined");
      }
      setInvites((list) => list.filter((i) => i.groupId !== inv.groupId));
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setBusyId(null);
    }
  };
  return (
    <ul className="mt-6 space-y-2">
      {invites.map((inv) => (
        <li key={inv.groupId} className="flex flex-wrap items-center gap-3 rounded-2xl border border-gold/40 bg-gold-soft/60 px-4 py-3">
          <span className="grid h-9 w-9 flex-none place-items-center rounded-xl bg-gold text-[15px] font-extrabold text-ink">
            {inv.title.trim()[0]?.toUpperCase()}
          </span>
          <p className="min-w-0 flex-1 text-[14.5px] text-ink">
            <span className="font-semibold">{inv.ownerName}</span> invited you to join <span className="font-semibold">{inv.title}</span>
            <span className="text-ink/55"> · {inv.members} members</span>
          </p>
          <div className="flex gap-1.5">
            <button disabled={busyId === inv.groupId} onClick={() => act(inv, true)}
              className="rounded-lg bg-forest px-3.5 py-1.5 text-[13.5px] font-bold text-white hover:bg-forest-deep disabled:opacity-60">Accept</button>
            <button disabled={busyId === inv.groupId} onClick={() => act(inv, false)}
              className="rounded-lg px-3 py-1.5 text-[13.5px] font-semibold text-ink/60 hover:bg-white hover:text-crimson disabled:opacity-60">Decline</button>
          </div>
        </li>
      ))}
    </ul>
  );
}