import { useEffect, useState } from "react";
import { FiPlus, FiTrash2, FiAlertTriangle } from "react-icons/fi";
import { getAdminSettings, setAdminSetting, deleteAdminSetting } from "../../lib/api";

function SettingRow({ setting, onSaved }) {
  const [value, setValue] = useState(setting.value);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const dirty = value !== setting.value;

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      await setAdminSetting(setting.name, value);
      onSaved();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!confirm(`Delete setting "${setting.name}"?`)) return;
    await deleteAdminSetting(setting.name);
    onSaved();
  };

  return (
    <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate font-mono text-[13px] font-bold text-ink">{setting.name}</p>
        <button onClick={remove} className="shrink-0 text-ink/40 hover:text-crimson"><FiTrash2 size={14} /></button>
      </div>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={2}
        className="mt-2 w-full rounded-xl border border-line bg-mist/60 px-3 py-2 font-mono text-[13px] text-ink outline-none focus:border-forest focus:ring-2 focus:ring-forest/15"
      />
      {error && <p className="mt-1 text-[13px] font-medium text-crimson">{error}</p>}
      {dirty && (
        <button onClick={save} disabled={saving} className="mt-2 rounded-full bg-forest px-3.5 py-1.5 text-[13px] font-semibold text-white hover:bg-forest-deep disabled:opacity-60">
          {saving ? "Saving…" : "Save"}
        </button>
      )}
    </div>
  );
}

export default function AdminSettings() {
  const [settings, setSettings] = useState(null);
  const [error, setError] = useState("");
  const [newName, setNewName] = useState("");
  const [newValue, setNewValue] = useState("");
  const [creating, setCreating] = useState(false);

  const load = () => getAdminSettings().then(setSettings).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await setAdminSetting(newName.trim(), newValue);
      setNewName("");
      setNewValue("");
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-2xl border border-gold/40 bg-gold-soft p-4 text-[13px] text-ink/70">
        <FiAlertTriangle className="mt-0.5 shrink-0 text-gold-deep" />
        <p>
          Many of these values are stored exactly as the legacy PHP app wrote them (some are
          PHP-serialized arrays, not plain text). Only edit a value if you're sure what it does —
          saving malformed data can break the setting it belongs to. The password-hashing secret
          is hidden here on purpose and can't be changed from this page.
        </p>
      </div>

      {error && <p className="text-[14px] font-medium text-crimson">{error}</p>}

      <form onSubmit={handleCreate} className="rounded-2xl border border-line bg-white p-4 shadow-sm">
        <h3 className="text-[14px] font-bold text-ink">Add a setting</h3>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="setting.name"
            className="w-full rounded-xl border border-line bg-mist/60 px-3.5 py-2 font-mono text-[13px] text-ink outline-none focus:border-forest focus:ring-2 focus:ring-forest/15 sm:w-56"
          />
          <input
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            placeholder="value"
            className="w-full flex-1 rounded-xl border border-line bg-mist/60 px-3.5 py-2 font-mono text-[13px] text-ink outline-none focus:border-forest focus:ring-2 focus:ring-forest/15"
          />
          <button type="submit" disabled={creating} className="inline-flex items-center justify-center gap-1 rounded-xl bg-gold px-4 py-2 text-[13px] font-bold text-ink hover:bg-gold-deep hover:text-white disabled:opacity-60">
            <FiPlus /> Add
          </button>
        </div>
      </form>

      {!settings ? (
        <p className="text-[14px] text-ink/60">Loading settings…</p>
      ) : settings.length === 0 ? (
        <div className="rounded-2xl border border-line bg-white p-8 text-center text-[14px] text-ink/60">
          No settings stored yet.
        </div>
      ) : (
        <div className="space-y-3">
          {settings.map((s) => (
            <SettingRow key={s.name} setting={s} onSaved={load} />
          ))}
        </div>
      )}
    </div>
  );
}
