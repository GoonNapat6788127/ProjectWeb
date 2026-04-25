const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// 1. Serve static files (like style.css) from the 'public' folder
app.use(express.static(path.join(__dirname, 'static')));

// 2. Route for the Home Page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'html', 'homePage.html'));
});

app.get('/home', (req, res) => {
    res.sendFile(path.join(__dirname, 'html', 'homePage.html'));
});

app.get('/team', (req, res) => {
    res.sendFile(path.join(__dirname, 'html', 'teampage.html'));
});

// 3. Route for the Product Page
app.get('/detail/:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'html', 'productDetail.html'));
});
app.get('/product', (req, res) => {
    res.sendFile(path.join(__dirname, 'html', 'productPage.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'html', 'adminLogin.html'));
});

app.get('/management', (req, res) => {
    res.sendFile(path.join(__dirname, 'html', 'managementPage.html'));
});
// Route สำหรับหน้า Add Product
app.get('/add-product', (req, res) => {
    res.sendFile(path.join(__dirname, 'html', 'addProduct.html'));
});

// Route สำหรับหน้า Edit Product
app.get('/edit-product', (req, res) => {
    res.sendFile(path.join(__dirname, 'html', 'editProduct.html'));
});

// Route สำหรับหน้า Product Management
app.get('/product-management', (req, res) => {
    // ตรวจสอบให้แน่ใจว่าโฟลเดอร์และชื่อไฟล์ตรงกับที่คุณสร้างไว้
    res.sendFile(path.join(__dirname, 'html', 'productManagement.html'));
});

// 3. Route for the Product Page

// 4. Start the server
app.listen(PORT, () => {
    console.log(`Server is running! Visit http://localhost:${PORT} in your browser.`);
});