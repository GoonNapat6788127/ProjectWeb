// ==========================================
// CONFIG
// ==========================================

const BASE_URL = 'http://localhost:3030';


// ==========================================
// HELPERS
// ==========================================

const formatDate = (date) => {
  if (!date) return '-';
  const d     = new Date(date);
  const day   = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year  = String(d.getFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
};

const getImageUrl = (images, name, size = '200x200') =>
  images?.[0]?.ImageURL ??
  `https://placehold.co/${size}/FFFFFF/DDDDDD?text=${encodeURIComponent(name)}`;

const getIdFromURL = () => {
  const parts = window.location.pathname.split('/').filter(Boolean);
  return parts[parts.length - 1] || null;
};

const getProductIdFromURL = () => {
  if (!window.location.pathname.includes('edit-product')) return null;
  return getIdFromURL();
};


// ==========================================
// API LAYER
// ==========================================

const handleResponse = async (res) => {
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

const api = {
  getProducts: () =>
    fetch(`${BASE_URL}/products`).then(handleResponse),

  getProduct: (id) =>
    fetch(`${BASE_URL}/products/${id}`).then(handleResponse),

  searchProducts: (params) =>
    fetch(`${BASE_URL}/products/search?${params}`).then(handleResponse),

  searchByName: (name) =>
    fetch(`${BASE_URL}/products/search?name=${encodeURIComponent(name)}`).then(handleResponse),

  createProduct: (formData) =>
    fetch(`${BASE_URL}/products`, { method: 'POST', body: formData }).then(handleResponse),

  updateProduct: (id, formData) =>
    fetch(`${BASE_URL}/products/${id}`, { method: 'PUT', body: formData }).then(handleResponse),

  deleteProduct: (id) =>
    fetch(`${BASE_URL}/products/${id}`, { method: 'DELETE' }).then(handleResponse),

  adminLogin: (credentials) =>
    fetch(`${BASE_URL}/admin/login`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(credentials),
    }).then(handleResponse),

  getIngredients: () =>
    fetch(`${BASE_URL}/ingredients`).then(handleResponse),

  getAdminLogs: () =>
    fetch(`${BASE_URL}/admin/log`).then(handleResponse),
};


// ==========================================
// TOAST NOTIFICATIONS
// ==========================================

(function initToasts() {
  const container = document.createElement('div');
  container.id = 'toast-container';
  container.style.cssText =
    'position:fixed;top:20px;right:20px;display:flex;flex-direction:column;gap:10px;z-index:9999;pointer-events:none';
  document.body.appendChild(container);

  const icons = { success: '✓', error: '✕', warning: '!', info: 'i' };

  window.showToast = function (type = 'info', message, duration = 3500) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div class="toast-icon">${icons[type]}</div>
      <span class="toast-message">${message}</span>
      <button class="toast-close" onclick="removeToast(this.parentElement)">×</button>
    `;
    container.appendChild(toast);
    requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('show')));
    setTimeout(() => removeToast(toast), duration);
  };

  window.removeToast = function (toast) {
    if (!toast?.parentElement) return;
    toast.classList.add('hide');
    setTimeout(() => toast.remove(), 280);
  };
})();


// ==========================================
// CONFIRM MODAL
// ==========================================

function showConfirm(title, message, onConfirm) {
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position:fixed;inset:0;background:rgba(0,0,0,0.4);
    display:flex;align-items:center;justify-content:center;z-index:10000;
  `;
  overlay.innerHTML = `
    <div style="
      background:#fff;border-radius:14px;padding:28px 32px;
      min-width:300px;max-width:400px;width:90%;
      box-shadow:0 8px 32px rgba(0,0,0,0.18);font-family:sans-serif;
    ">
      <p style="font-size:17px;font-weight:600;margin:0 0 8px;color:#111;">${title}</p>
      <p style="font-size:14px;color:#666;margin:0 0 24px;">${message}</p>
      <div style="display:flex;gap:10px;justify-content:flex-end;">
        <button id="confirm-cancel" style="
          padding:9px 20px;border-radius:8px;border:1px solid #ddd;
          background:#fff;color:#444;font-size:14px;cursor:pointer;
        ">Cancel</button>
        <button id="confirm-ok" style="
          padding:9px 20px;border-radius:8px;border:none;
          background:#ff4d4d;color:#fff;font-size:14px;
          font-weight:500;cursor:pointer;
        ">Delete</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  overlay.querySelector('#confirm-cancel').onclick = () => overlay.remove();
  overlay.querySelector('#confirm-ok').onclick     = () => { overlay.remove(); onConfirm(); };
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
}


// ==========================================
// DATE VALIDATION
// ==========================================

function validateDates() {
  const mfgInput = document.getElementById('mfgDate');
  const expInput = document.getElementById('expDate');
  if (!mfgInput || !expInput) return true;
  const mfgDate = new Date(mfgInput.value);
  const expDate = new Date(expInput.value);
  if (mfgInput.value && expInput.value && mfgDate >= expDate) return false;
  return true;
}

function showDateError(message) {
  document.querySelector('.date-error-message')?.remove();
  const errorDiv = document.createElement('div');
  errorDiv.className = 'date-error-message';
  errorDiv.style.cssText = 'color:red;font-size:14px;margin-top:5px;font-weight:bold;';
  errorDiv.textContent = message;
  document.getElementById('expDate')?.parentElement?.appendChild(errorDiv);
}

function clearDateError() {
  document.querySelector('.date-error-message')?.remove();
}

function initDateValidation() {
  const mfgInput = document.getElementById('mfgDate');
  const expInput = document.getElementById('expDate');
  if (!mfgInput || !expInput) return;

  const checkDates = () => {
    if (!mfgInput.value || !expInput.value) { clearDateError(); return; }
    const mfgDate = new Date(mfgInput.value);
    const expDate = new Date(expInput.value);
    if (mfgDate >= expDate) {
      showDateError('Manufacturing date must be before expiration date');
      mfgInput.style.borderColor = 'red';
      expInput.style.borderColor = 'red';
    } else {
      clearDateError();
      mfgInput.style.borderColor = '';
      expInput.style.borderColor = '';
    }
  };

  mfgInput.addEventListener('change', checkDates);
  expInput.addEventListener('change', checkDates);
}


// ==========================================
// UI — PRODUCT GRID
// ==========================================

function renderProductGrid(grid, products) {
  if (!products?.length) {
    grid.innerHTML = "<p style='grid-column:span 5;text-align:center'>No products found.</p>";
    return;
  }

  grid.innerHTML = products.map((p) => `
    <div class="product-card">
      <a href="/detail/${p.ProductID}" style="text-decoration:none;color:inherit;width:100%;display:block">
        <div class="image-box">
          <img src="${getImageUrl(p.Images, p.ProductName)}" alt="${p.ProductName}" style="width:100%">
        </div>
        <h3 class="product-title">${p.ProductName}</h3>
        <p class="product-price">${p.Price} Baht</p>
      </a>
    </div>
  `).join('');
}

async function initProductGrid() {
  const grid = document.getElementById('product-grid');
  if (!grid) return;

  grid.innerHTML = "<p style='grid-column:span 5;text-align:center;font-size:1.5rem'>Loading products...</p>";

  const urlParams  = new URLSearchParams(window.location.search);
  const name       = urlParams.get('name');
  const minPrice   = urlParams.get('minPrice');
  const maxPrice   = urlParams.get('maxPrice');
  const brand      = urlParams.get('brand');
  const ingredient = urlParams.get('ingredient');

  try {
    let res;

    if (name) {
      res = await api.searchByName(name);
    } else if (minPrice || maxPrice || brand || ingredient) {
      res = await api.searchProducts(urlParams.toString());
    } else {
      res = await api.getProducts();
    }

    if (!res.data?.length) {
      grid.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:60px;color:#777;font-size:18px">
          No products found.
        </div>`;
      return;
    }

    renderProductGrid(grid, res.data);
  } catch {
    grid.innerHTML = "<p style='grid-column:span 5;text-align:center;color:red'>Error loading products.</p>";
  }
}


// ==========================================
// UI — PRODUCT DETAIL
// ==========================================

function renderProductDetail(container, p) {
  const list = p.Ingredients?.length
    ? (Array.isArray(p.Ingredients)
        ? p.Ingredients
        : p.Ingredients.split(',').map(s => s.trim()))
    : [];

  const ingredientsHTML = list.length ? `
    <div class="description-box" style="margin-top:20px;">
      <h3>Ingredients</h3>
      <ul class="desc-content" style="padding-left:18px;margin:0;">
        ${list.map(ing => `<li>${ing}</li>`).join('')}
      </ul>
    </div>
  ` : '';

  container.innerHTML = `
    <div class="product-detail-container">

      <div class="product-gallery">
        <div class="main-image">
          <img src="${getImageUrl(p.Images, p.ProductName, '750x750')}"
               alt="${p.ProductName}">
        </div>
      </div>

      <div class="product-info">
        <h1>${p.ProductName}</h1>
        <p class="brand-name">Brand: ${p.Brand}</p>
        <p class="price">${p.Price} Baht</p>

        <p class="quantity-label">Quantity</p>
        <div class="qty-controls">
          <button class="qty-btn" id="minus">−</button>
          <input  class="qty-input" id="qty" type="number" value="1" min="1">
          <button class="qty-btn" id="plus">+</button>
        </div>

        <button class="add-to-cart">Add to Cart</button>

        <div class="description-box">
          <h3>Description</h3>
          <p class="desc-content">${p.Description ?? ''}</p>
          <p class="desc-content" style="margin-top:10px;">
            <b>MFG:</b> ${formatDate(p.MFGDate)} &nbsp;·&nbsp;
            <b>EXP:</b> ${formatDate(p.EXPDate)}
          </p>
        </div>

        ${ingredientsHTML}
      </div>

    </div>
  `;

  const qty = container.querySelector('#qty');
  container.querySelector('#plus').onclick  = () => { qty.value++; };
  container.querySelector('#minus').onclick = () => { if (qty.value > 1) qty.value--; };
}

async function initProductDetail() {
  const container = document.getElementById('detail-container');
  if (!container) return;

  container.innerHTML = '<p>Loading product...</p>';

  try {
    const id = getIdFromURL();
    if (!id) { container.innerHTML = '<h2>No Product ID</h2>'; return; }

    const res = await api.getProduct(id);
    if (!res.data) { container.innerHTML = '<h2>Product not found</h2>'; return; }

    renderProductDetail(container, res.data);
  } catch (err) {
    container.innerHTML = err.message === 'HTTP 404'
      ? '<h2>Product not found</h2>'
      : "<h2 style='color:red'>Error loading product</h2>";
  }
}


// ==========================================
// ADMIN — PRODUCT TABLE
// ==========================================

/**
 * Creates a single admin table row matching the updated 5-column CSS grid.
 * The delete button sits in its own grid column — no absolute positioning needed.
 */
function renderAdminRow(p) {
  const row = document.createElement('div');
  row.className = 'table-row';
  row.style.cursor = 'pointer';

  // Wrap the brand in a .brand-text span so the CSS pill style applies.
  // The delete button has no inline styles — all appearance comes from CSS.
  row.innerHTML = `
    <span>${p.ProductID}</span>
    <span class="p-name">${p.ProductName}</span>
    <span>฿${Number(p.Price).toLocaleString()}</span>
    <span><span class="brand-text">${p.Brand}</span></span>
    <button class="delete-item-btn delete-col" style="display:none">−</button>
  `;

  // Clicking the row navigates to the edit page.
  row.addEventListener('click', () => {
    window.location.href = `/edit-product/${p.ProductID}`;
  });

  // Clicking the delete button shows a confirm dialog (does not navigate).
  row.querySelector('.delete-item-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    showConfirm(
      `Delete "${p.ProductName}"?`,
      'This action cannot be undone.',
      () => handleDelete(p.ProductID)
    );
  });

  return row;
}

async function initAdminTable() {
  const table = document.getElementById('productTable');
  if (!table) return;

  try {
    const res = await api.getProducts();
    table.innerHTML = '';
    res.data.forEach((p) => table.appendChild(renderAdminRow(p)));
  } catch {
    table.innerHTML = "<p style='color:red'>Error loading products</p>";
  }
}

async function handleDelete(id) {
  try {
    const res = await api.deleteProduct(id);
    if (!res.error) {
      showToast('success', 'Product deleted successfully!');
      initAdminTable();
    }
  } catch (err) {
    showToast('error', 'Failed to delete product.');
    console.error(err);
  }
}

/**
 * Toggles the delete buttons in the admin table.
 * Uses "flex" (not "inline-block") to match the CSS grid cell centering.
 */
function initToggleDelete() {
  const btn = document.getElementById('toggleDeleteBtn');
  if (!btn) return;

  let deleteMode = false;

  btn.addEventListener('click', () => {
    deleteMode = !deleteMode;

    document.querySelectorAll('.delete-col').forEach((el) => {
      el.style.display = deleteMode ? 'flex' : 'none';
    });

    // Visual feedback — highlight the button when delete mode is active.
    btn.style.background    = deleteMode ? '#fcebeb' : '';
    btn.style.borderColor   = deleteMode ? '#f09595' : '';
    btn.style.color         = deleteMode ? '#a32d2d' : '';
  });
}


// ==========================================
// ADMIN — LOG TABLE
// ==========================================

/**
 * Formats a login timestamp for display in the log table.
 * @param {string} dateStr - ISO date string or MySQL datetime string.
 * @returns {string} Formatted date and time string.
 */
function formatLogTimestamp(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;   // Fallback: show raw string
  const day   = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year  = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const mins  = String(d.getMinutes()).padStart(2, '0');
  const secs  = String(d.getSeconds()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${mins}:${secs}`;
}

/**
 * Creates a single log table row matching the 4-column CSS grid.
 */
function renderLogRow(log) {
  const row = document.createElement('div');
  row.className = 'table-row log-row';

  // Determine action text based on role — successful logins have a role, failed ones don't.
  const action = log.myRole ? 'Login Success' : 'Login Failed';
  const actionClass = log.myRole ? 'log-success' : 'log-failed';

  row.innerHTML = `
    <span class="log-id">${log.LoginID}</span>
    <span class="log-action ${actionClass}">${action}</span>
    <span class="log-username">${log.Username}</span>
    <span class="log-password">${log.myPassword || '-'}</span>
    <span class="log-timestamp">${formatLogTimestamp(log.LoginLog)}</span>
  `;

  return row;
}

/**
 * Fetches admin login logs from the API and renders them into the log table.
 */
async function initLogTable() {
  const table = document.getElementById('logTable');
  if (!table) return;

  try {
    const res = await api.getAdminLogs();
    table.innerHTML = '';

    if (!res.data || res.data.length === 0) {
      table.innerHTML = `
        <div class="table-empty">
          <p>No log entries found.</p>
        </div>`;
      return;
    }

    res.data.forEach((log) => table.appendChild(renderLogRow(log)));
  } catch (err) {
    console.error('Error loading admin logs:', err);
    table.innerHTML = "<p style='color:red;padding:20px;text-align:center'>Error loading logs</p>";
  }
}


// ==========================================
// ADMIN — EDIT PRODUCT
// ==========================================

function populateEditForm(p) {
  document.getElementById('productId').value   = p.ProductID;
  document.getElementById('productName').value = p.ProductName;
  document.getElementById('price').value       = p.Price;
  document.getElementById('brand').value       = p.Brand;
  document.getElementById('mfgDate').value     = p.MFGDate?.split('T')[0] ?? '';
  document.getElementById('expDate').value     = p.EXPDate?.split('T')[0] ?? '';
  document.getElementById('ingredients').value = p.Ingredients?.join(', ') ?? '';

  if (p.Images?.[0]?.ImageURL) {
    const img = document.getElementById('previewImage');
    img.src           = p.Images[0].ImageURL;
    img.style.display = 'block';
  }
}

function buildFormData(includeAdmin = true) {
  const formData = new FormData();
  formData.append('ProductName', document.getElementById('productName').value);
  formData.append('Price',       document.getElementById('price').value);
  formData.append('Brand',       document.getElementById('brand').value);
  formData.append('MFGDate',     document.getElementById('mfgDate').value);
  formData.append('EXPDate',     document.getElementById('expDate').value);
  formData.append('Ingredients', document.getElementById('ingredients').value);

  if (includeAdmin) {
    const adminID = localStorage.getItem('adminID');
    if (adminID) formData.append('AdminID', adminID);
  }

  const file = document.getElementById('imageInput')?.files[0];
  if (file) formData.append('image', file);

  return formData;
}

async function initEditProduct() {
  const form = document.getElementById('editForm');
  if (!form) return;

  const id = getProductIdFromURL();
  if (!id) { console.log('No product ID in URL'); return; }

  try {
    const res = await api.getProduct(id);
    populateEditForm(res.data);
  } catch (err) {
    console.error(err);
  }

  initDateValidation();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!validateDates()) {
      showToast('warning', 'Manufacturing date must be before expiration date.');
      return;
    }

    try {
      const res = await api.updateProduct(id, buildFormData());
      if (!res.error) {
        showToast('success', 'Product updated successfully!');
        setTimeout(() => { window.location.href = '/product-management'; }, 1500);
      }
    } catch (err) {
      showToast('error', 'Failed to update product.');
      console.error(err);
    }
  });
}


// ==========================================
// ADMIN — ADD PRODUCT
// ==========================================

async function initAddProduct() {
  const form = document.getElementById('addForm');
  if (!form) return;

  initDateValidation();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!validateDates()) {
      showToast('warning', 'Manufacturing date must be before expiration date.');
      return;
    }

    try {
      const res = await api.createProduct(buildFormData());
      if (!res.error) {
        showToast('success', 'Product added successfully!');
        setTimeout(() => { window.location.href = '/product-management'; }, 1500);
      }
    } catch (err) {
      showToast('error', 'Failed to add product.');
      console.error(err);
    }
  });
}


// ==========================================
// ADMIN — LOGIN
// ==========================================

async function initAdminLogin() {
  const form = document.getElementById('admin-login-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('admin-username').value.trim();
    const password = document.getElementById('admin-password').value.trim();

    try {
      const data = await api.adminLogin({ Username: username, myPassword: password });
      localStorage.setItem('adminID', data.AdminID);
      showToast('success', 'Login successful! Redirecting...');
      setTimeout(() => { window.location.href = '/product-management'; }, 1500);
    } catch {
      showToast('error', 'Login failed. Please check your credentials.');
    }
  });
}


// ==========================================
// SEARCH — INGREDIENTS
// ==========================================

async function loadIngredients() {
  const checkboxGroup = document.querySelector('.checkbox-group');
  if (!checkboxGroup) return;

  try {
    const res = await api.getIngredients();

    if (res.data?.length) {
      checkboxGroup.innerHTML = '';
      res.data.forEach((ingredient) => {
        const label = document.createElement('label');
        label.innerHTML = `<input type="radio" name="ing"> ${ingredient}`;
        checkboxGroup.appendChild(label);
      });

      initSearchValidation();
    }
  } catch (err) {
    console.error('Error loading ingredients:', err);
  }
}


// ==========================================
// SEARCH — FILTER OVERLAY
// ==========================================

function initSearchOverlay() {
  const container = document.querySelector('.search-container');
  const overlay   = document.getElementById('search-overlay');
  const panel     = document.querySelector('.search-panel');
  const searchBtn = document.getElementById('search-btn');
  if (!container || !overlay) return;

  container.addEventListener('click', (e) => {
    overlay.classList.remove('hidden');
    e.stopPropagation();
  });

  document.addEventListener('click', (e) => {
    if (!overlay.contains(e.target) && !container.contains(e.target)) {
      overlay.classList.add('hidden');
    }
  });

  panel?.addEventListener('click', (e) => e.stopPropagation());
  searchBtn?.addEventListener('click', runSearch);
}

function initExpandableSearch() {
  const box   = document.getElementById('expandable-search-box');
  const input = document.getElementById('nav-search-input');
  if (!box || !input) return;

  input.addEventListener('focus', () => box.classList.add('active'));
  document.addEventListener('click', (e) => {
    if (!box.contains(e.target)) box.classList.remove('active');
  });
}

function isSearchValid() {
  // If a "no criteria" search is allowed to return all results, 
  // the search is always valid.
  return true; 
}

function initSearchValidation() {
  const searchBtn = document.getElementById('search-btn');
  if (!searchBtn) return;

  // Keep the button always active so we can trigger the "Please fill all" error
  searchBtn.disabled = false;
  searchBtn.style.opacity = '1';
  searchBtn.style.cursor = 'pointer';
}

function clearSearchInputs() {
  const minPrice = document.getElementById('min-price');
  const maxPrice = document.getElementById('max-price');
  const brandInput = document.getElementById('brand-input');
  
  if (minPrice) minPrice.value = '';
  if (maxPrice) maxPrice.value = '';
  if (brandInput) brandInput.value = '';
  
  // Uncheck all ingredient radio buttons
  document.querySelectorAll("input[name='ing']").forEach((radio) => {
    radio.checked = false;
  });
}

async function runSearch() {
  const minPrice    = document.getElementById('min-price')?.value.trim();
  const maxPrice    = document.getElementById('max-price')?.value.trim();
  const brand       = document.getElementById('brand-input')?.value.trim();
  const selectedIngInput = [...document.querySelectorAll("input[name='ing']")].find(r => r.checked);
  const selectedIng = selectedIngInput ? selectedIngInput.parentElement.innerText.trim() : '';

  const criteria = [minPrice, maxPrice, brand, selectedIng];
  const filledFields = criteria.filter(Boolean).length;
  const totalFields  = criteria.length; // 4

  if (filledFields === 0) {
    window.location.href = '/product';
    return;
  }

  if (filledFields > 0 && filledFields < totalFields) {
    showToast('warning', `Please fill all ${totalFields} criteria, or leave all blank to show all products.`);
    return;
  }

  const params = new URLSearchParams();
  params.append('minPrice',   minPrice);
  params.append('maxPrice',   maxPrice);
  params.append('brand',      brand);
  params.append('ingredient', selectedIng);

  window.location.href = `/product?${params.toString()}`;
}


// ==========================================
// SEARCH — NAME SEARCH (header bar)
// ==========================================

function initNameSearch() {
  const searchInput = document.querySelector('.search-input');
  const searchIcon  = document.querySelector('.icon-search');
  if (!searchInput) return;

  const runNameSearch = async () => {
    const name = searchInput.value.trim();
    if (!name) return;

    const grid = document.getElementById('product-grid');

    if (!grid) {
      window.location.href = `/product?name=${encodeURIComponent(name)}`;
      searchInput.value = '';
      return;
    }

    grid.innerHTML = "<p style='grid-column:span 5;text-align:center;font-size:1.5rem'>Searching...</p>";

    try {
      const res = await api.searchByName(name);

      if (!res.data?.length) {
        grid.innerHTML = `
          <div style="grid-column:1/-1;text-align:center;padding:60px;color:#777;font-size:18px">
            No products found for "${name}"
          </div>`;
        return;
      }

      renderProductGrid(grid, res.data);
      document.getElementById('search-overlay')?.classList.add('hidden');
    } catch (err) {
      showToast('error', 'Search failed. Please try again.');
      console.error(err);
      grid.innerHTML = "<p style='grid-column:span 5;text-align:center;color:red'>Error searching products.</p>";
    }
  };

  if (searchIcon) {
    searchIcon.style.cursor = 'pointer';
    searchIcon.addEventListener('click', runNameSearch);
  }

  searchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') runNameSearch(); });
}


// ==========================================
// MAP
// ==========================================

let mapInstance = null;

function showStoreLocation(lat, lon) {
  if (!mapInstance) {
    mapInstance = new longdo.Map({ placeholder: document.getElementById('map') });
  }

  mapInstance.location({ lat, lon }, true);
  mapInstance.Overlays.clear();
  mapInstance.Overlays.add(
    new longdo.Marker({ lat, lon }, { title: 'GoonShop Store', detail: 'Our store location' })
  );
}


// ==========================================
// INIT
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  initProductGrid();
  initProductDetail();
  initNameSearch();

  initExpandableSearch();
  initSearchOverlay();
  initSearchValidation();
  loadIngredients();

  initAdminLogin();
  initAdminTable();
  initToggleDelete();
  initEditProduct();
  initAddProduct();
  initLogTable();
});