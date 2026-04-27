const express = require('express');
const path = require('path');

const app = express();
const router = express.Router();
const PORT = 4000;

// ==========================================
// CONFIGURATION
// ==========================================

const STATIC_DIR = path.join(__dirname, 'static');
const HTML_DIR = path.join(__dirname, 'html');

app.use(express.static(STATIC_DIR));
app.use('/', router);

// Helper function
function sendPage(res, fileName) {
    res.sendFile(path.join(HTML_DIR, fileName));
}

// ==========================================
// ROUTES
// ==========================================

// Home routes
router.get(['/', '/home'], (req, res) => {
    console.log("Req: " + req.url);
    sendPage(res, 'homePage.html');
});

// Team page
router.get('/team', (req, res) => {
    console.log("Req: " + req.url);
    sendPage(res, 'teampage.html');
});

// Product listing page
router.get('/product', (req, res) => {
    console.log("Req: " + req.url);
    sendPage(res, 'productPage.html');
});

// Product detail page (dynamic ID)
router.get('/detail/:id', (req, res) => {
    console.log("Req: " + req.url);
    sendPage(res, 'productDetail.html');
});

// Admin login page
router.get('/admin', (req, res) => {
    console.log("Req: " + req.url);
    sendPage(res, 'adminLogin.html');
});

// Add product page
router.get('/add-product', (req, res) => {
    console.log("Req: " + req.url);
    sendPage(res, 'addProduct.html');
});

// Edit product page (dynamic ID)
router.get('/edit-product/:id', (req, res) => {
    console.log("Req: " + req.url);
    sendPage(res, 'editProduct.html');
});

// Product management dashboard
router.get('/product-management', (req, res) => {
    console.log("Req: " + req.url);
    sendPage(res, 'productManagement.html');
});

// Admin log page
router.get('/log-admin', (req, res) => {
    console.log("Req: " + req.url);
    sendPage(res, 'adminLog.html');
});

// ==========================================
// ERROR HANDLER
// ==========================================

router.use((req, res, next) => {
    console.log("Req: " + req.url);
    res.status(404).sendFile(path.join(__dirname, '/html/error.html'))
})

// ==========================================
// START SERVER
// ==========================================

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});