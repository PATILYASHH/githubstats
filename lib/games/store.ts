// Git City store + plot model. Pure data + helpers, safe on client and server.

export const PLOT_SIZE = 8; // 8x8 buildable tiles per user

export type Shape = "box" | "cone" | "flat";

export interface StoreItem {
  id: string;
  name: string;
  price: number; // in contribution coins
  icon: string; // bootstrap icon for the store UI
  color: string; // 3D colour
  height: number; // 3D height
  shape: Shape;
  category: "nature" | "home" | "build" | "decor";
}

export const STORE: StoreItem[] = [
  // nature
  { id: "path", name: "Path", price: 20, icon: "signpost-split-fill", color: "#6e7681", height: 0.06, shape: "flat", category: "decor" },
  { id: "flowers", name: "Flowers", price: 50, icon: "flower1", color: "#db61a2", height: 0.18, shape: "flat", category: "nature" },
  { id: "tree", name: "Tree", price: 80, icon: "tree-fill", color: "#2ea043", height: 1.6, shape: "cone", category: "nature" },
  { id: "pine", name: "Pine", price: 110, icon: "tree-fill", color: "#238636", height: 2.3, shape: "cone", category: "nature" },
  { id: "pond", name: "Pond", price: 240, icon: "droplet-fill", color: "#1f6feb", height: 0.06, shape: "flat", category: "nature" },
  // decor
  { id: "lamp", name: "Lamp", price: 90, icon: "lightbulb-fill", color: "#f2cc60", height: 1.3, shape: "box", category: "decor" },
  { id: "fountain", name: "Fountain", price: 350, icon: "droplet-half", color: "#56d4dd", height: 0.7, shape: "box", category: "decor" },
  { id: "statue", name: "Statue", price: 1200, icon: "person-arms-up", color: "#c9d1d9", height: 2.1, shape: "box", category: "decor" },
  // homes
  { id: "tent", name: "Tent", price: 150, icon: "triangle-fill", color: "#d29922", height: 0.9, shape: "cone", category: "home" },
  { id: "hut", name: "Hut", price: 300, icon: "house-fill", color: "#a371f7", height: 1.1, shape: "box", category: "home" },
  { id: "house", name: "House", price: 600, icon: "house-door-fill", color: "#58a6ff", height: 1.7, shape: "box", category: "home" },
  { id: "cafe", name: "Cafe", price: 800, icon: "cup-hot-fill", color: "#f0883e", height: 1.8, shape: "box", category: "home" },
  // big builds
  { id: "shop", name: "Shop", price: 950, icon: "shop", color: "#e3b341", height: 2, shape: "box", category: "build" },
  { id: "tower", name: "Tower", price: 2000, icon: "building", color: "#79c0ff", height: 4.2, shape: "box", category: "build" },
  { id: "skyscraper", name: "Skyscraper", price: 3500, icon: "buildings-fill", color: "#a5d6ff", height: 6.5, shape: "box", category: "build" },
  { id: "castle", name: "Castle", price: 5000, icon: "bank2", color: "#ffa657", height: 3.2, shape: "box", category: "build" },
];

export const STORE_MAP: Record<string, StoreItem> = Object.fromEntries(
  STORE.map((i) => [i.id, i])
);

export interface Placement {
  item: string; // StoreItem id
  x: number; // 0..PLOT_SIZE-1
  z: number; // 0..PLOT_SIZE-1
}

export type Layout = Placement[];

export function layoutCost(layout: Layout): number {
  return layout.reduce((sum, p) => sum + (STORE_MAP[p.item]?.price ?? 0), 0);
}

// Make an untrusted layout safe: known items only, in-bounds integer tiles,
// one item per tile (last wins), capped to the plot area.
export function sanitizeLayout(raw: unknown): Layout {
  if (!Array.isArray(raw)) return [];
  const byTile = new Map<string, Placement>();
  for (const p of raw) {
    if (!p || typeof p !== "object") continue;
    const item = (p as Placement).item;
    const x = Math.trunc((p as Placement).x);
    const z = Math.trunc((p as Placement).z);
    if (!STORE_MAP[item]) continue;
    if (!Number.isFinite(x) || !Number.isFinite(z)) continue;
    if (x < 0 || x >= PLOT_SIZE || z < 0 || z >= PLOT_SIZE) continue;
    byTile.set(`${x},${z}`, { item, x, z });
    if (byTile.size >= PLOT_SIZE * PLOT_SIZE) break;
  }
  return [...byTile.values()];
}
