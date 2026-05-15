export function toDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function isToday(dateKey: string | null): boolean {
  if (!dateKey) return false;
  return dateKey.slice(0, 10) === toDateKey();
}

export function isOverdue(dateKey: string | null): boolean {
  if (!dateKey) return false;
  return dateKey.slice(0, 10) < toDateKey();
}

export function formatDueLabel(dateKey: string | null): string {
  if (!dateKey) return "";
  const key = dateKey.slice(0, 10);
  if (key === toDateKey()) return "Today";
  if (isOverdue(dateKey)) return "Overdue";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(parseDateKey(key));
}

export function greetingForHour(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
