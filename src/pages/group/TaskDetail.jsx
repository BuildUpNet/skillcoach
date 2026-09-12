import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useOutletContext, useParams, useSearchParams } from "react-router-dom";
import { getTaskById } from "../../lib/groupHelpers";
import { useToast } from "../../components/Toast";
import { useConfirm } from "../../components/ConfirmDialog";
import {
  createAssignment,
  toggleAssignmentDone,
  addAssignmentComment,
  addAssignmentHours,
  toggleTaskDone,
  addTaskComment,
  deleteGroupTask,
  deleteTaskComment,
  deleteAssignment,
  deleteAssignmentComment,
} from "../../lib/api";
import { useAuth } from "../../lib/AuthContext";
import { Avatar, Card, EmptyState, PriorityBadge, StatusBadge } from "../../components/group/GroupUI";
import RichTextEditor, { sanitizeHtml } from "../../components/group/RichTextEditor";
import Icon from "../../components/group/icons";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "open", label: "Not finished" },
  { key: "done", label: "Finished" },
];

const inputBase = "w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-[15px] text-ink outline-none transition-all placeholder:text-ink/45 hover:border-forest/40 focus:border-forest focus:ring-4 focus:ring-forest/10";

// Removes a comment by id from a comments list — matches either a top-level
// comment or one of its replies (the delete-comment endpoint works on both).
function removeCommentById(comments, commentId) {
  return comments
    .filter((c) => c.id !== commentId)
    .map((c) => ({ ...c, replies: (c.replies || []).filter((r) => r.id !== commentId) }));
}

function CommentReplyForm({ onSubmit, placeholder, autoFocus }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    setError("");
    try {
      await onSubmit(text.trim());
      setText("");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-2 flex gap-2">
      <input
        autoFocus={autoFocus}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        className={inputBase}
      />
      <button type="submit" disabled={busy} className="flex-none rounded-xl bg-forest px-4 py-2 text-[14px] font-bold text-white hover:bg-forest-deep disabled:opacity-60">
        Post
      </button>
      {error && <p className="self-center text-[13px] font-semibold text-crimson">{error}</p>}
    </form>
  );
}

// Comment list (with one level of threaded replies) + the "add a comment"
// box — shared between a task's own comments and an assignment's comments.
// canDelete(comment) decides whether the delete link shows for that comment.
function CommentThread({ comments, onAddComment, onDeleteComment, canDelete }) {
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);

  const submitComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setBusy(true);
    setError("");
    try {
      await onAddComment(comment.trim());
      setComment("");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl bg-mist/50 p-3.5">
      <p className="mb-2.5 text-[14px] font-bold uppercase tracking-wider text-ink/60">Comments ({comments.length})</p>
      {error && <p className="mb-2 text-[13.5px] font-semibold text-crimson">{error}</p>}
      {comments.length ? (
        <ul className="space-y-2.5">
          {comments.map((c) => (
            <li key={c.id} className="rounded-lg bg-white px-3 py-2.5 ring-1 ring-line">
              <div className="flex items-center gap-2">
                <Avatar name={c.author} size={22} />
                <span className="text-[14px] font-bold text-ink">{c.author}</span>
                <span className="text-[14px] italic text-ink/55">{c.date}</span>
              </div>
              <p className="mt-1 text-[14.5px] text-ink/80">{c.text}</p>
              <div className="mt-1.5 flex items-center gap-3">
                <button
                  onClick={() => setReplyingTo((prev) => (prev === c.id ? null : c.id))}
                  className="text-[13px] font-semibold text-forest hover:underline"
                >
                  {replyingTo === c.id ? "Cancel" : "Reply"}
                </button>
                {canDelete?.(c) && (
                  <button onClick={() => onDeleteComment(c.id)} className="text-[13px] font-semibold text-ink/50 hover:text-crimson">
                    Delete
                  </button>
                )}
              </div>

              {(c.replies?.length ?? 0) > 0 && (
                <ul className="mt-2.5 space-y-2 border-l-2 border-line pl-3">
                  {c.replies.map((r) => (
                    <li key={r.id}>
                      <div className="flex items-center gap-2">
                        <Avatar name={r.author} size={20} />
                        <span className="text-[13.5px] font-bold text-ink">{r.author}</span>
                        <span className="text-[13px] italic text-ink/55">{r.date}</span>
                      </div>
                      <p className="mt-0.5 text-[14px] text-ink/80">{r.text}</p>
                      {canDelete?.(r) && (
                        <button onClick={() => onDeleteComment(r.id)} className="mt-0.5 text-[13px] font-semibold text-ink/50 hover:text-crimson">
                          Delete
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {replyingTo === c.id && (
                <div className="mt-2 border-l-2 border-line pl-3">
                  <CommentReplyForm
                    autoFocus
                    placeholder={`Reply to ${c.author}…`}
                    onSubmit={async (text) => {
                      await onAddComment(text, c.id);
                      setReplyingTo(null);
                    }}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[14px] text-ink/60">No comments.</p>
      )}
      <form onSubmit={submitComment} className="mt-2.5 flex gap-2">
        <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a comment…" className={inputBase} />
        <button type="submit" disabled={busy} className="flex-none rounded-xl bg-forest px-4 py-2 text-[14px] font-bold text-white hover:bg-forest-deep disabled:opacity-60">
          Post
        </button>
      </form>
    </div>
  );
}

function AssignmentItem({ item, isOpen, isHighlighted, canToggleDone, canManage, currentUserId, onToggleOpen, onToggleDone, onAddComment, onDeleteComment, onAddHours, onDelete, itemRef }) {
  const [hoursForm, setHoursForm] = useState({ hours: "", note: "" });
  const [hoursError, setHoursError] = useState("");
  const [hoursBusy, setHoursBusy] = useState(false);

  const submitHours = async (e) => {
    e.preventDefault();
    const hoursNum = Number(hoursForm.hours);
    if (!hoursNum || hoursNum <= 0) {
      setHoursError("Enter hours greater than 0.");
      return;
    }
    setHoursBusy(true);
    setHoursError("");
    try {
      await onAddHours(item.id, { hours: hoursNum, note: hoursForm.note.trim() });
      setHoursForm({ hours: "", note: "" });
    } catch (err) {
      setHoursError(err.message);
    } finally {
      setHoursBusy(false);
    }
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
          disabled={!canToggleDone}
          onClick={(e) => {
            e.stopPropagation();
            onToggleDone(item.id);
          }}
          title={
            !canToggleDone
              ? "Only the person this is assigned to can mark it done"
              : item.done ? "Mark not finished" : "Mark finished"
          }
          className={`grid h-6 w-6 flex-none place-items-center rounded-md ${item.done ? "bg-forest text-white" : "bg-crimson/15 text-crimson"} ${canToggleDone ? "hover:bg-crimson/25 cursor-pointer" : "cursor-not-allowed opacity-70"}`}
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
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div
              className="min-w-0 max-w-full text-[15px] leading-6 text-ink/80 sm:max-w-[70ch] [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_img]:my-2 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-xl"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.details) }}
            />
            <div className="flex flex-none items-center gap-2">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-[14px] font-semibold text-ink/65 hover:border-forest hover:text-forest"
              >
                <Icon name="clipboard" className="h-3.5 w-3.5" /> Export
              </button>
              {canManage && (
                <button
                  onClick={() => onDelete(item.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-[14px] font-semibold text-ink/65 hover:border-crimson/40 hover:text-crimson"
                >
                  Delete
                </button>
              )}
            </div>
          </div>

          <CommentThread
            comments={item.comments}
            onAddComment={(text, parentId) => onAddComment(item.id, text, parentId)}
            onDeleteComment={(commentId) => onDeleteComment(item.id, commentId)}
            canDelete={(c) => canManage || c.authorId === currentUserId}
          />

          <div className="rounded-xl bg-forest-soft/50 p-3.5">
            <p className="mb-2.5 text-[14px] font-bold uppercase tracking-wider text-forest">Worked hours</p>
            {hoursError && <p className="mb-2 text-[13.5px] font-semibold text-crimson">{hoursError}</p>}
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
            <form onSubmit={submitHours} className="mt-2.5 flex flex-wrap gap-2">
              <input
                type="number"
                min="0.25"
                step="0.25"
                value={hoursForm.hours}
                onChange={(e) => setHoursForm((f) => ({ ...f, hours: e.target.value }))}
                placeholder="Hours"
                className={`${inputBase} w-24`}
              />
              <input
                value={hoursForm.note}
                onChange={(e) => setHoursForm((f) => ({ ...f, note: e.target.value }))}
                placeholder="What did you work on?"
                className={`${inputBase} flex-1`}
              />
              <button type="submit" disabled={hoursBusy} className="flex-none rounded-xl bg-forest px-4 py-2 text-[14px] font-bold text-white hover:bg-forest-deep disabled:opacity-60">
                Add hours
              </button>
            </form>
          </div>
        </div>
      )}
    </li>
  );
}

export default function TaskDetail() {
  const { groupId, taskId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const { workspace, setWorkspace } = useOutletContext();
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get("assignment");

  const task = getTaskById(workspace, taskId);
  const isGroupOwner = workspace.members.find((m) => m.role === "Owner")?.id === user?.user_id;
  const canManageTask = task ? task.creatorId === user?.user_id || isGroupOwner : false;
  const [openIds, setOpenIds] = useState(() => new Set(highlightId ? [Number(highlightId)] : []));
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({ title: "", assignee: workspace.members[0]?.id ?? "", details: "" });
  const itemRefs = useRef({});

  useEffect(() => {
    setOpenIds(new Set(highlightId ? [Number(highlightId)] : []));
    setForm({ title: "", assignee: workspace.members[0]?.id ?? "", details: "" });
    setShowForm(false);
    setFormError("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  useEffect(() => {
    if (highlightId && itemRefs.current[highlightId]) {
      itemRefs.current[highlightId].scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlightId, task]);

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

  const patchTask = (patch) => {
    setWorkspace((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === task.id ? { ...t, ...patch(t) } : t)),
    }));
  };

  const patchAssignment = (assignmentId, patch) => {
    setWorkspace((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id !== task.id
          ? t
          : { ...t, assignments: t.assignments.map((a) => (a.id === assignmentId ? { ...a, ...patch(a) } : a)) }
      ),
    }));
  };

  const toggleOpen = (id) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const canToggleTaskDone = task.assigneeId === user?.user_id;

  const toggleTaskDoneHandler = async () => {
    const nextDone = !task.done;
    const ok = await confirm({
      title: nextDone ? "Mark task as finished?" : "Mark task as not finished?",
      message: `"${task.title}" will be updated for everyone in the group.`,
      confirmText: nextDone ? "Mark finished" : "Mark not finished",
    });
    if (!ok) return;

    patchTask(() => ({ done: nextDone })); // optimistic
    try {
      await toggleTaskDone(groupId, task.id, nextDone);
      toast(nextDone ? "Task marked as finished" : "Task marked as not finished");
    } catch (err) {
      patchTask(() => ({ done: !nextDone })); // revert on failure
      toast(err.message, "error");
    }
  };

  const addTaskCommentHandler = async (text, parentId = 0) => {
    const created = await addTaskComment(groupId, task.id, { text, parentId });
    if (!parentId) {
      patchTask((t) => ({ comments: [...t.comments, { ...created, replies: [] }] }));
    } else {
      patchTask((t) => ({
        comments: t.comments.map((c) => (c.id === parentId ? { ...c, replies: [...(c.replies || []), created] } : c)),
      }));
    }
    toast(parentId ? "Reply posted" : "Comment posted");
  };

  const deleteTaskCommentHandler = async (commentId) => {
    const ok = await confirm({
      title: "Delete this comment?",
      message: "Replies to it will be removed as well.",
      confirmText: "Delete comment",
      danger: true,
    });
    if (!ok) return;
    await deleteTaskComment(groupId, task.id, commentId);
    patchTask((t) => ({ comments: removeCommentById(t.comments, commentId) }));
    toast("Comment deleted");
  };

  const deleteTaskHandler = async () => {
    const ok = await confirm({
      title: "Delete this task?",
      message: `"${task.title}" and all its assignments, comments and hours will be removed. This can't be undone.`,
      confirmText: "Delete task",
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteGroupTask(groupId, task.id);
      toast("Task deleted successfully");
      navigate(`/projects/${groupId}/tasks`);
    } catch (err) {
      toast(err.message, "error");
    }
  };

  const deleteAssignmentHandler = async (assignmentId) => {
    const current = task.assignments.find((a) => a.id === assignmentId);
    const ok = await confirm({
      title: "Delete this assignment?",
      message: `"${current?.title ?? "This assignment"}" and its comments and hours will be removed. This can't be undone.`,
      confirmText: "Delete assignment",
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteAssignment(groupId, task.id, assignmentId);
      setWorkspace((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id !== task.id ? t : { ...t, assignments: t.assignments.filter((a) => a.id !== assignmentId) }
        ),
      }));
      toast("Assignment deleted successfully");
    } catch (err) {
      toast(err.message, "error");
    }
  };

  const deleteAssignmentCommentHandler = async (assignmentId, commentId) => {
    const ok = await confirm({
      title: "Delete this comment?",
      message: "Replies to it will be removed as well.",
      confirmText: "Delete comment",
      danger: true,
    });
    if (!ok) return;
    await deleteAssignmentComment(groupId, task.id, assignmentId, commentId);
    patchAssignment(assignmentId, (a) => ({ comments: removeCommentById(a.comments, commentId) }));
    toast("Comment deleted");
  };

  const toggleDone = async (id) => {
    const current = task.assignments.find((a) => a.id === id);
    const nextDone = !current?.done;
    const ok = await confirm({
      title: nextDone ? "Mark assignment as finished?" : "Mark assignment as not finished?",
      message: `"${current?.title}" will be updated for everyone in the group.`,
      confirmText: nextDone ? "Mark finished" : "Mark not finished",
    });
    if (!ok) return;

    patchAssignment(id, () => ({ done: nextDone })); // optimistic
    try {
      await toggleAssignmentDone(groupId, task.id, id, nextDone);
      toast(nextDone ? "Assignment marked as finished" : "Assignment marked as not finished");
    } catch (err) {
      patchAssignment(id, () => ({ done: !nextDone })); // revert on failure
      toast(err.message, "error");
    }
  };

  const addComment = async (id, text, parentId = 0) => {
    const created = await addAssignmentComment(groupId, task.id, id, { text, parentId });
    if (!parentId) {
      patchAssignment(id, (a) => ({ comments: [...a.comments, { ...created, replies: [] }] }));
    } else {
      patchAssignment(id, (a) => ({
        comments: a.comments.map((c) => (c.id === parentId ? { ...c, replies: [...(c.replies || []), created] } : c)),
      }));
    }
     toast(parentId ? "Reply posted" : "Comment posted");
  };

  const addHours = async (id, data) => {
    const created = await addAssignmentHours(groupId, task.id, id, data);
    patchAssignment(id, (a) => ({ workedHours: [...a.workedHours, created] }));
  };

  const collapseAll = () => setOpenIds(new Set());
  const expandAll = () => setOpenIds(new Set(filtered.map((a) => a.id)));

  const filtered = task.assignments.filter((a) => (filter === "done" ? a.done : filter === "open" ? !a.done : true));

  const submitNewAssignment = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    if (!form.assignee) {
      setFormError("Choose an assignee.");
      return;
    }
    setFormError("");
    try {
      const created = await createAssignment(groupId, task.id, {
        title: form.title.trim(),
        assignee: form.assignee,
        details: form.details,
      });
      setWorkspace((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) => (t.id === task.id ? { ...t, assignments: [created, ...t.assignments] } : t)),
      }));
      setForm({ title: "", assignee: workspace.members[0]?.id ?? "", details: "" });
      setShowForm(false);
       toast("Assignment created successfully");
    } catch (err) {
      setFormError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <Link to={`/projects/${groupId}/tasks`} className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-ink/65 hover:text-forest">
        <Icon name="back" className="h-4 w-4" /> All tasks
      </Link>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <button
              type="button"
              disabled={!canToggleTaskDone}
              onClick={toggleTaskDoneHandler}
              title={
                !canToggleTaskDone
                  ? "Only the person this task is assigned to can mark it done"
                  : task.done ? "Mark not finished" : "Mark finished"
              }
              className={`mt-1 grid h-7 w-7 flex-none place-items-center rounded-md ${task.done ? "bg-forest text-white" : "bg-crimson/15 text-crimson"} ${canToggleTaskDone ? "hover:bg-crimson/25 cursor-pointer" : "cursor-not-allowed opacity-70"}`}
            >
              {task.done && <Icon name="check" className="h-4 w-4" />}
            </button>
            <div>
              <h1 className={`text-[24px] font-extrabold leading-tight tracking-tight ${task.done ? "text-ink/55 line-through" : "text-ink"}`}>{task.title}</h1>
              <p className="mt-2 flex items-center gap-2 text-[14.5px] text-ink/70">
                <Avatar name={task.assignee} size={26} /> {task.assignee} · due {task.date}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <PriorityBadge priority={task.priority} />
            <StatusBadge status={task.status} />
            {canManageTask && (
              <button
                onClick={deleteTaskHandler}
                title="Delete task"
                className="rounded-lg border border-line px-3 py-1.5 text-[14px] font-semibold text-ink/65 hover:border-crimson/40 hover:text-crimson"
              >
                Delete
              </button>
            )}
          </div>
        </div>
        <div
          className="mt-5 max-w-full text-[15px] leading-7 text-ink/75 sm:max-w-[70ch] [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_img]:my-2 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-xl"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(task.description) }}
        />
      </Card>

      <Card>
        <CommentThread
          comments={task.comments}
          onAddComment={addTaskCommentHandler}
          onDeleteComment={deleteTaskCommentHandler}
          canDelete={(c) => canManageTask || c.authorId === user?.user_id}
        />
      </Card>

      <Card title={`Assignments (${task.assignments.length})`}
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
            {formError && <p className="text-[13.5px] font-semibold text-crimson">{formError}</p>}
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Assignment title"
              className={inputBase}
            />
            <RichTextEditor
              value={form.details}
              onChange={(html) => setForm((f) => ({ ...f, details: html }))}
              placeholder="Details for whoever picks this up…"
            />
            <div className="flex flex-wrap items-center gap-3">
              <select value={form.assignee} onChange={(e) => setForm((f) => ({ ...f, assignee: e.target.value }))} className={`${inputBase} w-auto cursor-pointer`}>
                {workspace.members.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
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
                canToggleDone={a.assigneeId === user?.user_id}
                canManage={canManageTask}
                currentUserId={user?.user_id}
                onToggleOpen={toggleOpen}
                onToggleDone={toggleDone}
                onAddComment={addComment}
                onDeleteComment={deleteAssignmentCommentHandler}
                onAddHours={addHours}
                onDelete={deleteAssignmentHandler}
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
