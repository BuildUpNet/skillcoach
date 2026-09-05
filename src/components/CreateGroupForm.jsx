import { useEffect, useState } from "react";

const CATEGORIES = ["Business", "Education", "Technology", "Health & Fitness", "Arts & Culture", "Finance & Trading", "Personal Development", "Other"];
const PRIVACY = ["Everyone", "Registered Members", "Group Members Only", "Officers Only"];

const initial = {
  name: "", description: "", photo: null, category: "", dailySummary: true,
  searchable: "yes", memberInvites: "yes", approval: "immediate",
  viewPrivacy: "Everyone", commentPrivacy: "Registered Members", photoPrivacy: "Registered Members", eventPrivacy: "Registered Members",
};

const field = "w-full rounded-xl border border-line bg-white px-4 py-3 text-[15px] text-ink outline-none transition-all placeholder:text-ink/40 hover:border-forest/40 focus:border-forest focus:ring-4 focus:ring-forest/10";
const label = "block text-[15px] font-semibold text-ink";
const hint = "mt-1.5 text-[13.5px] text-ink/55";

function Section({ step, title, desc, children }) {
  return (
    <section className="rounded-3xl bg-white p-6 ring-1 ring-line sm:p-8">
      <div className="mb-6 flex items-start gap-4 border-b border-line pb-5">
        <span className="grid h-9 w-9 flex-none place-items-center rounded-full bg-forest text-[14px] font-extrabold text-white">{step}</span>
        <div>
          <h2 className="text-[20px] font-extrabold tracking-tight text-ink">{title}</h2>
          <p className="mt-0.5 text-[14.5px] text-ink/55">{desc}</p>
        </div>
      </div>
      <div className="space-y-6">{children}</div>
    </section>
  );
}

function Choice({ name, value, current, onChange, title, desc }) {
  const on = current === value;
  return (
    <label className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-all ${on ? "border-forest bg-forest-soft/70 ring-2 ring-forest/20" : "border-line bg-white hover:border-forest/40"}`}>
      <input type="radio" name={name} value={value} checked={on} onChange={() => onChange(value)} className="sr-only" />
      <span className={`mt-0.5 grid h-5 w-5 flex-none place-items-center rounded-full border-2 ${on ? "border-forest bg-forest" : "border-ink/30 bg-white"}`}>
        {on && <span className="h-2 w-2 rounded-full bg-white" />}
      </span>
      <span>
        <span className="block text-[15px] font-semibold text-ink">{title}</span>
        {desc && <span className="mt-0.5 block text-[13.5px] text-ink/55">{desc}</span>}
      </span>
    </label>
  );
}

function PrivacySelect({ id, title, question, value, onChange }) {
  return (
    <div>
      <label htmlFor={id} className={label}>{title}</label>
      <div className="relative mt-2">
        <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={`${field} cursor-pointer appearance-none pr-12`}>
          {PRIVACY.map((p) => <option key={p}>{p}</option>)}
        </select>
        <svg className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
      </div>
      <p className={hint}>{question}</p>
    </div>
  );
}

export default function CreateGroupForm({ onCancel, onSave }) {
  const [data, setData] = useState(initial);
  const [errors, setErrors] = useState({});
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);

  const set = (k) => (v) => { setData((d) => ({ ...d, [k]: v })); if (errors[k]) setErrors((e) => ({ ...e, [k]: "" })); };

  useEffect(() => {
    if (!data.photo) { setPreview(null); return; }
    const url = URL.createObjectURL(data.photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [data.photo]);

  const submit = (e) => {
    e.preventDefault();
    const v = {};
    if (!data.name.trim()) v.name = "Group name is required";
    if (!data.description.trim()) v.description = "Please describe your group";
    if (!data.category) v.category = "Pick a category";
    setErrors(v);
    if (Object.keys(v).length) return;
    setSaving(true);
    setTimeout(() => { setSaving(false); onSave?.(data); }, 900);
  };

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_300px]">
      {/* main column */}
      <div className="space-y-6">
        <Section step="1" title="Basics" desc="What is this group about?">
          <div>
            <label htmlFor="name" className={label}>Group name <span className="text-gold-deep">*</span></label>
            <input id="name" value={data.name} onChange={(e) => set("name")(e.target.value)} placeholder="e.g. STD work" className={`${field} mt-2`} />
            {errors.name && <p className="mt-1.5 text-[13.5px] font-medium text-red-600">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="description" className={label}>Description <span className="text-gold-deep">*</span></label>
            <textarea id="description" rows={5} value={data.description} onChange={(e) => set("description")(e.target.value)}
              placeholder="Tell members what the group is for, who it's for, and what to expect." className={`${field} mt-2 resize-y`} />
            <div className="mt-1.5 flex justify-between text-[13.5px] text-ink/55">
              <span>{errors.description ? <span className="font-medium text-red-600">{errors.description}</span> : "A clear description helps the right people find you."}</span>
              <span>{data.description.length}/500</span>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-[180px_1fr]">
            <div>
              <span className={label}>Profile photo</span>
              <label className="mt-2 flex aspect-square cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-gold/60 bg-gold-soft/50 text-center transition-colors hover:border-gold hover:bg-gold-soft">
                {preview ? (
                  <img src={preview} alt="" className="h-full w-full object-cover" />
                ) : (
                  <>
                    <span className="grid h-11 w-11 place-items-center rounded-full bg-gold text-ink">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.6-4.6a2 2 0 012.8 0L16 16m-2-2l1.6-1.6a2 2 0 012.8 0L20 14M14 8h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </span>
                    <span className="mt-2 px-3 text-[14px] font-bold text-ink">Upload photo</span>
                    <span className="text-[12.5px] text-ink/55">PNG or JPG</span>
                  </>
                )}
                <input type="file" accept="image/*" className="sr-only" onChange={(e) => set("photo")(e.target.files?.[0] || null)} />
              </label>
              {data.photo && <button type="button" onClick={() => set("photo")(null)} className="mt-2 text-[13.5px] font-semibold text-ink/55 hover:text-crimson">Remove photo</button>}
            </div>

            <div className="space-y-6">
              <div>
                <label htmlFor="category" className={label}>Category <span className="text-gold-deep">*</span></label>
                <div className="relative mt-2">
                  <select id="category" value={data.category} onChange={(e) => set("category")(e.target.value)} className={`${field} cursor-pointer appearance-none pr-12 ${!data.category ? "text-ink/40" : ""}`}>
                    <option value="">Choose a category</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <svg className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </div>
                {errors.category && <p className="mt-1.5 text-[13.5px] font-medium text-red-600">{errors.category}</p>}
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line bg-mist p-4 hover:border-forest/40">
                <input type="checkbox" checked={data.dailySummary} onChange={(e) => set("dailySummary")(e.target.checked)} className="mt-1 h-4.5 w-4.5 accent-forest" />
                <span>
                  <span className="block text-[15px] font-semibold text-ink">Daily summary emails</span>
                  <span className="block text-[13.5px] text-ink/55">Members get one digest a day with the group's activity.</span>
                </span>
              </label>
            </div>
          </div>
        </Section>

        <Section step="2" title="Membership" desc="How people find and join this group.">
          <div>
            <span className={label}>Include in search results?</span>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <Choice name="searchable" value="yes" current={data.searchable} onChange={set("searchable")} title="Yes, include" desc="Anyone can find this group by searching." />
              <Choice name="searchable" value="no" current={data.searchable} onChange={set("searchable")} title="No, hide" desc="Only people with the link can find it." />
            </div>
          </div>
          <div>
            <span className={label}>Let members invite others?</span>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <Choice name="invites" value="yes" current={data.memberInvites} onChange={set("memberInvites")} title="Yes, members can invite" desc="Any member can bring in other people." />
              <Choice name="invites" value="officers" current={data.memberInvites} onChange={set("memberInvites")} title="No, only officers" desc="Only group officers can send invites." />
            </div>
          </div>
          <div>
            <span className={label}>Approve members?</span>
            <p className={hint}>When people try to join, should they get in immediately or wait for approval?</p>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <Choice name="approval" value="immediate" current={data.approval} onChange={set("approval")} title="Join immediately" desc="New members are added right away." />
              <Choice name="approval" value="approve" current={data.approval} onChange={set("approval")} title="Must be approved" desc="An officer reviews each request first." />
            </div>
          </div>
        </Section>

        <Section step="3" title="Privacy" desc="Who can see and contribute.">
          <div className="grid gap-6 sm:grid-cols-2">
            <PrivacySelect id="viewPrivacy" title="View privacy" question="Who may see this group?" value={data.viewPrivacy} onChange={set("viewPrivacy")} />
            <PrivacySelect id="commentPrivacy" title="Comment privacy" question="Who may post on this group's wall?" value={data.commentPrivacy} onChange={set("commentPrivacy")} />
            <PrivacySelect id="photoPrivacy" title="Photo uploads" question="Who may upload photos to this group?" value={data.photoPrivacy} onChange={set("photoPrivacy")} />
            <PrivacySelect id="eventPrivacy" title="Event creation" question="Who may create events for this group?" value={data.eventPrivacy} onChange={set("eventPrivacy")} />
          </div>
        </Section>
      </div>

      {/* sidebar */}
      <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">
        <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-line">
          <div className="relative h-28 bg-forest">
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gold/30 blur-2xl" />
            {preview ? (
              <img src={preview} alt="" className="absolute -bottom-8 left-5 h-20 w-20 rounded-2xl border-4 border-white object-cover" />
            ) : (
              <div className="absolute -bottom-8 left-5 grid h-20 w-20 place-items-center rounded-2xl border-4 border-white bg-gold-soft text-3xl font-extrabold text-gold-deep">
                {(data.name.trim()[0] || "?").toUpperCase()}
              </div>
            )}
          </div>
          <div className="px-5 pb-5 pt-11">
            <p className="text-[12.5px] font-bold uppercase tracking-wider text-gold-deep">Preview</p>
            <h3 className="mt-1 truncate text-[20px] font-extrabold tracking-tight text-ink">{data.name.trim() || "Your group name"}</h3>
            <p className="mt-1 line-clamp-3 text-[14.5px] leading-6 text-ink/65">{data.description.trim() || "Your description will appear here."}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-[12.5px] font-semibold">
              {data.category && <span className="rounded-full bg-forest-soft px-2.5 py-1 text-forest">{data.category}</span>}
              <span className="rounded-full bg-mist px-2.5 py-1 text-ink/60">{data.viewPrivacy}</span>
              <span className="rounded-full bg-mist px-2.5 py-1 text-ink/60">{data.approval === "approve" ? "Approval required" : "Open to join"}</span>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-5 ring-1 ring-line">
          <button type="submit" disabled={saving}
            className="inline-flex w-full items-center justify-center rounded-xl bg-forest px-5 py-3.5 text-[16px] font-bold text-white shadow-[0_12px_28px_-14px_rgba(34,67,59,.8)] transition-all hover:-translate-y-px hover:bg-forest-deep disabled:opacity-70">
            {saving ? "Saving…" : "Create group"}
          </button>
          <button type="button" onClick={onCancel} className="mt-2 w-full rounded-xl px-5 py-3 text-[15px] font-semibold text-ink/60 hover:bg-mist hover:text-ink">
            Cancel
          </button>
          <p className="mt-3 text-center text-[13px] text-ink/50">You can change all of these settings later.</p>
        </div>
      </aside>
    </form>
  );
}
