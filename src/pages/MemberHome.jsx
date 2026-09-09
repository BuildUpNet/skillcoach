// src/pages/MemberHome.jsx
// Redesigned Member Home (legacy: /members/home). Self-contained — only depends on react-router-dom.
// Design tokens follow the approved SkillCoach system: forest green #19352d → #122721, amber #d99b26,
// rounded-2xl/3xl surfaces, pill badges, Manrope.

import { Link } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";

/* ------------------------------------------------------------------ */
/*  Tokens                                                             */
/* ------------------------------------------------------------------ */
const GREEN = "#19352d";
const GREEN_DEEP = "#122721";
const GREEN_MID = "#142e27";
const AMBER = "#d99b26";

/* ------------------------------------------------------------------ */
/*  Icons (inline so there is no extra dependency)                     */
/* ------------------------------------------------------------------ */
const IconGroup = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="9" cy="8" r="3.2" />
    <circle cx="17" cy="9.5" r="2.6" />
    <path d="M3 19c0-3.3 2.7-6 6-6s6 2.7 6 6" />
    <path d="M15.5 14.2c2.9.3 5 2.3 5 4.8" />
  </svg>
);

const IconEducate = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M3 6.5C5.5 5.3 8.5 5.3 12 7c3.5-1.7 6.5-1.7 9-.5v11c-2.5-1.2-5.5-1.2-9 .5-3.5-1.7-6.5-1.7-9-.5v-11Z" />
    <path d="M12 7v11" />
  </svg>
);

const IconPersonal = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="4" y="3.5" width="16" height="17" rx="3" />
    <path d="M8.5 9h7M8.5 12.5h7M8.5 16h4" />
  </svg>
);

const IconArrow = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

const IconStar = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12 2.5l2.9 6.2 6.7.8-4.9 4.6 1.3 6.7L12 17.5l-6 3.3 1.3-6.7L2.4 9.5l6.7-.8L12 2.5Z" />
  </svg>
);

const IconPlay = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M8 5.5v13l11-6.5L8 5.5Z" />
  </svg>
);

const IconCheck = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);

/* ------------------------------------------------------------------ */
/*  Content (verbatim from the legacy page)                            */
/* ------------------------------------------------------------------ */
const PILLARS = [
  {
    title: "Business",
    Icon: IconGroup,
    items: [
      "Project Management Tools.",
      "Increase efficiency.",
      "Stay Organized.",
      "Monitor Progress.",
      "Identify Leaders.",
    ],
    href: "/members/home#tab1",
  },
  {
    title: "Educate",
    Icon: IconEducate,
    items: [
      "Lesson Building Software.",
      "Quiz Creation Software.",
      "Reach Global Audiences.",
      "Automate your lessons.",
      "Work from anywhere.",
    ],
    href: "/members/home#tab2",
  },
  {
    title: "Personal",
    Icon: IconPersonal,
    items: [
      "Organize your life.",
      "Remember important things.",
      "Manage Family Calendars.",
      "Easy access from phones.",
      "Your digital todo list.",
    ],
    href: "/members/home#tab3",
  },
];

/* ------------------------------------------------------------------ */
/*  1. Hero                                                            */
/* ------------------------------------------------------------------ */
function Hero({ userName = "Thomas Kee" }) {
  return (
    <section className="rounded-3xl overflow-hidden text-white bg-gradient-to-b from-[#19352d] to-[#122721] shadow-[0_24px_60px_-30px_rgba(18,39,33,0.6)]">
      <div className="p-8 sm:p-12 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-14 items-center">
        {/* Copy */}
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 ring-1 ring-white/15 pl-1.5 pr-4 py-1.5 text-sm sm:text-[15px] text-white/90">
            <span className="rounded-full bg-[#d99b26] text-[#122721] font-semibold px-2.5 py-0.5 text-xs sm:text-[13px]">
              New
            </span>
            Create, track and manage projects in one place
          </span>

          <h1 className="mt-6 font-extrabold tracking-tight leading-[1.02] text-4xl sm:text-5xl lg:text-6xl">
            Project Management Tools
          </h1>
          <p className="mt-4 text-lg sm:text-xl text-white/80">Create, Track, and Manage.</p>

          <div className="mt-6 flex flex-wrap gap-2.5">
            {["Business", "Educators", "Personal"].map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-2 rounded-full bg-white/[0.08] ring-1 ring-white/15 px-4 py-2 text-[15px] font-medium"
              >
                <span className="h-2 w-2 rounded-full bg-[#d99b26]" />
                {tag}
              </span>
            ))}
          </div>

          <div className="mt-8">
            <Link
              to="/members/instructions"
              className="inline-flex items-center gap-2 rounded-full bg-[#d99b26] text-[#122721] font-bold text-base sm:text-lg px-7 py-3.5 shadow-[0_10px_30px_-10px_rgba(217,155,38,0.8)] hover:bg-[#e6ab3a] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#d99b26]/40 transition-colors"
            >
              INSTRUCTIONS
              <IconArrow className="h-5 w-5" />
            </Link>
          </div>
        </div>

        {/* Visual showcase */}
        <div className="relative">
          <div className="absolute -inset-6 rounded-[2rem] bg-[#d99b26]/10 blur-2xl" aria-hidden="true" />
          <div className="relative rounded-2xl bg-white text-[#19352d] p-5 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] text-[#19352d]/60">Active project</p>
                <p className="text-lg font-bold">Q4 launch plan</p>
              </div>
              <span className="rounded-full bg-[#d99b26]/15 text-[#9a6a10] font-semibold text-[13px] px-3 py-1">
                On track
              </span>
            </div>

            <ul className="mt-5 space-y-2.5">
              {[
                ["Define milestones", true],
                ["Assign team leaders", true],
                ["Record how-to walkthrough", false],
                ["Review weekly progress", false],
              ].map(([label, done]) => (
                <li
                  key={label}
                  className="flex items-center gap-3 rounded-xl border border-gray-200/80 bg-[#f7f8f6] px-3.5 py-2.5 text-[15px]"
                >
                  <span
                    className={`grid h-6 w-6 place-items-center rounded-full ${
                      done ? "bg-[#19352d] text-white" : "border-2 border-[#19352d]/25"
                    }`}
                  >
                    {done && <IconCheck className="h-3.5 w-3.5" />}
                  </span>
                  <span className={done ? "line-through text-[#19352d]/50" : ""}>{label}</span>
                </li>
              ))}
            </ul>

            <div className="mt-5">
              <div className="flex justify-between text-[13px] text-[#19352d]/60">
                <span>Progress</span>
                <span className="font-semibold text-[#19352d]">50%</span>
              </div>
              <div className="mt-1.5 h-2 rounded-full bg-[#19352d]/10 overflow-hidden">
                <div className="h-full w-1/2 rounded-full bg-[#d99b26]" />
              </div>
            </div>
          </div>

          <div className="relative -mt-4 ml-8 sm:ml-12 rounded-2xl bg-[#d99b26] text-[#122721] px-5 py-3.5 shadow-xl inline-flex items-center gap-3">
            <div className="flex -space-x-2">
              {["TK", "AR", "JM"].map((i) => (
                <span
                  key={i}
                  className="grid h-8 w-8 place-items-center rounded-full bg-[#122721] text-white text-xs font-bold ring-2 ring-[#d99b26]"
                >
                  {i}
                </span>
              ))}
            </div>
            <span className="text-[15px] font-semibold">3 collaborators online</span>
          </div>
        </div>
      </div>

      {/* Welcome strip */}
      <div className="border-t border-white/10 bg-black/15 px-8 sm:px-12 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-xl sm:text-2xl font-semibold">Welcome {userName}!</p>
        <p className="flex items-center gap-3 text-[13px] sm:text-sm font-bold tracking-[0.14em] text-[#d99b26]">
          <span>COLLABORATE</span>
          <span className="h-1 w-1 rounded-full bg-[#d99b26]/60" />
          <span>EDUCATE</span>
          <span className="h-1 w-1 rounded-full bg-[#d99b26]/60" />
          <span>GROW</span>
        </p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  2. Three pillar cards                                              */
/* ------------------------------------------------------------------ */
function PillarCards() {
  return (
    <section className="mt-14 sm:mt-16">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PILLARS.map(({ title, Icon, items, href }) => (
          <article
            key={title}
            className="relative rounded-2xl bg-white border border-gray-200/80 shadow-[0_18px_40px_-28px_rgba(18,39,33,0.45)] pt-14 pb-8 px-7 mt-8"
          >
            <div className="absolute -top-8 left-7 grid h-16 w-16 place-items-center rounded-full bg-[#19352d] text-[#d99b26] ring-4 ring-[#f4f6f3] shadow-lg">
              <Icon className="h-8 w-8" />
            </div>

            <h3 className="text-2xl font-bold text-[#19352d]">{title}</h3>

            <ul className="mt-5 space-y-3 border-t border-gray-200/80 pt-5">
              {items.map((item) => (
                <li key={item} className="flex items-start gap-3 text-base text-gray-700">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#d99b26]" />
                  {item}
                </li>
              ))}
            </ul>

            <Link
              to={href}
              className="mt-7 inline-flex items-center gap-2 text-base font-semibold text-[#19352d] hover:text-[#d99b26] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#19352d]/30 rounded-md transition-colors"
            >
              Read more
              <IconArrow className="h-4 w-4" />
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  3. Value proposition                                               */
/* ------------------------------------------------------------------ */
function ValueProposition() {
  return (
    <section className="mt-20 sm:mt-24 mx-auto max-w-3xl text-center">
      <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#19352d] leading-tight">
        SkillCoach gives you the tools to START and MANAGE a business
      </h2>
      <p className="mt-6 text-lg leading-8 text-gray-600">
        Organization is the Key to Success. Starting a business can be difficult unless you have tools
        to make it easy, and SkillCoach offers those tools for free. We provide storefronts, client
        building and retention tools, email services, newsletter widgets, and sales channels that not
        only help you get started, but that help you grow without the normal out of pocket expenses.
      </p>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  4. Interactive software showcase                                   */
/* ------------------------------------------------------------------ */
function ScreenRecorderMock() {
  return (
    <div className="rounded-2xl bg-[#0f231d] ring-1 ring-white/10 p-3 shadow-2xl">
      {/* window chrome */}
      <div className="flex items-center gap-1.5 px-1 pb-3">
        <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
        <span className="ml-3 h-2 w-24 rounded-full bg-white/10" />
      </div>

      {/* preview — screenshot of the redesigned hero playing inside the recorder */}
      <div className="relative aspect-video rounded-lg overflow-hidden ring-1 ring-white/10 bg-[#122721]">
        <img
          src="/hero-preview.png"
          alt="Preview of the SkillCoach Project Management Tools home page"
          className="absolute inset-0 h-full w-full object-cover object-top"
          loading="lazy"
        />
        {/* soft vignette so the screenshot sits inside the player */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/50 px-2 py-0.5 text-[11px] text-white">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
          REC
        </span>
      </div>

      {/* controls */}
      <div className="mt-3 flex items-center gap-3 rounded-lg bg-white/[0.05] px-3 py-2">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-[#d99b26] text-[#122721]">
          <IconPlay className="h-3.5 w-3.5" />
        </span>
        <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full w-[38%] bg-[#d99b26]" />
        </div>
        <span className="text-[11px] text-white/60 tabular-nums">02:14 / 05:40</span>
      </div>

      {/* timeline */}
      <div className="mt-2 space-y-1.5">
        <div className="flex gap-1.5">
          <span className="h-6 flex-[3] rounded bg-[#d99b26]/60" />
          <span className="h-6 flex-[2] rounded bg-[#d99b26]/40" />
          <span className="h-6 flex-[4] rounded bg-[#d99b26]/70" />
        </div>
        <div className="flex gap-1.5">
          <span className="h-4 flex-[5] rounded bg-white/15" />
          <span className="h-4 flex-[4] rounded bg-white/10" />
        </div>
      </div>
    </div>
  );
}

function InteractiveSoftware() {
  return (
    <section className="mt-20 sm:mt-24 rounded-3xl bg-gradient-to-br from-[#19352d] to-[#142e27] text-white p-8 sm:p-12 shadow-[0_24px_60px_-30px_rgba(18,39,33,0.6)]">
      <span className="inline-flex items-center rounded-full bg-[#d99b26] text-[#122721] font-bold text-[13px] sm:text-sm tracking-[0.12em] px-4 py-1.5">
        INTERACTIVE SOFTWARE
      </span>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
        <ScreenRecorderMock />

        <div>
          <h3 className="text-2xl sm:text-3xl font-bold tracking-tight leading-snug">
            Video editing and screen capturing tools facilitate growth
          </h3>
          <p className="mt-5 text-base sm:text-lg leading-8 text-white/80">
            Our software is not required to use our other tools, but it certainly helps. Our software
            allows you to capture and record your screen in a video format, you can use that to explain
            yourself if you are managing team members or students, and especially if you are creating a
            'how - to' video, but you can do even more than that. You can edit the short videos you
            capture and then combine them to create a comprehensive video or lesson that is much more
            robust.
          </p>

          <div className="mt-6 flex items-center gap-1.5" aria-label="Rated 5 out of 5 stars">
            {Array.from({ length: 5 }).map((_, i) => (
              <IconStar key={i} className="h-6 w-6 text-[#d99b26]" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  5. Footer (matches the approved design system)                     */
/*  Remove this if AppLayout already renders the shared footer.        */
/* ------------------------------------------------------------------ */
function Footer() {
  const cols = [
    { heading: "Learn", links: ["Projects", "Instruction", "Badges", "Notes", "Credits"] },
    { heading: "Community", links: ["Coaches corner", "Members", "Forum", "Messages"] },
  ];

  return (
    <footer className="mt-20 sm:mt-24 rounded-3xl bg-gradient-to-br from-[#19352d] to-[#122721] text-white">
      <div className="px-8 sm:px-12 pt-12 pb-10 grid grid-cols-1 md:grid-cols-[1.4fr_1fr_1fr_1.1fr] gap-10">
        <div>
          <div className="inline-block rounded-2xl bg-white p-4">
            {/* same SkillCoach logo — adjust path to your asset */}
            <img src="/skillcoach-logo.png" alt="SkillCoach" className="h-12 w-auto" />
          </div>
          <p className="mt-6 text-2xl font-bold leading-tight">
            A portal for growth. <span className="text-[#d99b26]">Free, for everyone.</span>
          </p>
          <p className="mt-4 text-base leading-7 text-white/75 max-w-sm">
            Collaborate, share, and succeed on any project, assignment, or goal — with education,
            collaboration, and performance tools that cost nothing.
          </p>
        </div>

        {cols.map(({ heading, links }) => (
          <div key={heading}>
            <p className="text-sm font-bold tracking-[0.12em] text-[#d99b26] uppercase">{heading}</p>
            <ul className="mt-5 space-y-3">
              {links.map((l) => (
                <li key={l}>
                  <a href="#" className="text-base text-white/85 hover:text-white transition-colors">
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <p className="text-sm font-bold tracking-[0.12em] text-[#d99b26] uppercase">Contact</p>
          <address className="mt-5 not-italic text-base leading-7 text-white/85">
            SkillCoach
            <br />
            PO Box 922
            <br />
            La Jolla CA 92038
            <br />
            <a href="mailto:support@skillcoach.org" className="underline underline-offset-4 hover:text-white">
              support@skillcoach.org
            </a>
          </address>
        </div>
      </div>

      <div className="border-t border-white/10 px-8 sm:px-12 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-[15px] text-white/60">
        <p>© {new Date().getFullYear()} SkillCoach</p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-white">Privacy</a>
          <a href="#" className="hover:text-white">Terms of Service</a>
          <a href="#" className="hover:text-white">Contact</a>
        </div>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function MemberHome({ user: propUser }) {
  const { user: authUser } = useAuth();
  const user = propUser || authUser;

  return (
    <div className="bg-[#f4f6f3] font-[Manrope,ui-sans-serif,system-ui] text-[#19352d]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 pb-12">
        <Hero userName={user?.displayname || user?.username || user?.name || "Thomas Kee"} />
        <PillarCards />
        <ValueProposition />
        <InteractiveSoftware />
      </div>
    </div>
  );
}