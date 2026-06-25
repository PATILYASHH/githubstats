// Contribution data for games. Reuses the same free, no-auth calendar API the
// rest of the app uses, so games need no GitHub token.

const CONTRIB_API = "https://github-contributions-api.jogruber.de/v4";

export interface Day {
  date: string; // YYYY-MM-DD
  count: number;
}

interface ContribResponse {
  total: Record<string, number>;
  contributions: { date: string; count: number }[];
}

export function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

// Fetch a user's full daily contribution history, sorted ascending and trimmed
// to today (the API pads the rest of the current year with empty future days).
export async function fetchDays(login: string): Promise<Day[]> {
  const res = await fetch(`${CONTRIB_API}/${encodeURIComponent(login)}?y=all`, {
    // Cache briefly so a leaderboard refresh of many users isn't hammered.
    next: { revalidate: 60 * 15 },
  });
  if (!res.ok) {
    throw new Error(`Contribution API returned ${res.status} for ${login}`);
  }
  const json: ContribResponse = await res.json();
  const today = todayUTC();
  return json.contributions
    .map((c) => ({ date: c.date, count: c.count }))
    .filter((d) => d.date <= today)
    .sort((a, b) => a.date.localeCompare(b.date));
}

// Current and longest consecutive-day streaks. Today counts if non-empty; an
// empty today does not break the streak (the day isn't over yet).
export function computeStreaks(days: Day[]): {
  current: number;
  longest: number;
} {
  let longest = 0;
  let run = 0;
  for (const d of days) {
    if (d.count > 0) {
      run++;
      if (run > longest) longest = run;
    } else {
      run = 0;
    }
  }

  const today = todayUTC();
  let i = days.length - 1;
  while (i >= 0 && days[i].date > today) i--;

  let current = 0;
  for (; i >= 0; i--) {
    if (days[i].count > 0) {
      current++;
    } else if (current === 0 && days[i].date === today) {
      continue; // today empty so far — keep counting from yesterday
    } else {
      break;
    }
  }

  return { current, longest };
}

export function totalContributions(days: Day[]): number {
  return days.reduce((a, d) => a + d.count, 0);
}

// Contributions within an inclusive [start, end] date window (YYYY-MM-DD).
export function sumInRange(days: Day[], start: string, end: string): number {
  let sum = 0;
  for (const d of days) {
    if (d.date >= start && d.date <= end) sum += d.count;
  }
  return sum;
}
