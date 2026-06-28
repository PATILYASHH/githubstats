import type * as THREEType from "three";
import { STORE_MAP, PLOT_SIZE, type Layout } from "@/lib/games/store";
import { getBlockMaterial, getPlatformMaterial } from "@/lib/blockTextures";

// Build a THREE.Group for one plot: a grass platform plus textured, blocky
// Minecraft cubes for each placed item (trees render as a trunk + leaf canopy).
// Every block mesh carries its grid cell in `userData.cell` so the game can
// raycast against the build to stack/remove blocks; the platform carries
// `userData.ground` so clicks on bare ground place at level 0.
// All materials come from the module-level texture cache, so only geometries are
// owned by the group — free them with disposeGeometriesOnly().
export function buildPlotGroup(
  THREE: typeof THREEType,
  layout: Layout,
  platformColor = "#4a7a3a"
): THREEType.Group {
  const group = new THREE.Group();
  const half = PLOT_SIZE / 2;
  const unit = new THREE.BoxGeometry(1, 1, 1); // shared by all full-height blocks

  const plat = new THREE.Mesh(
    new THREE.BoxGeometry(PLOT_SIZE, 1, PLOT_SIZE),
    getPlatformMaterial(THREE, platformColor)
  );
  plat.position.set(0, -0.5, 0);
  plat.receiveShadow = true;
  plat.userData.ground = true;
  group.add(plat);

  for (const p of layout) {
    const item = STORE_MAP[p.item];
    if (!item) continue;
    const px = p.x - half + 0.5;
    const pz = p.z - half + 0.5;
    const py = p.y ?? 0; // stack level; base of the cell sits at world y = py
    const cell = { x: p.x, y: py, z: p.z };

    if (item.id === "tree") {
      const trunkMat = getBlockMaterial(
        THREE,
        STORE_MAP["log"] ?? item
      ) as THREEType.Material;
      const leafMat = getBlockMaterial(
        THREE,
        STORE_MAP["leaves"] ?? item
      ) as THREEType.Material;
      const trunk = new THREE.Mesh(new THREE.BoxGeometry(0.4, 2.4, 0.4), trunkMat);
      trunk.position.set(px, py + 1.2, pz);
      trunk.castShadow = true;
      trunk.userData.cell = cell;
      group.add(trunk);
      const canopy: [number, number, number, number][] = [
        [0, 2.7, 0, 1.7],
        [0, 3.6, 0, 1.0],
        [0.8, 2.7, 0, 0.8],
        [-0.8, 2.7, 0, 0.8],
        [0, 2.7, 0.8, 0.8],
        [0, 2.7, -0.8, 0.8],
      ];
      for (const [dx, dy, dz, s] of canopy) {
        const leaf = new THREE.Mesh(new THREE.BoxGeometry(s, s, s), leafMat);
        leaf.position.set(px + dx, py + dy, pz + dz);
        leaf.castShadow = true;
        leaf.userData.cell = cell;
        group.add(leaf);
      }
      continue;
    }

    const mat = getBlockMaterial(THREE, item);
    const geo =
      item.height === 1 ? unit : new THREE.BoxGeometry(1, item.height, 1);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(px, py + item.height / 2, pz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.cell = cell;
    group.add(mesh);
  }
  return group;
}

// Dispose ONLY geometries in a group whose materials are cached/shared (plots).
export function disposeGeometriesOnly(group: THREEType.Object3D) {
  group.traverse((o) => {
    const m = o as THREEType.Mesh;
    if (m.geometry) m.geometry.dispose();
  });
}

// Dispose geometries AND materials (for groups that own their materials).
export function disposeGroup(group: THREEType.Object3D) {
  group.traverse((o) => {
    const m = o as THREEType.Mesh;
    if (m.geometry) m.geometry.dispose();
    const mat = m.material as THREEType.Material | THREEType.Material[] | undefined;
    if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
    else if (mat) mat.dispose();
  });
}
