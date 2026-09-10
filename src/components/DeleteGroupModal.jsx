// src/components/DeleteGroupModal.jsx
// Redesign of the legacy "Delete Group" confirmation popup.
// Same tokens as the rest of the redesign: #19352d → #122721 green, #d99b26 amber, mist #f4f6f3.
// Deps: react, lucide-react.
//
// Usage:
//   <DeleteGroupModal open={activeAction === "delete"} onClose={...} groupName="STD work" onConfirm={async () => ...} />

import { useEffect, useRef, useState } from "react";
import { X, Trash2, AlertTriangle } from "lucide-react";

export default function DeleteGroupModal({ open, onClose, groupName, onConfirm }) {
  const [deleting, setDeleting] = useState(false);
  const cancelRef = useRef(null);

  // Esc closes; lock scroll; focus lands on Cancel (safe default)
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    setTimeout(() => cancelRef.current?.focus(), 0);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onConfirm?.(); // TODO: DELETE /api/groups/:id
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-group-title"
        aria-describedby="delete-group-desc"
        className="w-full max-w-md overflow-hidden rounded-t-3xl bg-white shadow-2xl ring-1 ring-black/5 sm:rounded-3xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 bg-gradient-to-br from-[#19352d] to-[#122721] px-6 py-5 text-white">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose-500 text-white">
              <Trash2 className="h-5 w-5" />
            </span>
            <h2 id="delete-group-title" className="text-xl font-bold tracking-tight sm:text-2xl">
              Delete Group
            </h2>
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
        <div className="px-6 py-6">
          <p id="delete-group-desc" className="text-base leading-7 text-[#19352d]">
            Are you sure you want to delete this group?
          </p>

          {groupName && (
            <div className="mt-4 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
              <p className="text-[15px] leading-6 text-rose-900">
                <span className="font-semibold">{groupName}</span> and all of its tasks, assignments, lessons and
                messages will be permanently removed. This cannot be undone.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse gap-3 border-t border-gray-200/80 px-6 py-5 sm:flex-row sm:justify-end">
          <button
            ref={cancelRef}
            type="button"
            onClick={onClose}
            className="inline-flex justify-center rounded-full border border-[#19352d]/20 bg-white px-6 py-3 text-[15px] font-semibold text-[#19352d] transition-colors hover:border-[#19352d]/40 hover:bg-[#f4f6f3] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#19352d]/30"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-rose-600 px-7 py-3 text-[15px] font-bold text-white shadow-[0_10px_30px_-10px_rgba(225,29,72,0.7)] transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-4 focus-visible:ring-rose-500/40"
          >
            <Trash2 className="h-4 w-4" />
            {deleting ? "Deleting…" : "Delete Group"}
          </button>
        </div>
      </div>
    </div>
  );
}
