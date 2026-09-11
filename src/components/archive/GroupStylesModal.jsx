// src/components/archive/GroupStylesModal.jsx
// ARCHIVED: "Edit Group Style" / Group Styles modal
// Redesign of the legacy "Group Styles" popup (Edit Group Style → custom CSS for the group).
// Same tokens as the rest of the redesign: #19352d → #122721 green, #d99b26 amber, mist #f4f6f3.
// Deps: react, lucide-react.
//
// Usage / Reinstatement:
//   import GroupStylesModal from "./archive/GroupStylesModal"; // or "./GroupStylesModal"
//   const [open, setOpen] = useState(false);
//   <GroupStylesModal open={open} onClose={() => setOpen(false)} initialCss={group.css} onSave={(css) => ...} />

import { useEffect, useRef, useState } from "react";
import { X, Code2, Check, RotateCcw } from "lucide-react";

const PLACEHOLDER = `/* Write your custom CSS here */

/* Example: change the group heading colour */
.group-title {
  color: #19352d;
}

/* Example: use a different font for posts */
.group-post {
  font-family: Georgia, serif;
}`;

export default function GroupStylesModal({ open, onClose, initialCss = "", onSave }) {
  const [css, setCss] = useState(initialCss);
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef(null);
  const gutterRef = useRef(null);
  const dialogRef = useRef(null);

  // Reset draft whenever the modal is (re)opened
  useEffect(() => {
    if (open) {
      setCss(initialCss);
      setTimeout(() => textareaRef.current?.focus(), 0);
    }
  }, [open, initialCss]);

  // Escape closes, and lock page scroll while open
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const lines = Math.max(css.split("\n").length, 12);
  const dirty = css !== initialCss;

  const syncScroll = () => {
    if (gutterRef.current && textareaRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Tab inserts two spaces instead of moving focus
  const onKeyDown = (e) => {
    if (e.key !== "Tab") return;
    e.preventDefault();
    const el = e.target;
    const { selectionStart: s, selectionEnd: end } = el;
    const next = css.slice(0, s) + "  " + css.slice(end);
    setCss(next);
    requestAnimationFrame(() => el.setSelectionRange(s + 2, s + 2));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave?.(css); // TODO: PUT /api/groups/:id/styles
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      aria-hidden={false}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="group-styles-title"
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl ring-1 ring-black/5 sm:rounded-3xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 bg-gradient-to-br from-[#19352d] to-[#122721] px-6 py-5 text-white sm:px-8">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#d99b26] text-[#122721]">
              <Code2 className="h-5 w-5" />
            </span>
            <div>
              <h2 id="group-styles-title" className="text-xl font-bold tracking-tight sm:text-2xl">
                Group Styles
              </h2>
              <p className="mt-1 text-[15px] leading-6 text-white/75">
                You can change the colors, fonts, and styles of your group by adding CSS code below. The contents of
                the text area below will be output between{" "}
                <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[13px] text-[#d99b26]">
                  &lt;style&gt;
                </code>{" "}
                tags on your group.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d99b26]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-hidden px-6 pt-6 sm:px-8">
          <div className="overflow-hidden rounded-xl border border-gray-200/80 bg-[#f7f8f6] focus-within:border-[#19352d]/40 focus-within:ring-2 focus-within:ring-[#d99b26]/40">
            {/* editor chrome */}
            <div className="flex items-center justify-between border-b border-gray-200/80 bg-white px-4 py-2">
              <span className="flex items-center gap-2 text-[13px] font-semibold text-[#19352d]/70">
                <span className="h-2.5 w-2.5 rounded-full bg-[#d99b26]" />
                group.css
              </span>
              <span className="text-[13px] tabular-nums text-[#19352d]/50">
                {css.length.toLocaleString()} chars · {css.split("\n").length} lines
              </span>
            </div>

            <div className="flex h-[40vh] min-h-[16rem] max-h-[26rem]">
              {/* line numbers */}
              <div
                ref={gutterRef}
                aria-hidden="true"
                className="select-none overflow-hidden border-r border-gray-200/80 bg-[#f4f6f3] px-3 py-3 text-right font-mono text-[13px] leading-6 text-[#19352d]/40"
              >
                {Array.from({ length: lines }).map((_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>

              <textarea
                ref={textareaRef}
                value={css}
                onChange={(e) => setCss(e.target.value)}
                onScroll={syncScroll}
                onKeyDown={onKeyDown}
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
                placeholder={PLACEHOLDER}
                aria-label="Custom CSS"
                className="block flex-1 resize-none bg-transparent px-4 py-3 font-mono text-[13px] leading-6 text-[#19352d] placeholder:text-[#19352d]/35 focus:outline-none"
                style={{ fontFamily: "'JetBrains Mono','Fira Code',ui-monospace,SFMono-Regular,Menlo,Consolas,monospace", tabSize: 2 }}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse gap-3 px-6 py-5 sm:flex-row sm:items-center sm:px-8">
          {dirty && (
            <button
              type="button"
              onClick={() => setCss(initialCss)}
              className="inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 text-[15px] font-semibold text-[#19352d]/60 hover:bg-[#f4f6f3] hover:text-[#19352d]"
            >
              <RotateCcw className="h-4 w-4" /> Reset
            </button>
          )}
          <div className="flex flex-col-reverse gap-3 sm:ml-auto sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex justify-center rounded-full border border-[#19352d]/20 bg-white px-6 py-3 text-[15px] font-semibold text-[#19352d] transition-colors hover:border-[#19352d]/40 hover:bg-[#f4f6f3] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#19352d]/30"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !dirty}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#d99b26] px-7 py-3 text-[15px] font-bold text-[#122721] shadow-[0_10px_30px_-10px_rgba(217,155,38,0.8)] transition-colors hover:bg-[#e6ab3a] disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#d99b26]/40"
            >
              <Check className="h-4 w-4" strokeWidth={3} />
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
