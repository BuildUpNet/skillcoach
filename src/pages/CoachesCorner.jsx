import { useState } from "react";
import { Link } from "react-router-dom";

const PANEL_COPY = {
  mine: {
    label: "My SkillCoach",
    sections: [
      {
        heading: "Become a SkillCoach",
        body: "We want you to become a SkillCoach, and to do that you need to request a free upgrade. Use the upgrade link at the very top of this page to upgrade and become a Coach. After you are approved (it happens fast) you will be able to use our free software and create lessons.",
      },
      {
        heading: "Welcome",
        body: "We want to make the world a better place, and we know we can help do that by improving the level of education throughout the world. We are excited that you have chosen to be part of our team.",
      },
      {
        body: "Get started by reviewing some of the existing material, but realize that we are looking for content — we want people to help us teach quality lessons on any subject or do-it-yourself topic, so if you have something to share we want you to share it.",
      },
    ],
  },
  corner: {
    label: "Coaches Corner",
    sections: [
      {
        body: "Oops. Our records show that you are not yet a SkillCoach, but we can change that right now. You can upgrade your account for free to become a SkillCoach by using this upgrade link. Our SkillCoaches can use all of our free software, they can create lessons, and many of them start small businesses simply by sharing what they already know. If you want to earn money you can, you don't have to, but after you upgrade we will show you how.",
      },
      {
        body: "upgrade-cta",
      },
    ],
  },
};

const TILES = [
  // "Take a lesson" (/instruction) — not in use yet, re-enable once the Lessons module is built.
  {
    title: "My friends",
    body: "See what lessons your friends are taking, and keep in touch.",
    to: "/members",
    tone: "bg-gradient-to-br from-gold to-gold-deep text-ink",
    iconTone: "bg-ink/10 text-ink",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <circle cx="9" cy="8" r="3.2" />
        <path d="M3.5 20c.7-3.4 3-5.2 5.5-5.2s4.8 1.8 5.5 5.2" strokeLinecap="round" />
        <circle cx="17" cy="8.5" r="2.4" />
        <path d="M15.2 14.4c1.7.2 3.2 1.6 3.8 4.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "My badges",
    body: "Review your badges, and see how you compare with others in your category.",
    to: "/badges",
    tone: "bg-gradient-to-br from-crimson to-[#7a1f2b] text-white",
    iconTone: "bg-white/15 text-white",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <circle cx="12" cy="14" r="6" />
        <path d="M9.5 8.5L7 3M14.5 8.5L17 3" strokeLinecap="round" />
        <path d="M10 14l1.5 1.5L15 12" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  // "My notes" (/notes) — not in use yet, re-enable once the Notes module is built.
];

export default function CoachesCorner() {
  const [tab, setTab] = useState("mine");
  const [open, setOpen] = useState(true);
  const copy = PANEL_COPY[tab];

  function selectTab(id) {
    setTab(id);
    setOpen(true);
  }

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-ink">Welcome, Sourabh</h1>
        <div className="flex items-center gap-4 text-sm">
          <button
            onClick={() => selectTab("mine")}
            className={`font-semibold ${tab === "mine" ? "text-forest" : "text-ink/50 hover:text-forest"}`}
          >
            My SkillCoach
          </button>
          <span className="text-ink/30">|</span>
          <button
            onClick={() => selectTab("corner")}
            className={`font-semibold ${tab === "corner" ? "text-forest" : "text-ink/50 hover:text-forest"}`}
          >
            Coaches Corner
          </button>
        </div>
      </div>

      <div className="relative my-6 overflow-hidden rounded-3xl bg-gradient-to-br from-forest to-forest-deep px-8 py-8 sm:px-10">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(rgba(244,246,245,0.14) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />
        <div className="pointer-events-none absolute -top-28 -left-20 h-80 w-80 rounded-full bg-gold/30 blur-[90px]" />
        <div className="pointer-events-none absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-crimson/20 blur-[100px]" />

        <div className="relative z-10">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-white">{copy.label}</h2>
            <button
              onClick={() => setOpen((o) => !o)}
              className="inline-flex items-center gap-1.5 rounded-full bg-gold px-5 py-2 text-sm font-bold text-ink shadow-[0_8px_20px_-10px_rgba(217,164,65,.9)] transition-transform hover:-translate-y-px hover:bg-gold-deep hover:text-white"
            >
              Instructions
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
              >
                <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          <div
            className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
              open ? "grid-rows-[1fr] mt-5" : "grid-rows-[0fr] mt-0"
            }`}
          >
            <div className="overflow-hidden">
              <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
                {copy.sections.map((s, i) =>
                  s.body === "upgrade-cta" ? (
                    <p key={i} className="text-[15px] text-ink/70">
                      If you would like to become a Coach and create lessons please request a free{" "}
                      <span className="font-semibold text-forest underline decoration-forest/40 underline-offset-2">
                        upgrade now
                      </span>
                      .
                    </p>
                  ) : (
                    <div key={i}>
                      {s.heading && (
                        <p className="mb-1 text-sm font-bold text-forest">{s.heading}</p>
                      )}
                      <p className="text-[15px] leading-relaxed text-ink/70">{s.body}</p>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {tab === "mine" && (
        <>
          <p className="mb-4 text-sm text-ink/50">Hover a card to see what's inside.</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {TILES.map((t) => (
              <Link
                key={t.title}
                to={t.to}
                className={`group relative overflow-hidden rounded-2xl p-6 shadow-sm transition-transform hover:-translate-y-1 hover:shadow-lg ${t.tone}`}
              >
                <div className={`mb-4 grid h-12 w-12 place-items-center rounded-xl ${t.iconTone}`}>
                  {t.icon}
                </div>
                <h2 className="text-xl font-bold">{t.title}</h2>
                <p className="mt-1.5 max-w-sm text-[14px] leading-relaxed opacity-80">{t.body}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold opacity-0 transition-opacity group-hover:opacity-100">
                  Open
                </span>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}