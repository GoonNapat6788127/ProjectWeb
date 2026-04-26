// ==========================================
// STARTUP LOGIC (Runs when page loads)
// ==========================================
document.addEventListener("DOMContentLoaded", () => {

    // 1. Product Grid Page (Home)
    const productGrid = document.getElementById("product-grid");
    if (productGrid) {
        fetchAllProducts(productGrid);
    }

    // 2. Product Detail Page
    const detailContainer = document.getElementById("detail-container");
    if (detailContainer) {
        fetchProductDetail(detailContainer);
    }

    // 3. Admin Table Page (List of Products)
    const table = document.getElementById("productTable");
    if (table) {
        fetchProducts(); // Builds the table with the delete logic
    }

    // 4. Edit Product Page
    const editForm = document.getElementById("editForm");
    if (editForm) {
        const productId = getProductIdFromURL();
        if (productId) {
            fetchProductForEdit(productId);
            setupUpdate(productId);
        } else {
            console.log("No product ID found in URL for editing.");
        }
    }

    // 5. Toggle Delete Mode (Admin Table)
    const toggleDeleteBtn = document.getElementById("toggleDeleteBtn");
    if (toggleDeleteBtn) {
        toggleDeleteBtn.addEventListener("click", () => {
            const deleteCols = document.querySelectorAll(".delete-col");
            deleteCols.forEach(btn => {
                // Toggle visibility of the minus (-) buttons
                if (btn.style.display === "none" || btn.style.display === "") {
                    btn.style.display = "inline-block";
                } else {
                    btn.style.display = "none";
                }
            });
        });
    }

    // 6. Expandable Search Bar (Header)
    const searchBoxHeader = document.getElementById("expandable-search-box");
    const searchInput = document.getElementById("nav-search-input");
    if (searchBoxHeader && searchInput) {
        searchInput.addEventListener("focus", () => {
            searchBoxHeader.classList.add("active");
        });
        document.addEventListener("click", (event) => {
            if (!searchBoxHeader.contains(event.target)) {
                searchBoxHeader.classList.remove("active");
            }
        });
    }

    // 7. Search Overlay Logic
    const searchBoxContainer = document.querySelector(".search-container");
    const overlay = document.getElementById("search-overlay");
    const panel = document.querySelector(".search-panel");
    const searchBtn = document.getElementById("search-btn");

    if (searchBoxContainer && overlay) {
        searchBoxContainer.addEventListener("click", (e) => {
            overlay.classList.remove("hidden");
            e.stopPropagation();
        });

        document.addEventListener("click", (e) => {
            if (!overlay.contains(e.target) && !searchBoxContainer.contains(e.target)) {
                overlay.classList.add("hidden");
            }
        });

        panel?.addEventListener("click", (e) => e.stopPropagation());
        searchBtn?.addEventListener("click", searchProducts);
    }
});


// ==========================================
// API FUNCTIONS: PRODUCT GRID & DETAILS
// ==========================================
function fetchAllProducts(grid) {
    grid.innerHTML = "<p style='grid-column: span 5; text-align: center; font-size: 1.5rem;'>Loading products...</p>";

    fetch('http://localhost:3030/products')
        .then(res => {
            if (!res.ok) throw new Error("HTTP error! status: " + res.status);
            return res.json();
        })
        .then(response => {
            grid.innerHTML = ""; 
            const products = response.data;

            if (!products || products.length === 0) {
                grid.innerHTML = "<p style='grid-column: span 5; text-align: center;'>No products found.</p>";
                return;
            }

            products.forEach(product => {
                const card = document.createElement("div");
                card.classList.add("product-card");

                let imageUrl = `https://placehold.co/200x200/FFFFFF/DDDDDD?text=${product.ProductName.replace(/ /g, '+')}`;
                if (product.Images && product.Images.length > 0) {
                    imageUrl = product.Images[0].ImageURL;
                }

                card.innerHTML = `
                    <a href="/detail/${product.ProductID}" style="text-decoration: none; color: inherit; width: 100%; display: block;">
                        <div class="image-box">
                            <img src="${imageUrl}" alt="${product.ProductName}" style="width: 100%;">
                        </div>
                        <h3 class="product-title">${product.ProductName}</h3>
                        <p class="product-price">${product.Price} Baht</p>
                    </a>
                `;

                grid.appendChild(card);
            });
        })
        .catch(error => {
            console.error("Error fetching products:", error);
            grid.innerHTML = "<p style='grid-column: span 5; text-align: center; color: red;'>Error loading products.</p>";
        });
}

function fetchProductDetail(container) {
    const parts = window.location.pathname.split('/').filter(Boolean);
    const productId = parts[parts.length - 1];

    if (!productId) {
        container.innerHTML = "<h2>No Product ID</h2>";
        return;
    }

    container.innerHTML = "<p>Loading product...</p>";

    fetch(`http://localhost:3030/products/${productId}`)
        .then(res => {
            if (res.status === 404) throw new Error("Not Found");
            if (!res.ok) throw new Error("Server error");
            return res.json();
        })
        .then(response => {
            const p = response.data;

            if (!p) {
                container.innerHTML = "<h2>Product not found</h2>";
                return;
            }

            const formatDate = (date) => {
                if (!date) return "-";
                return new Date(date).toLocaleDateString();
            };

            let imageUrl = `https://placehold.co/500x500?text=${encodeURIComponent(p.ProductName)}`;
            if (p.Images && p.Images.length > 0) {
                imageUrl = p.Images[0].ImageURL;
            }

            container.innerHTML = `
                <div style="display:flex; gap:40px; padding:40px;">
                    <div>
                        <img src="${imageUrl}" alt="${p.ProductName}" style="width:400px; border:1px solid #ccc; border-radius:10px;">
                    </div>
                    <div>
                        <h1>${p.ProductName}</h1>
                        <p style="font-size:20px; font-weight:bold;">${p.Price} Baht</p>
                        <p><b>Brand:</b> ${p.Brand}</p>
                        <p><b>MFG Date:</b> ${formatDate(p.MFGDate)}</p>
                        <p><b>EXP Date:</b> ${formatDate(p.EXPDate)}</p>
                        <hr style="margin:20px 0;">
                        <div>
                            <b>Quantity:</b>
                            <button id="minus">-</button>
                            <input id="qty" type="number" value="1" min="1" style="width:50px; text-align:center;">
                            <button id="plus">+</button>
                        </div>
                        <br>
                        <button style="padding:10px 20px; background:black; color:white; border:none; cursor:pointer;">
                            Add to Cart
                        </button>
                    </div>
                </div>
            `;

            const qtyInput = document.getElementById("qty");
            document.getElementById("plus").onclick = () => {
                qtyInput.value = Number(qtyInput.value || 1) + 1;
            };
            document.getElementById("minus").onclick = () => {
                const current = Number(qtyInput.value || 1);
                if (current > 1) {
                    qtyInput.value = current - 1;
                }
            };
        })
        .catch(err => {
            console.error(err);
            if (err.message === "Not Found") {
                container.innerHTML = "<h2>Product not found</h2>";
            } else {
                container.innerHTML = "<h2 style='color:red;'>Error loading product</h2>";
            }
        });
}


// ==========================================
// API FUNCTIONS: ADMIN PRODUCT MANAGEMENT
// ==========================================
function fetchProducts() {
    const table = document.getElementById("productTable");

    fetch("http://localhost:3030/products")
        .then(res => res.json())
        .then(response => {
            const products = response.data;
            table.innerHTML = "";

            products.forEach(p => {
                const row = document.createElement("div");
                row.className = "table-row";
                
                // 1. Make the row relative so the delete button stays inside its boundaries
                row.style.position = "relative";

                // 2. The minus button is now absolutely positioned on the right edge.
                // This ensures it does NOT touch or move your "Brand" text.
                row.innerHTML = `
                    <span>${p.ProductID}</span>
                    <span class="p-name">${p.ProductName}</span>
                    <span>${Number(p.Price).toLocaleString()}</span>
                    <span class="brand-text">${p.Brand}</span>
                    
                    <button class="delete-item-btn delete-col" style="display: none; position: absolute; right: 20px; top: 50%; transform: translateY(-50%); background: #ff4d4d; color: white; border: none; border-radius: 50%; width: 24px; height: 24px; font-weight: bold; cursor: pointer; line-height: 24px; padding: 0; text-align: center; font-family: monospace;">-</button>
                `;

                // Handle Redirect on row click
                row.style.cursor = "pointer";
                row.onclick = () => {
                    window.location.href = `/edit-product/${p.ProductID}`;
                };

                // Handle Delete Logic
                const deleteBtn = row.querySelector(".delete-item-btn");
                deleteBtn.onclick = (e) => {
                    e.stopPropagation(); // Prevents row from redirecting to edit
                    
                    const isConfirmed = confirm(`Are you sure you want to delete ${p.ProductName}?`);
                    if (isConfirmed) {
                        deleteProduct(p.ProductID);
                    }
                };

                table.appendChild(row);
            });
        })
        .catch(err => {
            console.error(err);
            table.innerHTML = "<p style='color:red;'>Error loading products</p>";
        });
}

function deleteProduct(productId) {
    fetch(`http://localhost:3030/products/${productId}`, {
        method: "DELETE" 
    })
    .then(res => res.json())
    .then(result => {
        if (result.error) {
            alert("❌ Failed to delete product: " + result.message);
        } else {
            alert("✅ Product deleted successfully!");
            fetchProducts(); // Refresh table
        }
    })
    .catch(err => {
        console.error(err);
        alert("❌ Server error while deleting");
    });
}


// ==========================================
// API FUNCTIONS: ADD & EDIT
// ==========================================
function getProductIdFromURL() {
    if (!window.location.pathname.includes("edit-product")) return null;
    const parts = window.location.pathname.split('/').filter(Boolean);
    return parts[parts.length - 1];
}

function fetchProductForEdit(id) {
    fetch(`http://localhost:3030/products/${id}`)
        .then(res => {
            if (!res.ok) throw new Error("Not found");
            return res.json();
        })
        .then(res => {
            const p = res.data;

            document.getElementById("productId").value = p.ProductID;
            document.getElementById("productName").value = p.ProductName;
            document.getElementById("price").value = p.Price;
            document.getElementById("brand").value = p.Brand;
            document.getElementById("mfgDate").value = p.MFGDate?.split("T")[0];
            document.getElementById("expDate").value = p.EXPDate?.split("T")[0];

            document.getElementById("ingredients").value = p.Ingredients ? p.Ingredients.join(", ") : "";

            if (p.Images && p.Images.length > 0) {
                const img = document.getElementById("previewImage");
                img.src = p.Images[0].ImageURL;
                img.style.display = "block";
            }
        })
        .catch(err => console.error(err));
}

function setupUpdate(productId) {
    const form = document.getElementById("editForm");
    
    // Remove old listeners by cloning
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);

    newForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append("ProductName", document.getElementById("productName").value);
        formData.append("Price", document.getElementById("price").value);
        formData.append("Brand", document.getElementById("brand").value);
        formData.append("MFGDate", document.getElementById("mfgDate").value);
        formData.append("EXPDate", document.getElementById("expDate").value);
        formData.append("AdminID", "AD789401");
        formData.append("Ingredients", document.getElementById("ingredients").value);

        const file = document.getElementById("imageInput")?.files[0];
        if (file) formData.append("image", file);

        try {
            const res = await fetch(`http://localhost:3030/products/${productId}`, {
                method: "PUT",
                body: formData
            });
            const result = await res.json();

            if (result.error) {
                alert("❌ " + result.message);
                return;
            }

            alert("✅ Updated successfully!");
            window.location.href = "/product-management";

        } catch (err) {
            console.error(err);
            alert("❌ Update failed");
        }
    });
}

// Add form setup
document.addEventListener("DOMContentLoaded", () => {
    const addForm = document.getElementById("addForm");
    if (!addForm) return;

    addForm.addEventListener("submit", async (e) => {
        e.preventDefault(); 

        const formData = new FormData();
        formData.append("ProductName", document.getElementById("productName").value);
        formData.append("Price", document.getElementById("price").value);
        formData.append("Brand", document.getElementById("brand").value);
        formData.append("MFGDate", document.getElementById("mfgDate").value);
        formData.append("EXPDate", document.getElementById("expDate").value);
        formData.append("Ingredients", document.getElementById("ingredients").value);
        formData.append("AdminID", "AD789401");

        const file = document.getElementById("imageInput").files[0];
        if (file) {
            formData.append("image", file);
        }

        try {
            const res = await fetch("http://localhost:3030/products", {
                method: "POST",
                body: formData
            });
            const result = await res.json();

            if (result.error) {
                alert("❌ " + result.message);
                return;
            }

            alert("✅ Product added!");
            window.location.href = "/product-management";

        } catch (err) {
            console.error(err);
            alert("❌ Server error");
        }
    });
});


// ==========================================
// ADMIN LOGIN
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const adminForm = document.getElementById("admin-login-form");
    if (adminForm) {
        adminForm.addEventListener("submit", async function (e) {
            e.preventDefault();

            const username = document.getElementById("admin-username").value.trim();
            const password = document.getElementById("admin-password").value.trim();

            try {
                const res = await fetch("http://localhost:3030/admin/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        Username: username,
                        myPassword: password
                    })
                });

                const data = await res.json();

                if (!res.ok) {
                    alert(data.message || "Login failed");
                    return;
                }

                alert("Login success!");
                localStorage.setItem("adminID", data.AdminID);
                window.location.href = "/product-management";

            } catch (error) {
                console.error("Login error:", error);
                alert("Cannot connect to server");
            }
        });
    }
});


// ==========================================
// MAP & SEARCH HELPERS
// ==========================================
let mapInitialized = false;
let map;

function showStoreLocation(lat, lon) {
    if (!mapInitialized) {
        map = new longdo.Map({
            placeholder: document.getElementById('map')
        });
        mapInitialized = true;
    }
    map.location({ lat: lat, lon: lon }, true);
    map.Overlays.clear();
    const marker = new longdo.Marker(
        { lat: lat, lon: lon },
        { title: 'GoonShop Store', detail: 'Our store location' }
    );
    map.Overlays.add(marker);
}

function searchProducts() {
    const overlay = document.getElementById("search-overlay");
    const grid = document.getElementById("product-grid");

    const minPrice = document.getElementById("min-price");
    const maxPrice = document.getElementById("max-price");
    const brandInput = document.getElementById("brand-input");
    const ingredientRadios = document.querySelectorAll("input[name='ing']");
    
    let selected = null;
    ingredientRadios.forEach(r => {
        if (r.checked) selected = r.parentElement.innerText.trim();
    });

    const params = new URLSearchParams();

    if (minPrice?.value && maxPrice?.value) {
        params.append("minPrice", minPrice.value);
        params.append("maxPrice", maxPrice.value);
    }
    if (brandInput?.value.trim()) {
        params.append("brand", brandInput.value.trim());
    }
    if (selected) {
        params.append("ingredient", selected);
    }

    fetch(`http://localhost:3030/products/search?${params.toString()}`)
        .then(res => res.json())
        .then(res => {
            if (!grid) return;
            grid.innerHTML = "";

            if (!res.data || res.data.length === 0) {
                grid.innerHTML = `
                    <div style="grid-column: 1 / -1; text-align: center; padding: 60px; color: #777; font-size: 18px;">
                        ❌ Not Match
                    </div>
                `;
                return;
            }

            res.data.forEach(product => {
                const card = document.createElement("div");
                card.classList.add("product-card");
                let img = product.Images?.[0]?.ImageURL || "https://placehold.co/200x200";

                card.innerHTML = `
                    <a href="/detail/${product.ProductID}" style="text-decoration:none; color:inherit;">
                        <img src="${img}" style="width:100%">
                        <h3>${product.ProductName}</h3>
                        <p>${product.Price} Baht</p>
                    </a>
                `;
                grid.appendChild(card);
            });

            overlay.classList.add("hidden");
        });
}