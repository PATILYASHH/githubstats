import type { LanguageStat } from "@/lib/types";

// Pure-SVG donut so it renders crisply in shared PNG exports.
export default function DonutChart({
  data,
  size = 160,
}: {
  data: LanguageStat[];
  size?: number;
}) {
  const stroke = size * 0.16;
  const radius = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * radius;

  let offset = 0;
  const total = data.reduce((a, d) => a + d.percentage, 0) || 100;
  const top = data[0];

  return (
    <div className="donut-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="#21262d"
          strokeWidth={stroke}
        />
        <g transform={`rotate(-90 ${cx} ${cy})`}>
          {data.map((d) => {
            const len = (circ * d.percentage) / total;
            const seg = (
              <circle
                key={d.name}
                cx={cx}
                cy={cy}
                r={radius}
                fill="none"
                stroke={d.color}
                strokeWidth={stroke}
                strokeDasharray={`${len} ${circ - len}`}
                strokeDashoffset={-offset}
              />
            );
            offset += len;
            return seg;
          })}
        </g>
        {top && (
          <>
            <text
              x={cx}
              y={cy - 4}
              textAnchor="middle"
              fontSize={size * 0.16}
              fontWeight="800"
              fill="#e6edf3"
            >
              {top.percentage}%
            </text>
            <text
              x={cx}
              y={cy + size * 0.12}
              textAnchor="middle"
              fontSize={size * 0.08}
              fill="#8b949e"
            >
              {top.name}
            </text>
          </>
        )}
      </svg>
    </div>
  );
}
