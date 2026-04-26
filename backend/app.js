const mysql = require('mysql2');
const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');

dotenv.config();

const app = express();
const router = express.Router();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());
app.use(router);

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    dateStrings: true
});

db.connect((error) => {
    if (error) throw error;
    console.log(`Connected to DB: ${process.env.DB_NAME}`);
});

// ==============================
// CUSTOMER APIs
// ==============================
router.get('/customers', (req, res) => {
    db.query("SELECT * FROM Customer", (error, results) => {
        if (error) return res.status(500).send({ error: true, message: error.message });
        res.send({ error: false, data: results, message: 'Customer list' });
    });
});

router.get('/customers/:id', (req, res) => {
    const id = req.params.id;
    db.query("SELECT * FROM Customer WHERE CustomerID = ?", [id], (error, results) => {
        if (error) return res.status(500).send({ error: true, message: error.message });
        if (results.length === 0) return res.status(404).send({ error: true, message: 'Customer not found' });
        res.send({ error: false, data: results[0], message: 'Customer retrieved' });
    });
});

router.post('/customers', (req, res) => {
    const { FName, LName, PhoneNumber, Email, Gender, City, Province, SubDistrict } = req.body;
    if (!FName || !LName || !PhoneNumber || !Email) return res.status(400).send({ error: true, message: 'Missing fields' });

    const getLastIdSQL = `SELECT MAX(CAST(SUBSTRING(CustomerID, 3) AS UNSIGNED)) AS lastId FROM Customer`;
    db.query(getLastIdSQL, (error, result) => {
        if (error) return res.status(500).send({ error: true, message: error.message });
        const nextId = (result[0].lastId || 0) + 1;
        const newID = 'CT' + nextId;
        db.query("INSERT INTO Customer VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", 
            [newID, FName, LName, PhoneNumber, Email, Gender, City, Province, SubDistrict], 
            (err) => {
                if (err) return res.status(500).send({ error: true, message: err.message });
                res.send({ error: false, CustomerID: newID, message: 'Customer created' });
            }
        );
    });
});

// ==============================
// PRODUCT APIs
// ==============================

// GET ALL PRODUCTS
router.get('/products', (req, res) => {
    const sql = `
        SELECT p.*, i.ImageID, i.ImageURL
        FROM Product p
        LEFT JOIN Image i ON p.ProductID = i.ProductID
    `;
    db.query(sql, (error, results) => {
        if (error) return res.status(500).send({ error: true, message: error.message });
        const products = {};
        results.forEach(row => {
            if (!products[row.ProductID]) {
                products[row.ProductID] = { ...row, Images: [] };
            }
            if (row.ImageID) products[row.ProductID].Images.push({ ImageID: row.ImageID, ImageURL: row.ImageURL });
        });
        res.send({ error: false, data: Object.values(products) });
    });
});

// SEARCH PRODUCTS
router.get('/products/search', (req, res) => {
    const { name, minPrice, maxPrice, brand, ingredient } = req.query;
    let sql = `
        SELECT p.*, i.ImageID, i.ImageURL
        FROM Product p
        LEFT JOIN Image i ON p.ProductID = i.ProductID
        LEFT JOIN ItemIngredients ing ON p.ProductID = ing.ProductID
        WHERE 1=1
    `;
    const params = [];
    if (name) { sql += " AND p.ProductName LIKE ?"; params.push(`%${name}%`); }
    if (minPrice && maxPrice) { sql += " AND p.Price BETWEEN ? AND ?"; params.push(minPrice, maxPrice); }
    if (brand) { sql += " AND LOWER(p.Brand) = LOWER(?)"; params.push(brand); }
    if (ingredient) { sql += " AND ing.Ingredients LIKE ?"; params.push(`%${ingredient}%`); }

    db.query(sql, params, (error, results) => {
        if (error) return res.status(500).send({ error: true, message: error.message });
        const products = {};
        results.forEach(row => {
            if (!products[row.ProductID]) {
                products[row.ProductID] = { ...row, Images: [] };
            }
            if (row.ImageID) products[row.ProductID].Images.push({ ImageID: row.ImageID, ImageURL: row.ImageURL });
        });
        res.send({ error: false, data: Object.values(products) });
    });
});

// GET PRODUCT BY ID
router.get('/products/:id', (req, res) => {
    const sql = `
        SELECT p.*, i.ImageID, i.ImageURL, ing.Ingredients
        FROM Product p
        LEFT JOIN Image i ON p.ProductID = i.ProductID
        LEFT JOIN ItemIngredients ing ON p.ProductID = ing.ProductID
        WHERE p.ProductID = ?
    `;
    db.query(sql, [req.params.id], (error, results) => {
        if (error) return res.status(500).send({ error: true, message: error.message });
        if (results.length === 0) return res.status(404).send({ error: true, message: 'Not found' });
        
        const p = { ...results[0], Images: [], Ingredients: [] };
        results.forEach(row => {
            if (row.ImageID && !p.Images.find(img => img.ImageID === row.ImageID)) 
                p.Images.push({ ImageID: row.ImageID, ImageURL: row.ImageURL });
            if (row.Ingredients && !p.Ingredients.includes(row.Ingredients)) 
                p.Ingredients.push(row.Ingredients);
        });
        res.send({ error: false, data: p });
    });
});

// ADD PRODUCT
router.post('/products', upload.single('image'), async (req, res) => {
    const { ProductName, Price, Brand, MFGDate, EXPDate, AdminID, Ingredients } = req.body;
    const ingredientsArray = Ingredients ? Ingredients.split(',').map(i => i.trim()).filter(i => i) : [];

    const getLastIdSQL = `SELECT MAX(CAST(SUBSTRING(ProductID, 3) AS UNSIGNED)) AS lastId FROM Product`;
    db.query(getLastIdSQL, async (err, result) => {
        if (err) return res.status(500).send({ error: true, message: err.message });
        const newProductID = 'PD' + ((result[0].lastId || 789400) + 1);
        
        let imageUrl = null;
        if (req.file) {
            const up = await cloudinary.uploader.upload(req.file.path);
            imageUrl = up.secure_url;
        }

        db.query("INSERT INTO Product VALUES (?, ?, ?, ?, ?, ?, ?)", 
            [newProductID, ProductName, Price, Brand, MFGDate, EXPDate, AdminID], 
            (error) => {
                if (error) return res.status(500).send({ error: true, message: error.message });
                
                if (ingredientsArray.length > 0) {
                    const values = ingredientsArray.map(i => [i, newProductID]);
                    db.query("INSERT INTO ItemIngredients (Ingredients, ProductID) VALUES ?", [values]);
                }

                if (imageUrl) {
                    const imgID = 'IM' + (Date.now() % 1000000);
                    db.query("INSERT INTO Image (ImageID, myDescription, UploadDate, ImageURL, ProductID) VALUES (?, ?, NOW(), ?, ?)",
                        [imgID, 'Product image', imageUrl, newProductID]);
                }
                res.send({ error: false, message: 'Product created', ProductID: newProductID });
            }
        );
    });
});

// UPDATE PRODUCT
router.put('/products/:id', upload.single('image'), (req, res) => {
    const { id } = req.params;
    const { ProductName, Price, Brand, MFGDate, EXPDate, AdminID, Ingredients } = req.body;

    db.query("UPDATE Product SET ProductName=?, Price=?, Brand=?, MFGDate=?, EXPDate=?, AdminID=? WHERE ProductID=?",
        [ProductName, Price, Brand, MFGDate, EXPDate, AdminID, id], (err) => {
            if (err) return res.status(500).send({ error: true, message: err.message });
            
            if (Ingredients) {
                const arr = Ingredients.split(',').map(i => i.trim()).filter(i => i);
                db.query("DELETE FROM ItemIngredients WHERE ProductID = ?", [id], () => {
                    if (arr.length > 0) db.query("INSERT INTO ItemIngredients (Ingredients, ProductID) VALUES ?", [arr.map(i => [i, id])]);
                });
            }
            res.send({ error: false, message: 'Updated' });
        }
    );
});

// DELETE PRODUCT
router.delete('/products/:id', (req, res) => {
    const { id } = req.params;
    db.query("DELETE FROM Image WHERE ProductID = ?", [id], () => {
        db.query("DELETE FROM ItemIngredients WHERE ProductID = ?", [id], () => {
            db.query("DELETE FROM myOrder WHERE ProductID = ?", [id], () => {
                db.query("DELETE FROM Product WHERE ProductID = ?", [id], (err) => {
                    if (err) return res.status(500).send({ error: true, message: err.message });
                    res.send({ error: false, message: 'Deleted' });
                });
            });
        });
    });
});

// ==============================
// ADMIN APIs
// ==============================
router.post('/admin/login', (req, res) => {
    const { Username, myPassword } = req.body;
    db.query("SELECT * FROM Administrator WHERE Username = ? AND myPassword = ?", [Username, myPassword], (err, results) => {
        if (err) return res.status(500).send({ error: true, message: err.message });
        if (results.length > 0) {
            res.send({ error: false, message: 'Login success', AdminID: results[0].AdminID });
        } else {
            res.status(401).send({ error: true, message: 'Invalid credentials' });
        }
    });
});

app.listen(process.env.PORT, () => {
    console.log(`Server running at http://localhost:${process.env.PORT}`);
});