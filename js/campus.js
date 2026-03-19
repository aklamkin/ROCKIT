import * as THREE from 'three';

// Rockefeller Center Campus - surrounding buildings with per-floor interactive meshes
// Coordinate system: 30 Rock at origin
//   +Z = east (toward 5th Avenue)
//   -Z = west (toward 6th Avenue / Avenue of the Americas)
//   +X = south, -X = north
// 1 unit ~ 10 feet

const FLOOR_H = 1.2;
const LOBBY_H = 1.8;

// ==========================================
// Campus building configurations (exported for data generation)
// ==========================================
export const CAMPUS_BUILDINGS = [
  {
    id: 'INTL', shortName: 'International', fullName: 'International Building',
    tiers: [
      { startFloor: 0, endFloor: 7, width: 28, depth: 18 },
      { startFloor: 8, endFloor: 22, width: 24, depth: 15 },
      { startFloor: 23, endFloor: 34, width: 18, depth: 12 },
      { startFloor: 35, endFloor: 40, width: 12, depth: 8 },
    ],
    x: -5, z: 65, color: '#C0B090',
  },
  {
    id: 'BRIT', shortName: 'British Empire', fullName: 'British Empire Building',
    tiers: [{ startFloor: 0, endFloor: 5, width: 20, depth: 14 }],
    x: 12, z: 55, color: '#C8B898',
  },
  {
    id: 'MAISON', shortName: 'La Maison', fullName: 'La Maison Francaise',
    tiers: [{ startFloor: 0, endFloor: 5, width: 20, depth: 14 }],
    x: -22, z: 55, color: '#C8B898',
  },
  {
    id: '1270AVE', shortName: '1270 Ave', fullName: '1270 Avenue of the Americas',
    tiers: [
      { startFloor: 0, endFloor: 5, width: 26, depth: 16 },
      { startFloor: 6, endFloor: 20, width: 22, depth: 14 },
      { startFloor: 21, endFloor: 30, width: 16, depth: 10 },
    ],
    x: -8, z: -42, color: '#A8A0B0',
  },
  {
    id: '1250AVE', shortName: '1250 Ave', fullName: '1250 Avenue of the Americas',
    tiers: [
      { startFloor: 0, endFloor: 5, width: 24, depth: 15 },
      { startFloor: 6, endFloor: 17, width: 20, depth: 12 },
      { startFloor: 18, endFloor: 25, width: 14, depth: 9 },
    ],
    x: 30, z: -42, color: '#A8A0B0',
  },
  {
    id: 'RCMH', shortName: 'Radio City', fullName: 'Radio City Music Hall',
    tiers: [{ startFloor: 0, endFloor: 2, width: 22, depth: 18 }],
    x: -32, z: -28, color: '#8B7355',
    special: 'rcmh',
  },
  {
    id: '1ROCK', shortName: '1 Rock Plaza', fullName: '1 Rockefeller Plaza',
    tiers: [
      { startFloor: 0, endFloor: 5, width: 24, depth: 16 },
      { startFloor: 6, endFloor: 21, width: 20, depth: 13 },
      { startFloor: 22, endFloor: 35, width: 14, depth: 9 },
    ],
    x: 38, z: 8, color: '#C0B090',
  },
  {
    id: '10ROCK', shortName: '10 Rock', fullName: '10 Rockefeller Plaza',
    tiers: [{ startFloor: 0, endFloor: 15, width: 18, depth: 14 }],
    x: 38, z: 35, color: '#C0B898',
  },
  {
    id: '50ROCK', shortName: '50 Rock', fullName: '50 Rockefeller Plaza',
    tiers: [{ startFloor: 0, endFloor: 15, width: 20, depth: 16 }],
    x: 38, z: -15, color: '#B8B0A0',
  },
  {
    id: '75ROCK', shortName: '75 Rock', fullName: '75 Rockefeller Plaza',
    tiers: [
      { startFloor: 0, endFloor: 7, width: 20, depth: 14 },
      { startFloor: 8, endFloor: 32, width: 16, depth: 12 },
    ],
    x: 60, z: -8, color: '#8899AA',
  },
  {
    id: '1230AVE', shortName: '1230 Ave', fullName: '1230 Avenue of the Americas',
    tiers: [{ startFloor: 0, endFloor: 19, width: 22, depth: 14 }],
    x: 60, z: -42, color: '#9898A8',
  },
];

// ==========================================
// Textures
// ==========================================
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
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(w / 6, h / 4);
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
    return new THREE.MeshStandardMaterial({ color: 0x5A5A64, roughness: 0.4, metalness: 0.2 });
  }
  const tex = getCachedTexture(tierWidth, FLOOR_H, color);
  return new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, metalness: 0.05 });
}

// ==========================================
// Per-floor interactive building creation
// ==========================================
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

  // Special decorations for Radio City
  if (config.special === 'rcmh') {
    addRCMHDecorations(group);
  }

  return { group, floorMeshes };
}

function addRCMHDecorations(group) {
  const topY = LOBBY_H + 2 * FLOOR_H;

  // Curved roof
  const roofGeo = new THREE.CylinderGeometry(11, 11, 18, 12, 1, false, 0, Math.PI);
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x6B5B45, roughness: 0.7 });
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.rotation.z = Math.PI / 2;
  roof.rotation.y = Math.PI / 2;
  roof.position.y = topY;
  roof.castShadow = true;
  group.add(roof);

  // Marquee
  const marqueeMat = new THREE.MeshStandardMaterial({
    color: 0xFFDD44, emissive: 0xFFAA00, emissiveIntensity: 0.3, roughness: 0.3, metalness: 0.2,
  });
  const marquee = new THREE.Mesh(new THREE.BoxGeometry(14, 3, 2), marqueeMat);
  marquee.position.set(0, 1.5, 10);
  group.add(marquee);

  // Red sign
  const signMat = new THREE.MeshStandardMaterial({
    color: 0xFF3333, emissive: 0xFF2222, emissiveIntensity: 0.5, roughness: 0.3,
  });
  const sign = new THREE.Mesh(new THREE.BoxGeometry(8, 4, 0.3), signMat);
  sign.position.set(0, topY + 2, 9.2);
  group.add(sign);
}

// ==========================================
// Labels
// ==========================================
function createLabel(text, x, y, z, scale = 1) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(18,22,36,0.85)';
  ctx.fillRect(0, 0, 512, 64);
  ctx.fillStyle = '#E8E8F0';
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 34);
  const tex = new THREE.CanvasTexture(canvas);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  sprite.position.set(x, y, z);
  sprite.scale.set(12 * scale, 1.5 * scale, 1);
  return sprite;
}

function createStreetLabel(text, x, y, z, scale = 1) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 48;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#777777';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 26);
  const tex = new THREE.CanvasTexture(canvas);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  sprite.position.set(x, y, z);
  sprite.scale.set(10 * scale, 1.2 * scale, 1);
  return sprite;
}

// ==========================================
// Lookup helper
// ==========================================
export function getCampusBuildingConfig(buildingId) {
  return CAMPUS_BUILDINGS.find(b => b.id === buildingId) || null;
}

// ==========================================
// Main export
// ==========================================
export function createCampus(scene) {
  const g = new THREE.Group();
  const allCampusFloorMeshes = [];

  // Create interactive per-floor buildings
  for (const bldg of CAMPUS_BUILDINGS) {
    const { group, floorMeshes } = createInteractiveBuilding(bldg);
    g.add(group);
    allCampusFloorMeshes.push(...floorMeshes);
  }

  // === STREETS ===
  const streetMat = new THREE.MeshStandardMaterial({ color: 0x222228, roughness: 0.95 });
  const sidewalkMat = new THREE.MeshStandardMaterial({ color: 0x3a3a42, roughness: 0.9 });

  // 5th Avenue (north-south, east side, z=48)
  const fifthAve = new THREE.Mesh(new THREE.PlaneGeometry(140, 8), streetMat);
  fifthAve.rotation.x = -Math.PI / 2;
  fifthAve.position.set(0, 0.03, 48);
  fifthAve.receiveShadow = true;
  g.add(fifthAve);
  for (const zOff of [43.5, 52.5]) {
    const sw = new THREE.Mesh(new THREE.PlaneGeometry(140, 3), sidewalkMat);
    sw.rotation.x = -Math.PI / 2;
    sw.position.set(0, 0.025, zOff);
    sw.receiveShadow = true;
    g.add(sw);
  }

  // 6th Avenue (north-south, west side, z=-32)
  const sixthAve = new THREE.Mesh(new THREE.PlaneGeometry(140, 10), streetMat);
  sixthAve.rotation.x = -Math.PI / 2;
  sixthAve.position.set(0, 0.03, -32);
  sixthAve.receiveShadow = true;
  g.add(sixthAve);
  for (const zOff of [-26.5, -37.5]) {
    const sw = new THREE.Mesh(new THREE.PlaneGeometry(140, 3), sidewalkMat);
    sw.rotation.x = -Math.PI / 2;
    sw.position.set(0, 0.025, zOff);
    sw.receiveShadow = true;
    g.add(sw);
  }

  // Cross streets (east-west): 48th, 49th, 50th, 51st
  const crossStreetPositions = [
    { x: -42, label: 'W 51st Street' },
    { x: -18, label: 'W 50th Street' },
    { x: 22, label: 'W 49th Street' },
    { x: 52, label: 'W 48th Street' },
  ];
  for (const st of crossStreetPositions) {
    const street = new THREE.Mesh(new THREE.PlaneGeometry(6, 100), streetMat);
    street.rotation.x = -Math.PI / 2;
    street.position.set(st.x, 0.03, 8);
    street.receiveShadow = true;
    g.add(street);
    for (const xOff of [-3.5, 3.5]) {
      const sw = new THREE.Mesh(new THREE.PlaneGeometry(2, 100), sidewalkMat);
      sw.rotation.x = -Math.PI / 2;
      sw.position.set(st.x + xOff, 0.025, 8);
      sw.receiveShadow = true;
      g.add(sw);
    }
  }

  // === TREES ===
  const treeMat = new THREE.MeshStandardMaterial({ color: 0x2a6a2a, roughness: 0.8 });
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5a3a1a, roughness: 0.9 });
  const trunkGeo = new THREE.CylinderGeometry(0.12, 0.15, 1.2, 5);
  const canopyGeo = new THREE.SphereGeometry(0.9, 6, 5);

  function addTree(x, z) {
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.set(x, 0.6, z);
    g.add(trunk);
    const canopy = new THREE.Mesh(canopyGeo, treeMat);
    canopy.position.set(x, 1.9, z);
    g.add(canopy);
  }

  // Trees along 5th Ave
  for (let i = -4; i <= 4; i++) {
    addTree(i * 16, 53);
    addTree(i * 16, 43);
  }
  // Trees along 6th Ave
  for (let i = -4; i <= 4; i++) {
    addTree(i * 16, -37);
    addTree(i * 16, -27);
  }

  // === FLAGPOLES along promenade ===
  const flagpoleMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.6, roughness: 0.3 });
  const poleGeo = new THREE.CylinderGeometry(0.05, 0.06, 4.5, 4);
  const flagGeo = new THREE.PlaneGeometry(1.2, 0.8);
  const flagColors = [0xFF0000, 0x0000FF, 0x00AA00, 0xFFFF00, 0xFF6600, 0x9900FF, 0x00AAFF, 0xFF0066, 0x00FF88];

  for (let i = -4; i <= 4; i++) {
    const pole = new THREE.Mesh(poleGeo, flagpoleMat);
    pole.position.set(i * 4, 2.25, -4);
    g.add(pole);
    const flag = new THREE.Mesh(flagGeo, new THREE.MeshStandardMaterial({
      color: flagColors[i + 4], side: THREE.DoubleSide, roughness: 0.8,
    }));
    flag.position.set(i * 4 + 0.7, 4.0, -4);
    g.add(flag);
  }

  // === BUILDING LABELS ===
  g.add(createLabel('30 Rockefeller Plaza', 0, 92, 0, 1.2));
  for (const bldg of CAMPUS_BUILDINGS) {
    const maxFloor = Math.max(...bldg.tiers.map(t => t.endFloor));
    const topY = LOBBY_H + maxFloor * FLOOR_H + 5;
    const labelScale = maxFloor > 20 ? 0.9 : 0.7;
    g.add(createLabel(bldg.fullName, bldg.x, topY, bldg.z, labelScale));
  }

  // === STREET LABELS ===
  g.add(createStreetLabel('FIFTH AVENUE', 0, 0.5, 48, 1.2));
  g.add(createStreetLabel('SIXTH AVE', 0, 0.5, -32, 1.1));
  for (const st of crossStreetPositions) {
    g.add(createStreetLabel(st.label, st.x, 0.5, 8, 0.8));
  }

  scene.add(g);
  return { campusGroup: g, campusFloorMeshes: allCampusFloorMeshes };
}
