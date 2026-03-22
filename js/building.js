import * as THREE from 'three';

// ============================================================
// 30 Rockefeller Plaza — Apple Maps visual accuracy rebuild
// ============================================================
// Scale: 1 unit ≈ 1 meter.  Origin = 30 Rock center.
// X = east(+)/west(−)   Z = north(+)/south(−)   Y = up
// ============================================================

const FLOOR_H = 3.66;
const LOBBY_H = 7.3;
const BASEMENT_H = 4.0;

// Setback tiers — dimensions verified against aerial imagery
// w = east-west (narrow slab axis)   d = north-south (wide slab axis)
const TIERS = [
  { label: 'basement',  startFloor: -3, endFloor: -1, w: 90, d: 68, xOff: 0 },
  { label: 'base',      startFloor: 0,  endFloor: 6,  w: 90, d: 68, xOff: 0 },
  { label: 'low-rise',  startFloor: 7,  endFloor: 16, w: 68, d: 64, xOff: 4 },
  { label: 'tower-low', startFloor: 17, endFloor: 33, w: 26, d: 58, xOff: 5 },
  { label: 'setback-1', startFloor: 34, endFloor: 44, w: 26, d: 48, xOff: 5 },
  { label: 'setback-2', startFloor: 45, endFloor: 54, w: 23, d: 40, xOff: 5 },
  { label: 'setback-3', startFloor: 55, endFloor: 65, w: 20, d: 32, xOff: 5 },
  { label: 'crown',     startFloor: 66, endFloor: 70, w: 17, d: 24, xOff: 5 },
];

// ── Facade texture ──────────────────────────────────────────
// Dark vertical window bands with thin limestone piers — matches
// the real building's Art Deco facade as seen in Apple Maps.
const _texCache = {};

export function createFacadeTexture(facadeW, bgColor = '#D4C5A8') {
  const k = `${Math.round(facadeW)}_${bgColor}`;
  if (_texCache[k]) return _texCache[k];

  const canvas = document.createElement('canvas');
  const W = 512, H = 256;
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');

  // Indiana limestone background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, W, H);

  const cols = 10, rows = 3;
  const bayW = W / cols, flH = H / rows;
  const winWR = 0.72, winHR = 0.86; // window fills 72% width, 86% height

  // Dark window panes
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const wx = c * bayW + bayW * (1 - winWR) / 2;
      const wy = r * flH + flH * (1 - winHR) / 2;
      ctx.fillStyle = '#1A1E28';
      ctx.fillRect(wx, wy, bayW * winWR, flH * winHR);
      // Glass reflection highlight
      ctx.fillStyle = 'rgba(70,110,160,0.05)';
      ctx.fillRect(wx + 1, wy + 1, bayW * winWR * 0.3, flH * winHR * 0.1);
    }
  }

  // Vertical limestone piers (re-paint over window edges for crispness)
  ctx.fillStyle = bgColor;
  const pw = bayW * (1 - winWR);
  for (let c = 0; c <= cols; c++) ctx.fillRect(c * bayW - pw / 2, 0, pw, H);

  // Horizontal spandrel lines
  ctx.fillStyle = '#C5B99A';
  for (let r = 0; r <= rows; r++) ctx.fillRect(0, r * flH - 1.5, W, 3);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(facadeW / 20, 1);
  _texCache[k] = tex;
  return tex;
}

// ── Materials ───────────────────────────────────────────────
const roofMat = new THREE.MeshStandardMaterial({ color: 0xD4B0A0, roughness: 0.7 });
const basementMat = new THREE.MeshStandardMaterial({ color: 0x3A3A44, roughness: 0.8, transparent: true, opacity: 0.7 });
const lobbyMat = new THREE.MeshStandardMaterial({ color: 0x4A4A54, roughness: 0.3, metalness: 0.15 });

function floorMaterials(floorNum, tierW) {
  if (floorNum < 0) return basementMat;
  if (floorNum === 0) return [lobbyMat, lobbyMat, roofMat, roofMat, lobbyMat, lobbyMat];
  const fac = new THREE.MeshStandardMaterial({ map: createFacadeTexture(tierW), roughness: 0.5, metalness: 0.03 });
  return [fac, fac, roofMat, roofMat, fac, fac];
}

// Selection materials
const selectedMat = new THREE.MeshStandardMaterial({
  color: 0x00AAFF, emissive: 0x00AAFF, emissiveIntensity: 0.35, roughness: 0.4, metalness: 0.2
});
const hoverMat = new THREE.MeshStandardMaterial({
  color: 0xD2C9B0, emissive: 0x00AAFF, emissiveIntensity: 0.12, roughness: 0.6, metalness: 0.05
});
export function getSelectedMaterial() { return selectedMat; }
export function getHoverMaterial() { return hoverMat; }

// ============================================================
export function createBuilding(scene) {
  const group = new THREE.Group();
  const floorMeshes = [];
  const outdoorMeshes = [];

  // ── Per-floor meshes ──
  for (const tier of TIERS) {
    for (let f = tier.startFloor; f <= tier.endFloor; f++) {
      const isLobby = f === 0, isBsmt = f < 0;
      const h = isLobby ? LOBBY_H : (isBsmt ? BASEMENT_H : FLOOR_H);
      const mat = floorMaterials(f, tier.w);
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(tier.w, h, tier.d), mat);
      let y;
      if (f < 0) y = f * BASEMENT_H + BASEMENT_H / 2;
      else if (f === 0) y = LOBBY_H / 2;
      else y = LOBBY_H + (f - 1) * FLOOR_H + FLOOR_H / 2;
      mesh.position.set(tier.xOff, y, 0);
      mesh.castShadow = true; mesh.receiveShadow = true;
      mesh.userData = {
        type: 'floor', floorNumber: f,
        floorId: f < 0 ? `B${Math.abs(f)}` : `F${f}`,
        buildingId: '30ROCK', tier: tier.label, defaultMaterial: mat
      };
      floorMeshes.push(mesh);
      group.add(mesh);
    }
  }

  // ── Green terrace patches on setback ledges ──
  const greenMat = new THREE.MeshStandardMaterial({ color: 0x6BA34A, roughness: 0.8 });
  function greenPatch(x, y, z, w, d) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w, d), greenMat);
    p.rotation.x = -Math.PI / 2;
    p.position.set(x, y + 0.05, z);
    group.add(p);
  }
  // Base → low-rise setback (top of floor 6)
  const baseTop = LOBBY_H + 5 * FLOOR_H + FLOOR_H;
  greenPatch(38, baseTop, 0, 10, 55);   // east ledge
  greenPatch(-36, baseTop, 0, 10, 55);  // west ledge
  // Low-rise → tower setback (top of floor 16)
  const lrTop = LOBBY_H + 15 * FLOOR_H + FLOOR_H;
  greenPatch(26, lrTop, 22, 8, 14);     // NE ledge
  greenPatch(26, lrTop, -22, 8, 14);    // SE ledge
  greenPatch(-16, lrTop, 22, 8, 14);    // NW ledge
  greenPatch(-16, lrTop, -22, 8, 14);   // SW ledge

  // ── Observation Deck ──
  const topY = LOBBY_H + 69 * FLOOR_H + FLOOR_H;
  const obsH = FLOOR_H * 1.5, obsW = 15, obsD = 22;
  const obsY = topY + obsH / 2;
  const obsMat = new THREE.MeshStandardMaterial({
    color: 0x88AACC, roughness: 0.2, metalness: 0.4, transparent: true, opacity: 0.7
  });
  const obsMesh = new THREE.Mesh(new THREE.BoxGeometry(obsW, obsH, obsD), obsMat);
  obsMesh.position.set(5, obsY, 0);
  obsMesh.castShadow = true;
  obsMesh.userData = {
    type: 'floor', floorNumber: 71, floorId: 'OBS', buildingId: '30ROCK',
    tier: 'observation', defaultMaterial: obsMat
  };
  floorMeshes.push(obsMesh); group.add(obsMesh);

  // Railings
  const railMat = new THREE.MeshStandardMaterial({ color: 0x888899, roughness: 0.5, metalness: 0.6 });
  const rTop = obsY + obsH / 2 + 0.6;
  for (const s of [-1, 1]) {
    const r1 = new THREE.Mesh(new THREE.BoxGeometry(obsW + 0.5, 1.2, 0.15), railMat);
    r1.position.set(5, rTop, s * obsD / 2); group.add(r1);
    const r2 = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.2, obsD + 0.5), railMat);
    r2.position.set(5 + s * obsW / 2, rTop, 0); group.add(r2);
  }

  // Penthouse / mechanical
  const ph = new THREE.Mesh(
    new THREE.BoxGeometry(7, 5, 10),
    new THREE.MeshStandardMaterial({ color: 0x555566, roughness: 0.8 })
  );
  ph.position.set(5, obsY + obsH / 2 + 1.2 + 2.5, 0); ph.castShadow = true; group.add(ph);

  // Crown fins
  const finMat = new THREE.MeshStandardMaterial({ color: 0xA09070, roughness: 0.4, metalness: 0.3 });
  for (const xs of [-1, 1]) for (const zs of [-1, 1]) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(1.5, 8, 1.5), finMat);
    fin.position.set(5 + xs * 8, topY + 4, zs * 11); group.add(fin);
  }

  // "Wisdom" relief — gold accent above east entrance
  const wisdom = new THREE.Mesh(
    new THREE.BoxGeometry(12, 8, 0.5),
    new THREE.MeshStandardMaterial({ color: 0xFFD700, roughness: 0.3, metalness: 0.7 })
  );
  wisdom.position.set(5, LOBBY_H + 4, 34.5); group.add(wisdom);

  scene.add(group);

  // ══════════════════════════════════════════════════════════
  // OUTDOOR AREAS
  // ══════════════════════════════════════════════════════════

  // ── Lower Plaza / Skating Rink (sunken) ──
  const rinkG = new THREE.Group();
  rinkG.position.set(58, 0, 0);

  // Sunken floor
  const rinkFloor = new THREE.Mesh(
    new THREE.BoxGeometry(28, 0.5, 22),
    new THREE.MeshStandardMaterial({ color: 0x2a2a35, roughness: 0.7 })
  );
  rinkFloor.position.y = -5; rinkFloor.receiveShadow = true; rinkG.add(rinkFloor);

  // Ice / water surface
  const ice = new THREE.Mesh(
    new THREE.PlaneGeometry(26, 16),
    new THREE.MeshStandardMaterial({ color: 0xA8D8E8, roughness: 0.05, metalness: 0.3 })
  );
  ice.rotation.x = -Math.PI / 2; ice.position.y = -4.7; rinkG.add(ice);

  // Surrounding walls (warm limestone)
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xD4C0A0, roughness: 0.6 });
  for (const s of [-1, 1]) {
    const w1 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 5.5, 22), wallMat);
    w1.position.set(s * 14, -2.5, 0); rinkG.add(w1);
  }
  for (const s of [-1, 1]) {
    const w2 = new THREE.Mesh(new THREE.BoxGeometry(28, 5.5, 0.5), wallMat);
    w2.position.set(0, -2.5, s * 11); rinkG.add(w2);
  }

  // Steps / terraces
  for (let i = 0; i < 3; i++) {
    const step = new THREE.Mesh(
      new THREE.BoxGeometry(30 + i * 3, 0.5, 24 + i * 3),
      new THREE.MeshStandardMaterial({ color: 0xC8B898, roughness: 0.6 })
    );
    step.position.y = -4 + i * 1.8; rinkG.add(step);
  }

  // Prometheus statue
  const ped = new THREE.Mesh(
    new THREE.CylinderGeometry(1, 1.3, 2.5, 8),
    new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.4 })
  );
  ped.position.set(0, -2.5, -10); rinkG.add(ped);
  const prom = new THREE.Mesh(
    new THREE.SphereGeometry(1.5, 16, 12),
    new THREE.MeshStandardMaterial({ color: 0xFFD700, roughness: 0.2, metalness: 0.8 })
  );
  prom.position.set(0, 0, -10); rinkG.add(prom);
  scene.add(rinkG);

  // Rink click target
  const rinkClick = new THREE.Mesh(
    new THREE.PlaneGeometry(28, 22),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  rinkClick.rotation.x = -Math.PI / 2; rinkClick.position.set(58, -2, 0);
  rinkClick.userData = {
    type: 'outdoor', floorId: 'OUT-RINK', floorNumber: -100,
    areaName: 'Lower Plaza — Ice Skating Rink', defaultMaterial: rinkClick.material
  };
  scene.add(rinkClick); outdoorMeshes.push(rinkClick);

  // ── Channel Gardens ──
  const gardenMat = new THREE.MeshStandardMaterial({ color: 0xC8BFA0, roughness: 0.85 });
  const garden = new THREE.Mesh(new THREE.PlaneGeometry(48, 14), gardenMat);
  garden.rotation.x = -Math.PI / 2; garden.position.set(96, 0.05, 0);
  garden.receiveShadow = true;
  garden.userData = {
    type: 'outdoor', floorId: 'OUT-CHANNEL', floorNumber: -101,
    areaName: 'Channel Gardens', defaultMaterial: gardenMat
  };
  scene.add(garden); outdoorMeshes.push(garden);

  // Fountain pools along Channel Gardens
  const poolMat = new THREE.MeshStandardMaterial({ color: 0x4488AA, roughness: 0.1, metalness: 0.2 });
  for (let i = 0; i < 6; i++) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.3, 12), poolMat);
    p.position.set(76 + i * 8, 0.15, 0); scene.add(p);
  }

  // Trees along Channel Gardens
  const treeMat = new THREE.MeshStandardMaterial({ color: 0x3A8A3A, roughness: 0.8 });
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5a3a1a, roughness: 0.9 });
  for (let i = 0; i < 6; i++) {
    for (const s of [-1, 1]) {
      const tk = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 2, 6), trunkMat);
      tk.position.set(78 + i * 7, 1, s * 5.5); tk.castShadow = true; scene.add(tk);
      const cn = new THREE.Mesh(new THREE.SphereGeometry(1.5, 8, 6), treeMat);
      cn.position.set(78 + i * 7, 3, s * 5.5); cn.castShadow = true; scene.add(cn);
    }
  }

  // ── Rockefeller Plaza (private street) ──
  const plazaSt = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 160),
    new THREE.MeshStandardMaterial({ color: 0x333340, roughness: 0.85 })
  );
  plazaSt.rotation.x = -Math.PI / 2; plazaSt.position.set(48, 0.03, 0);
  plazaSt.receiveShadow = true;
  plazaSt.userData = {
    type: 'outdoor', floorId: 'OUT-PLAZA', floorNumber: -102,
    areaName: 'Rockefeller Plaza', defaultMaterial: plazaSt.material
  };
  scene.add(plazaSt); outdoorMeshes.push(plazaSt);

  // Flagpoles
  const fpMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.6, roughness: 0.3 });
  const fColors = [0xFF0000, 0x0000FF, 0x00AA00, 0xFFFF00, 0xFF6600, 0x9900FF, 0x00AAFF, 0xFF0066, 0x00FF88, 0xFFAA00];
  for (let i = 0; i < 10; i++) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 8, 4), fpMat);
    pole.position.set(48, 4, -30 + i * 6.5); scene.add(pole);
    const fl = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 1.2),
      new THREE.MeshStandardMaterial({ color: fColors[i], side: THREE.DoubleSide, roughness: 0.8 })
    );
    fl.position.set(49.2, 7.2, -30 + i * 6.5); scene.add(fl);
  }

  // ── Green lawn areas (south side, near NBC Studios / Today Show) ──
  const lawnMat = new THREE.MeshStandardMaterial({ color: 0x5A9A3A, roughness: 0.9 });
  for (const xp of [-18, 15]) {
    const lawn = new THREE.Mesh(new THREE.PlaneGeometry(22, 18), lawnMat);
    lawn.rotation.x = -Math.PI / 2; lawn.position.set(xp, 0.06, -48);
    scene.add(lawn);
  }

  // Ground sidewalk around 30 Rock
  const swMat = new THREE.MeshStandardMaterial({ color: 0xC0B8A4, roughness: 0.9 });
  const sw = new THREE.Mesh(new THREE.PlaneGeometry(110, 90), swMat);
  sw.rotation.x = -Math.PI / 2; sw.position.set(0, 0.01, 0);
  sw.receiveShadow = true; scene.add(sw);

  return { buildingGroup: group, floorMeshes, outdoorMeshes };
}

export function setBasementsVisible(floorMeshes, visible) {
  for (const m of floorMeshes) if (m.userData.floorNumber < 0) m.visible = visible;
}

export function getFloorYPosition(fn) {
  if (fn < 0) return fn * BASEMENT_H + BASEMENT_H / 2;
  if (fn === 0) return LOBBY_H / 2;
  if (fn === 71) return LOBBY_H + 69 * FLOOR_H + FLOOR_H + FLOOR_H * 0.75;
  return LOBBY_H + (fn - 1) * FLOOR_H + FLOOR_H / 2;
}
