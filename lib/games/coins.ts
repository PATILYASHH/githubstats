import { fetchDays, totalContributions } from "./contributions";

// Coins = the user's all-time contribution total.
//
// We use the LIVE calendar API as the source of truth so contributions earned
// today immediately raise the balance (e.g. 1000 → 1040 after 40 commits), and
// fall back to the stored snapshot when the API is unavailable. We never return
// less than the snapshot, so a flaky/partial API response can't strip coins the
// player has already been granted (and may have built against).
export async function availableCoins(
  login: string | null | undefined,
  snapshotTotal: number | null | undefined
): Promise<number> {
  const snap = snapshotTotal ?? 0;
  if (!login) return snap;
  try {
    const live = totalContributions(await fetchDays(login));
    return Math.max(snap, live);
  } catch {
    return snap;
  }
}
