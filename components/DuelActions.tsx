"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BIcon } from "./icons";

export default function DuelActions({
  duelId,
  canAccept,
  canCancel,
  inviteUrl,
}: {
  duelId: string;
  canAccept: boolean;
  canCancel: boolean;
  inviteUrl?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  async function act(action: "accept" | "cancel") {
    setBusy(true);
    const res = await fetch("/api/games/duel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ duelId, action }),
    });
    setBusy(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert("Failed: " + (j.error ?? res.status));
      return;
    }
    router.refresh();
  }

  function copy() {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="duel-actions">
      {inviteUrl && (
        <button className="btn" onClick={copy}>
          {copied ? (
            <>
              <BIcon name="check2" /> Copied
            </>
          ) : (
            <>
              <BIcon name="link-45deg" /> Copy invite link
            </>
          )}
        </button>
      )}
      {canAccept && (
        <button className="btn" onClick={() => act("accept")} disabled={busy}>
          {busy ? "…" : "Accept challenge"}
        </button>
      )}
      {canCancel && (
        <button
          className="btn-ghost"
          onClick={() => act("cancel")}
          disabled={busy}
        >
          Cancel duel
        </button>
      )}
    </div>
  );
}
