// ============================================================
// Map interaction: click/hover on buildings
// ============================================================
import { getMap, highlightFeature, flyToBuilding } from './map.js';
import { matchClickToBuilding } from './buildings-config.js';
import { getBuildingById } from './data.js';

let onSelectCallback = null;
let selectedBuildingId = null;
let selectedFeatureId = null;

const tooltip = document.getElementById('tooltip');

/**
 * Initialize map interaction handlers.
 * @param {Function} onSelect - Called with (buildingId, floorId) when a building is clicked
 */
export function initInteraction(onSelect) {
  onSelectCallback = onSelect;
  const map = getMap();

  // ── Click on 3D buildings ──
  map.on('click', '3d-buildings', (e) => {
    if (!e.features || e.features.length === 0) return;

    const feature = e.features[0];
    const buildingId = matchClickToBuilding(e.lngLat);

    if (buildingId) {
      selectBuilding(buildingId, feature.id);
    }
  });

  // ── Click on empty space ──
  map.on('click', (e) => {
    // Check if we clicked a building
    const features = map.queryRenderedFeatures(e.point, { layers: ['3d-buildings'] });
    if (features.length === 0) {
      // Clicked empty space — deselect
      deselectBuilding();
    }
  });

  // ── Hover effects ──
  map.on('mousemove', '3d-buildings', (e) => {
    map.getCanvas().style.cursor = 'pointer';

    if (e.features && e.features.length > 0) {
      const buildingId = matchClickToBuilding(e.lngLat);
      if (buildingId) {
        const bldg = getBuildingById(buildingId);
        const label = bldg ? bldg.name : buildingId;
        tooltip.textContent = label;
        tooltip.style.display = 'block';
        tooltip.style.left = (e.originalEvent.clientX + 14) + 'px';
        tooltip.style.top = (e.originalEvent.clientY - 10) + 'px';
      } else {
        tooltip.style.display = 'none';
      }
    }
  });

  map.on('mouseleave', '3d-buildings', () => {
    map.getCanvas().style.cursor = '';
    tooltip.style.display = 'none';
  });
}

/**
 * Select a building by ID.
 */
export function selectBuilding(buildingId, featureId) {
  selectedBuildingId = buildingId;
  selectedFeatureId = featureId || null;

  // Highlight on map
  if (featureId != null) {
    highlightFeature(featureId);
  }

  // Fly to building
  flyToBuilding(buildingId);

  // Notify UI — select the lobby floor of the building
  if (onSelectCallback) {
    const floorId = buildingId === '30ROCK' ? 'F0' : `${buildingId}-F0`;
    onSelectCallback(buildingId, floorId);
  }
}

/**
 * Select a building by ID from the UI (e.g., clicking a building tab).
 */
export function selectBuildingById(buildingId) {
  selectBuilding(buildingId, null);
}

/**
 * Deselect the current building.
 */
function deselectBuilding() {
  selectedBuildingId = null;
  selectedFeatureId = null;
  highlightFeature(null);
}

/**
 * Get the currently selected building ID.
 */
export function getSelectedBuildingId() {
  return selectedBuildingId;
}
