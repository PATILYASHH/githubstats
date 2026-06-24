import type { ContribDay } from "@/lib/types";
import { LEVEL_COLORS } from "@/lib/colors";

// A compact, non-scrolling heatmap of the most recent `weeks` weeks — used in
// the Dev Card so the whole card exports cleanly as one image.
export default function MiniHeatmap({
  days,
  weeks = 30,
}: {
  days: ContribDay[];
  weeks?: number;
}) {
  if (days.length === 0) return null;

  const recent = days.slice(-weeks * 7);
  const firstWeekday = new Date(recent[0].date + "T00:00:00").getDay();
  const cells: (ContribDay | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...recent,
  ];

  return (
    <div className="mini-heatmap">
      {cells.map((d, i) =>
        d ? (
          <span
            key={d.date}
            className="mini-cell"
            style={{ backgroundColor: LEVEL_COLORS[d.level] }}
          />
        ) : (
          <span
            key={`p-${i}`}
            className="mini-cell"
            style={{ backgroundColor: "transparent" }}
          />
        )
      )}
    </div>
  );
}
