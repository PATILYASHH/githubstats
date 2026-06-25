"use client";

import dynamic from "next/dynamic";
import type { Layout } from "@/lib/games/store";

const PlotCity = dynamic(() => import("./PlotCity"), {
  ssr: false,
  loading: () => (
    <div className="gitcity-canvas gitcity-loading">Loading 3D…</div>
  ),
});

export default function PlotCityClient({ layout }: { layout: Layout }) {
  return <PlotCity layout={layout} />;
}
