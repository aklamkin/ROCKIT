import { initMap, resetView } from './map.js';
import { initInteraction, selectBuildingById } from './interaction.js';
import { initData, resetData } from './data.js';
import { initUI, selectFloorInUI } from './ui.js';

function isMobile() {
  return window.matchMedia('(max-width: 900px)').matches;
}

async function main() {
  // Initialize data first
  await initData();

  // Initialize MapLibre GL map
  await initMap('map');

  // Initialize interaction (click/hover on map buildings)
  initInteraction((buildingId, floorId) => {
    selectFloorInUI(floorId, { buildingId });
    showPanel();
  });

  const panelToggle = document.getElementById('panel-toggle');
  const sidePanel = document.getElementById('side-panel');

  function showPanel() {
    if (isMobile()) {
      sidePanel.classList.add('panel-open');
      panelToggle.classList.add('panel-visible');
      panelToggle.innerHTML = '&#9654;';
    }
  }

  function hidePanel() {
    if (isMobile()) {
      sidePanel.classList.remove('panel-open');
      panelToggle.classList.remove('panel-visible');
      panelToggle.innerHTML = '&#9664;';
    }
  }

  // Initialize UI with callbacks
  initUI(
    // Floor selected from strip
    (floorId) => {
      showPanel();
    },
    // Building tab clicked — fly to building on map
    (buildingId) => {
      selectBuildingById(buildingId);
    }
  );

  // Header controls
  document.getElementById('btn-reset-view').addEventListener('click', () => {
    resetView();
  });

  document.getElementById('btn-reset-data').addEventListener('click', async () => {
    if (confirm('Reset all data to defaults? This will erase any changes you have made.')) {
      await resetData();
      window.location.reload();
    }
  });

  // Panel toggle
  panelToggle.addEventListener('click', () => {
    if (isMobile()) {
      const isOpen = sidePanel.classList.contains('panel-open');
      if (isOpen) hidePanel();
      else showPanel();
    } else {
      sidePanel.classList.toggle('collapsed');
      panelToggle.classList.toggle('collapsed-toggle');
      panelToggle.innerHTML = sidePanel.classList.contains('collapsed') ? '&#9654;' : '&#9664;';
    }
  });
}

main().catch(console.error);
