"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  size: number;
  color: string;
}

const COLORS = ["#39d353", "#2f81f7", "#f778ba", "#e3b341", "#a371f7", "#ff7b72"];

// A lightweight one-shot confetti burst — no dependencies.
export default function Confetti({ fire }: { fire: unknown }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    )
      return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = (canvas.width = window.innerWidth);
    const H = (canvas.height = window.innerHeight);

    const count = Math.min(160, Math.floor(W / 8));
    const particles: Particle[] = Array.from({ length: count }, () => ({
      x: W / 2 + (Math.random() - 0.5) * W * 0.6,
      y: -20 - Math.random() * H * 0.2,
      vx: (Math.random() - 0.5) * 8,
      vy: 3 + Math.random() * 6,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      size: 6 + Math.random() * 6,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    }));

    let raf = 0;
    let frame = 0;
    const maxFrames = 150;

    const tick = () => {
      ctx.clearRect(0, 0, W, H);
      frame++;
      const fade = Math.max(0, 1 - frame / maxFrames);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15; // gravity
        p.vx *= 0.99;
        p.rot += p.vr;
        ctx.save();
        ctx.globalAlpha = fade;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      }
      if (frame < maxFrames) raf = requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, W, H);
    };
    raf = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(raf);
  }, [fire]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 50,
      }}
      aria-hidden="true"
    />
  );
}
