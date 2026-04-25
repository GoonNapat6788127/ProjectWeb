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


// ==========================================
// FUNCTION 2: FETCH SINGLE PRODUCT DETAIL
// ==========================================
function fetchProductDetail(container) {
    const productId = window.location.pathname.split('/').filter(Boolean).pop();

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

            // Handle image
            let imageUrl = `https://placehold.co/500x500?text=${encodeURIComponent(p.ProductName)}`;
            if (p.Images && p.Images.length > 0) {
                imageUrl = p.Images[0].ImageURL;
            }

            // Render FULL product detail
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
                        <p><b>Barcode:</b> ${p.Barcode}</p>
                        <p><b>MFG Date:</b> ${p.MFGDate}</p>
                        <p><b>EXP Date:</b> ${p.EXPDate}</p>
                        <p><b>Admin ID:</b> ${p.AdminID}</p>

                        <hr style="margin:20px 0;">

                        <div>
                            <b>Quantity:</b>
                            <button id="minus">-</button>
                            <input id="qty" type="text" value="1" style="width:40px; text-align:center;">
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

            // Quantity logic
            const qtyInput = document.getElementById("qty");
            document.getElementById("plus").onclick = () => {
                qtyInput.value = parseInt(qtyInput.value) + 1;
            };
            document.getElementById("minus").onclick = () => {
                if (parseInt(qtyInput.value) > 1) {
                    qtyInput.value = parseInt(qtyInput.value) - 1;
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
    adminForm.addEventListener("submit", async function(e) {
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
            window.location.href = "/management";

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