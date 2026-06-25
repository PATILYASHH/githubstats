import type * as THREEType from "three";
import { STORE_MAP, PLOT_SIZE, type Layout } from "@/lib/games/store";

// Build a THREE.Group for one plot: a grass platform plus blocky, flat-shaded
// Minecraft-style cubes for each placed item. THREE is passed in so this module
// imports no three itself (keeps three out of any server bundle).
export function buildPlotGroup(
  THREE: typeof THREEType,
  layout: Layout,
  platformColor = "#4a7a3a"
): THREEType.Group {
  const group = new THREE.Group();
  const half = PLOT_SIZE / 2;

  // grass platform (a thick block under the plot)
  const plat = new THREE.Mesh(
    new THREE.BoxGeometry(PLOT_SIZE, 1, PLOT_SIZE),
    new THREE.MeshStandardMaterial({
      color: platformColor,
      roughness: 1,
      flatShading: true,
    })
  );
  plat.position.set(0, -0.5, 0);
  group.add(plat);

  const W = 0.98; // near-full tile so blocks read as a grid
  for (const p of layout) {
    const item = STORE_MAP[p.item];
    if (!item) continue;
    const px = p.x - half + 0.5;
    const pz = p.z - half + 0.5;
    const mat = new THREE.MeshStandardMaterial({
      color: item.color,
      roughness: 0.95,
      metalness: 0,
      flatShading: true,
      transparent: item.opacity != null,
      opacity: item.opacity ?? 1,
    });
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(W, item.height, W),
      mat
    );
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
