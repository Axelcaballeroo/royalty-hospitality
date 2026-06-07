export const employeeStatuses = ["active", "inactive", "suspended"];
export const shiftStatuses = ["scheduled", "completed", "missed", "cancelled"];

export function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

export function getWeekStartIso() {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 6 : day - 1;
  now.setDate(now.getDate() - diff);
  now.setHours(0, 0, 0, 0);
  return now.toISOString();
}

export function estimateWorkedHours(entry: {
  clock_in: string;
  clock_out: string | null;
  break_start?: string | null;
  break_end?: string | null;
}) {
  const start = new Date(entry.clock_in).getTime();
  const end = entry.clock_out ? new Date(entry.clock_out).getTime() : Date.now();
  const breakStart = entry.break_start ? new Date(entry.break_start).getTime() : null;
  const breakEnd = entry.break_end ? new Date(entry.break_end).getTime() : null;
  const breakMs = breakStart ? (breakEnd ?? Date.now()) - breakStart : 0;
  const activeMs = Math.max(0, end - start - Math.max(0, breakMs));

  return Math.round((activeMs / 36_000) ) / 100;
}

export function formatHours(hours: number) {
  return `${hours.toFixed(1)} h`;
}
