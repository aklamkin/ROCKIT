import * as THREE from 'three';

// ============================================================
// 30 Rockefeller Plaza — architecturally accurate
// ============================================================
// Scale: 1 unit = 1 meter
// Height: 259m (850ft), 70 floors + observation deck
// Tower slab: 31m(E-W) × 100m(N-S), narrow face east/west
// Base: 61m(E-W) × 163m(N-S)
//
// Coordinate system:
//   X = east(+) / west(-)
//   Z = north(+) / south(-)
//   Y = up
//
// 30 Rock center at origin. Tower slab offset ~+5m east.
// ============================================================

const FLOOR_H = 3.66;
const LOBBY_H = 7.3;
const BASEMENT_H = 4.0;

// Setback tiers from architectural records
const TIERS = [
  { label: 'basement',  startFloor: -3, endFloor: -1, w: 61, d: 163, xOff: 0 },
  { label: 'base',      startFloor: 0,  endFloor: 6,  w: 61, d: 163, xOff: 0 },
  { label: 'low-rise',  startFloor: 7,  endFloor: 16, w: 61, d: 130, xOff: 0 },
  { label: 'tower-low', startFloor: 17, endFloor: 33, w: 31, d: 100, xOff: 5 },
  { label: 'setback-1', startFloor: 34, endFloor: 44, w: 31, d: 85,  xOff: 5 },
  { label: 'setback-2', startFloor: 45, endFloor: 54, w: 28, d: 70,  xOff: 5 },
  { label: 'setback-3', startFloor: 55, endFloor: 65, w: 25, d: 55,  xOff: 5 },
  { label: 'crown',     startFloor: 66, endFloor: 70, w: 22, d: 45,  xOff: 5 },
];

// ── Facade texture ──
function createWindowTexture(width) {
  const canvas = document.createElement('canvas');
  const S = 256;
  canvas.width = S; canvas.height = S;
  const ctx = canvas.getContext('2d');

  // Indiana limestone — warm cream/buff
  ctx.fillStyle = '#D2C9B0';
  ctx.fillRect(0, 0, S, S);

  const cols = 8, rows = 3;
  const gapX = S / cols, gapY = S / rows;
  const wW = gapX * 0.5, wH = gapY * 0.78;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * gapX + (gapX - wW) / 2;
      const y = r * gapY + (gapY - wH) / 2;
      ctx.fillStyle = '#1a2030';
      ctx.fillRect(x, y, wW, wH);
      ctx.fillStyle = 'rgba(120,160,200,0.12)';
      ctx.fillRect(x + 1, y + 1, wW * 0.45, wH * 0.25);
    }
  }
  ctx.fillStyle = '#C8BFA0';
  for (let c = 0; c <= cols; c++) ctx.fillRect(c * gapX - 2, 0, 4, S);
  ctx.fillStyle = '#BDB495';
  for (let r = 0; r <= rows; r++) ctx.fillRect(0, r * gapY - 1, S, 2.5);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(width / 8, 1);
  return tex;
}

function floorMaterial(floorNum, tierW) {
  if (floorNum === 0) return new THREE.MeshStandardMaterial({ color: 0x4A4A54, roughness: 0.3, metalness: 0.15 });
  if (floorNum < 0) return new THREE.MeshStandardMaterial({ color: 0x3A3A44, roughness: 0.8, transparent: true, opacity: 0.7 });
  return new THREE.MeshStandardMaterial({ map: createWindowTexture(tierW), roughness: 0.5, metalness: 0.03 });
}

// ── Selection materials ──
const selectedMat = new THREE.MeshStandardMaterial({ color: 0x00AAFF, emissive: 0x00AAFF, emissiveIntensity: 0.35, roughness: 0.4, metalness: 0.2 });
const hoverMat = new THREE.MeshStandardMaterial({ color: 0xD2C9B0, emissive: 0x00AAFF, emissiveIntensity: 0.12, roughness: 0.6, metalness: 0.05 });
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
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(tier.w, h, tier.d), floorMaterial(f, tier.w));
      let y;
      if (f < 0) y = f * BASEMENT_H + BASEMENT_H / 2;
      else if (f === 0) y = LOBBY_H / 2;
      else y = LOBBY_H + (f - 1) * FLOOR_H + FLOOR_H / 2;
      mesh.position.set(tier.xOff, y, 0);
      mesh.castShadow = true; mesh.receiveShadow = true;
      mesh.userData = { type: 'floor', floorNumber: f, floorId: f < 0 ? `B${Math.abs(f)}` : `F${f}`, buildingId: '30ROCK', tier: tier.label, defaultMaterial: mesh.material };
      floorMeshes.push(mesh);
      group.add(mesh);
    }
  }

  // ── NBC Studios windowless mid-section ──
  const nbcH = 9 * FLOOR_H;
  const nbc = new THREE.Mesh(new THREE.BoxGeometry(30, nbcH, 80), new THREE.MeshStandardMaterial({ color: 0xC8BFA0, roughness: 0.55 }));
  nbc.position.set(-30, LOBBY_H + nbcH / 2, 0);
  nbc.castShadow = true;
  group.add(nbc);

  // ── Observation Deck ──
  const obsW = 20, obsD = 38, obsH = FLOOR_H * 1.5;
  const topY = LOBBY_H + 69 * FLOOR_H + FLOOR_H;
  const obsY = topY + obsH / 2;
  const obsMat = new THREE.MeshStandardMaterial({ color: 0x88AACC, roughness: 0.2, metalness: 0.4, transparent: true, opacity: 0.7 });
  const obsMesh = new THREE.Mesh(new THREE.BoxGeometry(obsW, obsH, obsD), obsMat);
  obsMesh.position.set(5, obsY, 0);
  obsMesh.castShadow = true;
  obsMesh.userData = { type: 'floor', floorNumber: 71, floorId: 'OBS', buildingId: '30ROCK', tier: 'observation', defaultMaterial: obsMat };
  floorMeshes.push(obsMesh); group.add(obsMesh);

  // Railings
  const railMat = new THREE.MeshStandardMaterial({ color: 0x888899, roughness: 0.5, metalness: 0.6 });
  const railH = 1.2, railT = 0.15, rTop = obsY + obsH / 2 + railH / 2;
  for (const s of [-1, 1]) { const r = new THREE.Mesh(new THREE.BoxGeometry(obsW + 0.5, railH, railT), railMat); r.position.set(5, rTop, s * (obsD / 2 + railT / 2)); group.add(r); }
  for (const s of [-1, 1]) { const r = new THREE.Mesh(new THREE.BoxGeometry(railT, railH, obsD + 0.5), railMat); r.position.set(5 + s * (obsW / 2 + railT / 2), rTop, 0); group.add(r); }

  // Penthouse
  const ph = new THREE.Mesh(new THREE.BoxGeometry(8, 5, 14), new THREE.MeshStandardMaterial({ color: 0x555566, roughness: 0.8 }));
  ph.position.set(5, obsY + obsH / 2 + railH + 2.5, 0); ph.castShadow = true; group.add(ph);

  // Crown fins
  const finMat = new THREE.MeshStandardMaterial({ color: 0xA09070, roughness: 0.4, metalness: 0.3 });
  for (const xs of [-1, 1]) for (const zs of [-1, 1]) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(1.5, 10, 1.5), finMat);
    fin.position.set(5 + xs * 10, topY + 5, zs * 21);
    group.add(fin);
  }

  // "Wisdom" relief — gold accent above main entrance (east face)
  const wisdom = new THREE.Mesh(new THREE.BoxGeometry(12, 8, 0.5), new THREE.MeshStandardMaterial({ color: 0xFFD700, roughness: 0.3, metalness: 0.7 }));
  wisdom.position.set(5, LOBBY_H + 4, 82); group.add(wisdom);

  // ══════════════════════════════════════
  // OUTDOOR AREAS
  // ══════════════════════════════════════

  // ── Lower Plaza / Skating Rink ──
  const rinkG = new THREE.Group();
  rinkG.position.set(55, 0, 10);
  const rinkFloor = new THREE.Mesh(new THREE.BoxGeometry(38, 0.5, 29), new THREE.MeshStandardMaterial({ color: 0x2a2a35, roughness: 0.7 }));
  rinkFloor.position.y = -4.75; rinkFloor.receiveShadow = true; rinkG.add(rinkFloor);
  const ice = new THREE.Mesh(new THREE.PlaneGeometry(37, 18), new THREE.MeshStandardMaterial({ color: 0xB8E8F0, roughness: 0.05, metalness: 0.3 }));
  ice.rotation.x = -Math.PI / 2; ice.position.y = -4.5; rinkG.add(ice);
  const wMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.5 });
  for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.BoxGeometry(0.5, 5, 29), wMat); w.position.set(s * 19, -2.5, 0); rinkG.add(w); }
  for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.BoxGeometry(38, 5, 0.5), wMat); w.position.set(0, -2.5, s * 14.5); rinkG.add(w); }
  for (let i = 0; i < 3; i++) { const step = new THREE.Mesh(new THREE.BoxGeometry(40 + i * 4, 0.5, 31 + i * 4), new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.6 })); step.position.y = -4 + i * 1.5; rinkG.add(step); }
  const ped = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.5, 3, 8), new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.4 }));
  ped.position.set(0, -2.5, -13); rinkG.add(ped);
  const prom = new THREE.Mesh(new THREE.SphereGeometry(1.8, 16, 16), new THREE.MeshStandardMaterial({ color: 0xFFD700, roughness: 0.2, metalness: 0.8 }));
  prom.position.set(0, 0.5, -13); rinkG.add(prom);
  scene.add(rinkG);

  const rinkClick = new THREE.Mesh(new THREE.PlaneGeometry(38, 29), new THREE.MeshBasicMaterial({ visible: false }));
  rinkClick.rotation.x = -Math.PI / 2; rinkClick.position.set(55, -2, 10);
  rinkClick.userData = { type: 'outdoor', floorId: 'OUT-RINK', floorNumber: -100, areaName: 'Lower Plaza — Ice Skating Rink', defaultMaterial: rinkClick.material };
  scene.add(rinkClick); outdoorMeshes.push(rinkClick);

  // ── Channel Gardens ──
  const gardenMat = new THREE.MeshStandardMaterial({ color: 0x2a4a2a, roughness: 0.85 });
  const garden = new THREE.Mesh(new THREE.PlaneGeometry(61, 18), gardenMat);
  garden.rotation.x = -Math.PI / 2; garden.position.set(95, 0.05, 10); garden.receiveShadow = true;
  garden.userData = { type: 'outdoor', floorId: 'OUT-CHANNEL', floorNumber: -101, areaName: 'Channel Gardens', defaultMaterial: gardenMat };
  scene.add(garden); outdoorMeshes.push(garden);
  const poolMat = new THREE.MeshStandardMaterial({ color: 0x4488AA, roughness: 0.1, metalness: 0.2 });
  for (let i = 0; i < 6; i++) { const p = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.3, 12), poolMat); p.position.set(70 + i * 10, 0.15, 10); scene.add(p); }
  const trMat = new THREE.MeshStandardMaterial({ color: 0x2a6a2a, roughness: 0.8 });
  const tkMat = new THREE.MeshStandardMaterial({ color: 0x5a3a1a, roughness: 0.9 });
  for (let i = 0; i < 8; i++) for (const s of [-1, 1]) {
    const tk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 2.5, 6), tkMat); tk.position.set(68 + i * 8, 1.25, 10 + s * 7); tk.castShadow = true; scene.add(tk);
    const cn = new THREE.Mesh(new THREE.SphereGeometry(1.8, 8, 6), trMat); cn.position.set(68 + i * 8, 3.5, 10 + s * 7); cn.castShadow = true; scene.add(cn);
  }

  // ── Rockefeller Plaza (private street) ──
  const plazaSt = new THREE.Mesh(new THREE.PlaneGeometry(12, 220), new THREE.MeshStandardMaterial({ color: 0x333340, roughness: 0.85 }));
  plazaSt.rotation.x = -Math.PI / 2; plazaSt.position.set(15, 0.03, 0); plazaSt.receiveShadow = true;
  plazaSt.userData = { type: 'outdoor', floorId: 'OUT-PLAZA', floorNumber: -102, areaName: 'Rockefeller Plaza', defaultMaterial: plazaSt.material };
  scene.add(plazaSt); outdoorMeshes.push(plazaSt);

  // Flagpoles
  const fpMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.6, roughness: 0.3 });
  const fColors = [0xFF0000,0x0000FF,0x00AA00,0xFFFF00,0xFF6600,0x9900FF,0x00AAFF,0xFF0066,0x00FF88,0xFFAA00,0x8800FF,0xFF4400];
  for (let i = 0; i < 12; i++) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 8, 4), fpMat); pole.position.set(15, 4, -50 + i * 8); scene.add(pole);
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(2, 1.2), new THREE.MeshStandardMaterial({ color: fColors[i], side: THREE.DoubleSide, roughness: 0.8 }));
    fl.position.set(16.2, 7.2, -50 + i * 8); scene.add(fl);
  }

  // Ground sidewalk
  const sw = new THREE.Mesh(new THREE.PlaneGeometry(90, 180), new THREE.MeshStandardMaterial({ color: 0x2e2e38, roughness: 0.9 }));
  sw.rotation.x = -Math.PI / 2; sw.position.set(0, 0.01, 0); sw.receiveShadow = true; scene.add(sw);

  scene.add(group);
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
