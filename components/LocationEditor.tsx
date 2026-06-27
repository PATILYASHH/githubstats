"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BIcon } from "./icons";

export default function LocationEditor({
  city,
  country,
  highlight,
}: {
  city: string | null;
  country: string | null;
  highlight?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(Boolean(highlight));
  const [cityVal, setCityVal] = useState(city ?? "");
  const [countryVal, setCountryVal] = useState(country ?? "");
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/games/location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city: cityVal, country: countryVal }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Save failed (HTTP ${res.status}).`);
      }
      setOpen(false);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not save location.");
    } finally {
      setSaving(false);
    }
  }

  const summary = [city, country].filter(Boolean).join(", ");

  return (
    <div className={`location-editor${highlight ? " highlight" : ""}`}>
      {!open ? (
        <div className="location-summary">
          <span>
            <BIcon name="geo-alt-fill" size={14} /> Your location:{" "}
            <strong>{summary || "not set"}</strong>
          </span>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => setOpen(true)}
          >
            {summary ? "Edit" : "Set location"}
          </button>
        </div>
      ) : (
        <form className="location-form" onSubmit={save}>
          <label>
            City
            <input
              value={cityVal}
              onChange={(e) => setCityVal(e.target.value)}
              placeholder="e.g. Kolhapur"
              maxLength={80}
            />
          </label>
          <label>
            Country
            <input
              value={countryVal}
              onChange={(e) => setCountryVal(e.target.value)}
              placeholder="e.g. India"
              maxLength={80}
            />
          </label>
          <div className="location-form-actions">
            <button type="submit" className="save-btn" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setOpen(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
