import * as THREE from 'three';

// 30 Rock setback tiers (Art Deco stepped silhouette)
// Real building is ~850ft, 70 floors. 1 unit ≈ 10ft. Floor height = 1.2 units.
const FLOOR_HEIGHT = 1.2;
const LOBBY_HEIGHT = 2.4;

const TIERS = [
  { label: 'basement',  startFloor: -3, endFloor: -1, width: 42, depth: 26 },
  { label: 'podium',    startFloor: 0,  endFloor: 6,  width: 42, depth: 26 },
  { label: 'lower',     startFloor: 7,  endFloor: 16, width: 38, depth: 22 },
  { label: 'mid-lower', startFloor: 17, endFloor: 30, width: 34, depth: 18 },
  { label: 'mid',       startFloor: 31, endFloor: 45, width: 28, depth: 15 },
  { label: 'upper-mid', startFloor: 46, endFloor: 55, width: 22, depth: 12 },
  { label: 'upper',     startFloor: 56, endFloor: 65, width: 17, depth: 10 },
  { label: 'crown',     startFloor: 66, endFloor: 70, width: 13, depth: 8 },
];

// Materials
function createWindowTexture(width, height) {
  const canvas = document.createElement('canvas');
  const size = 256;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Limestone base
  ctx.fillStyle = '#C8B99A';
  ctx.fillRect(0, 0, size, size);

  // Window grid (Art Deco: tall narrow windows, vertical emphasis)
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
      // Subtle window reflection
      ctx.fillStyle = 'rgba(100,140,180,0.15)';
      ctx.fillRect(x + 1, y + 1, windowWidth * 0.4, windowHeight * 0.3);
      ctx.fillStyle = '#1a2233';
    }
  }

  // Vertical ribs
  ctx.fillStyle = '#B8A88A';
  for (let c = 0; c <= cols; c++) {
    ctx.fillRect(c * gapX - 1.5, 0, 3, size);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(width / 5, height / (FLOOR_HEIGHT * 3));
  return tex;
}

function createFloorMaterial(floorNum, tierWidth, tierDepth) {
  if (floorNum === 0) {
    // Lobby - darker granite
    return new THREE.MeshStandardMaterial({
      color: 0x5A5A64,
      roughness: 0.4,
      metalness: 0.2,
    });
  }
  if (floorNum < 0) {
    // Basement
    return new THREE.MeshStandardMaterial({
      color: 0x444450,
      roughness: 0.8,
      metalness: 0.0,
      transparent: true,
      opacity: 0.7,
    });
  }

  const tex = createWindowTexture(tierWidth, FLOOR_HEIGHT);
  return new THREE.MeshStandardMaterial({
    map: tex,
    roughness: 0.6,
    metalness: 0.05,
  });
}

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

export function createBuilding(scene) {
  const buildingGroup = new THREE.Group();
  const floorMeshes = []; // All clickable floor meshes
  const outdoorMeshes = []; // Outdoor area meshes

  // Build floor meshes per tier
  for (const tier of TIERS) {
    for (let f = tier.startFloor; f <= tier.endFloor; f++) {
      const isLobby = f === 0;
      const h = isLobby ? LOBBY_HEIGHT : FLOOR_HEIGHT;
      const geo = new THREE.BoxGeometry(tier.width, h, tier.depth);
      const mat = createFloorMaterial(f, tier.width, tier.depth);

      const mesh = new THREE.Mesh(geo, mat);

      // Calculate Y position
      let y;
      if (f < 0) {
        y = f * FLOOR_HEIGHT + h / 2;
      } else if (f === 0) {
        y = LOBBY_HEIGHT / 2;
      } else {
        y = LOBBY_HEIGHT + (f - 1) * FLOOR_HEIGHT + FLOOR_HEIGHT + h / 2;
      }
      mesh.position.y = y;
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

  // Observation deck (floor 71)
  const obsWidth = 11;
  const obsDepth = 7;
  const obsHeight = FLOOR_HEIGHT * 1.5;
  const topFloorY = LOBBY_HEIGHT + 69 * FLOOR_HEIGHT + FLOOR_HEIGHT;
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
  obsMesh.position.y = obsY;
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

  // Observation deck railings
  const railMat = new THREE.MeshStandardMaterial({ color: 0x888899, roughness: 0.5, metalness: 0.6 });
  const railH = 1.0;
  const railThick = 0.15;
  const railTop = obsY + obsHeight / 2 + railH / 2;

  // Front & back rails
  for (const zSign of [-1, 1]) {
    const rail = new THREE.Mesh(
      new THREE.BoxGeometry(obsWidth + 0.5, railH, railThick),
      railMat
    );
    rail.position.set(0, railTop, zSign * (obsDepth / 2 + railThick / 2));
    buildingGroup.add(rail);
  }
  // Side rails
  for (const xSign of [-1, 1]) {
    const rail = new THREE.Mesh(
      new THREE.BoxGeometry(railThick, railH, obsDepth + 0.5),
      railMat
    );
    rail.position.set(xSign * (obsWidth / 2 + railThick / 2), railTop, 0);
    buildingGroup.add(rail);
  }

  // Mechanical penthouse on top
  const penthouseGeo = new THREE.BoxGeometry(6, 2, 4);
  const penthouseMat = new THREE.MeshStandardMaterial({ color: 0x666677, roughness: 0.8 });
  const penthouse = new THREE.Mesh(penthouseGeo, penthouseMat);
  penthouse.position.y = obsY + obsHeight / 2 + railH + 1;
  penthouse.castShadow = true;
  buildingGroup.add(penthouse);

  // === Outdoor Areas ===

  // Sunken skating rink (Lower Plaza - in front of building)
  const rinkGroup = new THREE.Group();
  const rinkRadius = 8;
  const rinkGeo = new THREE.CircleGeometry(rinkRadius, 32);
  const rinkMat = new THREE.MeshStandardMaterial({
    color: 0xB8E8F0,
    roughness: 0.1,
    metalness: 0.3,
  });
  const rink = new THREE.Mesh(rinkGeo, rinkMat);
  rink.rotation.x = -Math.PI / 2;
  rink.position.set(0, -0.8, 22);
  rink.receiveShadow = true;
  rinkGroup.add(rink);

  // Rink surround wall
  const wallGeo = new THREE.TorusGeometry(rinkRadius + 0.3, 0.4, 8, 32);
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.7 });
  const rinkWall = new THREE.Mesh(wallGeo, wallMat);
  rinkWall.rotation.x = -Math.PI / 2;
  rinkWall.position.set(0, -0.4, 22);
  rinkGroup.add(rinkWall);

  // Prometheus statue (golden sphere on pedestal)
  const pedestalGeo = new THREE.CylinderGeometry(0.5, 0.7, 1.5, 8);
  const pedestalMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.5 });
  const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
  pedestal.position.set(0, 0.35, 14);
  rinkGroup.add(pedestal);

  const statueGeo = new THREE.SphereGeometry(0.8, 16, 16);
  const statueMat = new THREE.MeshStandardMaterial({ color: 0xFFD700, roughness: 0.2, metalness: 0.8 });
  const statue = new THREE.Mesh(statueGeo, statueMat);
  statue.position.set(0, 1.6, 14);
  rinkGroup.add(statue);

  scene.add(rinkGroup);

  // Rink click target (invisible wider plane)
  const rinkClickGeo = new THREE.CircleGeometry(rinkRadius + 1, 32);
  const rinkClickMat = new THREE.MeshBasicMaterial({ visible: false });
  const rinkClick = new THREE.Mesh(rinkClickGeo, rinkClickMat);
  rinkClick.rotation.x = -Math.PI / 2;
  rinkClick.position.set(0, -0.5, 22);
  rinkClick.userData = {
    type: 'outdoor',
    floorId: 'OUT-RINK',
    floorNumber: -100,
    areaName: 'Ice Skating Rink',
    defaultMaterial: rinkClickMat,
  };
  scene.add(rinkClick);
  outdoorMeshes.push(rinkClick);

  // Channel Gardens (walkway from 5th Ave to the rink)
  const gardenGeo = new THREE.PlaneGeometry(8, 20);
  const gardenMat = new THREE.MeshStandardMaterial({
    color: 0x3a5a3a,
    roughness: 0.9,
  });
  const garden = new THREE.Mesh(gardenGeo, gardenMat);
  garden.rotation.x = -Math.PI / 2;
  garden.position.set(0, 0.02, 40);
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

  // Trees along Channel Gardens
  const treeMat = new THREE.MeshStandardMaterial({ color: 0x2a6a2a, roughness: 0.8 });
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5a3a1a, roughness: 0.9 });
  for (let i = 0; i < 6; i++) {
    for (const side of [-1, 1]) {
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 1.5, 6), trunkMat);
      trunk.position.set(side * 3, 0.75, 32 + i * 3);
      trunk.castShadow = true;
      scene.add(trunk);

      const canopy = new THREE.Mesh(new THREE.ConeGeometry(1.0, 2.5, 8), treeMat);
      canopy.position.set(side * 3, 2.8, 32 + i * 3);
      canopy.castShadow = true;
      scene.add(canopy);
    }
  }

  // Rockefeller Plaza event area (side of building)
  const plazaGeo = new THREE.PlaneGeometry(25, 18);
  const plazaMat = new THREE.MeshStandardMaterial({
    color: 0x3a3a44,
    roughness: 0.85,
  });
  const plaza = new THREE.Mesh(plazaGeo, plazaMat);
  plaza.rotation.x = -Math.PI / 2;
  plaza.position.set(-30, 0.02, 5);
  plaza.receiveShadow = true;
  plaza.userData = {
    type: 'outdoor',
    floorId: 'OUT-PLAZA',
    floorNumber: -102,
    areaName: 'Rockefeller Plaza',
    defaultMaterial: plazaMat,
  };
  scene.add(plaza);
  outdoorMeshes.push(plaza);

  // Plaza decorative elements (benches, lights)
  const benchMat = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.6 });
  for (let i = 0; i < 4; i++) {
    const bench = new THREE.Mesh(new THREE.BoxGeometry(2, 0.4, 0.6), benchMat);
    bench.position.set(-28 + i * 5, 0.2, 0);
    bench.castShadow = true;
    scene.add(bench);
  }

  // Lamp posts
  const lampMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.5 });
  const lampLightMat = new THREE.MeshStandardMaterial({ color: 0xFFEECC, emissive: 0xFFCC88, emissiveIntensity: 0.5 });
  for (let i = 0; i < 3; i++) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 3.5, 6), lampMat);
    pole.position.set(-25 + i * 8, 1.75, 12);
    scene.add(pole);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), lampLightMat);
    lamp.position.set(-25 + i * 8, 3.7, 12);
    scene.add(lamp);
  }

  // Sidewalk border around building base
  const sidewalkGeo = new THREE.PlaneGeometry(55, 40);
  const sidewalkMat = new THREE.MeshStandardMaterial({ color: 0x333340, roughness: 0.9 });
  const sidewalk = new THREE.Mesh(sidewalkGeo, sidewalkMat);
  sidewalk.rotation.x = -Math.PI / 2;
  sidewalk.position.set(0, 0.005, 3);
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
    return floorNumber * FLOOR_HEIGHT + FLOOR_HEIGHT / 2;
  } else if (floorNumber === 0) {
    return LOBBY_HEIGHT / 2;
  } else if (floorNumber === 71) {
    const topFloorY = LOBBY_HEIGHT + 69 * FLOOR_HEIGHT + FLOOR_HEIGHT;
    return topFloorY + FLOOR_HEIGHT * 1.5 / 2;
  } else {
    return LOBBY_HEIGHT + (floorNumber - 1) * FLOOR_HEIGHT + FLOOR_HEIGHT + FLOOR_HEIGHT / 2;
  }
}
