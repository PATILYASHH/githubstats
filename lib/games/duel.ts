import type { Duel } from "./types";

export type DuelPhase =
  | "pending" // waiting for an opponent to accept
  | "upcoming" // accepted, hasn't started yet
  | "active" // in progress
  | "finished" // window has passed
  | "cancelled";

// Derive the real phase from the stored status + the calendar, so we don't need
// a cron to flip 'active' → 'finished'.
export function duelPhase(duel: Duel, today: string): DuelPhase {
  if (duel.status === "cancelled" || duel.status === "declined") {
    return "cancelled";
  }
  if (!duel.opponent_id) return "pending";
  if (today < duel.start_date) return "upcoming";
  if (today <= duel.end_date) return "active";
  return "finished";
}

export const PHASE_LABEL: Record<DuelPhase, string> = {
  pending: "Waiting for opponent",
  upcoming: "Starts soon",
  active: "Live",
  finished: "Finished",
  cancelled: "Cancelled",
};
