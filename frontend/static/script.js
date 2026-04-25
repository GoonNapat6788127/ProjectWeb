document.addEventListener("DOMContentLoaded", () => {
    
    // Check which elements exist on the current page
    const productGrid = document.getElementById("product-grid");
    const detailContainer = document.getElementById("detail-container");

    // 1. If we are on the Products Page (productPage.html)
    if (productGrid) {
        fetchAllProducts(productGrid);
    }

    // 2. If we are on the Product Detail Page (productDetail.html)
    if (detailContainer) {
        fetchProductDetail(detailContainer);
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

                // IMPORTANT UPDATE: The href is now a clean path parameter!
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
    
    // IMPORTANT UPDATE: Read the ID directly from the URL path (e.g., /detail/PD789402)
    const pathArray = window.location.pathname.split('/');
    const productId = pathArray[pathArray.length - 1]; // This grabs the very last part of the URL

    // Stop if the ID is missing or if the word is still 'detail'
    if (!productId || productId === 'detail') {
        container.innerHTML = "<h2 style='width:100%; text-align:center; margin-top:50px;'>Product ID missing in URL. Please go back.</h2>";
        return;
    }

    container.innerHTML = "<p style='width:100%; text-align:center; font-size:1.5rem; margin-top:50px;'>Loading product details...</p>";

    // Ensure this port matches where your API is running (3000 or 3030)
    fetch(`http://localhost:3030/products/${productId}`)
        .then(res => {
            if (res.status === 404) throw new Error("Not Found");
            if (!res.ok) throw new Error("HTTP error! status: " + res.status);
            return res.json();
        })
        .then(response => {
            const product = response.data;

            if (!product) {
                container.innerHTML = "<h2 style='width:100%; text-align:center; margin-top:50px;'>Product not found.</h2>";
                return;
            }

            // Variables for your specific API columns
            const brand = product.Brand ? product.Brand : "Unknown";
            const barcode = product.Barcode ? product.Barcode : "N/A";
            const mfgDate = product.MFGDate ? product.MFGDate : "N/A";
            const expDate = product.EXPDate ? product.EXPDate : "N/A";
            
            // Image handling
            let imageUrl = `https://placehold.co/500x500/FFFFFF/DDDDDD?text=${product.ProductName.replace(/ /g, '+')}`;
            if (product.Images && product.Images.length > 0) {
                imageUrl = product.Images[0].ImageURL;
            }

            // Inject the detail layout dynamically
            container.innerHTML = `
                <div class="similar-products">
                    <h3>Similar products</h3>
                    <div class="similar-item"><img src="https://placehold.co/150x150/FFFFFF/DDDDDD?text=Jade+Dragon" alt="Similar 1"></div>
                    <div class="similar-item"><img src="https://placehold.co/150x150/FFFFFF/DDDDDD?text=Shrimp+Siu+Mai" alt="Similar 2"></div>
                    <div class="similar-item"><img src="https://placehold.co/150x150/FFFFFF/DDDDDD?text=Pork+Dumpling" alt="Similar 3"></div>
                </div>

                <div class="product-gallery">
                    <div class="main-image">
                        <img src="${imageUrl}" alt="${product.ProductName}" style="width: 100%;">
                    </div>
                    <div class="thumbnail-row">
                        <img src="${imageUrl}" alt="Thumbnail 1">
                        <img src="https://placehold.co/100x100/FFFFFF/DDDDDD?text=Thumb+2" alt="Thumbnail 2">
                    </div>
                </div>

                <div class="product-info">
                    <h1>${product.ProductName}</h1>
                    <div class="brand-name">brand: ${brand}</div>
                    
                    <div class="price">${product.Price} Baht</div>
                    
                    <div class="quantity-label">Quantity</div>
                    <div class="qty-controls">
                        <button class="qty-btn">-</button>
                        <input type="text" class="qty-input" value="1">
                        <button class="qty-btn">+</button>
                    </div>

                    <button class="add-to-cart">+ Add to cart</button>

                    <div class="description-box">
                        <h3>Product Details</h3>
                        <p class="desc-content">
                            - <strong>Name:</strong> ${product.ProductName}<br>
                            - <strong>Brand:</strong> ${brand}<br>
                            - <strong>Barcode:</strong> ${barcode}<br>
                            - <strong>MFG Date:</strong> ${mfgDate}<br>
                            - <strong>EXP Date:</strong> ${expDate}
                        </p>
                    </div>
                </div>
            `;
        })
        .catch(error => {
            console.error("Error fetching product details:", error);
            if (error.message === "Not Found") {
                container.innerHTML = "<h2 style='width:100%; text-align:center; margin-top:50px;'>Product not found in database.</h2>";
            } else {
                container.innerHTML = "<h2 style='width:100%; text-align:center; color:red; margin-top:50px;'>Error loading product. Is backend running?</h2>";
            }
        });
}