// ==========================================
// DEPENDENCIES
// ==========================================

const express    = require('express');
const cors       = require('cors');
const dotenv     = require('dotenv');
const mysql      = require('mysql2');
const multer     = require('multer');
const cloudinary = require('cloudinary').v2;

dotenv.config();


// ==========================================
// EXPRESS SETUP
// ==========================================

const app    = express();
const router = express.Router();

app.use(cors());
app.use(express.json());
app.use(router);


// ==========================================
// DATABASE
// ==========================================

const db = mysql.createConnection({
    host:        process.env.DB_HOST,
    user:        process.env.DB_USER,
    password:    process.env.DB_PASSWORD,
    database:    process.env.DB_NAME,
    dateStrings: true,
});

db.connect((err) => {
    if (err) throw err;
    console.log(`Connected to DB: ${process.env.DB_NAME}`);
});


// ==========================================
// CLOUDINARY
// ==========================================

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({ storage: multer.memoryStorage() });


// Streams a buffer to Cloudinary and resolves with the upload result. 
function uploadToCloudinary(buffer) {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { resource_type: 'auto' },
            (err, result) => (err ? reject(err) : resolve(result))
        );
        stream.end(buffer);
    });
}


// ==========================================
// HELPERS
// ==========================================


// Collapses a flat list of Product LEFT JOIN Image rows into
// an array of product objects each with a nested Images array.

function groupProductImages(rows) {
    const map = {};
    for (const row of rows) {
        if (!map[row.ProductID]) {
            const { ImageID, ImageURL, ...fields } = row;
            map[row.ProductID] = { ...fields, Images: [] };
        }
        if (row.ImageID) {
            map[row.ProductID].Images.push({ ImageID: row.ImageID, ImageURL: row.ImageURL });
        }
    }
    return Object.values(map);
}


// Returns the next sequential ID for a table, e.g. "PD789401".
// @param {string} table
// @param {string} column
// @param {string} prefix  Two-character prefix, e.g. "PD", "LG".
// @param {number} [base=789400]
// @returns {Promise<string>}

function generateNextId(table, column, prefix, base = 789400) {
    return new Promise((resolve, reject) => {
        db.query(
            `SELECT MAX(CAST(SUBSTRING(${column}, 3) AS UNSIGNED)) AS lastId FROM ${table}`,
            (err, rows) => (err ? reject(err) : resolve(prefix + ((rows[0].lastId || base) + 1)))
        );
    });
}


// Parses a comma-separated string into a trimmed, non-empty array.
// @param {string} [raw]
// @returns {string[]}

function parseIngredients(raw) {
    if (!raw) return [];
    return raw.split(',').map((s) => s.trim()).filter(Boolean);
}


// Generates a short image ID based on the current timestamp.
// @returns {string}

function generateImageId() {
    return 'IM' + (Date.now() % 1000000);
}


// Inserts a Cloudinary image record for a given product.
// @param {string} imageUrl
// @param {string} productId

async function saveImage(imageUrl, productId) {
    await db.promise().query(
        'INSERT INTO Image (ImageID, myDescription, UploadDate, ImageURL, ProductID) VALUES (?, ?, NOW(), ?, ?)',
        [generateImageId(), 'Product image', imageUrl, productId]
    );
}


// Replaces a product's image: deletes the old record and inserts the new one.
// @param {Buffer} buffer  Raw file bytes from multer.
// @param {string} productId

async function replaceImage(buffer, productId) {
    const { secure_url } = await uploadToCloudinary(buffer);
    await db.promise().query('DELETE FROM Image WHERE ProductID = ?', [productId]);
    await saveImage(secure_url, productId);
}


// Replaces all ingredient rows for a product.
// @param {string} raw   Comma-separated ingredients string.
// @param {string} productId

async function replaceIngredients(raw, productId) {
    const arr = parseIngredients(raw);
    await db.promise().query('DELETE FROM ItemIngredients WHERE ProductID = ?', [productId]);
    if (arr.length > 0) {
        await db.promise().query(
            'INSERT INTO ItemIngredients (Ingredients, ProductID) VALUES ?',
            [arr.map((ing) => [ing, productId])]
        );
    }
}

// Wraps a callback-style db.query in a standard Express error response.
function queryOrError(res, sql, params, onSuccess) {
    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).send({ error: true, message: err.message });
        onSuccess(results);
    });
}


// ==========================================
// PRODUCT ROUTES
// ==========================================

// GET      /products
// GET      /products/search
// GET      /products/:id
// POST     /products
// PUT      /products/:id
// DELETE   /products/:id

// Testing Retrieve all products (Normal case)
// status: 200 OK
// method: get
// URL: http://localhost:3030/products
// body: none

// Testing Retrieve all products (Database table missing)
// status: 500 Internal Server Error
// method: get
// URL: http://localhost:3030/products
// body: none

// GET /products — all products with images.
router.get('/products', (req, res) => {
    const sql = `
        SELECT p.*, i.ImageID, i.ImageURL
        FROM Product p
        LEFT JOIN Image i ON p.ProductID = i.ProductID
    `;
    queryOrError(res, sql, [], (rows) => {
        res.send({ error: false, data: groupProductImages(rows) });
    });
});

// Testing Retrieve a product (Search by name)
// status: 200 OK
// method: get
// URL: http://localhost:3030/products/search?name=chicken wing
// body: none

// Testing Retrieve a product (Criteria search)
// status: 200 OK
// method: get
// URL: http://localhost:3030/products/search?minPrice=100&maxPrice=500&brand=CP&ingredient=Pork
// body: none

// GET /products/search — filter by name, price range, brand, ingredient.
router.get('/products/search', (req, res) => {
    const { name, minPrice, maxPrice, brand, ingredient } = req.query;

    let sql = `
        SELECT p.*, i.ImageID, i.ImageURL
        FROM Product p
        LEFT JOIN Image i            ON p.ProductID = i.ProductID
        LEFT JOIN ItemIngredients ing ON p.ProductID = ing.ProductID
        WHERE 1=1
    `;
    const params = [];

    if (name)                 { sql += ' AND p.ProductName LIKE ?';    params.push(`%${name}%`); }
    if (minPrice && maxPrice) { sql += ' AND p.Price BETWEEN ? AND ?'; params.push(minPrice, maxPrice); }
    if (brand)                { sql += ' AND LOWER(p.Brand) = LOWER(?)'; params.push(brand); }
    if (ingredient)           { sql += ' AND ing.Ingredients LIKE ?';  params.push(`%${ingredient}%`); }

    queryOrError(res, sql, params, (rows) => {
        res.send({ error: false, data: groupProductImages(rows) });
    });
});

// Testing Retrieve a product by ID (Normal case)
// status: 200 OK
// method: get
// URL: http://localhost:3030/products/PD789410
// body: none

// Testing Retrieve a product by ID (Invalid ID)
// status: 404 Not Found
// method: get
// URL: http://localhost:3030/products/XX000000
// body: none

// GET /products/:id — single product with images and ingredients.
router.get('/products/:id', (req, res) => {
    const sql = `
        SELECT p.*, i.ImageID, i.ImageURL, ing.Ingredients
        FROM Product p
        LEFT JOIN Image i            ON p.ProductID = i.ProductID
        LEFT JOIN ItemIngredients ing ON p.ProductID = ing.ProductID
        WHERE p.ProductID = ?
    `;
    queryOrError(res, sql, [req.params.id], (rows) => {
        if (rows.length === 0) return res.status(404).send({ error: true, message: 'Not found' });

        const { ImageID, ImageURL, ...fields } = rows[0];
        const product = { ...fields, Images: [], Ingredients: [] };

        for (const row of rows) {
            if (row.ImageID && !product.Images.find((img) => img.ImageID === row.ImageID)) {
                product.Images.push({ ImageID: row.ImageID, ImageURL: row.ImageURL });
            }
            if (row.Ingredients && !product.Ingredients.includes(row.Ingredients)) {
                product.Ingredients.push(row.Ingredients);
            }
        }

        res.send({ error: false, data: product });
    });
});

// Testing Insert a product (Normal case)
// status: 200 OK
// method: post
// URL: http://localhost:3030/products
// body: form-data
// (Key) : (Value)
// ProductName : Frozen Burger
// Price : 350
// Brand : Burger Queen
// MFGDate : 2026-01-01
// EXPDate : 2027-01-01
// AdminID : AD789406
// Ingredients : Chicken, Bun, Sauce
// Image (File) : (upload image file)

// Testing Insert a product (Missing field)
// status: 500 Internal Server Error
// method: post
// URL: http://localhost:3030/products
// body: form-data
// (Key) : (Value)
// ProductName : Frozen Lamb
// Price : 100
// Brand : Lamb Queen
// AdminID : AD789407
// Image (File) : (upload image file)

// POST /products — create a product with optional image upload.
router.post('/products', upload.single('Image'), async (req, res) => {
    const { ProductName, Price, Brand, MFGDate, EXPDate, AdminID, Ingredients } = req.body;

    try {
        const newProductID = await generateNextId('Product', 'ProductID', 'PD');

        await db.promise().query(
            'INSERT INTO Product VALUES (?, ?, ?, ?, ?, ?, ?)',
            [newProductID, ProductName, Price, Brand, MFGDate, EXPDate, AdminID]
        );

        if (Ingredients) await replaceIngredients(Ingredients, newProductID);

        if (req.file) {
            const { secure_url } = await uploadToCloudinary(req.file.buffer);
            await saveImage(secure_url, newProductID);
        }

        res.send({ error: false, message: 'Product created', ProductID: newProductID });
    } catch (err) {
        console.error(err);
        res.status(500).send({ error: true, message: err.message });
    }
});

// Testing Update a product (Normal case)
// status: 200 OK
// method: put
// URL: http://localhost:3030/products/PD789401
// body: form-data
// (Key) : (Value)
// ProductName : Chicken Bites
// Price : 789
// Brand : Aro
// MFGDate : 2024-01-01
// EXPDate : 2025-01-01
// AdminID : AD789403
// Ingredients : Chicken, Flour, Oil, Salt
// Image (File) : (upload image file)

// Testing Update a product (Missing field)
// status: 500 Internal Server Error
// method: put
// URL: http://localhost:3030/products/PD789401
// body: form-data
// (Key) : (Value)
// ProductName : Chicken Bites
// Price : 789
// Ingredients : Chicken, Flour, Oil, Salt
// Image (File) : (upload image file)

// PUT /products/:id — update product fields, ingredients, and optionally the image.
router.put('/products/:id', upload.single('Image'), async (req, res) => {
    const { id } = req.params;
    const { ProductName, Price, Brand, MFGDate, EXPDate, AdminID, Ingredients } = req.body;

    try {
        await db.promise().query(
            'UPDATE Product SET ProductName=?, Price=?, Brand=?, MFGDate=?, EXPDate=?, AdminID=? WHERE ProductID=?',
            [ProductName, Price, Brand, MFGDate, EXPDate, AdminID, id]
        );

        if (Ingredients) await replaceIngredients(Ingredients, id);
        if (req.file)    await replaceImage(req.file.buffer, id);

        res.send({ error: false, message: 'Updated' });
    } catch (err) {
        console.error(err);
        res.status(500).send({ error: true, message: err.message });
    }
});

// Testing Delete a product (Normal case)
// status: 200 OK
// method: delete
// URL: http://localhost:3030/products/PD789410
// body: none

// Testing Delete all products (Database table missing)
// status: 500 Internal Server Error
// method: delete
// URL: http://localhost:3030/products/PD789410
// body: none

// DELETE /products/:id — remove product and all related records.
router.delete('/products/:id', async (req, res) => {
    const { id } = req.params;

    try {
        await db.promise().query('DELETE FROM Image            WHERE ProductID = ?', [id]);
        await db.promise().query('DELETE FROM ItemIngredients  WHERE ProductID = ?', [id]);
        await db.promise().query('DELETE FROM Product          WHERE ProductID = ?', [id]);

        res.send({ error: false, message: 'Deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).send({ error: true, message: err.message });
    }
});


// ==========================================
// INGREDIENT ROUTES
// ==========================================

// GET      /ingredients

// Testing Retrieve all ingredients (Normal case)
// status: 200 OK
// method: get
// URL: http://localhost:3030/ingredients
// body: none

// Testing Retrieve all ingredients (Database table missing)
// status: 500 Internal Server Error
// method: get
// URL: http://localhost:3030/ingredients
// body: none

// GET /ingredients — distinct ingredient names, alphabetically sorted.
router.get('/ingredients', (req, res) => {
    queryOrError(res,
        'SELECT DISTINCT Ingredients FROM ItemIngredients ORDER BY Ingredients ASC',
        [],
        (rows) => res.send({ error: false, data: rows.map((r) => r.Ingredients) })
    );
});


// ==========================================
// ADMIN ROUTES
// ==========================================

// GET      /admin/log
// POST     /admin/login

// Testing Retrieve all admin information (Normal case)
// status: 200 OK
// method: get
// URL: http://localhost:3030/admin/log
// body: none

// Testing Retrieve all admin information (Database table missing)
// status: 500 Internal Server Error
// method: get
// URL: http://localhost:3030/admin/log
// body: none

// GET /admin/log — all login attempts, newest first.
router.get('/admin/log', (req, res) => {
    queryOrError(res,
        'SELECT LoginID, Username, myPassword, LoginLog, myRole, AdminID FROM AdminLogin ORDER BY LoginLog DESC',
        [],
        (rows) => res.send({ error: false, data: rows })
    );
});

// Testing Insert all login log (Valid login)
// status: 200 OK
// method: post
// URL: http://localhost:3030/admin/login
// body: raw JSON
// {
//     "Username": "Wudhichart",
//     "myPassword": "Sawangphol"
// }

// Testing Insert all login log (Wrong Username / Password)
// status: 401 Unauthorized
// method: post
// URL: http://localhost:3030/admin/login
// body: raw JSON
// {
//     "Username": "NonAdmin",
//     "myPassword": "One"
// }

// POST /admin/login — authenticate an admin and record the attempt for auditing.
router.post('/admin/login', async (req, res) => {
    const { Username, myPassword } = req.body;

    if (!Username || !myPassword) {
        return res.status(400).send({ error: true, message: 'Missing username or password' });
    }

    try {
        const [rows]    = await db.promise().query(
            'SELECT * FROM Administrator WHERE BINARY Username = ?', [Username]
        );
        const loginID   = await generateNextId('AdminLogin', 'LoginID', 'LG');
        const admin     = rows[0];
        const success   = admin && admin.myPassword === myPassword;

        await db.promise().query(
            `INSERT INTO AdminLogin (LoginID, Username, myPassword, LoginLog, myRole, AdminID)
             VALUES (?, ?, ?, NOW(), ?, ?)`,
            [loginID, Username, myPassword, success ? 'Admin' : null, success ? admin.AdminID : null]
        );

        if (!success) return res.status(401).send({ error: true, message: 'Invalid credentials' });

        res.send({ error: false, message: 'Login success', AdminID: admin.AdminID });
    } catch (err) {
        console.error(err);
        res.status(500).send({ error: true, message: err.message });
    }
});


// ==========================================
// START SERVER
// ==========================================

app.listen(process.env.PORT, () => {
    console.log(`Server running at http://localhost:${process.env.PORT}`);
});