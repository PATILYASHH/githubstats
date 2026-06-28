import type { ContribDay } from "@/lib/types";
import { LEVEL_COLORS } from "@/lib/colors";

// A compact, non-scrolling heatmap of the most recent `weeks` weeks — used in
// the Dev Card so the whole card exports cleanly as one image.
export default function MiniHeatmap({
  days,
  weeks = 30,
  cell,
}: {
  days: ContribDay[];
  weeks?: number;
  // Override the cell size (px). Lets a full ~53-week year fit the card width.
  cell?: number;
}) {
  if (days.length === 0) return null;

  const recent = days.slice(-weeks * 7);
  const firstWeekday = new Date(recent[0].date + "T00:00:00").getDay();
  const cells: (ContribDay | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...recent,
  ];

  const gridStyle = cell ? { gridTemplateRows: `repeat(7, ${cell}px)` } : undefined;
  const cellStyle = cell ? { width: cell, height: cell } : undefined;

  return (
    <div className="mini-heatmap" style={gridStyle}>
      {cells.map((d, i) =>
        d ? (
          <span
            key={d.date}
            className="mini-cell"
            style={{ backgroundColor: LEVEL_COLORS[d.level], ...cellStyle }}
          />
        ) : (
          <span
            key={`p-${i}`}
            className="mini-cell"
            style={{ backgroundColor: "transparent", ...cellStyle }}
          />
        )
      )}
    </div>
  );
}
