import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

/**
 * Settings — "My Settings" page with General + Privacy tabs
 * React + Tailwind (v3/v4 compatible, no config needed — arbitrary color values only).
 * Palette: forest green #19352d / #142e27, gold #d99b26, off-white #f7f8f6, border gray-200/80.
 */

/* ============================== data ============================== */

const TABS = [
  "General",
  "Privacy",
  "Notifications",
  "Timeline",
  "Change Password",
  "Delete Account",
];

const TIMEZONES = [
  "(UTC-08:00) Pacific Time (US & Canada)",
  "(UTC-05:00) Eastern Time (US & Canada)",
  "(UTC+00:00) London, Dublin, Lisbon",
  "(UTC+01:00) Berlin, Paris, Madrid",
  "(UTC+04:00) Dubai, Abu Dhabi",
  "(UTC+05:30) Bombay, Calcutta, New Delhi",
  "(UTC+08:00) Singapore, Hong Kong",
  "(UTC+10:00) Sydney, Melbourne",
];

const LOCALES = ["English", "Español", "Français", "Deutsch", "हिन्दी"];

const PROFILE_VIEW_OPTIONS = ["Only Me", "Only My Friends", "Friends & Networks", "All Registered Members"];
const PROFILE_POST_OPTIONS = ["Only Me", "Only My Friends", "Friends & Networks"];

const ACTIVITY_ITEMS = [
  "New photo albums",
  "Birth photo is updated on timeline",
  "New blog entries",
  "New classified listings",
  "Comments on your photo albums",
  "Comments on your photos",
  "Comments on your blogs",
  "Comments on your classified listings",
  "Comments on your playlists",
  "Comments on your polls",
  "Comments on your videos",
  "Cover photo is updated on timeline",
  "New events",
  "Joining an event",
  "Uploading a photo to an event",
  "Creating an event discussion topic",
  "Replying to an event discussion topic",
  "Forum promotions",
  "Creating a forum topic",
  "Replying to a forum topic",
  "When I become friends with someone",
  "New groups",
  "Joining a group",
  "Uploading a group photo",
  "Group promotions",
  "When I accept a task in group",
  "When I complete a assignment in the task.",
  "When worked hours is added in the timesheet.",
  "_ACTIVITY_ACTIONTYPE_GROUP_TASK_BADGE",
  "_ACTIVITY_ACTIONTYPE_GROUP_TASK_CHANGE_ASSIGN",
  "When I create a task in group.",
  "When I submit a task in group.",
  "Creating a group discussion topic",
  "Replying to a group discussion topic",
  "Likes",
  "When I like something",
  "New playlists",
  "Joining a network",
  "_ACTIVITY_ACTIONTYPE_OFFERREVIEW_NEW",
  "Create Page Review",
  "Cover photo is updated on page timeline",
  "New page creation",
  "New polls",
  "Posting a status update to your own profile",
  "Changing your photo",
  "Activity Feed Item Shared",
  "_ACTIVITY_ACTIONTYPE_SHARED_LESSON",
  "_ACTIVITY_ACTIONTYPE_SHARED_LESSON_SHARE",
  "Tagged",
  "New videos",
  "Posting a new Ads",
];

/* ============================== shared styles ============================== */

const inputClass =
  "w-full h-12 rounded-xl border border-gray-200/80 bg-white px-4 text-[15px] text-[#19352d] " +
  "placeholder:text-[#9aa5a1] transition-colors duration-150 " +
  "hover:border-[#c9d2ce] focus:outline-none focus:border-[#19352d] focus:ring-4 focus:ring-[#19352d]/10";

function SelectDropdown({ value, onChange, options, className = "" }) {
  return (
    <div className="relative w-full max-w-md">
      <select
        value={value}
        onChange={onChange}
        className={
          "w-full h-12 appearance-none cursor-pointer rounded-xl border border-gray-200/80 bg-white px-4 pr-11 text-[15px] text-[#19352d] " +
          "transition-colors duration-150 hover:border-[#c9d2ce] focus:outline-none focus:border-[#19352d] focus:ring-4 focus:ring-[#19352d]/10 " +
          className
        }
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#19352d]">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>
    </div>
  );
}

const primaryBtn =
  "h-12 rounded-full bg-[#19352d] px-7 text-[16px] font-bold text-white shadow-sm transition-all duration-150 " +
  "hover:bg-[#142e27] hover:shadow-md active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-[#19352d]/25";

const goldBtn =
  "h-12 rounded-full bg-[#d99b26] px-7 text-[16px] font-bold text-[#19352d] shadow-sm transition-all duration-150 " +
  "hover:bg-[#c78c1f] hover:shadow-md active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-[#d99b26]/30";

/* ============================== building blocks ============================== */

function Field({ label, hint, children }) {
  return (
    <div className="grid gap-2 md:grid-cols-[220px_1fr] md:gap-8 py-6 border-b border-[#eef1ef] last:border-b-0">
      <div>
        <p className="text-[15px] font-semibold text-[#19352d]">{label}</p>
        {hint && <p className="mt-1 text-[14px] leading-relaxed text-[#6b7a75]">{hint}</p>}
      </div>
      <div>{children}</div>
    </div>
  );
}

/** Custom checkbox — hidden native input + SVG checked state */
function Checkbox({ label, checked, onChange, className = "" }) {
  return (
    <label
      className={
        "group flex cursor-pointer select-none items-start gap-3 rounded-xl px-3 py-2.5 transition-colors " +
        "hover:bg-[#f1f5f3] has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-[#19352d]/15 " +
        className
      }
    >
      <input type="checkbox" checked={checked} onChange={onChange} className="peer sr-only" />
      <span
        aria-hidden="true"
        className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 border-[#c9d2ce] bg-white transition-all duration-150
                   group-hover:border-[#19352d] peer-checked:border-[#19352d] peer-checked:bg-[#19352d]
                   [&>svg]:scale-0 [&>svg]:opacity-0 peer-checked:[&>svg]:scale-100 peer-checked:[&>svg]:opacity-100"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-150">
          <path d="m5 12 5 5L20 7" />
        </svg>
      </span>
      <span className="text-[15px] leading-snug text-[#19352d] break-all">{label}</span>
    </label>
  );
}

/** Custom radio — hidden native input + filled dot */
function Radio({ name, label, value, checked, onChange }) {
  return (
    <label
      className="group flex cursor-pointer select-none items-center gap-3 rounded-xl px-3 py-2.5 transition-colors
                 hover:bg-[#f1f5f3] has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-[#19352d]/15"
    >
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className="peer sr-only" />
      <span
        aria-hidden="true"
        className="grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 border-[#c9d2ce] bg-white transition-all duration-150
                   group-hover:border-[#19352d] peer-checked:border-[#19352d]
                   [&>span]:scale-0 peer-checked:[&>span]:scale-100"
      >
        <span className="h-2.5 w-2.5 rounded-full bg-[#19352d] transition-transform duration-150" />
      </span>
      <span className="text-[15px] text-[#19352d]">{label}</span>
    </label>
  );
}

function RadioGroup({ name, options, value, onChange }) {
  return (
    <div role="radiogroup" className="-mx-3 flex flex-col">
      {options.map((opt) => (
        <Radio key={opt} name={name} label={opt} value={opt} checked={value === opt} onChange={() => onChange(opt)} />
      ))}
    </div>
  );
}

function IntegrationRow({ network, icon, connected, onToggle }) {
  return (
    <div className="flex max-w-md items-center justify-between gap-4 rounded-xl border border-gray-200/80 bg-[#fbfcfb] px-4 py-3.5">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-lg border border-gray-200/80 bg-white text-[#19352d]">{icon}</span>
        <div>
          <p className="text-[15px] font-semibold text-[#19352d]">{network}</p>
          <p className="text-[14px] text-[#6b7a75]">{connected ? "Connected" : "Not connected"}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onToggle}
        className={
          connected
            ? "h-10 rounded-full border border-gray-200/80 bg-white px-4 text-[14px] font-semibold text-[#19352d] transition-colors hover:border-[#19352d]"
            : "h-10 rounded-full bg-[#19352d] px-4 text-[14px] font-semibold text-white transition-colors hover:bg-[#142e27]"
        }
      >
        {connected ? "Disconnect" : `Sign in with ${network}`}
      </button>
    </div>
  );
}

const FacebookIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M13.5 22v-8h2.7l.4-3.2h-3.1V8.8c0-.9.3-1.6 1.6-1.6h1.7V4.3c-.3 0-1.3-.1-2.5-.1-2.5 0-4.1 1.5-4.1 4.2v2.4H7.4V14h2.8v8h3.3Z" />
  </svg>
);

const TwitterIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M22 5.9c-.7.3-1.5.5-2.4.6.9-.5 1.5-1.3 1.8-2.3-.8.5-1.7.8-2.6 1a4.1 4.1 0 0 0-7 3.7A11.6 11.6 0 0 1 3.4 4.6a4.1 4.1 0 0 0 1.3 5.5c-.7 0-1.3-.2-1.9-.5 0 2 1.4 3.7 3.3 4.1-.6.2-1.2.2-1.9.1a4.1 4.1 0 0 0 3.8 2.8A8.3 8.3 0 0 1 2 18.3 11.7 11.7 0 0 0 8.3 20c7.6 0 11.7-6.3 11.7-11.7v-.5c.8-.6 1.5-1.3 2-2Z" />
  </svg>
);

/** Card shell shared by every tab */
function SettingsCard({ title, description, children, footer }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-[0_1px_2px_rgba(25,53,45,0.04),0_12px_32px_-16px_rgba(25,53,45,0.18)]">
      <div className="h-1.5 bg-[#19352d]" />
      <div className="px-6 pt-7 md:px-10">
        <h2 className="text-[24px] font-bold text-[#19352d]">{title}</h2>
        <p className="mt-1 text-[15px] text-[#6b7a75]">{description}</p>
      </div>
      <div className="px-6 pb-2 pt-2 md:px-10">{children}</div>
      <div className="flex flex-col-reverse items-stretch gap-3 border-t border-[#eef1ef] bg-[#fbfcfb] px-6 py-5 sm:flex-row sm:items-center sm:justify-between md:px-10">
        {footer}
      </div>
    </section>
  );
}

const timelineBtn =
  "h-12 rounded-xl bg-[#19352d] px-7 text-[16px] font-bold text-white shadow-sm transition-all duration-150 " +
  "hover:bg-[#122721] hover:shadow-md active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-[#19352d]/20";

const BTN_VARIANTS = { green: primaryBtn, gold: goldBtn, timeline: timelineBtn };

function SaveFooter({ saved, onSave, variant = "green", label = "Save changes", savedText = "Changes saved." }) {
  return (
    <>
      <p
        aria-live="polite"
        className={"text-[14px] text-[#6b7a75] transition-opacity duration-300 " + (saved ? "opacity-100" : "opacity-0")}
      >
        {savedText}
      </p>
      <button type="button" onClick={onSave} className={BTN_VARIANTS[variant] || primaryBtn}>
        {label}
      </button>
    </>
  );
}

function useSavedFlash() {
  const [saved, setSaved] = useState(false);
  const flash = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };
  return [saved, flash];
}

/* ============================== General tab ============================== */

function GeneralPanel() {
  const [form, setForm] = useState({
    email: "",
    profile: "",
    facebook: false,
    twitter: false,
    timezone: TIMEZONES[5],
    locale: LOCALES[0],
  });
  const [saved, flash] = useSavedFlash();
  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSave = () => {
    flash();
  };

  return (
    <SettingsCard
      title="General settings"
      description="Your account details, connected accounts, and regional preferences."
      footer={<SaveFooter saved={saved} onSave={handleSave} variant="gold" />}
    >
      <Field label="Email address">
        <input type="email" value={form.email} onChange={update("email")} placeholder="name@example.com" className={inputClass + " max-w-md"} />
      </Field>
      <Field label="Profile address">
        <input type="text" value={form.profile} onChange={update("profile")} placeholder="e.g. yourname" className={inputClass + " max-w-md"} />
      </Field>
      <Field label="Facebook integration" hint="Linking your Facebook account will let you login with Facebook.">
        <IntegrationRow network="Facebook" icon={FacebookIcon} connected={form.facebook} onToggle={() => setForm((f) => ({ ...f, facebook: !f.facebook }))} />
      </Field>
      <Field label="Twitter integration" hint="Linking your Twitter account will let you login with Twitter and publish content to your Twitter feed.">
        <IntegrationRow network="Twitter" icon={TwitterIcon} connected={form.twitter} onToggle={() => setForm((f) => ({ ...f, twitter: !f.twitter }))} />
      </Field>
      <Field label="Timezone" hint="Select the city closest to you that shares your same timezone.">
        <SelectDropdown value={form.timezone} onChange={update("timezone")} options={TIMEZONES} />
      </Field>
      <Field label="Locale" hint="Dates, times, and other settings will be displayed using this locale setting.">
        <SelectDropdown value={form.locale} onChange={update("locale")} options={LOCALES} />
      </Field>
    </SettingsCard>
  );
}

/* ============================== Privacy tab ============================== */

function PrivacyPanel() {
  const [hideFromSearch, setHideFromSearch] = useState(false);
  const [profileView, setProfileView] = useState("All Registered Members");
  const [profilePost, setProfilePost] = useState("Friends & Networks");
  const [activity, setActivity] = useState(() => Object.fromEntries(ACTIVITY_ITEMS.map((i) => [i, true])));
  const [saved, flash] = useSavedFlash();

  const enabledCount = Object.values(activity).filter(Boolean).length;
  const allOn = enabledCount === ACTIVITY_ITEMS.length;

  const toggleActivity = (item) => setActivity((a) => ({ ...a, [item]: !a[item] }));
  const setAll = (value) => setActivity(Object.fromEntries(ACTIVITY_ITEMS.map((i) => [i, value])));

  const handleSave = () => {
    flash();
  };

  return (
    <SettingsCard
      title="Privacy settings"
      description="Control who can see your profile, post on it, and what appears in the activity feed."
      footer={<SaveFooter saved={saved} onSave={handleSave} variant="green" />}
    >
      <Field
        label="Blocked Members"
        hint="Adding a person to your block list makes your profile (and all of your other content) unviewable to them. Any connections you have to the blocked person will be canceled. To add someone to your block list, visit that person's profile page."
      >
        <div className="-mx-3">
          <Checkbox
            label={`Do not display me in searches, browsing members, or the "Online Members" list.`}
            checked={hideFromSearch}
            onChange={() => setHideFromSearch((v) => !v)}
          />
        </div>
      </Field>

      <Field label="Profile Privacy" hint="Who can view your profile?">
        <RadioGroup name="profileView" options={PROFILE_VIEW_OPTIONS} value={profileView} onChange={setProfileView} />
      </Field>

      <Field label="Profile Posting Privacy" hint="Who can post on your profile?">
        <RadioGroup name="profilePost" options={PROFILE_POST_OPTIONS} value={profilePost} onChange={setProfilePost} />
      </Field>

      <Field
        label="Recent Activity Privacy"
        hint="Which of the following things do you want to have published about you in the recent activity feed? Note that changing this setting will only affect future news feed items."
      >
        <div className="rounded-2xl border border-gray-200/80 bg-[#f7f8f6] p-3 md:p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-1">
            <p className="text-[14px] text-[#6b7a75]">
              <span className="font-semibold text-[#19352d]">{enabledCount}</span> of {ACTIVITY_ITEMS.length} published
            </p>
            <button
              type="button"
              onClick={() => setAll(!allOn)}
              className="text-[14px] font-semibold text-[#d99b26] transition-colors hover:text-[#b8821a] focus:outline-none focus-visible:underline"
            >
              {allOn ? "Clear all" : "Select all"}
            </button>
          </div>
          <div className="grid gap-x-2 rounded-xl bg-white p-2 md:grid-cols-2">
            {ACTIVITY_ITEMS.map((item) => (
              <Checkbox key={item} label={item} checked={activity[item]} onChange={() => toggleActivity(item)} />
            ))}
          </div>
        </div>
      </Field>
    </SettingsCard>
  );
}

/* ============================== Timeline tab ============================== */

const TIMELINE_OPTIONS = ["Yes, replace", "No, use default profile page"];

function TimelinePanel() {
  const [replaceProfile, setReplaceProfile] = useState(TIMELINE_OPTIONS[0]);
  const [saved, flash] = useSavedFlash();

  const handleSave = () => {
    flash();
  };

  return (
    <SettingsCard
      title="Timeline Settings"
      description="Configure your timeline and profile viewing experience."
      footer={<SaveFooter saved={saved} onSave={handleSave} variant="timeline" label="Save Settings" savedText="Settings saved." />}
    >
      <Field label="Replace default profile?" hint="If you want to have default profile replaced with Timeline profile view.">
        <SelectDropdown
          value={replaceProfile}
          onChange={(e) => setReplaceProfile(e.target.value)}
          options={TIMELINE_OPTIONS}
        />
      </Field>
    </SettingsCard>
  );
}

/* ============================== placeholder for remaining tabs ============================== */

function ComingSoonPanel({ tab }) {
  return (
    <SettingsCard title={tab} description="This section is being redesigned." footer={<span />}>
      <div className="py-10 text-center text-[15px] text-[#6b7a75]">Nothing to configure here yet.</div>
    </SettingsCard>
  );
}

/* ============================== page ============================== */

export default function SettingsGeneral({ defaultTab = "General" }) {
  const { tab: urlTab } = useParams();
  const navigate = useNavigate();

  // Determine initial tab from props, url param, or default
  const getTabFromUrl = (val) => {
    if (!val) return defaultTab;
    const match = TABS.find((t) => t.toLowerCase().replace(/\s+/g, "-") === val.toLowerCase().replace(/\s+/g, "-") || t.toLowerCase() === val.toLowerCase());
    return match || defaultTab;
  };

  const [activeTab, setActiveTab] = useState(() => getTabFromUrl(urlTab));

  useEffect(() => {
    if (urlTab) {
      setActiveTab(getTabFromUrl(urlTab));
    }
  }, [urlTab]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    const slug = tab.toLowerCase().replace(/\s+/g, "-");
    navigate(`/settings/${slug}`);
  };

  const renderPanel = () => {
    switch (activeTab) {
      case "General":
        return <GeneralPanel />;
      case "Privacy":
        return <PrivacyPanel />;
      case "Timeline":
        return <TimelinePanel />;
      default:
        return <ComingSoonPanel tab={activeTab} />;
    }
  };

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 md:px-6 md:py-10">
      <header className="mb-6 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[13px] font-semibold tracking-[0.12em] text-[#d99b26]">ACCOUNT</p>
          <h1 className="mt-1 text-[32px] font-bold leading-tight text-[#19352d] md:text-[36px]">My Settings</h1>
        </div>

        <nav aria-label="Settings sections" className="-mx-1 overflow-x-auto md:mx-0">
          <div className="inline-flex gap-1 rounded-full border border-gray-200/80 bg-white p-1.5 shadow-sm">
            {TABS.map((tab) => {
              const active = tab === activeTab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => handleTabChange(tab)}
                  aria-current={active ? "page" : undefined}
                  className={
                    "whitespace-nowrap rounded-full px-4 py-2.5 text-[15px] font-semibold transition-colors duration-150 " +
                    (active ? "bg-[#19352d] text-white shadow-sm" : "text-[#19352d] hover:bg-[#f1f5f3]")
                  }
                >
                  {tab}
                </button>
              );
            })}
          </div>
        </nav>
      </header>

      {/* key forces a fresh mount so the panel fades in on every tab switch */}
      <div key={activeTab} className="animate-[settingsFade_220ms_ease-out]">
        {renderPanel()}
      </div>

      <style>{`
        @keyframes settingsFade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        @media (prefers-reduced-motion: reduce) { .animate-\\[settingsFade_220ms_ease-out\\] { animation: none; } }
      `}</style>
    </main>
  );
}
