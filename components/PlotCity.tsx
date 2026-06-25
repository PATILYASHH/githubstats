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
    scene.background = new THREE.Color("#8ec5ff"); // daytime sky
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 400);
    camera.position.set(0, PLOT_SIZE * 0.85, PLOT_SIZE * 1.15);

    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.maxPolarAngle = Math.PI / 2.15;
    controls.minDistance = 10;
    controls.maxDistance = 170;
    controls.target.set(0, 2, 0);

    scene.add(new THREE.HemisphereLight(0xcfe8ff, 0x3a5a32, 0.95));
    scene.add(new THREE.AmbientLight(0xffffff, 0.35));
    const sun = new THREE.DirectionalLight(0xffffff, 0.9);
    sun.position.set(8, 16, 6);
    scene.add(sun);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(PLOT_SIZE * 2.2, PLOT_SIZE * 2.2),
      new THREE.MeshStandardMaterial({ color: "#3f6336", flatShading: true })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1.01;
    scene.add(ground);

    const grid = new THREE.GridHelper(PLOT_SIZE, PLOT_SIZE, 0x2c4a26, 0x35562d);
    grid.position.y = 0.02;
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
      renderer.forceContextLoss();
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
