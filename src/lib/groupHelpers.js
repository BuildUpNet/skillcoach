export function getTaskById(workspace, taskId) {
  return workspace.tasks.find((t) => String(t.id) === String(taskId)) ?? null;
}

function localISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Buckets a flat timesheet list (real ISO "date" per entry) into the same
// {Yesterday, Today, "This week", "This month"} shape the UI already expects
// — done client-side so "today"/"this week" always match the viewer's own
// clock instead of the server's.
export function bucketTimesheet(entries) {
  const now = new Date();
  const todayStr = localISODate(now);
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  const yesterdayStr = localISODate(yesterday);
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const buckets = { Yesterday: [], Today: [], "This week": [], "This month": [] };
  for (const entry of entries) {
    const entryDate = new Date(`${entry.date}T00:00:00`);
    const withLabel = { ...entry, date: entryDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }) };
    const withoutLabel = { ...entry, date: undefined };

    if (entry.date === todayStr) buckets.Today.push(withoutLabel);
    if (entry.date === yesterdayStr) buckets.Yesterday.push(withoutLabel);
    if (entryDate >= startOfWeek) buckets["This week"].push(withLabel);
    if (entryDate >= startOfMonth) buckets["This month"].push(withLabel);
  }
  return buckets;
}
