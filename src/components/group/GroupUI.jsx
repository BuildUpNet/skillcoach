export function Card({ title, action, children, className = "" }) {
  return (
    <section className={`overflow-hidden rounded-3xl bg-white shadow-[0_2px_4px_rgba(20,26,24,.04),0_20px_40px_-28px_rgba(20,26,24,.3)] ring-1 ring-line ${className}`}>
      {(title || action) && (
        <header className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="text-[17px] font-extrabold tracking-tight text-ink">{title}</h2>
          {action}
        </header>
      )}
      <div className="p-6">{children}</div>
    </section>
  );
}

const PRIORITY_STYLES = {
  Highest: "bg-crimson/10 text-crimson",
  Normal: "bg-forest-soft text-forest",
};

const STATUS_STYLES = {
  Completed: "bg-forest-soft text-forest",
  "In progress": "bg-gold-soft text-gold-deep",
  "Not started": "bg-mist text-ink/65",
  "Not completed": "bg-gold-soft text-gold-deep",
};

export function PriorityBadge({ priority }) {
  return (
    <span className={`rounded-full px-3 py-1 text-[14px] font-bold ${PRIORITY_STYLES[priority] || "bg-mist text-ink/70"}`}>
      {priority}
    </span>
  );
}

export function StatusBadge({ status }) {
  return (
    <span className={`rounded-full px-3 py-1 text-[14px] font-bold ${STATUS_STYLES[status] || "bg-mist text-ink/70"}`}>
      {status}
    </span>
  );
}

export function RoleBadge({ role }) {
  const styles =
    role === "Owner" ? "bg-gold text-ink" : role === "Officer" ? "bg-forest text-white" : "bg-mist text-ink/70";
  return <span className={`rounded-full px-3 py-1 text-[14px] font-bold ${styles}`}>{role}</span>;
}

export function Avatar({ name, size = 44 }) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      style={{ width: size, height: size }}
      className="grid flex-none place-items-center rounded-full bg-forest-soft text-[15px] font-extrabold text-forest ring-1 ring-forest/15"
    >
      {initials}
    </div>
  );
}

export function EmptyState({ children }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-line bg-mist/60 px-6 py-10 text-center text-[15px] text-ink/65">
      {children}
    </div>
  );
}

export function StatTile({ value, label, accent = "forest" }) {
  const accents = {
    forest: "text-forest",
    gold: "text-gold-deep",
    crimson: "text-crimson",
  };
  return (
    <div className="rounded-2xl bg-white px-5 py-4 shadow-[0_2px_4px_rgba(20,26,24,.04),0_16px_36px_-24px_rgba(20,26,24,.25)] ring-1 ring-line">
      <div className={`text-[26px] font-extrabold leading-none ${accents[accent] || accents.forest}`}>{value}</div>
      <div className="mt-1.5 text-[14px] font-medium text-ink/65">{label}</div>
    </div>
  );
}
