import * as THREE from 'three';
import { createFacadeTexture } from './building.js';

// ============================================================
// Rockefeller Center Campus — full rebuild with context
// ============================================================
// Scale: 1 unit ≈ 1 meter.  Origin = 30 Rock center.
// X = east(+)/west(−)  Z = north(+)/south(−)  Y = up
//
// Street grid (center-line positions):
//   48th St: Z ≈ −130   49th St: Z ≈ −50
//   50th St: Z ≈ +50    51st St: Z ≈ +130
//   5th Ave: X ≈ +130   6th Ave: X ≈ −130
//   Rockefeller Plaza: X ≈ +48
//   Streets ~18m wide, Avenues ~22m wide
// ============================================================

const FLOOR_H = 3.66;
const LOBBY_H = 5.5;

// ── RC building configs ─────────────────────────────────────
export const CAMPUS_BUILDINGS = [
  // ─── 50th-51st block (north) ───
  { id: 'INTL', shortName: 'International', fullName: 'International Building',
    tiers: [
      { startFloor: 0, endFloor: 3,  width: 48, depth: 68 },
      { startFloor: 4, endFloor: 8,  width: 42, depth: 58 },
      { startFloor: 9, endFloor: 22, width: 32, depth: 46 },
      { startFloor: 23, endFloor: 34, width: 25, depth: 34 },
      { startFloor: 35, endFloor: 40, width: 18, depth: 24 },
    ],
    x: 95, z: 90, color: '#D0C8A8' },

  { id: 'PALAZZO', shortName: "Palazzo d'Italia", fullName: "Palazzo d'Italia",
    tiers: [{ startFloor: 0, endFloor: 5, width: 15, depth: 55 }],
    x: 118, z: 65, color: '#D0C8A8' },

  { id: 'INTL_N', shortName: 'Intl North', fullName: 'International Building North',
    tiers: [{ startFloor: 0, endFloor: 5, width: 15, depth: 55 }],
    x: 118, z: 115, color: '#D0C8A8' },

  { id: '50ROCK', shortName: '50 Rock', fullName: '50 Rockefeller Plaza',
    tiers: [{ startFloor: 0, endFloor: 14, width: 55, depth: 58 }],
    x: 30, z: 90, color: '#D0C8A8' },

  { id: '1270AVE', shortName: '1270 Ave', fullName: '1270 Avenue of the Americas',
    tiers: [
      { startFloor: 0, endFloor: 5,  width: 48, depth: 55 },
      { startFloor: 6, endFloor: 20, width: 36, depth: 44 },
      { startFloor: 21, endFloor: 30, width: 24, depth: 32 },
    ],
    x: -100, z: 90, color: '#C8C0A0' },

  { id: 'RCMH', shortName: 'Radio City', fullName: 'Radio City Music Hall',
    tiers: [{ startFloor: 0, endFloor: 2, width: 85, depth: 55 }],
    x: -55, z: 90, color: '#7B6345', special: 'rcmh' },

  // ─── 49th-50th block (30 Rock's block — flanking buildings) ───
  { id: 'BRIT', shortName: 'British Empire', fullName: 'British Empire Building',
    tiers: [{ startFloor: 0, endFloor: 5, width: 55, depth: 18 }],
    x: 100, z: 18, color: '#D2C9B0', greenRoof: true },

  { id: 'MAISON', shortName: 'La Maison', fullName: 'La Maison Francaise',
    tiers: [{ startFloor: 0, endFloor: 5, width: 55, depth: 18 }],
    x: 100, z: -18, color: '#D2C9B0', greenRoof: true },

  { id: '1250AVE', shortName: '1250 Ave', fullName: '1250 Avenue of the Americas',
    tiers: [
      { startFloor: 0, endFloor: 5,  width: 38, depth: 72 },
      { startFloor: 6, endFloor: 15, width: 32, depth: 58 },
    ],
    x: -85, z: 0, color: '#D0C8A8' },

  // ─── 48th-49th block (south) ───
  { id: '1ROCK', shortName: '1 Rock Plaza', fullName: '1 Rockefeller Plaza',
    tiers: [
      { startFloor: 0, endFloor: 6,  width: 42, depth: 68 },
      { startFloor: 7, endFloor: 22, width: 32, depth: 52 },
      { startFloor: 23, endFloor: 35, width: 22, depth: 36 },
    ],
    x: 30, z: -90, color: '#D0C8A8' },

  { id: '10ROCK', shortName: '10 Rock', fullName: '10 Rockefeller Plaza',
    tiers: [{ startFloor: 0, endFloor: 15, width: 32, depth: 56 }],
    x: -20, z: -90, color: '#D0C8A8' },

  { id: '600FIFTH', shortName: '600 Fifth', fullName: '600 Fifth Avenue',
    tiers: [
      { startFloor: 0, endFloor: 6,  width: 38, depth: 55 },
      { startFloor: 7, endFloor: 26, width: 28, depth: 40 },
    ],
    x: 100, z: -90, color: '#C8C0A0' },

  { id: '1230AVE', shortName: '1230 Ave', fullName: '1230 Avenue of the Americas',
    tiers: [
      { startFloor: 0, endFloor: 6,  width: 55, depth: 65 },
      { startFloor: 7, endFloor: 20, width: 40, depth: 48 },
    ],
    x: -100, z: -90, color: '#C8C0A0' },

  // ─── 51st-52nd block (further north) ───
  { id: '75ROCK', shortName: '75 Rock', fullName: '75 Rockefeller Plaza',
    tiers: [
      { startFloor: 0, endFloor: 2,  width: 55, depth: 65 },
      { startFloor: 3, endFloor: 9,  width: 46, depth: 54 },
      { startFloor: 10, endFloor: 22, width: 35, depth: 40 },
      { startFloor: 23, endFloor: 32, width: 25, depth: 30 },
    ],
    x: 45, z: 180, color: '#B8B0A0' },
];

// ── Texture helpers ─────────────────────────────────────────
const _campusTexCache = {};
function cachedFacadeTex(w, color) {
  const k = `${Math.round(w)}_${color}`;
  if (!_campusTexCache[k]) _campusTexCache[k] = createFacadeTexture(w, color);
  return _campusTexCache[k];
}

const campusRoofMat = new THREE.MeshStandardMaterial({ color: 0xD4B0A0, roughness: 0.7 });
const campusLobbyMat = new THREE.MeshStandardMaterial({ color: 0x4A4A54, roughness: 0.35, metalness: 0.2 });

function campusFloorMat(f, tw, color) {
  if (f === 0) return [campusLobbyMat, campusLobbyMat, campusRoofMat, campusRoofMat, campusLobbyMat, campusLobbyMat];
  const fac = new THREE.MeshStandardMaterial({ map: cachedFacadeTex(tw, color), roughness: 0.55, metalness: 0.05 });
  return [fac, fac, campusRoofMat, campusRoofMat, fac, fac];
}

// ── Build interactive building ──────────────────────────────
function createInteractiveBuilding(cfg) {
  const { id, tiers, x, z, color } = cfg;
  const group = new THREE.Group();
  const floorMeshes = [];
  for (const tier of tiers) {
    for (let f = tier.startFloor; f <= tier.endFloor; f++) {
      const h = f === 0 ? LOBBY_H : FLOOR_H;
      const mat = campusFloorMat(f, tier.width, color);
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(tier.width, h, tier.depth), mat);
      mesh.position.y = f === 0 ? LOBBY_H / 2 : LOBBY_H + (f - 1) * FLOOR_H + FLOOR_H / 2;
      mesh.castShadow = true; mesh.receiveShadow = true;
      mesh.userData = {
        type: 'floor', floorNumber: f,
        floorId: `${id}-F${f}`, buildingId: id, defaultMaterial: mat
      };
      floorMeshes.push(mesh); group.add(mesh);
    }
  }
  group.position.set(x, 0, z);

  // Green rooftop garden
  if (cfg.greenRoof) {
    const topTier = tiers[tiers.length - 1];
    const topY = LOBBY_H + (topTier.endFloor - 1) * FLOOR_H + FLOOR_H;
    const gMat = new THREE.MeshStandardMaterial({ color: 0x6BA34A, roughness: 0.8 });
    const patch = new THREE.Mesh(new THREE.PlaneGeometry(topTier.width * 0.75, topTier.depth * 0.7), gMat);
    patch.rotation.x = -Math.PI / 2; patch.position.set(0, topY + 0.06, 0);
    group.add(patch);
  }

  if (cfg.special === 'rcmh') addRCMH(group);
  return { group, floorMeshes };
}

// ── Radio City Music Hall decorations ───────────────────────
function addRCMH(group) {
  const topY = LOBBY_H + 2 * FLOOR_H;

  // Barrel vault roof
  const roofGeo = new THREE.CylinderGeometry(20, 20, 55, 16, 1, false, 0, Math.PI);
  const roofMesh = new THREE.Mesh(roofGeo,
    new THREE.MeshStandardMaterial({ color: 0x5B4B35, roughness: 0.6 }));
  roofMesh.rotation.z = Math.PI / 2;
  roofMesh.rotation.y = Math.PI / 2;
  roofMesh.position.y = topY;
  roofMesh.castShadow = true; group.add(roofMesh);

  // Marquee on 6th Ave side
  const marquee = new THREE.Mesh(
    new THREE.BoxGeometry(5, 4, 44),
    new THREE.MeshStandardMaterial({ color: 0xFFDD44, emissive: 0xFFAA00, emissiveIntensity: 0.4, roughness: 0.3 })
  );
  marquee.position.set(-44, 3.5, 0); group.add(marquee);

  // Vertical "RADIO CITY" signs
  const signMat = new THREE.MeshStandardMaterial({ color: 0xFF3333, emissive: 0xFF2222, emissiveIntensity: 0.5, roughness: 0.3 });
  for (const zOff of [-16, 0, 16]) {
    const sign = new THREE.Mesh(new THREE.BoxGeometry(2.5, 24, 0.5), signMat);
    sign.position.set(-44, 18, zOff); group.add(sign);
  }
}

// ── Labels ──────────────────────────────────────────────────
function makeLabel(text, x, y, z, scale = 1) {
  const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(18,22,36,0.85)'; ctx.fillRect(0, 0, 512, 64);
  ctx.fillStyle = '#E8E8F0'; ctx.font = 'bold 26px sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 34);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: new THREE.CanvasTexture(canvas), transparent: true, depthWrite: false
  }));
  sprite.position.set(x, y, z); sprite.scale.set(20 * scale, 2.5 * scale, 1);
  return sprite;
}

function streetLabel(text, x, y, z, scale = 1) {
  const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 48;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#999'; ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 26);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: new THREE.CanvasTexture(canvas), transparent: true, depthWrite: false
  }));
  sprite.position.set(x, y, z); sprite.scale.set(18 * scale, 2 * scale, 1);
  return sprite;
}

// ── Atlas statue ────────────────────────────────────────────
function addAtlas(g) {
  const bMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.4 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.8, 3, 8), bMat);
  base.position.set(120, 1.5, 90); g.add(base);
  const bronzeMat = new THREE.MeshStandardMaterial({ color: 0x6B4C3B, roughness: 0.3, metalness: 0.6 });
  const globe = new THREE.Mesh(new THREE.SphereGeometry(2.8, 16, 12), bronzeMat);
  globe.position.set(120, 6.5, 90); g.add(globe);
  for (const [rx, rz] of [[Math.PI / 6, 0], [0, Math.PI / 3], [Math.PI / 4, Math.PI / 6]]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.12, 8, 24), bronzeMat);
    ring.position.set(120, 6.5, 90); ring.rotation.x = rx; ring.rotation.z = rz; g.add(ring);
  }
}

// ── Context buildings (non-interactive gray blocks) ─────────
function addContextBuildings(g) {
  const grayMat = new THREE.MeshStandardMaterial({ color: 0x8A8580, roughness: 0.8 });
  const ltGrayMat = new THREE.MeshStandardMaterial({ color: 0x9A9590, roughness: 0.8 });
  const dkGrayMat = new THREE.MeshStandardMaterial({ color: 0x7A7570, roughness: 0.8 });
  const mats = [grayMat, ltGrayMat, dkGrayMat];

  function addBlock(x, z, w, d, h, matIdx = 0) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mats[matIdx % 3]);
    mesh.position.set(x, h / 2, z);
    mesh.castShadow = true; mesh.receiveShadow = true;
    g.add(mesh);
  }

  // ── East of 5th Avenue (X > 140) ──
  // Saks Fifth Avenue block (48th-49th, east of 5th)
  addBlock(175, -90, 55, 70, 30, 1);
  addBlock(220, -90, 30, 65, 45, 0);

  // St. Patrick's Cathedral area (50th-51st, east of 5th)
  addBlock(170, 40, 40, 28, 40, 1); // main nave
  addBlock(170, 55, 12, 10, 70, 2); // north spire
  addBlock(170, 25, 12, 10, 70, 2); // south spire
  addBlock(175, 90, 50, 55, 50, 0);
  addBlock(220, 90, 35, 60, 65, 1);

  // More east-of-5th context
  addBlock(175, 0, 45, 30, 35, 0);
  addBlock(220, 0, 35, 55, 55, 2);
  addBlock(175, 180, 48, 55, 40, 1);
  addBlock(220, 180, 32, 50, 60, 0);

  // ── West of 6th Avenue (X < -140) ──
  addBlock(-175, -90, 50, 65, 45, 0);
  addBlock(-220, -90, 35, 60, 35, 1);
  addBlock(-175, 0, 48, 70, 55, 2);
  addBlock(-220, 0, 38, 55, 40, 0);
  addBlock(-175, 90, 55, 60, 50, 1);
  addBlock(-220, 90, 40, 55, 70, 2);
  addBlock(-175, 180, 48, 55, 35, 0);
  addBlock(-220, 180, 35, 50, 55, 1);

  // ── South of 48th St (Z < -140) ──
  addBlock(-60, -180, 55, 60, 40, 0);
  addBlock(0, -180, 50, 55, 55, 1);
  addBlock(60, -180, 48, 58, 35, 2);
  addBlock(120, -180, 40, 55, 50, 0);

  // ── North of 51st St (Z > 140, except 75 Rock area) ──
  addBlock(-60, 180, 50, 55, 45, 1);
  addBlock(-100, 180, 45, 50, 55, 0);
  addBlock(110, 180, 42, 55, 40, 2);

  // ── Far north (52nd+) ──
  addBlock(-50, 250, 80, 55, 50, 0);
  addBlock(40, 250, 60, 50, 65, 1);
  addBlock(120, 250, 50, 55, 45, 2);

  // ── Far south (47th) ──
  addBlock(-50, -250, 70, 55, 45, 1);
  addBlock(40, -250, 55, 50, 60, 0);
  addBlock(120, -250, 45, 55, 35, 2);
}

// ── Trees ───────────────────────────────────────────────────
function addTrees(g) {
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x3A8A3A, roughness: 0.8 });
  const barkMat = new THREE.MeshStandardMaterial({ color: 0x5a3a1a, roughness: 0.9 });

  function tree(x, z) {
    const tk = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 2.5, 5), barkMat);
    tk.position.set(x, 1.25, z); g.add(tk);
    const cn = new THREE.Mesh(new THREE.SphereGeometry(1.6, 6, 5), leafMat);
    cn.position.set(x, 3.5, z); cn.castShadow = true; g.add(cn);
  }

  // 5th Avenue trees (both sides)
  for (let z = -200; z <= 220; z += 14) { tree(124, z); tree(136, z); }
  // 6th Avenue trees
  for (let z = -200; z <= 220; z += 14) { tree(-124, z); tree(-136, z); }
  // Cross-street trees
  for (let x = -110; x <= 110; x += 20) {
    tree(x, -58); tree(x, -42); // 49th St
    tree(x, 42); tree(x, 58);   // 50th St
  }
  // NBC / Today Show area trees
  for (const pos of [[-25, -45], [-10, -52], [5, -45], [20, -52]]) tree(...pos);
}

// ── Streets & crosswalks ────────────────────────────────────
function addStreets(g) {
  const stMat = new THREE.MeshStandardMaterial({ color: 0x2A2A30, roughness: 0.95 });
  const swMat = new THREE.MeshStandardMaterial({ color: 0xB8B0A0, roughness: 0.9 });
  const cwMat = new THREE.MeshStandardMaterial({ color: 0xEEEEEE, roughness: 0.8 });
  const stW = 18, avW = 22, swW = 4;

  function road(x, z, w, d) {
    const r = new THREE.Mesh(new THREE.PlaneGeometry(w, d), stMat);
    r.rotation.x = -Math.PI / 2; r.position.set(x, 0.04, z); r.receiveShadow = true; g.add(r);
  }
  function sidewalk(x, z, w, d) {
    const s = new THREE.Mesh(new THREE.PlaneGeometry(w, d), swMat);
    s.rotation.x = -Math.PI / 2; s.position.set(x, 0.035, z); g.add(s);
  }
  function crosswalk(x, z, rot, len = 14) {
    for (let i = -3; i <= 3; i++) {
      const stripe = new THREE.Mesh(new THREE.PlaneGeometry(1.2, len), cwMat);
      stripe.rotation.x = -Math.PI / 2;
      if (rot) stripe.rotation.z = Math.PI / 2;
      stripe.position.set(x + (rot ? 0 : i * 2.5), 0.06, z + (rot ? i * 2.5 : 0));
      g.add(stripe);
    }
  }

  // 5th Avenue
  road(130, 0, avW, 550);
  sidewalk(130 - avW / 2 - swW / 2, 0, swW, 550);
  sidewalk(130 + avW / 2 + swW / 2, 0, swW, 550);

  // 6th Avenue
  road(-130, 0, avW, 550);
  sidewalk(-130 - avW / 2 - swW / 2, 0, swW, 550);
  sidewalk(-130 + avW / 2 + swW / 2, 0, swW, 550);

  // Cross streets
  const streets = [
    { z: -210, label: 'W 47th Street' },
    { z: -130, label: 'W 48th Street' },
    { z: -50,  label: 'W 49th Street' },
    { z: 50,   label: 'W 50th Street' },
    { z: 130,  label: 'W 51st Street' },
    { z: 210,  label: 'W 52nd Street' },
  ];
  for (const st of streets) {
    road(0, st.z, 380, stW);
    sidewalk(0, st.z - stW / 2 - swW / 2, 380, swW);
    sidewalk(0, st.z + stW / 2 + swW / 2, 380, swW);
    // Crosswalks at 5th Ave
    crosswalk(130, st.z, true);
    // Crosswalks at 6th Ave
    crosswalk(-130, st.z, true);
  }

  return streets;
}

export function getCampusBuildingConfig(id) { return CAMPUS_BUILDINGS.find(b => b.id === id) || null; }

// ============================================================
export function createCampus(scene) {
  const g = new THREE.Group();
  const allFloors = [];

  // ── RC buildings ──
  for (const bldg of CAMPUS_BUILDINGS) {
    const { group, floorMeshes } = createInteractiveBuilding(bldg);
    g.add(group); allFloors.push(...floorMeshes);
  }

  // ── Streets & sidewalks ──
  const streets = addStreets(g);

  // ── Context buildings ──
  addContextBuildings(g);

  // ── Trees ──
  addTrees(g);

  // ── Atlas statue ──
  addAtlas(g);

  // ── Labels ──
  g.add(makeLabel('30 Rockefeller Plaza', 5, 275, 0, 1.4));
  for (const b of CAMPUS_BUILDINGS) {
    const maxF = Math.max(...b.tiers.map(t => t.endFloor));
    const labelY = b.special === 'rcmh' ? 40 : LOBBY_H + maxF * FLOOR_H + 8;
    g.add(makeLabel(b.fullName, b.x, labelY, b.z, maxF > 20 ? 0.9 : 0.7));
  }
  g.add(streetLabel('FIFTH AVENUE', 130, 1, 0, 1.3));
  g.add(streetLabel('SIXTH AVENUE', -130, 1, 0, 1.1));
  for (const st of streets) g.add(streetLabel(st.label, 0, 1, st.z, 0.9));

  scene.add(g);
  return { campusGroup: g, campusFloorMeshes: allFloors };
}
