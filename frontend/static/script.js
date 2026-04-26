// app.js

// ==========================================
// CONFIG
// ==========================================
const BASE_URL = 'http://localhost:3030';


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
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    }).then(handleResponse),
};


// ==========================================
// HELPERS
// ==========================================
const formatDate = (date) => (date ? new Date(date).toLocaleDateString() : '-');

const getImageUrl = (images, name, size = '200x200') =>
  images?.[0]?.ImageURL ??
  `https://placehold.co/${size}/FFFFFF/DDDDDD?text=${encodeURIComponent(name)}`;

const getIdFromURL = () => {
  const parts = window.location.pathname.split('/').filter(Boolean);
  return parts[parts.length - 1] || null;
};


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

  try {
    const res = await api.getProducts();
    renderProductGrid(grid, res.data);
  } catch {
    grid.innerHTML = "<p style='grid-column:span 5;text-align:center;color:red'>Error loading products.</p>";
  }
}


// ==========================================
// UI — PRODUCT DETAIL
// ==========================================
function renderProductDetail(container, p) {
  container.innerHTML = `
    <div style="display:flex;gap:40px;padding:40px">
      <div>
        <img src="${getImageUrl(p.Images, p.ProductName, '500x500')}"
             alt="${p.ProductName}" style="width:400px;border:1px solid #ccc;border-radius:10px">
      </div>
      <div>
        <h1>${p.ProductName}</h1>
        <p style="font-size:20px;font-weight:bold">${p.Price} Baht</p>
        <p><b>Brand:</b> ${p.Brand}</p>
        <p><b>MFG Date:</b> ${formatDate(p.MFGDate)}</p>
        <p><b>EXP Date:</b> ${formatDate(p.EXPDate)}</p>
        <hr style="margin:20px 0">
        <div>
          <b>Quantity:</b>
          <button id="minus">-</button>
          <input id="qty" type="number" value="1" min="1" style="width:50px;text-align:center">
          <button id="plus">+</button>
        </div>
        <br>
        <button style="padding:10px 20px;background:black;color:white;border:none;cursor:pointer">
          Add to Cart
        </button>
      </div>
    </div>
  `;

  const qty = container.querySelector('#qty');
  container.querySelector('#plus').onclick  = () => { qty.value = Number(qty.value || 1) + 1; };
  container.querySelector('#minus').onclick = () => { if (qty.value > 1) qty.value = Number(qty.value) - 1; };
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
function renderAdminRow(p) {
  const row = document.createElement('div');
  row.className = 'table-row';
  row.style.cssText = 'position:relative;cursor:pointer';

  row.innerHTML = `
    <span>${p.ProductID}</span>
    <span class="p-name">${p.ProductName}</span>
    <span>${Number(p.Price).toLocaleString()}</span>
    <span class="brand-text">${p.Brand}</span>
    <button class="delete-item-btn delete-col" style="display:none;position:absolute;right:20px;top:50%;transform:translateY(-50%);background:#ff4d4d;color:white;border:none;border-radius:50%;width:24px;height:24px;font-weight:bold;cursor:pointer;line-height:24px;padding:0;text-align:center;font-family:monospace">-</button>
  `;

  row.onclick = () => { window.location.href = `/edit-product/${p.ProductID}`; };

  row.querySelector('.delete-item-btn').onclick = (e) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete ${p.ProductName}?`)) {
      handleDelete(p.ProductID);
    }
  };

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
      alert('✅ Product deleted successfully!');
      initAdminTable();
    }
  } catch (err) {
    console.error(err);
  }
}

function initToggleDelete() {
  const btn = document.getElementById('toggleDeleteBtn');
  if (!btn) return;

  btn.addEventListener('click', () => {
    document.querySelectorAll('.delete-col').forEach((el) => {
      el.style.display = el.style.display === 'inline-block' ? 'none' : 'inline-block';
    });
  });
}


// ==========================================
// ADMIN — EDIT PRODUCT
// ==========================================
function populateEditForm(p) {
  document.getElementById('productId').value    = p.ProductID;
  document.getElementById('productName').value  = p.ProductName;
  document.getElementById('price').value        = p.Price;
  document.getElementById('brand').value        = p.Brand;
  document.getElementById('mfgDate').value      = p.MFGDate?.split('T')[0] ?? '';
  document.getElementById('expDate').value      = p.EXPDate?.split('T')[0] ?? '';
  document.getElementById('ingredients').value  = p.Ingredients?.join(', ') ?? '';

  if (p.Images?.[0]?.ImageURL) {
    const img = document.getElementById('previewImage');
    img.src = p.Images[0].ImageURL;
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
  if (includeAdmin) formData.append('AdminID', 'AD789401');

  const file = document.getElementById('imageInput')?.files[0];
  if (file) formData.append('image', file);

  return formData;
}

async function initEditProduct() {
  const form = document.getElementById('editForm');
  if (!form) return;

  const id = getIdFromURL();
  if (!id) { console.log('No product ID in URL'); return; }

  try {
    const res = await api.getProduct(id);
    populateEditForm(res.data);
  } catch (err) {
    console.error(err);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const res = await api.updateProduct(id, buildFormData());
      if (!res.error) {
        alert('✅ Updated successfully!');
        window.location.href = '/product-management';
      }
    } catch (err) {
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

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const res = await api.createProduct(buildFormData());
      if (!res.error) {
        alert('✅ Product added!');
        window.location.href = '/product-management';
      }
    } catch (err) {
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
      alert('Login success!');
      localStorage.setItem('adminID', data.AdminID);
      window.location.href = '/product-management';
    } catch {
      alert('Login failed. Please check your credentials.');
    }
  });
}


// ==========================================
// SEARCH
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
  const minPrice = document.getElementById('min-price')?.value.trim();
  const maxPrice = document.getElementById('max-price')?.value.trim();
  const brand    = document.getElementById('brand-input')?.value.trim();
  const hasIngredient = [...document.querySelectorAll("input[name='ing']")].some((r) => r.checked);

  return minPrice !== '' && maxPrice !== '' && brand !== '' && hasIngredient;
}

function initSearchValidation() {
  const searchBtn  = document.getElementById('search-btn');
  const minPrice   = document.getElementById('min-price');
  const maxPrice   = document.getElementById('max-price');
  const brandInput = document.getElementById('brand-input');
  const ingRadios  = document.querySelectorAll("input[name='ing']");
  if (!searchBtn) return;

  const updateBtn = () => {
    const valid = isSearchValid();
    searchBtn.disabled = !valid;
    searchBtn.style.opacity = valid ? '1' : '0.4';
    searchBtn.style.cursor  = valid ? 'pointer' : 'not-allowed';
  };

  // Run once on init so button starts disabled
  updateBtn();

  minPrice?.addEventListener('input', updateBtn);
  maxPrice?.addEventListener('input', updateBtn);
  brandInput?.addEventListener('input', updateBtn);
  ingRadios.forEach((r) => r.addEventListener('change', updateBtn));
}

async function runSearch() {
  if (!isSearchValid()) return;

  const grid = document.getElementById('product-grid');
  if (!grid) return;

  const params   = new URLSearchParams();
  const minPrice = document.getElementById('min-price').value;
  const maxPrice = document.getElementById('max-price').value;
  const brand    = document.getElementById('brand-input').value.trim();
  const selected = [...document.querySelectorAll("input[name='ing']")]
    .find((r) => r.checked)?.parentElement.innerText.trim();

  params.append('minPrice', minPrice);
  params.append('maxPrice', maxPrice);
  params.append('brand', brand);
  if (selected) params.append('ingredient', selected);

  try {
    const res     = await api.searchProducts(params.toString());
    const overlay = document.getElementById('search-overlay');

    if (!res.data?.length) {
      grid.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:60px;color:#777;font-size:18px">
          ❌ Not Match
        </div>`;
      return;
    }

    renderProductGrid(grid, res.data); 
    overlay?.classList.add('hidden');
  } catch (err) {
    console.error(err);
  }
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
// INIT — entry point
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  initProductGrid();
  initProductDetail();
  initAdminTable();
  initToggleDelete();
  initEditProduct();
  initAddProduct();
  initAdminLogin();
  initExpandableSearch();
  initSearchOverlay();
  initSearchValidation();
});