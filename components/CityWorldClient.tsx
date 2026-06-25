"use client";

import dynamic from "next/dynamic";
import type { CityPlot } from "./CityWorld";

const CityWorld = dynamic(() => import("./CityWorld"), {
  ssr: false,
  loading: () => (
    <div className="gitcity-canvas gitcity-loading">Building the city…</div>
  ),
});

export default function CityWorldClient({ plots }: { plots: CityPlot[] }) {
  return <CityWorld plots={plots} />;
}
