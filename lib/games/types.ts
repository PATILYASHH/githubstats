// Shapes of the game database rows (mirrors supabase/schema.sql).

export interface Profile {
  id: string;
  github_login: string | null;
  github_id: number | null;
  avatar_url: string | null;
  name: string | null;
  created_at: string;
}

export interface UserStats {
  user_id: string;
  github_login: string;
  avatar_url: string | null;
  name: string | null;
  contributions_total: number;
  contributions_year: number;
  streak_current: number;
  streak_longest: number;
  updated_at: string;
}

export type DuelStatus =
  | "pending"
  | "active"
  | "finished"
  | "declined"
  | "cancelled";

export interface Duel {
  id: string;
  challenger_id: string;
  challenger_login: string;
  opponent_id: string | null;
  opponent_login: string | null;
  start_date: string;
  end_date: string;
  status: DuelStatus;
  created_at: string;
}
