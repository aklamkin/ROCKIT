import * as THREE from 'three';

// ============================================================
// Rockefeller Center Campus — accurate positions and shapes
// ============================================================
// Scale: 1 unit = 1 meter. Origin = 30 Rock center.
// X = east(+)/west(-), Z = north(+)/south(-), Y = up
//
// Street grid:
//   48th St: Z ≈ -160    49th St: Z ≈ -80
//   50th St: Z ≈ +80     51st St: Z ≈ +160
//   5th Ave: X ≈ +140    6th Ave: X ≈ -140
//   Rockefeller Plaza: X ≈ +15
//   Cross streets ~18m wide, avenues ~22m wide
// ============================================================

const FLOOR_H = 3.66;
const LOBBY_H = 5.5;

export const CAMPUS_BUILDINGS = [
  // International Building — 630 Fifth Ave, 41 floors, 156m
  // Cruciform: tower set back from 5th Ave, two 6-story wings
  { id: 'INTL', shortName: 'International', fullName: 'International Building',
    tiers: [
      { startFloor: 0, endFloor: 3,  width: 50, depth: 70 },
      { startFloor: 4, endFloor: 8,  width: 45, depth: 60 },
      { startFloor: 9, endFloor: 22, width: 35, depth: 50 },
      { startFloor: 23, endFloor: 34, width: 28, depth: 38 },
      { startFloor: 35, endFloor: 40, width: 20, depth: 28 },
    ],
    x: 100, z: 120, color: '#D0C8A8' },

  // Palazzo d'Italia — south wing of International, 6 floors
  { id: 'PALAZZO', shortName: "Palazzo d'Italia", fullName: "Palazzo d'Italia",
    tiers: [{ startFloor: 0, endFloor: 5, width: 16, depth: 70 }],
    x: 125, z: 90, color: '#D0C8A8' },

  // International Building North — north wing, 6 floors
  { id: 'INTL_N', shortName: 'Intl North', fullName: 'International Building North',
    tiers: [{ startFloor: 0, endFloor: 5, width: 16, depth: 70 }],
    x: 125, z: 150, color: '#D0C8A8' },

  // British Empire Building — 620 Fifth Ave, 6 floors, 26m
  // 61m frontage on 5th Ave × 96m deep N-S. North of Channel Gardens.
  { id: 'BRIT', shortName: 'British Empire', fullName: 'British Empire Building',
    tiers: [{ startFloor: 0, endFloor: 5, width: 61, depth: 40 }],
    x: 135, z: 40, color: '#D2C9B0' },

  // La Maison Francaise — 610 Fifth Ave, 6 floors, 26m
  // Mirror twin of British Empire, south of Channel Gardens
  { id: 'MAISON', shortName: 'La Maison', fullName: 'La Maison Francaise',
    tiers: [{ startFloor: 0, endFloor: 5, width: 61, depth: 40 }],
    x: 135, z: -20, color: '#D2C9B0' },

  // 1270 Avenue of the Americas (RKO) — 31 floors, 122m
  // On 6th Ave, 50th-51st block, built over Radio City
  { id: '1270AVE', shortName: '1270 Ave', fullName: '1270 Avenue of the Americas',
    tiers: [
      { startFloor: 0, endFloor: 5,  width: 50, depth: 60 },
      { startFloor: 6, endFloor: 20, width: 38, depth: 48 },
      { startFloor: 21, endFloor: 30, width: 26, depth: 35 },
    ],
    x: -120, z: 120, color: '#C8C0A0' },

  // Radio City Music Hall — distinctive barrel vault, ~27m tall
  // On 6th Ave between 50th-51st, entrance at 50th & 6th
  { id: 'RCMH', shortName: 'Radio City', fullName: 'Radio City Music Hall',
    tiers: [{ startFloor: 0, endFloor: 2, width: 91, depth: 61 }],
    x: -95, z: 120, color: '#7B6345',
    special: 'rcmh' },

  // 1250 Avenue of the Americas (RCA West) — 16 floors, 64m
  // Western annex of 30 Rock on 6th Ave, 49th-50th block
  { id: '1250AVE', shortName: '1250 Ave', fullName: '1250 Avenue of the Americas',
    tiers: [
      { startFloor: 0, endFloor: 5,  width: 40, depth: 80 },
      { startFloor: 6, endFloor: 15, width: 35, depth: 65 },
    ],
    x: -80, z: 0, color: '#D0C8A8' },

  // 1 Rockefeller Plaza — 36 floors, 149m
  // East of Rockefeller Plaza, 48th-49th block
  { id: '1ROCK', shortName: '1 Rock Plaza', fullName: '1 Rockefeller Plaza',
    tiers: [
      { startFloor: 0, endFloor: 6,  width: 45, depth: 75 },
      { startFloor: 7, endFloor: 22, width: 35, depth: 60 },
      { startFloor: 23, endFloor: 35, width: 25, depth: 40 },
    ],
    x: 25, z: -120, color: '#D0C8A8' },

  // 10 Rockefeller Plaza (Eastern Airlines) — 16 floors, 68m
  // West of Rockefeller Plaza, 48th-49th block
  { id: '10ROCK', shortName: '10 Rock', fullName: '10 Rockefeller Plaza',
    tiers: [{ startFloor: 0, endFloor: 15, width: 35, depth: 61 }],
    x: -25, z: -120, color: '#D0C8A8' },

  // 50 Rockefeller Plaza (AP Building) — 15 floors, 69m
  // NO setbacks (unique). East of plaza, 50th-51st block
  { id: '50ROCK', shortName: '50 Rock', fullName: '50 Rockefeller Plaza',
    tiers: [{ startFloor: 0, endFloor: 14, width: 57, depth: 61 }],
    x: 25, z: 120, color: '#D0C8A8' },

  // 75 Rockefeller Plaza (Esso) — 33 floors, 122m
  // North of complex, on 51st-52nd block. Modernist style.
  { id: '75ROCK', shortName: '75 Rock', fullName: '75 Rockefeller Plaza',
    tiers: [
      { startFloor: 0, endFloor: 2,  width: 60, depth: 70 },
      { startFloor: 3, endFloor: 9,  width: 50, depth: 60 },
      { startFloor: 10, endFloor: 22, width: 38, depth: 45 },
      { startFloor: 23, endFloor: 32, width: 28, depth: 35 },
    ],
    x: 50, z: 200, color: '#B8B0A0' },

  // 1230 Avenue of the Americas (US Rubber/S&S) — 21 floors, 84m
  // On 6th Ave, 48th-49th block
  { id: '1230AVE', shortName: '1230 Ave', fullName: '1230 Avenue of the Americas',
    tiers: [
      { startFloor: 0, endFloor: 6,  width: 60, depth: 70 },
      { startFloor: 7, endFloor: 20, width: 42, depth: 50 },
    ],
    x: -120, z: -120, color: '#C8C0A0' },

  // 600 Fifth Avenue — 27 floors, 107m. L-shaped.
  // Corner of 5th Ave & 48th St
  { id: '600FIFTH', shortName: '600 Fifth', fullName: '600 Fifth Avenue',
    tiers: [
      { startFloor: 0, endFloor: 6,  width: 40, depth: 61 },
      { startFloor: 7, endFloor: 26, width: 30, depth: 45 },
    ],
    x: 135, z: -120, color: '#C8C0A0' },
];

// ── Textures ──
function windowTex(w, bgColor = '#C8BFA0') {
  const canvas = document.createElement('canvas');
  const S = 128; canvas.width = S; canvas.height = S;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = bgColor; ctx.fillRect(0, 0, S, S);
  const cols = 6, rows = 3, gX = S / cols, gY = S / rows;
  ctx.fillStyle = '#1a2233';
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++)
    ctx.fillRect(c * gX + gX * 0.2, r * gY + gY * 0.12, gX * 0.55, gY * 0.7);
  ctx.fillStyle = bgColor;
  for (let c = 0; c <= cols; c++) ctx.fillRect(c * gX - 1, 0, 2, S);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(w / 8, 1);
  return tex;
}

const texCache = {};
function cachedTex(w, color) { const k = color + '_' + Math.round(w); if (!texCache[k]) texCache[k] = windowTex(w, color); return texCache[k]; }

function campusFloorMat(f, tw, color) {
  if (f === 0) return new THREE.MeshStandardMaterial({ color: 0x4A4A54, roughness: 0.35, metalness: 0.2 });
  return new THREE.MeshStandardMaterial({ map: cachedTex(tw, color), roughness: 0.55, metalness: 0.05 });
}

// ── Build interactive building ──
function createInteractiveBuilding(cfg) {
  const { id, tiers, x, z, color } = cfg;
  const group = new THREE.Group();
  const floorMeshes = [];
  for (const tier of tiers) {
    for (let f = tier.startFloor; f <= tier.endFloor; f++) {
      const isLobby = f === 0;
      const h = isLobby ? LOBBY_H : FLOOR_H;
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(tier.width, h, tier.depth), campusFloorMat(f, tier.width, color));
      mesh.position.y = f === 0 ? LOBBY_H / 2 : LOBBY_H + (f - 1) * FLOOR_H + FLOOR_H / 2;
      mesh.castShadow = true; mesh.receiveShadow = true;
      mesh.userData = { type: 'floor', floorNumber: f, floorId: `${id}-F${f}`, buildingId: id, defaultMaterial: mesh.material };
      floorMeshes.push(mesh); group.add(mesh);
    }
  }
  group.position.set(x, 0, z);
  if (cfg.special === 'rcmh') addRCMH(group);
  return { group, floorMeshes };
}

// ── Radio City Music Hall decorations ──
function addRCMH(group) {
  const topY = LOBBY_H + 2 * FLOOR_H;

  // Barrel vault roof — series of arched ribs (sunset motif)
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x5B4B35, roughness: 0.6 });
  const roofGeo = new THREE.CylinderGeometry(22, 22, 61, 16, 1, false, 0, Math.PI);
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.rotation.z = Math.PI / 2;
  roof.rotation.y = Math.PI / 2;
  roof.position.y = topY;
  roof.castShadow = true;
  group.add(roof);

  // Marquee on 6th Ave side (west face)
  const marqueeMat = new THREE.MeshStandardMaterial({ color: 0xFFDD44, emissive: 0xFFAA00, emissiveIntensity: 0.4, roughness: 0.3 });
  const marquee = new THREE.Mesh(new THREE.BoxGeometry(6, 5, 50), marqueeMat);
  marquee.position.set(-48, 4, 0);
  group.add(marquee);

  // Three 90ft (27m) vertical "RADIO CITY" signs
  const signMat = new THREE.MeshStandardMaterial({ color: 0xFF3333, emissive: 0xFF2222, emissiveIntensity: 0.5, roughness: 0.3 });
  for (const zOff of [-18, 0, 18]) {
    const sign = new THREE.Mesh(new THREE.BoxGeometry(3, 27, 0.5), signMat);
    sign.position.set(-47, 20, zOff);
    group.add(sign);
  }
}

// ── Labels ──
function makeLabel(text, x, y, z, scale = 1) {
  const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(18,22,36,0.85)'; ctx.fillRect(0, 0, 512, 64);
  ctx.fillStyle = '#E8E8F0'; ctx.font = 'bold 26px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 34);
  const tex = new THREE.CanvasTexture(canvas);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  sprite.position.set(x, y, z); sprite.scale.set(20 * scale, 2.5 * scale, 1);
  return sprite;
}

function streetLabel(text, x, y, z, scale = 1) {
  const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 48;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#888888'; ctx.font = 'bold 24px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 26);
  const tex = new THREE.CanvasTexture(canvas);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  sprite.position.set(x, y, z); sprite.scale.set(18 * scale, 2 * scale, 1);
  return sprite;
}

export function getCampusBuildingConfig(id) { return CAMPUS_BUILDINGS.find(b => b.id === id) || null; }

// ── Atlas statue at International Building ──
function addAtlas(g) {
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.4 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 3, 3, 8), baseMat);
  base.position.set(110, 1.5, 120); g.add(base);
  const bronzeMat = new THREE.MeshStandardMaterial({ color: 0x6B4C3B, roughness: 0.3, metalness: 0.6 });
  const globe = new THREE.Mesh(new THREE.SphereGeometry(3, 16, 12), bronzeMat);
  globe.position.set(110, 7, 120); g.add(globe);
  for (const [rx, rz] of [[Math.PI / 6, 0], [0, Math.PI / 3]]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(3.5, 0.15, 8, 24), bronzeMat);
    ring.position.set(110, 7, 120); ring.rotation.x = rx; ring.rotation.z = rz; g.add(ring);
  }
}

// ============================================================
export function createCampus(scene) {
  const g = new THREE.Group();
  const allFloors = [];

  for (const bldg of CAMPUS_BUILDINGS) {
    const { group, floorMeshes } = createInteractiveBuilding(bldg);
    g.add(group); allFloors.push(...floorMeshes);
  }

  // ── STREETS ──
  const stMat = new THREE.MeshStandardMaterial({ color: 0x1e1e24, roughness: 0.95 });
  const swMat = new THREE.MeshStandardMaterial({ color: 0x353540, roughness: 0.9 });
  const stW = 18, swW = 5;

  // 5th Avenue (X ≈ +140)
  const fifth = new THREE.Mesh(new THREE.PlaneGeometry(stW, 450), stMat);
  fifth.rotation.x = -Math.PI / 2; fifth.position.set(140, 0.04, 20); fifth.receiveShadow = true; g.add(fifth);
  for (const s of [-1, 1]) { const sw = new THREE.Mesh(new THREE.PlaneGeometry(swW, 450), swMat); sw.rotation.x = -Math.PI / 2; sw.position.set(140 + s * (stW / 2 + swW / 2), 0.035, 20); g.add(sw); }

  // 6th Avenue (X ≈ -140)
  const sixth = new THREE.Mesh(new THREE.PlaneGeometry(stW + 4, 450), stMat);
  sixth.rotation.x = -Math.PI / 2; sixth.position.set(-140, 0.04, 20); sixth.receiveShadow = true; g.add(sixth);
  for (const s of [-1, 1]) { const sw = new THREE.Mesh(new THREE.PlaneGeometry(swW, 450), swMat); sw.rotation.x = -Math.PI / 2; sw.position.set(-140 + s * 14, 0.035, 20); g.add(sw); }

  // Cross streets
  const streets = [
    { z: -160, label: 'W 48th Street' }, { z: -80, label: 'W 49th Street' },
    { z: 80, label: 'W 50th Street' }, { z: 160, label: 'W 51st Street' },
  ];
  for (const st of streets) {
    const road = new THREE.Mesh(new THREE.PlaneGeometry(350, stW), stMat);
    road.rotation.x = -Math.PI / 2; road.position.set(0, 0.04, st.z); road.receiveShadow = true; g.add(road);
    for (const s of [-1, 1]) { const sw = new THREE.Mesh(new THREE.PlaneGeometry(350, swW), swMat); sw.rotation.x = -Math.PI / 2; sw.position.set(0, 0.035, st.z + s * (stW / 2 + swW / 2)); g.add(sw); }
  }

  // ── TREES ──
  const trMat = new THREE.MeshStandardMaterial({ color: 0x2a6a2a, roughness: 0.8 });
  const tkMat = new THREE.MeshStandardMaterial({ color: 0x5a3a1a, roughness: 0.9 });
  function addTree(x, z) {
    const tk = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 2.5, 5), tkMat); tk.position.set(x, 1.25, z); g.add(tk);
    const cn = new THREE.Mesh(new THREE.SphereGeometry(1.8, 6, 5), trMat); cn.position.set(x, 3.5, z); g.add(cn);
  }
  for (let z = -150; z <= 200; z += 15) { addTree(130, z); addTree(150, z); addTree(-130, z); addTree(-152, z); }

  // ── Atlas ──
  addAtlas(g);

  // ── LABELS ──
  g.add(makeLabel('30 Rockefeller Plaza', 5, 275, 0, 1.4));
  for (const b of CAMPUS_BUILDINGS) {
    const maxF = Math.max(...b.tiers.map(t => t.endFloor));
    g.add(makeLabel(b.fullName, b.x, LOBBY_H + maxF * FLOOR_H + 8, b.z, maxF > 20 ? 0.9 : 0.7));
  }
  g.add(streetLabel('FIFTH AVENUE', 140, 1, 20, 1.3));
  g.add(streetLabel('SIXTH AVENUE', -140, 1, 20, 1.1));
  for (const st of streets) g.add(streetLabel(st.label, 0, 1, st.z, 1.0));

  scene.add(g);
  return { campusGroup: g, campusFloorMeshes: allFloors };
}
