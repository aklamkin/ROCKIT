// ============================================================
// MapLibre GL JS map initialization with 3D buildings
// ============================================================
import { CAMPUS_VIEW, BUILDING_LOCATIONS, getFlyToOptions } from './buildings-config.js';

let map = null;
let selectedBuildingId = null;

/**
 * Initialize the MapLibre GL map in the given container element.
 */
export function initMap(containerId) {
  map = new maplibregl.Map({
    container: containerId,
    style: 'https://tiles.openfreemap.org/styles/bright',
    center: CAMPUS_VIEW.center,
    zoom: CAMPUS_VIEW.zoom,
    pitch: CAMPUS_VIEW.pitch,
    bearing: CAMPUS_VIEW.bearing,
    canvasContextAttributes: { antialias: true },
    maxPitch: 70,
    minZoom: 14,
    maxZoom: 20,
  });

  // Add navigation controls
  map.addControl(new maplibregl.NavigationControl({
    visualizePitch: true,
  }), 'top-left');

  // Add scale bar
  map.addControl(new maplibregl.ScaleControl({ unit: 'imperial' }), 'bottom-left');

  return new Promise((resolve) => {
    map.on('style.load', () => {
      add3DBuildingLayer();
      addHighlightLayer();
      resolve(map);
    });
  });
}

/**
 * Add the 3D building extrusion layer from OSM data.
 */
function add3DBuildingLayer() {
  // Find the first label layer so buildings render below labels
  const layers = map.getStyle().layers;
  let labelLayerId;
  for (const layer of layers) {
    if (layer.type === 'symbol' && layer.layout && layer.layout['text-field']) {
      labelLayerId = layer.id;
      break;
    }
  }

  map.addLayer({
    id: '3d-buildings',
    source: 'openfreemap',
    'source-layer': 'building',
    type: 'fill-extrusion',
    minzoom: 14,
    filter: ['!=', ['get', 'hide_3d'], true],
    paint: {
      'fill-extrusion-color': [
        'interpolate', ['linear'],
        ['get', 'render_height'],
        0, '#d4cfc0',      // short buildings — warm limestone
        50, '#c8bfa8',     // medium
        150, '#b8b0a0',    // taller
        260, '#a8a098',    // 30 Rock height — slightly cooler
      ],
      'fill-extrusion-height': [
        'interpolate', ['linear'],
        ['zoom'],
        14, 0,
        15, ['get', 'render_height'],
      ],
      'fill-extrusion-base': [
        'interpolate', ['linear'],
        ['zoom'],
        14, 0,
        15, ['get', 'render_min_height'],
      ],
      'fill-extrusion-opacity': 0.88,
    },
  }, labelLayerId);
}

/**
 * Add a transparent highlight layer for selected buildings.
 * This overlays a colored extrusion on top of the selected building.
 */
function addHighlightLayer() {
  // We use a separate layer with a filter that matches nothing initially.
  // When a building is selected, we update the filter.
  map.addLayer({
    id: 'building-highlight',
    source: 'openfreemap',
    'source-layer': 'building',
    type: 'fill-extrusion',
    minzoom: 14,
    filter: ['==', ['id'], ''],  // matches nothing initially
    paint: {
      'fill-extrusion-color': '#00AAFF',
      'fill-extrusion-height': ['get', 'render_height'],
      'fill-extrusion-base': ['get', 'render_min_height'],
      'fill-extrusion-opacity': 0.45,
    },
  });
}

/**
 * Highlight a building on the map by its feature ID.
 */
export function highlightFeature(featureId) {
  if (!map) return;
  if (featureId != null) {
    map.setFilter('building-highlight', ['==', ['id'], featureId]);
  } else {
    map.setFilter('building-highlight', ['==', ['id'], '']);
  }
}

/**
 * Fly the camera to a specific building.
 */
export function flyToBuilding(buildingId) {
  if (!map) return;
  const opts = getFlyToOptions(buildingId);
  if (opts) {
    map.flyTo(opts);
  }
}

/**
 * Reset to the full campus view.
 */
export function resetView() {
  if (!map) return;
  map.flyTo({
    center: CAMPUS_VIEW.center,
    zoom: CAMPUS_VIEW.zoom,
    pitch: CAMPUS_VIEW.pitch,
    bearing: CAMPUS_VIEW.bearing,
    duration: 1200,
    essential: true,
  });
}

/**
 * Get the map instance.
 */
export function getMap() {
  return map;
}
