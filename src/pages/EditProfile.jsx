import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { MemberAvatar } from "../components/GroupHoverCard";
import { useAuth } from "../lib/AuthContext";
import {
  getMyProfileEdit, saveIntroduction, saveProfileFields,
  saveProfilePhoto, removeProfilePhoto, saveProfileSettings,
} from "../lib/api";

const TABS = [
  { key: "introduction", label: "Profile introduction" },
  { key: "info", label: "Personal info" },
  { key: "photo", label: "Edit my photo" },
  { key: "timeline", label: "Timeline" },
  { key: "style", label: "Profile style" },
  { key: "interests", label: "Profile interests" },
];

const INTEREST_GROUPS = [
  ["pages", "Pages", "What pages do you want to visit?"],
  ["events", "Events", "What kind of events do you like?"],
  ["classifieds", "Classifieds", "What classifieds do you like?"],
  ["groups", "Groups", "What groups do you like?"],
  ["music", "Music", "What music do you like?"],
  ["blogs", "Blogs", "What do you like to read?"],
  ["videos", "Videos", "What videos do you like?"],
  ["albums", "Albums", "What albums do you like?"],
  ["polls", "Polls", "What polls do you like?"],
];

const PRIVACY = [
  ["everyone", "Everyone"], ["registered", "All registered members"],
  ["friends", "Friends only"], ["me", "Just me"],
];

const input = "w-full rounded-xl border border-line bg-white px-4 py-3 text-[15px] text-ink outline-none transition-all placeholder:text-ink/40 hover:border-forest/40 focus:border-forest focus:ring-4 focus:ring-forest/10";
const primaryBtn = "inline-flex items-center justify-center rounded-xl bg-forest px-6 py-3 text-[15px] font-bold text-white transition-colors hover:bg-forest-deep disabled:cursor-not-allowed disabled:opacity-60";
const ghostBtn = "rounded-xl px-4 py-3 text-[15px] font-semibold text-ink/60 hover:bg-mist";

function Notice({ kind, children }) {
  if (!children) return null;
  const cls = kind === "error" ? "bg-red-50 text-red-700 ring-red-100" : "bg-forest-soft text-forest ring-forest/10";
  return <p className={`rounded-xl px-4 py-3 text-[14.5px] font-medium ring-1 ${cls}`}>{children}</p>;
}

function Field({ label, hint, children, required }) {
  return (
    <div className="grid gap-2 sm:grid-cols-[220px_1fr] sm:items-start sm:gap-8">
      <label className="pt-3 text-[15px] font-semibold text-ink">
        {label}{required && <span className="text-gold-deep"> *</span>}
      </label>
      <div>
        {children}
        {hint && <p className="mt-1.5 text-[13.5px] text-ink/55">{hint}</p>}
      </div>
    </div>
  );
}

function useSave(fn) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null); // { kind, text }
  const run = async (...args) => {
    setBusy(true); setMsg(null);
    try { const r = await fn(...args); setMsg({ kind: "ok", text: "Saved." }); return r; }
    catch (e) { setMsg({ kind: "error", text: e.message || "Couldn't save. Try again." }); }
    finally { setBusy(false); }
  };
  return { busy, msg, run };
}

/* ---------------- tabs ---------------- */

function IntroductionTab({ settings, onSaved }) {
  const [about, setAbout] = useState(settings.about);
  const [show, setShow] = useState(settings.show_intro);
  const { busy, msg, run } = useSave(async () => { await saveIntroduction({ about, show_intro: show }); onSaved({ about, show_intro: show }); });
  return (
    <div className="space-y-6">
      <p className="max-w-[60ch] text-[15px] leading-7 text-ink/65">
        A short introduction helps you find more friends. Say what you're interested in — introductions are shown on the home page so other members can find you.
      </p>
      <Field label="About me">
        <textarea rows={6} value={about} onChange={(e) => setAbout(e.target.value)} className={`${input} resize-y`} placeholder="A few lines about you and what you're here to learn or teach." />
        <label className="mt-3 flex cursor-pointer select-none items-center gap-2.5 text-[15px] text-ink/80">
          <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} className="h-4 w-4 accent-forest" />
          Show my introduction on the home page
        </label>
      </Field>
      <Notice kind={msg?.kind}>{msg?.text}</Notice>
      <button onClick={() => run()} disabled={busy} className={primaryBtn}>{busy ? "Saving…" : "Save introduction"}</button>
    </div>
  );
}

function DynamicField({ f, value, onChange }) {
  const opts = f.options || [];
  switch (true) {
    case f.type === "textarea":
      return <textarea rows={5} value={value ?? ""} onChange={(e) => onChange(e.target.value)} className={`${input} resize-y`} />;
    case ["select", "radio", "gender", "profile_type"].includes(f.type):
      return (
        <select value={value ?? ""} onChange={(e) => onChange(e.target.value)} className={input}>
          <option value="">—</option>
          {opts.map((o) => <option key={o.value} value={String(o.value)}>{o.label}</option>)}
        </select>
      );
    case ["multi_checkbox", "multiselect"].includes(f.type): {
      const set = new Set((value || []).map(String));
      return (
        <div className="grid gap-2 sm:grid-cols-2">
          {opts.map((o) => (
            <label key={o.value} className="flex cursor-pointer items-center gap-2.5 text-[15px] text-ink/80">
              <input type="checkbox" className="h-4 w-4 accent-forest" checked={set.has(String(o.value))}
                onChange={(e) => { const n = new Set(set); e.target.checked ? n.add(String(o.value)) : n.delete(String(o.value)); onChange([...n]); }} />
              {o.label}
            </label>
          ))}
        </div>
      );
    }
    case f.type === "checkbox":
      return (
        <label className="flex cursor-pointer items-center gap-2.5 pt-3 text-[15px] text-ink/80">
          <input type="checkbox" className="h-4 w-4 accent-forest" checked={!!value && value !== "0"} onChange={(e) => onChange(e.target.checked ? "1" : "")} />
          {f.description || "Yes"}
        </label>
      );
    case ["date", "birthdate"].includes(f.type):
      return <input type="date" value={(value || "").slice(0, 10)} onChange={(e) => onChange(e.target.value)} className={input} />;
    default:
      return <input type="text" value={value ?? ""} onChange={(e) => onChange(e.target.value)} className={input} />;
  }
}

function PersonalInfoTab({ fields, onSaved }) {
  const [values, setValues] = useState(() => Object.fromEntries(fields.filter((f) => f.type !== "heading").map((f) => [f.id, f.value])));
  const { busy, msg, run } = useSave(async () => { const r = await saveProfileFields(values); onSaved(r.fields); });

  if (!fields.length) {
    return <p className="rounded-xl bg-mist px-4 py-3 text-[15px] text-ink/65">No profile fields are configured yet. Your name and email are managed in <Link to="/settings" className="font-bold text-forest">account settings</Link>.</p>;
  }

  return (
    <div className="space-y-6">
      {fields.map((f) =>
        f.type === "heading" ? (
          <h3 key={f.id} className="border-b border-line pb-2 pt-2 text-[17px] font-extrabold tracking-tight text-ink first:pt-0">{f.label}</h3>
        ) : (
          <Field key={f.id} label={f.label} required={f.required} hint={f.type !== "checkbox" ? f.description : ""}>
            <DynamicField f={f} value={values[f.id]} onChange={(v) => setValues((p) => ({ ...p, [f.id]: v }))} />
          </Field>
        ),
      )}
      <Notice kind={msg?.kind}>{msg?.text}</Notice>
      <button onClick={() => run()} disabled={busy} className={primaryBtn}>{busy ? "Saving…" : "Save personal info"}</button>
    </div>
  );
}

function PhotoTab({ user, settings, onSaved }) {
  const [preview, setPreview] = useState(null);
  const [dataUrl, setDataUrl] = useState(null);
  const fileRef = useRef(null);
  const { busy, msg, run } = useSave(async () => {
    const r = await saveProfilePhoto(dataUrl);
    onSaved({ avatar_url: r.avatar_url }); setPreview(null); setDataUrl(null);
  });
  const remove = useSave(async () => { await removeProfilePhoto(); onSaved({ avatar_url: null }); });

  const pick = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { setDataUrl(reader.result); setPreview(reader.result); };
    reader.readAsDataURL(file);
  };

  const current = preview || settings.avatar_url;
  return (
    <div className="space-y-6">
      <Field label="Current photo">
        <div className="flex flex-wrap items-center gap-6">
          {current
            ? <img src={current} alt="" className="h-40 w-40 rounded-3xl object-cover ring-1 ring-line" />
            : <MemberAvatar member={{ name: user.displayname, avatar: null }} size="h-40 w-40 text-[56px]" className="rounded-3xl" />}
          <div className="space-y-2 text-[14.5px] text-ink/60">
            <p>Square images look best. JPG, PNG or WEBP, up to 5 MB.</p>
            {settings.avatar_url && !preview && (
              <button onClick={() => remove.run()} disabled={remove.busy} className="font-semibold text-crimson hover:underline">Remove photo</button>
            )}
          </div>
        </div>
      </Field>
      <Field label="Choose new photo">
        <input ref={fileRef} type="file" accept="image/*" onChange={(e) => pick(e.target.files?.[0])}
          className="block w-full text-[15px] text-ink/70 file:mr-4 file:rounded-xl file:border-0 file:bg-forest-soft file:px-4 file:py-2.5 file:text-[14.5px] file:font-bold file:text-forest hover:file:bg-forest hover:file:text-white" />
      </Field>
      <Notice kind={(msg || remove.msg)?.kind}>{(msg || remove.msg)?.text}</Notice>
      <div className="flex gap-2">
        <button onClick={() => run()} disabled={busy || !dataUrl} className={primaryBtn}>{busy ? "Uploading…" : "Save photo"}</button>
        {preview && <button onClick={() => { setPreview(null); setDataUrl(null); if (fileRef.current) fileRef.current.value = ""; }} className={ghostBtn}>Cancel</button>}
      </div>
    </div>
  );
}

function TimelineTab({ settings, onSaved }) {
  const [replace, setReplace] = useState(settings.timeline_replace);
  const { busy, msg, run } = useSave(async () => { const s = await saveProfileSettings({ timeline_replace: replace }); onSaved(s); });
  return (
    <div className="space-y-6">
      <Field label="Replace default profile?" hint="Show the timeline view instead of the default profile page.">
        <select value={replace ? "1" : "0"} onChange={(e) => setReplace(e.target.value === "1")} className={input}>
          <option value="1">Yes, replace</option>
          <option value="0">No, use default profile page</option>
        </select>
      </Field>
      <Notice kind={msg?.kind}>{msg?.text}</Notice>
      <button onClick={() => run()} disabled={busy} className={primaryBtn}>{busy ? "Saving…" : "Save settings"}</button>
    </div>
  );
}

function StyleTab({ settings, onSaved }) {
  const [css, setCss] = useState(settings.custom_css);
  const { busy, msg, run } = useSave(async () => { const s = await saveProfileSettings({ custom_css: css }); onSaved(s); });
  return (
    <div className="space-y-6">
      <Field label="Custom CSS" hint="Add your own CSS to give your profile a more personal look.">
        <textarea rows={10} value={css} onChange={(e) => setCss(e.target.value)} spellCheck={false}
          className={`${input} resize-y font-mono text-[14px]`} placeholder={".profile-cover { background: #22433b; }"} />
      </Field>
      <Notice kind={msg?.kind}>{msg?.text}</Notice>
      <button onClick={() => run()} disabled={busy} className={primaryBtn}>{busy ? "Saving…" : "Save styles"}</button>
    </div>
  );
}

function TagInput({ value = [], onChange, placeholder }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const t = draft.trim();
    if (t && !value.includes(t)) onChange([...value, t]);
    setDraft("");
  };
  return (
    <div className={`${input} flex flex-wrap items-center gap-2 py-2`}>
      {value.map((t) => (
        <span key={t} className="inline-flex items-center gap-1.5 rounded-lg bg-forest-soft px-2.5 py-1 text-[14px] font-semibold text-forest">
          {t}
          <button type="button" onClick={() => onChange(value.filter((x) => x !== t))} aria-label={`Remove ${t}`} className="text-forest/60 hover:text-forest">×</button>
        </span>
      ))}
      <input value={draft} onChange={(e) => setDraft(e.target.value)} onBlur={add}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); } }}
        placeholder={value.length ? "" : placeholder} className="min-w-[160px] flex-1 bg-transparent py-1 text-[15px] outline-none placeholder:text-ink/40" />
    </div>
  );
}

function InterestsTab({ settings, onSaved }) {
  const [interests, setInterests] = useState(settings.interests || {});
  const [privacy, setPrivacy] = useState(settings.interests_privacy);
  const { busy, msg, run } = useSave(async () => { const s = await saveProfileSettings({ interests, interests_privacy: privacy }); onSaved(s); });
  return (
    <div className="space-y-6">
      <p className="max-w-[60ch] text-[15px] leading-7 text-ink/65">Type what you're interested in and press Enter to add it. Choose at the bottom who can see your interests.</p>
      {INTEREST_GROUPS.map(([key, label, ph]) => (
        <Field key={key} label={label}>
          <TagInput value={interests[key] || []} onChange={(v) => setInterests((p) => ({ ...p, [key]: v }))} placeholder={ph} />
        </Field>
      ))}
      <Field label="Who can see this">
        <div className="flex flex-wrap gap-2">
          {PRIVACY.map(([v, l]) => (
            <button key={v} type="button" onClick={() => setPrivacy(v)}
              className={`rounded-xl px-4 py-2.5 text-[14.5px] font-semibold ring-1 transition-colors ${privacy === v ? "bg-forest text-white ring-forest" : "bg-white text-ink/70 ring-line hover:text-ink"}`}>
              {l}
            </button>
          ))}
        </div>
      </Field>
      <Notice kind={msg?.kind}>{msg?.text}</Notice>
      <button onClick={() => run()} disabled={busy} className={primaryBtn}>{busy ? "Saving…" : "Save changes"}</button>
    </div>
  );
}

/* ---------------- page ---------------- */

export default function EditProfile() {
  const { tab = "introduction" } = useParams();
  const navigate = useNavigate();
  const { user: me } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getMyProfileEdit().then(setData).catch((e) => setError(e.message || "Couldn't load your profile."));
  }, []);

  const active = TABS.some((t) => t.key === tab) ? tab : "introduction";
  const patchSettings = (patch) => setData((d) => ({ ...d, settings: { ...d.settings, ...patch } }));
  const setFields = (fields) => setData((d) => ({ ...d, fields }));

  const profileHref = me ? `/profile/${me.username || me.user_id}` : "/members";

  return (
    <div className="mx-auto max-w-[1200px] px-4 pt-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[34px] font-extrabold leading-none tracking-tight text-ink">Edit my profile</h1>
          <p className="mt-2 text-[15px] text-ink/60">Changes are saved per section.</p>
        </div>
        <Link to={profileHref} className="rounded-xl bg-white px-4 py-2.5 text-[15px] font-semibold text-forest ring-1 ring-line hover:ring-forest/40">View my profile</Link>
      </div>

      <div className="mt-6 space-y-4">
        <nav className="flex gap-1.5 overflow-x-auto rounded-2xl bg-white p-1.5 ring-1 ring-line">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => navigate(`/profile/edit/${t.key}`)}
              className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-[15px] font-semibold transition-colors ${active === t.key ? "bg-forest text-white" : "text-ink/65 hover:bg-forest-soft hover:text-forest"}`}>
              {t.label}
            </button>
          ))}
        </nav>

        <section className="rounded-3xl bg-white p-6 ring-1 ring-line sm:p-8">
          <div className="max-w-[820px]">
          {error && <Notice kind="error">{error}</Notice>}
          {!data && !error && (
            <div className="animate-pulse space-y-4">{[0, 1, 2].map((i) => <div key={i} className="h-12 rounded-xl bg-mist" />)}</div>
          )}
          {data && (
            <>
              <h2 className="mb-6 text-[22px] font-extrabold tracking-tight text-ink">{TABS.find((t) => t.key === active).label}</h2>
              {active === "introduction" && <IntroductionTab key="intro" settings={data.settings} onSaved={patchSettings} />}
              {active === "info" && <PersonalInfoTab key={data.fields.length} fields={data.fields} onSaved={setFields} />}
              {active === "photo" && <PhotoTab user={data.user} settings={data.settings} onSaved={patchSettings} />}
              {active === "timeline" && <TimelineTab settings={data.settings} onSaved={patchSettings} />}
              {active === "style" && <StyleTab settings={data.settings} onSaved={patchSettings} />}
              {active === "interests" && <InterestsTab settings={data.settings} onSaved={patchSettings} />}
            </>
          )}
          </div>
        </section>
      </div>
    </div>
  );
}