"use client";

import { useMemo, useState } from "react";
import {
  STORE,
  STORE_MAP,
  layoutCost,
  PLOT_SIZE,
  type Layout,
} from "@/lib/games/store";
import { BIcon } from "./icons";
import PlotCityClient from "./PlotCityClient";
import RefreshStatsButton from "./RefreshStatsButton";

export default function PlotEditor({
  initialLayout,
  budget,
}: {
  initialLayout: Layout;
  budget: number;
}) {
  const [layout, setLayout] = useState<Layout>(initialLayout);
  const [selected, setSelected] = useState(STORE[0].id);
  const [save, setSave] = useState<"idle" | "saving" | "saved">("idle");
  const [err, setErr] = useState<string | null>(null);

  const spent = layoutCost(layout);
  const balance = budget - spent;

  const placed = useMemo(
    () => new Map(layout.map((p) => [`${p.x},${p.z}`, p.item])),
    [layout]
  );

  function tile(x: number, z: number) {
    setErr(null);
    const key = `${x},${z}`;
    if (placed.has(key)) {
      setLayout((l) => l.filter((p) => !(p.x === x && p.z === z)));
      return;
    }
    const item = STORE_MAP[selected];
    if (!item) return;
    if (balance < item.price) {
      setErr(`Not enough coins for ${item.name} (${item.price}).`);
      return;
    }
    setLayout((l) => [...l, { item: selected, x, z }]);
  }

  async function persist() {
    setSave("saving");
    setErr(null);
    try {
      const res = await fetch("/api/games/plot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ layout }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(
          j.error === "not enough coins"
            ? "Not enough coins to save this plot."
            : "Save failed — try again."
        );
      }
      setSave("saved");
      setTimeout(() => setSave("idle"), 2000);
    } catch (e) {
      setSave("idle");
      setErr(e instanceof Error ? e.message : "Save failed.");
    }
  }

  return (
    <div className="editor">
      <div className="editor-bar">
        <span className="coins">
          <BIcon name="coin" size={18} /> {balance.toLocaleString("en-US")} coins
          left
        </span>
        <span className="coins-sub">
          spent {spent.toLocaleString("en-US")} of{" "}
          {budget.toLocaleString("en-US")}
        </span>
        <button
          className="btn"
          onClick={persist}
          disabled={save === "saving"}
          style={{ marginLeft: "auto" }}
        >
          {save === "saving" ? (
            "Saving…"
          ) : save === "saved" ? (
            <>
              <BIcon name="check2" /> Saved
            </>
          ) : (
            "Save plot"
          )}
        </button>
      </div>

      {err && <p className="editor-err">{err}</p>}
      {budget === 0 && (
        <div className="editor-note">
          You have 0 coins yet. <RefreshStatsButton /> to load your contributions
          as coins.
        </div>
      )}

      <div className="editor-main">
        <div className="store">
          <h3>Store</h3>
          {STORE.map((it) => {
            const poor = balance < it.price;
            return (
              <button
                key={it.id}
                className={`store-item${selected === it.id ? " sel" : ""}${
                  poor ? " poor" : ""
                }`}
                onClick={() => setSelected(it.id)}
                title={poor ? "Not enough coins yet" : `Place ${it.name}`}
              >
                <span className="store-ico" style={{ color: it.color }}>
                  <BIcon name={it.icon} size={18} />
                </span>
                <span className="store-name">{it.name}</span>
                <span className="store-price">
                  <BIcon name="coin" size={11} /> {it.price.toLocaleString("en-US")}
                </span>
              </button>
            );
          })}
        </div>

        <div className="plot-wrap">
          <p className="plot-hint">
            Pick an item, click a tile to build. Click a built tile to remove
            (refund).
          </p>
          <div
            className="plot-grid"
            style={{ gridTemplateColumns: `repeat(${PLOT_SIZE}, 1fr)` }}
          >
            {Array.from({ length: PLOT_SIZE * PLOT_SIZE }).map((_, i) => {
              const x = i % PLOT_SIZE;
              const z = Math.floor(i / PLOT_SIZE);
              const itemId = placed.get(`${x},${z}`);
              const item = itemId ? STORE_MAP[itemId] : null;
              return (
                <button
                  key={i}
                  className={`plot-tile${item ? " filled" : ""}`}
                  onClick={() => tile(x, z)}
                  title={item ? `${item.name} — click to remove` : "Empty tile"}
                  style={item ? { color: item.color } : undefined}
                >
                  {item && <BIcon name={item.icon} size={16} />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <PlotCityClient layout={layout} />
    </div>
  );
}
