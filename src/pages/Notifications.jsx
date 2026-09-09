import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getNotifications, markAllNotificationsRead, markNotificationRead } from "../lib/api";
import InvitesBanner from "../components/InvitesBanner";

// icon + accent per notification type
const KIND = {
  task_created:       { label: "Task",       tone: "bg-forest-soft text-forest",     path: "M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" },
  assignment_created: { label: "Assignment", tone: "bg-gold-soft text-gold-deep",    path: "M9 4.5h6a1 1 0 011 1V6h1.5A1.5 1.5 0 0119 7.5v12A1.5 1.5 0 0117.5 21h-11A1.5 1.5 0 015 19.5v-12A1.5 1.5 0 016.5 6H8v-.5a1 1 0 011-1zM9 12h6M9 16h4" },
  task_comment:       { label: "Comment",    tone: "bg-mist text-ink/70",            path: "M21 12a8 8 0 01-8 8H8l-5 3 1.5-4.5A8 8 0 1121 12z" },
  group_invite:       { label: "Invite",     tone: "bg-gold-soft text-gold-deep",    path: "M3 6.5h18v11H3v-11zm0 0l9 7 9-7" },
  invite_accepted:    { label: "Joined",     tone: "bg-forest-soft text-forest",     path: "M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM17 11l2 2 4-4" },
  invite_declined:    { label: "Declined",   tone: "bg-crimson/10 text-crimson",     path: "M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM17 8l5 5m0-5l-5 5" },
};
const FALLBACK = { label: "Update", tone: "bg-mist text-ink/70", path: "M6 8a6 6 0 0112 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.9 1.9 0 003.4 0" };

function timeAgo(d) {
  const diff = (Date.now() - new Date(d).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  return new Date(d).toLocaleString(undefined, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

function dayBucket(d) {
  const date = new Date(d), now = new Date();
  const startOf = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((startOf(now) - startOf(date)) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return "This week";
  return "Earlier";
}

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    getNotifications(100)
      .then((r) => setItems(r.items))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const open = async (n) => {
    if (!n.read) {
      markNotificationRead(n.id).catch(() => {});
      setItems((l) => l.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    }
    if (n.link) navigate(n.link);
  };

  const readAll = async () => {
    await markAllNotificationsRead().catch(() => {});
    setItems((l) => l.map((x) => ({ ...x, read: true })));
  };

  const unread = items.filter((n) => !n.read).length;
  const visible = filter === "unread" ? items.filter((n) => !n.read) : items;

  const groups = useMemo(() => {
    const order = ["Today", "Yesterday", "This week", "Earlier"];
    const map = new Map(order.map((k) => [k, []]));
    visible.forEach((n) => map.get(dayBucket(n.date)).push(n));
    return order.filter((k) => map.get(k).length).map((k) => [k, map.get(k)]);
  }, [visible]);

  return (
    <div className="mx-auto max-w-[760px] px-4 pt-6 pb-16">
      <nav className="flex items-center gap-2 text-[14.5px] text-ink/55">
        <Link to="/projects" className="hover:text-forest">Projects</Link>
        <span>/</span>
        <span className="font-semibold text-ink">Notifications</span>
      </nav>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-[32px] font-extrabold tracking-tight text-ink lg:text-[38px]">Notifications</h1>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl bg-white p-1 ring-1 ring-line">
            {[["all", "All"], ["unread", `Unread${unread ? ` (${unread})` : ""}`]].map(([k, l]) => (
              <button key={k} onClick={() => setFilter(k)}
                className={`rounded-lg px-3.5 py-1.5 text-[14px] font-semibold transition-colors ${filter === k ? "bg-forest text-white" : "text-ink/60 hover:text-ink"}`}>
                {l}
              </button>
            ))}
          </div>
          {unread > 0 && (
            <button onClick={readAll} className="rounded-xl px-3.5 py-2 text-[14px] font-semibold text-forest hover:bg-forest-soft">
              Mark all read
            </button>
          )}
        </div>
      </div>

      <InvitesBanner onAccepted={() => {}} />

      <div className="mt-6 space-y-8">
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => <div key={i} className="h-[72px] animate-pulse rounded-2xl bg-white ring-1 ring-line" />)}
          </div>
        ) : !visible.length ? (
          <div className="rounded-3xl bg-white px-6 py-16 text-center ring-1 ring-line">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-mist text-ink/40">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d={FALLBACK.path} /></svg>
            </div>
            <p className="mt-4 text-[17px] font-bold text-ink">{filter === "unread" ? "Nothing unread" : "No notifications yet"}</p>
            <p className="mt-1 text-[14.5px] text-ink/55">Task, assignment, comment and invite activity from your groups shows up here.</p>
          </div>
        ) : (
          groups.map(([label, list]) => (
            <section key={label}>
              <h2 className="mb-2 px-1 text-[13px] font-bold uppercase tracking-wider text-ink/45">{label}</h2>
              <ul className="overflow-hidden rounded-2xl bg-white ring-1 ring-line divide-y divide-line">
                {list.map((n) => {
                  const k = KIND[n.type] || FALLBACK;
                  return (
                    <li key={n.id}>
                      <button onClick={() => open(n)}
                        className={`group flex w-full items-center gap-4 px-4 py-3.5 text-left transition-colors hover:bg-mist/50 ${n.read ? "" : "bg-forest-soft/30"}`}>
                        <span className={`grid h-10 w-10 flex-none place-items-center rounded-xl ${k.tone}`}>
                          <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round"><path d={k.path} /></svg>
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className={`block truncate text-[15px] leading-6 ${n.read ? "text-ink/75" : "font-semibold text-ink"}`}>{n.text}</span>
                          <span className="block text-[13px] text-ink/50">
                            {k.label} · {timeAgo(n.date)}
                          </span>
                        </span>
                        {!n.read
                          ? <span className="h-2 w-2 flex-none rounded-full bg-gold" />
                          : <svg className="h-4 w-4 flex-none text-ink/30 opacity-0 transition-opacity group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 6l6 6-6 6" /></svg>}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))
        )}
      </div>
    </div>
  );
}