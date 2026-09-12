import { useEffect, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { MemberAvatar } from "../components/GroupHoverCard";
import {
  getMembers, getFriendRequests, sendFriendRequest, cancelFriendRequest,
  acceptFriendRequest, declineFriendRequest, removeFriend,
} from "../lib/api";

const input = "w-full rounded-full border border-line bg-white px-4 py-2.5 text-[15px] text-ink placeholder:text-ink/40 focus:border-forest focus:outline-none focus:ring-4 focus:ring-forest/10";

function useDebounced(value, ms = 350) {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
}

/* One button (or pair) that reflects the friendship state and performs the action */
export function FriendButton({ member, onChange, size = "md" }) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const sz = size === "sm" ? "px-3.5 py-2 text-[14px]" : "py-2.5 text-[14.5px]";
  const run = async (fn, next) => {
    setBusy(true); setErr("");
    try {
      const r = await fn(member.id);
      onChange?.(r.relation ?? next);
    } catch (e) {
      setErr(e.message || "Something went wrong");
    } finally { setBusy(false); }
  };

  const goMessage = () => {
    navigate(`/messages?tab=compose&to=${member.id}&name=${encodeURIComponent(member.name)}`);
  };

  if (member.relation === "self") {
    return <span className={`flex w-full items-center justify-center rounded-full border border-line ${sz} font-semibold text-ink/40`}>That's you</span>;
  }

  if (member.relation === "friends") {
    return (
      <div className="flex w-full gap-2">
        <button
          onClick={goMessage}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-full border border-line bg-white ${sz} font-semibold text-ink/70 transition-colors hover:border-forest hover:text-forest`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
            <path d="M4 5h16v10H8l-4 4V5z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Message
        </button>
        <button
          disabled={busy}
          onClick={() => { if (confirm(`Remove ${member.name} from your friends?`)) run(removeFriend, "none"); }}
          className={`group flex-1 flex items-center justify-center gap-2 rounded-full bg-forest-soft ${sz} font-semibold text-forest transition-colors hover:bg-crimson/10 hover:text-crimson disabled:opacity-60`}
        >
          <span className="group-hover:hidden">✓ Friends</span><span className="hidden group-hover:inline">Remove</span>
        </button>
      </div>
    );
  }

  if (member.relation === "requested") {
    return (
      <button disabled={busy} onClick={() => run(cancelFriendRequest, "none")}
        className={`flex w-full items-center justify-center rounded-full border border-line bg-white ${sz} font-semibold text-ink/70 transition-colors hover:border-crimson/40 hover:text-crimson disabled:opacity-60`}>
        {busy ? "Cancelling…" : "Cancel request"}
      </button>
    );
  }

  if (member.relation === "incoming") {
    return (
      <div className="flex w-full gap-2">
        <button disabled={busy} onClick={() => run(acceptFriendRequest, "friends")}
          className={`flex-1 rounded-full bg-forest ${sz} font-semibold text-white hover:bg-forest-deep disabled:opacity-60`}>Accept</button>
        <button disabled={busy} onClick={() => run(declineFriendRequest, "none")}
          className={`flex-1 rounded-full border border-line bg-white ${sz} font-semibold text-ink/70 hover:border-crimson/40 hover:text-crimson disabled:opacity-60`}>Decline</button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <button disabled={busy} onClick={() => run(sendFriendRequest, "requested")}
        className={`flex w-full items-center justify-center gap-2 rounded-full bg-forest ${sz} font-semibold text-white transition-colors hover:bg-forest-deep disabled:opacity-60`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
          <circle cx="9" cy="8" r="3" /><path d="M3.5 19c.6-3 2.8-4.6 5.5-4.6s4.9 1.6 5.5 4.6" strokeLinecap="round" /><path d="M18 8v5M15.5 10.5h5" strokeLinecap="round" />
        </svg>
        {busy ? "Sending…" : "Add friend"}
      </button>
      {err && <p className="mt-1.5 text-center text-[12.5px] text-red-600">{err}</p>}
    </div>
  );
}

function MemberCard({ member, onRelation }) {
  const to = `/profile/${member.username}`;
  return (
    <div className="rounded-2xl border border-line bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center gap-4">
        <Link to={to} className="flex-none"><MemberAvatar member={member} size="h-16 w-16 text-[22px]" className="rounded-2xl" /></Link>
        <div className="min-w-0">
          <Link to={to} className="block truncate text-[16px] font-bold text-ink hover:text-forest">{member.name}</Link>
          <p className="text-[14px] text-ink/55">{member.type}</p>
          <p className="text-[13px] text-ink/45">{member.friends} friend{member.friends === 1 ? "" : "s"}</p>
        </div>
      </div>
      <div className="mt-4">
        <FriendButton member={member} onChange={(rel) => onRelation(member.id, rel)} />
      </div>
    </div>
  );
}

export default function Members() {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get("q") || "");
  const [type, setType] = useState(params.get("type") || "");
  const [photo, setPhoto] = useState(params.get("photo") === "1");
  const [page, setPage] = useState(Number(params.get("page")) || 1);
  const tab = params.get("tab") === "requests" ? "requests" : "all";

  const dq = useDebounced(q);
  const [data, setData] = useState(null);
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => { setPage(1); }, [dq, type, photo]);

  useEffect(() => {
    setError("");
    getMembers({ q: dq, type, photo, page })
      .then(setData)
      .catch((e) => setError(e.message || "Couldn't load members."));
  }, [dq, type, photo, page]);

  useEffect(() => { getFriendRequests().then(setRequests).catch(() => setRequests([])); }, []);

  const setTab = (t) => { const p = new URLSearchParams(params); t === "requests" ? p.set("tab", "requests") : p.delete("tab"); setParams(p); };

  const onRelation = (id, rel) => {
    setData((d) => d && ({ ...d, members: d.members.map((m) => (m.id === id ? { ...m, relation: rel } : m)) }));
    if (rel !== "incoming") setRequests((r) => r.filter((x) => x.id !== id));
  };

  const filtersActive = q || type || photo;
  const clear = () => { setQ(""); setType(""); setPhoto(false); };

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8">
      <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-forest to-forest-deep px-8 py-9 sm:px-10">
        <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: "radial-gradient(rgba(244,246,245,0.14) 1px, transparent 1px)", backgroundSize: "22px 22px" }} />
        <div className="pointer-events-none absolute -top-28 -left-20 h-80 w-80 rounded-full bg-gold/30 blur-[90px]" />
        <div className="relative z-10">
          <p className="mb-2 text-sm font-semibold text-gold">Community</p>
          <h1 className="text-3xl font-extrabold text-white sm:text-4xl">
            {data ? `${data.total.toLocaleString()} members strong.` : "Members"}
          </h1>
          <p className="mt-2 max-w-lg text-[15px] leading-relaxed text-white/70">
            Find people to learn alongside, add a friend, and see what they're working on.
          </p>
        </div>
      </div>

      <div className="mb-5 flex gap-1.5 rounded-2xl bg-white p-1.5 ring-1 ring-line sm:w-fit">
        {[["all", "All members"], ["requests", `Friend requests${requests.length ? ` (${requests.length})` : ""}`]].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`rounded-xl px-4 py-2.5 text-[15px] font-semibold transition-colors ${tab === k ? "bg-forest text-white" : "text-ink/60 hover:text-ink"}`}>
            {l}
          </button>
        ))}
      </div>

      {tab === "requests" ? (
        requests.length ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {requests.map((r) => (
              <div key={r.id} className="rounded-2xl border border-line bg-white p-5 shadow-sm">
                <div className="flex items-center gap-4">
                  <Link to={`/profile/${r.username}`}><MemberAvatar member={r} size="h-14 w-14 text-[20px]" className="rounded-2xl" /></Link>
                  <div className="min-w-0">
                    <Link to={`/profile/${r.username}`} className="block truncate text-[16px] font-bold text-ink hover:text-forest">{r.name}</Link>
                    <p className="text-[14px] text-ink/55">wants to be your friend</p>
                  </div>
                </div>
                <div className="mt-4">
                  <FriendButton member={{ ...r, relation: "incoming" }} onChange={(rel) => onRelation(r.id, rel)} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-line bg-white p-10 text-center text-ink/60 shadow-sm">No pending friend requests.</div>
        )
      ) : (
        <>
          <div className="mb-6 rounded-2xl border border-line bg-white p-5 shadow-sm">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="mb-1 block text-[13px] font-semibold text-ink/60">Name</label>
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or username" className={input} />
              </div>
              <div>
                <label className="mb-1 block text-[13px] font-semibold text-ink/60">Member type</label>
                <select value={type} onChange={(e) => setType(e.target.value)} className={input}>
                  <option value="">All</option>
                  {(data?.levels || []).map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-2.5 self-end pb-2.5 text-[15px] text-ink/75">
                <input type="checkbox" checked={photo} onChange={(e) => setPhoto(e.target.checked)} className="h-4 w-4 accent-forest" />
                Only members with photos
              </label>
            </div>
            {filtersActive && (
              <div className="mt-4 border-t border-line pt-3">
                <button onClick={clear} className="text-[14.5px] font-semibold text-forest hover:text-gold-deep">Clear filters</button>
              </div>
            )}
          </div>

          {error && <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-[14.5px] text-red-700 ring-1 ring-red-100">{error}</p>}

          {!data ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-40 animate-pulse rounded-2xl bg-white ring-1 ring-line" />)}
            </div>
          ) : data.members.length === 0 ? (
            <div className="rounded-2xl border border-line bg-white p-10 text-center text-ink/60 shadow-sm">No members match your filters.</div>
          ) : (
            <>
              <p className="mb-4 text-[14px] text-ink/50">
                Showing {(data.page - 1) * data.pageSize + 1}–{Math.min(data.page * data.pageSize, data.total)} of {data.total.toLocaleString()}
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {data.members.map((m) => <MemberCard key={m.id} member={m} onRelation={onRelation} />)}
              </div>
            </>
          )}

          {data && data.pages > 1 && (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-1">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-full px-3 py-1.5 text-[14.5px] font-semibold text-ink/60 hover:bg-forest-soft hover:text-forest disabled:opacity-40">« Prev</button>
              {Array.from({ length: data.pages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === data.pages || Math.abs(p - page) <= 2)
                .map((p, i, arr) => (
                  <span key={p} className="flex items-center">
                    {i > 0 && arr[i - 1] !== p - 1 && <span className="px-1 text-ink/40">…</span>}
                    <button onClick={() => setPage(p)}
                      className={`h-9 w-9 rounded-full text-[14.5px] font-semibold transition-colors ${page === p ? "bg-forest text-white" : "text-ink/60 hover:bg-forest-soft hover:text-forest"}`}>
                      {p}
                    </button>
                  </span>
                ))}
              <button disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)} className="rounded-full px-3 py-1.5 text-[14.5px] font-semibold text-ink/60 hover:bg-forest-soft hover:text-forest disabled:opacity-40">Next »</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}