const mysql = require('mysql2');
const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');
const path = require('path');
const cloudinary = require('cloudinary').v2; // 1. Add Cloudinary

const app = express();
const router = express.Router();
const multer = require('multer');

dotenv.config();

// 2. Configure Cloudinary using your .env keys
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
});

// 3. Change Multer to temporary storage instead of local disk storage
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

// ========== Customer APIs ==========
// GET    /customers
// GET    /customers/:id
// POST   /customers

// GET ALL CUSTOMERS
router.get('/customers', (req, res) => {
    db.query("SELECT * FROM Customer", (error, results) => {
        if (error) {
            return res.status(500).send({ error: true, message: error.message });
        }

        return res.send({
            error: false,
            data: results,
            message: 'Customer list'
        });
    });
});

// GET CUSTOMER BY ID
router.get('/customers/:id', (req, res) => {
    const id = req.params.id;

    db.query("SELECT * FROM Customer WHERE CustomerID = ?", [id], (error, results) => {
        if (error) {
            return res.status(500).send({ error: true, message: error.message });
        }

        if (results.length === 0) {
            return res.status(404).send({
                error: true,
                message: 'Customer not found'
            });
        }

        return res.send({
            error: false,
            data: results[0],
            message: 'Customer retrieved'
        });
    });
});

// CREATE CUSTOMER
router.post('/customers', (req, res) => {
    if (!req.body) {
        return res.status(400).send({
            error: true,
            message: 'Request body is missing (send JSON)'
        });
    }

    const {
        FName,
        LName,
        PhoneNumber,
        Email,
        Gender,
        City,
        Province,
        SubDistrict
    } = req.body;

    if (!FName || !LName || !PhoneNumber || !Email || !City || !Province || !SubDistrict) {
        return res.status(400).send({
            error: true,
            message: 'Please provide all required fields'
        });
    }

    const getLastIdSQL = `
        SELECT MAX(CAST(SUBSTRING(CustomerID, 3) AS INT)) AS lastId
        FROM Customer
    `;

    db.query(getLastIdSQL, (error, result) => {
        if (error) {
            return res.status(500).send({ error: true, message: error.message });
        }

        let nextIdNumber = 1;

        if (result[0].lastId) {
            nextIdNumber = result[0].lastId + 1;
        }

        const newCustomerID = 'CT' + nextIdNumber;

        db.query(
            `INSERT INTO Customer VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [newCustomerID, FName, LName, PhoneNumber, Email, Gender, City, Province, SubDistrict],
            (error) => {
                if (error) {
                    return res.status(500).send({ error: true, message: error.message });
                }

                return res.send({
                    error: false,
                    CustomerID: newCustomerID,
                    message: 'Customer created successfully'
                });
            }
        );
    });
});
// ========== Member APIs ==========
// GET    /members
// GET    /members/:customerId
// POST   /members

// ========== Product APIs ==========
// GET    /products
// GET    /products/:id
// GET    /products/search
// POST   /products
// PUT    /products/:id
// DELETE /products/:id

// GET ALL PRODUCTS
router.get('/products', (req, res) => {
    const sql = `
        SELECT 
            p.ProductID,
            p.ProductName,
            p.Price,
            p.Brand,
            p.Barcode,
            p.MFGDate,
            p.EXPDate,
            p.AdminID,
            i.ImageID,
            i.ImageURL
        FROM Product p
        LEFT JOIN Image i ON p.ProductID = i.ProductID
    `;

    db.query(sql, (error, results) => {
        if (error) {
            return res.status(500).send({
                error: true,
                message: error.message
            });
        }

        // Group data
        const products = {};

        results.forEach(row => {
            if (!products[row.ProductID]) {
                products[row.ProductID] = {
                    ProductID: row.ProductID,
                    ProductName: row.ProductName,
                    Price: row.Price,
                    Brand: row.Brand,
                    Barcode: row.Barcode,
                    MFGDate: row.MFGDate,
                    EXPDate: row.EXPDate,
                    AdminID: row.AdminID,
                    Images: []
                };
            }

            // push image if exists
            if (row.ImageID) {
                products[row.ProductID].Images.push({
                    ImageID: row.ImageID,
                    ImageURL: row.ImageURL
                });
            }
        });

        return res.send({
            error: false,
            data: Object.values(products),
            message: 'Product list with images (grouped)'
        });
    });
});

// SEARCH PRODUCT
router.get('/products/search', (req, res) => {
    const { minPrice, maxPrice, brand, ingredient } = req.query;

    if (!minPrice || !maxPrice || !brand || !ingredient) {
        return res.status(400).send({
            error: true,
            message: 'Please provide minPrice, maxPrice, brand, ingredient'
        });
    }

    const sql = `
        SELECT 
            p.ProductID,
            p.ProductName,
            p.Price,
            p.Brand,
            p.Barcode,
            p.MFGDate,
            p.EXPDate,
            p.AdminID,
            i.ImageID,
            i.ImageURL
        FROM Product p
        LEFT JOIN ItemIngredients ing ON p.ProductID = ing.ProductID
        LEFT JOIN Image i ON p.ProductID = i.ProductID
        WHERE p.Price BETWEEN ? AND ?
          AND p.Brand = ?
          AND ing.Ingredients LIKE ?
    `;

    const params = [minPrice, maxPrice, brand, `%${ingredient}%`];

    db.query(sql, params, (error, results) => {
        if (error) {
            return res.status(500).send({
                error: true,
                message: error.message
            });
        }

        if (results.length === 0) {
            return res.status(404).send({
                error: true,
                message: 'Product not found'
            });
        }

        // GROUP DATA (same as before)
        const products = {};

        results.forEach(row => {
            if (!products[row.ProductID]) {
                products[row.ProductID] = {
                    ProductID: row.ProductID,
                    ProductName: row.ProductName,
                    Price: row.Price,
                    Brand: row.Brand,
                    Barcode: row.Barcode,
                    MFGDate: row.MFGDate,
                    EXPDate: row.EXPDate,
                    AdminID: row.AdminID,
                    Images: []
                };
            }

            if (row.ImageID) {
                products[row.ProductID].Images.push({
                    ImageID: row.ImageID,
                    ImageURL: row.ImageURL
                });
            }
        });

        return res.send({
            error: false,
            data: Object.values(products),
            message: 'Filtered products with images'
        });
    });
});

// GET PRODUCT BY ID
router.get('/products/:id', (req, res) => {
    const product_id = req.params.id;

    const sql = `
        SELECT p.*, i.ImageID, i.ImageURL
        FROM Product p
        LEFT JOIN Image i ON p.ProductID = i.ProductID
        WHERE p.ProductID = ?
    `;

    db.query(sql, [product_id], (error, results) => {
        if (error) {
            return res.status(500).send({
                error: true,
                message: error.message
            });
        }

        if (results.length === 0) {
            return res.status(404).send({
                error: true,
                message: 'Product not found'
            });
        }

        const product = {
            ProductID: results[0].ProductID,
            ProductName: results[0].ProductName,
            Price: results[0].Price,
            Brand: results[0].Brand,
            Barcode: results[0].Barcode,
            MFGDate: results[0].MFGDate,
            EXPDate: results[0].EXPDate,
            AdminID: results[0].AdminID,
            Images: []
        };

        results.forEach(row => {
            if (row.ImageID) {
                product.Images.push({
                    ImageID: row.ImageID,
                    ImageURL: row.ImageURL
                });
            }
        });

        return res.send({
            error: false,
            data: product,
            message: 'Product with images'
        });
    });
});

// Add PRODUCT
// Add PRODUCT
router.post('/products', upload.single('image'), async (req, res) => {
    const {
        ProductID,
        ProductName,
        Price,
        Brand,
        Barcode,
        MFGDate,
        EXPDate,
        AdminID
    } = req.body;

    if (!ProductID || !ProductName || !Price || !Brand || !Barcode || !MFGDate || !EXPDate || !AdminID) {
        return res.status(400).send({
            error: true,
            message: 'Missing product fields'
        });
    }

    let imageUrl = null;

    // 1. Upload to Cloudinary if an image file was sent in the request
    if (req.file) {
        try {
            const result = await cloudinary.uploader.upload(req.file.path);
            imageUrl = result.secure_url; // Get the Cloudinary URL
        } catch (uploadError) {
            return res.status(500).send({
                error: true,
                message: 'Failed to upload image to Cloudinary: ' + uploadError.message
            });
        }
    }

    // 2. Insert Product into the database first
    const productSQL = `
        INSERT INTO Product 
        (ProductID, ProductName, Price, Brand, Barcode, MFGDate, EXPDate, AdminID)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(productSQL,
        [ProductID, ProductName, Price, Brand, Barcode, MFGDate, EXPDate, AdminID],
        (error) => {
            if (error) {
                return res.status(500).send({ error: true, message: error.message });
            }

            // If no image was uploaded, we are done
            if (!imageUrl) {
                return res.send({
                    error: false,
                    message: 'Product created (no image)'
                });
            }

            // 3. Generate ImageID
            const getLastIdSQL = `
                SELECT MAX(CAST(SUBSTRING(ImageID, 3) AS UNSIGNED)) AS lastId
                FROM Image
            `;
            db.query(getLastIdSQL, (err, result) => {
                if (err) {
                    return res.status(500).send({ error: true, message: err.message });
                }

                let next = (result[0].lastId || 789400) + 1;
                const newImageID = 'IM' + next;
                
                // Format date for MySQL DATETIME
                const uploadDate = new Date().toISOString().slice(0, 19).replace('T', ' '); 

                // 4. Insert Image with Cloudinary URL
                const imageSQL = `
                    INSERT INTO Image 
                    (ImageID, myDescription, UploadDate, ImageURL, ProductID)
                    VALUES (?, ?, ?, ?, ?)
                `;

                db.query(imageSQL,
                    [newImageID, 'Product image', uploadDate, imageUrl, ProductID],
                    (err2) => {
                        if (err2) {
                            return res.status(500).send({
                                error: true,
                                message: err2.message
                            });
                        }

                        return res.send({
                            error: false,
                            message: 'Product + Image uploaded to Cloud successfully',
                            ProductID,
                            ImageURL: imageUrl
                        });
                    }
                );
            });
        }
    );
});

// UPDATE PRODUCT
router.put('/products/:id', (req, res) => {
    if (!req.body) {
        return res.status(400).send({
            error: true,
            message: 'Request body is missing (send JSON)'
        });
    }

    let product_id = req.params.id;

    const {
        ProductName,
        Price,
        Brand,
        Barcode,
        MFGDate,
        EXPDate,
        AdminID
    } = req.body;

    db.query(`UPDATE Product
        SET ProductName=?, Price=?, Brand=?, Barcode=?, MFGDate=?, EXPDate=?, AdminID=? WHERE ProductID=?`,
        [ProductName, Price, Brand, Barcode, MFGDate, EXPDate, AdminID, product_id], (error) => {
            if (error) {
                return res.status(500).send({
                    error: true,
                    message: error.message
                });
            }

            return res.send({
                error: false,
                message: 'Product updated successfully'
            });
        }
    );
});

// DELETE PRODUCT
router.delete('/products/:id', (req, res) => {
    let product_id = req.params.id;

    db.query("DELETE FROM Product WHERE ProductID = ?", [product_id], (error) => {
        if (error) {
            return res.status(500).send({
                error: true,
                message: error.message
            });
        }

        return res.send({
            error: false,
            message: 'Product deleted successfully'
        });
    });
});

// ========== Image APIs ==========
// GET /products/:id/images

// GET IMAGES
router.get('/products/:id/images', (req, res) => {
    const product_id = req.params.id;

    db.query(
        "SELECT * FROM Image WHERE ProductID = ?",
        [product_id],
        (error, results) => {
            if (error) {
                return res.status(500).send({
                    error: true,
                    message: error.message
                });
            }

            if (results.length === 0) {
                return res.status(404).send({
                    error: true,
                    message: 'Product images not found'
                });
            }

            return res.send({
                error: false,
                data: results,
                message: 'Product images'
            });
        }
    );
});

// ========== Order APIs ==========
// GET    /orders
// POST   /orders
// GET    /orders/:customerId

// GET ALL ORDERS
router.get('/orders', (req, res) => {
    const sql = `
        SELECT o.*, 
               c.FName, c.LName,
               p.ProductName, p.Price
        FROM myOrder o
        JOIN Customer c ON o.CustomerID = c.CustomerID
        JOIN Product p ON o.ProductID = p.ProductID
    `;

    db.query(sql, (error, results) => {
        if (error) {
            return res.status(500).send({
                error: true,
                message: error.message
            });
        }

        return res.send({
            error: false,
            data: results,
            message: results.length ? 'Order list' : 'No orders found'
        });
    });
});

// GET ORDERS BY CUSTOMER
router.get('/orders/customer/:customerId', (req, res) => {
    const customerId = req.params.customerId;

    const sql = `
        SELECT o.*, 
               p.ProductName, p.Price
        FROM myOrder o
        JOIN Product p ON o.ProductID = p.ProductID
        WHERE o.CustomerID = ?
    `;

    db.query(sql, [customerId], (error, results) => {
        if (error) {
            return res.status(500).send({
                error: true,
                message: error.message
            });
        }

        return res.send({
            error: false,
            data: results,
            message: results.length
                ? 'Customer orders'
                : 'No orders for this customer'
        });
    });
});

// GET ORDER BY ORDER ID
router.get('/orders/:orderId', (req, res) => {
    const orderId = req.params.orderId;

    const sql = `
        SELECT o.*, 
               c.FName, c.LName,
               p.ProductName, p.Price
        FROM myOrder o
        JOIN Customer c ON o.CustomerID = c.CustomerID
        JOIN Product p ON o.ProductID = p.ProductID
        WHERE o.OrderID = ?
    `;

    db.query(sql, [orderId], (error, results) => {
        if (error) {
            return res.status(500).send({
                error: true,
                message: error.message
            });
        }

        if (results.length === 0) {
            return res.status(404).send({
                error: true,
                message: 'Order not found'
            });
        }

        return res.send({
            error: false,
            data: results[0], // single object
            message: 'Order details'
        });
    });
});

// CREATE ORDER
router.post('/orders', (req, res) => {
    if (!req.body) {
        return res.status(400).send({
            error: true,
            message: 'Request body is missing (send JSON)'
        });
    }

    const body = req.body;

    const {
        CustomerID,
        ProductID,
        PaymentID,
        OrderStatus
    } = body;

    if (!CustomerID || !ProductID || !PaymentID || !OrderStatus) {
        return res.status(400).send({
            error: true,
            message: 'Please provide all required fields'
        });
    }

    const getLastIdSQL = `
        SELECT MAX(CAST(SUBSTRING(OrderID, 7) AS UNSIGNED)) AS lastId
        FROM myOrder
        WHERE OrderID LIKE 'OR5418%'
    `;

    db.query(getLastIdSQL, (err, result) => {
        if (err) {
            return res.status(500).send({ error: true, message: err.message });
        }

        let next = (result[0].lastId || 0) + 1;
        const newOrderID = 'OR5418' + String(next).padStart(2, '0');

        const OrderDate = new Date();

        const sql = `
            INSERT INTO myOrder 
            (OrderID, CustomerID, ProductID, PaymentID, OrderStatus, OrderDate)
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        db.query(sql,
            [newOrderID, CustomerID, ProductID, PaymentID, OrderStatus, OrderDate],
            (error) => {
                if (error) {
                    return res.status(500).send({
                        error: true,
                        message: error.message
                    });
                }

                return res.send({
                    error: false,
                    OrderID: newOrderID,
                    message: 'Order created successfully'
                });
            }
        );
    });
});

// ========== Payment APIs ==========
// POST   /payments
// GET    /payments/:id

// CREATE PAYMENT
router.post('/payments', (req, res) => {
    if (!req.body) {
        return res.status(400).send({
            error: true,
            message: 'Request body is missing (send JSON)'
        });
    }

    const body = req.body;

    const {
        PaymentStatus,
        PaymentMethod
    } = body;

    if (!PaymentStatus || !PaymentMethod) {
        return res.status(400).send({
            error: true,
            message: 'Please provide PaymentStatus and PaymentMethod'
        });
    }

    const getLastIdSQL = `
        SELECT MAX(CAST(SUBSTRING(PaymentID, 3) AS UNSIGNED)) AS lastId
        FROM Payment
    `;

    db.query(getLastIdSQL, (error, result) => {
        if (error) {
            return res.status(500).send({ error: true, message: error.message });
        }

        let next = (result[0].lastId || 789400) + 1;
        const newPaymentID = 'PM' + next;

        const PaymentDate = new Date();

        const sql = `
            INSERT INTO Payment 
            (PaymentID, PaymentStatus, PaymentDate, PaymentMethod)
            VALUES (?, ?, ?, ?)
        `;

        db.query(sql,
            [newPaymentID, PaymentStatus, PaymentDate, PaymentMethod],
            (error) => {
                if (error) {
                    return res.status(500).send({
                        error: true,
                        message: error.message
                    });
                }

                return res.send({
                    error: false,
                    PaymentID: newPaymentID,
                    message: 'Payment created successfully'
                });
            }
        );
    });
});

// GET PAYMENTS BY ID
router.get('/payments/:id', (req, res) => {
    const id = req.params.id;

    db.query(
        "SELECT * FROM Payment WHERE PaymentID = ?",
        [id],
        (error, results) => {

            if (error) {
                return res.status(500).send({
                    error: true,
                    message: error.message
                });
            }

            if (results.length === 0) {
                return res.status(404).send({
                    error: true,
                    message: 'Payment not found'
                });
            }

            return res.send({
                error: false,
                data: results[0],
                message: 'Payment retrieved'
            });
        }
    );
});

// ========== Admin APIs ==========
// GET    /admins
// GET    /admins/:id
// POST   /admins
// POST   /admin/login

// GET ALL ADMINS
router.get('/admins', (req, res) => {
    db.query("SELECT * FROM Administrator", (error, results) => {
        if (error) {
            return res.status(500).send({
                error: true,
                message: error.message
            });
        }

        return res.send({
            error: false,
            data: results,
            message: 'Admin list'
        });
    });
});

// GET ADMIN BY ID
router.get('/admins/:id', (req, res) => {
    const id = req.params.id;

    db.query("SELECT * FROM Administrator WHERE AdminID = ?", [id], (error, results) => {
        if (error) {
            return res.status(500).send({
                error: true,
                message: error.message
            });
        }

        if (results.length === 0) {
            return res.status(404).send({
                error: true,
                message: 'Admin not found'
            });
        }

        return res.send({
            error: false,
            data: results[0],
            message: 'Admin retrieved'
        });
    });
});

// CREATE ADMIN
router.post('/admins', (req, res) => {
    if (!req.body) {
        return res.status(400).send({
            error: true,
            message: 'Request body is missing'
        });
    }

    const { Username, myPassword, PhoneNumber, Email, Gender } = req.body;

    if (!Username || !myPassword || !PhoneNumber || !Email) {
        return res.status(400).send({
            error: true,
            message: 'Please provide all required fields'
        });
    }

    const getLastIdSQL = `
        SELECT MAX(CAST(SUBSTRING(AdminID, 3) AS UNSIGNED)) AS lastId
        FROM Administrator
    `;

    db.query(getLastIdSQL, (error, result) => {
        if (error) {
            return res.status(500).send({ error: true, message: error.message });
        }

        let next = (result[0].lastId || 789400) + 1;
        const newAdminID = 'AD' + next;

        db.query(
            `INSERT INTO Administrator VALUES (?, ?, ?, ?, ?, ?)`,
            [newAdminID, Username, myPassword, PhoneNumber, Email, Gender],
            (error) => {
                if (error) {
                    return res.status(500).send({
                        error: true,
                        message: error.message
                    });
                }

                return res.send({
                    error: false,
                    AdminID: newAdminID,
                    message: 'Admin created successfully'
                });
            }
        );
    });
});

// ADMIN LOGIN
router.post('/admin/login', (req, res) => {
    if (!req.body) {
        return res.status(400).send({
            error: true,
            message: 'Request body is missing'
        });
    }

    const { Username, myPassword } = req.body;

    if (!Username || !myPassword) {
        return res.status(400).send({
            error: true,
            message: 'Please provide Username and Password'
        });
    }

    // check login
    const sql = `
        SELECT * FROM Administrator
        WHERE Username = ? AND myPassword = ?
    `;

    db.query(sql, [Username, myPassword], (error, results) => {
        if (error) {
            return res.status(500).send({
                error: true,
                message: error.message
            });
        }

        let LoginID;
        const LoginLog = new Date();

        // generate LoginID
        const getLastIdSQL = `
            SELECT MAX(CAST(SUBSTRING(LoginID, 3) AS UNSIGNED)) AS lastId
            FROM AdminLogin
        `;

        db.query(getLastIdSQL, (err, result) => {
            if (err) {
                return res.status(500).send({ error: true, message: err.message });
            }

            let next = (result[0].lastId || 789400) + 1;
            LoginID = 'LG' + next;

            // SUCCESS LOGIN
            if (results.length > 0) {
                const admin = results[0];

                db.query(
                    `INSERT INTO AdminLogin 
                    (LoginID, Username, myPassword, LoginLog, myRole, AdminID)
                    VALUES (?, ?, ?, ?, ?, ?)`,
                    [LoginID, Username, myPassword, LoginLog, 'Staff', admin.AdminID],
                    (err2) => {
                        if (err2) {
                            return res.status(500).send({
                                error: true,
                                message: err2.message
                            });
                        }

                        return res.send({
                            error: false,
                            message: 'Login successful',
                            AdminID: admin.AdminID
                        });
                    }
                );
            } 
            // FAILED LOGIN
            else {
                db.query(
                    `INSERT INTO AdminLogin 
                    (LoginID, Username, myPassword, LoginLog, myRole, AdminID)
                    VALUES (?, ?, ?, ?, ?, ?)`,
                    [LoginID, Username, myPassword, LoginLog, null, null],
                    () => {}

                );

                return res.status(401).send({
                    error: true,
                    message: 'Invalid username or password'
                });
            }
        });
    });
});

router.get('/images/products/:filename', (req, res) => {
    const filename = req.params.filename;

    const filePath = path.join(__dirname, 'images', 'products', filename);

    res.sendFile(filePath, (err) => {
        if (err) {
            res.status(404).send({
                error: true,
                message: 'Image not found'
            });
        }
    });
});

app.listen(process.env.PORT, () => {
    console.log(`Server running at http://localhost:${process.env.PORT}`);
});