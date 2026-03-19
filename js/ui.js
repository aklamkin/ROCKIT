import {
  getFloorById, getTenantsByFloor, getAssetsByFloor, getAllFloors,
  getTenantById, createAsset, updateAsset, deleteAsset,
  searchAssets, filterAssets, getAssetStats,
  ASSET_TYPES, STATUS_LABELS, getAllAssets,
  getAllBuildings, getBuildingById, getFloorsByBuilding
} from './data.js';

const panel = document.getElementById('side-panel');
const strip = document.getElementById('floor-strip');

// All buildings with their display order for tabs
const BUILDING_TAB_ORDER = [
  '30ROCK', 'INTL', '1ROCK', '1270AVE', '1250AVE', '75ROCK',
  '10ROCK', '50ROCK', 'BRIT', 'MAISON', 'RCMH', '1230AVE',
];

// Short display names for building tabs
const BUILDING_SHORT_NAMES = {
  '30ROCK': '30 Rock',
  'INTL': 'International',
  'BRIT': 'British Empire',
  'MAISON': 'La Maison',
  '1270AVE': '1270 Ave',
  '1250AVE': '1250 Ave',
  'RCMH': 'Radio City',
  '1ROCK': '1 Rock Plaza',
  '10ROCK': '10 Rock',
  '50ROCK': '50 Rock',
  '75ROCK': '75 Rock',
  '1230AVE': '1230 Ave',
};

let state = {
  selectedFloorId: null,
  selectedBuildingId: '30ROCK',
  activeTab: 'assets',
  searchQuery: '',
  filterType: '',
  filterStatus: '',
  expandedAssetId: null,
  expandedTenantId: null,
};

let onFloorSelectFromStrip = null;

export function initUI(floorSelectCallback) {
  onFloorSelectFromStrip = floorSelectCallback;
  renderStrip();
  renderPanel();
}

export function selectFloorInUI(floorId, floorData) {
  state.selectedFloorId = floorId;
  state.expandedAssetId = null;
  state.expandedTenantId = null;

  // Auto-switch building tab based on clicked floor
  if (floorData && floorData.buildingId) {
    state.selectedBuildingId = floorData.buildingId;
  } else {
    // Outdoor areas or 30 Rock floors without buildingId
    const floor = getFloorById(floorId);
    if (floor && floor.buildingId) {
      state.selectedBuildingId = floor.buildingId;
    }
  }

  renderPanel();
  renderStrip();
}

// ======= Floor Strip with Building Tabs =======
function renderStrip() {
  strip.innerHTML = '';

  // Building tabs row
  const tabsRow = document.createElement('div');
  tabsRow.id = 'building-tabs';

  const buildings = getAllBuildings().filter(b => b.id !== 'OUTDOOR');
  // Sort by our preferred order
  buildings.sort((a, b) => {
    const ai = BUILDING_TAB_ORDER.indexOf(a.id);
    const bi = BUILDING_TAB_ORDER.indexOf(b.id);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

  for (const bldg of buildings) {
    const tab = document.createElement('div');
    tab.className = 'building-tab';
    if (bldg.id === state.selectedBuildingId) tab.classList.add('selected');
    tab.textContent = BUILDING_SHORT_NAMES[bldg.id] || bldg.name;
    tab.dataset.buildingId = bldg.id;
    tab.addEventListener('click', () => {
      state.selectedBuildingId = bldg.id;
      renderStrip();
      // Don't change selected floor — just update which floors are shown
    });
    tabsRow.appendChild(tab);
  }

  strip.appendChild(tabsRow);

  // Floor items row
  const floorRow = document.createElement('div');
  floorRow.id = 'floor-items';

  if (state.selectedBuildingId === '30ROCK') {
    render30RockFloors(floorRow);
  } else if (state.selectedBuildingId === 'OUTDOOR') {
    renderOutdoorFloors(floorRow);
  } else {
    renderCampusBuildingFloors(floorRow, state.selectedBuildingId);
  }

  strip.appendChild(floorRow);

  // Scroll selected floor into view
  requestAnimationFrame(() => {
    const selected = floorRow.querySelector('.strip-item.selected');
    if (selected) selected.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  });
}

function render30RockFloors(container) {
  const floors = getFloorsByBuilding('30ROCK');

  // Basements
  const basements = floors.filter(f => f.number < 0 && f.number > -100).sort((a, b) => a.number - b.number);
  basements.forEach(f => container.appendChild(makeStripItem(f)));

  container.appendChild(makeDivider());

  // Ground + regular floors
  const regular = floors.filter(f => f.number >= 0 && f.number <= 71).sort((a, b) => a.number - b.number);
  regular.forEach(f => container.appendChild(makeStripItem(f)));

  container.appendChild(makeDivider());

  // Outdoor areas
  const outdoor = getFloorsByBuilding('OUTDOOR').sort((a, b) => a.number - b.number);
  outdoor.forEach(f => {
    const el = makeStripItem(f);
    el.classList.add('outdoor');
    container.appendChild(el);
  });
}

function renderCampusBuildingFloors(container, buildingId) {
  const floors = getFloorsByBuilding(buildingId).sort((a, b) => a.number - b.number);

  if (floors.length === 0) {
    const empty = document.createElement('div');
    empty.style.cssText = 'padding:8px 12px;color:var(--panel-text-dim);font-size:11px;';
    empty.textContent = 'No floor data available';
    container.appendChild(empty);
    return;
  }

  floors.forEach(f => container.appendChild(makeStripItem(f)));
}

function renderOutdoorFloors(container) {
  const outdoor = getFloorsByBuilding('OUTDOOR').sort((a, b) => a.number - b.number);
  outdoor.forEach(f => {
    const el = makeStripItem(f);
    el.classList.add('outdoor');
    container.appendChild(el);
  });
}

function makeStripItem(floor) {
  const el = document.createElement('div');
  el.className = 'strip-item';
  el.dataset.floorId = floor.id;
  if (floor.id === state.selectedFloorId) el.classList.add('selected');

  let label;
  if (floor.id === 'OBS') label = 'Obs Deck';
  else if (floor.id.startsWith('OUT-')) label = floor.name;
  else if (floor.number < 0) label = `B${Math.abs(floor.number)}`;
  else if (floor.number === 0) label = 'Lobby';
  else label = `${floor.number}`;

  el.textContent = label;
  el.addEventListener('click', () => {
    if (onFloorSelectFromStrip) onFloorSelectFromStrip(floor.id);
  });
  return el;
}

function makeDivider() {
  const el = document.createElement('div');
  el.className = 'strip-divider';
  return el;
}

// ======= Side Panel =======
function renderPanel() {
  panel.innerHTML = '';

  if (!state.selectedFloorId) {
    renderWelcome();
    return;
  }

  const floor = getFloorById(state.selectedFloorId);
  if (!floor) {
    renderWelcome();
    return;
  }

  renderFloorInfo(floor);
  renderTabs();

  if (state.activeTab === 'tenants') {
    renderTenants(floor);
  } else {
    renderAssets(floor);
  }
}

function renderWelcome() {
  panel.innerHTML = `
    <div class="welcome">
      <div class="welcome-icon">🏙️</div>
      <h2>Rockefeller Center</h2>
      <p>Click on any floor of any building or select from the strip below to view tenant and IT asset information.</p>
      <p style="margin-top:12px; font-size: 11px; color: var(--panel-text-dim);">
        Rotate: Left drag &bull; Zoom: Scroll &bull; Pan: Right drag
      </p>
    </div>
  `;
}

function renderFloorInfo(floor) {
  const stats = getAssetStats(floor.id);
  const tenants = getTenantsByFloor(floor.id);
  const building = floor.buildingId ? getBuildingById(floor.buildingId) : null;

  let badge;
  if (floor.id === 'OBS') badge = 'OBS';
  else if (floor.id.startsWith('OUT-')) badge = 'EXT';
  else if (floor.number < 0) badge = `B${Math.abs(floor.number)}`;
  else badge = floor.number;

  const section = document.createElement('div');
  section.className = 'panel-section';
  section.innerHTML = `
    ${building ? `<div style="font-size:11px;color:var(--accent);font-weight:600;letter-spacing:0.5px;margin-bottom:8px;">${escapeHtml(building.name).toUpperCase()}</div>` : ''}
    <div class="floor-info-header">
      <div class="floor-badge">${badge}</div>
      <div>
        <div class="floor-name">${floor.name}</div>
        <div class="floor-meta">${capitalize(floor.type)} &bull; ${(floor.sqft || 0).toLocaleString()} sqft &bull; ${tenants.length} tenant${tenants.length !== 1 ? 's' : ''}</div>
      </div>
    </div>
    <div class="stats-row">
      <div class="stat-box"><div class="stat-value">${stats.total}</div><div class="stat-label">Total Assets</div></div>
      <div class="stat-box"><div class="stat-value" style="color:var(--success)">${stats.active}</div><div class="stat-label">Active</div></div>
      <div class="stat-box"><div class="stat-value" style="color:var(--warning)">${stats.maintenance}</div><div class="stat-label">Maintenance</div></div>
    </div>
  `;
  panel.appendChild(section);
}

function renderTabs() {
  const tabs = document.createElement('div');
  tabs.className = 'panel-tabs';
  tabs.innerHTML = `
    <div class="panel-tab ${state.activeTab === 'assets' ? 'active' : ''}" data-tab="assets">Assets</div>
    <div class="panel-tab ${state.activeTab === 'tenants' ? 'active' : ''}" data-tab="tenants">Tenants</div>
  `;
  tabs.querySelectorAll('.panel-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      state.activeTab = tab.dataset.tab;
      renderPanel();
    });
  });
  panel.appendChild(tabs);
}

// ======= Assets Tab =======
function renderAssets(floor) {
  // Search & filter bar
  const bar = document.createElement('div');
  bar.className = 'search-bar';
  bar.innerHTML = `
    <input class="search-input" type="text" placeholder="Search assets..." value="${escapeHtml(state.searchQuery)}">
    <select class="filter-select" id="filter-type">
      <option value="">All Types</option>
      ${Object.entries(ASSET_TYPES).map(([k, v]) => `<option value="${k}" ${state.filterType === k ? 'selected' : ''}>${v.icon} ${v.label}</option>`).join('')}
    </select>
    <select class="filter-select" id="filter-status">
      <option value="">All Status</option>
      ${Object.entries(STATUS_LABELS).map(([k, v]) => `<option value="${k}" ${state.filterStatus === k ? 'selected' : ''}>${v}</option>`).join('')}
    </select>
  `;
  panel.appendChild(bar);

  const searchInput = bar.querySelector('.search-input');
  searchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value;
    renderAssetList(floor);
  });
  bar.querySelector('#filter-type').addEventListener('change', (e) => {
    state.filterType = e.target.value;
    renderAssetList(floor);
  });
  bar.querySelector('#filter-status').addEventListener('change', (e) => {
    state.filterStatus = e.target.value;
    renderAssetList(floor);
  });

  // Asset list container
  const listContainer = document.createElement('div');
  listContainer.id = 'asset-list';
  listContainer.className = 'panel-section';
  panel.appendChild(listContainer);

  renderAssetList(floor);

  // Add asset button
  const fab = document.createElement('div');
  fab.className = 'fab';
  fab.innerHTML = `<button class="btn btn-primary">+ Add Asset</button>`;
  fab.querySelector('button').addEventListener('click', () => showAssetForm(null, floor.id));
  panel.appendChild(fab);
}

function renderAssetList(floor) {
  const listContainer = document.getElementById('asset-list');
  if (!listContainer) return;

  let assets = getAssetsByFloor(floor.id);

  if (state.searchQuery) {
    const q = state.searchQuery.toLowerCase();
    assets = assets.filter(a =>
      a.name.toLowerCase().includes(q) ||
      a.serialNumber.toLowerCase().includes(q) ||
      (a.ipAddress && a.ipAddress.includes(q)) ||
      (a.manufacturer && a.manufacturer.toLowerCase().includes(q)) ||
      (a.model && a.model.toLowerCase().includes(q)) ||
      (a.assetTag && a.assetTag.toLowerCase().includes(q))
    );
  }

  if (state.filterType) assets = assets.filter(a => a.type === state.filterType);
  if (state.filterStatus) assets = assets.filter(a => a.status === state.filterStatus);

  listContainer.innerHTML = '';

  if (assets.length === 0) {
    listContainer.innerHTML = `<div style="text-align:center;padding:20px;color:var(--panel-text-dim);font-size:13px;">No assets found</div>`;
    return;
  }

  assets.forEach(asset => {
    const typeInfo = ASSET_TYPES[asset.type] || { icon: '📦', label: asset.type };
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div style="display:flex;align-items:center;">
        <div class="type-icon">${typeInfo.icon}</div>
        <div style="flex:1;min-width:0;">
          <div class="card-title" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(asset.name)}</div>
          <div class="card-subtitle">${typeInfo.label} &bull; ${escapeHtml(asset.room || '')}</div>
        </div>
        <span class="badge badge-${asset.status}">${STATUS_LABELS[asset.status] || asset.status}</span>
      </div>
      <div class="card-row">
        <span class="card-detail" style="font-family:var(--font-mono)">${escapeHtml(asset.assetTag || '')}</span>
        <div style="display:flex;gap:4px;">
          <button class="btn-icon edit-btn" title="Edit">&#9998;</button>
          <button class="btn-icon danger delete-btn" title="Delete">&#128465;</button>
        </div>
      </div>
    `;

    // Expand/collapse detail
    const expanded = state.expandedAssetId === asset.id;
    if (expanded) {
      const tenant = asset.assignedTenantId ? getTenantById(asset.assignedTenantId) : null;
      const assetBuilding = asset.buildingId ? getBuildingById(asset.buildingId) : null;
      const detail = document.createElement('div');
      detail.className = 'asset-detail';
      detail.innerHTML = `
        ${assetBuilding ? detailRow('Building', assetBuilding.name) : ''}
        ${detailRow('Serial', asset.serialNumber)}
        ${detailRow('IP Address', asset.ipAddress)}
        ${detailRow('MAC Address', asset.macAddress)}
        ${detailRow('Manufacturer', asset.manufacturer)}
        ${detailRow('Model', asset.model)}
        ${detailRow('Purchase Date', asset.purchaseDate)}
        ${detailRow('Warranty Expiry', asset.warrantyExpiry)}
        ${detailRow('Last Serviced', asset.lastServicedDate)}
        ${detailRow('Assigned To', tenant ? tenant.companyName : 'Unassigned')}
        ${asset.notes ? detailRow('Notes', asset.notes) : ''}
        ${asset.maintenanceHistory && asset.maintenanceHistory.length > 0 ? `
          <div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--border);">
            <div style="font-size:11px;font-weight:600;color:var(--panel-text-dim);margin-bottom:4px;">MAINTENANCE HISTORY</div>
            ${asset.maintenanceHistory.map(m => `
              <div style="font-size:11px;padding:3px 0;color:var(--panel-text-dim);">
                <span style="color:var(--panel-text);font-family:var(--font-mono)">${m.date}</span> - ${escapeHtml(m.description)} (${escapeHtml(m.technician)})
              </div>
            `).join('')}
          </div>
        ` : ''}
      `;
      card.appendChild(detail);
      card.style.borderColor = 'var(--accent)';
    }

    card.addEventListener('click', (e) => {
      if (e.target.closest('.edit-btn') || e.target.closest('.delete-btn')) return;
      state.expandedAssetId = state.expandedAssetId === asset.id ? null : asset.id;
      renderAssetList(floor);
    });

    card.querySelector('.edit-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      showAssetForm(asset, floor.id);
    });

    card.querySelector('.delete-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      showDeleteConfirm(asset, floor);
    });

    listContainer.appendChild(card);
  });
}

function detailRow(label, value) {
  return `<div class="asset-detail-row"><span class="asset-detail-label">${label}</span><span class="asset-detail-value">${escapeHtml(value || '—')}</span></div>`;
}

// ======= Tenants Tab =======
function renderTenants(floor) {
  const tenants = getTenantsByFloor(floor.id);
  const section = document.createElement('div');
  section.className = 'panel-section';

  if (tenants.length === 0) {
    section.innerHTML = `<div style="text-align:center;padding:20px;color:var(--panel-text-dim);font-size:13px;">No tenants on this floor</div>`;
    panel.appendChild(section);
    return;
  }

  tenants.forEach(tenant => {
    const card = document.createElement('div');
    card.className = 'card';

    const assetCount = getAllAssets().filter(a => a.assignedTenantId === tenant.id && a.floorId === floor.id).length;

    card.innerHTML = `
      <div class="card-title">${escapeHtml(tenant.companyName)}</div>
      <div class="card-subtitle">Suite ${escapeHtml(tenant.suiteNumber)} &bull; ${assetCount} asset${assetCount !== 1 ? 's' : ''} on this floor</div>
    `;

    const expanded = state.expandedTenantId === tenant.id;
    if (expanded) {
      const detail = document.createElement('div');
      detail.className = 'tenant-expanded';
      detail.innerHTML = `
        <div class="tenant-row"><span class="tenant-label">Contact</span><span>${escapeHtml(tenant.contactPerson)}</span></div>
        <div class="tenant-row"><span class="tenant-label">Phone</span><span style="font-family:var(--font-mono)">${escapeHtml(tenant.phone)}</span></div>
        <div class="tenant-row"><span class="tenant-label">Email</span><span style="font-family:var(--font-mono);font-size:11px">${escapeHtml(tenant.email)}</span></div>
        <div class="tenant-row"><span class="tenant-label">Lease</span><span>${escapeHtml(tenant.leaseStart)} to ${escapeHtml(tenant.leaseEnd)}</span></div>
        <div class="tenant-row"><span class="tenant-label">Summary</span><span style="font-size:11px">${escapeHtml(tenant.leaseSummary)}</span></div>
        <div class="tenant-row"><span class="tenant-label">All Floors</span><span>${tenant.floorIds.join(', ')}</span></div>
      `;
      card.appendChild(detail);
      card.style.borderColor = 'var(--accent)';
    }

    card.addEventListener('click', () => {
      state.expandedTenantId = state.expandedTenantId === tenant.id ? null : tenant.id;
      renderPanel();
    });

    section.appendChild(card);
  });

  panel.appendChild(section);
}

// ======= Asset Form Modal =======
function showAssetForm(existingAsset, defaultFloorId) {
  const isEdit = !!existingAsset;
  const a = existingAsset || {};
  const floors = getAllFloors();
  const buildings = getAllBuildings();
  const defaultFloor = getFloorById(a.floorId || defaultFloorId);
  const defaultBuildingId = a.buildingId || (defaultFloor && defaultFloor.buildingId) || '30ROCK';

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h2>${isEdit ? 'Edit Asset' : 'Add New Asset'}</h2>
        <button class="btn-icon close-modal">&times;</button>
      </div>
      <div class="modal-body">
        <div class="form-section-title">Identity</div>
        <div class="form-group">
          <label class="form-label">Name *</label>
          <input class="form-input" id="af-name" value="${escapeHtml(a.name || '')}" placeholder="e.g., Floor 10 Conference System">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Type *</label>
            <select class="form-select" id="af-type">
              ${Object.entries(ASSET_TYPES).map(([k, v]) => `<option value="${k}" ${a.type === k ? 'selected' : ''}>${v.icon} ${v.label}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Asset Tag</label>
            <input class="form-input" id="af-assetTag" value="${escapeHtml(a.assetTag || '')}" placeholder="30R-XX-0000">
          </div>
        </div>

        <div class="form-section-title">Location</div>
        <div class="form-group">
          <label class="form-label">Building *</label>
          <select class="form-select" id="af-building">
            ${buildings.map(b => `<option value="${b.id}" ${defaultBuildingId === b.id ? 'selected' : ''}>${escapeHtml(b.name)}</option>`).join('')}
          </select>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Floor *</label>
            <select class="form-select" id="af-floor">
              ${floors.filter(f => f.buildingId === defaultBuildingId).map(f => `<option value="${f.id}" ${(a.floorId || defaultFloorId) === f.id ? 'selected' : ''}>${f.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Room / Area</label>
            <input class="form-input" id="af-room" value="${escapeHtml(a.room || '')}" placeholder="e.g., Server Room 10B">
          </div>
        </div>

        <div class="form-section-title">Status</div>
        <div class="form-group">
          <label class="form-label">Status *</label>
          <select class="form-select" id="af-status">
            <option value="active" ${a.status === 'active' || !a.status ? 'selected' : ''}>Active</option>
            <option value="inactive" ${a.status === 'inactive' ? 'selected' : ''}>Inactive</option>
            <option value="maintenance" ${a.status === 'maintenance' ? 'selected' : ''}>Maintenance</option>
          </select>
        </div>

        <div class="form-section-title">Hardware</div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Manufacturer</label>
            <input class="form-input" id="af-manufacturer" value="${escapeHtml(a.manufacturer || '')}">
          </div>
          <div class="form-group">
            <label class="form-label">Model</label>
            <input class="form-input" id="af-model" value="${escapeHtml(a.model || '')}">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Serial Number</label>
          <input class="form-input" id="af-serial" value="${escapeHtml(a.serialNumber || '')}">
        </div>

        <div class="form-section-title">Network</div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">IP Address</label>
            <input class="form-input" id="af-ip" value="${escapeHtml(a.ipAddress || '')}" placeholder="10.30.x.x">
          </div>
          <div class="form-group">
            <label class="form-label">MAC Address</label>
            <input class="form-input" id="af-mac" value="${escapeHtml(a.macAddress || '')}" placeholder="AA:BB:CC:DD:EE:FF">
          </div>
        </div>

        <div class="form-section-title">Dates</div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Purchase Date</label>
            <input class="form-input" id="af-purchase" type="date" value="${a.purchaseDate || ''}">
          </div>
          <div class="form-group">
            <label class="form-label">Warranty Expiry</label>
            <input class="form-input" id="af-warranty" type="date" value="${a.warrantyExpiry || ''}">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Last Serviced</label>
          <input class="form-input" id="af-lastServiced" type="date" value="${a.lastServicedDate || ''}">
        </div>

        <div class="form-section-title">Assignment</div>
        <div class="form-group">
          <label class="form-label">Assigned Tenant</label>
          <select class="form-select" id="af-tenant">
            <option value="">Unassigned</option>
            ${getTenantsByFloor(a.floorId || defaultFloorId).map(t => `<option value="${t.id}" ${a.assignedTenantId === t.id ? 'selected' : ''}>${escapeHtml(t.companyName)}</option>`).join('')}
          </select>
        </div>

        <div class="form-section-title">Notes</div>
        <div class="form-group">
          <textarea class="form-textarea" id="af-notes" rows="3">${escapeHtml(a.notes || '')}</textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost cancel-btn">Cancel</button>
        <button class="btn btn-primary save-btn">${isEdit ? 'Save Changes' : 'Create Asset'}</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Building dropdown changes -> update floor dropdown
  overlay.querySelector('#af-building').addEventListener('change', (e) => {
    const bId = e.target.value;
    const floorSelect = overlay.querySelector('#af-floor');
    const filteredFloors = floors.filter(f => f.buildingId === bId);
    floorSelect.innerHTML = filteredFloors.map(f => `<option value="${f.id}">${f.name}</option>`).join('');
  });

  overlay.querySelector('.close-modal').addEventListener('click', () => overlay.remove());
  overlay.querySelector('.cancel-btn').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

  overlay.querySelector('.save-btn').addEventListener('click', () => {
    const name = overlay.querySelector('#af-name').value.trim();
    const type = overlay.querySelector('#af-type').value;
    const floorId = overlay.querySelector('#af-floor').value;
    const buildingId = overlay.querySelector('#af-building').value;
    const status = overlay.querySelector('#af-status').value;

    if (!name) {
      overlay.querySelector('#af-name').classList.add('form-error');
      return;
    }

    const typeInfo = ASSET_TYPES[type];
    const data = {
      name,
      type,
      category: typeInfo ? typeInfo.category : 'standard_it',
      buildingId,
      floorId,
      room: overlay.querySelector('#af-room').value.trim(),
      status,
      serialNumber: overlay.querySelector('#af-serial').value.trim(),
      ipAddress: overlay.querySelector('#af-ip').value.trim(),
      macAddress: overlay.querySelector('#af-mac').value.trim(),
      manufacturer: overlay.querySelector('#af-manufacturer').value.trim(),
      model: overlay.querySelector('#af-model').value.trim(),
      purchaseDate: overlay.querySelector('#af-purchase').value,
      warrantyExpiry: overlay.querySelector('#af-warranty').value,
      lastServicedDate: overlay.querySelector('#af-lastServiced').value,
      assignedTenantId: overlay.querySelector('#af-tenant').value || null,
      assetTag: overlay.querySelector('#af-assetTag').value.trim(),
      notes: overlay.querySelector('#af-notes').value.trim(),
      maintenanceHistory: isEdit ? (a.maintenanceHistory || []) : [],
    };

    if (isEdit) {
      updateAsset(existingAsset.id, data);
    } else {
      createAsset(data);
    }

    overlay.remove();
    renderPanel();
  });
}

// ======= Delete Confirmation =======
function showDeleteConfirm(asset, floor) {
  const overlay = document.createElement('div');
  overlay.className = 'confirm-overlay';
  overlay.innerHTML = `
    <div class="confirm-dialog">
      <h3>Delete Asset</h3>
      <p>Are you sure you want to delete "<strong>${escapeHtml(asset.name)}</strong>"? This cannot be undone.</p>
      <div class="btn-row">
        <button class="btn btn-ghost cancel-btn">Cancel</button>
        <button class="btn btn-danger delete-btn">Delete</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  overlay.querySelector('.cancel-btn').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

  overlay.querySelector('.delete-btn').addEventListener('click', () => {
    deleteAsset(asset.id);
    state.expandedAssetId = null;
    overlay.remove();
    renderPanel();
  });
}

// ======= Helpers =======
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
