"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";
import { buildPlotGroup, disposeGroup } from "@/lib/plot3d";
import { STORE, PLOT_SIZE, layoutCost, type Layout } from "@/lib/games/store";
import { BIcon } from "./icons";

export interface GamePlot {
  login: string;
  layout: Layout;
  mine: boolean;
}

const ROAD = 4;
const PITCH = PLOT_SIZE + ROAD;

function makeLabel(text: string, mine: boolean) {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 64;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = mine ? "rgba(35,134,54,0.9)" : "rgba(13,17,23,0.82)";
  ctx.fillRect(0, 0, 256, 64);
  ctx.fillStyle = "#fff";
  ctx.font = "bold 26px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(mine ? `${text} (you)` : text, 128, 33);
  const tex = new THREE.CanvasTexture(c);
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: tex, transparent: true })
  );
  sprite.scale.set(5, 1.25, 1);
  return sprite;
}

export default function CityGame({
  plots,
  budget,
  canBuild,
}: {
  plots: GamePlot[];
  budget: number;
  canBuild: boolean;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const [locked, setLocked] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [balance, setBalance] = useState(budget);
  const [saving, setSaving] = useState<"idle" | "saving" | "saved">("idle");
  const [msg, setMsg] = useState<string | null>(null);

  // refs the imperative game loop / handlers read
  const selRef = useRef(0);
  const layoutRef = useRef<Layout>(
    plots.find((p) => p.mine)?.layout ?? []
  );

  useEffect(() => {
    selRef.current = selectedIdx;
  }, [selectedIdx]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let alive = true;
    layoutRef.current = plots.find((p) => p.mine)?.layout ?? [];

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true });
    } catch {
      setFailed(true);
      return;
    }

    const list = plots.slice(0, 25);
    const cols = Math.max(1, Math.ceil(Math.sqrt(list.length || 1)));
    const rows = Math.max(1, Math.ceil((list.length || 1) / cols));
    const spanX = (cols - 1) * PITCH;
    const spanZ = (rows - 1) * PITCH;
    const originOf = (k: number) => ({
      x: (k % cols) * PITCH - spanX / 2,
      z: Math.floor(k / cols) * PITCH - spanZ / 2,
    });
    const myIndex = list.findIndex((p) => p.mine);
    const myOrigin = myIndex >= 0 ? originOf(myIndex) : { x: 0, z: 0 };

    const w = mount.clientWidth || 800;
    const h = mount.clientHeight || 540;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#8ec5ff");
    scene.fog = new THREE.Fog("#8ec5ff", 60, 240);

    const camera = new THREE.PerspectiveCamera(72, w / h, 0.1, 600);
    camera.position.set(myOrigin.x, 1.7, myOrigin.z + PLOT_SIZE / 2 + 3);
    camera.lookAt(myOrigin.x, 1.5, myOrigin.z);

    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xcfe8ff, 0x4a5a3a, 0.95));
    scene.add(new THREE.AmbientLight(0xffffff, 0.3));
    const sun = new THREE.DirectionalLight(0xffffff, 0.9);
    sun.position.set(40, 70, 20);
    scene.add(sun);

    const groundW = spanX + PITCH * 2;
    const groundD = spanZ + PITCH * 2;
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(groundW, groundD),
      new THREE.MeshStandardMaterial({ color: "#707070", flatShading: true })
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

    // plots
    const otherGroups: THREE.Object3D[] = [];
    const sprites: THREE.Sprite[] = [];
    let myGroup: THREE.Group | null = null;
    list.forEach((p, k) => {
      const o = originOf(k);
      const g = buildPlotGroup(THREE, p.layout, p.mine ? "#3f7a36" : "#4a6a3a");
      g.position.set(o.x, 0, o.z);
      scene.add(g);
      if (p.mine) myGroup = g;
      else otherGroups.push(g);
      const label = makeLabel(p.login, p.mine);
      label.position.set(o.x, 5, o.z);
      scene.add(label);
      sprites.push(label);
    });

    // interaction plane over my plot + highlight box
    const interact = new THREE.Mesh(
      new THREE.PlaneGeometry(PLOT_SIZE, PLOT_SIZE),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    interact.rotation.x = -Math.PI / 2;
    interact.position.set(myOrigin.x, 0.05, myOrigin.z);
    scene.add(interact);

    const boxGeo = new THREE.BoxGeometry(1, 1, 1);
    const hl = new THREE.LineSegments(
      new THREE.EdgesGeometry(boxGeo),
      new THREE.LineBasicMaterial({ color: 0xffffff })
    );
    boxGeo.dispose();
    hl.visible = false;
    scene.add(hl);

    const raycaster = new THREE.Raycaster();
    const centre = new THREE.Vector2(0, 0);
    let target: { x: number; z: number } | null = null;

    function rebuildMine() {
      if (myGroup) {
        scene.remove(myGroup);
        disposeGroup(myGroup);
      }
      myGroup = buildPlotGroup(THREE, layoutRef.current, "#3f7a36");
      myGroup.position.set(myOrigin.x, 0, myOrigin.z);
      scene.add(myGroup);
      setBalance(budget - layoutCost(layoutRef.current));
    }

    let saveTimer: ReturnType<typeof setTimeout> | null = null;
    let idleTimer: ReturnType<typeof setTimeout> | null = null;
    function scheduleSave() {
      if (saveTimer) clearTimeout(saveTimer);
      setSaving("saving");
      saveTimer = setTimeout(async () => {
        try {
          const res = await fetch("/api/games/plot", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ layout: layoutRef.current }),
          });
          if (!alive) return;
          if (!res.ok) throw new Error();
          setSaving("saved");
          idleTimer = setTimeout(() => {
            if (alive) setSaving("idle");
          }, 1500);
        } catch {
          if (!alive) return;
          setSaving("idle");
          flash("Save failed");
        }
      }, 700);
    }

    let msgTimer: ReturnType<typeof setTimeout> | null = null;
    function flash(m: string) {
      setMsg(m);
      if (msgTimer) clearTimeout(msgTimer);
      msgTimer = setTimeout(() => setMsg(null), 1500);
    }

    const controls = new PointerLockControls(camera, renderer.domElement);
    const onLock = () => setLocked(true);
    const onUnlock = () => setLocked(false);
    controls.addEventListener("lock", onLock);
    controls.addEventListener("unlock", onUnlock);
    const onClickCanvas = () => controls.lock();
    renderer.domElement.addEventListener("click", onClickCanvas);

    function place() {
      if (!canBuild || !target) return;
      const key = `${target.x},${target.z}`;
      if (layoutRef.current.some((p) => `${p.x},${p.z}` === key)) return;
      const item = STORE[selRef.current];
      const bal = budget - layoutCost(layoutRef.current);
      if (bal < item.price) {
        flash(`Not enough coins for ${item.name}`);
        return;
      }
      layoutRef.current = [
        ...layoutRef.current,
        { item: item.id, x: target.x, z: target.z },
      ];
      rebuildMine();
      scheduleSave();
    }
    function remove() {
      if (!canBuild || !target) return;
      const key = `${target.x},${target.z}`;
      if (!layoutRef.current.some((p) => `${p.x},${p.z}` === key)) return;
      layoutRef.current = layoutRef.current.filter(
        (p) => `${p.x},${p.z}` !== key
      );
      rebuildMine();
      scheduleSave();
    }

    const onMouseDown = (e: MouseEvent) => {
      if (!controls.isLocked) return;
      if (e.button === 0) place();
      else if (e.button === 2) remove();
    };
    const onContext = (e: MouseEvent) => e.preventDefault();
    renderer.domElement.addEventListener("mousedown", onMouseDown);
    renderer.domElement.addEventListener("contextmenu", onContext);

    const onWheel = (e: WheelEvent) => {
      if (!controls.isLocked) return;
      const dir = e.deltaY > 0 ? 1 : -1;
      setSelectedIdx((i) => (i + dir + STORE.length) % STORE.length);
    };
    renderer.domElement.addEventListener("wheel", onWheel, { passive: true });

    const keys: Record<string, boolean> = {};
    const onKeyDown = (e: KeyboardEvent) => {
      keys[e.code] = true;
      if (e.code.startsWith("Digit")) {
        const n = parseInt(e.code.slice(5), 10);
        if (n >= 1 && n <= 9 && n <= STORE.length) setSelectedIdx(n - 1);
      }
    };
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
        const sp = 8 * dt;
        if (keys["KeyW"] || keys["ArrowUp"]) controls.moveForward(sp);
        if (keys["KeyS"] || keys["ArrowDown"]) controls.moveForward(-sp);
        if (keys["KeyA"] || keys["ArrowLeft"]) controls.moveRight(-sp);
        if (keys["KeyD"] || keys["ArrowRight"]) controls.moveRight(sp);
        camera.position.y = 1.7;
        camera.position.x = Math.max(-bound, Math.min(bound, camera.position.x));
        camera.position.z = Math.max(-bound, Math.min(bound, camera.position.z));
      }

      // target tile under crosshair (on my plot)
      target = null;
      hl.visible = false;
      if (canBuild) {
        raycaster.setFromCamera(centre, camera);
        const hit = raycaster.intersectObject(interact)[0];
        if (hit) {
          const lx = Math.floor(hit.point.x - myOrigin.x + PLOT_SIZE / 2);
          const lz = Math.floor(hit.point.z - myOrigin.z + PLOT_SIZE / 2);
          if (lx >= 0 && lx < PLOT_SIZE && lz >= 0 && lz < PLOT_SIZE) {
            target = { x: lx, z: lz };
            hl.position.set(
              myOrigin.x + lx - PLOT_SIZE / 2 + 0.5,
              0.5,
              myOrigin.z + lz - PLOT_SIZE / 2 + 0.5
            );
            hl.visible = true;
          }
        }
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
      alive = false;
      cancelAnimationFrame(raf);
      if (saveTimer) clearTimeout(saveTimer);
      if (idleTimer) clearTimeout(idleTimer);
      if (msgTimer) clearTimeout(msgTimer);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      renderer.domElement.removeEventListener("click", onClickCanvas);
      renderer.domElement.removeEventListener("mousedown", onMouseDown);
      renderer.domElement.removeEventListener("contextmenu", onContext);
      renderer.domElement.removeEventListener("wheel", onWheel);
      controls.removeEventListener("lock", onLock);
      controls.removeEventListener("unlock", onUnlock);
      controls.dispose();
      if (myGroup) disposeGroup(myGroup);
      otherGroups.forEach(disposeGroup);
      sprites.forEach((s) => {
        s.material.map?.dispose();
        s.material.dispose();
      });
      disposeGroup(interact);
      hl.geometry.dispose();
      (hl.material as THREE.Material).dispose();
      disposeGroup(ground);
      grid.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plots, budget, canBuild]);

  if (failed) {
    return (
      <div className="gitcity-canvas gitcity-failed">
        <p>Your browser couldn&apos;t start WebGL, so the game can&apos;t run.</p>
      </div>
    );
  }

  const sel = STORE[selectedIdx];

  return (
    <div className="city-game">
      <div ref={mountRef} className="gitcity-canvas" />

      {/* HUD */}
      <div className="hud-top">
        <span className="hud-coins">
          <BIcon name="coin" size={16} /> {balance.toLocaleString("en-US")}
        </span>
        {canBuild && saving !== "idle" && (
          <span className="hud-save">
            {saving === "saving" ? "Saving…" : "Saved ✓"}
          </span>
        )}
      </div>

      {locked && <div className="hud-crosshair" />}
      {msg && <div className="hud-msg">{msg}</div>}

      {!locked && (
        <div className="city-world-overlay">
          <p>
            <strong>Click to play</strong>
          </p>
          {canBuild ? (
            <p>
              WASD walk · mouse look · <b>left-click</b> build · <b>right-click</b>{" "}
              remove · scroll/1-9 pick block · Esc release
            </p>
          ) : (
            <p>WASD walk · mouse look · Esc release</p>
          )}
        </div>
      )}

      {canBuild && (
        <div className="hotbar">
          {STORE.map((it, i) => {
            const poor = balance < it.price;
            return (
              <button
                key={it.id}
                className={`hotbar-slot${i === selectedIdx ? " sel" : ""}${
                  poor ? " poor" : ""
                }`}
                onClick={() => setSelectedIdx(i)}
                title={`${it.name} — ${it.price}`}
                style={{ color: it.color }}
              >
                <BIcon name={it.icon} size={18} />
              </button>
            );
          })}
        </div>
      )}

      {canBuild && (
        <div className="hotbar-label">
          {sel.name} · <BIcon name="coin" size={12} /> {sel.price}
        </div>
      )}
    </div>
  );
}
