import { useState } from "react";
import { Link } from "react-router-dom";

/* ------------------------------------------------------------------ */
/*  Data — same options as the live site, swap for API values if needed */
/* ------------------------------------------------------------------ */

const STEPS = [
  { label: "Get started", hint: "Why become a coach" },
  { label: "Subjects", hint: "What you'll teach" },
  { label: "Experience", hint: "Age and years in field" },
  { label: "Qualifications", hint: "What describes you" },
  { label: "Done", hint: "Request submitted" },
];

const CATEGORIES = [
  "Mathematics", "Science", "Language Arts", "History", "Business",
  "Technology", "Arts", "Health & Fitness", "Trades", "Other",
];

const AGES = Array.from({ length: 90 }, (_, i) => i + 11);
const YEARS = Array.from({ length: 51 }, (_, i) => i);

const QUALIFICATIONS = [
  "I am or was a professor",
  "I am or was a teacher",
  "I am or was a business professional",
  "I am or was a business owner",
  "I am or was a doctor",
  "I have a graduate degree",
  "I have a bachelor of degree",
  "I am well studied in my field",
  "I have hands-on experience",
  "I have practical knowledge",
  "I am a tutor",
];

/* ------------------------------------------------------------------ */
/*  Small shared pieces                                                 */
/* ------------------------------------------------------------------ */

const selectClass =
  "w-full rounded-xl border border-line bg-white px-4 py-3 text-[15px] text-ink " +
  "appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%2322433b%22 stroke-width=%222%22><path d=%22m6 9 6 6 6-6%22/></svg>')] " +
  "bg-[length:16px] bg-[right_14px_center] bg-no-repeat pr-10 " +
  "transition-colors hover:border-forest/50 focus:border-forest focus:outline-none focus:ring-2 focus:ring-gold/40";

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[15px] font-semibold text-forest-deep">{label}</span>
      {children}
    </label>
  );
}

function ChoiceTile({ type = "checkbox", name, checked, onChange, children }) {
  return (
    <label
      className={
        "flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-[15px] transition-colors " +
        (checked
          ? "border-forest bg-forest-soft text-forest-deep"
          : "border-line bg-white text-ink hover:border-forest/40")
      }
    >
      <input type={type} name={name} checked={checked} onChange={onChange} className="peer sr-only" />
      <span
        className={
          "grid size-5 shrink-0 place-items-center border-2 transition-colors " +
          (type === "radio" ? "rounded-full" : "rounded-md") +
          (checked ? " border-forest bg-forest" : " border-line bg-white")
        }
        aria-hidden
      >
        {checked && (
          type === "radio"
            ? <span className="size-2 rounded-full bg-gold" />
            : <svg viewBox="0 0 24 24" className="size-3.5 stroke-gold" fill="none" strokeWidth="3"><path d="m5 12 5 5L20 7" /></svg>
        )}
      </span>
      <span className="font-medium">{children}</span>
    </label>
  );
}

function StepShell({ title, lead, children, onBack, onNext, nextLabel = "Continue", nextDisabled }) {
  return (
    <div className="flex h-full flex-col">
      <header className="mb-8">
        <h1 className="font-display text-[28px] font-extrabold leading-tight tracking-tight text-forest-deep md:text-[34px]">
          {title}
        </h1>
        {lead && <p className="mt-3 max-w-[60ch] text-[16px] leading-relaxed text-ink/75">{lead}</p>}
      </header>

      <div className="flex-1">{children}</div>

      <footer className="mt-10 flex items-center justify-between gap-4 border-t border-line pt-6">
        {onBack ? (
          <button type="button" onClick={onBack}
            className="rounded-full px-5 py-3 text-[15px] font-semibold text-forest hover:bg-forest-soft">
            Back
          </button>
        ) : <span />}
        <button type="button" onClick={onNext} disabled={nextDisabled}
          className="rounded-full bg-forest px-7 py-3 text-[15px] font-bold text-white shadow-[0_8px_20px_-8px_rgba(34,67,59,.6)] transition hover:bg-forest-deep disabled:cursor-not-allowed disabled:opacity-40">
          {nextLabel}
        </button>
      </footer>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */

export default function UpgradePage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    wantsToCoach: "yes",
    categories: ["", "", ""],
    age: "",
    years: "",
    qualifications: [],
    description: "",
  });

  const update = (patch) => setForm((f) => ({ ...f, ...patch }));
  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const submit = async () => {
    // TODO: POST form to your API (same payload the old PHP flow expected)
    // await fetch(`${API}/api/members/upgrade`, { method: 'POST', credentials: 'include', body: JSON.stringify(form) })
    next();
  };

  const toggleQual = (q) =>
    update({
      qualifications: form.qualifications.includes(q)
        ? form.qualifications.filter((x) => x !== q)
        : [...form.qualifications, q],
    });

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-20 pt-8 md:px-6 md:pt-12">
      <div className="overflow-hidden rounded-[28px] border border-line bg-white shadow-[0_24px_60px_-40px_rgba(20,26,24,.35)] md:grid md:grid-cols-[300px_1fr]">

        {/* ---------------- Progress rail ---------------- */}
        <aside className="bg-forest-deep p-6 text-white md:p-8">
          <p className="text-[13px] font-semibold text-gold">Become a SkillCoach</p>
          <p className="mt-1 text-[15px] leading-snug text-white/70">
            Free, five short steps, then a quick approval.
          </p>

          {/* mobile: horizontal dots */}
          <ol className="mt-6 flex items-center gap-2 md:hidden" aria-label="Progress">
            {STEPS.map((s, i) => (
              <li key={s.label} className="flex flex-1 items-center gap-2">
                <span
                  className={
                    "grid size-8 shrink-0 place-items-center rounded-full text-[13px] font-bold " +
                    (i < step ? "bg-gold text-forest-deep" : i === step ? "bg-white text-forest-deep ring-4 ring-gold/40" : "bg-white/10 text-white/60")
                  }
                  aria-current={i === step ? "step" : undefined}
                >
                  {i < step ? "✓" : i + 1}
                </span>
                {i < STEPS.length - 1 && <span className={"h-px flex-1 " + (i < step ? "bg-gold" : "bg-white/15")} />}
              </li>
            ))}
          </ol>

          {/* desktop: vertical timeline */}
          <ol className="relative mt-10 hidden md:block" aria-label="Progress">
            <span className="absolute left-[15px] top-4 bottom-4 w-px bg-white/15" aria-hidden />
            <span
              className="absolute left-[15px] top-4 w-px bg-gold transition-[height] duration-500"
              style={{ height: `calc(${(step / (STEPS.length - 1)) * 100}% - ${(step / (STEPS.length - 1)) * 2}rem)` }}
              aria-hidden
            />
            {STEPS.map((s, i) => {
              const done = i < step, active = i === step;
              return (
                <li key={s.label} className="relative flex gap-4 pb-8 last:pb-0" aria-current={active ? "step" : undefined}>
                  <span
                    className={
                      "relative z-10 grid size-8 shrink-0 place-items-center rounded-full text-[13px] font-bold transition-colors " +
                      (done ? "bg-gold text-forest-deep" : active ? "bg-white text-forest-deep ring-4 ring-gold/40" : "bg-forest text-white/60 ring-1 ring-white/15")
                    }
                  >
                    {done ? "✓" : i + 1}
                  </span>
                  <span className="pt-1">
                    <span className={"block text-[15px] font-bold " + (active || done ? "text-white" : "text-white/55")}>{s.label}</span>
                    <span className="block text-[13px] text-white/50">{s.hint}</span>
                  </span>
                </li>
              );
            })}
          </ol>
        </aside>

        {/* ---------------- Step content ---------------- */}
        <section className="p-6 md:p-10 lg:p-12">
          {step === 0 && (
            <StepShell
              title="Teach what you know. It's free."
              lead="Everyone has something worth sharing. Becoming a SkillCoach costs nothing, but we ask why you're qualified so we can keep lessons trustworthy. The approval is short."
              onNext={next}
              nextDisabled={form.wantsToCoach !== "yes"}
            >
              <p className="mb-4 text-[15px] font-semibold text-forest-deep">
                Do you want to produce lessons, teach others, use our free lesson-building tools, and optionally earn income from your lessons?
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <ChoiceTile type="radio" name="wants" checked={form.wantsToCoach === "yes"} onChange={() => update({ wantsToCoach: "yes" })}>
                  Yes, I want to become a SkillCoach
                </ChoiceTile>
                <ChoiceTile type="radio" name="wants" checked={form.wantsToCoach === "no"} onChange={() => update({ wantsToCoach: "no" })}>
                  No, not right now
                </ChoiceTile>
              </div>
              {form.wantsToCoach === "no" && (
                <p className="mt-4 text-[14px] text-ink/60">
                  No problem — you can come back any time from the account menu.
                </p>
              )}
            </StepShell>
          )}

          {step === 1 && (
            <StepShell
              title="What will you teach?"
              lead="Pick up to three subjects. A best guess is fine — you can change this later."
              onBack={back}
              onNext={next}
              nextDisabled={!form.categories[0]}
            >
              <div className="grid gap-5 sm:max-w-md">
                {form.categories.map((val, i) => (
                  <Field key={i} label={i === 0 ? "Main subject" : `Subject ${i + 1} (optional)`}>
                    <select
                      className={selectClass}
                      value={val}
                      onChange={(e) => {
                        const c = [...form.categories]; c[i] = e.target.value; update({ categories: c });
                      }}
                    >
                      <option value="">Select a subject</option>
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </Field>
                ))}
              </div>
            </StepShell>
          )}

          {step === 2 && (
            <StepShell
              title="Your experience"
              lead="This helps reviewers understand your background at a glance."
              onBack={back}
              onNext={next}
              nextDisabled={!form.age || form.years === ""}
            >
              <div className="grid gap-5 sm:max-w-md sm:grid-cols-2">
                <Field label="How old are you?">
                  <select className={selectClass} value={form.age} onChange={(e) => update({ age: e.target.value })}>
                    <option value="">Select</option>
                    {AGES.map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                </Field>
                <Field label="Years in this field">
                  <select className={selectClass} value={form.years} onChange={(e) => update({ years: e.target.value })}>
                    <option value="">Select</option>
                    {YEARS.map((y) => <option key={y} value={y}>{y}{y === 50 ? "+" : ""}</option>)}
                  </select>
                </Field>
              </div>
            </StepShell>
          )}

          {step === 3 && (
            <StepShell
              title="Your qualifications"
              lead="Tick everything that applies, then add a few words if you'd like reviewers to know more."
              onBack={back}
              onNext={submit}
              nextLabel="Send request"
              nextDisabled={form.qualifications.length === 0}
            >
              <div className="grid gap-3 md:grid-cols-2">
                {QUALIFICATIONS.map((q) => (
                  <ChoiceTile key={q} checked={form.qualifications.includes(q)} onChange={() => toggleQual(q)}>
                    {q}
                  </ChoiceTile>
                ))}
              </div>

              <div className="mt-8">
                <Field label="Anything else? (optional)">
                  <textarea
                    rows={4}
                    value={form.description}
                    onChange={(e) => update({ description: e.target.value })}
                    placeholder="Courses you've taught, work you've done, links to your portfolio…"
                    className="w-full rounded-xl border border-line bg-white px-4 py-3 text-[15px] leading-relaxed text-ink placeholder:text-ink/40 focus:border-forest focus:outline-none focus:ring-2 focus:ring-gold/40"
                  />
                </Field>
              </div>
            </StepShell>
          )}

          {step === 4 && (
            <div className="flex h-full flex-col items-start justify-center py-6">
              <span className="grid size-16 place-items-center rounded-full bg-gold-soft text-gold-deep">
                <svg viewBox="0 0 24 24" className="size-8" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m5 12 5 5L20 7" /></svg>
              </span>
              <h1 className="mt-6 font-display text-[28px] font-extrabold leading-tight tracking-tight text-forest-deep md:text-[34px]">
                Request sent
              </h1>
              <p className="mt-3 max-w-[58ch] text-[16px] leading-relaxed text-ink/75">
                Your request to become a SkillCoach is with our approval team. We'll reply quickly — watch your email and the
                notifications area in the SkillCoach menu. Once approved you can start publishing lessons and using our tools.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/projects" className="rounded-full bg-forest px-7 py-3 text-[15px] font-bold text-white hover:bg-forest-deep">
                  Back to home
                </Link>
                <Link to="/notes" className="rounded-full border border-line px-7 py-3 text-[15px] font-semibold text-forest hover:bg-forest-soft">
                  View notifications
                </Link>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
