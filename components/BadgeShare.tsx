"use client";

import { useState } from "react";
import { ShareIcon, LinkIcon } from "./icons";

export default function BadgeShare({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  }

  async function share() {
    const navAny = navigator as Navigator;
    if (navAny.share) {
      try {
        await navAny.share({
          title: `${title} — GitHubStats badge`,
          url: window.location.href,
        });
        return;
      } catch {
        /* dismissed */
      }
    }
    copy();
  }

  return (
    <div className="badge-share-actions">
      <button className="action-btn primary" onClick={share}>
        <ShareIcon size={13} /> Share badge
      </button>
      <button className="action-btn" onClick={copy}>
        <LinkIcon size={14} /> {copied ? "Copied!" : "Copy link"}
      </button>
    </div>
  );
}
