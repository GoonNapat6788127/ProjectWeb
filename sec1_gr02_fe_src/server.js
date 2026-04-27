const express = require('express');
const path = require('path');

const app = express();
const PORT = 4000;

// ==========================================
// CONFIGURATION
// ==========================================

// Define base paths for easier reuse
const STATIC_DIR = path.join(__dirname, 'static');
const HTML_DIR = path.join(__dirname, 'html');

// Serve static files (CSS, JS, images)
app.use(express.static(STATIC_DIR));

// Helper function to send HTML files
function sendPage(res, fileName) {
    res.sendFile(path.join(HTML_DIR, fileName));
}

// ==========================================
// ROUTES
// ==========================================

// Home routes
app.get(['/', '/home'], (req, res) => {
    sendPage(res, 'homePage.html');
});

// Team page
app.get('/team', (req, res) => {
    sendPage(res, 'teampage.html');
});

// Product listing page
app.get('/product', (req, res) => {
    sendPage(res, 'productPage.html');
});

// Product detail page (dynamic ID)
app.get('/detail/:id', (req, res) => {
    // The ID is used by frontend JS, not needed here
    sendPage(res, 'productDetail.html');
});

// Admin login page
app.get('/admin', (req, res) => {
    sendPage(res, 'adminLogin.html');
});

// Add product page
app.get('/add-product', (req, res) => {
    sendPage(res, 'addProduct.html');
});

// Edit product page (dynamic ID)
app.get('/edit-product/:id', (req, res) => {
    sendPage(res, 'editProduct.html');
});

// Product management dashboard
app.get('/product-management', (req, res) => {
    sendPage(res, 'productManagement.html');
});

// ==========================================
// START SERVER
// ==========================================

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});