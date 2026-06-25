"use client";

import dynamic from "next/dynamic";
import type { GamePlot } from "./CityGame";

const CityGame = dynamic(() => import("./CityGame"), {
  ssr: false,
  loading: () => (
    <div className="gitcity-canvas gitcity-loading">Loading the game…</div>
  ),
});

export default function CityGameClient(props: {
  plots: GamePlot[];
  budget: number;
  canBuild: boolean;
}) {
  return <CityGame {...props} />;
}
