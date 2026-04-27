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
    dateStrings: true,   // Return dates as 'YYYY-MM-DD' strings instead of Date objects
});

db.connect((error) => {
    if (error) throw error;
    console.log(`Connected to DB: ${process.env.DB_NAME}`);
});


// ==========================================
// CLOUDINARY (image hosting)
// ==========================================

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Keep uploaded files in memory — no temporary files written to disk.
const upload = multer({ storage: multer.memoryStorage() });

/**
 * Streams a file buffer directly to Cloudinary and resolves with the upload result.
 * @param {Buffer} buffer - Raw file bytes from multer's memoryStorage.
 * @returns {Promise<object>} Cloudinary upload result (includes secure_url).
 */
function uploadToCloudinary(buffer) {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { resource_type: 'auto' },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );
        stream.end(buffer);
    });
}


// ==========================================
// HELPERS
// ==========================================

/**
 * Collapses a flat list of JOIN rows into a map of products,
 * each with a nested Images array.
 *
 * @param {object[]} rows - Raw rows from a Product LEFT JOIN Image query.
 * @returns {object[]} Deduplicated product objects.
 */
function groupProductImages(rows) {
    const products = {};
    rows.forEach((row) => {
        if (!products[row.ProductID]) {
            const { ImageID, ImageURL, ...productFields } = row;
            products[row.ProductID] = { ...productFields, Images: [] };
        }
        if (row.ImageID) {
            products[row.ProductID].Images.push({
                ImageID:  row.ImageID,
                ImageURL: row.ImageURL,
            });
        }
    });
    return Object.values(products);
}

/**
 * Generates the next sequential ID for a given table and prefix.
 * Pattern: <PREFIX><number>, e.g. "PD789401", "LG789401".
 *
 * @param {string} table  - Table name to query.
 * @param {string} column - ID column name.
 * @param {string} prefix - Two-character prefix to strip/prepend.
 * @param {number} [base=789400] - Fallback starting number when the table is empty.
 * @returns {Promise<string>} The next ID string.
 */
function generateNextId(table, column, prefix, base = 789400) {
    return new Promise((resolve, reject) => {
        const sql = `SELECT MAX(CAST(SUBSTRING(${column}, 3) AS UNSIGNED)) AS lastId FROM ${table}`;
        db.query(sql, (err, result) => {
            if (err) return reject(err);
            resolve(prefix + ((result[0].lastId || base) + 1));
        });
    });
}

/**
 * Parses a comma-separated ingredients string into a trimmed, non-empty array.
 * @param {string} [raw] - e.g. " Sugar, Salt, Milk "
 * @returns {string[]}
 */
function parseIngredients(raw) {
    if (!raw) return [];
    return raw.split(',').map((s) => s.trim()).filter(Boolean);
}


// ==========================================
// PRODUCT ROUTES
// ==========================================

/**
 * GET /products
 * Returns all products with their associated images.
 */
router.get('/products', (req, res) => {
    const sql = `
        SELECT p.*, i.ImageID, i.ImageURL
        FROM Product p
        LEFT JOIN Image i ON p.ProductID = i.ProductID
    `;
    db.query(sql, (error, results) => {
        if (error) return res.status(500).send({ error: true, message: error.message });
        res.send({ error: false, data: groupProductImages(results) });
    });
});

/**
 * GET /products/search
 * Searches products by any combination of: name, price range, brand, ingredient.
 * Query params: name, minPrice, maxPrice, brand, ingredient
 */
router.get('/products/search', (req, res) => {
    const { name, minPrice, maxPrice, brand, ingredient } = req.query;

    // Build the WHERE clause dynamically based on which filters were supplied.
    let sql = `
        SELECT p.*, i.ImageID, i.ImageURL
        FROM Product p
        LEFT JOIN Image i   ON p.ProductID = i.ProductID
        LEFT JOIN ItemIngredients ing ON p.ProductID = ing.ProductID
        WHERE 1=1
    `;
    const params = [];

    if (name)                    { sql += ' AND p.ProductName LIKE ?';              params.push(`%${name}%`); }
    if (minPrice && maxPrice)    { sql += ' AND p.Price BETWEEN ? AND ?';           params.push(minPrice, maxPrice); }
    if (brand)                   { sql += ' AND LOWER(p.Brand) = LOWER(?)';         params.push(brand); }
    if (ingredient)              { sql += ' AND ing.Ingredients LIKE ?';            params.push(`%${ingredient}%`); }

    db.query(sql, params, (error, results) => {
        if (error) return res.status(500).send({ error: true, message: error.message });
        res.send({ error: false, data: groupProductImages(results) });
    });
});

/**
 * GET /products/:id
 * Returns a single product with its images and ingredients.
 */
router.get('/products/:id', (req, res) => {
    const sql = `
        SELECT p.*, i.ImageID, i.ImageURL, ing.Ingredients
        FROM Product p
        LEFT JOIN Image i            ON p.ProductID = i.ProductID
        LEFT JOIN ItemIngredients ing ON p.ProductID = ing.ProductID
        WHERE p.ProductID = ?
    `;
    db.query(sql, [req.params.id], (error, results) => {
        if (error) return res.status(500).send({ error: true, message: error.message });
        if (results.length === 0) return res.status(404).send({ error: true, message: 'Not found' });

        // Build a single product object, deduplicating images and ingredients.
        const { ImageID, ImageURL, ...productFields } = results[0];
        const product = { ...productFields, Images: [], Ingredients: [] };

        results.forEach((row) => {
            if (row.ImageID && !product.Images.find((img) => img.ImageID === row.ImageID)) {
                product.Images.push({ ImageID: row.ImageID, ImageURL: row.ImageURL });
            }
            if (row.Ingredients && !product.Ingredients.includes(row.Ingredients)) {
                product.Ingredients.push(row.Ingredients);
            }
        });

        res.send({ error: false, data: product });
    });
});

/**
 * POST /products
 * Creates a new product, optionally uploading an image to Cloudinary.
 * Body (multipart/form-data): ProductName, Price, Brand, MFGDate, EXPDate, AdminID, Ingredients
 * File field: image
 */
router.post('/products', upload.single('image'), async (req, res) => {
    const { ProductName, Price, Brand, MFGDate, EXPDate, AdminID, Ingredients } = req.body;
    const ingredientsArray = parseIngredients(Ingredients);

    try {
        // Generate a new sequential product ID.
        const newProductID = await generateNextId('Product', 'ProductID', 'PD');

        // Upload image to Cloudinary if one was attached.
        let imageUrl = null;
        if (req.file) {
            const result = await uploadToCloudinary(req.file.buffer);
            imageUrl = result.secure_url;
        }

        // Insert the core product record.
        await db.promise().query(
            'INSERT INTO Product VALUES (?, ?, ?, ?, ?, ?, ?)',
            [newProductID, ProductName, Price, Brand, MFGDate, EXPDate, AdminID]
        );

        // Insert ingredients (if any) as separate rows in ItemIngredients.
        if (ingredientsArray.length > 0) {
            const values = ingredientsArray.map((ing) => [ing, newProductID]);
            await db.promise().query(
                'INSERT INTO ItemIngredients (Ingredients, ProductID) VALUES ?',
                [values]
            );
        }

        // Insert the image record (if an image was uploaded).
        if (imageUrl) {
            const imgID = 'IM' + (Date.now() % 1000000);
            await db.promise().query(
                'INSERT INTO Image (ImageID, myDescription, UploadDate, ImageURL, ProductID) VALUES (?, ?, NOW(), ?, ?)',
                [imgID, 'Product image', imageUrl, newProductID]
            );
        }

        res.send({ error: false, message: 'Product created', ProductID: newProductID });
    } catch (err) {
        console.error(err);
        res.status(500).send({ error: true, message: err.message });
    }
});

/**
 * PUT /products/:id
 * Updates an existing product's fields, ingredients, and optionally its image.
 * Body (multipart/form-data): ProductName, Price, Brand, MFGDate, EXPDate, AdminID, Ingredients
 * File field: image (optional — only replaces if a new file is attached)
 */
router.put('/products/:id', upload.single('image'), async (req, res) => {
    const { id } = req.params;
    const { ProductName, Price, Brand, MFGDate, EXPDate, AdminID, Ingredients } = req.body;

    try {
        // Update core product fields.
        await db.promise().query(
            'UPDATE Product SET ProductName=?, Price=?, Brand=?, MFGDate=?, EXPDate=?, AdminID=? WHERE ProductID=?',
            [ProductName, Price, Brand, MFGDate, EXPDate, AdminID, id]
        );

        // Replace all ingredients: delete existing rows, then re-insert.
        if (Ingredients) {
            const arr = parseIngredients(Ingredients);
            await db.promise().query('DELETE FROM ItemIngredients WHERE ProductID = ?', [id]);
            if (arr.length > 0) {
                await db.promise().query(
                    'INSERT INTO ItemIngredients (Ingredients, ProductID) VALUES ?',
                    [arr.map((ing) => [ing, id])]
                );
            }
        }

        // Replace the product image only when a new file is uploaded.
        if (req.file) {
            const result  = await uploadToCloudinary(req.file.buffer);
            const imageUrl = result.secure_url;
            const imgID    = 'IM' + (Date.now() % 1000000);

            await db.promise().query('DELETE FROM Image WHERE ProductID = ?', [id]);
            await db.promise().query(
                'INSERT INTO Image (ImageID, myDescription, UploadDate, ImageURL, ProductID) VALUES (?, ?, NOW(), ?, ?)',
                [imgID, 'Product image', imageUrl, id]
            );
        }

        res.send({ error: false, message: 'Updated' });
    } catch (err) {
        console.error(err);
        res.status(500).send({ error: true, message: err.message });
    }
});

/**
 * DELETE /products/:id
 * Removes a product and all its related records (images, ingredients, orders).
 * Deletions are performed in dependency order to satisfy foreign-key constraints.
 */
router.delete('/products/:id', async (req, res) => {
    const { id } = req.params;

    try {
        await db.promise().query('DELETE FROM Image WHERE ProductID = ?', [id]);
        await db.promise().query('DELETE FROM ItemIngredients WHERE ProductID = ?', [id]);

        // แล้วค่อยลบ parent
        await db.promise().query('DELETE FROM Product WHERE ProductID = ?', [id]);

        res.send({ error: false, message: 'Deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).send({ error: true, message: err.message });
    }
});


// ==========================================
// INGREDIENT ROUTES
// ==========================================

/**
 * GET /ingredients
 * Returns a distinct, alphabetically sorted list of all ingredient names.
 */
router.get('/ingredients', (req, res) => {
    const sql = `
        SELECT DISTINCT Ingredients
        FROM ItemIngredients
        ORDER BY Ingredients ASC
    `;
    db.query(sql, (error, results) => {
        if (error) return res.status(500).send({ error: true, message: error.message });
        res.send({ error: false, data: results.map((row) => row.Ingredients) });
    });
});


// ==========================================
// ADMIN ROUTES
// ==========================================
// ==========================================
// ADMIN LOG ROUTE
// ==========================================

router.get('/admin/log', (req, res) => {
    const sql = `
        SELECT 
            LoginID,
            Username,
            LoginLog,
            myRole,
            AdminID
        FROM AdminLogin
        ORDER BY LoginLog DESC
    `;

    db.query(sql, (error, results) => {
        if (error) {
            return res.status(500).send({
                error: true,
                message: error.message
            });
        }

        res.send({
            error: false,
            data: results
        });
    });
});

/**
 * POST /admin/login
 * Authenticates an admin user and records the login attempt in AdminLogin
 * regardless of success or failure (for audit purposes).
 * Body (JSON): { Username, myPassword }
 */
router.post('/admin/login', async (req, res) => {
    const { Username, myPassword } = req.body;

    if (!Username || !myPassword) {
        return res.status(400).send({ error: true, message: 'Missing username or password' });
    }

    try {
        // Look up the admin by username (case-sensitive via BINARY).
        const [results] = await db.promise().query(
            'SELECT * FROM Administrator WHERE BINARY Username = ?',
            [Username]
        );

        // Generate a sequential login-attempt ID for audit logging.
        const loginID = await generateNextId('AdminLogin', 'LoginID', 'LG');

        const admin          = results[0];
        const credentialsOk  = admin && admin.myPassword === myPassword;

        if (!credentialsOk) {
            // Log the failed attempt (role and AdminID left NULL).
            await db.promise().query(
                `INSERT INTO AdminLogin (LoginID, Username, myPassword, LoginLog, myRole, AdminID)
                 VALUES (?, ?, ?, NOW(), NULL, NULL)`,
                [loginID, Username, myPassword]
            );
            return res.status(401).send({ error: true, message: 'Invalid credentials' });
        }

        // Log the successful attempt.
        await db.promise().query(
            `INSERT INTO AdminLogin (LoginID, Username, myPassword, LoginLog, myRole, AdminID)
             VALUES (?, ?, ?, NOW(), ?, ?)`,
            [loginID, Username, myPassword, 'Admin', admin.AdminID]
        );

        return res.send({ error: false, message: 'Login success', AdminID: admin.AdminID });
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