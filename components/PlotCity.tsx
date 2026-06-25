"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { buildPlotGroup, disposeGroup } from "@/lib/plot3d";
import { PLOT_SIZE, type Layout } from "@/lib/games/store";

// Orbit view of a single plot. Scene is set up once; only the plot group is
// rebuilt when the layout changes, so the camera stays put while editing.
export default function PlotCity({ layout }: { layout: Layout }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const plotRef = useRef<THREE.Group | null>(null);
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

    const w = mount.clientWidth || 800;
    const h = mount.clientHeight || 460;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#0a0e14");
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 200);
    camera.position.set(PLOT_SIZE, PLOT_SIZE * 1.1, PLOT_SIZE * 1.5);

    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.maxPolarAngle = Math.PI / 2.15;
    controls.minDistance = 4;
    controls.maxDistance = 38;
    controls.target.set(0, 0.5, 0);

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const sun = new THREE.DirectionalLight(0xffffff, 0.9);
    sun.position.set(8, 16, 6);
    scene.add(sun);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 40),
      new THREE.MeshStandardMaterial({ color: "#0d1117" })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.31;
    scene.add(ground);

    const grid = new THREE.GridHelper(PLOT_SIZE, PLOT_SIZE, 0x30363d, 0x1b2129);
    grid.position.y = 0.01;
    scene.add(grid);

    let raf = 0;
    const animate = () => {
      controls.update();
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
      controls.dispose();
      disposeGroup(ground);
      grid.dispose();
      renderer.dispose();
      sceneRef.current = null;
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Rebuild only the plot group when the layout changes.
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    const plot = buildPlotGroup(THREE, layout);
    scene.add(plot);
    plotRef.current = plot;
    return () => {
      scene.remove(plot);
      disposeGroup(plot);
      if (plotRef.current === plot) plotRef.current = null;
    };
  }, [layout]);

  if (failed) {
    return (
      <div className="gitcity-canvas gitcity-failed">
        <p>Your browser couldn&apos;t start WebGL.</p>
      </div>
    );
  }
  return <div ref={mountRef} className="gitcity-canvas" />;
}
