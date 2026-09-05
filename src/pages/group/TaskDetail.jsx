import { useEffect, useRef, useState } from "react";
import { Link, useOutletContext, useParams, useSearchParams } from "react-router-dom";
import { getTaskById } from "../../data/groupWorkspace";
import { Avatar, Card, EmptyState, PriorityBadge, StatusBadge } from "../../components/group/GroupUI";
import Icon from "../../components/group/icons";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "open", label: "Not finished" },
  { key: "done", label: "Finished" },
];

const inputBase = "w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-[15px] text-ink outline-none transition-all placeholder:text-ink/45 hover:border-forest/40 focus:border-forest focus:ring-4 focus:ring-forest/10";

function AssignmentItem({ item, isOpen, isHighlighted, onToggleOpen, onToggleDone, onAddComment, itemRef }) {
  const [comment, setComment] = useState("");

  const submitComment = (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    onAddComment(item.id, comment.trim());
    setComment("");
  };

  return (
    <li
      ref={itemRef}
      className={`overflow-hidden rounded-2xl border transition-colors ${
        isHighlighted ? "border-gold ring-2 ring-gold/40" : "border-line"
      }`}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => onToggleOpen(item.id)}
        onKeyDown={(e) => {
          if (e.key !== "Enter" && e.key !== " ") return;
          e.preventDefault();
          onToggleOpen(item.id);
        }}
        className="flex w-full cursor-pointer items-center gap-3 bg-mist/60 px-4 py-3.5 text-left hover:bg-forest-soft/50"
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleDone(item.id);
          }}
          title={item.done ? "Mark not finished" : "Mark finished"}
          className={`grid h-6 w-6 flex-none place-items-center rounded-md ${item.done ? "bg-forest text-white" : "bg-crimson/15 text-crimson hover:bg-crimson/25"}`}
        >
          {item.done && <Icon name="check" className="h-4 w-4" />}
        </button>
        <div className="min-w-0 flex-1">
          <p className={`truncate text-[15px] font-semibold ${item.done ? "text-ink/55 line-through" : "text-ink"}`}>{item.title}</p>
          <p className="text-[14px] text-ink/65">
            For <span className="font-semibold text-ink/80">{item.assignee}</span> · {item.date}
          </p>
        </div>
        <Icon name="back" className={`h-4 w-4 flex-none text-ink/50 transition-transform ${isOpen ? "-rotate-90" : "rotate-180"}`} />
      </div>

      {isOpen && (
        <div className="space-y-4 border-t border-line px-4 py-4">
          <div className="flex items-start justify-between gap-4">
            <p className="text-[15px] leading-6 text-ink/80">{item.details}</p>
            <button
              onClick={() => window.print()}
              className="inline-flex flex-none items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-[14px] font-semibold text-ink/65 hover:border-forest hover:text-forest"
            >
              <Icon name="clipboard" className="h-3.5 w-3.5" /> Export
            </button>
          </div>

          <div className="rounded-xl bg-mist/50 p-3.5">
            <p className="mb-2.5 text-[14px] font-bold uppercase tracking-wider text-ink/60">Comments ({item.comments.length})</p>
            {item.comments.length ? (
              <ul className="space-y-2.5">
                {item.comments.map((c) => (
                  <li key={c.id} className="rounded-lg bg-white px-3 py-2.5 ring-1 ring-line">
                    <div className="flex items-center gap-2">
                      <Avatar name={c.author} size={22} />
                      <span className="text-[14px] font-bold text-ink">{c.author}</span>
                      <span className="text-[14px] italic text-ink/55">{c.date}</span>
                    </div>
                    <p className="mt-1 text-[14.5px] text-ink/80">{c.text}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[14px] text-ink/60">No comments.</p>
            )}
            <form onSubmit={submitComment} className="mt-2.5 flex gap-2">
              <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a comment…" className={inputBase} />
              <button type="submit" className="flex-none rounded-xl bg-forest px-4 py-2 text-[14px] font-bold text-white hover:bg-forest-deep">
                Post
              </button>
            </form>
          </div>

          <div className="rounded-xl bg-forest-soft/50 p-3.5">
            <p className="mb-2.5 text-[14px] font-bold uppercase tracking-wider text-forest">Worked hours</p>
            {item.workedHours.length ? (
              <ul className="space-y-1.5">
                {item.workedHours.map((w) => (
                  <li key={w.id} className="flex items-center justify-between text-[14.5px] text-ink/80">
                    <span>{w.person} · {w.date}</span>
                    <span className="font-bold text-forest">{w.hours}h</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[14px] text-ink/60">No hours worked yet.</p>
            )}
          </div>
        </div>
      )}
    </li>
  );
}

export default function TaskDetail() {
  const { groupId, taskId } = useParams();
  const { workspace } = useOutletContext();
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get("assignment");

  const task = getTaskById(workspace, taskId);
  const [assignments, setAssignments] = useState(task?.assignments ?? []);
  const [openIds, setOpenIds] = useState(() => new Set(highlightId ? [Number(highlightId)] : []));
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", assignee: task?.assignee ?? "", details: "" });
  const itemRefs = useRef({});

  useEffect(() => {
    setAssignments(task?.assignments ?? []);
    setOpenIds(new Set(highlightId ? [Number(highlightId)] : []));
    setForm({ title: "", assignee: task?.assignee ?? "", details: "" });
    setShowForm(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  useEffect(() => {
    if (highlightId && itemRefs.current[highlightId]) {
      itemRefs.current[highlightId].scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlightId, assignments]);

  if (!task) {
    return (
      <Card>
        <p className="text-[15px] font-semibold text-ink">Task not found.</p>
        <Link to={`/projects/${groupId}/tasks`} className="mt-2 inline-block font-semibold text-forest hover:underline">
          Back to all tasks
        </Link>
      </Card>
    );
  }

  const toggleOpen = (id) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleDone = (id) => {
    setAssignments((prev) => prev.map((a) => (a.id === id ? { ...a, done: !a.done } : a)));
  };

  const addComment = (id, text) => {
    setAssignments((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, comments: [...a.comments, { id: Date.now(), author: "You", text, date: "Just now" }] }
          : a
      )
    );
  };

  const collapseAll = () => setOpenIds(new Set());
  const expandAll = () => setOpenIds(new Set(filtered.map((a) => a.id)));

  const filtered = assignments.filter((a) => (filter === "done" ? a.done : filter === "open" ? !a.done : true));

  const submitNewAssignment = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    const id = Math.max(0, ...assignments.map((a) => a.id)) + 1;
    setAssignments((prev) => [
      { id, title: form.title.trim(), assignee: form.assignee || task.assignee, date: "Just now", done: false, details: form.details.trim(), comments: [], workedHours: [] },
      ...prev,
    ]);
    setForm({ title: "", assignee: task.assignee, details: "" });
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <Link to={`/projects/${groupId}/tasks`} className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-ink/65 hover:text-forest">
        <Icon name="back" className="h-4 w-4" /> All tasks
      </Link>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-[24px] font-extrabold leading-tight tracking-tight text-ink">{task.title}</h1>
            <p className="mt-2 flex items-center gap-2 text-[14.5px] text-ink/70">
              <Avatar name={task.assignee} size={26} /> {task.assignee} · due {task.date}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <PriorityBadge priority={task.priority} />
            <StatusBadge status={task.status} />
          </div>
        </div>
        <p className="mt-5 max-w-[70ch] text-[15px] leading-7 text-ink/75">{task.description}</p>
      </Card>

      <Card title={`Assignments (${assignments.length})`}
        action={
          <div className="flex items-center gap-2">
            <button onClick={openIds.size ? collapseAll : expandAll} className="rounded-lg border border-line px-3 py-1.5 text-[14px] font-semibold text-ink/65 hover:border-forest hover:text-forest">
              {openIds.size ? "Collapse all" : "Expand all"}
            </button>
            <button onClick={() => setShowForm((s) => !s)} className="rounded-lg bg-forest px-3.5 py-1.5 text-[14px] font-bold text-white hover:bg-forest-deep">
              + New
            </button>
          </div>
        }
      >
        {showForm && (
          <form onSubmit={submitNewAssignment} className="mb-5 space-y-3 rounded-2xl border border-dashed border-forest/30 bg-forest-soft/30 p-4">
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Assignment title"
              className={inputBase}
            />
            <textarea
              value={form.details}
              onChange={(e) => setForm((f) => ({ ...f, details: e.target.value }))}
              placeholder="Details for whoever picks this up…"
              rows={3}
              className={inputBase}
            />
            <div className="flex flex-wrap items-center gap-3">
              <select value={form.assignee} onChange={(e) => setForm((f) => ({ ...f, assignee: e.target.value }))} className={`${inputBase} w-auto cursor-pointer`}>
                {workspace.members.map((m) => (
                  <option key={m.id} value={m.name}>{m.name}</option>
                ))}
              </select>
              <button type="submit" className="rounded-xl bg-forest px-5 py-2.5 text-[14.5px] font-bold text-white hover:bg-forest-deep">
                Submit assignment
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="text-[14.5px] font-semibold text-ink/60 hover:text-ink">
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="mb-4 flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-full px-3.5 py-1.5 text-[14px] font-bold transition-colors ${
                filter === f.key ? "bg-forest text-white" : "bg-mist text-ink/65 hover:text-ink"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {filtered.length ? (
          <ul className="space-y-3">
            {filtered.map((a) => (
              <AssignmentItem
                key={a.id}
                item={a}
                isOpen={openIds.has(a.id)}
                isHighlighted={String(a.id) === highlightId}
                onToggleOpen={toggleOpen}
                onToggleDone={toggleDone}
                onAddComment={addComment}
                itemRef={(el) => (itemRefs.current[String(a.id)] = el)}
              />
            ))}
          </ul>
        ) : (
          <EmptyState>No assignments match this filter.</EmptyState>
        )}
      </Card>
    </div>
  );
}
