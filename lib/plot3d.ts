import type * as THREEType from "three";
import { STORE_MAP, PLOT_SIZE, type Layout } from "@/lib/games/store";

// Build a THREE.Group for one plot: a grass platform plus the placed items.
// THREE is passed in so this module imports no three itself (keeps three out of
// any server bundle; the calling client component owns the import).
export function buildPlotGroup(
  THREE: typeof THREEType,
  layout: Layout,
  platformColor = "#15301c"
): THREEType.Group {
  const group = new THREE.Group();
  const half = PLOT_SIZE / 2;

  const plat = new THREE.Mesh(
    new THREE.BoxGeometry(PLOT_SIZE, 0.3, PLOT_SIZE),
    new THREE.MeshStandardMaterial({ color: platformColor, roughness: 0.95 })
  );
  plat.position.set(0, -0.15, 0);
  group.add(plat);

  for (const p of layout) {
    const item = STORE_MAP[p.item];
    if (!item) continue;
    const px = p.x - half + 0.5;
    const pz = p.z - half + 0.5;
    const mat = new THREE.MeshStandardMaterial({
      color: item.color,
      roughness: 0.7,
      metalness: 0.05,
    });
    let geo: THREEType.BufferGeometry;
    if (item.shape === "cone") {
      geo = new THREE.ConeGeometry(0.42, item.height, 7);
    } else if (item.shape === "flat") {
      geo = new THREE.BoxGeometry(0.9, item.height, 0.9);
    } else {
      geo = new THREE.BoxGeometry(0.78, item.height, 0.78);
    }
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(px, item.height / 2, pz);
    group.add(mesh);
  }
  return group;
}

// Dispose all geometries/materials in a group (call before removing it).
export function disposeGroup(group: THREEType.Object3D) {
  group.traverse((o) => {
    const m = o as THREEType.Mesh;
    if (m.geometry) m.geometry.dispose();
    const mat = m.material as THREEType.Material | THREEType.Material[] | undefined;
    if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
    else if (mat) mat.dispose();
  });
}
