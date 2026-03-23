import * as THREE from 'three';

// ============================================================
// 30 Rockefeller Plaza — rebuilt to match Apple Maps reference
// ============================================================
// Scale: 1 unit ≈ 1 meter.  Origin = 30 Rock center.
// X = east(+)/west(−)   Z = north(+)/south(−)   Y = up
//
// 30 Rock is a SLAB building:
//   - LONG axis runs north-south (Z, d = larger value)
//   - THIN axis runs east-west (X, w = smaller value)
//   - Broad flat facades face east and west
//   - Setbacks step back on the north and south (narrow) faces
// ============================================================

const FLOOR_H = 3.66;
const LOBBY_H = 7.3;
const BASEMENT_H = 4.0;

// More gradual setback profile — matches Apple Maps aerial views
// Each tier is { startFloor, endFloor, w (E-W), d (N-S) }
const TIERS = [
  { label: 'basement',   startFloor: -3, endFloor: -1, w: 88, d: 66 },
  { label: 'base',       startFloor: 0,  endFloor: 5,  w: 88, d: 66 },
  { label: 'low-base',   startFloor: 6,  endFloor: 10, w: 72, d: 60 },
  { label: 'low-rise',   startFloor: 11, endFloor: 16, w: 52, d: 54 },
  { label: 'tower-low',  startFloor: 17, endFloor: 27, w: 28, d: 54 },
  { label: 'tower-mid',  startFloor: 28, endFloor: 38, w: 26, d: 48 },
  { label: 'setback-1',  startFloor: 39, endFloor: 48, w: 24, d: 40 },
  { label: 'setback-2',  startFloor: 49, endFloor: 57, w: 22, d: 34 },
  { label: 'setback-3',  startFloor: 58, endFloor: 64, w: 20, d: 28 },
  { label: 'crown',      startFloor: 65, endFloor: 70, w: 18, d: 22 },
];

// ── Facade texture ──────────────────────────────────────────
// Dark vertical window bands with narrow limestone piers
const _texCache = {};

export function createFacadeTexture(facadeW, bgColor = '#D4C0A0') {
  const k = `${Math.round(facadeW)}_${bgColor}`;
  if (_texCache[k]) return _texCache[k];

  const canvas = document.createElement('canvas');
  const W = 512, H = 512;
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');

  // Indiana limestone base
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, W, H);

  // Subtle limestone texture variation
  ctx.globalAlpha = 0.03;
  for (let i = 0; i < 200; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? '#000' : '#fff';
    const rx = Math.random() * W, ry = Math.random() * H;
    ctx.fillRect(rx, ry, Math.random() * 8 + 2, Math.random() * 4 + 1);
  }
  ctx.globalAlpha = 1.0;

  const cols = 12, rows = 6;
  const bayW = W / cols, flH = H / rows;
  const winWR = 0.74, winHR = 0.82;

  // Dark window panes with depth
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const wx = c * bayW + bayW * (1 - winWR) / 2;
      const wy = r * flH + flH * (1 - winHR) / 2;
      const ww = bayW * winWR;
      const wh = flH * winHR;

      // Window recess shadow
      ctx.fillStyle = '#0D1018';
      ctx.fillRect(wx - 0.5, wy - 0.5, ww + 1, wh + 1);

      // Glass pane
      ctx.fillStyle = '#161C28';
      ctx.fillRect(wx, wy, ww, wh);

      // Subtle sky reflection at top of each window
      const grad = ctx.createLinearGradient(wx, wy, wx, wy + wh * 0.3);
      grad.addColorStop(0, 'rgba(100,130,170,0.12)');
      grad.addColorStop(1, 'rgba(100,130,170,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(wx, wy, ww, wh * 0.3);

      // Vertical mullion (center divider)
      ctx.fillStyle = '#2A2A34';
      ctx.fillRect(wx + ww / 2 - 0.5, wy, 1, wh);
    }
  }

  // Re-paint limestone piers for crispness
  const pw = bayW * (1 - winWR);
  ctx.fillStyle = bgColor;
  for (let c = 0; c <= cols; c++) {
    ctx.fillRect(c * bayW - pw / 2, 0, pw, H);
  }

  // Horizontal spandrel bands
  ctx.fillStyle = darkenColor(bgColor, 0.08);
  for (let r = 0; r <= rows; r++) {
    ctx.fillRect(0, r * flH - 2, W, 4);
  }

  // Top cornice line
  ctx.fillStyle = darkenColor(bgColor, 0.15);
  ctx.fillRect(0, 0, W, 2);
  ctx.fillRect(0, H - 2, W, 2);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(facadeW / 22, 1);
  tex.anisotropy = 4;
  _texCache[k] = tex;
  return tex;
}

function darkenColor(hex, amount) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const f = 1 - amount;
  return `rgb(${Math.round(r * f)},${Math.round(g * f)},${Math.round(b * f)})`;
}

// ── Materials ───────────────────────────────────────────────
const LIMESTONE = '#D4C0A0';
const ROOF_COLOR = 0xCBB09A;

const roofMat = new THREE.MeshStandardMaterial({ color: ROOF_COLOR, roughness: 0.75 });
const basementMat = new THREE.MeshStandardMaterial({
  color: 0x3A3A44, roughness: 0.8, transparent: true, opacity: 0.7
});
const lobbyMat = new THREE.MeshStandardMaterial({
  color: 0x5A5550, roughness: 0.3, metalness: 0.15
});

function floorMaterials(floorNum, tierW, tierD) {
  if (floorNum < 0) return basementMat;
  if (floorNum === 0) return [lobbyMat, lobbyMat, roofMat, roofMat, lobbyMat, lobbyMat];
  // Different texture for broad face (N-S running) vs narrow face (E-W running)
  const facBroad = new THREE.MeshStandardMaterial({
    map: createFacadeTexture(tierD, LIMESTONE), roughness: 0.5, metalness: 0.03
  });
  const facNarrow = new THREE.MeshStandardMaterial({
    map: createFacadeTexture(tierW, LIMESTONE), roughness: 0.5, metalness: 0.03
  });
  // BoxGeometry face order: +X, -X, +Y, -Y, +Z, -Z
  // +X/-X = east/west (broad faces, run N-S) → use facBroad
  // +Z/-Z = north/south (narrow faces, run E-W) → use facNarrow
  return [facBroad, facBroad, roofMat, roofMat, facNarrow, facNarrow];
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

// ── Cornice / ledge at setback transitions ──────────────────
function addCornice(group, y, w, d, thickness = 0.4) {
  const mat = new THREE.MeshStandardMaterial({ color: 0xC8B898, roughness: 0.6 });
  const overhang = 1.2;
  const cornice = new THREE.Mesh(
    new THREE.BoxGeometry(w + overhang * 2, thickness, d + overhang * 2),
    mat
  );
  cornice.position.set(0, y, 0);
  cornice.castShadow = true;
  group.add(cornice);
}

// ============================================================
export function createBuilding(scene) {
  const group = new THREE.Group();
  const floorMeshes = [];
  const outdoorMeshes = [];

  // ── Per-floor meshes ──
  let prevTier = null;
  for (const tier of TIERS) {
    for (let f = tier.startFloor; f <= tier.endFloor; f++) {
      const isLobby = f === 0, isBsmt = f < 0;
      const h = isLobby ? LOBBY_H : (isBsmt ? BASEMENT_H : FLOOR_H);
      const mat = floorMaterials(f, tier.w, tier.d);
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(tier.w, h, tier.d), mat);
      let y;
      if (f < 0) y = f * BASEMENT_H + BASEMENT_H / 2;
      else if (f === 0) y = LOBBY_H / 2;
      else y = LOBBY_H + (f - 1) * FLOOR_H + FLOOR_H / 2;
      mesh.position.set(0, y, 0);
      mesh.castShadow = true; mesh.receiveShadow = true;
      mesh.userData = {
        type: 'floor', floorNumber: f,
        floorId: f < 0 ? `B${Math.abs(f)}` : `F${f}`,
        buildingId: '30ROCK', tier: tier.label, defaultMaterial: mat
      };
      floorMeshes.push(mesh);
      group.add(mesh);
    }

    // Add cornice at the top of each tier (where it transitions to a narrower one)
    if (prevTier && (prevTier.w !== tier.w || prevTier.d !== tier.d)) {
      let corniceY;
      const pf = tier.startFloor;
      if (pf <= 0) corniceY = LOBBY_H;
      else corniceY = LOBBY_H + (pf - 1) * FLOOR_H;
      addCornice(group, corniceY, prevTier.w, prevTier.d);
    }
    prevTier = tier;
  }

  // ── Green terrace patches on setback ledges ──
  const greenMat = new THREE.MeshStandardMaterial({ color: 0x6BA34A, roughness: 0.8 });
  function greenPatch(x, y, z, w, d) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w, d), greenMat);
    p.rotation.x = -Math.PI / 2;
    p.position.set(x, y + 0.08, z);
    group.add(p);
  }

  // Base → low-base setback (top of floor 5)
  const t5 = LOBBY_H + 4 * FLOOR_H + FLOOR_H;
  greenPatch(36, t5, 0, 8, 50);    // east ledge
  greenPatch(-36, t5, 0, 8, 50);   // west ledge

  // Low-base → low-rise setback (top of floor 10)
  const t10 = LOBBY_H + 9 * FLOOR_H + FLOOR_H;
  greenPatch(0, t10, 30, 44, 5);   // north ledge
  greenPatch(0, t10, -30, 44, 5);  // south ledge

  // Low-rise → tower setback (top of floor 16)
  const t16 = LOBBY_H + 15 * FLOOR_H + FLOOR_H;
  greenPatch(20, t16, 24, 10, 8);  // NE
  greenPatch(-20, t16, 24, 10, 8); // NW
  greenPatch(20, t16, -24, 10, 8); // SE
  greenPatch(-20, t16, -24, 10, 8);// SW

  // ── Observation Deck ──
  const topY = LOBBY_H + 69 * FLOOR_H + FLOOR_H;
  const obsH = FLOOR_H * 1.5, obsW = 16, obsD = 20;
  const obsY = topY + obsH / 2;
  const obsMat = new THREE.MeshStandardMaterial({
    color: 0x88AACC, roughness: 0.2, metalness: 0.4, transparent: true, opacity: 0.7
  });
  const obsMesh = new THREE.Mesh(new THREE.BoxGeometry(obsW, obsH, obsD), obsMat);
  obsMesh.position.set(0, obsY, 0);
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
    r1.position.set(0, rTop, s * obsD / 2); group.add(r1);
    const r2 = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.2, obsD + 0.5), railMat);
    r2.position.set(s * obsW / 2, rTop, 0); group.add(r2);
  }

  // Penthouse / mechanical
  const ph = new THREE.Mesh(
    new THREE.BoxGeometry(8, 6, 10),
    new THREE.MeshStandardMaterial({ color: 0x555566, roughness: 0.8 })
  );
  ph.position.set(0, obsY + obsH / 2 + 1.2 + 3, 0);
  ph.castShadow = true; group.add(ph);

  // Crown fins (Art Deco detail)
  const finMat = new THREE.MeshStandardMaterial({ color: 0xA09070, roughness: 0.4, metalness: 0.3 });
  for (const xs of [-1, 1]) for (const zs of [-1, 1]) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(1.5, 10, 1.5), finMat);
    fin.position.set(xs * 8, topY + 5, zs * 10); group.add(fin);
  }

  // "Wisdom" relief — gold accent above east entrance
  const wisdom = new THREE.Mesh(
    new THREE.BoxGeometry(12, 8, 0.5),
    new THREE.MeshStandardMaterial({ color: 0xFFD700, roughness: 0.3, metalness: 0.7 })
  );
  wisdom.position.set(0, LOBBY_H + 4, 33.5); group.add(wisdom);

  scene.add(group);

  // ══════════════════════════════════════════════════════════
  // OUTDOOR AREAS
  // ══════════════════════════════════════════════════════════

  // ── Lower Plaza / Skating Rink (sunken, east of building) ──
  const rinkG = new THREE.Group();
  rinkG.position.set(0, 0, 46); // North side (east in real coords — rink is between 30 Rock and Channel Gardens)

  // Sunken floor
  const rinkFloor = new THREE.Mesh(
    new THREE.BoxGeometry(26, 0.5, 20),
    new THREE.MeshStandardMaterial({ color: 0x2a2a35, roughness: 0.7 })
  );
  rinkFloor.position.y = -5; rinkFloor.receiveShadow = true; rinkG.add(rinkFloor);

  // Ice / water surface
  const ice = new THREE.Mesh(
    new THREE.PlaneGeometry(24, 16),
    new THREE.MeshStandardMaterial({ color: 0xA8D8E8, roughness: 0.05, metalness: 0.3 })
  );
  ice.rotation.x = -Math.PI / 2; ice.position.y = -4.7; rinkG.add(ice);

  // Surrounding retaining walls
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xD4C0A0, roughness: 0.6 });
  for (const s of [-1, 1]) {
    const w1 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 5.5, 20), wallMat);
    w1.position.set(s * 13, -2.5, 0); rinkG.add(w1);
  }
  for (const s of [-1, 1]) {
    const w2 = new THREE.Mesh(new THREE.BoxGeometry(26, 5.5, 0.6), wallMat);
    w2.position.set(0, -2.5, s * 10); rinkG.add(w2);
  }

  // Stepped terraces around rink
  for (let i = 0; i < 3; i++) {
    const step = new THREE.Mesh(
      new THREE.BoxGeometry(28 + i * 3, 0.5, 22 + i * 3),
      new THREE.MeshStandardMaterial({ color: 0xC8B898, roughness: 0.6 })
    );
    step.position.y = -4 + i * 1.8; rinkG.add(step);
  }

  // Prometheus statue
  const ped = new THREE.Mesh(
    new THREE.CylinderGeometry(1, 1.3, 2.5, 8),
    new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.4 })
  );
  ped.position.set(0, -2.5, -9); rinkG.add(ped);
  const prom = new THREE.Mesh(
    new THREE.SphereGeometry(1.5, 16, 12),
    new THREE.MeshStandardMaterial({ color: 0xFFD700, roughness: 0.2, metalness: 0.8 })
  );
  prom.position.set(0, 0, -9); rinkG.add(prom);
  scene.add(rinkG);

  // Rink click target
  const rinkClick = new THREE.Mesh(
    new THREE.PlaneGeometry(26, 20),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  rinkClick.rotation.x = -Math.PI / 2;
  rinkClick.position.set(0, -2, 46);
  rinkClick.userData = {
    type: 'outdoor', floorId: 'OUT-RINK', floorNumber: -100,
    areaName: 'Lower Plaza — Ice Skating Rink', defaultMaterial: rinkClick.material
  };
  scene.add(rinkClick); outdoorMeshes.push(rinkClick);

  // ── Channel Gardens (between rink and 5th Ave) ──
  const gardenMat = new THREE.MeshStandardMaterial({ color: 0xC8BFA0, roughness: 0.85 });
  const garden = new THREE.Mesh(new THREE.PlaneGeometry(14, 48), gardenMat);
  garden.rotation.x = -Math.PI / 2;
  garden.position.set(0, 0.05, 82);
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
    p.position.set(0, 0.15, 62 + i * 7);
    scene.add(p);
  }

  // Trees along Channel Gardens
  const treeMat = new THREE.MeshStandardMaterial({ color: 0x3A8A3A, roughness: 0.8 });
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5a3a1a, roughness: 0.9 });
  for (let i = 0; i < 6; i++) {
    for (const s of [-1, 1]) {
      const tk = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 2, 6), trunkMat);
      tk.position.set(s * 5, 1, 64 + i * 6.5);
      tk.castShadow = true; scene.add(tk);
      const cn = new THREE.Mesh(new THREE.SphereGeometry(1.5, 8, 6), treeMat);
      cn.position.set(s * 5, 3, 64 + i * 6.5);
      cn.castShadow = true; scene.add(cn);
    }
  }

  // ── Rockefeller Plaza (private street, running N-S east of building) ──
  const plazaSt = new THREE.Mesh(
    new THREE.PlaneGeometry(160, 12),
    new THREE.MeshStandardMaterial({ color: 0x333340, roughness: 0.85 })
  );
  plazaSt.rotation.x = -Math.PI / 2;
  plazaSt.position.set(0, 0.03, 38);
  plazaSt.receiveShadow = true;
  plazaSt.userData = {
    type: 'outdoor', floorId: 'OUT-PLAZA', floorNumber: -102,
    areaName: 'Rockefeller Plaza', defaultMaterial: plazaSt.material
  };
  scene.add(plazaSt); outdoorMeshes.push(plazaSt);

  // Flagpoles along Rockefeller Plaza
  const fpMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.6, roughness: 0.3 });
  const fColors = [0xFF0000, 0x0000FF, 0x00AA00, 0xFFFF00, 0xFF6600, 0x9900FF, 0x00AAFF, 0xFF0066, 0x00FF88, 0xFFAA00];
  for (let i = 0; i < 10; i++) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 8, 4), fpMat);
    pole.position.set(-30 + i * 6.5, 4, 38);
    scene.add(pole);
    const fl = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 1.2),
      new THREE.MeshStandardMaterial({ color: fColors[i], side: THREE.DoubleSide, roughness: 0.8 })
    );
    fl.position.set(-30 + i * 6.5, 7.2, 39.2);
    scene.add(fl);
  }

  // ── Green lawn areas south of building ──
  const lawnMat = new THREE.MeshStandardMaterial({ color: 0x5A9A3A, roughness: 0.9 });
  for (const zp of [-18, 15]) {
    const lawn = new THREE.Mesh(new THREE.PlaneGeometry(22, 18), lawnMat);
    lawn.rotation.x = -Math.PI / 2;
    lawn.position.set(zp, 0.06, -48);
    scene.add(lawn);
  }

  // Ground sidewalk
  const swMat = new THREE.MeshStandardMaterial({ color: 0xC0B8A4, roughness: 0.9 });
  const sw = new THREE.Mesh(new THREE.PlaneGeometry(110, 100), swMat);
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
