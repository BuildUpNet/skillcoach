import { useState } from "react";
import { Link, useOutletContext, useParams } from "react-router-dom";
import { Avatar, Card, PriorityBadge, StatusBadge } from "../../components/group/GroupUI";
import RichTextEditor, { sanitizeHtml } from "../../components/group/RichTextEditor";
import Icon from "../../components/group/icons";
import { createGroupTask, updateGroupTask, deleteGroupTask } from "../../lib/api";
import { useAuth } from "../../lib/AuthContext";
import { useToast } from "../../components/Toast";
import { useConfirm } from "../../components/ConfirmDialog";
const inputBase = "w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-[15px] text-ink outline-none transition-all placeholder:text-ink/45 hover:border-forest/40 focus:border-forest focus:ring-4 focus:ring-forest/10";

function emptyForm(members) {
  return { title: "", description: "", priority: "Normal", assignee: members[0]?.id ?? "" };
}

function TaskForm({ form, setForm, members, error, onSubmit, onCancel, submitLabel }) {
  return (
    <form onSubmit={onSubmit} className="mb-5 space-y-3 rounded-2xl border border-dashed border-forest/30 bg-forest-soft/30 p-4">
      {error && <p className="text-[13.5px] font-semibold text-crimson">{error}</p>}
      <input
        value={form.title}
        onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        placeholder="Task title"
        className={inputBase}
      />
      <RichTextEditor
        value={form.description}
        onChange={(html) => setForm((f) => ({ ...f, description: html }))}
        placeholder="What is this task about?"
      />
      <div className="flex flex-wrap items-center gap-3">
        <select value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))} className={`${inputBase} w-auto cursor-pointer`}>
          <option value="Normal">Normal priority</option>
          <option value="Highest">Highest priority</option>
        </select>
        <select value={form.assignee} onChange={(e) => setForm((f) => ({ ...f, assignee: e.target.value }))} className={`${inputBase} w-auto cursor-pointer`}>
          {members.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
        <button type="submit" className="rounded-xl bg-forest px-5 py-2.5 text-[14.5px] font-bold text-white hover:bg-forest-deep">
          {submitLabel}
        </button>
        <button type="button" onClick={onCancel} className="text-[14.5px] font-semibold text-ink/60 hover:text-ink">
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function GroupTasks() {
  const { groupId } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const { workspace, setWorkspace } = useOutletContext();
  const { tasks, members } = workspace;
  const isGroupOwner = members.find((m) => m.role === "Owner")?.id === user?.user_id;

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(() => emptyForm(members));
  const [createError, setCreateError] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [editError, setEditError] = useState("");

  const submitNewTask = async (e) => {
    e.preventDefault();
    if (!createForm.title.trim() || !sanitizeHtml(createForm.description).trim()) {
      setCreateError("Title and description are required.");
      return;
    }
    setCreateError("");
    try {
      const created = await createGroupTask(groupId, createForm);
      setWorkspace((prev) => ({ ...prev, tasks: [created, ...prev.tasks] }));
      setCreateForm(emptyForm(members));
      setShowCreate(false);
       toast("Task created successfully");
    } catch (err) {
      setCreateError(err.message);
    }
  };

  const startEdit = (task) => {
    setEditingId(task.id);
    setEditError("");
    setEditForm({
      title: task.title,
      description: task.description,
      priority: task.priority,
      assignee: task.assigneeId ?? members[0]?.id ?? "",
    });
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    if (!editForm.title.trim() || !sanitizeHtml(editForm.description).trim()) {
      setEditError("Title and description are required.");
      return;
    }
    setEditError("");
    try {
      const updated = await updateGroupTask(groupId, editingId, editForm);
      setWorkspace((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) => (t.id === editingId ? { ...t, ...updated } : t)),
      }));
      setEditingId(null);
      setEditForm(null);
      toast("Task updated successfully");
    } catch (err) {
      setEditError(err.message);
    }
  };

  const handleDelete = async (task) => {
    const ok = await confirm({
      title: "Delete this task?",
      message: `"${task.title}" and all its assignments, comments and hours will be removed. This can't be undone.`,
      confirmText: "Delete task",
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteGroupTask(groupId, task.id);
      setWorkspace((prev) => ({ ...prev, tasks: prev.tasks.filter((t) => t.id !== task.id) }));
      toast("Task deleted successfully");
    } catch (err) {
        toast(err.message, "error");
    }
  };

  return (
    <Card
      title={`All Tasks (${tasks.length})`}
      action={
        <button onClick={() => setShowCreate((s) => !s)} className="rounded-lg bg-forest px-3.5 py-1.5 text-[14px] font-bold text-white hover:bg-forest-deep">
          + New Task
        </button>
      }
    >
      {showCreate && (
        <TaskForm
          form={createForm}
          setForm={setCreateForm}
          members={members}
          error={createError}
          onSubmit={submitNewTask}
          onCancel={() => setShowCreate(false)}
          submitLabel="Create task"
        />
      )}

      {editingId != null && editForm && (
        <TaskForm
          key={editingId}
          form={editForm}
          setForm={setEditForm}
          members={members}
          error={editError}
          onSubmit={submitEdit}
          onCancel={() => setEditingId(null)}
          submitLabel="Save changes"
        />
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-separate border-spacing-y-2.5 text-left">
          <thead>
            <tr className="text-[12.5px] uppercase tracking-wider text-ink/45">
              <th className="px-4 pb-1 font-bold">Task</th>
              <th className="px-4 pb-1 font-bold">Assignee</th>
              <th className="px-4 pb-1 font-bold">Due</th>
              <th className="px-4 pb-1 font-bold">Priority</th>
              <th className="px-4 pb-1 font-bold">Status</th>
              <th className="px-4 pb-1 font-bold"></th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((t) => (
              <tr key={t.id} className="rounded-xl bg-mist/50 transition-colors hover:bg-forest-soft/60">
                <td className="rounded-l-xl px-4 py-3.5">
                  <Link to={`/projects/${groupId}/tasks/${t.id}`} className="text-[15px] font-semibold text-ink hover:text-forest hover:underline">
                    {t.title}
                  </Link>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <Avatar name={t.assignee} size={28} />
                    <span className="text-[14px] font-medium text-ink/80">{t.assignee}</span>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-[14px] italic text-ink/55">{t.date}</td>
                <td className="px-4 py-3.5"><PriorityBadge priority={t.priority} /></td>
                <td className="px-4 py-3.5"><StatusBadge status={t.status} /></td>
                <td className="rounded-r-xl px-4 py-3.5 text-right">
                  <div className="inline-flex items-center gap-1.5">
                    {t.creatorId === user?.user_id && (
                      <button
                        onClick={() => startEdit(t)}
                        title="Edit task"
                        className="inline-flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-[13px] font-semibold text-ink/60 hover:border-forest hover:text-forest"
                      >
                        <Icon name="clipboard" className="h-3.5 w-3.5" /> Edit
                      </button>
                    )}
                    {(t.creatorId === user?.user_id || isGroupOwner) && (
                      <button
                        onClick={() => handleDelete(t)}
                        title="Delete task"
                        className="inline-flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-[13px] font-semibold text-ink/60 hover:border-crimson/40 hover:text-crimson"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
