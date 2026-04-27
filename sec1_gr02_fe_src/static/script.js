// ==========================================
// CONFIG
// ==========================================

const BASE_URL = 'http://localhost:3030'; // backend base URL


// ==========================================
// HELPERS
// ==========================================

// Format date to DD/MM/YY
const formatDate = (date) => {
  if (!date) return '-';
  const d     = new Date(date);
  const day   = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year  = String(d.getFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
};

// Get image or placeholder
const getImageUrl = (images, name, size = '200x200') =>
  images?.[0]?.ImageURL ??
  `https://placehold.co/${size}/FFFFFF/DDDDDD?text=${encodeURIComponent(name)}`;

// Get last URL path segment
const getIdFromURL = () => {
  const parts = window.location.pathname.split('/').filter(Boolean);
  return parts[parts.length - 1] || null;
};

// Get ID only on edit page
const getProductIdFromURL = () =>
  window.location.pathname.includes('edit-product') ? getIdFromURL() : null;


// ==========================================
// API LAYER
// ==========================================

// Throw on non-2xx response
const handleResponse = async (res) => {
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

const api = {
  getProducts:    ()         => fetch(`${BASE_URL}/products`).then(handleResponse),                                                         // fetch all products
  getProduct:     (id)       => fetch(`${BASE_URL}/products/${id}`).then(handleResponse),                                                   // fetch single product
  searchProducts: (params)   => fetch(`${BASE_URL}/products/search?${params}`).then(handleResponse),                                        // search with filters
  searchByName:   (name)     => fetch(`${BASE_URL}/products/search?name=${encodeURIComponent(name)}`).then(handleResponse),                 // search by name
  createProduct:  (formData) => fetch(`${BASE_URL}/products`, { method: 'POST', body: formData }).then(handleResponse),                     // add new product
  updateProduct:  (id, formData) => fetch(`${BASE_URL}/products/${id}`, { method: 'PUT', body: formData }).then(handleResponse),            // update existing product
  deleteProduct:  (id)       => fetch(`${BASE_URL}/products/${id}`, { method: 'DELETE' }).then(handleResponse),                             // remove product
  adminLogin:     (credentials) => fetch(`${BASE_URL}/admin/login`, {                                                                       // authenticate admin
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(credentials),
  }).then(handleResponse),
  getIngredients: () => fetch(`${BASE_URL}/ingredients`).then(handleResponse),                                                              // fetch ingredient list
  getAdminLogs:   () => fetch(`${BASE_URL}/admin/log`).then(handleResponse),                                                                // fetch login logs
};


// ==========================================
// TOAST NOTIFICATIONS
// ==========================================

(function initToasts() {
  // Create fixed toast container
  const container = document.createElement('div');
  container.id = 'toast-container';
  container.style.cssText =
    'position:fixed;top:20px;right:20px;display:flex;flex-direction:column;gap:10px;z-index:9999;pointer-events:none';
  document.body.appendChild(container);

  const icons = { success: '✓', error: '✕', warning: '!', info: 'i' };

  // Show toast then auto-remove
  window.showToast = (type = 'info', message, duration = 3500) => {
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

  // Fade out then remove toast
  window.removeToast = (toast) => {
    if (!toast?.parentElement) return;
    toast.classList.add('hide');
    setTimeout(() => toast.remove(), 280);
  };
})();


// ==========================================
// CONFIRM MODAL
// ==========================================

// Show delete confirm dialog
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
  overlay.querySelector('#confirm-cancel').onclick = () => overlay.remove();           // cancel removes modal
  overlay.querySelector('#confirm-ok').onclick     = () => { overlay.remove(); onConfirm(); }; // confirm runs callback
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };            // click outside closes
}


// ==========================================
// DATE VALIDATION
// ==========================================

// Returns false if MFG >= EXP
function validateDates() {
  const mfgInput = document.getElementById('mfgDate');
  const expInput = document.getElementById('expDate');
  if (!mfgInput || !expInput) return true; // skip if fields missing
  return !(mfgInput.value && expInput.value && new Date(mfgInput.value) >= new Date(expInput.value));
}

// Show red error below EXP field
function showDateError(message) {
  document.querySelector('.date-error-message')?.remove();
  const errorDiv = document.createElement('div');
  errorDiv.className = 'date-error-message';
  errorDiv.style.cssText = 'color:red;font-size:14px;margin-top:5px;font-weight:bold;';
  errorDiv.textContent = message;
  document.getElementById('expDate')?.parentElement?.appendChild(errorDiv);
}

// Remove date error message
function clearDateError() {
  document.querySelector('.date-error-message')?.remove();
}

// Validate dates on field change
function initDateValidation() {
  const mfgInput = document.getElementById('mfgDate');
  const expInput = document.getElementById('expDate');
  if (!mfgInput || !expInput) return;

  const checkDates = () => {
    if (!mfgInput.value || !expInput.value) { clearDateError(); return; } // wait for both values

    const isInvalid = new Date(mfgInput.value) >= new Date(expInput.value);
    if (isInvalid) {
      showDateError('Manufacturing date must be before expiration date');
      mfgInput.style.borderColor = 'red'; // highlight invalid fields
      expInput.style.borderColor = 'red';
    } else {
      clearDateError();
      mfgInput.style.borderColor = ''; // reset to default
      expInput.style.borderColor = '';
    }
  };

  mfgInput.addEventListener('change', checkDates); // recheck on change
  expInput.addEventListener('change', checkDates);
}


// ==========================================
// UI — PRODUCT GRID
// ==========================================

// Render product cards into grid
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

// Fetch products based on URL params
async function initProductGrid() {
  const grid = document.getElementById('product-grid');
  if (!grid) return;

  grid.innerHTML = "<p style='grid-column:span 5;text-align:center;font-size:1.5rem'>Loading products...</p>";

  // Read search params from URL
  const urlParams  = new URLSearchParams(window.location.search);
  const name       = urlParams.get('name');
  const minPrice   = urlParams.get('minPrice');
  const maxPrice   = urlParams.get('maxPrice');
  const brand      = urlParams.get('brand');
  const ingredient = urlParams.get('ingredient');

  try {
    let res;
    if (name) {
      res = await api.searchByName(name);                      // name search takes priority
    } else if (minPrice || maxPrice || brand || ingredient) {
      res = await api.searchProducts(urlParams.toString());    // apply advanced searchs
    } else {
      res = await api.getProducts();                           // no searchs, show all
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

// Build detail page HTML
function renderProductDetail(container, p) {
  // Normalise ingredients to array
  const ingredientList = p.Ingredients?.length
    ? (Array.isArray(p.Ingredients)
        ? p.Ingredients
        : p.Ingredients.split(',').map((s) => s.trim()))
    : [];

  const ingredientsHTML = ingredientList.length ? `
    <div class="description-box" style="margin-top:20px;">
      <h3>Ingredients</h3>
      <ul class="desc-content" style="padding-left:18px;margin:0;">
        ${ingredientList.map((ing) => `<li>${ing}</li>`).join('')}
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

  // Wire quantity stepper buttons
  const qty = container.querySelector('#qty');
  container.querySelector('#plus').onclick  = () => { qty.value++; };
  container.querySelector('#minus').onclick = () => { if (qty.value > 1) qty.value--; }; // min 1
}

// Fetch and render product detail
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
    // Show 404 message or generic error
    container.innerHTML = err.message === 'HTTP 404'
      ? '<h2>Product not found</h2>'
      : "<h2 style='color:red'>Error loading product</h2>";
  }
}


// ==========================================
// ADMIN — PRODUCT TABLE
// ==========================================

// Build single admin table row
function renderAdminRow(p) {
  const row = document.createElement('div');
  row.className = 'table-row';
  row.style.cursor = 'pointer';

  row.innerHTML = `
    <span>${p.ProductID}</span>
    <span class="p-name">${p.ProductName}</span>
    <span>฿${Number(p.Price).toLocaleString()}</span>
    <span><span class="brand-text">${p.Brand}</span></span>
    <button class="delete-item-btn delete-col" style="display:none">−</button>
  `;

  // Row click navigates to edit
  row.addEventListener('click', () => {
    window.location.href = `/edit-product/${p.ProductID}`;
  });

  // Delete button shows confirm dialog
  row.querySelector('.delete-item-btn').addEventListener('click', (e) => {
    e.stopPropagation(); // prevent row click
    showConfirm(
      `Delete "${p.ProductName}"?`,
      'This action cannot be undone.',
      () => handleDelete(p.ProductID)
    );
  });

  return row;
}

// Fetch and render all rows
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

// Delete product then refresh table
async function handleDelete(id) {
  try {
    const res = await api.deleteProduct(id);
    if (!res.error) {
      showToast('success', 'Product deleted successfully!');
      resetDeleteMode();  // hide delete buttons
      initAdminTable();   // reload rows
    }
  } catch (err) {
    showToast('error', 'Failed to delete product.');
    console.error(err);
  }
}

// Hide all delete buttons
function resetDeleteMode() {
  document.querySelectorAll('.delete-col').forEach((el) => (el.style.display = 'none'));
  const btn = document.getElementById('toggleDeleteBtn');
  if (!btn) return;
  btn.style.background  = ''; // reset button style
  btn.style.borderColor = '';
  btn.style.color       = '';
}

// Toggle delete button visibility
function initToggleDelete() {
  const btn = document.getElementById('toggleDeleteBtn');
  if (!btn) return;

  let deleteMode = false;

  btn.addEventListener('click', () => {
    deleteMode = !deleteMode;
    document.querySelectorAll('.delete-col').forEach((el) => {
      el.style.display = deleteMode ? 'flex' : 'none'; // show or hide
    });
    btn.style.background  = deleteMode ? '#fcebeb' : ''; // red tint when active
    btn.style.borderColor = deleteMode ? '#f09595' : '';
    btn.style.color       = deleteMode ? '#a32d2d' : '';
  });
}


// ==========================================
// ADMIN — LOG TABLE
// ==========================================

// Format to DD/MM/YYYY HH:MM:SS
function formatLogTimestamp(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr; // return raw if invalid
  const day   = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year  = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const mins  = String(d.getMinutes()).padStart(2, '0');
  const secs  = String(d.getSeconds()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${mins}:${secs}`;
}

// Build single log table row
function renderLogRow(log) {
  const row = document.createElement('div');
  row.className = 'table-row log-row';

  // myRole truthy = success
  const action      = log.myRole ? 'Login Success' : 'Login Failed';
  const actionClass = log.myRole ? 'log-success'   : 'log-failed';

  row.innerHTML = `
    <span class="log-id">${log.LoginID}</span>
    <span class="log-action ${actionClass}">${action}</span>
    <span class="log-username">${log.Username}</span>
    <span class="log-password">${log.myPassword}</span>
    <span class="log-timestamp">${formatLogTimestamp(log.LoginLog)}</span>
  `;

  return row;
}

// Fetch and render log entries
async function initLogTable() {
  const table = document.getElementById('logTable');
  if (!table) return;

  try {
    const res = await api.getAdminLogs();
    table.innerHTML = '';

    if (!res.data?.length) {
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

// Fill form fields from product data
function populateEditForm(p) {
  document.getElementById('productId').value   = p.ProductID;
  document.getElementById('productName').value = p.ProductName;
  document.getElementById('price').value       = p.Price;
  document.getElementById('brand').value       = p.Brand;
  document.getElementById('mfgDate').value     = p.MFGDate?.split('T')[0] ?? ''; // strip time part
  document.getElementById('expDate').value     = p.EXPDate?.split('T')[0] ?? '';
  document.getElementById('ingredients').value = p.Ingredients?.join(', ') ?? '';

  // Show existing image preview
  if (p.Images?.[0]?.ImageURL) {
    const img = document.getElementById('previewImage');
    img.src           = p.Images[0].ImageURL;
    img.style.display = 'block';
  }
}

// Collect form fields into FormData
function buildFormData() {
  const formData = new FormData();
  formData.append('ProductName', document.getElementById('productName').value);
  formData.append('Price',       document.getElementById('price').value);
  formData.append('Brand',       document.getElementById('brand').value);
  formData.append('MFGDate',     document.getElementById('mfgDate').value);
  formData.append('EXPDate',     document.getElementById('expDate').value);
  formData.append('Ingredients', document.getElementById('ingredients').value);

  const adminID = localStorage.getItem('adminID'); // attach stored admin ID
  if (adminID) formData.append('AdminID', adminID);

  const file = document.getElementById('imageInput')?.files[0];
  if (file) formData.append('image', file); // attach image if chosen

  return formData;
}

// Load product then handle update submit
async function initEditProduct() {
  const form = document.getElementById('editForm');
  if (!form) return;

  const id = getProductIdFromURL();
  if (!id) { console.log('No product ID in URL'); return; }

  try {
    const res = await api.getProduct(id);
    populateEditForm(res.data); // pre-fill form
  } catch (err) {
    console.error(err);
  }

  initDateValidation();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!validateDates()) {
      showToast('warning', 'Manufacturing date must be before expiration date.');
      return; // block invalid submit
    }

    try {
      const res = await api.updateProduct(id, buildFormData());
      if (!res.error) {
        showToast('success', 'Product updated successfully!');
        setTimeout(() => { window.location.href = '/product-management'; }, 1500); // redirect after toast
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

// Validate then POST new product
async function initAddProduct() {
  const form = document.getElementById('addForm');
  if (!form) return;

  initDateValidation();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!validateDates()) {
      showToast('warning', 'Manufacturing date must be before expiration date.');
      return; // block invalid submit
    }

    try {
      const res = await api.createProduct(buildFormData());
      if (!res.error) {
        showToast('success', 'Product added successfully!');
        setTimeout(() => { window.location.href = '/product-management'; }, 1500); // redirect after toast
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

// Submit credentials, store AdminID
async function initAdminLogin() {
  const form = document.getElementById('admin-login-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('admin-username').value.trim();
    const password = document.getElementById('admin-password').value.trim();

    try {
      const data = await api.adminLogin({ Username: username, myPassword: password });
      localStorage.setItem('adminID', data.AdminID); // persist for product forms
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

// Fetch and render ingredient radios
async function loadIngredients() {
  const checkboxGroup = document.querySelector('.checkbox-group');
  if (!checkboxGroup) return;

  try {
    const res = await api.getIngredients();

    if (res.data?.length) {
      checkboxGroup.innerHTML = ''; // clear placeholder
      res.data.forEach((ingredient) => {
        const label = document.createElement('label');
        label.innerHTML = `<input type="radio" name="ing"> ${ingredient}`;
        checkboxGroup.appendChild(label);
      });

      initSearchValidation(); // re-enable search button
    }
  } catch (err) {
    console.error('Error loading ingredients:', err);
  }
}


// ==========================================
// SEARCH — OVERLAY
// ==========================================

// Toggle overlay on search container click
function initSearchOverlay() {
  const container = document.querySelector('.search-container');
  const overlay   = document.getElementById('search-overlay');
  const panel     = document.querySelector('.search-panel');
  const searchBtn = document.getElementById('search-btn');
  if (!container || !overlay) return;

  container.addEventListener('click', (e) => {
    overlay.classList.remove('hidden'); // open overlay
    e.stopPropagation();
  });

  // Click outside closes overlay
  document.addEventListener('click', (e) => {
    if (!overlay.contains(e.target) && !container.contains(e.target)) {
      overlay.classList.add('hidden');
    }
  });

  panel?.addEventListener('click', (e) => e.stopPropagation()); // prevent panel close
  searchBtn?.addEventListener('click', runSearch);
}

// Expand search box on focus
function initExpandableSearch() {
  const box   = document.getElementById('expandable-search-box');
  const input = document.getElementById('nav-search-input');
  if (!box || !input) return;

  input.addEventListener('focus', () => box.classList.add('active'));
  document.addEventListener('click', (e) => {
    if (!box.contains(e.target)) box.classList.remove('active'); // collapse on outside click
  });
}

// Enable search button
function initSearchValidation() {
  const searchBtn = document.getElementById('search-btn');
  if (!searchBtn) return;
  searchBtn.disabled = false;
  searchBtn.style.opacity = '1';
  searchBtn.style.cursor = 'pointer';
}

// Clear all search search inputs
function clearSearchInputs() {
  const fields = ['min-price', 'max-price', 'brand-input'];
  fields.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.querySelectorAll("input[name='ing']").forEach((radio) => {
    radio.checked = false; // uncheck all radios
  });
}

// Build query string and redirect
async function runSearch() {
  const minPrice    = document.getElementById('min-price')?.value.trim();
  const maxPrice    = document.getElementById('max-price')?.value.trim();
  const brand       = document.getElementById('brand-input')?.value.trim();
  const selectedIng = [...document.querySelectorAll("input[name='ing']")]
    .find((r) => r.checked)
    ?.parentElement.innerText.trim() ?? '';

  const criteria    = [minPrice, maxPrice, brand, selectedIng];
  const filledCount = criteria.filter(Boolean).length;

  if (filledCount === 0) {
    window.location.href = '/product'; // no searchs, show all
    return;
  }

  // Require all or none
  if (filledCount < criteria.length) {
    showToast('warning', `Please fill all ${criteria.length - 1} criteria, or leave all blank to show all products.`);
    return;
  }

  const params = new URLSearchParams({ minPrice, maxPrice, brand, ingredient: selectedIng });
  window.location.href = `/product?${params.toString()}`;
}


// ==========================================
// SEARCH — NAME SEARCH (header bar)
// ==========================================

// Search by name or redirect to /product
function initNameSearch() {
  const searchInput = document.querySelector('.search-input');
  const searchIcon  = document.querySelector('.icon-search');
  if (!searchInput) return;

  const runNameSearch = async () => {
    const name = searchInput.value.trim();
    if (!name) return; // ignore empty input

    const grid = document.getElementById('product-grid');

    if (!grid) {
      // Not on product page — redirect instead
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

      renderProductGrid(grid, res.data); // update grid in-place
      document.getElementById('search-overlay')?.classList.add('hidden'); // close overlay
    } catch (err) {
      showToast('error', 'Search failed. Please try again.');
      console.error(err);
      grid.innerHTML = "<p style='grid-column:span 5;text-align:center;color:red'>Error searching products.</p>";
    }
  };

  searchIcon?.addEventListener('click', runNameSearch);
  searchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') runNameSearch(); }); // Enter triggers search
}


// ==========================================
// MAP
// ==========================================

let mapInstance = null;

// Show marker at given coordinates
function showStoreLocation(lat, lon) {
  if (!mapInstance) {
    mapInstance = new longdo.Map({ placeholder: document.getElementById('map') }); // init once
  }

  mapInstance.location({ lat, lon }, true);
  mapInstance.Overlays.clear(); // remove old markers
  mapInstance.Overlays.add(
    new longdo.Marker({ lat, lon }, { title: 'GoonShop Store', detail: 'Our store location' })
  );
}


// ==========================================
// INIT
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  // — Storefront —
  initProductGrid();    // render product catalogue
  initProductDetail();  // render single product page
  initNameSearch();     // wire header search bar

  // — Search overlay —
  initExpandableSearch(); // expand nav search box
  initSearchOverlay();    // open/close search panel
  initSearchValidation(); // enable search button
  loadIngredients();      // populate ingredient radios

  // — Admin —
  initAdminLogin();    // handle login form
  initAdminTable();    // render product rows
  initToggleDelete();  // toggle delete buttons
  initEditProduct();   // load and update product
  initAddProduct();    // handle add product form
  initLogTable();      // render login logs
});