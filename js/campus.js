import * as THREE from 'three';
import { createFacadeTexture } from './building.js';

// ============================================================
// Rockefeller Center Campus — Apple Maps reference rebuild
// ============================================================
// Scale: 1 unit ≈ 1 meter.  Origin = 30 Rock center.
// X = east(+)/west(−)  Z = north(+)/south(−)  Y = up
//
// Real-world layout (looking down, north up):
//   5th Avenue runs N-S on the EAST side
//   6th Avenue runs N-S on the WEST side
//   Streets run E-W
//
// In our model:
//   X axis = east-west (matches E-W in reality)
//   Z axis = north-south (Z+ = north, Z- = south)
//
// Block structure:
//   48th-49th St block: Z ≈ -50 to -130 (south block)
//   49th-50th St block: Z ≈ -50 to +50  (30 Rock's block)
//   50th-51st St block: Z ≈ +50 to +130 (north block)
//   5th Avenue: X ≈ +120
//   6th Avenue: X ≈ -120
// ============================================================

const FLOOR_H = 3.66;
const LOBBY_H = 5.5;

// ── Rockefeller Center building configs ─────────────────────
export const CAMPUS_BUILDINGS = [

  // ─── 50th-51st block (NORTH of 30 Rock) ───

  // International Building — tall tower on 5th Ave between 50th & 51st
  { id: 'INTL', shortName: 'International', fullName: 'International Building',
    tiers: [
      { startFloor: 0, endFloor: 4,  width: 46, depth: 66 },
      { startFloor: 5, endFloor: 10, width: 38, depth: 54 },
      { startFloor: 11, endFloor: 24, width: 28, depth: 42 },
      { startFloor: 25, endFloor: 34, width: 22, depth: 32 },
      { startFloor: 35, endFloor: 40, width: 16, depth: 24 },
    ],
    x: 80, z: 90, color: '#D0C4A8' },

  // Palazzo d'Italia — low-rise south of International Building, flanking the courtyard
  { id: 'PALAZZO', shortName: "Palazzo d'Italia", fullName: "Palazzo d'Italia",
    tiers: [{ startFloor: 0, endFloor: 5, width: 14, depth: 52 }],
    x: 108, z: 65, color: '#D0C4A8' },

  // International Building North — low-rise north side
  { id: 'INTL_N', shortName: 'Intl North', fullName: 'International Building North',
    tiers: [{ startFloor: 0, endFloor: 5, width: 14, depth: 52 }],
    x: 108, z: 115, color: '#D0C4A8' },

  // 50 Rockefeller Plaza — medium building east of center in north block
  { id: '50ROCK', shortName: '50 Rock', fullName: '50 Rockefeller Plaza',
    tiers: [
      { startFloor: 0, endFloor: 5,  width: 52, depth: 56 },
      { startFloor: 6, endFloor: 14, width: 38, depth: 44 },
    ],
    x: 20, z: 90, color: '#D0C4A8', greenRoof: true },

  // 1270 Avenue of the Americas — tall slab on 6th Ave, north block
  { id: '1270AVE', shortName: '1270 Ave', fullName: '1270 Avenue of the Americas',
    tiers: [
      { startFloor: 0, endFloor: 5,  width: 46, depth: 56 },
      { startFloor: 6, endFloor: 18, width: 34, depth: 46 },
      { startFloor: 19, endFloor: 30, width: 24, depth: 34 },
    ],
    x: -80, z: 90, color: '#C8C0A0' },

  // Radio City Music Hall — iconic venue, NW of 30 Rock on 6th Ave
  { id: 'RCMH', shortName: 'Radio City', fullName: 'Radio City Music Hall',
    tiers: [{ startFloor: 0, endFloor: 2, width: 82, depth: 54 }],
    x: -42, z: 90, color: '#7B6345', special: 'rcmh' },

  // ─── 49th-50th block (30 Rock's block — flanking buildings) ───

  // British Empire Building — 6-story, NORTH of Channel Gardens, facing 5th Ave
  { id: 'BRIT', shortName: 'British Empire', fullName: 'British Empire Building',
    tiers: [{ startFloor: 0, endFloor: 5, width: 52, depth: 16 }],
    x: 84, z: 18, color: '#D2C9B0', greenRoof: true },

  // La Maison Francaise — 6-story, SOUTH of Channel Gardens, facing 5th Ave
  { id: 'MAISON', shortName: 'La Maison', fullName: 'La Maison Francaise',
    tiers: [{ startFloor: 0, endFloor: 5, width: 52, depth: 16 }],
    x: 84, z: -18, color: '#D2C9B0', greenRoof: true },

  // 1250 Avenue of the Americas — medium tower on 6th Ave side of 30 Rock's block
  { id: '1250AVE', shortName: '1250 Ave', fullName: '1250 Avenue of the Americas',
    tiers: [
      { startFloor: 0, endFloor: 5,  width: 36, depth: 70 },
      { startFloor: 6, endFloor: 15, width: 28, depth: 56 },
    ],
    x: -78, z: 0, color: '#D0C8A8' },

  // ─── 48th-49th block (SOUTH of 30 Rock) ───

  // 1 Rockefeller Plaza — tall building center/east of south block
  { id: '1ROCK', shortName: '1 Rock Plaza', fullName: '1 Rockefeller Plaza',
    tiers: [
      { startFloor: 0, endFloor: 6,  width: 40, depth: 66 },
      { startFloor: 7, endFloor: 20, width: 30, depth: 50 },
      { startFloor: 21, endFloor: 35, width: 20, depth: 34 },
    ],
    x: 25, z: -90, color: '#D0C4A8' },

  // 10 Rockefeller Plaza — shorter building west of 1 Rock
  { id: '10ROCK', shortName: '10 Rock', fullName: '10 Rockefeller Plaza',
    tiers: [{ startFloor: 0, endFloor: 15, width: 30, depth: 54 }],
    x: -15, z: -90, color: '#D0C4A8' },

  // 600 Fifth Avenue — medium tower on 5th Ave, south block
  { id: '600FIFTH', shortName: '600 Fifth', fullName: '600 Fifth Avenue',
    tiers: [
      { startFloor: 0, endFloor: 6,  width: 36, depth: 52 },
      { startFloor: 7, endFloor: 26, width: 26, depth: 38 },
    ],
    x: 84, z: -90, color: '#C8C0A0' },

  // 1230 Avenue of the Americas — 6th Ave side, south block
  { id: '1230AVE', shortName: '1230 Ave', fullName: '1230 Avenue of the Americas',
    tiers: [
      { startFloor: 0, endFloor: 6,  width: 52, depth: 64 },
      { startFloor: 7, endFloor: 20, width: 38, depth: 46 },
    ],
    x: -80, z: -90, color: '#C8C0A0' },

  // ─── 51st-52nd block (further north) ───

  // 75 Rockefeller Plaza
  { id: '75ROCK', shortName: '75 Rock', fullName: '75 Rockefeller Plaza',
    tiers: [
      { startFloor: 0, endFloor: 3,  width: 52, depth: 62 },
      { startFloor: 4, endFloor: 10, width: 42, depth: 50 },
      { startFloor: 11, endFloor: 22, width: 32, depth: 38 },
      { startFloor: 23, endFloor: 32, width: 22, depth: 28 },
    ],
    x: 30, z: 180, color: '#B8B0A0' },
];

// ── Texture helpers ─────────────────────────────────────────
const _campusTexCache = {};
function cachedFacadeTex(w, color) {
  const k = `${Math.round(w)}_${color}`;
  if (!_campusTexCache[k]) _campusTexCache[k] = createFacadeTexture(w, color);
  return _campusTexCache[k];
}

const campusRoofMat = new THREE.MeshStandardMaterial({ color: 0xCBB09A, roughness: 0.75 });
const campusLobbyMat = new THREE.MeshStandardMaterial({ color: 0x5A5550, roughness: 0.35, metalness: 0.2 });
const corniceMat = new THREE.MeshStandardMaterial({ color: 0xC8B898, roughness: 0.6 });

function campusFloorMat(f, tw, td, color) {
  if (f === 0) return [campusLobbyMat, campusLobbyMat, campusRoofMat, campusRoofMat, campusLobbyMat, campusLobbyMat];
  const facW = new THREE.MeshStandardMaterial({ map: cachedFacadeTex(tw, color), roughness: 0.55, metalness: 0.05 });
  const facD = new THREE.MeshStandardMaterial({ map: cachedFacadeTex(td, color), roughness: 0.55, metalness: 0.05 });
  return [facW, facW, campusRoofMat, campusRoofMat, facD, facD];
}

// ── Build interactive building ──────────────────────────────
function createInteractiveBuilding(cfg) {
  const { id, tiers, x, z, color } = cfg;
  const group = new THREE.Group();
  const floorMeshes = [];
  let prevTier = null;

  for (const tier of tiers) {
    for (let f = tier.startFloor; f <= tier.endFloor; f++) {
      const h = f === 0 ? LOBBY_H : FLOOR_H;
      const mat = campusFloorMat(f, tier.width, tier.depth, color);
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(tier.width, h, tier.depth), mat);
      mesh.position.y = f === 0 ? LOBBY_H / 2 : LOBBY_H + (f - 1) * FLOOR_H + FLOOR_H / 2;
      mesh.castShadow = true; mesh.receiveShadow = true;
      mesh.userData = {
        type: 'floor', floorNumber: f,
        floorId: `${id}-F${f}`, buildingId: id, defaultMaterial: mat
      };
      floorMeshes.push(mesh); group.add(mesh);
    }

    // Cornice at setback transitions
    if (prevTier && (prevTier.width !== tier.width || prevTier.depth !== tier.depth)) {
      const pf = tier.startFloor;
      const corniceY = pf <= 0 ? LOBBY_H : LOBBY_H + (pf - 1) * FLOOR_H;
      const overhang = 1.0;
      const cornice = new THREE.Mesh(
        new THREE.BoxGeometry(prevTier.width + overhang * 2, 0.35, prevTier.depth + overhang * 2),
        corniceMat
      );
      cornice.position.y = corniceY;
      cornice.castShadow = true;
      group.add(cornice);
    }
    prevTier = tier;
  }

  group.position.set(x, 0, z);

  // Green rooftop garden
  if (cfg.greenRoof) {
    const topTier = tiers[tiers.length - 1];
    const topY = LOBBY_H + (topTier.endFloor - 1) * FLOOR_H + FLOOR_H;
    const gMat = new THREE.MeshStandardMaterial({ color: 0x6BA34A, roughness: 0.8 });
    const patch = new THREE.Mesh(
      new THREE.PlaneGeometry(topTier.width * 0.7, topTier.depth * 0.65),
      gMat
    );
    patch.rotation.x = -Math.PI / 2;
    patch.position.set(0, topY + 0.08, 0);
    group.add(patch);
  }

  if (cfg.special === 'rcmh') addRCMH(group);
  return { group, floorMeshes };
}

// ── Radio City Music Hall decorations ───────────────────────
function addRCMH(group) {
  const topY = LOBBY_H + 2 * FLOOR_H;

  // Barrel vault roof
  const roofGeo = new THREE.CylinderGeometry(18, 18, 52, 16, 1, false, 0, Math.PI);
  const roofMesh = new THREE.Mesh(roofGeo,
    new THREE.MeshStandardMaterial({ color: 0x5B4B35, roughness: 0.6 }));
  roofMesh.rotation.z = Math.PI / 2;
  roofMesh.rotation.y = Math.PI / 2;
  roofMesh.position.y = topY;
  roofMesh.castShadow = true; group.add(roofMesh);

  // Marquee on 6th Ave side (west face)
  const marquee = new THREE.Mesh(
    new THREE.BoxGeometry(5, 4, 40),
    new THREE.MeshStandardMaterial({ color: 0xFFDD44, emissive: 0xFFAA00, emissiveIntensity: 0.4, roughness: 0.3 })
  );
  marquee.position.set(-42, 3.5, 0); group.add(marquee);

  // Vertical "RADIO CITY" neon signs
  const signMat = new THREE.MeshStandardMaterial({
    color: 0xFF3333, emissive: 0xFF2222, emissiveIntensity: 0.5, roughness: 0.3
  });
  for (const zOff of [-14, 0, 14]) {
    const sign = new THREE.Mesh(new THREE.BoxGeometry(2.5, 22, 0.5), signMat);
    sign.position.set(-42, 17, zOff); group.add(sign);
  }
}

// ── Labels ──────────────────────────────────────────────────
function makeLabel(text, x, y, z, scale = 1) {
  const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(18,22,36,0.85)';
  ctx.fillRect(0, 0, 512, 64);
  ctx.fillStyle = '#E8E8F0'; ctx.font = 'bold 26px sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 34);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: new THREE.CanvasTexture(canvas), transparent: true, depthWrite: false
  }));
  sprite.position.set(x, y, z);
  sprite.scale.set(20 * scale, 2.5 * scale, 1);
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
  sprite.position.set(x, y, z);
  sprite.scale.set(18 * scale, 2 * scale, 1);
  return sprite;
}

// ── Atlas statue (in front of International Building on 5th Ave) ──
function addAtlas(g) {
  const bMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.4 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.8, 3, 8), bMat);
  base.position.set(108, 1.5, 90); g.add(base);
  const bronzeMat = new THREE.MeshStandardMaterial({ color: 0x6B4C3B, roughness: 0.3, metalness: 0.6 });
  const globe = new THREE.Mesh(new THREE.SphereGeometry(2.8, 16, 12), bronzeMat);
  globe.position.set(108, 6.5, 90); g.add(globe);
  for (const [rx, rz] of [[Math.PI / 6, 0], [0, Math.PI / 3], [Math.PI / 4, Math.PI / 6]]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.12, 8, 24), bronzeMat);
    ring.position.set(108, 6.5, 90); ring.rotation.x = rx; ring.rotation.z = rz; g.add(ring);
  }
}

// ── Context buildings (non-interactive gray blocks) ─────────
function addContextBuildings(g) {
  const mats = [
    new THREE.MeshStandardMaterial({ color: 0x8A8580, roughness: 0.8 }),
    new THREE.MeshStandardMaterial({ color: 0x9A9590, roughness: 0.8 }),
    new THREE.MeshStandardMaterial({ color: 0x7A7570, roughness: 0.8 }),
  ];

  function addBlock(x, z, w, d, h, matIdx = 0) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mats[matIdx % 3]);
    mesh.position.set(x, h / 2, z);
    mesh.castShadow = true; mesh.receiveShadow = true;
    g.add(mesh);
  }

  // ── East of 5th Avenue (X > 130) ──
  // Saks Fifth Avenue area
  addBlock(160, -90, 50, 68, 28, 1);
  addBlock(200, -90, 28, 62, 42, 0);

  // St. Patrick's Cathedral
  addBlock(155, 40, 38, 26, 38, 1);
  addBlock(155, 55, 10, 8, 65, 2);  // north spire
  addBlock(155, 25, 10, 8, 65, 2);  // south spire
  addBlock(160, 90, 46, 52, 48, 0);
  addBlock(200, 90, 32, 56, 60, 1);

  // More east context
  addBlock(160, 0, 40, 28, 32, 0);
  addBlock(200, 0, 32, 52, 52, 2);
  addBlock(160, 180, 44, 52, 38, 1);
  addBlock(200, 180, 30, 48, 55, 0);

  // ── West of 6th Avenue (X < -130) ──
  addBlock(-160, -90, 48, 62, 42, 0);
  addBlock(-200, -90, 32, 58, 32, 1);
  addBlock(-160, 0, 45, 68, 50, 2);
  addBlock(-200, 0, 36, 52, 38, 0);
  addBlock(-160, 90, 52, 58, 46, 1);
  addBlock(-200, 90, 38, 52, 65, 2);
  addBlock(-160, 180, 45, 52, 32, 0);
  addBlock(-200, 180, 32, 48, 50, 1);

  // ── South of 48th St ──
  addBlock(-50, -180, 52, 58, 38, 0);
  addBlock(0, -180, 48, 52, 50, 1);
  addBlock(55, -180, 45, 55, 32, 2);
  addBlock(110, -180, 38, 52, 46, 0);

  // ── North of 51st St ──
  addBlock(-50, 180, 48, 52, 42, 1);
  addBlock(-90, 180, 42, 48, 50, 0);
  addBlock(100, 180, 40, 52, 38, 2);

  // ── Far north/south ──
  addBlock(-45, 250, 75, 52, 46, 0);
  addBlock(35, 250, 55, 48, 60, 1);
  addBlock(110, 250, 45, 52, 42, 2);
  addBlock(-45, -250, 65, 52, 42, 1);
  addBlock(35, -250, 50, 48, 55, 0);
  addBlock(110, -250, 42, 52, 32, 2);
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
  for (let z = -200; z <= 220; z += 14) { tree(114, z); tree(126, z); }
  // 6th Avenue trees
  for (let z = -200; z <= 220; z += 14) { tree(-114, z); tree(-126, z); }
  // Cross-street trees (along sidewalks)
  for (let x = -100; x <= 100; x += 18) {
    tree(x, -56); tree(x, -44);  // 49th St
    tree(x, 44); tree(x, 56);    // 50th St
    tree(x, -136); tree(x, -124); // 48th St
    tree(x, 124); tree(x, 136);   // 51st St
  }
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

  // 5th Avenue (east side)
  road(120, 0, avW, 550);
  sidewalk(120 - avW / 2 - swW / 2, 0, swW, 550);
  sidewalk(120 + avW / 2 + swW / 2, 0, swW, 550);

  // 6th Avenue (west side)
  road(-120, 0, avW, 550);
  sidewalk(-120 - avW / 2 - swW / 2, 0, swW, 550);
  sidewalk(-120 + avW / 2 + swW / 2, 0, swW, 550);

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
    road(0, st.z, 360, stW);
    sidewalk(0, st.z - stW / 2 - swW / 2, 360, swW);
    sidewalk(0, st.z + stW / 2 + swW / 2, 360, swW);
    crosswalk(120, st.z, true);
    crosswalk(-120, st.z, true);
  }

  return streets;
}

export function getCampusBuildingConfig(id) {
  return CAMPUS_BUILDINGS.find(b => b.id === id) || null;
}

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
  g.add(makeLabel('30 Rockefeller Plaza', 0, 275, 0, 1.4));
  for (const b of CAMPUS_BUILDINGS) {
    const maxF = Math.max(...b.tiers.map(t => t.endFloor));
    const labelY = b.special === 'rcmh' ? 40 : LOBBY_H + maxF * FLOOR_H + 8;
    g.add(makeLabel(b.fullName, b.x, labelY, b.z, maxF > 20 ? 0.9 : 0.7));
  }
  g.add(streetLabel('FIFTH AVENUE', 120, 1, 0, 1.3));
  g.add(streetLabel('SIXTH AVENUE', -120, 1, 0, 1.1));
  for (const st of streets) g.add(streetLabel(st.label, 0, 1, st.z, 0.9));

  scene.add(g);
  return { campusGroup: g, campusFloorMeshes: allFloors };
}
