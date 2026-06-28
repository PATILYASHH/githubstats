"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";
import {
  buildPlotGroup,
  disposeGroup,
  disposeGeometriesOnly,
} from "@/lib/plot3d";
import {
  STORE,
  STORE_MAP,
  PLOT_SIZE,
  MAX_BUILD_HEIGHT,
  layoutCost,
  type Layout,
} from "@/lib/games/store";
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
  const [mode, setMode] = useState<"explore" | "edit">("explore");
  const [hotbar, setHotbar] = useState<string[]>(
    STORE.slice(0, 9).map((i) => i.id)
  );
  const [activeSlot, setActiveSlot] = useState(0);
  const [bagOpen, setBagOpen] = useState(false);
  const [balance, setBalance] = useState(budget);
  const [saving, setSaving] = useState<"idle" | "saving" | "saved">("idle");
  const [msg, setMsg] = useState<string | null>(null);

  // refs the imperative game loop / handlers read
  const modeRef = useRef<"explore" | "edit">("explore");
  const bagRef = useRef(false);
  const hotbarRef = useRef(hotbar);
  const activeRef = useRef(0);
  const layoutRef = useRef<Layout>(plots.find((p) => p.mine)?.layout ?? []);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);
  useEffect(() => {
    bagRef.current = bagOpen;
  }, [bagOpen]);
  useEffect(() => {
    hotbarRef.current = hotbar;
  }, [hotbar]);
  useEffect(() => {
    activeRef.current = activeSlot;
  }, [activeSlot]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let alive = true;
    layoutRef.current = plots.find((p) => p.mine)?.layout ?? [];
    setBalance(budget - layoutCost(layoutRef.current));

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
    scene.fog = new THREE.Fog("#8ec5ff", 120, 560);

    const camera = new THREE.PerspectiveCamera(72, w / h, 0.1, 1200);
    camera.position.set(myOrigin.x, 1.7, myOrigin.z + PLOT_SIZE / 2 + 8);
    camera.lookAt(myOrigin.x, 1.5, myOrigin.z);

    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    const groundW = spanX + PITCH * 2;
    const groundD = spanZ + PITCH * 2;

    scene.add(new THREE.HemisphereLight(0xbfe0ff, 0x47502f, 0.85));
    scene.add(new THREE.AmbientLight(0xffffff, 0.25));
    const sun = new THREE.DirectionalLight(0xfff4e0, 1.15);
    sun.position.set(60, 120, 40);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const shadowR = Math.max(groundW, groundD) / 2 + 24;
    const sc = sun.shadow.camera as THREE.OrthographicCamera;
    sc.left = -shadowR;
    sc.right = shadowR;
    sc.top = shadowR;
    sc.bottom = -shadowR;
    sc.near = 10;
    sc.far = 420;
    sc.updateProjectionMatrix();
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.45;
    scene.add(sun);
    scene.add(sun.target);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(groundW, groundD),
      new THREE.MeshStandardMaterial({ color: "#707070", flatShading: true })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
    const grid = new THREE.GridHelper(
      Math.max(groundW, groundD),
      Math.round(Math.max(groundW, groundD) / 4),
      0x8a8a8a,
      0x5f5f5f
    );
    grid.position.y = 0.02;
    scene.add(grid);

    // shared decor (footpaths + street lamps)
    const decor: THREE.Object3D[] = [];
    const footGeo = new THREE.BoxGeometry(PLOT_SIZE + 6, 0.3, PLOT_SIZE + 6);
    const footMat = new THREE.MeshStandardMaterial({
      color: "#b6b6b6",
      flatShading: true,
    });
    const postGeo = new THREE.BoxGeometry(0.4, 4, 0.4);
    const postMat = new THREE.MeshStandardMaterial({ color: "#2b2b2b" });
    const bulbGeo = new THREE.BoxGeometry(0.9, 0.7, 0.9);
    const bulbMat = new THREE.MeshStandardMaterial({
      color: "#ffe08a",
      emissive: "#ffcf5a",
      emissiveIntensity: 0.9,
    });
    function addLamp(x: number, z: number) {
      const lamp = new THREE.Group();
      const post = new THREE.Mesh(postGeo, postMat);
      post.position.y = 2;
      const bulb = new THREE.Mesh(bulbGeo, bulbMat);
      bulb.position.y = 4.2;
      lamp.add(post, bulb);
      lamp.position.set(x, 0, z);
      scene.add(lamp);
      decor.push(lamp);
    }

    // plots: footpath + grass + four street lamps + name label
    const otherGroups: THREE.Object3D[] = [];
    const sprites: THREE.Sprite[] = [];
    let myGroup: THREE.Group | null = null;
    const half = PLOT_SIZE / 2;
    list.forEach((p, k) => {
      const o = originOf(k);

      const foot = new THREE.Mesh(footGeo, footMat);
      foot.position.set(o.x, -0.2, o.z);
      scene.add(foot);
      decor.push(foot);

      const g = buildPlotGroup(THREE, p.layout, p.mine ? "#3f7a36" : "#4a6a3a");
      g.position.set(o.x, 0, o.z);
      scene.add(g);
      if (p.mine) myGroup = g;
      else otherGroups.push(g);

      addLamp(o.x - half - 2, o.z - half - 2);
      addLamp(o.x + half + 2, o.z - half - 2);
      addLamp(o.x - half - 2, o.z + half + 2);
      addLamp(o.x + half + 2, o.z + half + 2);

      const label = makeLabel(p.login, p.mine);
      label.position.set(o.x, 9, o.z);
      scene.add(label);
      sprites.push(label);
    });

    // boundary walls — the edge of the world, you can't walk past them
    const walls: THREE.Object3D[] = [];
    const wallH = 4;
    const wallMat = new THREE.MeshStandardMaterial({
      color: "#8a6f4a",
      flatShading: true,
    });
    const wx = groundW / 2;
    const wz = groundD / 2;
    const wallSpecs: [number, number, number, number, number, number][] = [
      [groundW + 2, wallH, 1, 0, wallH / 2, -wz],
      [groundW + 2, wallH, 1, 0, wallH / 2, wz],
      [1, wallH, groundD + 2, -wx, wallH / 2, 0],
      [1, wallH, groundD + 2, wx, wallH / 2, 0],
    ];
    for (const [gw, gh, gd, px, py, pz] of wallSpecs) {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(gw, gh, gd), wallMat);
      wall.position.set(px, py, pz);
      wall.castShadow = true;
      wall.receiveShadow = true;
      scene.add(wall);
      walls.push(wall);
    }

    // road centre-line markings down the two main avenues
    const lineMat = new THREE.MeshStandardMaterial({ color: "#e6c84a", roughness: 1 });
    const lineGeoX = new THREE.BoxGeometry(2, 0.06, 0.4);
    const lineGeoZ = new THREE.BoxGeometry(0.4, 0.06, 2);
    for (let x = -groundW / 2 + 2; x < groundW / 2; x += 4) {
      const d = new THREE.Mesh(lineGeoX, lineMat);
      d.position.set(x, 0.05, 0);
      scene.add(d);
      decor.push(d);
    }
    for (let z = -groundD / 2 + 2; z < groundD / 2; z += 4) {
      const d = new THREE.Mesh(lineGeoZ, lineMat);
      d.position.set(0, 0.05, z);
      scene.add(d);
      decor.push(d);
    }

    // drifting block clouds
    const cloudMat = new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 1 });
    const cloudGeo = new THREE.BoxGeometry(8, 2, 6);
    const clouds = new THREE.Group();
    const cloudSpan = Math.max(groundW, groundD) + 100;
    for (let i = 0; i < 16; i++) {
      const cl = new THREE.Mesh(cloudGeo, cloudMat);
      cl.position.set(
        ((i * 37) % cloudSpan) - cloudSpan / 2,
        42 + (i % 3) * 5,
        ((i * 53) % cloudSpan) - cloudSpan / 2
      );
      cl.scale.set(0.7 + (i % 4) * 0.5, 1, 0.7 + (i % 3) * 0.6);
      clouds.add(cl);
    }
    scene.add(clouds);

    // highlight box marking where the next block will land
    const boxGeo = new THREE.BoxGeometry(1.02, 1.02, 1.02);
    const hl = new THREE.LineSegments(
      new THREE.EdgesGeometry(boxGeo),
      new THREE.LineBasicMaterial({ color: 0xffffff })
    );
    boxGeo.dispose();
    hl.visible = false;
    scene.add(hl);

    const REACH = 8; // how far you can place/remove blocks (world units)
    const raycaster = new THREE.Raycaster();
    raycaster.far = REACH;
    const centre = new THREE.Vector2(0, 0);
    const half2 = PLOT_SIZE / 2;
    const inPlot = (x: number, z: number) =>
      x >= 0 && x < PLOT_SIZE && z >= 0 && z < PLOT_SIZE;
    type Cell = { x: number; y: number; z: number };
    let placeTarget: Cell | null = null; // empty cell a new block goes into
    let removeTarget: Cell | null = null; // existing block under the crosshair

    function rebuildMine() {
      if (myGroup) {
        scene.remove(myGroup);
        disposeGeometriesOnly(myGroup);
      }
      myGroup = buildPlotGroup(THREE, layoutRef.current, "#3f7a36");
      myGroup.position.set(myOrigin.x, 0, myOrigin.z);
      scene.add(myGroup);
      setBalance(budget - layoutCost(layoutRef.current));
    }

    let saveTimer: ReturnType<typeof setTimeout> | null = null;
    let idleTimer: ReturnType<typeof setTimeout> | null = null;
    let dirty = false; // unsaved changes pending
    function scheduleSave() {
      dirty = true;
      if (saveTimer) clearTimeout(saveTimer);
      setSaving("saving");
      saveTimer = setTimeout(async () => {
        try {
          const res = await fetch("/api/games/plot", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ layout: layoutRef.current }),
          });
          if (!res.ok) throw new Error();
          dirty = false; // only clear after a confirmed save
          if (!alive) return;
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

    const cellKey = (c: { x: number; y?: number; z: number }) =>
      `${c.x},${c.y ?? 0},${c.z}`;

    function place() {
      if (
        !canBuild ||
        modeRef.current !== "edit" ||
        bagRef.current ||
        !placeTarget
      )
        return;
      const key = cellKey(placeTarget);
      if (layoutRef.current.some((p) => cellKey(p) === key)) return;
      const item = STORE_MAP[hotbarRef.current[activeRef.current]];
      if (!item) return;
      const bal = budget - layoutCost(layoutRef.current);
      if (bal < item.price) {
        flash(`Not enough coins for ${item.name}`);
        return;
      }
      layoutRef.current = [
        ...layoutRef.current,
        {
          item: item.id,
          x: placeTarget.x,
          y: placeTarget.y,
          z: placeTarget.z,
        },
      ];
      rebuildMine();
      scheduleSave();
    }
    function remove() {
      if (
        !canBuild ||
        modeRef.current !== "edit" ||
        bagRef.current ||
        !removeTarget
      )
        return;
      const key = cellKey(removeTarget);
      if (!layoutRef.current.some((p) => cellKey(p) === key)) return;
      layoutRef.current = layoutRef.current.filter((p) => cellKey(p) !== key);
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
      if (!controls.isLocked || modeRef.current !== "edit" || bagRef.current)
        return;
      const dir = e.deltaY > 0 ? 1 : -1;
      setActiveSlot((i) => (i + dir + 9) % 9);
    };
    renderer.domElement.addEventListener("wheel", onWheel, { passive: true });

    const keys: Record<string, boolean> = {};
    const onKeyDown = (e: KeyboardEvent) => {
      keys[e.code] = true;
      // Stop Space from scrolling the page while flying in edit mode.
      if (e.code === "Space" && controls.isLocked) e.preventDefault();
      if (e.code === "KeyB" && canBuild) {
        setBagOpen(false);
        setMode((m) => (m === "edit" ? "explore" : "edit"));
      } else if (e.code === "KeyE" && canBuild && modeRef.current === "edit") {
        setBagOpen((b) => {
          if (!b) controls.unlock();
          else controls.lock();
          return !b;
        });
      } else if (
        e.code.startsWith("Digit") &&
        modeRef.current === "edit" &&
        !bagRef.current
      ) {
        const n = parseInt(e.code.slice(5), 10);
        if (n >= 1 && n <= 9) setActiveSlot(n - 1);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => (keys[e.code] = false);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    const limX = groundW / 2 - 1.5; // stop just before the walls
    const limZ = groundD / 2 - 1.5;
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
        // Edit mode = creative flight so you can stack blocks all the way up.
        if (modeRef.current === "edit" && !bagRef.current) {
          const vsp = 7 * dt;
          if (keys["Space"]) camera.position.y += vsp;
          if (keys["ShiftLeft"] || keys["ControlLeft"]) camera.position.y -= vsp;
          camera.position.y = Math.max(
            1.7,
            Math.min(MAX_BUILD_HEIGHT + 5, camera.position.y)
          );
        } else {
          camera.position.y = 1.7;
        }
        camera.position.x = Math.max(-limX, Math.min(limX, camera.position.x));
        camera.position.z = Math.max(-limZ, Math.min(limZ, camera.position.z));
      }

      // raycast the build under the crosshair (edit mode, my plot only) to find
      // where a new block stacks (placeTarget) and which block to remove.
      placeTarget = null;
      removeTarget = null;
      hl.visible = false;
      if (canBuild && modeRef.current === "edit" && !bagRef.current && myGroup) {
        raycaster.setFromCamera(centre, camera);
        const hit = raycaster.intersectObjects(myGroup.children, false)[0];
        if (hit) {
          const ud = hit.object.userData as {
            ground?: boolean;
            cell?: Cell;
          };
          if (ud.cell) {
            // looking at a placed block: remove it, or stack against its face
            removeTarget = { ...ud.cell };
            const n = hit.face?.normal;
            if (n) {
              const tx = ud.cell.x + Math.round(n.x);
              const ty = ud.cell.y + Math.round(n.y);
              const tz = ud.cell.z + Math.round(n.z);
              if (inPlot(tx, tz) && ty >= 0 && ty < MAX_BUILD_HEIGHT)
                placeTarget = { x: tx, y: ty, z: tz };
            }
          } else if (ud.ground) {
            // bare ground: place at level 0 on the tile under the crosshair
            const lx = Math.floor(hit.point.x - myOrigin.x + half2);
            const lz = Math.floor(hit.point.z - myOrigin.z + half2);
            if (inPlot(lx, lz)) placeTarget = { x: lx, y: 0, z: lz };
          }
          const show = placeTarget ?? removeTarget;
          if (show) {
            hl.position.set(
              myOrigin.x + show.x - half2 + 0.5,
              show.y + 0.5,
              myOrigin.z + show.z - half2 + 0.5
            );
            hl.visible = true;
          }
        }
      }

      clouds.position.x += 1.4 * dt;
      if (clouds.position.x > 60) clouds.position.x -= 120;

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
      // Flush any unsaved build so changes can't be lost on navigation.
      if (dirty) {
        try {
          fetch("/api/games/plot", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ layout: layoutRef.current }),
            keepalive: true,
          });
        } catch {
          /* best effort */
        }
      }
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
      if (myGroup) disposeGeometriesOnly(myGroup);
      otherGroups.forEach(disposeGeometriesOnly);
      decor.forEach(disposeGroup);
      walls.forEach(disposeGroup);
      disposeGroup(clouds);
      sprites.forEach((s) => {
        s.material.map?.dispose();
        s.material.dispose();
      });
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

  const activeItem = STORE_MAP[hotbar[activeSlot]];

  return (
    <div className="city-game">
      <div ref={mountRef} className="gitcity-canvas" />

      {/* top HUD */}
      <div className="hud-top">
        {mode === "edit" && (
          <span className="hud-coins">
            <BIcon name="coin" size={16} /> {balance.toLocaleString("en-US")}
          </span>
        )}
        {mode === "edit" && saving !== "idle" && (
          <span className="hud-save">
            {saving === "saving" ? "Saving…" : "Saved ✓"}
          </span>
        )}
      </div>

      {canBuild && (
        <button
          className={`mode-toggle ${mode}`}
          onClick={() => {
            setBagOpen(false);
            setMode((m) => (m === "edit" ? "explore" : "edit"));
          }}
        >
          <BIcon name={mode === "edit" ? "hammer" : "compass"} size={14} />{" "}
          {mode === "edit" ? "Editing" : "Exploring"} · B
        </button>
      )}

      {locked && <div className="hud-crosshair" />}
      {msg && <div className="hud-msg">{msg}</div>}

      {!locked && !bagOpen && (
        <div className="city-world-overlay">
          <p>
            <strong>Click to play</strong>
          </p>
          {mode === "edit" ? (
            <p>
              WASD walk · <b>Space/Shift</b> fly up/down · <b>left-click</b>{" "}
              place (stacks on blocks) · <b>right-click</b> remove · scroll/1-9
              hotbar · <b>E</b> bag · <b>B</b> explore · Esc release
            </p>
          ) : (
            <p>
              WASD walk · mouse look ·{" "}
              {canBuild && (
                <>
                  <b>B</b> to build ·{" "}
                </>
              )}
              Esc release
            </p>
          )}
        </div>
      )}

      {/* hotbar (edit mode) */}
      {canBuild && mode === "edit" && (
        <>
          <div className="hotbar">
            {hotbar.map((id, i) => {
              const it = STORE_MAP[id];
              const poor = !it || balance < it.price;
              return (
                <button
                  key={i}
                  className={`hotbar-slot${i === activeSlot ? " sel" : ""}${
                    poor ? " poor" : ""
                  }`}
                  onClick={() => setActiveSlot(i)}
                  title={it ? `${it.name} — ${it.price}` : "empty"}
                  style={it ? { color: it.color } : undefined}
                >
                  {it && <BIcon name={it.icon} size={18} />}
                  <span className="hotbar-num">{i + 1}</span>
                </button>
              );
            })}
            <button
              className="hotbar-bag"
              onClick={() => setBagOpen(true)}
              title="Open bag (E)"
            >
              <BIcon name="backpack2-fill" size={18} />
            </button>
          </div>
          {activeItem && (
            <div className="hotbar-label">
              {activeItem.name} · <BIcon name="coin" size={12} />{" "}
              {activeItem.price}
            </div>
          )}
        </>
      )}

      {/* bag / full inventory */}
      {bagOpen && (
        <div className="bag" onClick={() => setBagOpen(false)}>
          <div className="bag-panel" onClick={(e) => e.stopPropagation()}>
            <div className="bag-head">
              <strong>
                <BIcon name="backpack2-fill" size={16} /> Inventory
              </strong>
              <span>Click an item to put it in slot {activeSlot + 1}</span>
              <button className="bag-close" onClick={() => setBagOpen(false)}>
                <BIcon name="x-lg" size={16} />
              </button>
            </div>
            <div className="bag-grid">
              {STORE.map((it) => (
                <button
                  key={it.id}
                  className={`bag-item${balance < it.price ? " poor" : ""}`}
                  onClick={() => {
                    setHotbar((hb) => {
                      const n = [...hb];
                      n[activeSlot] = it.id;
                      return n;
                    });
                    setBagOpen(false);
                  }}
                  title={`${it.name} — ${it.price}`}
                >
                  <span className="bag-ico" style={{ color: it.color }}>
                    <BIcon name={it.icon} size={20} />
                  </span>
                  <span className="bag-name">{it.name}</span>
                  <span className="bag-price">
                    <BIcon name="coin" size={11} /> {it.price}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
