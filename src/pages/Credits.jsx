import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

async function api(path, options = {}) {
  const res = await fetch(`${API}/api/credits${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
  return data;
}

const TABS = [
  { id: "home", label: "Home" },
  { id: "mine", label: "My Credits" },
  { id: "faq", label: "FAQ" },
];

const FAQ_ITEMS = [
  {
    q: "What are credits?",
    a: "Credits track how much you contribute to SkillCoach — logging in, inviting friends, and referring new members all earn you credits, which set your place on the leaderboard.",
  },
  {
    q: "How do I earn credits?",
    a: 'Every way to earn is listed under the "Home" tab, along with how many credits each action is worth and the daily limit for each.',
  },
  {
    q: "Can I send credits to someone?",
    a: 'Yes — head to "My Credits", type a friend\'s name, choose how many credits to send, and confirm with "Send Credit".',
  },
  {
    q: "Do credits expire?",
    a: "No. Credits stay on your account and simply add to your total earned and your current balance.",
  },
];

// Maps an action_type from the API onto an icon treatment.
const KIND_STYLE = {
  login: { tint: "bg-forest-soft text-forest", icon: "→" },
  friend: { tint: "bg-gold/15 text-gold-deep", icon: "+" },
  referral: { tint: "bg-gold/15 text-gold-deep", icon: "★" },
  invite: { tint: "bg-forest-soft text-forest", icon: "✉" },
  sent: { tint: "bg-gold/15 text-gold-deep", icon: "↑" },
  received: { tint: "bg-forest-soft text-forest", icon: "↓" },
};

function kindOf(actionType) {
  if (actionType === "user_login") return "login";
  if (actionType === "friend_make") return "friend";
  if (actionType === "refer") return "referral";
  if (actionType === "invite") return "invite";
  if (actionType?.startsWith("transfer_to")) return "sent";
  if (actionType?.startsWith("transfer_from")) return "received";
  return "login";
}

function relativeDate(value) {
  const then = new Date(value);
  const mins = Math.round((Date.now() - then.getTime()) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return then.toLocaleDateString(undefined, { weekday: "short" }) +
    " at " + then.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return then.toLocaleDateString(undefined, { month: "long", day: "numeric" });
}

const PAGE_SIZE = 6;

export default function Credits() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = TABS.some((t) => t.id === searchParams.get("tab"))
    ? searchParams.get("tab")
    : "home";
  const [tab, setTab] = useState(initialTab);

  const [balance, setBalance] = useState(null);
  const [recent, setRecent] = useState([]);
  const [rules, setRules] = useState([]);
  const [error, setError] = useState(null);

  const loadOverview = useCallback(async () => {
    try {
      const data = await api("/overview");
      setBalance(data.balance);
      setRecent(data.recent);
      setRules(data.rules);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => { loadOverview(); }, [loadOverview]);

  function goTo(id) {
    setTab(id);
    setSearchParams(id === "home" ? {} : { tab: id });
  }

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-ink">Credits</h1>
        <p className="mt-1 text-ink/60">Earn credits by contributing, spend them on what matters to you.</p>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-gold/40 bg-gold/10 px-5 py-4 text-sm text-ink">
          {error}
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3 rounded-2xl border border-line bg-white p-5 shadow-sm sm:grid-cols-4">
        <Stat value={balance ? `#${balance.rank}` : "—"} label="Your rank" />
        <Stat value={balance ? balance.current : "—"} label="Current balance" />
        <Stat value={balance ? balance.earned : "—"} label="Total earned" />
        <Stat value={balance ? balance.spent : "—"} label="Total spent" />
      </div>

      <div className="mb-6 inline-flex gap-1 rounded-full border border-line bg-white p-1 shadow-sm">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => goTo(t.id)}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
              tab === t.id
                ? "bg-forest text-white"
                : "text-ink/70 hover:bg-forest-soft hover:text-forest"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

     {tab === "home" && <HomePanel recent={recent} onSeeCredits={() => goTo("mine")} />}
{tab === "mine" && <MyCreditsPanel onBalanceChange={loadOverview} />}
{tab === "faq" && <FaqPanel rules={rules} />}
    </div>
  );
}

function Stat({ value, label }) {
  return (
    <div>
      <p className="text-2xl font-bold text-forest sm:text-3xl">{value}</p>
      <p className="text-sm text-ink/60">{label}</p>
    </div>
  );
}

function TxIcon({ kind }) {
  const style = KIND_STYLE[kind] ?? KIND_STYLE.login;
  return (
    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold ${style.tint}`}>
      {style.icon}
    </span>
  );
}

function TxRow({ tx }) {
  return (
    <>
      {tx.label}
      {tx.body ? <span className="font-semibold text-ink"> {tx.body}</span> : null}
    </>
  );
}

function Amount({ credit }) {
  const positive = credit >= 0;
  return (
    <span className={`text-sm font-bold ${positive ? "text-forest" : "text-gold-deep"}`}>
      {positive ? "+" : "−"}{Math.abs(credit)}
    </span>
  );
}

function HomePanel({ recent = [], onSeeCredits }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-bold text-ink">Recent activity</p>
          <p className="mt-0.5 text-sm text-ink/60">Your last few credit-earning actions.</p>
        </div>
        <button
          onClick={onSeeCredits}
          className="rounded-full bg-gold px-5 py-2 text-sm font-bold text-ink shadow-[0_8px_20px_-10px_rgba(217,164,65,.9)] transition-transform hover:-translate-y-px hover:bg-gold-deep hover:text-white"
        >
          See my credits
        </button>
      </div>
      <div className="mt-4 space-y-2">
        {recent.length === 0 && (
          <p className="rounded-xl border border-dashed border-line p-4 text-sm text-ink/50">
            Nothing yet — log in tomorrow to start earning.
          </p>
        )}
        {recent.slice(0, 3).map((tx) => (
          <div key={tx.id} className="flex items-center gap-3 rounded-xl border border-line p-3">
            <TxIcon kind={kindOf(tx.actionType)} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-ink"><TxRow tx={tx} /></p>
              <p className="text-xs text-ink/50">{relativeDate(tx.date)}</p>
            </div>
            <Amount credit={tx.credit} />
          </div>
        ))}
      </div>
    </div>
  );
}
function MyCreditsPanel({ onBalanceChange }) {
  const [page, setPage] = useState(1);
  const [history, setHistory] = useState({ items: [], pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  const loadHistory = useCallback(async (p) => {
    setLoading(true);
    try {
      setHistory(await api(`/history?page=${p}&limit=${PAGE_SIZE}`));
    } catch {
      setHistory({ items: [], pages: 1, total: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadHistory(page); }, [page, loadHistory]);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
        <p className="mb-4 font-bold text-ink">Transaction list</p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-wide text-ink/50">
                <th className="pb-2 pr-4 font-semibold">Action date</th>
                <th className="pb-2 pr-4 font-semibold">Action type</th>
                <th className="pb-2 text-right font-semibold">Credits</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={3} className="py-6 text-center text-ink/50">Loading…</td></tr>
              )}
              {!loading && history.items.length === 0 && (
                <tr><td colSpan={3} className="py-6 text-center text-ink/50">No transactions yet.</td></tr>
              )}
              {!loading && history.items.map((tx) => (
                <tr key={tx.id} className="border-b border-line/70 last:border-0 hover:bg-forest-soft/40">
                  <td className="py-3 pr-4 text-ink/60 whitespace-nowrap">{relativeDate(tx.date)}</td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <TxIcon kind={kindOf(tx.actionType)} />
                      <span className="text-ink"><TxRow tx={tx} /></span>
                    </div>
                  </td>
                  <td className="py-3 text-right"><Amount credit={tx.credit} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {history.pages > 1 && (
          <div className="mt-5 flex items-center justify-center gap-1">
            {Array.from({ length: history.pages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`h-8 w-8 rounded-full text-sm font-semibold transition-colors ${
                  page === p ? "bg-forest text-white" : "text-ink/60 hover:bg-forest-soft hover:text-forest"
                }`}
              >
                {p}
              </button>
            ))}
            {page < history.pages && (
              <button
                onClick={() => setPage((p) => Math.min(history.pages, p + 1))}
                className="ml-1 rounded-full px-3 py-1.5 text-sm font-semibold text-ink/60 hover:bg-forest-soft hover:text-forest"
              >
                Next »
              </button>
            )}
          </div>
        )}
      </div>

      <SendCredits
        onSent={() => {
          onBalanceChange();
          loadHistory(1);
          setPage(1);
        }}
      />
    </div>
  );
}

function SendCredits({ onSent }) {
  const [query, setQuery] = useState("");
  const [recipient, setRecipient] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const timer = useRef();

  useEffect(() => {
    if (!showSuggestions) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        setSuggestions(await api(`/recipients?q=${encodeURIComponent(query)}`));
      } catch {
        setSuggestions([]);
      }
    }, 200);
    return () => clearTimeout(timer.current);
  }, [query, showSuggestions]);

  async function send() {
    setBusy(true);
    setFeedback(null);
    try {
      const res = await api("/send", {
        method: "POST",
        body: JSON.stringify({ recipientId: recipient.id, credits: Number(amount) }),
      });
      setFeedback({ ok: true, message: res.message });
      setQuery("");
      setRecipient(null);
      setAmount("");
      onSent();
    } catch (err) {
      setFeedback({ ok: false, message: err.message });
    } finally {
      setBusy(false);
    }
  }

  const ready = recipient && Number(amount) > 0 && !busy;

  return (
    <div className="h-fit rounded-2xl border border-line bg-white p-5 shadow-sm">
      <p className="mb-4 font-bold text-ink">Send credits</p>

      <label className="mb-1 block text-xs font-semibold text-ink/60">Friend's name</label>
      <div className="relative mb-4">
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setRecipient(null); }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 120)}
          placeholder="Start typing..."
          className="w-full rounded-full border border-line px-4 py-2 text-sm text-ink placeholder:text-ink/40 focus:border-forest focus:outline-none"
        />
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-line bg-white shadow-md">
            {suggestions.map((person) => (
              <button
                key={person.id}
                onMouseDown={() => { setRecipient(person); setQuery(person.name); }}
                className="block w-full px-4 py-2 text-left text-sm text-ink hover:bg-forest-soft hover:text-forest"
              >
                {person.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <label className="mb-1 block text-xs font-semibold text-ink/60">Credits</label>
      <input
        value={amount}
        onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
        placeholder="0"
        inputMode="numeric"
        className="mb-4 w-full rounded-full border border-line px-4 py-2 text-sm text-ink placeholder:text-ink/40 focus:border-forest focus:outline-none"
      />

      <button
        onClick={send}
        disabled={!ready}
        className="w-full rounded-full bg-gold px-5 py-2.5 text-sm font-bold text-ink shadow-[0_8px_20px_-10px_rgba(217,164,65,.9)] transition-transform enabled:hover:-translate-y-px enabled:hover:bg-gold-deep enabled:hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? "Sending…" : "Send credit"}
      </button>

      {feedback && (
        <p className={`mt-3 text-sm ${feedback.ok ? "text-forest" : "text-gold-deep"}`}>
          {feedback.message}
        </p>
      )}
    </div>
  );
}

function FaqPanel({ rules = [] }) {
  const [open, setOpen] = useState(0);
  const ways = rules.flatMap((group) => group.actions);

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
        <p className="font-bold text-ink">Ways to earn credits</p>
        <p className="mt-1 text-sm text-ink/60">
          Credits set your place on the leaderboard. Below is every way to earn more of them.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {ways.length === 0 && <p className="text-sm text-ink/50">Loading…</p>}
          {ways.map((w) => (
            <div key={w.actionType} className="flex items-start justify-between gap-3 rounded-xl border border-line p-4">
              <div>
                <p className="font-semibold text-ink">{w.label}</p>
                {w.maxCredit > 0 && (
                  <p className="mt-0.5 text-sm text-ink/60">
                    Up to {w.maxCredit} credits
                    {w.rolloverDays === 1 ? " per day" : w.rolloverDays > 1 ? ` every ${w.rolloverDays} days` : ""}
                  </p>
                )}
              </div>
              <span className="rounded-full bg-forest-soft px-2.5 py-1 text-xs font-bold text-forest">
                +{w.credit}
              </span>
            </div>
          ))}
        </div>
      </div>

      {FAQ_ITEMS.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q} className="rounded-2xl border border-line bg-white shadow-sm">
            <button
              onClick={() => setOpen(isOpen ? -1 : i)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
            >
              <span className="font-semibold text-ink">{item.q}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                className={`h-4 w-4 shrink-0 text-forest transition-transform ${isOpen ? "rotate-180" : ""}`}>
                <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {isOpen && <p className="px-5 pb-4 text-sm text-ink/65">{item.a}</p>}
          </div>
        );
      })}
    </div>
  );
}