import * as THREE from 'three';

// ============================================================
// 30 Rockefeller Plaza — accurate to real dimensions
// ============================================================
// Real building: 850ft (259m) tall, 70 above-ground floors + 3 basements
// Lot: 200×670ft (61×204m). Base: 200×535ft (61×163m).
// Tower slab: 103×327ft (31×100m) — narrow face (31m) faces east/west.
// Building is oriented with its long axis running north-south.
//
// Scale: 1 unit = 1 meter
// Floor height: ~3.66m (≈12ft) for typical office floors
// Lobby: ~7.3m (≈24ft double height)
// Total height to roof: ~259m
//
// Coordinate system (matching campus.js):
//   X axis = east-west (positive = east, toward 5th Ave)
//   Z axis = north-south (positive = north)
//   Y axis = up
//
// 30 Rock sits on the block between 49th (south) and 50th (north) streets,
// roughly centered east-west between Rockefeller Plaza and 6th Ave.
// The tower is offset to the EAST side of the base.
// ============================================================

const FLOOR_H = 3.66;    // Standard floor height in meters
const LOBBY_H = 7.3;     // Double-height lobby
const BASEMENT_H = 4.0;  // Basement floor height

// The tower narrows via setbacks as it rises — Art Deco stepping.
// Dimensions are [width(E-W), depth(N-S)] in meters.
// The base extends west to include the 1250 Ave / studio wing.
const TIERS = [
  // Basements — full lot footprint
  { label: 'basement',  startFloor: -3, endFloor: -1, width: 61, depth: 163 },
  // Base / podium — includes the full base block
  { label: 'podium',    startFloor: 0,  endFloor: 6,  width: 61, depth: 163 },
  // First setback
  { label: 'lower',     startFloor: 7,  endFloor: 16, width: 50, depth: 120 },
  // Second setback
  { label: 'mid-lower', startFloor: 17, endFloor: 30, width: 40, depth: 100 },
  // Tower slab emerges
  { label: 'mid',       startFloor: 31, endFloor: 45, width: 31, depth: 100 },
  // Upper tower narrows slightly
  { label: 'upper-mid', startFloor: 46, endFloor: 55, width: 28, depth: 80 },
  // Upper floors
  { label: 'upper',     startFloor: 56, endFloor: 65, width: 24, depth: 60 },
  // Crown / top floors (Rainbow Room level)
  { label: 'crown',     startFloor: 66, endFloor: 70, width: 20, depth: 45 },
];

// ============================================================
// Textures
// ============================================================
function createWindowTexture(width, height) {
  const canvas = document.createElement('canvas');
  const size = 256;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Limestone base color — warm buff/gray
  ctx.fillStyle = '#C8B99A';
  ctx.fillRect(0, 0, size, size);

  // Window grid — Art Deco vertical emphasis
  const cols = 8;
  const rows = 3;
  const windowWidth = size / cols * 0.55;
  const windowHeight = size / rows * 0.75;
  const gapX = size / cols;
  const gapY = size / rows;

  ctx.fillStyle = '#1a2233';
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * gapX + (gapX - windowWidth) / 2;
      const y = r * gapY + (gapY - windowHeight) / 2;
      ctx.fillRect(x, y, windowWidth, windowHeight);
      // Subtle reflection highlight
      ctx.fillStyle = 'rgba(100,140,180,0.15)';
      ctx.fillRect(x + 1, y + 1, windowWidth * 0.4, windowHeight * 0.3);
      ctx.fillStyle = '#1a2233';
    }
  }

  // Vertical ribs between windows (limestone piers)
  ctx.fillStyle = '#B8A88A';
  for (let c = 0; c <= cols; c++) {
    ctx.fillRect(c * gapX - 1.5, 0, 3, size);
  }

  // Horizontal spandrels
  ctx.fillStyle = '#B0A080';
  for (let r = 0; r <= rows; r++) {
    ctx.fillRect(0, r * gapY - 1, size, 2);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(width / 8, height / (FLOOR_H * 3));
  return tex;
}

function createFloorMaterial(floorNum, tierWidth, tierDepth) {
  if (floorNum === 0) {
    // Lobby — polished dark granite
    return new THREE.MeshStandardMaterial({
      color: 0x4A4A54,
      roughness: 0.3,
      metalness: 0.2,
    });
  }
  if (floorNum < 0) {
    // Basement — concrete
    return new THREE.MeshStandardMaterial({
      color: 0x3A3A44,
      roughness: 0.8,
      metalness: 0.0,
      transparent: true,
      opacity: 0.7,
    });
  }

  const tex = createWindowTexture(tierWidth, FLOOR_H);
  return new THREE.MeshStandardMaterial({
    map: tex,
    roughness: 0.55,
    metalness: 0.05,
  });
}

// ============================================================
// Selection materials (shared with campus)
// ============================================================
const selectedMaterial = new THREE.MeshStandardMaterial({
  color: 0x00AAFF,
  emissive: 0x00AAFF,
  emissiveIntensity: 0.35,
  roughness: 0.4,
  metalness: 0.2,
});

const hoverMaterial = new THREE.MeshStandardMaterial({
  color: 0xC8B99A,
  emissive: 0x00AAFF,
  emissiveIntensity: 0.12,
  roughness: 0.6,
  metalness: 0.05,
});

export function getSelectedMaterial() { return selectedMaterial; }
export function getHoverMaterial() { return hoverMaterial; }

// ============================================================
// Build 30 Rock
// ============================================================
export function createBuilding(scene) {
  const buildingGroup = new THREE.Group();
  const floorMeshes = [];
  const outdoorMeshes = [];

  // The tower slab is offset east within the base.
  // Base center is at x=0. Tower is shifted east by ~15m.
  const towerOffsetX = 10; // east offset for the tower portion

  for (const tier of TIERS) {
    for (let f = tier.startFloor; f <= tier.endFloor; f++) {
      const isLobby = f === 0;
      const isBasement = f < 0;
      const h = isLobby ? LOBBY_H : (isBasement ? BASEMENT_H : FLOOR_H);
      const geo = new THREE.BoxGeometry(tier.width, h, tier.depth);
      const mat = createFloorMaterial(f, tier.width, tier.depth);

      const mesh = new THREE.Mesh(geo, mat);

      // Y position — stack from ground
      let y;
      if (f < 0) {
        y = f * BASEMENT_H + BASEMENT_H / 2;
      } else if (f === 0) {
        y = LOBBY_H / 2;
      } else {
        y = LOBBY_H + (f - 1) * FLOOR_H + FLOOR_H / 2;
      }
      mesh.position.y = y;

      // X offset: upper tiers shift east toward the tower slab position
      if (tier.startFloor >= 17) {
        mesh.position.x = towerOffsetX;
      } else if (tier.startFloor >= 7) {
        mesh.position.x = towerOffsetX * 0.5;
      }

      mesh.castShadow = true;
      mesh.receiveShadow = true;

      mesh.userData = {
        type: 'floor',
        floorNumber: f,
        floorId: f < 0 ? `B${Math.abs(f)}` : (f === 71 ? 'OBS' : `F${f}`),
        buildingId: '30ROCK',
        tier: tier.label,
        defaultMaterial: mat,
      };

      floorMeshes.push(mesh);
      buildingGroup.add(mesh);
    }
  }

  // ── Observation Deck (Top of the Rock) ──
  const obsWidth = 18;
  const obsDepth = 35;
  const obsHeight = FLOOR_H * 1.5;
  const topFloorY = LOBBY_H + 69 * FLOOR_H + FLOOR_H;
  const obsY = topFloorY + obsHeight / 2;

  const obsGeo = new THREE.BoxGeometry(obsWidth, obsHeight, obsDepth);
  const obsMat = new THREE.MeshStandardMaterial({
    color: 0x88AACC,
    roughness: 0.2,
    metalness: 0.4,
    transparent: true,
    opacity: 0.7,
  });
  const obsMesh = new THREE.Mesh(obsGeo, obsMat);
  obsMesh.position.set(towerOffsetX, obsY, 0);
  obsMesh.castShadow = true;
  obsMesh.userData = {
    type: 'floor',
    floorNumber: 71,
    floorId: 'OBS',
    buildingId: '30ROCK',
    tier: 'observation',
    defaultMaterial: obsMat,
  };
  floorMeshes.push(obsMesh);
  buildingGroup.add(obsMesh);

  // Railings around observation deck
  const railMat = new THREE.MeshStandardMaterial({ color: 0x888899, roughness: 0.5, metalness: 0.6 });
  const railH = 1.2;
  const railThick = 0.15;
  const railTop = obsY + obsHeight / 2 + railH / 2;

  for (const zSign of [-1, 1]) {
    const rail = new THREE.Mesh(
      new THREE.BoxGeometry(obsWidth + 0.5, railH, railThick), railMat
    );
    rail.position.set(towerOffsetX, railTop, zSign * (obsDepth / 2 + railThick / 2));
    buildingGroup.add(rail);
  }
  for (const xSign of [-1, 1]) {
    const rail = new THREE.Mesh(
      new THREE.BoxGeometry(railThick, railH, obsDepth + 0.5), railMat
    );
    rail.position.set(towerOffsetX + xSign * (obsWidth / 2 + railThick / 2), railTop, 0);
    buildingGroup.add(rail);
  }

  // Mechanical penthouse
  const penthouseGeo = new THREE.BoxGeometry(8, 4, 12);
  const penthouseMat = new THREE.MeshStandardMaterial({ color: 0x555566, roughness: 0.8 });
  const penthouse = new THREE.Mesh(penthouseGeo, penthouseMat);
  penthouse.position.set(towerOffsetX, obsY + obsHeight / 2 + railH + 2, 0);
  penthouse.castShadow = true;
  buildingGroup.add(penthouse);

  // ── Art Deco crown details ──
  // Vertical fin/piers at the top corners
  const finMat = new THREE.MeshStandardMaterial({ color: 0xA09070, roughness: 0.4, metalness: 0.3 });
  const finH = 8;
  for (const xSign of [-1, 1]) {
    for (const zSign of [-1, 1]) {
      const fin = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, finH, 1.2), finMat
      );
      fin.position.set(
        towerOffsetX + xSign * (20 / 2 - 0.6),
        topFloorY + finH / 2,
        zSign * (45 / 2 - 0.6)
      );
      buildingGroup.add(fin);
    }
  }

  // ══════════════════════════════════════
  // Outdoor Areas
  // ══════════════════════════════════════

  // ── Sunken Lower Plaza with Skating Rink ──
  // 122×59ft = ~37×18m, located east of 30 Rock, below street level
  const rinkGroup = new THREE.Group();

  // Sunken floor
  const rinkFloorGeo = new THREE.BoxGeometry(40, 0.5, 22);
  const rinkFloorMat = new THREE.MeshStandardMaterial({ color: 0x2a2a35, roughness: 0.7 });
  const rinkFloor = new THREE.Mesh(rinkFloorGeo, rinkFloorMat);
  rinkFloor.position.set(0, -2.5, 0);
  rinkFloor.receiveShadow = true;
  rinkGroup.add(rinkFloor);

  // Ice surface
  const iceGeo = new THREE.PlaneGeometry(37, 18);
  const iceMat = new THREE.MeshStandardMaterial({
    color: 0xB8E8F0,
    roughness: 0.05,
    metalness: 0.3,
  });
  const ice = new THREE.Mesh(iceGeo, iceMat);
  ice.rotation.x = -Math.PI / 2;
  ice.position.set(0, -2.2, 0);
  ice.receiveShadow = true;
  rinkGroup.add(ice);

  // Retaining walls around sunken plaza
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.6 });
  for (const xSign of [-1, 1]) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(0.5, 3, 22), wallMat);
    wall.position.set(xSign * 20, -1, 0);
    rinkGroup.add(wall);
  }
  for (const zSign of [-1, 1]) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(40, 3, 0.5), wallMat);
    wall.position.set(0, -1, zSign * 11);
    rinkGroup.add(wall);
  }

  // Prometheus statue — gold figure on the west wall of the rink
  const pedestalGeo = new THREE.CylinderGeometry(1.0, 1.2, 2.5, 8);
  const pedestalMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.4 });
  const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
  pedestal.position.set(0, -0.75, -10);
  rinkGroup.add(pedestal);

  const statueGeo = new THREE.SphereGeometry(1.5, 16, 16);
  const statueMat = new THREE.MeshStandardMaterial({ color: 0xFFD700, roughness: 0.2, metalness: 0.8 });
  const statue = new THREE.Mesh(statueGeo, statueMat);
  statue.position.set(0, 1.5, -10);
  rinkGroup.add(statue);

  // Position the rink east of 30 Rock's base center
  // The Lower Plaza is directly east of 30 Rock, between the building and the Channel Gardens
  rinkGroup.position.set(50, 0, 0);
  scene.add(rinkGroup);

  // Rink click target
  const rinkClickGeo = new THREE.PlaneGeometry(40, 22);
  const rinkClickMat = new THREE.MeshBasicMaterial({ visible: false });
  const rinkClick = new THREE.Mesh(rinkClickGeo, rinkClickMat);
  rinkClick.rotation.x = -Math.PI / 2;
  rinkClick.position.set(50, -1, 0);
  rinkClick.userData = {
    type: 'outdoor',
    floorId: 'OUT-RINK',
    floorNumber: -100,
    areaName: 'Lower Plaza — Ice Skating Rink',
    defaultMaterial: rinkClickMat,
  };
  scene.add(rinkClick);
  outdoorMeshes.push(rinkClick);

  // ── Channel Gardens ──
  // 60ft wide × 200ft long = 18m × 61m
  // Runs east from the Lower Plaza toward 5th Avenue
  const gardenGeo = new THREE.PlaneGeometry(18, 61);
  const gardenMat = new THREE.MeshStandardMaterial({ color: 0x2a4a2a, roughness: 0.85 });
  const garden = new THREE.Mesh(gardenGeo, gardenMat);
  garden.rotation.x = -Math.PI / 2;
  garden.position.set(100, 0.05, 0);
  garden.receiveShadow = true;
  garden.userData = {
    type: 'outdoor',
    floorId: 'OUT-CHANNEL',
    floorNumber: -101,
    areaName: 'Channel Gardens',
    defaultMaterial: gardenMat,
  };
  scene.add(garden);
  outdoorMeshes.push(garden);

  // Garden walkway borders and plantings
  const gardenBorderMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.6 });
  for (const zSign of [-1, 1]) {
    const border = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 61), gardenBorderMat);
    border.position.set(100 + zSign * 9, 0.2, 0);
    scene.add(border);
  }

  // Fountain pools along channel gardens (6 pools)
  const poolMat = new THREE.MeshStandardMaterial({ color: 0x4488AA, roughness: 0.1, metalness: 0.2 });
  for (let i = 0; i < 6; i++) {
    const pool = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.3, 12), poolMat);
    pool.position.set(100, 0.15, -25 + i * 10);
    scene.add(pool);
  }

  // Trees along Channel Gardens
  const treeMat = new THREE.MeshStandardMaterial({ color: 0x2a6a2a, roughness: 0.8 });
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5a3a1a, roughness: 0.9 });
  for (let i = 0; i < 8; i++) {
    for (const side of [-1, 1]) {
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 2.5, 6), trunkMat);
      trunk.position.set(100 + side * 6, 1.25, -28 + i * 8);
      trunk.castShadow = true;
      scene.add(trunk);

      const canopy = new THREE.Mesh(new THREE.SphereGeometry(1.8, 8, 6), treeMat);
      canopy.position.set(100 + side * 6, 3.5, -28 + i * 8);
      canopy.castShadow = true;
      scene.add(canopy);
    }
  }

  // ── Rockefeller Plaza (private street area) ──
  // Runs north-south along the west side of the buildings
  const plazaGeo = new THREE.PlaneGeometry(16, 200);
  const plazaMat = new THREE.MeshStandardMaterial({ color: 0x3a3a44, roughness: 0.85 });
  const plaza = new THREE.Mesh(plazaGeo, plazaMat);
  plaza.rotation.x = -Math.PI / 2;
  plaza.position.set(-40, 0.03, 0);
  plaza.receiveShadow = true;
  plaza.userData = {
    type: 'outdoor',
    floorId: 'OUT-PLAZA',
    floorNumber: -102,
    areaName: 'Rockefeller Plaza (Private Street)',
    defaultMaterial: plazaMat,
  };
  scene.add(plaza);
  outdoorMeshes.push(plaza);

  // ── Flagpoles along Rockefeller Plaza ──
  const flagpoleMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.6, roughness: 0.3 });
  const flagColors = [0xFF0000, 0x0000FF, 0x00AA00, 0xFFFF00, 0xFF6600, 0x9900FF, 0x00AAFF, 0xFF0066, 0x00FF88, 0xFFAA00];
  for (let i = 0; i < 10; i++) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 8, 4), flagpoleMat);
    pole.position.set(-40, 4, -40 + i * 8);
    scene.add(pole);

    const flag = new THREE.Mesh(
      new THREE.PlaneGeometry(2.0, 1.2),
      new THREE.MeshStandardMaterial({ color: flagColors[i], side: THREE.DoubleSide, roughness: 0.8 })
    );
    flag.position.set(-38.8, 7.2, -40 + i * 8);
    scene.add(flag);
  }

  // Sidewalk around building base
  const sidewalkGeo = new THREE.PlaneGeometry(80, 180);
  const sidewalkMat = new THREE.MeshStandardMaterial({ color: 0x2e2e38, roughness: 0.9 });
  const sidewalk = new THREE.Mesh(sidewalkGeo, sidewalkMat);
  sidewalk.rotation.x = -Math.PI / 2;
  sidewalk.position.set(0, 0.01, 0);
  sidewalk.receiveShadow = true;
  scene.add(sidewalk);

  scene.add(buildingGroup);

  return { buildingGroup, floorMeshes, outdoorMeshes };
}

export function setBasementsVisible(floorMeshes, visible) {
  for (const mesh of floorMeshes) {
    if (mesh.userData.floorNumber < 0) {
      mesh.visible = visible;
    }
  }
}

export function getFloorYPosition(floorNumber) {
  if (floorNumber < 0) {
    return floorNumber * BASEMENT_H + BASEMENT_H / 2;
  } else if (floorNumber === 0) {
    return LOBBY_H / 2;
  } else if (floorNumber === 71) {
    const topFloorY = LOBBY_H + 69 * FLOOR_H + FLOOR_H;
    return topFloorY + FLOOR_H * 1.5 / 2;
  } else {
    return LOBBY_H + (floorNumber - 1) * FLOOR_H + FLOOR_H / 2;
  }
}
