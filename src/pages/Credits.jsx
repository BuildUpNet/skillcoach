import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

const TABS = [
  { id: "home", label: "Home" },
  { id: "mine", label: "My Credits" },
  { id: "faq", label: "FAQ" },
];

const SUMMARY = {
  rank: 659,
  balance: 47,
  earned: 47,
  spent: 0,
};

// TODO: replace with real data once credits are wired up to your API
const TRANSACTIONS = [
  { id: "t1", date: "4 hours ago", kind: "login", label: "Log in", credits: 1 },
  { id: "t2", date: "4 hours ago", kind: "login", label: "Log in", credits: 1 },
  { id: "t3", date: "10 hours ago", kind: "login", label: "Log in", credits: 1 },
  { id: "t4", date: "11 hours ago", kind: "login", label: "Log in", credits: 1 },
  { id: "t5", date: "Fri at 4:09 PM", kind: "login", label: "Log in", credits: 1 },
  { id: "t6", date: "August 26", kind: "login", label: "Log in", credits: 1 },
  { id: "t7", date: "August 26", kind: "friend", label: "Adding a new friend", who: "Damini", credits: 5 },
  { id: "t8", date: "August 26", kind: "referral", label: "Referring", who: "Damini", suffix: "to join Site", credits: 5 },
  { id: "t9", date: "August 26", kind: "login", label: "Log in", credits: 1 },
  { id: "t10", date: "August 26", kind: "invite", label: "Inviting", who: "daminimona1@gmail.com", suffix: "to join Site", credits: 1 },
];

const FRIENDS = ["Damini", "Thomas Kee", "Priya Nair", "Marcus Webb", "Dana Kimura"];

const FAQ_ITEMS = [
  {
    q: "What are credits?",
    a: "Credits track how much you contribute to SkillCoach — logging in, inviting friends, and referring new members all earn you credits, which set your place on the leaderboard.",
  },
  {
    q: "How do I earn credits?",
    a: "You earn 1 credit for logging in each day, 5 credits for adding a friend, and 5 credits for a referral that joins the site. Inviting someone by email earns 1 credit.",
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

const KIND_STYLE = {
  login: { tint: "bg-forest-soft text-forest", icon: "→" },
  friend: { tint: "bg-gold/15 text-gold-deep", icon: "+" },
  referral: { tint: "bg-gold/15 text-gold-deep", icon: "★" },
  invite: { tint: "bg-forest-soft text-forest", icon: "✉" },
};

const PAGE_SIZE = 6;

export default function Credits() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = TABS.some((t) => t.id === searchParams.get("tab"))
    ? searchParams.get("tab")
    : "home";
  const [tab, setTab] = useState(initialTab);

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

      <div className="mb-6 grid grid-cols-2 gap-3 rounded-2xl border border-line bg-white p-5 shadow-sm sm:grid-cols-4">
        <Stat value={`#${SUMMARY.rank}`} label="Your rank" />
        <Stat value={SUMMARY.balance} label="Current balance" />
        <Stat value={SUMMARY.earned} label="Total earned" />
        <Stat value={SUMMARY.spent} label="Total spent" />
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

      {tab === "home" && <HomePanel onSeeCredits={() => goTo("mine")} />}
      {tab === "mine" && <MyCreditsPanel />}
      {tab === "faq" && <FaqPanel />}
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

function txText(tx) {
  if (tx.who) {
    return (
      <>
        {tx.label} <span className="font-semibold text-ink">{tx.who}</span>
        {tx.suffix ? ` ${tx.suffix}` : ""}
      </>
    );
  }
  return tx.label;
}

function HomePanel({ onSeeCredits }) {
  const ways = [
    { title: "Log in", body: "Earn 1 credit every day you log in.", credits: "+1" },
    { title: "Add a friend", body: "Connect with another member you know.", credits: "+5" },
    { title: "Refer a member", body: "Invite someone who goes on to join the site.", credits: "+5" },
    { title: "Send an invite", body: "Invite a friend by email to join SkillCoach.", credits: "+1" },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
        <p className="font-bold text-ink">Ways to earn credits</p>
        <p className="mt-1 text-sm text-ink/60">
          Credits set your place on the leaderboard. Below is every way to earn more of them.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {ways.map((w) => (
            <div key={w.title} className="flex items-start justify-between gap-3 rounded-xl border border-line p-4">
              <div>
                <p className="font-semibold text-ink">{w.title}</p>
                <p className="mt-0.5 text-sm text-ink/60">{w.body}</p>
              </div>
              <span className="rounded-full bg-forest-soft px-2.5 py-1 text-xs font-bold text-forest">
                {w.credits}
              </span>
            </div>
          ))}
        </div>
      </div>

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
          {TRANSACTIONS.slice(0, 3).map((tx) => (
            <div key={tx.id} className="flex items-center gap-3 rounded-xl border border-line p-3">
              <TxIcon kind={tx.kind} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-ink">{txText(tx)}</p>
                <p className="text-xs text-ink/50">{tx.date}</p>
              </div>
              <span className="text-sm font-bold text-forest">+{tx.credits}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MyCreditsPanel() {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(TRANSACTIONS.length / PAGE_SIZE));
  const pageItems = TRANSACTIONS.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const [friend, setFriend] = useState("");
  const [amount, setAmount] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestions = useMemo(
    () =>
      friend
        ? FRIENDS.filter((f) => f.toLowerCase().includes(friend.toLowerCase()))
        : FRIENDS,
    [friend]
  );

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
              {pageItems.map((tx) => (
                <tr key={tx.id} className="border-b border-line/70 last:border-0 hover:bg-forest-soft/40">
                  <td className="py-3 pr-4 text-ink/60 whitespace-nowrap">{tx.date}</td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <TxIcon kind={tx.kind} />
                      <span className="text-ink">{txText(tx)}</span>
                    </div>
                  </td>
                  <td className="py-3 text-right font-bold text-forest">+{tx.credits}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-5 flex items-center justify-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
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
          {page < totalPages && (
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="ml-1 rounded-full px-3 py-1.5 text-sm font-semibold text-ink/60 hover:bg-forest-soft hover:text-forest"
            >
              Next »
            </button>
          )}
        </div>
      </div>

      <div className="h-fit rounded-2xl border border-line bg-white p-5 shadow-sm">
        <p className="mb-4 font-bold text-ink">Send credits</p>

        <label className="mb-1 block text-xs font-semibold text-ink/60">Friend's name</label>
        <div className="relative mb-4">
          <input
            value={friend}
            onChange={(e) => setFriend(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 100)}
            placeholder="Start typing..."
            className="w-full rounded-full border border-line px-4 py-2 text-sm text-ink placeholder:text-ink/40 focus:border-forest focus:outline-none"
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-line bg-white shadow-md">
              {suggestions.map((name) => (
                <button
                  key={name}
                  onMouseDown={() => setFriend(name)}
                  className="block w-full px-4 py-2 text-left text-sm text-ink hover:bg-forest-soft hover:text-forest"
                >
                  {name}
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
          disabled={!friend || !amount}
          className="w-full rounded-full bg-gold px-5 py-2.5 text-sm font-bold text-ink shadow-[0_8px_20px_-10px_rgba(217,164,65,.9)] transition-transform enabled:hover:-translate-y-px enabled:hover:bg-gold-deep enabled:hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          Send credit
        </button>
      </div>
    </div>
  );
}

function FaqPanel() {
  const [open, setOpen] = useState(0);

  return (
    <div className="space-y-3">
      {FAQ_ITEMS.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q} className="rounded-2xl border border-line bg-white shadow-sm">
            <button
              onClick={() => setOpen(isOpen ? -1 : i)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
            >
              <span className="font-semibold text-ink">{item.q}</span>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={`h-4 w-4 shrink-0 text-forest transition-transform ${isOpen ? "rotate-180" : ""}`}
              >
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