import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Brand mark for iOS home screens: GitHub contribution cells rising as a
// staircase, swept from green to blue — the same motif as app/icon.svg.
const A = [57, 211, 83]; // #39d353
const B = [47, 129, 247]; // #2f81f7
const mix = (t: number) =>
  `rgb(${A.map((a, i) => Math.round(a + (B[i] - a) * t)).join(",")})`;

export default function AppleIcon() {
  const columns = [0, 1, 2, 3].map((c) => (
    <div key={c} style={{ display: "flex", flexDirection: "column", gap: 9 }}>
      {[0, 1, 2, 3].map((r) => {
        const lit = r >= 3 - c; // bottom (c+1) cells lit
        const t = (c + (3 - r)) / 6; // diagonal position, green -> blue
        return (
          <div
            key={r}
            style={{
              width: 26,
              height: 26,
              borderRadius: 7,
              background: lit ? mix(t) : "#283039",
            }}
          />
        );
      })}
    </div>
  ));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0d1117 0%, #161b22 100%)",
        }}
      >
        <div style={{ display: "flex", gap: 9 }}>{columns}</div>
      </div>
    ),
    { ...size }
  );
}
