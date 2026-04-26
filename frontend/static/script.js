// ==========================================
// STARTUP LOGIC (Runs when page loads)
// ==========================================
document.addEventListener("DOMContentLoaded", () => {

    // 1. Product Grid Page
    const productGrid = document.getElementById("product-grid");
    if (productGrid) {
        fetchAllProducts(productGrid);
    }

    // 2. Product Detail Page
    const detailContainer = document.getElementById("detail-container");
    if (detailContainer) {
        fetchProductDetail(detailContainer);
    }

    // 3. Expandable Search Bar (Header)
    const searchBox = document.getElementById("expandable-search-box");
    const searchInput = document.getElementById("nav-search-input");

    // SAFE: Only run this if the search bar actually exists on this page!
    if (searchBox && searchInput) {
        // Expand when user clicks inside the input
        searchInput.addEventListener("focus", () => {
            searchBox.classList.add("active");
        });

        // Shrink when user clicks outside the box
        document.addEventListener("click", (event) => {
            if (!searchBox.contains(event.target)) {
                searchBox.classList.remove("active");
            }
        });
    }
});


// ==========================================
// FUNCTION 1: FETCH ALL PRODUCTS
// ==========================================
function fetchAllProducts(grid) {
    grid.innerHTML = "<p style='grid-column: span 5; text-align: center; font-size: 1.5rem;'>Loading products...</p>";

    fetch('http://localhost:3030/products')
        .then(res => {
            if (!res.ok) throw new Error("HTTP error! status: " + res.status);
            return res.json();
        })
        .then(response => {
            grid.innerHTML = ""; // Clear loading message
            const products = response.data;

            if (!products || products.length === 0) {
                grid.innerHTML = "<p style='grid-column: span 5; text-align: center;'>No products found.</p>";
                return;
            }

            // Loop through database and build cards
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
    // safer product ID extraction
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

            // format date nicely
            const formatDate = (date) => {
                if (!date) return "-";
                return new Date(date).toLocaleDateString();
            };

            // image fallback
            let imageUrl = `https://placehold.co/500x500?text=${encodeURIComponent(p.ProductName)}`;
            if (p.Images && p.Images.length > 0) {
                imageUrl = p.Images[0].ImageURL;
            }

            container.innerHTML = `
                <div style="display:flex; gap:40px; padding:40px;">
                    
                    <div>
                        <img src="${imageUrl}" 
                             alt="${p.ProductName}" 
                             style="width:400px; border:1px solid #ccc; border-radius:10px;">
                    </div>

                    <div>
                        <h1>${p.ProductName}</h1>

                        <p style="font-size:20px; font-weight:bold;">
                            ${p.Price} Baht
                        </p>

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

                        <button style="
                            padding:10px 20px;
                            background:black;
                            color:white;
                            border:none;
                            cursor:pointer;
                        ">
                            Add to Cart
                        </button>
                    </div>
                </div>
            `;

            // quantity logic (safe)
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
// FUNCTION 3: ADMIN LOGIN (SAFE)
// ==========================================
const adminForm = document.getElementById("admin-login-form");

if (adminForm) {
    adminForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const username = document.getElementById("admin-username").value.trim();
        const password = document.getElementById("admin-password").value.trim();

        try {
            const res = await fetch("http://localhost:3030/admin/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    Username: username,
                    myPassword: password
                })
            });

            const data = await res.json();

            // ❌ LOGIN FAIL
            if (!res.ok) {
                alert(data.message || "Login failed");
                return;
            }

            // ✅ LOGIN SUCCESS
            alert("Login success!");

            // store admin
            localStorage.setItem("adminID", data.AdminID);

            // 🚀 redirect
            window.location.href = "/product-management";

        } catch (error) {
            console.error("Login error:", error);
            alert("Cannot connect to server");
        }
    });
}

// ==============================
// SEARCH EXPAND / COLLAPSE
// ==============================
document.addEventListener("DOMContentLoaded", () => {
    const searchBox = document.querySelector(".search-container");
    const overlay = document.getElementById("search-overlay");

    console.log("searchBox:", searchBox);
    console.log("overlay:", overlay);

    if (searchBox && overlay) {
        searchBox.addEventListener("click", () => {
            console.log("CLICKED");
            overlay.classList.remove("hidden");
        });

        document.addEventListener("click", (e) => {
            if (!searchBox.contains(e.target) && !overlay.contains(e.target)) {
                overlay.classList.add("hidden");
            }
        });
    }
});

document.addEventListener("DOMContentLoaded", () => {

    // Detect page by element
    const table = document.getElementById("productTable");
    const form = document.getElementById("editForm");

    // ==========================
    // PRODUCT LIST PAGE
    // ==========================
    if (table) {
        fetchProducts();
        return;
    }

    // ==========================
    // EDIT PRODUCT PAGE
    // ==========================
    if (form) {
        const productId = getProductIdFromURL();

        if (!productId) {
            console.log("No product ID (not edit page)");
            return;
        }

        fetchProduct(productId);
        setupUpdate(productId);
    }
});


// ==========================
// FETCH ALL PRODUCTS
// ==========================
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

                row.innerHTML = `
                    <span>${p.ProductID}</span>
                    <span class="p-name">${p.ProductName}</span>
                    <span>${Number(p.Price).toLocaleString()}</span>
                    <span class="brand-text">${p.Brand}</span>
                `;

                row.style.cursor = "pointer";
                row.onclick = () => {
                    window.location.href = `/edit-product/${p.ProductID}`;
                };

                table.appendChild(row);
            });
        })
        .catch(err => {
            console.error(err);
            table.innerHTML = "<p style='color:red;'>Error loading products</p>";
        });
}


// ==========================
// GET PRODUCT ID FROM URL
// ==========================
function getProductIdFromURL() {
    const parts = window.location.pathname.split('/').filter(Boolean);

    // IMPORTANT: ensure it's edit page
    if (!window.location.pathname.includes("edit-product")) {
        return null;
    }

    return parts[parts.length - 1];
}


// ==========================
// FETCH SINGLE PRODUCT
// ==========================
function fetchProduct(id) {
    fetch(`http://localhost:3030/products/${id}`)
        .then(res => {
            if (res.status === 404) throw new Error("Not Found");
            return res.json();
        })
        .then(res => {
            const p = res.data;

            document.getElementById("productId").value = p.ProductID;
            document.getElementById("productName").value = p.ProductName;
            document.getElementById("price").value = p.Price;
            document.getElementById("brand").value = p.Brand;

            document.getElementById("ingredients").value =
                p.Ingredients ? p.Ingredients.join(", ") : "";

            if (p.Images && p.Images.length > 0) {
                const img = document.getElementById("previewImage");
                img.src = p.Images[0].ImageURL;
                img.style.display = "block";
            }
        })
        .catch(err => {
            console.error(err);
        });
}


document.addEventListener("DOMContentLoaded", () => {
    const productId = getProductIdFromURL();

    if (!productId) {
        console.log("No product ID");
        return;
    }

    fetchProduct(productId);
    setupUpdate(productId);
});

function getProductIdFromURL() {
    const parts = window.location.pathname.split('/').filter(Boolean);

    if (parts.length < 2) return null;

    return parts[parts.length - 1];
}

function fetchProduct(id) {
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

            document.getElementById("ingredients").value =
                p.Ingredients ? p.Ingredients.join(", ") : "";

            if (p.Images && p.Images.length > 0) {
                const img = document.getElementById("previewImage");
                img.src = p.Images[0].ImageURL;
                img.style.display = "block";
            }
        })
        .catch(err => {
            console.error(err);
        });
}

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("editForm");
    if (!form) return;

    const productId = getProductIdFromURL();
    if (!productId) return;

    fetchProduct(productId);
    setupUpdate(productId);
});

// =======================
// GET PRODUCT ID
// =======================
function getProductIdFromURL() {
    const parts = window.location.pathname.split('/').filter(Boolean);
    return parts[parts.length - 1];
}

// =======================
// FETCH PRODUCT
// =======================
function fetchProduct(id) {
    fetch(`http://localhost:3030/products/${id}`)
        .then(res => res.json())
        .then(res => {
            const p = res.data;

            document.getElementById("productId").value = p.ProductID;
            document.getElementById("productName").value = p.ProductName;
            document.getElementById("price").value = p.Price;
            document.getElementById("brand").value = p.Brand;

            document.getElementById("mfgDate").value = p.MFGDate?.split("T")[0];
            document.getElementById("expDate").value = p.EXPDate?.split("T")[0];

            // ingredients array → string
            document.getElementById("ingredients").value =
                p.Ingredients ? p.Ingredients.join(", ") : "";

            // image preview
            if (p.Images && p.Images.length > 0) {
                const img = document.getElementById("previewImage");
                img.src = p.Images[0].ImageURL;
                img.style.display = "block";
            }
        })
        .catch(err => {
            console.error(err);
        });
}

// =======================
// UPDATE PRODUCT
// =======================
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("editForm");
    if (!form) return;

    const productId = getProductIdFromURL();
    if (!productId) return;

    setupUpdate(productId); // ONLY ONCE
});

function getProductIdFromURL() {
    const parts = window.location.pathname.split('/').filter(Boolean);
    return parts[parts.length - 1];
}

function setupUpdate(productId) {
    const form = document.getElementById("editForm");

    // 🚨 REMOVE old listener (important fix)
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

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("addForm");

    if (!form) return;

    form.addEventListener("submit", async (e) => {
        e.preventDefault(); // ❗ IMPORTANT (prevents page reload)

        const formData = new FormData();

        formData.append("ProductName", document.getElementById("productName").value);
        formData.append("Price", document.getElementById("price").value);
        formData.append("Brand", document.getElementById("brand").value);
        formData.append("MFGDate", document.getElementById("mfgDate").value);
        formData.append("EXPDate", document.getElementById("expDate").value);

        // ✅ ingredients
        formData.append("Ingredients", document.getElementById("ingredients").value);

        // ⚠️ IMPORTANT: backend requires AdminID
        formData.append("AdminID", "AD789401");

        // image
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