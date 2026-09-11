// src/pages/adminpages/GroupEditDetails.jsx
// Redesign of legacy skillcoach.org/groups/edit/:id/ref/profile  ("Edit Group").
// Same tokens as MemberHome / GroupCreateTask: #19352d → #122721 green, #d99b26 amber, mist #f4f6f3, Manrope.
// Deps: react-router-dom, lucide-react.  Rendered inside AppLayout (navbar + footer already there).
//
// Wired to the real backend: group fetch/update, real categories, real photo
// upload, and real per-group privacy dials (reusing the same
// engine4_group_privacy system built for the Manage Group page). "Sub
// Category" is a real column (sub_category_id) but there's no separate
// subcategory table in the schema, so it reuses the same flat categories
// list. Lessons round-trip through the real `lessons` column (same
// bracket-string format the legacy PHP itself used), but the list of
// lesson names to pick from stays static — there's no Lessons/Video module
// built in this rebuild yet to source real lesson titles from.

import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ChevronDown,
  ChevronRight,
  Check,
  Upload,
  ImageIcon,
  Search,
  Eye,
  MessageSquare,
  Camera,
  CalendarPlus,
  BookOpen,
  Loader2,
} from "lucide-react";
import { getGroup, updateGroup, setGroupPhoto, getCategories, getGroupManage, setGroupPrivacy } from "../../lib/api";

/* ------------------------------------------------------------------ */
/*  Static reference lists — no backing table for real lesson titles   */
/* ------------------------------------------------------------------ */
const LESSONS = [
  "Stock Report Layer",
  "Stock Report Layer for Neetu",
  "SEO for stock reports",
  "Home Page",
  "New home page",
  "Custom Filter",
  "The Opportuniy",
  "Instruction",
  "Trend Tracker Intro",
  "The Trump Trend Is Breaking",
];

const VIEW_PRIVACY = ["Everyone", "Registered Members", "All Group Members"];
const MEMBER_PRIVACY = ["Registered Members", "All Group Members", "Officers and Owner Only"];

const VIEW_LABEL_TO_ROLE = { Everyone: "everyone", "Registered Members": "registered", "All Group Members": "member" };
const VIEW_ROLE_TO_LABEL = { everyone: "Everyone", registered: "Registered Members", member: "All Group Members", officer: "All Group Members" };
const MEMBER_LABEL_TO_ROLE = { "Registered Members": "registered", "All Group Members": "member", "Officers and Owner Only": "officer" };
const MEMBER_ROLE_TO_LABEL = { everyone: "Registered Members", registered: "Registered Members", member: "All Group Members", officer: "Officers and Owner Only" };

// Legacy stores selected lesson titles as a bracket/quote string, e.g.
// `["Lesson A","Lesson B"]` — matching Group_GroupController::editAction()'s
// own hand-rolled format so this stays schema-compatible with live.
function parseLessons(raw) {
  if (!raw) return [];
  return raw
    .replace(/[[\]"]/g, "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
function serializeLessons(list) {
  if (!list.length) return "";
  return "[" + list.map((l) => `"${l}"`).join(",") + "]";
}

/* ------------------------------------------------------------------ */
/*  Primitives                                                         */
/* ------------------------------------------------------------------ */
const inputCls =
  "block w-full rounded-xl border border-gray-200/80 bg-white px-4 py-3 text-[15px] text-[#19352d] placeholder:text-[#19352d]/40 focus:border-[#19352d]/40 focus:outline-none focus:ring-2 focus:ring-[#d99b26]/40";

function Dropdown({ value, options, onChange, className = "", icon: Icon, disabled }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 rounded-xl border border-gray-200/80 bg-white px-4 py-3 text-[15px] font-medium text-[#19352d] transition-colors hover:border-[#19352d]/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d99b26] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="flex items-center gap-2 truncate">
          {Icon && <Icon className="h-4 w-4 opacity-70" />}
          {value}
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute z-20 mt-2 max-h-72 w-full min-w-[12rem] overflow-y-auto rounded-xl border border-gray-200/80 bg-white p-1.5 shadow-xl"
        >
          {options.map((opt, i) => {
            const val = typeof opt === "string" ? opt : opt.label;
            const selected = val === value;
            return (
              <li key={`${val}-${i}`} role="option" aria-selected={selected}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(opt);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-[15px] text-[#19352d] hover:bg-[#f4f6f3] ${
                    selected ? "bg-[#f4f6f3] font-semibold" : ""
                  }`}
                >
                  {val}
                  {selected && <Check className="h-4 w-4 text-[#d99b26]" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Field({ label, htmlFor, children, hint, top }) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-[13rem_1fr] sm:items-start sm:gap-6">
      <label htmlFor={htmlFor} className={`text-[15px] font-semibold text-[#19352d] ${top ? "pt-1" : "pt-3"}`}>
        {label}
      </label>
      <div>
        {hint && <p className="mb-2 text-sm leading-6 text-[#19352d]/60">{hint}</p>}
        {children}
      </div>
    </div>
  );
}

function Toggle({ checked, onChange, label, id }) {
  return (
    <label htmlFor={id} className="inline-flex cursor-pointer items-center gap-3">
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d99b26] ${
          checked ? "bg-[#19352d]" : "bg-[#19352d]/20"
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? "left-1 translate-x-5" : "left-1"
          }`}
        >
          {checked && <Check className="m-auto h-3 w-3 text-[#19352d]" strokeWidth={3} style={{ marginTop: 4 }} />}
        </span>
      </button>
      <span className="text-[15px] text-[#19352d]">{label}</span>
    </label>
  );
}

function RadioGroup({ name, value, onChange, options }) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {options.map((opt) => {
        const active = opt === value;
        return (
          <label
            key={opt}
            className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-[15px] transition-colors ${
              active
                ? "border-[#19352d] bg-[#19352d] text-white"
                : "border-gray-200/80 bg-white text-[#19352d] hover:border-[#19352d]/30"
            }`}
          >
            <input
              type="radio"
              name={name}
              className="sr-only"
              checked={active}
              onChange={() => onChange(opt)}
            />
            <span
              className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${
                active ? "border-[#d99b26] bg-[#d99b26]" : "border-[#19352d]/30"
              }`}
            >
              {active && <span className="h-2 w-2 rounded-full bg-[#122721]" />}
            </span>
            {opt}
          </label>
        );
      })}
    </div>
  );
}

/** Multi-select lesson picker with search + selected chips. */
function LessonPicker({ selected, onChange, disabled }) {
  const [q, setQ] = useState("");
  const list = useMemo(
    () => LESSONS.filter((l) => l.toLowerCase().includes(q.trim().toLowerCase())),
    [q]
  );
  const toggle = (l) => onChange(selected.includes(l) ? selected.filter((x) => x !== l) : [...selected, l]);

  return (
    <div className={`rounded-xl border border-gray-200/80 bg-white ${disabled ? "pointer-events-none opacity-50" : ""}`}>
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200/80 p-3">
        {selected.length === 0 && <span className="px-1 text-sm text-[#19352d]/50">No lessons selected</span>}
        {selected.map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => toggle(l)}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#19352d] px-3 py-1 text-sm font-medium text-white hover:bg-[#122721]"
          >
            {l}
            <span aria-hidden className="text-white/70">×</span>
          </button>
        ))}
      </div>
      <div className="relative border-b border-gray-200/80">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#19352d]/45" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search lessons"
          className="block w-full bg-transparent py-2.5 pl-10 pr-4 text-[15px] text-[#19352d] placeholder:text-[#19352d]/40 focus:outline-none"
        />
      </div>
      <ul className="max-h-56 overflow-y-auto p-1.5">
        {list.map((l) => {
          const on = selected.includes(l);
          return (
            <li key={l}>
              <label
                className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] ${
                  on ? "bg-[#f4f6f3] font-medium text-[#19352d]" : "text-[#19352d] hover:bg-[#f4f6f3]"
                }`}
              >
                <input type="checkbox" className="sr-only" checked={on} onChange={() => toggle(l)} />
                <span
                  className={`grid h-5 w-5 place-items-center rounded-md border-2 ${
                    on ? "border-[#d99b26] bg-[#d99b26] text-[#122721]" : "border-[#19352d]/30 bg-white"
                  }`}
                >
                  {on && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                </span>
                <BookOpen className="h-4 w-4 text-[#19352d]/50" />
                {l}
              </label>
            </li>
          );
        })}
        {list.length === 0 && <li className="px-3 py-4 text-center text-sm text-[#19352d]/50">No lessons match "{q}"</li>}
      </ul>
      <p className="border-t border-gray-200/80 px-4 py-2 text-sm text-[#19352d]/60">
        {selected.length} of {LESSONS.length} selected
      </p>
    </div>
  );
}

function PhotoUpload({ file, currentUrl, groupInitial, onChange }) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (!file) return setPreview(null);
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const shown = preview || currentUrl;

  return (
    <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
      <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-[#19352d] to-[#122721] ring-4 ring-[#d99b26]/30">
        {shown ? (
          <img src={shown} alt="Group photo" className="h-full w-full object-cover" />
        ) : (
          <span className="text-lg font-black text-white">{groupInitial}</span>
        )}
      </div>

      <div>
        <input
          ref={inputRef}
          id="photo"
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-full border border-[#19352d]/20 bg-white px-5 py-2.5 text-[15px] font-semibold text-[#19352d] hover:border-[#19352d]/40 hover:bg-[#f4f6f3] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d99b26]"
        >
          <Upload className="h-4 w-4" />
          Choose File
        </button>
        <p className="mt-2 flex items-center gap-1.5 text-sm text-[#19352d]/60">
          <ImageIcon className="h-3.5 w-3.5" />
          {file ? file.name : "No file chosen"}
        </p>
      </div>
    </div>
  );
}

function resizeImageToDataUrl(file, maxDim = 480, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(img.src);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/* ------------------------------------------------------------------ */
/*  Header                                                             */
/* ------------------------------------------------------------------ */
function GroupHeader({ group }) {
  return (
    <section className="rounded-3xl bg-gradient-to-br from-[#19352d] to-[#122721] px-6 py-7 text-white shadow-[0_24px_60px_-30px_rgba(18,39,33,0.6)] sm:px-10 sm:py-9">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-white/60">
        <Link to="/projects" className="hover:text-white">
          Projects
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link to={`/projects/${group.group_id}`} className="hover:text-white">
          {group.title}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-white/90">Edit Group</span>
      </nav>
      <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">Edit Group</h1>
      <p className="mt-2 text-base text-white/75 sm:text-lg">
        Update the details, lessons, and privacy settings for {group.title}.
      </p>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function GroupEditDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [group, setGroup] = useState(null);
  const [categories, setCategories] = useState([]);
  const [isOwner, setIsOwner] = useState(true);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState(null);
  const [category, setCategory] = useState(null);
  const [subCategory, setSubCategory] = useState(null);
  const [includeLessons, setIncludeLessons] = useState(false);
  const [lessons, setLessons] = useState([]);
  const [dailySummary, setDailySummary] = useState(true);
  const [searchable, setSearchable] = useState("Yes, include in search results.");
  const [invite, setInvite] = useState("No, only officers can invite other people.");
  const [approve, setApprove] = useState("New members must be approved.");
  const [viewPrivacy, setViewPrivacy] = useState("All Group Members");
  const [commentPrivacy, setCommentPrivacy] = useState("All Group Members");
  const [photoPrivacy, setPhotoPrivacy] = useState("All Group Members");
  const [eventPrivacy, setEventPrivacy] = useState("All Group Members");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    Promise.all([getGroup(id), getCategories(), getGroupManage(id).catch(() => null)])
      .then(([g, cats, manage]) => {
        if (cancelled) return;
        setGroup(g);
        setCategories(cats);
        setName(g.title || "");
        setDescription(g.description || "");
        setCategory(g.category_id || null);
        setSubCategory(g.sub_category_id || null);
        const parsedLessons = parseLessons(g.lessons);
        setLessons(parsedLessons);
        setIncludeLessons(parsedLessons.length > 0);
        setDailySummary(!!g.summary_emails);
        setSearchable(g.search ? "Yes, include in search results." : "No, hide from search results.");
        setInvite(g.invite ? "Yes, members can invite other people." : "No, only officers can invite other people.");
        setApprove(g.approval ? "New members must be approved." : "New members can join immediately.");
        if (manage) {
          setIsOwner(manage.yourRole === "owner");
          setViewPrivacy(VIEW_ROLE_TO_LABEL[manage.privacy.view] || "All Group Members");
          setCommentPrivacy(MEMBER_ROLE_TO_LABEL[manage.privacy.comment] || "All Group Members");
          setPhotoPrivacy(MEMBER_ROLE_TO_LABEL[manage.privacy.photo] || "All Group Members");
          setEventPrivacy(MEMBER_ROLE_TO_LABEL[manage.privacy.event] || "All Group Members");
        }
      })
      .catch((err) => !cancelled && setLoadError(err.message || "Could not load this group"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleSave = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    setError("");
    try {
      await updateGroup(id, {
        title: name.trim(),
        description: description.trim(),
        category_id: category || 0,
        sub_category_id: subCategory || 0,
        search: searchable === "Yes, include in search results.",
        invite: invite === "Yes, members can invite other people.",
        approval: approve === "New members must be approved.",
        summary_emails: dailySummary,
        lessons: includeLessons ? serializeLessons(lessons) : "",
      });

      if (photo) {
        const dataUrl = await resizeImageToDataUrl(photo);
        await setGroupPhoto(id, dataUrl);
      }

      if (isOwner) {
        await Promise.all([
          setGroupPrivacy(id, "view", VIEW_LABEL_TO_ROLE[viewPrivacy] || "member"),
          setGroupPrivacy(id, "comment", MEMBER_LABEL_TO_ROLE[commentPrivacy] || "member"),
          setGroupPrivacy(id, "photo", MEMBER_LABEL_TO_ROLE[photoPrivacy] || "member"),
          setGroupPrivacy(id, "event", MEMBER_LABEL_TO_ROLE[eventPrivacy] || "member"),
        ]);
      }

      navigate(`/projects/${id}`);
    } catch (err) {
      setError(err.message || "Could not save these changes");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="grid min-h-[60vh] place-items-center bg-[#f4f6f3]">
        <Loader2 className="h-8 w-8 animate-spin text-[#19352d]/40" />
      </div>
    );
  }

  if (loadError || !group) {
    return (
      <div className="grid min-h-[60vh] place-items-center bg-[#f4f6f3] px-4 text-center">
        <div>
          <p className="text-lg font-semibold text-[#19352d]">{loadError || "Group not found"}</p>
          <Link to="/projects" className="mt-3 inline-block text-[#8a5f0f] underline underline-offset-4">
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  const categoryOptions = categories.map((c) => ({ label: c.title, value: c.category_id }));
  const selectedCategoryLabel = categoryOptions.find((c) => c.value === category)?.label || "Select a category";
  const selectedSubCategoryLabel = categoryOptions.find((c) => c.value === subCategory)?.label || "Select a category";

  return (
    <div className="bg-[#f4f6f3] font-[Manrope,ui-sans-serif,system-ui] text-[#19352d]">
      <div className="mx-auto max-w-5xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <GroupHeader group={group} />

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
          className="mt-8 space-y-6"
        >
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {error}
            </div>
          )}

          {/* ---------- Basics ---------- */}
          <section className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-[0_18px_40px_-28px_rgba(18,39,33,0.45)] sm:p-8">
            <h2 className="text-xl font-bold text-[#19352d]">Group details</h2>
            <div className="mt-6 space-y-6">
              <Field label="Group Name" htmlFor="name">
                <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} className={`${inputCls} sm:max-w-md`} />
              </Field>

              <Field label="Description" htmlFor="description">
                <textarea
                  id="description"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`${inputCls} resize-y leading-7`}
                />
              </Field>

              <Field label="Profile Photo" htmlFor="photo" top>
                <PhotoUpload file={photo} currentUrl={group.photo_data_url} groupInitial={(group.title || "?")[0]?.toUpperCase()} onChange={setPhoto} />
              </Field>

              <Field label="Category" htmlFor="category">
                <Dropdown value={selectedCategoryLabel} options={categoryOptions} onChange={(opt) => setCategory(opt.value)} className="sm:max-w-xs" />
              </Field>

              <Field label="Sub Category" htmlFor="subCategory" hint="Reuses the same category list — there's no separate subcategory table in the schema.">
                <Dropdown value={selectedSubCategoryLabel} options={categoryOptions} onChange={(opt) => setSubCategory(opt.value)} className="sm:max-w-xs" />
              </Field>
            </div>
          </section>

          {/* ---------- Lessons ---------- */}
          <section className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-[0_18px_40px_-28px_rgba(18,39,33,0.45)] sm:p-8">
            <h2 className="text-xl font-bold text-[#19352d]">Lessons</h2>
            <div className="mt-6 space-y-6">
              <div className="sm:pl-[calc(13rem+1.5rem)]">
                <Toggle id="includeLessons" checked={includeLessons} onChange={setIncludeLessons} label="Do you want to include lessons?" />
              </div>

              <Field label="Lessons" htmlFor="lessons" top>
                <LessonPicker selected={lessons} onChange={setLessons} disabled={!includeLessons} />
              </Field>

              <div className="sm:pl-[calc(13rem+1.5rem)]">
                <Toggle id="dailySummary" checked={dailySummary} onChange={setDailySummary} label="Enable Group Daily Summary Emails?" />
              </div>
            </div>
          </section>

          {/* ---------- Membership ---------- */}
          <section className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-[0_18px_40px_-28px_rgba(18,39,33,0.45)] sm:p-8">
            <h2 className="text-xl font-bold text-[#19352d]">Membership</h2>
            <div className="mt-6 space-y-6">
              <Field label="Include in search results?" top>
                <RadioGroup
                  name="searchable"
                  value={searchable}
                  onChange={setSearchable}
                  options={["Yes, include in search results.", "No, hide from search results."]}
                />
              </Field>

              <Field label="Let members invite others?" top>
                <RadioGroup
                  name="invite"
                  value={invite}
                  onChange={setInvite}
                  options={["Yes, members can invite other people.", "No, only officers can invite other people."]}
                />
              </Field>

              <Field
                label="Approve members?"
                top
                hint="When people try to join this group, should they be allowed to join immediately, or should they be forced to wait for approval?"
              >
                <RadioGroup
                  name="approve"
                  value={approve}
                  onChange={setApprove}
                  options={["New members can join immediately.", "New members must be approved."]}
                />
              </Field>
            </div>
          </section>

          {/* ---------- Privacy ---------- */}
          <section className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-[0_18px_40px_-28px_rgba(18,39,33,0.45)] sm:p-8">
            <h2 className="text-xl font-bold text-[#19352d]">Privacy</h2>
            {!isOwner && (
              <p className="mt-2 text-sm text-[#19352d]/60">Only the group owner can change privacy settings.</p>
            )}
            <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
              {[
                { label: "View Privacy", hint: "Who may see this group?", icon: Eye, value: viewPrivacy, set: setViewPrivacy, options: VIEW_PRIVACY },
                { label: "Comment Privacy", hint: "Who may post on this group's wall?", icon: MessageSquare, value: commentPrivacy, set: setCommentPrivacy, options: MEMBER_PRIVACY },
                { label: "Photo Uploads", hint: "Who may upload photos to this group?", icon: Camera, value: photoPrivacy, set: setPhotoPrivacy, options: MEMBER_PRIVACY },
                { label: "Event Creation", hint: "Who may create events for this group?", icon: CalendarPlus, value: eventPrivacy, set: setEventPrivacy, options: MEMBER_PRIVACY },
              ].map(({ label, hint, icon: Icon, value, set, options }) => (
                <div key={label} className="rounded-xl bg-[#f4f6f3] p-4">
                  <p className="flex items-center gap-2 text-[15px] font-semibold text-[#19352d]">
                    <Icon className="h-4 w-4 text-[#d99b26]" />
                    {label}
                  </p>
                  <p className="mt-0.5 text-sm text-[#19352d]/60">{hint}</p>
                  <Dropdown value={value} options={options} onChange={set} className="mt-3" disabled={!isOwner} />
                </div>
              ))}
            </div>
          </section>

          {/* ---------- Footer ---------- */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
            <Link
              to={`/projects/${id}`}
              className="inline-flex justify-center rounded-full px-6 py-3.5 text-base font-semibold text-[#19352d]/70 hover:bg-white hover:text-[#19352d] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#19352d]/30"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#d99b26] px-8 py-3.5 text-base font-bold text-[#122721] shadow-[0_10px_30px_-10px_rgba(217,155,38,0.8)] transition-colors hover:bg-[#e6ab3a] disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#d99b26]/40 sm:ml-auto"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" strokeWidth={3} />}
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
