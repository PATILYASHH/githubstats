import type * as THREEType from "three";
import type { StoreItem } from "@/lib/games/store";

// Procedural pixel-art (Minecraft-style) textures for blocks. Materials are
// cached at module level and reused across every plot/render and never disposed
// (a small, bounded set), so building stays cheap and textures stay crisp.

const matCache = new Map<string, THREEType.Material | THREEType.Material[]>();
const platCache = new Map<string, THREEType.Material>();

function canvas(S = 16) {
  const c = document.createElement("canvas");
  c.width = S;
  c.height = S;
  return { c, ctx: c.getContext("2d")!, S };
}

function shade(hex: string, amt: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(v + amt * 255)));
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}

function speckle(
  ctx: CanvasRenderingContext2D,
  base: string,
  vary: number,
  S: number,
  y0 = 0,
  y1 = S
) {
  for (let i = 0; i < S * (y1 - y0) * 0.7; i++) {
    const x = (Math.random() * S) | 0;
    const y = y0 + ((Math.random() * (y1 - y0)) | 0);
    ctx.fillStyle = shade(base, (Math.random() * 2 - 1) * vary);
    ctx.fillRect(x, y, 1, 1);
  }
}

function toTex(THREE: typeof THREEType, c: HTMLCanvasElement) {
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  return t;
}

function noise(THREE: typeof THREEType, base: string, vary = 0.1) {
  const { c, ctx, S } = canvas();
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, S, S);
  speckle(ctx, base, vary, S);
  return toTex(THREE, c);
}

function brick(THREE: typeof THREEType, base: string) {
  const { c, ctx, S } = canvas();
  ctx.fillStyle = "#3a2520"; // mortar
  ctx.fillRect(0, 0, S, S);
  const bh = 4;
  for (let row = 0; row < S / bh; row++) {
    const off = row % 2 ? 4 : 0;
    for (let x = -off; x < S; x += 8) {
      ctx.fillStyle = shade(base, (Math.random() * 2 - 1) * 0.08);
      ctx.fillRect(x + 1, row * bh + 1, 6, bh - 1);
    }
  }
  return toTex(THREE, c);
}

function planks(THREE: typeof THREEType, base: string, vertical = false) {
  const { c, ctx, S } = canvas();
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, S, S);
  speckle(ctx, base, 0.08, S);
  ctx.fillStyle = shade(base, -0.18);
  for (let i = 4; i < S; i += 4) {
    if (vertical) ctx.fillRect(i, 0, 1, S);
    else ctx.fillRect(0, i, S, 1);
  }
  return toTex(THREE, c);
}

function pane(THREE: typeof THREEType, base: string, frame = false) {
  const { c, ctx, S } = canvas();
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, S, S);
  ctx.fillStyle = shade(base, 0.25);
  ctx.fillRect(1, 1, 4, 4); // glint
  if (frame) {
    ctx.fillStyle = "#5a4326";
    ctx.fillRect(0, 0, S, 1);
    ctx.fillRect(0, S - 1, S, 1);
    ctx.fillRect(0, 0, 1, S);
    ctx.fillRect(S - 1, 0, 1, S);
    ctx.fillRect(S / 2 - 1, 0, 2, S);
    ctx.fillRect(0, S / 2 - 1, S, 2);
  }
  return toTex(THREE, c);
}

function grassTop(THREE: typeof THREEType) {
  return noise(THREE, "#5fbb46", 0.14);
}
function grassSide(THREE: typeof THREEType) {
  const { c, ctx, S } = canvas();
  ctx.fillStyle = "#7a5230";
  ctx.fillRect(0, 0, S, S);
  speckle(ctx, "#7a5230", 0.12, S, 3, S);
  ctx.fillStyle = "#5fbb46";
  ctx.fillRect(0, 0, S, 4);
  speckle(ctx, "#5fbb46", 0.14, S, 0, 4);
  return toTex(THREE, c);
}

// Returns a Material (or 6-face array for grass) for a store item, cached.
export function getBlockMaterial(
  THREE: typeof THREEType,
  item: StoreItem
): THREEType.Material | THREEType.Material[] {
  const hit = matCache.get(item.id);
  if (hit) return hit;

  const transparent = item.opacity != null;
  const common = {
    roughness: 0.95,
    metalness: item.id === "gold" || item.id === "diamond" ? 0.3 : 0.02,
    transparent,
    opacity: item.opacity ?? 1,
  };

  let mat: THREEType.Material | THREEType.Material[];

  if (item.id === "grass") {
    const top = new THREE.MeshStandardMaterial({ map: grassTop(THREE), ...common });
    const side = new THREE.MeshStandardMaterial({ map: grassSide(THREE), ...common });
    const dirt = new THREE.MeshStandardMaterial({ map: noise(THREE, "#7a5230", 0.12), ...common });
    mat = [side, side, top, dirt, side, side]; // +x -x +y -y +z -z
  } else if (item.id === "brick") {
    mat = new THREE.MeshStandardMaterial({ map: brick(THREE, item.color), ...common });
  } else if (item.id === "planks" || item.id === "door" || item.id === "floor") {
    mat = new THREE.MeshStandardMaterial({ map: planks(THREE, item.color), ...common });
  } else if (item.id === "log") {
    mat = new THREE.MeshStandardMaterial({ map: planks(THREE, item.color, true), ...common });
  } else if (item.id === "glass" || item.id === "window") {
    mat = new THREE.MeshStandardMaterial({ map: pane(THREE, item.color, item.id === "window"), ...common });
  } else if (item.id === "water") {
    mat = new THREE.MeshStandardMaterial({ map: noise(THREE, item.color, 0.12), ...common });
  } else {
    mat = new THREE.MeshStandardMaterial({ map: noise(THREE, item.color, 0.12), ...common });
  }

  matCache.set(item.id, mat);
  return mat;
}

export function getPlatformMaterial(
  THREE: typeof THREEType,
  color: string
): THREEType.Material {
  const hit = platCache.get(color);
  if (hit) return hit;
  const mat = new THREE.MeshStandardMaterial({
    map: noise(THREE, color, 0.1),
    roughness: 1,
  });
  platCache.set(color, mat);
  return mat;
}
