// Git City store + plot model — Minecraft-style building blocks.
// Pure data + helpers, safe on client and server.

export const PLOT_SIZE = 8; // 8x8 buildable tiles per user

export interface StoreItem {
  id: string;
  name: string;
  price: number; // in contribution coins
  icon: string; // bootstrap icon for the store UI
  color: string; // 3D colour
  height: number; // 3D height in blocks (1 = full cube)
  opacity?: number; // <1 for glass/water
  category: "block" | "build" | "nature" | "special";
}

export const STORE: StoreItem[] = [
  // basic blocks
  { id: "dirt", name: "Dirt", price: 20, icon: "square-fill", color: "#8a5a2b", height: 1, category: "block" },
  { id: "grass", name: "Grass Block", price: 30, icon: "square-fill", color: "#5fbb46", height: 1, category: "block" },
  { id: "sand", name: "Sand", price: 30, icon: "square-fill", color: "#ddd6a3", height: 1, category: "block" },
  { id: "stone", name: "Stone", price: 40, icon: "square-fill", color: "#9a9a9a", height: 1, category: "block" },
  { id: "cobblestone", name: "Cobblestone", price: 45, icon: "grid-3x3-gap-fill", color: "#7f7f7f", height: 1, category: "block" },
  { id: "planks", name: "Wood Planks", price: 50, icon: "square-fill", color: "#b8945f", height: 1, category: "block" },
  { id: "log", name: "Oak Log", price: 60, icon: "tree-fill", color: "#6b4f2a", height: 1, category: "block" },
  { id: "brick", name: "Bricks", price: 70, icon: "bricks", color: "#a85a47", height: 1, category: "block" },
  { id: "leaves", name: "Leaves", price: 40, icon: "tree-fill", color: "#3aa544", height: 1, category: "block" },
  { id: "glass", name: "Glass", price: 80, icon: "square", color: "#bfe9ff", height: 1, opacity: 0.4, category: "block" },
  { id: "gold", name: "Gold Block", price: 500, icon: "gem", color: "#f2cc60", height: 1, category: "block" },
  { id: "diamond", name: "Diamond Block", price: 1200, icon: "gem", color: "#4fd3c4", height: 1, category: "block" },
  // building parts
  { id: "floor", name: "Floor Slab", price: 25, icon: "grid-fill", color: "#b8945f", height: 0.4, category: "build" },
  { id: "path", name: "Path", price: 15, icon: "signpost-split-fill", color: "#6e7681", height: 0.14, category: "build" },
  { id: "door", name: "Door", price: 130, icon: "door-closed-fill", color: "#7a5a33", height: 2, category: "build" },
  { id: "window", name: "Window", price: 95, icon: "window", color: "#bfe9ff", height: 1, opacity: 0.5, category: "build" },
  { id: "fence", name: "Fence", price: 35, icon: "grid-3x3", color: "#6b4f2a", height: 1, category: "build" },
  { id: "stairs", name: "Stairs", price: 55, icon: "bar-chart-steps", color: "#9a9a9a", height: 0.6, category: "build" },
  { id: "roof", name: "Roof", price: 90, icon: "triangle-fill", color: "#a85a47", height: 0.6, category: "build" },
  { id: "ladder", name: "Ladder", price: 45, icon: "ladder", color: "#6b4f2a", height: 1.6, category: "build" },
  // nature + special
  { id: "tree", name: "Tree", price: 110, icon: "tree-fill", color: "#2ea043", height: 2.4, category: "nature" },
  { id: "flower", name: "Flowers", price: 50, icon: "flower1", color: "#db61a2", height: 0.4, category: "nature" },
  { id: "water", name: "Water", price: 35, icon: "droplet-fill", color: "#2f81f7", height: 0.25, opacity: 0.65, category: "nature" },
  { id: "torch", name: "Torch", price: 25, icon: "fire", color: "#f2cc60", height: 1, category: "special" },
  { id: "lamp", name: "Lamp", price: 90, icon: "lightbulb-fill", color: "#ffd76e", height: 1.3, category: "special" },
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

// Make an untrusted layout safe: known items only, in-bounds INTEGER tiles, one
// item per tile (last wins), bounded work and capped to the plot area.
export function sanitizeLayout(raw: unknown): Layout {
  if (!Array.isArray(raw)) return [];
  const byTile = new Map<string, Placement>();
  // Hard cap on iterations so a huge all-invalid array can't burn CPU.
  const MAX_SCAN = PLOT_SIZE * PLOT_SIZE * 8;
  const end = Math.min(raw.length, MAX_SCAN);
  for (let i = 0; i < end; i++) {
    const p = raw[i] as Placement;
    if (!p || typeof p !== "object") continue;
    const { item, x, z } = p;
    if (!STORE_MAP[item]) continue;
    if (typeof x !== "number" || typeof z !== "number") continue;
    if (!Number.isInteger(x) || !Number.isInteger(z)) continue;
    if (x < 0 || x >= PLOT_SIZE || z < 0 || z >= PLOT_SIZE) continue;
    byTile.set(`${x},${z}`, { item, x, z });
    if (byTile.size >= PLOT_SIZE * PLOT_SIZE) break;
  }
  return [...byTile.values()];
}
