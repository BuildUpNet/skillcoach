// src/components/ShareGroupModal.jsx
// Redesign of the legacy "Share" popup (Share Group → re-post the group with your own message).
// Same tokens as the rest of the redesign: #19352d → #122721 green, #d99b26 amber, mist #f4f6f3.
// Deps: react, react-router-dom, lucide-react.
//
// Usage:
//   <ShareGroupModal
//     open={activeAction === "share"}
//     onClose={...}
//     group={{ id: 34, name: "STD work", description: "Work on Stock Traders Daily", logoText: [...] }}
//     onShare={async (message) => ...}
//   />

import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { X, Share2, Users, Link2, Check } from "lucide-react";

const MAX = 500;

export default function ShareGroupModal({ open, onClose, group, onShare }) {
  const [message, setMessage] = useState("");
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef(null);

  const groupUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/group/${group?.id}`;

  useEffect(() => {
    if (!open) return;
    setMessage("");
    setCopied(false);
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    setTimeout(() => textareaRef.current?.focus(), 0);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || !group) return null;

  const handleShare = async () => {
    setSharing(true);
    try {
      await onShare?.(message.trim()); // TODO: POST /api/groups/:id/share { message }
      onClose();
    } finally {
      setSharing(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(groupUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — ignore */
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-group-title"
        className="flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl ring-1 ring-black/5 sm:rounded-3xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 bg-gradient-to-br from-[#19352d] to-[#122721] px-6 py-5 text-white">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#d99b26] text-[#122721]">
              <Share2 className="h-5 w-5" />
            </span>
            <div>
              <h2 id="share-group-title" className="text-xl font-bold tracking-tight sm:text-2xl">
                Share
              </h2>
              <p className="mt-1 text-[15px] text-white/75">Share this by re-posting it with your own message.</p>
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {/* message */}
          <label htmlFor="share-message" className="sr-only">
            Your message
          </label>
          <div className="rounded-xl border border-gray-200/80 bg-white focus-within:border-[#19352d]/40 focus-within:ring-2 focus-within:ring-[#d99b26]/40">
            <textarea
              id="share-message"
              ref={textareaRef}
              rows={4}
              maxLength={MAX}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write something about this group…"
              className="block w-full resize-none bg-transparent px-4 py-3 text-[15px] leading-7 text-[#19352d] placeholder:text-[#19352d]/40 focus:outline-none"
            />
            <div className="flex items-center justify-end border-t border-gray-200/80 px-4 py-2 text-sm tabular-nums text-[#19352d]/50">
              {message.length}/{MAX}
            </div>
          </div>

          {/* preview card — what will be re-posted */}
          <p className="mt-6 text-sm font-bold uppercase tracking-wide text-[#19352d]/55">You're sharing</p>
          <div className="mt-2 flex items-center gap-4 rounded-2xl border border-gray-200/80 bg-[#f4f6f3] p-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-[#19352d] to-[#122721] ring-2 ring-[#d99b26]/30">
              {group.photo ? (
                <img src={group.photo} alt="" className="h-full w-full object-cover" />
              ) : group.logoText ? (
                <span className="text-[8px] font-black leading-tight tracking-wider text-white">
                  {group.logoText.map((l) => (
                    <span key={l} className="block">
                      {l}
                    </span>
                  ))}
                </span>
              ) : (
                <Users className="h-6 w-6 text-[#d99b26]" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <Link
                to={`/group/${group.id}`}
                onClick={onClose}
                className="block truncate text-base font-bold text-[#19352d] underline-offset-4 hover:underline"
              >
                {group.name}
              </Link>
              <p className="mt-0.5 truncate text-[15px] text-[#19352d]/70">{group.description}</p>
            </div>
            <button
              type="button"
              onClick={copyLink}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#19352d]/20 bg-white px-3.5 py-2 text-sm font-semibold text-[#19352d] transition-colors hover:border-[#19352d]/40 hover:bg-[#f4f6f3] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d99b26]"
            >
              {copied ? <Check className="h-4 w-4 text-[#d99b26]" strokeWidth={3} /> : <Link2 className="h-4 w-4" />}
              {copied ? "Copied" : "Copy link"}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse gap-3 border-t border-gray-200/80 px-6 py-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex justify-center rounded-full border border-[#19352d]/20 bg-white px-6 py-3 text-[15px] font-semibold text-[#19352d] transition-colors hover:border-[#19352d]/40 hover:bg-[#f4f6f3] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#19352d]/30"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleShare}
            disabled={sharing}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#d99b26] px-7 py-3 text-[15px] font-bold text-[#122721] shadow-[0_10px_30px_-10px_rgba(217,155,38,0.8)] transition-colors hover:bg-[#e6ab3a] disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#d99b26]/40"
          >
            <Share2 className="h-4 w-4" />
            {sharing ? "Sharing…" : "Share"}
          </button>
        </div>
      </div>
    </div>
  );
}
