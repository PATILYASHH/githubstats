"use client";

import dynamic from "next/dynamic";
import type { CityDay } from "./GitCity";

// Load Three.js only in the browser — it's heavy and needs WebGL/DOM.
const GitCity = dynamic(() => import("./GitCity"), {
  ssr: false,
  loading: () => (
    <div className="gitcity-canvas gitcity-loading">Building the city…</div>
  ),
});

export default function GitCityClient({ days }: { days: CityDay[] }) {
  return <GitCity days={days} />;
}
