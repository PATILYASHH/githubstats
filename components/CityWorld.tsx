"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";
import { buildPlotGroup, disposeGroup } from "@/lib/plot3d";
import { PLOT_SIZE, type Layout } from "@/lib/games/store";

export interface CityPlot {
  login: string;
  layout: Layout;
}

const ROAD = 4; // tiles of road between plots
const PITCH = PLOT_SIZE + ROAD;

function makeLabel(text: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "rgba(13,17,23,0.82)";
  ctx.fillRect(0, 0, 256, 64);
  ctx.strokeStyle = "#30363d";
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, 252, 60);
  ctx.fillStyle = "#e6edf3";
  ctx.font = "bold 26px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text.slice(0, 16), 128, 33);
  const tex = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(5, 1.25, 1);
  return sprite;
}

// A walkable shared city: every player's plot laid out in a grid with roads.
// Click to look around (pointer lock), WASD/arrows to walk.
export default function CityWorld({ plots }: { plots: CityPlot[] }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const [locked, setLocked] = useState(false);

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

    const list = plots.slice(0, 200);
    const cols = Math.max(1, Math.ceil(Math.sqrt(list.length || 1)));
    const rows = Math.max(1, Math.ceil((list.length || 1) / cols));
    const spanX = (cols - 1) * PITCH;
    const spanZ = (rows - 1) * PITCH;

    const w = mount.clientWidth || 800;
    const h = mount.clientHeight || 520;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#8ec5ff"); // daytime sky
    scene.fog = new THREE.Fog("#8ec5ff", 50, 220);

    const camera = new THREE.PerspectiveCamera(70, w / h, 0.1, 600);
    camera.position.set(0, 1.7, spanZ / 2 + PITCH);
    camera.lookAt(0, 1.7, 0);

    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xcfe8ff, 0x4a5a3a, 0.95));
    scene.add(new THREE.AmbientLight(0xffffff, 0.3));
    const sun = new THREE.DirectionalLight(0xffffff, 0.9);
    sun.position.set(40, 60, 20);
    scene.add(sun);

    // stone road ground covering the whole city (plots sit on top as grass)
    const groundW = spanX + PITCH * 2;
    const groundD = spanZ + PITCH * 2;
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(groundW, groundD),
      new THREE.MeshStandardMaterial({ color: "#707070", roughness: 1, flatShading: true })
    );
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);
    const grid = new THREE.GridHelper(
      Math.max(groundW, groundD),
      Math.round(Math.max(groundW, groundD) / 2),
      0x8a8a8a,
      0x5f5f5f
    );
    grid.position.y = 0.02;
    scene.add(grid);

    // plots + labels
    const groups: THREE.Object3D[] = [];
    const sprites: THREE.Sprite[] = [];
    list.forEach((p, k) => {
      const col = k % cols;
      const row = Math.floor(k / cols);
      const x = col * PITCH - spanX / 2;
      const z = row * PITCH - spanZ / 2;
      const g = buildPlotGroup(THREE, p.layout);
      g.position.set(x, 0, z);
      scene.add(g);
      groups.push(g);

      const label = makeLabel(p.login);
      label.position.set(x, 5, z);
      scene.add(label);
      sprites.push(label);
    });

    const controls = new PointerLockControls(camera, renderer.domElement);
    const onLock = () => setLocked(true);
    const onUnlock = () => setLocked(false);
    controls.addEventListener("lock", onLock);
    controls.addEventListener("unlock", onUnlock);
    const onClick = () => controls.lock();
    renderer.domElement.addEventListener("click", onClick);

    const keys: Record<string, boolean> = {};
    const onKeyDown = (e: KeyboardEvent) => (keys[e.code] = true);
    const onKeyUp = (e: KeyboardEvent) => (keys[e.code] = false);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    const bound = Math.max(groundW, groundD) / 2;
    let prev = performance.now();
    let raf = 0;
    const animate = () => {
      const now = performance.now();
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;
      if (controls.isLocked) {
        const sp = 9 * dt;
        if (keys["KeyW"] || keys["ArrowUp"]) controls.moveForward(sp);
        if (keys["KeyS"] || keys["ArrowDown"]) controls.moveForward(-sp);
        if (keys["KeyA"] || keys["ArrowLeft"]) controls.moveRight(-sp);
        if (keys["KeyD"] || keys["ArrowRight"]) controls.moveRight(sp);
        camera.position.y = 1.7;
        camera.position.x = Math.max(-bound, Math.min(bound, camera.position.x));
        camera.position.z = Math.max(-bound, Math.min(bound, camera.position.z));
      }
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    const onResize = () => {
      const W = mount.clientWidth;
      const H = mount.clientHeight;
      if (!W || !H) return;
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
      renderer.setSize(W, H);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      renderer.domElement.removeEventListener("click", onClick);
      controls.removeEventListener("lock", onLock);
      controls.removeEventListener("unlock", onUnlock);
      controls.dispose();
      groups.forEach(disposeGroup);
      sprites.forEach((s) => {
        s.material.map?.dispose();
        s.material.dispose();
      });
      disposeGroup(ground);
      grid.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [plots]);

  if (failed) {
    return (
      <div className="gitcity-canvas gitcity-failed">
        <p>Your browser couldn&apos;t start WebGL, so the city can&apos;t render.</p>
      </div>
    );
  }

  return (
    <div className="city-world">
      <div ref={mountRef} className="gitcity-canvas" />
      {!locked && (
        <div className="city-world-overlay">
          <p>
            <strong>Click to explore</strong>
          </p>
          <p>WASD / arrows to walk · mouse to look · Esc to release</p>
        </div>
      )}
    </div>
  );
}
