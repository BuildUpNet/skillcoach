import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { getMyInvites, getNotifications } from "../lib/api";

export default function NotificationBell() {
  const [count, setCount] = useState(0);
  const location = useLocation();

  useEffect(() => {
    let alive = true;
    const load = () =>
      Promise.all([getNotifications(1).catch(() => ({ unread: 0 })), getMyInvites().catch(() => [])])
        .then(([n, inv]) => alive && setCount((n.unread || 0) + inv.length));
    load();
    const t = setInterval(load, 60_000);
    return () => { alive = false; clearInterval(t); };
  }, [location.pathname]);

  return (
    <Link to="/notifications" aria-label="Notifications" className="relative grid h-11 w-11 place-items-center rounded-full text-ink/70 hover:bg-mist hover:text-forest">
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 8a6 6 0 0112 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.9 1.9 0 003.4 0" />
      </svg>
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-crimson px-1 text-[11px] font-bold text-white ring-2 ring-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}