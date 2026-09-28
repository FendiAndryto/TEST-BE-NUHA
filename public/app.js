// State Management
const STATE = {
  token: localStorage.getItem('nuha_jwt_token') || null,
  user: null,
  activeRole: null,
  availableRoles: [],
  preAuthToken: null,
  tempRoles: [],
  selectedTempRoleId: null,
  activeTab: 'tab-preview',
  myMenus: [],
  selectedMenu: null,
  allRoles: [],
  selectedRoleForMgmt: null,
  allMenusFlat: []
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  if (STATE.token) {
    verifySession();
  } else {
    showAuthView();
  }
});

// --- TOAST NOTIFICATIONS ---
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 4000);
}

// --- API CLIENT WRAPPER ---
async function apiCall(endpoint, method = 'GET', body = null, customToken = null) {
  const headers = { 'Content-Type': 'application/json' };
  const tokenToUse = customToken || STATE.token;
  if (tokenToUse) {
    headers['Authorization'] = `Bearer ${tokenToUse}`;
  }

  const options = { method, headers };
  if (body) {
    options.body = JSON.stringify(body);
  }

  updateApiInspector(method, endpoint, body || '(none)');

  try {
    const res = await fetch(endpoint, options);
    const data = await res.json();

    updateApiInspectorResponse(res.status, data);

    if (!res.ok) {
      throw data;
    }
    return data;
  } catch (error) {
    throw error;
  }
}

function updateApiInspector(method, endpoint, requestData) {
  const methodBadge = document.getElementById('apiMethodBadge');
  const endpointUrl = document.getElementById('apiEndpointUrl');
  if (methodBadge && endpointUrl) {
    methodBadge.textContent = method;
    endpointUrl.textContent = endpoint;
  }
}

function updateApiInspectorResponse(status, responseData) {
  const box = document.getElementById('apiJsonOutput');
  if (box) {
    box.textContent = `// HTTP Status: ${status}\n` + JSON.stringify(responseData, null, 2);
  }
}

function clearApiLogs() {
  const box = document.getElementById('apiJsonOutput');
  if (box) {
    box.textContent = '// Log dibersihkan. Lakukan interaksi API untuk melihat JSON output...';
  }
}

// --- AUTHENTICATION FLOWS (KRITERIA #1 & #2) ---
function quickLogin(username, password) {
  document.getElementById('username').value = username;
  document.getElementById('password').value = password;
  document.getElementById('loginForm').dispatchEvent(new Event('submit'));
}

async function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const btn = document.getElementById('btnLoginSubmit');

  btn.disabled = true;
  btn.querySelector('.btn-text').textContent = 'Memverifikasi...';

  try {
    const res = await apiCall('/api/auth/login', 'POST', { username, password });

    if (res.requiresRoleSelection) {
      // KRITERIA #2: Jabatan Ganda terdeteksi! Tampilkan modal pemilihan role
      STATE.preAuthToken = res.preAuthToken;
      STATE.tempRoles = res.roles;
      STATE.user = res.user;
      showToast('Karyawan memiliki jabatan ganda. Silakan pilih role!', 'success');
      openRoleSelectionModal(res.roles, res.user);
    } else {
      // Single Role: Langsung masuk ke dashboard
      STATE.token = res.accessToken;
      STATE.user = res.user;
      STATE.activeRole = res.activeRole;
      STATE.availableRoles = res.availableRoles || [res.activeRole];
      localStorage.setItem('nuha_jwt_token', res.accessToken);

      showToast(`Login berhasil sebagai ${res.activeRole.name}!`, 'success');
      showDashboardView();
    }
  } catch (err) {
    showToast(err.message || 'Gagal login. Periksa username dan password.', 'error');
  } finally {
    btn.disabled = false;
    btn.querySelector('.btn-text').textContent = 'Masuk ke Sistem';
  }
}

// KRITERIA #2: Modal Pemilihan Role untuk Jabatan Ganda
function openRoleSelectionModal(roles, user) {
  const modal = document.getElementById('roleModal');
  const list = document.getElementById('roleOptionsList');
  const subtext = document.getElementById('roleModalSubtext');

  subtext.textContent = `Halo ${user.name}! Akun Anda memiliki ${roles.length} jabatan aktif. Silakan pilih role Anda:`;
  list.innerHTML = '';
  STATE.selectedTempRoleId = null;
  document.getElementById('btnConfirmRole').disabled = true;

  roles.forEach((r, idx) => {
    const card = document.createElement('div');
    card.className = 'role-radio-card';
    card.onclick = () => selectTempRole(r.id, card);
    card.innerHTML = `
      <div class="role-radio-circle"></div>
      <div>
        <div class="role-info-title">${r.name}</div>
        <div class="role-info-desc">${r.description || 'Kode: ' + r.code}</div>
      </div>
    `;
    list.appendChild(card);
  });

  modal.style.display = 'flex';
}

function selectTempRole(roleId, cardElement) {
  STATE.selectedTempRoleId = roleId;
  document.querySelectorAll('.role-radio-card').forEach((el) => el.classList.remove('selected'));
  cardElement.classList.add('selected');
  document.getElementById('btnConfirmRole').disabled = false;
}

function cancelRoleSelection() {
  document.getElementById('roleModal').style.display = 'none';
  STATE.preAuthToken = null;
  STATE.tempRoles = [];
  STATE.selectedTempRoleId = null;
}

async function submitRoleSelection() {
  if (!STATE.selectedTempRoleId || !STATE.preAuthToken) return;

  const btn = document.getElementById('btnConfirmRole');
  btn.disabled = true;
  btn.textContent = 'Menyimpan sesi...';

  try {
    const res = await apiCall('/api/auth/select-role', 'POST', {
      preAuthToken: STATE.preAuthToken,
      roleId: STATE.selectedTempRoleId
    });

    document.getElementById('roleModal').style.display = 'none';

    STATE.token = res.accessToken;
    STATE.user = res.user;
    STATE.activeRole = res.activeRole;
    STATE.availableRoles = res.availableRoles || [];
    localStorage.setItem('nuha_jwt_token', res.accessToken);

    showToast(res.message, 'success');
    showDashboardView();
  } catch (err) {
    showToast(err.message || 'Gagal memilih role.', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Lanjutkan dengan Role Ini \u2192';
  }
}

// Beralih Jabatan (Switch Role On The Fly)
async function switchRole(roleId) {
  try {
    const res = await apiCall('/api/auth/switch-role', 'POST', { roleId });
    STATE.token = res.accessToken;
    STATE.activeRole = res.activeRole;
    localStorage.setItem('nuha_jwt_token', res.accessToken);

    toggleRoleDropdown(false);
    showToast(res.message, 'success');
    updateHeaderUser();
    await loadMyMenu();
  } catch (err) {
    showToast(err.message || 'Gagal beralih role.', 'error');
  }
}

function toggleRoleDropdown(forceState) {
  const menu = document.getElementById('roleDropdownMenu');
  if (typeof forceState === 'boolean') {
    menu.classList.toggle('show', forceState);
  } else {
    menu.classList.toggle('show');
  }
}

// Verifikasi Sesi Token saat Refresh Halaman
async function verifySession() {
  try {
    const res = await apiCall('/api/auth/profile');
    STATE.user = res.data.user;
    STATE.activeRole = res.data.activeRole;
    STATE.availableRoles = res.data.availableRoles;
    showDashboardView();
  } catch (err) {
    logout();
  }
}

function logout() {
  STATE.token = null;
  STATE.user = null;
  STATE.activeRole = null;
  STATE.availableRoles = [];
  localStorage.removeItem('nuha_jwt_token');
  showAuthView();
  showToast('Anda telah keluar dari sistem.');
}

function showAuthView() {
  document.getElementById('authView').style.display = 'flex';
  document.getElementById('dashboardView').style.display = 'none';
  document.getElementById('headerActions').style.display = 'none';
  document.getElementById('roleModal').style.display = 'none';
}

function showDashboardView() {
  document.getElementById('authView').style.display = 'none';
  document.getElementById('dashboardView').style.display = 'flex';
  document.getElementById('headerActions').style.display = 'flex';

  updateHeaderUser();
  loadMyMenu();

  // Tampilkan/sembunyikan tombol manajemen jika Super Admin
  const isSuperAdmin = STATE.activeRole && STATE.activeRole.code === 'SUPER_ADMIN';
  document.getElementById('tabBtnRoleMgmt').style.display = isSuperAdmin ? 'inline-flex' : 'none';
  document.getElementById('tabBtnMenuMgmt').style.display = isSuperAdmin ? 'inline-flex' : 'none';

  if (isSuperAdmin) {
    loadRoleManagementData();
    loadMasterMenusTable();
  }
}

function updateHeaderUser() {
  if (!STATE.user || !STATE.activeRole) return;

  document.getElementById('headerAvatar').textContent = STATE.user.name.charAt(0).toUpperCase();
  document.getElementById('headerUserName').textContent = STATE.user.name;
  document.getElementById('headerUserRole').textContent = STATE.activeRole.name;
  document.getElementById('sidebarRoleName').textContent = STATE.activeRole.name;
  document.getElementById('sidebarRoleDesc').textContent = STATE.activeRole.description || 'Kode: ' + STATE.activeRole.code;

  document.getElementById('cardUserName').textContent = STATE.user.name;
  document.getElementById('cardUserEmail').textContent = STATE.user.email || STATE.user.username;
  document.getElementById('cardRoleName').textContent = STATE.activeRole.name;
  document.getElementById('cardRoleCode').textContent = 'Role Code: ' + STATE.activeRole.code;

  // Render Role Switcher Dropdown (Jika memiliki multiple role)
  const roleSwitcher = document.getElementById('roleSwitcherContainer');
  const roleBadge = document.getElementById('headerRoleBadge');
  const dropdownItems = document.getElementById('roleDropdownItems');

  if (STATE.availableRoles && STATE.availableRoles.length > 1) {
    roleSwitcher.style.display = 'block';
    roleBadge.textContent = STATE.activeRole.name;
    dropdownItems.innerHTML = '';

    STATE.availableRoles.forEach((r) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `role-switch-item ${r.id === STATE.activeRole.id ? 'active' : ''}`;
      btn.innerHTML = `<strong>${r.name}</strong><br><small>${r.code}</small>`;
      btn.onclick = () => switchRole(r.id);
      dropdownItems.appendChild(btn);
    });
  } else {
    roleSwitcher.style.display = 'none';
  }
}

// --- DYNAMIC TREE MENU (KRITERIA #3 & CATATAN SOAL) ---
async function loadMyMenu() {
  const container = document.getElementById('sidebarMenuTree');
  container.innerHTML = '<div style="color: #64748b; font-size: 0.75rem; padding: 12px;">Memuat menu hak akses...</div>';

  try {
    const res = await apiCall('/api/menus/my-menu');
    STATE.myMenus = res.data;

    let count = 0;
    const countMenus = (nodes) => {
      nodes.forEach((n) => {
        count++;
        if (n.children && n.children.length) countMenus(n.children);
      });
    };
    countMenus(STATE.myMenus);
    document.getElementById('cardTotalMenus').textContent = count;

    renderTreeMenu(container, STATE.myMenus, 1);

    // Default select first item
    if (STATE.myMenus.length > 0) {
      selectMenuItem(STATE.myMenus[0], [STATE.myMenus[0].name], 1);
    }
  } catch (err) {
    container.innerHTML = `<div style="color: #ef4444; font-size: 0.75rem; padding: 12px;">Gagal memuat menu: ${err.message || 'Error'}</div>`;
  }
}

// Render Recursive Tree (Multiple Level Tanpa Batas)
function renderTreeMenu(parentElement, nodes, level = 1) {
  parentElement.innerHTML = '';

  nodes.forEach((node) => {
    const hasChildren = node.children && node.children.length > 0;

    const nodeEl = document.createElement('div');
    nodeEl.className = `tree-node level-${level} ${hasChildren ? 'expanded' : ''}`;

    const itemEl = document.createElement('div');
    itemEl.className = 'tree-node-item';
    itemEl.dataset.menuId = node.id;

    const iconSvg = hasChildren
      ? `<svg class="tree-node-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`
      : `<svg class="tree-node-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`;

    const chevronSvg = hasChildren
      ? `<svg class="tree-node-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>`
      : '';

    itemEl.innerHTML = `
      <div class="tree-node-left">
        ${iconSvg}
        <span>${node.name}</span>
      </div>
      ${chevronSvg}
    `;

    itemEl.onclick = (e) => {
      // Highlight active
      document.querySelectorAll('.tree-node-item').forEach((el) => el.classList.remove('active'));
      itemEl.classList.add('active');

      // Toggle children if has chevron clicked or double click
      if (hasChildren && (e.target.closest('.tree-node-chevron') || nodeEl.classList.contains('collapsed'))) {
        nodeEl.classList.toggle('expanded');
        nodeEl.classList.toggle('collapsed');
      } else if (hasChildren) {
        nodeEl.classList.toggle('expanded');
      }

      // Breadcrumb path computation
      const breadcrumbTrail = computeBreadcrumbs(node.id, STATE.myMenus);
      selectMenuItem(node, breadcrumbTrail, level);
    };

    nodeEl.appendChild(itemEl);

    if (hasChildren) {
      const childrenContainer = document.createElement('div');
      childrenContainer.className = 'tree-node-children';
      renderTreeMenu(childrenContainer, node.children, level + 1);
      nodeEl.appendChild(childrenContainer);
    }

    parentElement.appendChild(nodeEl);
  });
}

function computeBreadcrumbs(targetId, nodes, path = []) {
  for (const node of nodes) {
    if (node.id === targetId) {
      return [...path, node.name];
    }
    if (node.children && node.children.length > 0) {
      const found = computeBreadcrumbs(targetId, node.children, [...path, node.name]);
      if (found) return found;
    }
  }
  return null;
}

function selectMenuItem(node, breadcrumbs, depth) {
  STATE.selectedMenu = node;
  document.getElementById('selectedMenuTitle').textContent = node.name;
  document.getElementById('selectedMenuDesc').textContent =
    `Path: ${node.path || '(no path)'} | Kode: ${node.code} | Urutan: ${node.orderIndex} | Kedalaman: Level ${depth}`;

  const bcContainer = document.getElementById('contentBreadcrumbs');
  bcContainer.innerHTML = '<span>Home</span>';
  if (breadcrumbs) {
    breadcrumbs.forEach((bc, idx) => {
      bcContainer.innerHTML += ` &gt; <span class="${idx === breadcrumbs.length - 1 ? 'active' : ''}">${bc}</span>`;
    });
  }

  document.getElementById('menuDepthBadge').textContent = `Kedalaman: Level ${depth}`;
}

// --- TAB SWITCHING ---
function switchTab(tabId) {
  STATE.activeTab = tabId;
  document.querySelectorAll('.tab-btn').forEach((btn) => btn.classList.remove('active'));
  document.querySelectorAll('.tab-pane').forEach((pane) => pane.classList.remove('active'));

  const activeBtn = Array.from(document.querySelectorAll('.tab-btn')).find((b) => b.getAttribute('onclick').includes(tabId));
  if (activeBtn) activeBtn.classList.add('active');

  const pane = document.getElementById(tabId);
  if (pane) pane.classList.add('active');
}

// --- TAB 2: ROLE ACCESS MANAGEMENT (KRITERIA #4) ---
async function loadRoleManagementData() {
  try {
    const rolesRes = await apiCall('/api/roles');
    STATE.allRoles = rolesRes.data;

    const treeRes = await apiCall('/api/menus/tree');
    const masterTree = treeRes.data;

    renderRoleSelectorList(STATE.allRoles);
    if (STATE.allRoles.length > 0) {
      selectRoleForManagement(STATE.allRoles[0], masterTree);
    }
  } catch (err) {
    console.error('Error loading role mgmt:', err);
  }
}

function renderRoleSelectorList(roles) {
  const container = document.getElementById('roleSelectorList');
  container.innerHTML = '';

  roles.forEach((r) => {
    const card = document.createElement('div');
    card.className = `role-select-item ${STATE.selectedRoleForMgmt?.id === r.id ? 'active' : ''}`;
    card.innerHTML = `
      <div class="role-select-item-title">${r.name}</div>
      <div class="role-select-item-code">${r.code} (${r._count?.menus || 0} menu diizinkan)</div>
    `;
    card.onclick = () => {
      document.querySelectorAll('.role-select-item').forEach((el) => el.classList.remove('active'));
      card.classList.add('active');
      selectRoleForManagement(r);
    };
    container.appendChild(card);
  });
}

async function selectRoleForManagement(role, treeData = null) {
  STATE.selectedRoleForMgmt = role;
  document.getElementById('targetRoleNameHeader').textContent = `Hak Akses Menu untuk: ${role.name}`;

  const container = document.getElementById('permissionTreeContainer');
  container.innerHTML = '<div class="loading-spinner">Mengambil daftar izin...</div>';

  try {
    const permRes = await apiCall(`/api/roles/${role.id}/menus`);
    const assignedIds = new Set(permRes.data.assignedMenuIds);

    const masterTree = treeData || (await apiCall('/api/menus/tree')).data;
    container.innerHTML = '';
    renderPermissionTreeCheckboxes(container, masterTree, assignedIds, 1);
  } catch (err) {
    container.innerHTML = `<div style="color:red">Error: ${err.message}</div>`;
  }
}

function renderPermissionTreeCheckboxes(container, nodes, assignedIds, level = 1) {
  nodes.forEach((node) => {
    const item = document.createElement('div');
    item.className = `perm-item perm-level-${Math.min(level, 4)}`;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `perm_menu_${node.id}`;
    checkbox.value = node.id;
    checkbox.className = 'menu-perm-checkbox';
    checkbox.checked = assignedIds.has(node.id);

    const label = document.createElement('label');
    label.htmlFor = `perm_menu_${node.id}`;
    label.className = 'perm-label';
    label.innerHTML = `<strong>${node.name}</strong> <small style="color:#64748b">(${node.code})</small>`;

    item.appendChild(checkbox);
    item.appendChild(label);
    container.appendChild(item);

    if (node.children && node.children.length > 0) {
      renderPermissionTreeCheckboxes(container, node.children, assignedIds, level + 1);
    }
  });
}

function checkAllPermissions(checked) {
  document.querySelectorAll('.menu-perm-checkbox').forEach((cb) => (cb.checked = checked));
}

async function saveRolePermissions() {
  if (!STATE.selectedRoleForMgmt) return;

  const checkedBoxes = Array.from(document.querySelectorAll('.menu-perm-checkbox:checked'));
  const menuIds = checkedBoxes.map((cb) => parseInt(cb.value, 10));

  try {
    const res = await apiCall(`/api/roles/${STATE.selectedRoleForMgmt.id}/menus`, 'POST', { menuIds });
    showToast(res.message, 'success');

    // Jika role yang diperbarui sama dengan role user saat ini, perbarui sidebar
    if (STATE.activeRole && STATE.activeRole.id === STATE.selectedRoleForMgmt.id) {
      await loadMyMenu();
    }
    loadRoleManagementData();
  } catch (err) {
    showToast(err.message || 'Gagal menyimpan perubahan akses.', 'error');
  }
}

// --- TAB 3: MASTER MENU MANAGEMENT (KRITERIA #4) ---
async function loadMasterMenusTable() {
  const tbody = document.getElementById('masterMenuTableBody');
  tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4">Memuat data menu...</td></tr>';

  try {
    const res = await apiCall('/api/menus');
    STATE.allMenusFlat = res.data;

    tbody.innerHTML = '';
    STATE.allMenusFlat.forEach((m) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${m.name}</strong></td>
        <td><code>${m.code}</code></td>
        <td>${m.path || '-'}</td>
        <td>${m.parent ? m.parent.name : '<span style="color:#0d9488;font-weight:600">Root (Level 1)</span>'}</td>
        <td>${m.orderIndex}</td>
        <td><span class="badge-pill" style="background:#d1fae5;color:#065f46">Aktif</span></td>
        <td>
          <button class="btn btn-xs btn-outline" onclick="editMenu(${m.id})">Edit</button>
          <button class="btn btn-xs btn-danger-outline" onclick="deleteMenu(${m.id})">Hapus</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" style="color:red">Error: ${err.message}</td></tr>`;
  }
}

function openAddMenuModal() {
  document.getElementById('menuFormId').value = '';
  document.getElementById('menuModalTitle').textContent = 'Tambah Menu Baru';
  document.getElementById('menuName').value = '';
  document.getElementById('menuCode').value = '';
  document.getElementById('menuPath').value = '';
  document.getElementById('menuOrder').value = '1';

  populateParentDropdown();
  document.getElementById('menuModal').style.display = 'flex';
}

function populateParentDropdown(selectedId = null) {
  const select = document.getElementById('menuParentId');
  select.innerHTML = '<option value="">-- Menu Utama / Root (Level 1) --</option>';

  STATE.allMenusFlat.forEach((m) => {
    const opt = document.createElement('option');
    opt.value = m.id;
    opt.textContent = `${m.parent ? '\u2014 ' : ''}${m.name} (${m.code})`;
    if (selectedId && m.id === selectedId) opt.selected = true;
    select.appendChild(opt);
  });
}

function closeMenuModal() {
  document.getElementById('menuModal').style.display = 'none';
}

async function handleSaveMenu(e) {
  e.preventDefault();
  const id = document.getElementById('menuFormId').value;
  const name = document.getElementById('menuName').value.trim();
  const code = document.getElementById('menuCode').value.trim();
  const parentIdVal = document.getElementById('menuParentId').value;
  const parentId = parentIdVal ? parseInt(parentIdVal, 10) : null;
  const path = document.getElementById('menuPath').value.trim();
  const orderIndex = parseInt(document.getElementById('menuOrder').value, 10) || 0;
  const icon = document.getElementById('menuIcon').value.trim() || 'file-text';

  const payload = { name, code, parentId, path, orderIndex, icon };

  try {
    if (id) {
      await apiCall(`/api/menus/${id}`, 'PUT', payload);
      showToast('Menu berhasil diperbarui.', 'success');
    } else {
      await apiCall('/api/menus', 'POST', payload);
      showToast('Menu baru berhasil ditambahkan.', 'success');
    }
    closeMenuModal();
    loadMasterMenusTable();
    loadMyMenu();
  } catch (err) {
    showToast(err.message || 'Gagal menyimpan menu.', 'error');
  }
}

function editMenu(id) {
  const menu = STATE.allMenusFlat.find((m) => m.id === id);
  if (!menu) return;

  document.getElementById('menuFormId').value = menu.id;
  document.getElementById('menuModalTitle').textContent = `Edit Menu: ${menu.name}`;
  document.getElementById('menuName').value = menu.name;
  document.getElementById('menuCode').value = menu.code;
  document.getElementById('menuPath').value = menu.path || '';
  document.getElementById('menuOrder').value = menu.orderIndex;
  document.getElementById('menuIcon').value = menu.icon || 'file-text';

  populateParentDropdown(menu.parentId);
  document.getElementById('menuModal').style.display = 'flex';
}

async function deleteMenu(id) {
  if (!confirm('Apakah Anda yakin ingin menghapus menu ini beserta seluruh submenunya?')) return;

  try {
    await apiCall(`/api/menus/${id}`, 'DELETE');
    showToast('Menu berhasil dihapus.', 'success');
    loadMasterMenusTable();
    loadMyMenu();
  } catch (err) {
    showToast(err.message || 'Gagal menghapus menu.', 'error');
  }
}
