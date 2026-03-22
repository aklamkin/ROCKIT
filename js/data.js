const STORAGE_KEY = 'rockefeller-data';
const DATA_VERSION_KEY = 'rockefeller-data-version';
const CURRENT_VERSION = 3; // v3 = accurate campus layout + new buildings

let db = null;

export async function initData() {
  const stored = localStorage.getItem(STORAGE_KEY);
  const version = parseInt(localStorage.getItem(DATA_VERSION_KEY) || '0');

  if (stored) {
    db = JSON.parse(stored);
    // Migration: if old data lacks buildings, re-seed
    if (!db.buildings) {
      localStorage.removeItem(STORAGE_KEY);
      const resp = await fetch('./data/seed.json');
      db = await resp.json();
    }
  } else {
    const resp = await fetch('./data/seed.json');
    db = await resp.json();
  }

  // v2/v3 migration: generate floors for campus buildings (including new ones in v3)
  if (version < 3) {
    ensureCampusFloors();
    generateCampusSampleAssets();
    localStorage.setItem(DATA_VERSION_KEY, String(CURRENT_VERSION));
  }

  save();
  return db;
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

export function resetData() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(DATA_VERSION_KEY);
  return initData();
}

// ==========================================
// Campus floor generation (v2 migration)
// ==========================================
const CAMPUS_FLOOR_CONFIGS = {
  INTL:       { totalFloors: 41, baseSqft: 50400 },
  PALAZZO:    { totalFloors: 6,  baseSqft: 22000 },
  INTL_N:     { totalFloors: 6,  baseSqft: 22000 },
  BRIT:       { totalFloors: 6,  baseSqft: 28000 },
  MAISON:     { totalFloors: 6,  baseSqft: 28000 },
  '1270AVE':  { totalFloors: 31, baseSqft: 41600 },
  '1250AVE':  { totalFloors: 16, baseSqft: 36000 },
  RCMH:       { totalFloors: 3,  baseSqft: 39600 },
  '1ROCK':    { totalFloors: 36, baseSqft: 38400 },
  '10ROCK':   { totalFloors: 16, baseSqft: 25200 },
  '50ROCK':   { totalFloors: 15, baseSqft: 32000 },
  '75ROCK':   { totalFloors: 33, baseSqft: 28000 },
  '1230AVE':  { totalFloors: 21, baseSqft: 30800 },
  '600FIFTH': { totalFloors: 27, baseSqft: 26000 },
};

function ordinal(n) {
  if (n === 0) return 'Ground';
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function ensureCampusFloors() {
  for (const [buildingId, config] of Object.entries(CAMPUS_FLOOR_CONFIGS)) {
    // Skip if floors already exist for this building
    const existing = db.floors.filter(f => f.buildingId === buildingId);
    if (existing.length > 0) continue;

    for (let i = 0; i < config.totalFloors; i++) {
      const floorId = `${buildingId}-F${i}`;
      let name, type;

      if (buildingId === 'RCMH') {
        // Special names for Radio City
        if (i === 0) { name = 'Main Hall / Ground Level'; type = 'lobby'; }
        else if (i === 1) { name = 'Mezzanine Level'; type = 'office'; }
        else { name = 'Upper Level'; type = 'office'; }
      } else {
        if (i === 0) { name = 'Lobby / Ground Floor'; type = 'lobby'; }
        else if (i <= 2) { name = `${ordinal(i)} Floor - Retail`; type = 'retail'; }
        else { name = `${ordinal(i)} Floor`; type = 'office'; }
      }

      // Sqft decreases for upper floors (setback buildings)
      const sqftMultiplier = i > config.totalFloors * 0.7 ? 0.6 : (i > config.totalFloors * 0.4 ? 0.8 : 1);
      const sqft = Math.round(config.baseSqft * sqftMultiplier / 100) * 100;

      db.floors.push({
        id: floorId,
        number: i,
        name,
        type,
        sqft,
        buildingId,
      });
    }
  }
}

function generateCampusSampleAssets() {
  // Add a handful of sample assets for major campus buildings
  const sampleBuildings = [
    { id: 'INTL', prefix: 'INTL', floors: [0, 1, 5, 10, 20, 30, 40] },
    { id: 'PALAZZO', prefix: 'PAL', floors: [0, 2, 4] },
    { id: 'INTL_N', prefix: 'IN', floors: [0, 2, 4] },
    { id: '1ROCK', prefix: '1R', floors: [0, 1, 5, 10, 20, 30] },
    { id: '1270AVE', prefix: '1270', floors: [0, 1, 5, 10, 20] },
    { id: '1250AVE', prefix: '1250', floors: [0, 1, 5, 10] },
    { id: '75ROCK', prefix: '75R', floors: [0, 1, 5, 10, 20, 30] },
    { id: '10ROCK', prefix: '10R', floors: [0, 5, 10] },
    { id: '50ROCK', prefix: '50R', floors: [0, 5, 10] },
    { id: 'BRIT', prefix: 'BRT', floors: [0, 2, 4] },
    { id: 'MAISON', prefix: 'LMF', floors: [0, 2, 4] },
    { id: 'RCMH', prefix: 'RCMH', floors: [0, 1] },
    { id: '1230AVE', prefix: '1230', floors: [0, 5, 10] },
    { id: '600FIFTH', prefix: '600', floors: [0, 5, 10, 20] },
  ];

  const assetTemplates = [
    { type: 'wifi_ap', category: 'standard_it', nameTpl: 'Wi-Fi AP', manufacturer: 'Cisco', modelPrefix: 'AIR-AP' },
    { type: 'network_switch', category: 'standard_it', nameTpl: 'Network Switch', manufacturer: 'Cisco', modelPrefix: 'C9300' },
    { type: 'printer', category: 'standard_it', nameTpl: 'Printer', manufacturer: 'HP', modelPrefix: 'LaserJet' },
    { type: 'phone_system', category: 'av_comms', nameTpl: 'Phone System', manufacturer: 'Polycom', modelPrefix: 'VVX' },
  ];

  let counter = 1;
  for (const bldg of sampleBuildings) {
    for (const floorNum of bldg.floors) {
      // Each floor gets 1-2 assets
      const numAssets = floorNum === 0 ? 3 : (Math.random() > 0.5 ? 2 : 1);
      for (let a = 0; a < numAssets && a < assetTemplates.length; a++) {
        const tpl = assetTemplates[a];
        const floorId = `${bldg.id}-F${floorNum}`;
        const id = `A_campus_${counter++}`;
        const octet3 = Math.floor(Math.random() * 254) + 1;
        const octet4 = Math.floor(Math.random() * 254) + 1;

        db.assets.push({
          id,
          name: `${tpl.nameTpl} — ${bldg.prefix} F${floorNum}`,
          type: tpl.type,
          status: Math.random() > 0.15 ? 'active' : (Math.random() > 0.5 ? 'maintenance' : 'inactive'),
          category: tpl.category,
          floorId,
          buildingId: bldg.id,
          room: floorNum === 0 ? 'Lobby' : `Room ${floorNum}${String.fromCharCode(65 + a)}`,
          serialNumber: `${tpl.modelPrefix}-${1000 + counter}`,
          ipAddress: `10.${50 + sampleBuildings.indexOf(bldg)}.${octet3}.${octet4}`,
          macAddress: `AA:BB:${bldg.prefix.slice(0,2).toUpperCase()}:${String(floorNum).padStart(2,'0')}:00:${String(a).padStart(2,'0')}`,
          manufacturer: tpl.manufacturer,
          model: `${tpl.modelPrefix} ${2000 + Math.floor(Math.random() * 500)}`,
          purchaseDate: `2024-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-15`,
          warrantyExpiry: `2027-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-15`,
          lastServicedDate: '2025-11-01',
          assignedTenantId: null,
          assetTag: `${bldg.prefix}-${String(floorNum).padStart(2,'0')}-${String(counter).padStart(4,'0')}`,
          notes: '',
          maintenanceHistory: [],
        });
      }
    }
  }
}

// ---- Buildings ----
export function getAllBuildings() { return db.buildings; }
export function getBuildingById(id) { return db.buildings.find(b => b.id === id); }

export function updateBuilding(id, updates) {
  const idx = db.buildings.findIndex(b => b.id === id);
  if (idx === -1) return null;
  db.buildings[idx] = { ...db.buildings[idx], ...updates, id };
  save();
  return db.buildings[idx];
}

// ---- Floors ----
export function getAllFloors() { return db.floors; }
export function getFloorById(id) { return db.floors.find(f => f.id === id); }
export function getFloorsByBuilding(buildingId) {
  return db.floors.filter(f => f.buildingId === buildingId);
}

// ---- Tenants ----
export function getAllTenants() { return db.tenants; }
export function getTenantById(id) { return db.tenants.find(t => t.id === id); }
export function getTenantsByFloor(floorId) {
  const floor = getFloorById(floorId);
  if (!floor) return [];
  return db.tenants.filter(t => t.floorIds.includes(floorId));
}

// ---- Assets ----
export function getAllAssets() { return db.assets; }
export function getAssetById(id) { return db.assets.find(a => a.id === id); }
export function getAssetsByFloor(floorId) {
  return db.assets.filter(a => a.floorId === floorId);
}

export function createAsset(asset) {
  asset.id = 'A' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  db.assets.push(asset);
  save();
  return asset;
}

export function updateAsset(id, updates) {
  const idx = db.assets.findIndex(a => a.id === id);
  if (idx === -1) return null;
  db.assets[idx] = { ...db.assets[idx], ...updates, id };
  save();
  return db.assets[idx];
}

export function deleteAsset(id) {
  const idx = db.assets.findIndex(a => a.id === id);
  if (idx === -1) return false;
  db.assets.splice(idx, 1);
  save();
  return true;
}

export function searchAssets(query) {
  const q = query.toLowerCase();
  return db.assets.filter(a =>
    a.name.toLowerCase().includes(q) ||
    a.serialNumber.toLowerCase().includes(q) ||
    (a.ipAddress && a.ipAddress.includes(q)) ||
    a.type.toLowerCase().includes(q) ||
    (a.manufacturer && a.manufacturer.toLowerCase().includes(q)) ||
    (a.model && a.model.toLowerCase().includes(q)) ||
    (a.assetTag && a.assetTag.toLowerCase().includes(q))
  );
}

export function filterAssets(assets, filters) {
  let result = assets;
  if (filters.type) result = result.filter(a => a.type === filters.type);
  if (filters.status) result = result.filter(a => a.status === filters.status);
  if (filters.category) result = result.filter(a => a.category === filters.category);
  if (filters.floorId) result = result.filter(a => a.floorId === filters.floorId);
  return result;
}

export function getAssetStats(floorId) {
  const assets = floorId ? getAssetsByFloor(floorId) : db.assets;
  return {
    total: assets.length,
    active: assets.filter(a => a.status === 'active').length,
    maintenance: assets.filter(a => a.status === 'maintenance').length,
    inactive: assets.filter(a => a.status === 'inactive').length,
  };
}

// Asset type labels and icons
export const ASSET_TYPES = {
  printer: { label: 'Printer', icon: '🖨️', category: 'standard_it' },
  pos: { label: 'POS Terminal', icon: '💳', category: 'standard_it' },
  tv_display: { label: 'TV / Display', icon: '📺', category: 'standard_it' },
  computer: { label: 'Computer', icon: '💻', category: 'standard_it' },
  server: { label: 'Server', icon: '🖥️', category: 'standard_it' },
  network_switch: { label: 'Network Switch', icon: '🔌', category: 'standard_it' },
  router: { label: 'Router', icon: '📡', category: 'standard_it' },
  wifi_ap: { label: 'Wi-Fi AP', icon: '📶', category: 'standard_it' },
  projector: { label: 'Projector', icon: '📽️', category: 'av_comms' },
  conference_system: { label: 'Conference System', icon: '🎥', category: 'av_comms' },
  phone_system: { label: 'Phone System', icon: '📞', category: 'av_comms' },
  digital_signage: { label: 'Digital Signage', icon: '🪧', category: 'av_comms' },
  pa_intercom: { label: 'PA / Intercom', icon: '🔊', category: 'av_comms' },
};

export const STATUS_LABELS = {
  active: 'Active',
  inactive: 'Inactive',
  maintenance: 'Maintenance',
};
