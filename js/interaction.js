import * as THREE from 'three';
import { getCamera, getRenderer, animateCameraTo } from './scene.js';
import { getSelectedMaterial, getHoverMaterial } from './building.js';
import { getBuildingById } from './data.js';

let floorMeshes = [];       // 30 Rock floors
let campusFloorMeshes = [];  // All campus building floors
let outdoorMeshes = [];
let selectedMesh = null;
let hoveredMesh = null;
let onSelectCallback = null;

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const tooltip = document.getElementById('tooltip');

export function initInteraction(floors, campusFloors, outdoors, onSelect) {
  floorMeshes = floors;
  campusFloorMeshes = campusFloors;
  outdoorMeshes = outdoors;
  onSelectCallback = onSelect;

  const canvas = getRenderer().domElement;

  canvas.addEventListener('click', onClick);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mouseleave', onMouseLeave);

  // Touch support — tap to select floors on mobile/tablet
  let touchStartPos = null;
  canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      touchStartPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }, { passive: true });

  canvas.addEventListener('touchend', (e) => {
    if (!touchStartPos || e.changedTouches.length !== 1) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartPos.x;
    const dy = touch.clientY - touchStartPos.y;
    // Only treat as tap if finger didn't move much (not a drag/pinch)
    if (Math.abs(dx) < 12 && Math.abs(dy) < 12) {
      updateMouse(touch);
      raycaster.setFromCamera(mouse, getCamera());
      const intersects = raycaster.intersectObjects(getAllClickable());
      if (intersects.length > 0) {
        const hit = intersects[0].object;
        if (hit.userData.type === 'floor' || hit.userData.type === 'outdoor') {
          selectFloor(hit);
        }
      }
    }
    touchStartPos = null;
  }, { passive: true });
}

function getAllClickable() {
  return [
    ...floorMeshes.filter(m => m.visible),
    ...campusFloorMeshes,
    ...outdoorMeshes,
  ];
}

function onClick(event) {
  updateMouse(event);
  raycaster.setFromCamera(mouse, getCamera());
  const intersects = raycaster.intersectObjects(getAllClickable());

  if (intersects.length > 0) {
    const hit = intersects[0].object;
    if (hit.userData.type === 'floor' || hit.userData.type === 'outdoor') {
      selectFloor(hit);
    }
  }
}

function onMouseMove(event) {
  updateMouse(event);
  raycaster.setFromCamera(mouse, getCamera());
  const intersects = raycaster.intersectObjects(getAllClickable());

  const canvas = getRenderer().domElement;

  if (intersects.length > 0) {
    const hit = intersects[0].object;
    if ((hit.userData.type === 'floor' || hit.userData.type === 'outdoor') && hit !== selectedMesh) {
      if (hoveredMesh && hoveredMesh !== hit && hoveredMesh !== selectedMesh) {
        hoveredMesh.material = hoveredMesh.userData.defaultMaterial;
      }
      if (hit !== selectedMesh) {
        hoveredMesh = hit;
        if (hit.userData.type === 'floor') {
          hit.material = getHoverMaterial();
        }
      }
      canvas.style.cursor = 'pointer';

      // Show tooltip with building name for campus buildings
      const label = getFloorLabel(hit.userData);
      tooltip.textContent = label;
      tooltip.style.display = 'block';
      tooltip.style.left = (event.clientX + 14) + 'px';
      tooltip.style.top = (event.clientY - 10) + 'px';
    }
  } else {
    if (hoveredMesh && hoveredMesh !== selectedMesh) {
      hoveredMesh.material = hoveredMesh.userData.defaultMaterial;
      hoveredMesh = null;
    }
    canvas.style.cursor = 'grab';
    tooltip.style.display = 'none';
  }
}

function onMouseLeave() {
  if (hoveredMesh && hoveredMesh !== selectedMesh) {
    hoveredMesh.material = hoveredMesh.userData.defaultMaterial;
    hoveredMesh = null;
  }
  tooltip.style.display = 'none';
}

function updateMouse(event) {
  const rect = getRenderer().domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

export function selectFloor(mesh) {
  // Deselect previous
  if (selectedMesh) {
    selectedMesh.material = selectedMesh.userData.defaultMaterial;
  }

  selectedMesh = mesh;

  if (mesh.userData.type === 'floor') {
    mesh.material = getSelectedMaterial();
  }

  // Camera transition using world position
  const worldPos = new THREE.Vector3();
  mesh.getWorldPosition(worldPos);

  if (mesh.userData.type === 'outdoor') {
    animateCameraTo(
      new THREE.Vector3(worldPos.x + 20, 15, worldPos.z + 20),
      worldPos.clone(),
      700
    );
  } else {
    // Compute camera offset direction: away from campus center
    const bx = worldPos.x;
    const bz = worldPos.z;
    const dist = Math.sqrt(bx * bx + bz * bz);

    let camPos;
    if (dist > 5) {
      // Campus building — position camera on the outward side
      const dx = bx / dist;
      const dz = bz / dist;
      const camDist = 30;
      camPos = new THREE.Vector3(
        bx + dx * camDist,
        worldPos.y + 10,
        bz + dz * camDist
      );
    } else {
      // 30 Rock at origin — use original offset
      camPos = new THREE.Vector3(35, worldPos.y + 8, 40);
    }

    animateCameraTo(camPos, worldPos.clone(), 700);
  }

  if (onSelectCallback) {
    onSelectCallback(mesh.userData.floorId, mesh.userData);
  }
}

export function selectFloorById(floorId) {
  const all = [...floorMeshes, ...campusFloorMeshes, ...outdoorMeshes];
  const mesh = all.find(m => m.userData.floorId === floorId);
  if (mesh) {
    selectFloor(mesh);
  }
}

export function getSelectedFloorId() {
  return selectedMesh ? selectedMesh.userData.floorId : null;
}

function getFloorLabel(userData) {
  if (userData.type === 'outdoor') {
    return userData.areaName;
  }

  const num = userData.floorNumber;
  const buildingId = userData.buildingId;

  let floorStr;
  if (num === 71 && buildingId === '30ROCK') floorStr = 'Observation Deck';
  else if (num === 0) floorStr = 'Lobby';
  else if (num < 0) floorStr = `Basement ${Math.abs(num)}`;
  else floorStr = `Floor ${num}`;

  // Add building name for non-30Rock buildings
  if (buildingId && buildingId !== '30ROCK') {
    const bldg = getBuildingById(buildingId);
    const bldgName = bldg ? bldg.name : buildingId;
    return `${bldgName} — ${floorStr}`;
  }

  return floorStr;
}
