// Git City store + plot model — Minecraft-style building blocks.
// Pure data + helpers, safe on client and server.

export const PLOT_SIZE = 50; // 50x50 buildable tiles per user
export const MAX_BUILD_HEIGHT = 24; // stack blocks up to 24 levels high
const MAX_PLACEMENTS = 6000; // hard cap on blocks per plot (storage + perf)

export interface StoreItem {
  id: string;
  name: string;
  price: number; // in contribution coins
  icon: string; // bootstrap icon for the store UI
  color: string; // 3D colour
  height: number; // 3D height in blocks (1 = full cube)
  opacity?: number; // <1 for glass/water/ice
  glow?: string; // emissive colour for light-emitting blocks
  category: "block" | "build" | "nature" | "special";
}

// Prices are intentionally low: coins = your lifetime contributions, so even a
// modest account can build a real house. Basics cost 1–5, premium 40–80.
export const STORE: StoreItem[] = [
  // --- starter hotbar (first 9) ---
  { id: "grass", name: "Grass Block", price: 2, icon: "square-fill", color: "#5fbb46", height: 1, category: "block" },
  { id: "dirt", name: "Dirt", price: 1, icon: "square-fill", color: "#8a5a2b", height: 1, category: "block" },
  { id: "stone", name: "Stone", price: 2, icon: "square-fill", color: "#9a9a9a", height: 1, category: "block" },
  { id: "cobblestone", name: "Cobblestone", price: 3, icon: "grid-3x3-gap-fill", color: "#8a8a8a", height: 1, category: "block" },
  { id: "planks", name: "Wood Planks", price: 3, icon: "square-fill", color: "#b8945f", height: 1, category: "block" },
  { id: "log", name: "Oak Log", price: 4, icon: "tree-fill", color: "#6b4f2a", height: 1, category: "block" },
  { id: "brick", name: "Bricks", price: 5, icon: "bricks", color: "#a85a47", height: 1, category: "block" },
  { id: "glass", name: "Glass", price: 5, icon: "square", color: "#bfe9ff", height: 1, opacity: 0.35, category: "block" },
  { id: "door", name: "Door", price: 8, icon: "door-closed-fill", color: "#7a5a33", height: 2, category: "build" },
  // --- more blocks ---
  { id: "sand", name: "Sand", price: 2, icon: "square-fill", color: "#ddd6a3", height: 1, category: "block" },
  { id: "gravel", name: "Gravel", price: 2, icon: "grid-3x3-gap", color: "#8f8f8f", height: 1, category: "block" },
  { id: "sandstone", name: "Sandstone", price: 3, icon: "square-fill", color: "#e3d9a8", height: 1, category: "block" },
  { id: "mossy_cobble", name: "Mossy Cobble", price: 4, icon: "grid-3x3-gap-fill", color: "#7f8a6a", height: 1, category: "block" },
  { id: "snow", name: "Snow", price: 2, icon: "snow", color: "#f5f9ff", height: 1, category: "block" },
  { id: "ice", name: "Ice", price: 4, icon: "snow2", color: "#acdcf2", height: 1, opacity: 0.55, category: "block" },
  { id: "quartz", name: "Quartz", price: 5, icon: "square-fill", color: "#ece9e2", height: 1, category: "block" },
  { id: "obsidian", name: "Obsidian", price: 8, icon: "square-fill", color: "#221b33", height: 1, category: "block" },
  { id: "leaves", name: "Leaves", price: 2, icon: "tree-fill", color: "#3aa544", height: 1, category: "nature" },
  { id: "hedge", name: "Hedge", price: 3, icon: "tree-fill", color: "#2f7d38", height: 1, category: "nature" },
  { id: "bookshelf", name: "Bookshelf", price: 6, icon: "book-fill", color: "#9a6a3a", height: 1, category: "block" },
  // --- coloured wool (cheap, lots of variety) ---
  { id: "wool_white", name: "White Wool", price: 3, icon: "square-fill", color: "#e8eef2", height: 1, category: "block" },
  { id: "wool_red", name: "Red Wool", price: 3, icon: "square-fill", color: "#c0392b", height: 1, category: "block" },
  { id: "wool_blue", name: "Blue Wool", price: 3, icon: "square-fill", color: "#2f6fc0", height: 1, category: "block" },
  { id: "wool_yellow", name: "Yellow Wool", price: 3, icon: "square-fill", color: "#e6c84a", height: 1, category: "block" },
  { id: "wool_green", name: "Green Wool", price: 3, icon: "square-fill", color: "#4a8a4a", height: 1, category: "block" },
  { id: "wool_black", name: "Black Wool", price: 3, icon: "square-fill", color: "#2b2f36", height: 1, category: "block" },
  { id: "wool_pink", name: "Pink Wool", price: 3, icon: "square-fill", color: "#db61a2", height: 1, category: "block" },
  // --- building parts ---
  { id: "window", name: "Window", price: 6, icon: "window", color: "#bfe9ff", height: 1, opacity: 0.5, category: "build" },
  { id: "floor", name: "Floor Slab", price: 2, icon: "grid-fill", color: "#b8945f", height: 0.4, category: "build" },
  { id: "path", name: "Path", price: 1, icon: "signpost-split-fill", color: "#6e7681", height: 0.14, category: "build" },
  { id: "fence", name: "Fence", price: 3, icon: "grid-3x3", color: "#6b4f2a", height: 1, category: "build" },
  { id: "stairs", name: "Stairs", price: 4, icon: "bar-chart-steps", color: "#9a9a9a", height: 0.6, category: "build" },
  { id: "roof", name: "Roof", price: 5, icon: "triangle-fill", color: "#a85a47", height: 0.6, category: "build" },
  { id: "ladder", name: "Ladder", price: 3, icon: "ladder", color: "#6b4f2a", height: 1.6, category: "build" },
  // --- nature + special ---
  { id: "tree", name: "Tree", price: 10, icon: "tree-fill", color: "#2ea043", height: 2.4, category: "nature" },
  { id: "flower", name: "Flowers", price: 3, icon: "flower1", color: "#db61a2", height: 0.4, category: "nature" },
  { id: "water", name: "Water", price: 3, icon: "droplet-fill", color: "#2f81f7", height: 0.25, opacity: 0.65, category: "nature" },
  { id: "torch", name: "Torch", price: 2, icon: "fire", color: "#ffb347", height: 1, glow: "#ffb347", category: "special" },
  { id: "lamp", name: "Lamp", price: 6, icon: "lightbulb-fill", color: "#ffd76e", height: 1.3, glow: "#ffd76e", category: "special" },
  { id: "lantern", name: "Lantern", price: 5, icon: "lamp-fill", color: "#ffcf5a", height: 1, glow: "#ffcf5a", category: "special" },
  { id: "glowstone", name: "Glowstone", price: 8, icon: "brightness-high-fill", color: "#ffe08a", height: 1, glow: "#ffd34d", category: "special" },
  // --- premium ---
  { id: "gold", name: "Gold Block", price: 40, icon: "gem", color: "#f2cc60", height: 1, category: "special" },
  { id: "emerald", name: "Emerald Block", price: 50, icon: "gem", color: "#2ee06a", height: 1, category: "special" },
  { id: "diamond", name: "Diamond Block", price: 80, icon: "gem", color: "#4fd3c4", height: 1, category: "special" },
];

export const STORE_MAP: Record<string, StoreItem> = Object.fromEntries(
  STORE.map((i) => [i.id, i])
);

export interface Placement {
  item: string; // StoreItem id
  x: number; // 0..PLOT_SIZE-1
  z: number; // 0..PLOT_SIZE-1
  y?: number; // 0..MAX_BUILD_HEIGHT-1 (stack level; omitted/0 = ground)
}

export type Layout = Placement[];

export function layoutCost(layout: Layout): number {
  return layout.reduce((sum, p) => sum + (STORE_MAP[p.item]?.price ?? 0), 0);
}

// Make an untrusted layout safe: known items only, in-bounds INTEGER cells, one
// item per (x,y,z) cell (last wins), bounded work and capped to a sane count.
// Legacy placements with no `y` are treated as ground level (y = 0).
export function sanitizeLayout(raw: unknown): Layout {
  if (!Array.isArray(raw)) return [];
  const byCell = new Map<string, Placement>();
  // Hard cap on iterations so a huge all-invalid array can't burn CPU.
  const MAX_SCAN = MAX_PLACEMENTS * 4;
  const end = Math.min(raw.length, MAX_SCAN);
  for (let i = 0; i < end; i++) {
    const p = raw[i] as Placement;
    if (!p || typeof p !== "object") continue;
    const { item, x, z } = p;
    const y = p.y == null ? 0 : p.y;
    if (!STORE_MAP[item]) continue;
    if (typeof x !== "number" || typeof z !== "number" || typeof y !== "number")
      continue;
    if (!Number.isInteger(x) || !Number.isInteger(z) || !Number.isInteger(y))
      continue;
    if (x < 0 || x >= PLOT_SIZE || z < 0 || z >= PLOT_SIZE) continue;
    if (y < 0 || y >= MAX_BUILD_HEIGHT) continue;
    byCell.set(`${x},${y},${z}`, { item, x, y, z });
    if (byCell.size >= MAX_PLACEMENTS) break;
  }
  return [...byCell.values()];
}
