import { initScene, resetCameraView } from './scene.js';
import { createBuilding, setBasementsVisible } from './building.js';
import { createCampus } from './campus.js';
import { initInteraction, selectFloorById } from './interaction.js';
import { initData, resetData } from './data.js';
import { initUI, selectFloorInUI } from './ui.js';

async function main() {
  // Initialize data first (includes v2 migration for campus floors)
  await initData();

  // Initialize 3D scene
  const container = document.getElementById('canvas-container');
  const { scene } = initScene(container);

  // Build the 3D model of 30 Rock
  const { floorMeshes, outdoorMeshes } = createBuilding(scene);

  // Build the surrounding Rockefeller Center campus (now with per-floor meshes)
  const { campusFloorMeshes } = createCampus(scene);

  // Basements hidden by default
  let basementsVisible = false;
  setBasementsVisible(floorMeshes, basementsVisible);

  // Initialize interaction (raycasting, selection) — now includes campus floors
  initInteraction(floorMeshes, campusFloorMeshes, outdoorMeshes, (floorId, floorData) => {
    selectFloorInUI(floorId, floorData);
  });

  // Initialize UI
  initUI((floorId) => {
    // If basement floor selected from strip, show basements
    if (floorId.startsWith('B') && !floorId.includes('-') && !basementsVisible) {
      basementsVisible = true;
      setBasementsVisible(floorMeshes, true);
      btnBasements.classList.add('active');
    }
    selectFloorById(floorId);
  });

  // Header controls
  const btnBasements = document.getElementById('btn-basements');
  btnBasements.addEventListener('click', () => {
    basementsVisible = !basementsVisible;
    setBasementsVisible(floorMeshes, basementsVisible);
    btnBasements.classList.toggle('active', basementsVisible);
  });

  document.getElementById('btn-reset-view').addEventListener('click', () => {
    resetCameraView();
  });

  document.getElementById('btn-reset-data').addEventListener('click', async () => {
    if (confirm('Reset all data to defaults? This will erase any changes you have made.')) {
      await resetData();
      window.location.reload();
    }
  });

  // Panel toggle
  const panelToggle = document.getElementById('panel-toggle');
  const sidePanel = document.getElementById('side-panel');
  panelToggle.addEventListener('click', () => {
    sidePanel.classList.toggle('collapsed');
    panelToggle.classList.toggle('collapsed-toggle');
    panelToggle.innerHTML = sidePanel.classList.contains('collapsed') ? '&#9654;' : '&#9664;';
  });
}

main().catch(console.error);
