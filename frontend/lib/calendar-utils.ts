function atStartOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function atEndOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

// Monday-start week
export function startOfWeek(date: Date) {
  const d = atStartOfDay(date);
  const day = (d.getDay() + 6) % 7; // 0 = Monday
  d.setDate(d.getDate() - day);
  return d;
}

export function getWeekDays(date: Date): Date[] {
  const start = startOfWeek(date);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

// ISO 8601 week number (weeks start Monday, week 1 contains the year's
// first Thursday).
export function getISOWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const firstDayNum = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNum + 3);
  return 1 + Math.round((d.getTime() - firstThursday.getTime()) / (7 * 24 * 3600 * 1000));
}

export function getMonthWeeks(date: Date): Date[][] {
  const firstOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const gridStart = startOfWeek(firstOfMonth);
  const weeks: Date[][] = [];
  let cursor = new Date(gridStart);
  for (let w = 0; w < 6; w++) {
    const week = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(cursor);
      d.setDate(cursor.getDate() + i);
      return d;
    });
    weeks.push(week);
    cursor.setDate(cursor.getDate() + 7);
  }
  return weeks;
}

export function rangeForView(
  viewMode: "jour" | "semaine" | "mois",
  date: Date
): { start: Date; end: Date } {
  if (viewMode === "jour") {
    return { start: atStartOfDay(date), end: atEndOfDay(date) };
  }
  if (viewMode === "semaine") {
    const days = getWeekDays(date);
    return { start: atStartOfDay(days[0]), end: atEndOfDay(days[6]) };
  }
  const weeks = getMonthWeeks(date);
  const flat = weeks.flat();
  return { start: atStartOfDay(flat[0]), end: atEndOfDay(flat[flat.length - 1]) };
}

export function shiftDate(
  viewMode: "jour" | "semaine" | "mois",
  date: Date,
  direction: 1 | -1
): Date {
  const d = new Date(date);
  if (viewMode === "jour") d.setDate(d.getDate() + direction);
  else if (viewMode === "semaine") d.setDate(d.getDate() + 7 * direction);
  else d.setMonth(d.getMonth() + direction);
  return d;
}

export function formatPeriodLabel(
  viewMode: "jour" | "semaine" | "mois",
  date: Date
): string {
  if (viewMode === "jour") {
    return date.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }
  if (viewMode === "semaine") {
    const days = getWeekDays(date);
    const start = days[0];
    const end = days[6];
    const sameMonth = start.getMonth() === end.getMonth();
    const startLabel = start.toLocaleDateString("fr-FR", { day: "numeric", month: sameMonth ? undefined : "short" });
    const endLabel = end.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
    return `${startLabel} – ${endLabel}`;
  }
  return date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}
