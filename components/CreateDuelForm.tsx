"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const DURATIONS = [3, 7, 14, 30];

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function CreateDuelForm({
  challengerId,
  challengerLogin,
}: {
  challengerId: string;
  challengerLogin: string;
}) {
  const router = useRouter();
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(false);

  async function create() {
    setLoading(true);
    // Duel starts tomorrow (UTC): contribution data is daily, so today's
    // numbers aren't final yet.
    const start = new Date();
    start.setUTCDate(start.getUTCDate() + 1);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + days - 1);

    const supabase = createClient();
    const { data, error } = await supabase
      .from("duels")
      .insert({
        challenger_id: challengerId,
        challenger_login: challengerLogin,
        start_date: isoDate(start),
        end_date: isoDate(end),
        status: "pending",
      })
      .select("id")
      .single();

    setLoading(false);
    if (error || !data) {
      alert("Could not create duel: " + (error?.message ?? "unknown error"));
      return;
    }
    router.push(`/games/duel/${data.id}`);
  }

  return (
    <div className="duel-create">
      <h3>⚔️ Start a new duel</h3>
      <p>
        Pick a length, then share the invite link with whoever you want to
        challenge. Most contributions over the window wins.
      </p>
      <div className="duel-create-row">
        <label>
          Length
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
          >
            {DURATIONS.map((d) => (
              <option key={d} value={d}>
                {d} days
              </option>
            ))}
          </select>
        </label>
        <button className="btn" onClick={create} disabled={loading}>
          {loading ? "Creating…" : "Create duel"}
        </button>
      </div>
    </div>
  );
}
