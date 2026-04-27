DROP DATABASE IF EXISTS sec1_gr02_database;
CREATE DATABASE IF NOT EXISTS sec1_gr02_database;
USE sec1_gr02_database;

SELECT * FROM Product;
SELECT * FROM Image;
SELECT * FROM Administrator;
SELECT * FROM AdminLogin;
SELECT * FROM ItemIngredients;

CREATE TABLE Administrator (
    AdminID 	CHAR(8)			NOT NULL,
    Username 		VARCHAR(50)		NOT NULL,
    myPassword 		VARCHAR(50)		NOT NULL,
    PhoneNumber VARCHAR(10)		NOT NULL,
    Email 		VARCHAR(100)	NOT NULL,
    Gender 		CHAR(1)			,

    CONSTRAINT PK_Administrator PRIMARY KEY (AdminID)
);

INSERT INTO Administrator VALUES
('AD789401','Napat','Tayommai','0830801181','napat.tao@student.mahidol.edu','M'),
('AD789402','Kritsakorn','Thammas','0884764338','kritsakorn.thm@student.mahidol.edu','M'),
('AD789403','Tantikorn','Lapkloyma','0124567812','tantikorn.lak@student.mahidol.edu','M'),
('AD789404','Thanapat','Wongthongtham','0942647851','thanapat.wog@student.mahidol.edu','M'),
('AD789405','Chutchanun','Jirapapongpun','0237891543','chutchanun.jir@student.mahidol.edu','M'),
('AD789406','Wudhichart','Sawangphol','0246025789','wudhichart.saw@mahidol.ac.th','M'),
('AD789407','Jidapa','Kraisangka','0542647852','jidapa.kra@mahidol.ac.th','F');

CREATE TABLE Product (
    ProductID   CHAR(8)         NOT NULL,
    ProductName VARCHAR(50)     NOT NULL,
    Price       DECIMAL(10,2)   NOT NULL,
    Brand       VARCHAR(20)     NOT NULL,
    MFGDate     DATE            NOT NULL,
    EXPDate     DATE            NOT NULL,
    AdminID     CHAR(8)         NOT NULL,

    CONSTRAINT PK_Product PRIMARY KEY (ProductID),

    CONSTRAINT FK_Product FOREIGN KEY (AdminID)
    REFERENCES Administrator(AdminID)
);

INSERT INTO Product VALUES
('PD789401','Crispy Chicken',120.00,'CP','2024-01-01','2025-01-01','AD789401'),
('PD789402','Frozen Pork',150.00,'CP','2024-01-01','2025-01-01','AD789402'),
('PD789403','Frozen Shrimp',200.00,'Seafood','2024-01-01','2025-01-01','AD789403'),
('PD789404','French Fries',90.00,'ARO','2024-01-01','2025-01-01','AD789404'),
('PD789405','Frozen Pizza',180.00,'ARO','2024-01-01','2025-01-01','AD789405'),
('PD789406','Frozen Beef',290.00,'CP','2024-01-01','2025-01-01','AD789406'),
('PD789407','Chicken Wing',375.00,'Aro','2024-01-01','2025-01-01','AD789407'),
('PD789408','Frozen Squid',200.00,'Savepack','2024-01-01','2025-01-01','AD789401'),
('PD789409','Pork Dumpling',160.00,'CP','2024-01-01','2025-01-01','AD789402'),
('PD789410','Frozen Donut shrimp',160.00,'CP','2024-01-01','2025-01-01','AD789403');



CREATE TABLE AdminLogin (
    LoginID     CHAR(8)         NOT NULL,
    Username    VARCHAR(255)    NOT NULL,
    myPassword  VARCHAR(255)    NOT NULL,
    LoginLog    DATETIME        NOT NULL,
    myRole      VARCHAR(20),
    AdminID     CHAR(8),

    CONSTRAINT PK_AdminLogin PRIMARY KEY (LoginID),

    CONSTRAINT FK_AdminLogin FOREIGN KEY (AdminID)
	REFERENCES Administrator(AdminID)
);

INSERT INTO AdminLogin VALUES
('LG789401','Admin1','One','2024-06-01 08:15:23','Manager','AD789401'),
('LG789402','Admin2','Two','2024-06-01 09:05:10','Staff','AD789402'),
('LG789403','Admin3','Three','2024-06-02 10:22:45','Staff','AD789403'),
('LG789404','Admin4','Four','2024-06-02 11:30:55','Manager','AD789404'),
('LG789405','Admin5','Five','2024-06-03 13:10:05','Staff','AD789405'),
('LG789406','Admin6','Six','2024-06-03 14:45:20','Staff','AD789406'),
('LG789407','Admin7','Seven','2024-06-04 15:55:33','Manager','AD789407'),
('LG789408','Admin8','Eight','2024-06-04 16:20:18','Staff','AD789401'),
('LG789409','Admin9','Nine','2024-06-05 17:40:00','Staff','AD789402'),
('LG789410','Admin10','Ten','2024-06-05 18:05:12','Manager','AD789403'),

('LG789411','Admin1','WrongPass','2024-06-06 10:00:00',NULL,NULL),
('LG789412','FakeUser','pass123','2024-06-06 10:05:00',NULL,NULL),
('LG789413','admin2','Two','2024-06-06 10:10:00',NULL,NULL),
('LG789414','Admin3','One','2024-06-06 10:15:00',NULL,NULL);

CREATE TABLE ItemIngredients (
    Ingredients VARCHAR(50)		NOT NULL,
    ProductID 	CHAR(8)			NOT NULL,

    CONSTRAINT PK_ItemIngredients PRIMARY KEY (Ingredients, ProductID),

    CONSTRAINT FK_ItemIngredients FOREIGN KEY (ProductID)
	REFERENCES Product(ProductID)
);

INSERT INTO ItemIngredients VALUES
-- Crispy Chicken
('Chicken','PD789401'),
('Flour','PD789401'),
('Egg','PD789401'),

-- Frozen Pork
('Pork','PD789402'),

-- Frozen Shrimp
('Shrimp','PD789403'),

-- French Fries
('Potato','PD789404'),

-- Frozen Pizza
('Flour','PD789405'),
('Cheese','PD789405'),
('Tomato Sauce','PD789405'),

-- Beef
('Beef','PD789406'),

-- Chicken Wing
('Chicken','PD789407'),

-- Frozen Squid
('Squid','PD789408'),

-- Pork Dumpling
('Pork','PD789409'),
('Flour','PD789409'),
('Garlic','PD789409'),
('Cabbage','PD789409'),

-- Frozen Donut Shrimp
('Shrimp','PD789410'),
('Flour','PD789410'),
('Egg','PD789410');

CREATE TABLE Image (
    ImageID         CHAR(8)         NOT NULL,
    myDescription   VARCHAR(255)    ,	
    UploadDate      DATETIME        NOT NULL,
    ImageURL        VARCHAR(500)    NOT NULL,
    ProductID       CHAR(8)         NOT NULL,

    CONSTRAINT PK_Image PRIMARY KEY (ImageID),

    CONSTRAINT FK_Image FOREIGN KEY (ProductID)
    REFERENCES Product(ProductID)
);

INSERT INTO Image VALUES
('IM789401','Crispy Chicken product image','2024-05-20 10:15:00','https://images.mango-prod.siammakro.cloud/product-images/6974745477315-983ca1d7-79e7-4038-b53b-65af394f3f3c.jpeg?eo-img.resize=w%2F1080&eo-img.format=webp', 'PD789401'),
('IM789402','Frozen pork product image','2024-05-20 10:20:00','https://images.mango-prod.siammakro.cloud/SOURCE/7683200ac13945eeb50f6ed1e0ce6307?eo-img.resize=w%2F1080&eo-img.format=webp', 'PD789402'),
('IM789403','Frozen shrimp product image','2024-05-20 10:25:00','https://images.mango-prod.siammakro.cloud/SOURCE/2c586e1bcf0e40cca64cb6067cec1fe0?eo-img.resize=w%2F1080&eo-img.format=webp', 'PD789403'),
('IM789404','French fries product image','2024-05-21 11:00:00','https://images.mango-prod.siammakro.cloud/product-images/6974641340611-0a2d3b9e-7826-4f88-b0a0-de853d981973.jpeg?eo-img.resize=w%2F1080&eo-img.format=webp', 'PD789404'),
('IM789405','Frozen pizza product image','2024-05-21 11:10:00','https://images.mango-prod.siammakro.cloud/product-images/7499713544387-1dc129a2-b35e-4315-839e-206ce59312f2.jpeg?eo-img.resize=w%2F1080&eo-img.format=webp', 'PD789405'),
('IM789406','Beef product image','2024-05-22 13:30:00','https://images.mango-prod.siammakro.cloud/product-images/7115333042371-a19fb93d-9692-4eab-bc17-cda5cbc0b5d9.jpeg?eo-img.resize=w%2F1080&eo-img.format=webp', 'PD789406'),
('IM789407','Frozen Scallop product image','2024-05-22 13:40:00','https://cdn-app.cp-cmpd.com/images/cpknow/f66da48c437619ac84b5be909096ef46.png', 'PD789407'),
('IM789408','Frozen Squid product image','2024-05-23 15:00:00','https://images.mango-prod.siammakro.cloud/product-images/14769843832220-fc002d1f-e44e-4a33-952a-874062fb093c.jpeg?eo-img.resize=w%2F1080&eo-img.format=webp', 'PD789408'),
('IM789409','Pork Dumpling product image','2024-05-23 15:10:00','https://images.mango-prod.siammakro.cloud/product-images/7115326488771-0aadebab-8209-43c9-90cf-a5d3374fe2ea.jpeg?eo-img.resize=w%2F1080&eo-img.format=webp', 'PD789409'),
('IM789410','Frozen Donut shrimp product image','2024-05-24 16:20:00','https://down-th.img.susercontent.com/file/th-11134207-81ztq-mm2ajjojyqz356.webp', 'PD789410');