"use client";

import { useRef, useState, type ReactNode } from "react";
import { toBlob } from "html-to-image";
import { ShareIcon } from "./icons";

interface ShareCardProps {
  title: string;
  icon?: ReactNode;
  filename: string;
  className?: string;
  children: ReactNode;
}

type State = "idle" | "working" | "done";

export default function ShareCard({
  title,
  icon,
  filename,
  className,
  children,
}: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<State>("idle");

  async function capture(): Promise<Blob | null> {
    if (!cardRef.current) return null;
    // Render at 2x for crisp images suitable for sharing / stores.
    return toBlob(cardRef.current, {
      pixelRatio: 2,
      backgroundColor: "#0d1117",
      // Skip the share button itself in the captured image.
      filter: (node) =>
        !(node instanceof HTMLElement && node.dataset.exclude === "true"),
    });
  }

  async function handleShare() {
    if (state === "working") return;
    setState("working");
    try {
      const blob = await capture();
      if (!blob) throw new Error("capture failed");

      const file = new File([blob], `${filename}.png`, { type: "image/png" });

      // Prefer the native share sheet (mobile / supported desktop browsers).
      const navAny = navigator as Navigator & {
        canShare?: (data?: ShareData) => boolean;
      };
      if (
        navAny.share &&
        navAny.canShare &&
        navAny.canShare({ files: [file] })
      ) {
        await navAny.share({
          files: [file],
          title: `${title} — GitHubStats`,
          text: "Made with githubstatss.vercel.app",
        });
        setState("idle");
        return;
      }

      // Fallback: download the PNG so the user can share it anywhere.
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filename}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setState("done");
      setTimeout(() => setState("idle"), 1800);
    } catch (err) {
      // AbortError = user dismissed the native share sheet; not an error.
      if ((err as Error)?.name !== "AbortError") {
        console.error("share failed", err);
      }
      setState("idle");
    }
  }

  return (
    <div ref={cardRef} className={`card ${className ?? ""}`}>
      <div className="card-head">
        <span className="card-title">
          {icon}
          {title}
        </span>
        <button
          className="share-btn"
          data-exclude="true"
          data-hide={state === "working"}
          onClick={handleShare}
          aria-label={`Share ${title} as image`}
        >
          <ShareIcon />
          {state === "done" ? "Saved!" : "Share"}
        </button>
      </div>
      {children}
      <span className="card-mark" data-exclude="false">
        githubstatss.vercel.app
      </span>
    </div>
  );
}
