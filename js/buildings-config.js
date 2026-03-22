// ============================================================
// Rockefeller Center building locations and metadata
// ============================================================
// Each building has:
//   - center: [lng, lat] for map interactions and fly-to
//   - bounds: [[sw_lng, sw_lat], [ne_lng, ne_lat]] bounding box
//   - Camera settings for fly-to view
//
// Coordinates derived from OpenStreetMap / satellite imagery.
// Rockefeller Center spans roughly:
//   5th Ave (east) to 6th Ave (west): lng -73.978 to -73.981
//   48th St (south) to 51st St (north): lat 40.757 to 40.762
// ============================================================

export const BUILDING_LOCATIONS = {
  '30ROCK': {
    center: [-73.9793, 40.7588],
    bounds: [[-73.9802, 40.7582], [-73.9784, 40.7594]],
    zoom: 17,
    pitch: 60,
    bearing: -30,
  },
  'INTL': {
    center: [-73.9782, 40.7590],
    bounds: [[-73.9787, 40.7586], [-73.9777, 40.7594]],
    zoom: 17.5,
    pitch: 55,
    bearing: -20,
  },
  'PALAZZO': {
    center: [-73.9780, 40.7585],
    bounds: [[-73.9784, 40.7583], [-73.9776, 40.7587]],
    zoom: 18,
    pitch: 50,
    bearing: -15,
  },
  'INTL_N': {
    center: [-73.9780, 40.7595],
    bounds: [[-73.9784, 40.7593], [-73.9776, 40.7597]],
    zoom: 18,
    pitch: 50,
    bearing: -15,
  },
  'BRIT': {
    center: [-73.9779, 40.7581],
    bounds: [[-73.9783, 40.7578], [-73.9775, 40.7584]],
    zoom: 18,
    pitch: 50,
    bearing: -15,
  },
  'MAISON': {
    center: [-73.9779, 40.7576],
    bounds: [[-73.9783, 40.7573], [-73.9775, 40.7579]],
    zoom: 18,
    pitch: 50,
    bearing: -15,
  },
  '1270AVE': {
    center: [-73.9807, 40.7600],
    bounds: [[-73.9814, 40.7596], [-73.9800, 40.7604]],
    zoom: 17.2,
    pitch: 55,
    bearing: -25,
  },
  'RCMH': {
    center: [-73.9800, 40.7600],
    bounds: [[-73.9808, 40.7596], [-73.9795, 40.7604]],
    zoom: 17.5,
    pitch: 50,
    bearing: -20,
  },
  '1250AVE': {
    center: [-73.9807, 40.7588],
    bounds: [[-73.9814, 40.7584], [-73.9800, 40.7592]],
    zoom: 17.5,
    pitch: 55,
    bearing: -25,
  },
  '1230AVE': {
    center: [-73.9807, 40.7575],
    bounds: [[-73.9814, 40.7571], [-73.9800, 40.7579]],
    zoom: 17.2,
    pitch: 55,
    bearing: -25,
  },
  '1ROCK': {
    center: [-73.9790, 40.7575],
    bounds: [[-73.9797, 40.7571], [-73.9783, 40.7579]],
    zoom: 17.2,
    pitch: 55,
    bearing: -25,
  },
  '10ROCK': {
    center: [-73.9800, 40.7575],
    bounds: [[-73.9806, 40.7571], [-73.9794, 40.7579]],
    zoom: 17.5,
    pitch: 50,
    bearing: -20,
  },
  '50ROCK': {
    center: [-73.9790, 40.7600],
    bounds: [[-73.9797, 40.7596], [-73.9783, 40.7604]],
    zoom: 17.5,
    pitch: 55,
    bearing: -25,
  },
  '75ROCK': {
    center: [-73.9800, 40.7610],
    bounds: [[-73.9808, 40.7606], [-73.9794, 40.7614]],
    zoom: 17.2,
    pitch: 55,
    bearing: -20,
  },
  '600FIFTH': {
    center: [-73.9778, 40.7570],
    bounds: [[-73.9784, 40.7567], [-73.9772, 40.7573]],
    zoom: 17.5,
    pitch: 50,
    bearing: -15,
  },
  'OUTDOOR': {
    center: [-73.9789, 40.7585],
    bounds: [[-73.9795, 40.7582], [-73.9783, 40.7588]],
    zoom: 18,
    pitch: 55,
    bearing: -25,
  },
};

// Default campus view — close-in 3D perspective of Rockefeller Center
export const CAMPUS_VIEW = {
  center: [-73.9793, 40.7588],
  zoom: 17,
  pitch: 60,
  bearing: -30,
};

/**
 * Given a click [lng, lat], find which Rockefeller Center building was clicked.
 * Returns the buildingId or null if the click is outside known buildings.
 */
export function matchClickToBuilding(lngLat) {
  const { lng, lat } = lngLat;

  for (const [id, loc] of Object.entries(BUILDING_LOCATIONS)) {
    if (id === 'OUTDOOR') continue;
    const [[swLng, swLat], [neLng, neLat]] = loc.bounds;
    if (lng >= swLng && lng <= neLng && lat >= swLat && lat <= neLat) {
      return id;
    }
  }
  return null;
}

/**
 * Get fly-to options for a building.
 */
export function getFlyToOptions(buildingId) {
  const loc = BUILDING_LOCATIONS[buildingId];
  if (!loc) return null;
  return {
    center: loc.center,
    zoom: loc.zoom,
    pitch: loc.pitch,
    bearing: loc.bearing,
    duration: 1500,
    essential: true,
  };
}
