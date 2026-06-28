import type { ContribDay } from "./types";

// Scope used by the "Create card" modal: either a 4-digit year ("2025") or the
// special "all" value meaning all tracked history.
export const ALL_TIME = "all";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export interface YearStats {
  year: string; // "all" | "2025"
  label: string; // "All time" | "2025"
  isAll: boolean;
  isCurrentYear: boolean;
  days: ContribDay[]; // days within scope, chronological (for the heatmap)
  total: number; // contributions within scope
  activeDays: number; // days with count > 0
  trackedDays: number; // calendar days within scope
  activePct: number; // activeDays / trackedDays (the "streak rate")
  longestStreak: number; // biggest consecutive run within scope
  longestStart: string | null;
  longestEnd: string | null;
  currentStreak: number; // live streak ending today (0 for past years)
  busiestDay: ContribDay | null;
  bestMonth: { label: string; count: number } | null;
  avgPerActiveDay: number;
}

// Available years present in the data, newest first.
export function availableYears(days: ContribDay[]): string[] {
  const set = new Set<string>();
  for (const d of days) set.add(d.date.slice(0, 4));
  return [...set].sort((a, b) => b.localeCompare(a));
}

// Live streak: the run of active days ending at today (today not yet being
// active doesn't break it). Mirrors lib/cards/streak.ts.
function currentStreakOf(days: ContribDay[]): number {
  if (!days.length) return 0;
  const todayStr = new Date().toISOString().slice(0, 10);
  let i = days.length - 1;
  while (i >= 0 && days[i].date > todayStr) i--;
  let len = 0;
  for (; i >= 0; i--) {
    if (days[i].count > 0) len++;
    else if (len === 0 && days[i].date === todayStr) continue;
    else break;
  }
  return len;
}

export function computeYearStats(allDays: ContribDay[], year: string): YearStats {
  const isAll = year === ALL_TIME;
  const days = isAll ? allDays : allDays.filter((d) => d.date.startsWith(year));
  const currentYear = new Date().toISOString().slice(0, 4);
  const isCurrentYear = isAll || year === currentYear;

  let total = 0;
  let activeDays = 0;
  let longestStreak = 0;
  let longestStart: string | null = null;
  let longestEnd: string | null = null;
  let runLen = 0;
  let runStart: string | null = null;
  let busiestDay: ContribDay | null = null;
  const monthTotals = new Map<string, number>(); // "YYYY-MM" -> contributions

  for (const d of days) {
    total += d.count;
    if (d.count > 0) {
      activeDays++;
      if (runLen === 0) runStart = d.date;
      runLen++;
      if (runLen > longestStreak) {
        longestStreak = runLen;
        longestStart = runStart;
        longestEnd = d.date;
      }
      if (!busiestDay || d.count > busiestDay.count) busiestDay = d;
      const ym = d.date.slice(0, 7);
      monthTotals.set(ym, (monthTotals.get(ym) ?? 0) + d.count);
    } else {
      runLen = 0;
    }
  }

  let bestMonth: { label: string; count: number } | null = null;
  for (const [ym, count] of monthTotals) {
    if (!bestMonth || count > bestMonth.count) {
      const m = Number(ym.slice(5, 7)) - 1;
      const suffix = isAll ? ` ${ym.slice(0, 4)}` : "";
      bestMonth = { label: `${MONTHS[m] ?? ""}${suffix}`, count };
    }
  }

  const trackedDays = days.length;
  const activePct = trackedDays > 0 ? Math.round((activeDays / trackedDays) * 100) : 0;

  return {
    year,
    label: isAll ? "All time" : year,
    isAll,
    isCurrentYear,
    days,
    total,
    activeDays,
    trackedDays,
    activePct,
    longestStreak,
    longestStart,
    longestEnd,
    // "Current streak" is inherently anchored to today, so derive it from the
    // full history rather than just the year slice — otherwise a streak running
    // across Jan 1 would be undercounted. Only surfaced for the current year.
    currentStreak: isCurrentYear ? currentStreakOf(allDays) : 0,
    busiestDay,
    bestMonth,
    avgPerActiveDay: activeDays > 0 ? Math.round(total / activeDays) : 0,
  };
}
