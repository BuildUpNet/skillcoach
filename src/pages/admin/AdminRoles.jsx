import { useEffect, useState } from "react";
import { FiEdit2, FiTrash2, FiCheckCircle, FiPlus, FiLock } from "react-icons/fi";
import {
  getAdminLevels,
  createAdminLevel,
  updateAdminLevel,
  deleteAdminLevel,
  setDefaultLevel,
} from "../../lib/api";

const TYPES = ["public", "user", "moderator", "admin"];

const FLAG_LABEL = {
  superadmin: "System · Admin",
  default: "Default signup role",
  public: "System · Guest",
};

function RoleForm({ initial, onCancel, onSubmit, saving, lockType }) {
  const [title, setTitle] = useState(initial?.title || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [type, setType] = useState(initial?.type || "user");
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return setError("Title is required");
    setError("");
    try {
      await onSubmit({ title, description, type });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3 rounded-2xl border border-line bg-mist/60 p-4">
      {error && <p className="text-[13px] font-medium text-crimson">{error}</p>}
      <div>
        <label className="mb-1 block text-xs font-semibold text-ink/70">Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-[14px] text-ink outline-none focus:border-forest focus:ring-2 focus:ring-forest/15"
          placeholder="e.g. Content Reviewer"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-ink/70">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-[14px] text-ink outline-none focus:border-forest focus:ring-2 focus:ring-forest/15"
          placeholder="What can this role do?"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-ink/70">Type</label>
        <select
          value={type}
          disabled={lockType}
          onChange={(e) => setType(e.target.value)}
          className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-[14px] text-ink outline-none focus:border-forest focus:ring-2 focus:ring-forest/15 disabled:bg-line/40 disabled:text-ink/50"
        >
          {TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        {lockType && (
          <p className="mt-1 text-[12px] text-ink/50">System role — type is fixed to keep admin checks working.</p>
        )}
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onCancel} className="rounded-full px-4 py-2 text-[14px] font-semibold text-ink/60 hover:bg-line/50">
          Cancel
        </button>
        <button type="submit" disabled={saving} className="rounded-full bg-forest px-4 py-2 text-[14px] font-semibold text-white hover:bg-forest-deep disabled:opacity-60">
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}

export default function AdminRoles() {
  const [levels, setLevels] = useState(null);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const load = () => getAdminLevels().then(setLevels).catch((e) => setError(e.message));

  useEffect(() => { load(); }, []);

  if (error) return <p className="text-[14px] font-medium text-crimson">{error}</p>;
  if (!levels) return <p className="text-[14px] text-ink/60">Loading roles…</p>;

  const handleUpdate = async (id, data) => {
    setBusyId(id);
    try {
      await updateAdminLevel(id, data);
      setEditingId(null);
      await load();
    } finally {
      setBusyId(null);
    }
  };

  const handleCreate = async (data) => {
    setBusyId("new");
    try {
      await createAdminLevel(data);
      setCreating(false);
      await load();
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this role? Users must already be reassigned.")) return;
    setBusyId(id);
    try {
      await deleteAdminLevel(id);
      await load();
    } catch (e) {
      alert(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleSetDefault = async (id) => {
    setBusyId(id);
    try {
      await setDefaultLevel(id);
      await load();
    } catch (e) {
      alert(e.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[14px] text-ink/60">
          {levels.length} role{levels.length === 1 ? "" : "s"} — the role a user holds decides what they can see and do.
        </p>
        {!creating && (
          <button
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-gold px-4 py-2 text-[14px] font-bold text-ink hover:bg-gold-deep hover:text-white"
          >
            <FiPlus /> New role
          </button>
        )}
      </div>

      {creating && (
        <RoleForm
          saving={busyId === "new"}
          onCancel={() => setCreating(false)}
          onSubmit={handleCreate}
        />
      )}

      <div className="space-y-3">
        {levels.map((level) => {
          const isSystem = !!level.flag;
          const isEditing = editingId === level.level_id;
          return (
            <div key={level.level_id} className="rounded-2xl border border-line bg-white p-4 shadow-sm sm:p-5">
              {isEditing ? (
                <RoleForm
                  initial={level}
                  lockType={isSystem}
                  saving={busyId === level.level_id}
                  onCancel={() => setEditingId(null)}
                  onSubmit={(data) => handleUpdate(level.level_id, data)}
                />
              ) : (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-[16px] font-bold text-ink">{level.title}</h3>
                      <span className="rounded-full bg-forest-soft px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-forest">
                        {level.type}
                      </span>
                      {level.flag && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gold-soft px-2.5 py-0.5 text-[11px] font-bold text-gold-deep">
                          <FiLock size={11} /> {FLAG_LABEL[level.flag]}
                        </span>
                      )}
                    </div>
                    {level.description && (
                      <p className="mt-1.5 text-[14px] text-ink/60">{level.description}</p>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {level.flag !== "default" && level.flag !== "superadmin" && level.flag !== "public" && (
                      <button
                        onClick={() => handleSetDefault(level.level_id)}
                        disabled={busyId === level.level_id}
                        title="Make this the role new signups get"
                        className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1.5 text-[13px] font-semibold text-ink/70 hover:border-forest hover:text-forest disabled:opacity-50"
                      >
                        <FiCheckCircle /> Set as default
                      </button>
                    )}
                    <button
                      onClick={() => setEditingId(level.level_id)}
                      className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1.5 text-[13px] font-semibold text-ink/70 hover:border-forest hover:text-forest"
                    >
                      <FiEdit2 /> Edit
                    </button>
                    {!isSystem && (
                      <button
                        onClick={() => handleDelete(level.level_id)}
                        disabled={busyId === level.level_id}
                        className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1.5 text-[13px] font-semibold text-crimson hover:bg-crimson/5 disabled:opacity-50"
                      >
                        <FiTrash2 /> Delete
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
