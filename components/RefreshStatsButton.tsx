"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BIcon } from "./icons";

export default function RefreshStatsButton() {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");

  async function refresh() {
    setState("loading");
    try {
      const res = await fetch("/api/games/refresh", { method: "POST" });
      if (!res.ok) throw new Error(String(res.status));
      setState("done");
      router.refresh();
      setTimeout(() => setState("idle"), 2000);
    } catch {
      setState("idle");
      alert("Could not refresh stats. Try again in a moment.");
    }
  }

  return (
    <button
      type="button"
      className="btn-ghost"
      onClick={refresh}
      disabled={state === "loading"}
    >
      {state === "loading" ? (
        <>
          <BIcon name="arrow-clockwise" className="spin" /> Refreshing…
        </>
      ) : state === "done" ? (
        <>
          <BIcon name="check2" /> Updated
        </>
      ) : (
        <>
          <BIcon name="arrow-clockwise" /> Refresh my stats
        </>
      )}
    </button>
  );
}
