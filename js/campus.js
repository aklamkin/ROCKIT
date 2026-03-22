import * as THREE from 'three';

// ============================================================
// Rockefeller Center Campus — accurate layout
// ============================================================
// Scale: 1 unit = 1 meter
//
// Coordinate system:
//   X axis = east(+) / west(-)
//   Z axis = north(+) / south(-)
//   Y axis = up
//
// 30 Rockefeller Plaza is at origin (0,0,0).
//
// Real-world grid (approximate meters from 30 Rock center):
//   5th Avenue (east edge):     X ≈ +130
//   6th Avenue (west edge):     X ≈ -130
//   48th Street (south):        Z ≈ -160
//   49th Street:                Z ≈ -80
//   50th Street:                Z ≈ +80
//   51st Street (north):        Z ≈ +160
//
// Manhattan blocks between avenues: ~250m (820ft)
// Cross-street spacing: ~80m (260ft)
// Street width: ~18m (60ft)
// Sidewalk width: ~5m (16ft) each side
// ============================================================

const FLOOR_H = 3.66;
const LOBBY_H = 5.5;

// ============================================================
// Campus building configurations
// ============================================================
// Positions are [x, z] in meters from 30 Rock center.
// Dimensions in tiers: [width(E-W), depth(N-S)]
// Heights/floors from research.
export const CAMPUS_BUILDINGS = [
  // ── International Building ── 630 Fifth Ave, 41 floors, 512ft (156m)
  // On 5th Ave between 50th (south) and 51st (north) Streets — northeast of 30 Rock
  {
    id: 'INTL', shortName: 'International', fullName: 'International Building',
    address: '630 Fifth Avenue',
    tiers: [
      { startFloor: 0, endFloor: 7,  width: 50, depth: 70 },
      { startFloor: 8, endFloor: 22, width: 38, depth: 55 },
      { startFloor: 23, endFloor: 34, width: 28, depth: 40 },
      { startFloor: 35, endFloor: 40, width: 20, depth: 28 },
    ],
    x: 110, z: 110, color: '#C0B090',
  },
  // ── Palazzo d'Italia ── 626 Fifth Ave, 6 floors
  // South wing of International Building, on 5th Ave south of Atlas plaza
  {
    id: 'PALAZZO', shortName: "Palazzo d'Italia", fullName: "Palazzo d'Italia",
    address: '626 Fifth Avenue',
    tiers: [{ startFloor: 0, endFloor: 5, width: 22, depth: 32 }],
    x: 120, z: 85, color: '#C8B898',
  },
  // ── International Building North ── 636 Fifth Ave, 6 floors
  // North wing of International Building
  {
    id: 'INTL_N', shortName: 'Intl North', fullName: 'International Building North',
    address: '636 Fifth Avenue',
    tiers: [{ startFloor: 0, endFloor: 5, width: 22, depth: 32 }],
    x: 120, z: 135, color: '#C8B898',
  },
  // ── British Empire Building ── 620 Fifth Ave, 6 floors, 90ft (27m)
  // South of Channel Gardens on 5th Ave, between 49th and 50th
  {
    id: 'BRIT', shortName: 'British Empire', fullName: 'British Empire Building',
    address: '620 Fifth Avenue',
    tiers: [{ startFloor: 0, endFloor: 5, width: 21, depth: 61 }],
    x: 120, z: -20, color: '#C8B898',
  },
  // ── La Maison Francaise ── 610 Fifth Ave, 6 floors, 90ft (27m)
  // North of Channel Gardens on 5th Ave, between 49th and 50th
  {
    id: 'MAISON', shortName: 'La Maison', fullName: 'La Maison Francaise',
    address: '610 Fifth Avenue',
    tiers: [{ startFloor: 0, endFloor: 5, width: 21, depth: 61 }],
    x: 120, z: 20, color: '#C8B898',
  },
  // ── 1270 Avenue of the Americas (RKO Building) ── 31 floors
  // West of 30 Rock, between 50th and 51st, on 6th Ave
  // Built over Radio City Music Hall
  {
    id: '1270AVE', shortName: '1270 Ave', fullName: '1270 Avenue of the Americas',
    address: '1270 Avenue of the Americas',
    tiers: [
      { startFloor: 0, endFloor: 5,  width: 50, depth: 65 },
      { startFloor: 6, endFloor: 20, width: 38, depth: 50 },
      { startFloor: 21, endFloor: 30, width: 26, depth: 35 },
    ],
    x: -100, z: 120, color: '#A8A0B0',
  },
  // ── Radio City Music Hall ── 121ft (37m) tall auditorium
  // On 6th Ave between 50th and 51st, under/adjacent to 1270 Ave
  {
    id: 'RCMH', shortName: 'Radio City', fullName: 'Radio City Music Hall',
    address: '1260 Avenue of the Americas',
    tiers: [{ startFloor: 0, endFloor: 2, width: 52, depth: 55 }],
    x: -110, z: 95, color: '#7B6345',
    special: 'rcmh',
  },
  // ── 1250 Avenue of the Americas (RCA Building West) ── 16 floors
  // Western annex of 30 Rock, on 6th Ave between 49th and 50th
  {
    id: '1250AVE', shortName: '1250 Ave', fullName: '1250 Avenue of the Americas',
    address: '1250 Avenue of the Americas',
    tiers: [
      { startFloor: 0, endFloor: 5,  width: 45, depth: 65 },
      { startFloor: 6, endFloor: 15, width: 35, depth: 50 },
    ],
    x: -100, z: 0, color: '#B0A890',
  },
  // ── 1230 Avenue of the Americas (Simon & Schuster / US Rubber) ── 21 floors
  // West side, between 48th and 49th, on 6th Ave
  {
    id: '1230AVE', shortName: '1230 Ave', fullName: '1230 Avenue of the Americas',
    address: '1230 Avenue of the Americas',
    tiers: [
      { startFloor: 0, endFloor: 6,  width: 48, depth: 65 },
      { startFloor: 7, endFloor: 20, width: 35, depth: 50 },
    ],
    x: -100, z: -120, color: '#9898A8',
  },
  // ── 1 Rockefeller Plaza (Time & Life Building original) ── 36 floors, 490ft (149m)
  // East side of Rockefeller Plaza, between 48th and 49th Streets
  {
    id: '1ROCK', shortName: '1 Rock Plaza', fullName: '1 Rockefeller Plaza',
    address: '1 Rockefeller Plaza',
    tiers: [
      { startFloor: 0, endFloor: 6,  width: 50, depth: 65 },
      { startFloor: 7, endFloor: 22, width: 36, depth: 50 },
      { startFloor: 23, endFloor: 35, width: 24, depth: 35 },
    ],
    x: 10, z: -120, color: '#C0B090',
  },
  // ── 10 Rockefeller Plaza (Eastern Airlines) ── 16 floors, 225ft (69m)
  // West side of Rockefeller Plaza, between 48th and 49th
  {
    id: '10ROCK', shortName: '10 Rock', fullName: '10 Rockefeller Plaza',
    address: '10 Rockefeller Plaza',
    tiers: [{ startFloor: 0, endFloor: 15, width: 40, depth: 60 }],
    x: -55, z: -120, color: '#C0B898',
  },
  // ── 50 Rockefeller Plaza (Associated Press Building) ── 15 floors
  // East side of Rockefeller Plaza, between 50th and 51st Streets
  {
    id: '50ROCK', shortName: '50 Rock', fullName: '50 Rockefeller Plaza',
    address: '50 Rockefeller Plaza',
    tiers: [{ startFloor: 0, endFloor: 14, width: 50, depth: 65 }],
    x: 10, z: 120, color: '#B8B0A0',
  },
  // ── 75 Rockefeller Plaza (Esso Building) ── 33 floors, 424ft (129m)
  // North end, at 51st Street
  {
    id: '75ROCK', shortName: '75 Rock', fullName: '75 Rockefeller Plaza',
    address: '75 Rockefeller Plaza',
    tiers: [
      { startFloor: 0, endFloor: 8,  width: 48, depth: 60 },
      { startFloor: 9, endFloor: 22, width: 35, depth: 45 },
      { startFloor: 23, endFloor: 32, width: 25, depth: 32 },
    ],
    x: -55, z: 180, color: '#8899AA',
  },
  // ── 600 Fifth Avenue (Sinclair Oil) ── 27 floors
  // Corner of 5th Ave and 48th Street — southeast of complex
  {
    id: '600FIFTH', shortName: '600 Fifth', fullName: '600 Fifth Avenue',
    address: '600 Fifth Avenue',
    tiers: [
      { startFloor: 0, endFloor: 6,  width: 38, depth: 55 },
      { startFloor: 7, endFloor: 26, width: 28, depth: 40 },
    ],
    x: 110, z: -145, color: '#A8A0A0',
  },
];

// ============================================================
// Textures
// ============================================================
function windowTexture(w, h, bgColor = '#B8A888') {
  const canvas = document.createElement('canvas');
  const size = 128;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, size, size);
  const cols = 6, rows = 3;
  const gapX = size / cols, gapY = size / rows;
  ctx.fillStyle = '#1a2233';
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      ctx.fillRect(c * gapX + gapX * 0.2, r * gapY + gapY * 0.12, gapX * 0.55, gapY * 0.7);
    }
  }
  // Vertical piers
  ctx.fillStyle = bgColor;
  for (let c = 0; c <= cols; c++) {
    ctx.fillRect(c * gapX - 1, 0, 2, size);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(w / 8, h / 4);
  return tex;
}

const texCache = {};
function getCachedTexture(w, h, color) {
  const key = color + '_' + Math.round(w) + '_' + Math.round(h);
  if (!texCache[key]) texCache[key] = windowTexture(w, h, color);
  return texCache[key];
}

function createCampusFloorMat(floorNum, tierWidth, color) {
  if (floorNum === 0) {
    return new THREE.MeshStandardMaterial({ color: 0x4A4A54, roughness: 0.35, metalness: 0.2 });
  }
  const tex = getCachedTexture(tierWidth, FLOOR_H, color);
  return new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55, metalness: 0.05 });
}

// ============================================================
// Per-floor interactive building creation
// ============================================================
function createInteractiveBuilding(config) {
  const { id, tiers, x, z, color } = config;
  const group = new THREE.Group();
  const floorMeshes = [];

  for (const tier of tiers) {
    for (let f = tier.startFloor; f <= tier.endFloor; f++) {
      const isLobby = f === 0;
      const h = isLobby ? LOBBY_H : FLOOR_H;
      const geo = new THREE.BoxGeometry(tier.width, h, tier.depth);
      const mat = createCampusFloorMat(f, tier.width, color);
      const mesh = new THREE.Mesh(geo, mat);

      let y;
      if (f === 0) y = LOBBY_H / 2;
      else y = LOBBY_H + (f - 1) * FLOOR_H + FLOOR_H / 2;

      mesh.position.y = y;
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      mesh.userData = {
        type: 'floor',
        floorNumber: f,
        floorId: `${id}-F${f}`,
        buildingId: id,
        defaultMaterial: mat,
      };

      floorMeshes.push(mesh);
      group.add(mesh);
    }
  }

  group.position.set(x, 0, z);

  // Special decorations
  if (config.special === 'rcmh') addRCMHDecorations(group, config);

  return { group, floorMeshes };
}

// ============================================================
// Radio City Music Hall decorations
// ============================================================
function addRCMHDecorations(group, config) {
  const topY = LOBBY_H + 2 * FLOOR_H;

  // Distinctive barrel vault / curved roof
  const roofGeo = new THREE.CylinderGeometry(20, 20, 52, 16, 1, false, 0, Math.PI);
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x5B4B35, roughness: 0.6 });
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.rotation.z = Math.PI / 2;
  roof.rotation.y = Math.PI / 2;
  roof.position.y = topY;
  roof.castShadow = true;
  group.add(roof);

  // Iconic marquee on 6th Ave side (west face, -x)
  const marqueeMat = new THREE.MeshStandardMaterial({
    color: 0xFFDD44, emissive: 0xFFAA00, emissiveIntensity: 0.4, roughness: 0.3, metalness: 0.2,
  });
  const marquee = new THREE.Mesh(new THREE.BoxGeometry(6, 5, 40), marqueeMat);
  marquee.position.set(-29, 4, 0);
  group.add(marquee);

  // Vertical "RADIO CITY" sign
  const signMat = new THREE.MeshStandardMaterial({
    color: 0xFF3333, emissive: 0xFF2222, emissiveIntensity: 0.5, roughness: 0.3,
  });
  const sign = new THREE.Mesh(new THREE.BoxGeometry(3, 27, 0.5), signMat);
  sign.position.set(-27, 20, -15);
  group.add(sign);

  // Second sign on the other side
  const sign2 = new THREE.Mesh(new THREE.BoxGeometry(3, 27, 0.5), signMat);
  sign2.position.set(-27, 20, 15);
  group.add(sign2);
}

// ============================================================
// Labels
// ============================================================
function createLabel(text, x, y, z, scale = 1) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(18,22,36,0.85)';
  ctx.fillRect(0, 0, 512, 64);
  ctx.fillStyle = '#E8E8F0';
  ctx.font = 'bold 26px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 34);
  const tex = new THREE.CanvasTexture(canvas);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  sprite.position.set(x, y, z);
  sprite.scale.set(20 * scale, 2.5 * scale, 1);
  return sprite;
}

function createStreetLabel(text, x, y, z, rotY = 0, scale = 1) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 48;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#888888';
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 26);
  const tex = new THREE.CanvasTexture(canvas);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  sprite.position.set(x, y, z);
  sprite.scale.set(18 * scale, 2 * scale, 1);
  return sprite;
}

// ============================================================
// Lookup
// ============================================================
export function getCampusBuildingConfig(buildingId) {
  return CAMPUS_BUILDINGS.find(b => b.id === buildingId) || null;
}

// ============================================================
// Atlas statue (International Building plaza)
// ============================================================
function addAtlasStatue(group) {
  // Atlas with globe — iconic bronze at 630 Fifth Ave
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.4 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 3, 3, 8), baseMat);
  base.position.set(110, 1.5, 110);
  group.add(base);

  const bronzeMat = new THREE.MeshStandardMaterial({ color: 0x6B4C3B, roughness: 0.3, metalness: 0.6 });
  // Globe armillary sphere representation
  const globe = new THREE.Mesh(new THREE.SphereGeometry(3, 16, 12), bronzeMat);
  globe.position.set(110, 7, 110);
  group.add(globe);

  // Ring around globe
  const ring = new THREE.Mesh(new THREE.TorusGeometry(3.5, 0.15, 8, 24), bronzeMat);
  ring.position.set(110, 7, 110);
  ring.rotation.x = Math.PI / 6;
  group.add(ring);

  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(3.5, 0.15, 8, 24), bronzeMat);
  ring2.position.set(110, 7, 110);
  ring2.rotation.z = Math.PI / 3;
  group.add(ring2);
}

// ============================================================
// Main export
// ============================================================
export function createCampus(scene) {
  const g = new THREE.Group();
  const allCampusFloorMeshes = [];

  // Create interactive per-floor buildings
  for (const bldg of CAMPUS_BUILDINGS) {
    const { group, floorMeshes } = createInteractiveBuilding(bldg);
    g.add(group);
    allCampusFloorMeshes.push(...floorMeshes);
  }

  // ════════════════════════════════════
  // STREETS
  // ════════════════════════════════════
  const streetMat = new THREE.MeshStandardMaterial({ color: 0x1e1e24, roughness: 0.95 });
  const sidewalkMat = new THREE.MeshStandardMaterial({ color: 0x353540, roughness: 0.9 });
  const streetWidth = 18;
  const sidewalkWidth = 5;

  // ── 5th Avenue (runs N-S on the east, X ≈ +135) ──
  const fifthAve = new THREE.Mesh(new THREE.PlaneGeometry(streetWidth, 400), streetMat);
  fifthAve.rotation.x = -Math.PI / 2;
  fifthAve.position.set(140, 0.04, 0);
  fifthAve.receiveShadow = true;
  g.add(fifthAve);

  for (const xOff of [-1, 1]) {
    const sw = new THREE.Mesh(new THREE.PlaneGeometry(sidewalkWidth, 400), sidewalkMat);
    sw.rotation.x = -Math.PI / 2;
    sw.position.set(140 + xOff * (streetWidth / 2 + sidewalkWidth / 2), 0.035, 0);
    sw.receiveShadow = true;
    g.add(sw);
  }

  // ── 6th Avenue / Avenue of the Americas (runs N-S on the west, X ≈ -135) ──
  const sixthAve = new THREE.Mesh(new THREE.PlaneGeometry(streetWidth + 4, 400), streetMat);
  sixthAve.rotation.x = -Math.PI / 2;
  sixthAve.position.set(-140, 0.04, 0);
  sixthAve.receiveShadow = true;
  g.add(sixthAve);

  for (const xOff of [-1, 1]) {
    const sw = new THREE.Mesh(new THREE.PlaneGeometry(sidewalkWidth, 400), sidewalkMat);
    sw.rotation.x = -Math.PI / 2;
    sw.position.set(-140 + xOff * (streetWidth / 2 + sidewalkWidth / 2 + 2), 0.035, 0);
    sw.receiveShadow = true;
    g.add(sw);
  }

  // ── Cross Streets (run E-W) ──
  const crossStreets = [
    { z: -160, label: 'W 48th Street' },
    { z: -80,  label: 'W 49th Street' },
    { z: 80,   label: 'W 50th Street' },
    { z: 160,  label: 'W 51st Street' },
  ];

  for (const st of crossStreets) {
    const street = new THREE.Mesh(new THREE.PlaneGeometry(340, streetWidth), streetMat);
    street.rotation.x = -Math.PI / 2;
    street.position.set(0, 0.04, st.z);
    street.receiveShadow = true;
    g.add(street);

    for (const zOff of [-1, 1]) {
      const sw = new THREE.Mesh(new THREE.PlaneGeometry(340, sidewalkWidth), sidewalkMat);
      sw.rotation.x = -Math.PI / 2;
      sw.position.set(0, 0.035, st.z + zOff * (streetWidth / 2 + sidewalkWidth / 2));
      sw.receiveShadow = true;
      g.add(sw);
    }
  }

  // ════════════════════════════════════
  // TREES along avenues
  // ════════════════════════════════════
  const treeMat = new THREE.MeshStandardMaterial({ color: 0x2a6a2a, roughness: 0.8 });
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5a3a1a, roughness: 0.9 });
  const trunkGeo = new THREE.CylinderGeometry(0.15, 0.2, 2.5, 5);
  const canopyGeo = new THREE.SphereGeometry(1.8, 6, 5);

  function addTree(x, z) {
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.set(x, 1.25, z);
    g.add(trunk);
    const canopy = new THREE.Mesh(canopyGeo, treeMat);
    canopy.position.set(x, 3.5, z);
    g.add(canopy);
  }

  // Trees along 5th Ave sidewalks
  for (let z = -150; z <= 150; z += 15) {
    addTree(130, z);
    addTree(150, z);
  }
  // Trees along 6th Ave
  for (let z = -150; z <= 150; z += 15) {
    addTree(-130, z);
    addTree(-152, z);
  }

  // ════════════════════════════════════
  // ATLAS STATUE at International Building
  // ════════════════════════════════════
  addAtlasStatue(g);

  // ════════════════════════════════════
  // BUILDING LABELS
  // ════════════════════════════════════
  // 30 Rock label at the very top
  g.add(createLabel('30 Rockefeller Plaza', 10, 275, 0, 1.4));

  for (const bldg of CAMPUS_BUILDINGS) {
    const maxFloor = Math.max(...bldg.tiers.map(t => t.endFloor));
    const topY = LOBBY_H + maxFloor * FLOOR_H + 8;
    const labelScale = maxFloor > 20 ? 0.9 : 0.7;
    g.add(createLabel(bldg.fullName, bldg.x, topY, bldg.z, labelScale));
  }

  // ════════════════════════════════════
  // STREET LABELS
  // ════════════════════════════════════
  g.add(createStreetLabel('FIFTH AVENUE', 140, 1, 0, 0, 1.3));
  g.add(createStreetLabel('AVENUE OF THE AMERICAS (6TH AVE)', -140, 1, 0, 0, 1.1));

  for (const st of crossStreets) {
    g.add(createStreetLabel(st.label, 0, 1, st.z, 0, 1.0));
  }

  scene.add(g);
  return { campusGroup: g, campusFloorMeshes: allCampusFloorMeshes };
}
