"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export interface CityDay {
  date: string;
  count: number;
}

// Renders a user's recent contribution history as an explorable 3D city.
// Each day is a building: height scales with that day's commits, colour with
// intensity. Empty days are flat plots (a house yet to be built). Orbit to look
// around. This is the v1 — walking, multiplayer and the economy come later.
export default function GitCity({ days }: { days: CityDay[] }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true });
    } catch {
      setFailed(true);
      return;
    }

    const width = mount.clientWidth || 800;
    const height = mount.clientHeight || 460;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#0a0e14");
    scene.fog = new THREE.Fog("#0a0e14", 35, 110);

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 500);
    camera.position.set(24, 26, 34);

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxPolarAngle = Math.PI / 2.15; // don't dip below ground
    controls.minDistance = 8;
    controls.maxDistance = 90;
    controls.target.set(0, 1, 0);

    scene.add(new THREE.AmbientLight(0xffffff, 0.65));
    const sun = new THREE.DirectionalLight(0xffffff, 0.95);
    sun.position.set(25, 45, 20);
    scene.add(sun);

    // --- layout: last 52 weeks laid out like the contribution heatmap ---
    const recent = days.slice(-7 * 52);
    const cols = Math.max(1, Math.ceil(recent.length / 7));
    const spacing = 1.25;
    const offX = (cols * spacing) / 2;
    const offZ = (7 * spacing) / 2;
    const maxCount = Math.max(1, ...recent.map((d) => d.count));

    // ground + roads
    const groundGeo = new THREE.PlaneGeometry(cols * spacing + 10, 7 * spacing + 10);
    const groundMat = new THREE.MeshStandardMaterial({ color: "#0d1117" });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.02;
    scene.add(ground);

    const gridSize = Math.max(cols * spacing, 12) + 10;
    const grid = new THREE.GridHelper(gridSize, Math.round(gridSize), 0x30363d, 0x1b2129);
    scene.add(grid);

    // buildings (one instanced mesh for the whole city)
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const mat = new THREE.MeshStandardMaterial({ roughness: 0.7, metalness: 0.05 });
    const mesh = new THREE.InstancedMesh(geo, mat, recent.length);
    const dummy = new THREE.Object3D();
    const dim = new THREE.Color("#0e4429");
    const bright = new THREE.Color("#39d353");

    recent.forEach((d, i) => {
      const week = Math.floor(i / 7);
      const dow = i % 7;
      const h = d.count === 0 ? 0.08 : Math.min(9, 0.4 + d.count * 0.5);
      dummy.position.set(week * spacing - offX, h / 2, dow * spacing - offZ);
      dummy.scale.set(0.95, h, 0.95);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      const c =
        d.count === 0
          ? new THREE.Color("#161b22")
          : new THREE.Color()
              .copy(dim)
              .lerp(bright, Math.min(1, d.count / Math.max(8, maxCount * 0.6)));
      mesh.setColorAt(i, c);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    scene.add(mesh);

    let raf = 0;
    const animate = () => {
      controls.update();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    const onResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      if (!w || !h) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      controls.dispose();
      mesh.dispose(); // frees instanceMatrix/instanceColor GPU buffers
      geo.dispose();
      mat.dispose();
      groundGeo.dispose();
      groundMat.dispose();
      grid.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [days]);

  if (failed) {
    return (
      <div className="gitcity-canvas gitcity-failed">
        <p>Your browser couldn&apos;t start WebGL, so the 3D city can&apos;t render here.</p>
      </div>
    );
  }

  return <div ref={mountRef} className="gitcity-canvas" />;
}
