DROP DATABASE IF EXISTS sec1_gr02_database;
CREATE DATABASE IF NOT EXISTS sec1_gr02_database;
USE sec1_gr02_database;

SELECT * FROM Product;
SELECT * FROM Customer;
SELECT * FROM Image;
SELECT * FROM myOrder;
SELECT * FROM Payment;
SELECT * FROM Administrator;
SELECT * FROM AdminLogin;
SELECT * FROM ItemIngredients;

CREATE TABLE Customer (
    CustomerID 	CHAR(8)			NOT NULL,
    FName 		VARCHAR(50)		NOT NULL,
    LName 		VARCHAR(50)		NOT NULL,
    PhoneNumber VARCHAR(10)		NOT NULL,
    Email 		VARCHAR(100)	NOT NULL,
    Gender 		CHAR(1)			,
    City 		VARCHAR(100)	NOT NULL,
    Province 	VARCHAR(100)	NOT NULL,
    SubDistrict VARCHAR(100)	NOT NULL,

    CONSTRAINT PK_Customer PRIMARY KEY (CustomerID)
);

INSERT INTO Customer VALUES
('CT789401','Napat','Tayommai','0812345678','napat1@mail.com','M','Bangkok','Bangkok','HuaiKhwang'),
('CT789402','Somchai','Jaidee','0823456789','somchai@mail.com','M','Bangkok','Bangkok','Chatuchak'),
('CT789403','Suda','Dee','0834567890','suda@mail.com','F','ChiangMai','ChiangMai','Mueang'),
('CT789404','Anan','Meechai','0845678901','anan@mail.com','M','Phuket','Phuket','Kathu'),
('CT789405','Mali','Sukjai','0856789012','mali@mail.com','F','KhonKaen','KhonKaen','Mueang'),
('CT789406','Krit','Thong','0867890123','krit@mail.com','M','Chonburi','Chonburi','Sriracha'),
('CT789407','Ploy','Rakdee','0878901234','ploy@mail.com','F','Ayutthaya','Ayutthaya','BangPaIn'),
('CT789408','Beam','Cool','0889012345','beam@mail.com','M','Bangkok','Bangkok','LatPhrao'),
('CT789409','Mint','Happy','0890123456','mint@mail.com','F','NakhonPathom','NakhonPathom','SamPhran'),
('CT789410','Game','Dev','0801234567','game@mail.com','M','Bangkok','Bangkok','BangKapi'),

('CT789411','Alice','Tan','0811111111','alice@mail.com','F','Bangkok','Bangkok','Pathumwan'),
('CT789412','Bob','Lee','0822222222','bob@mail.com','M','ChiangMai','ChiangMai','HangDong'),
('CT789413','Charlie','Kim','0833333333','charlie@mail.com','M','Phuket','Phuket','Patong'),
('CT789414','Daisy','Lim','0844444444','daisy@mail.com','F','Chonburi','Chonburi','BangSaen'),
('CT789415','Ethan','Ng','0855555555','ethan@mail.com','M','KhonKaen','KhonKaen','Mueang');

CREATE TABLE Membership (
    MemberID 	CHAR(8)			NOT NULL,
    myPoint 	INT				NOT NULL,
    JoinDate 	DATE			NOT NULL,
    ExpiryDate 	DATE			NOT NULL,
    CustomerID 	CHAR(8)			NOT NULL,

    CONSTRAINT PK_Membership PRIMARY KEY (MemberID, CustomerID),
    
    CONSTRAINT FK_Membership FOREIGN KEY (CustomerID)
	REFERENCES Customer(CustomerID)
);

INSERT INTO Membership VALUES
('MB789401',100,'2024-01-01','2025-01-01','CT789401'),
('MB789402',200,'2024-02-01','2025-02-01','CT789402'),
('MB789403',50,'2024-03-01','2025-03-01','CT789403'),
('MB789404',300,'2024-04-01','2025-04-01','CT789404'),
('MB789405',0,'2024-05-01','2025-05-01','CT789405'),
('MB789406',120,'2024-06-01','2025-06-01','CT789406'),
('MB789407',80,'2024-07-01','2025-07-01','CT789407'),
('MB789408',60,'2024-08-01','2025-08-01','CT789408'),
('MB789409',40,'2024-09-01','2025-09-01','CT789409'),
('MB789410',500,'2024-10-01','2025-10-01','CT789410');

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
('AD789401','Admin1','One','0911111111','admin1@mail.com','M'),
('AD789402','Admin2','Two','0922222222','admin2@mail.com','F'),
('AD789403','Admin3','Three','0933333333','admin3@mail.com','M'),
('AD789404','Admin4','Four','0944444444','admin4@mail.com','F'),
('AD789405','Admin5','Five','0955555555','admin5@mail.com','M'),
('AD789406','Admin6','Six','0966666666','admin6@mail.com','F'),
('AD789407','Admin7','Seven','0977777777','admin7@mail.com','M'),
('AD789408','Admin8','Eight','0988888888','admin8@mail.com','F'),
('AD789409','Admin9','Nine','0999999999','admin9@mail.com','M'),
('AD789410','Admin10','Ten','0900000000','admin10@mail.com','F');

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
('PD789406','Beef',290.00,'CP','2024-01-01','2025-01-01','AD789406'),
('PD789407','Chicken Wing',375.00,'Aro','2024-01-01','2025-01-01','AD789407'),
('PD789408','Frozen Squid',200.00,'Savepack','2024-01-01','2025-01-01','AD789408'),
('PD789409','Pork Dumpling',160.00,'CP','2024-01-01','2025-01-01','AD789409'),
('PD789410','Frozen Donut shrimp',160.00,'CP','2024-01-01','2025-01-01','AD789410');



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
('LG789408','Admin8','Eight','2024-06-04 16:20:18','Staff','AD789408'),
('LG789409','Admin9','Nine','2024-06-05 17:40:00','Staff','AD789409'),
('LG789410','Admin10','Ten','2024-06-05 18:05:12','Manager','AD789410'),

('LG789411','Admin1','WrongPass','2024-06-06 10:00:00',NULL,NULL),
('LG789412','FakeUser','pass123','2024-06-06 10:05:00',NULL,NULL),
('LG789413','admin2','Two','2024-06-06 10:10:00',NULL,NULL),
('LG789414','Admin3','One','2024-06-06 10:15:00',NULL,NULL);

CREATE TABLE Payment (
    PaymentID 		CHAR(8)		NOT NULL,
    PaymentStatus 	CHAR(1)		NOT NULL,
    PaymentDate 	DATETIME	NOT NULL,
    PaymentMethod 	VARCHAR(20)	NOT NULL,

    CONSTRAINT PK_Payment PRIMARY KEY (PaymentID)
);

INSERT INTO Payment VALUES
('PM789401','C','2024-06-01 08:30:15','Credit Card'),
('PM789402','P','2024-06-01 09:10:22','PromptPay'),
('PM789403','F','2024-06-01 09:45:50','Cash'),
('PM789404','C','2024-06-02 10:05:33','Credit Card'),
('PM789405','C','2024-06-02 11:20:40','PromptPay'),
('PM789406','P','2024-06-03 13:15:10','Cash'),
('PM789407','C','2024-06-03 14:50:55','Credit Card'),
('PM789408','F','2024-06-04 15:25:18','PromptPay'),
('PM789409','C','2024-06-04 16:40:27','Cash'),
('PM789410','P','2024-06-05 17:55:05','Credit Card');

CREATE TABLE myOrder (
	OrderID 	CHAR(8)			NOT NULL,
    CustomerID 	CHAR(8)			NOT NULL,
    ProductID 	CHAR(8)			NOT NULL,
    PaymentID 	CHAR(8)			NOT NULL,
    OrderStatus CHAR(1)			NOT NULL,
    OrderDate 	DATETIME		NOT NULL,

    CONSTRAINT PK_myOrder PRIMARY KEY (OrderID),

    CONSTRAINT FK_myOrder_Customer FOREIGN KEY (CustomerID)
	REFERENCES Customer(CustomerID),

    CONSTRAINT FK_myOrder_Product FOREIGN KEY (ProductID)
	REFERENCES Product(ProductID),

    CONSTRAINT FK_myOrder_Payment FOREIGN KEY (PaymentID)
	REFERENCES Payment(PaymentID)
);

INSERT INTO myOrder VALUES
('OR541801','CT789401','PD789401','PM789401','C','2024-06-01 08:20:00'),
('OR541802','CT789402','PD789402','PM789402','P','2024-06-01 09:00:00'),
('OR541803','CT789403','PD789403','PM789403','F','2024-06-01 09:30:00'),
('OR541804','CT789404','PD789404','PM789404','C','2024-06-02 09:50:00'),
('OR541805','CT789405','PD789405','PM789405','C','2024-06-02 11:00:00'),
('OR541806','CT789406','PD789406','PM789406','P','2024-06-03 13:00:00'),
('OR541807','CT789407','PD789407','PM789407','C','2024-06-03 14:30:00'),
('OR541808','CT789408','PD789408','PM789408','F','2024-06-04 15:00:00'),
('OR541809','CT789409','PD789409','PM789409','C','2024-06-04 16:10:00'),
('OR541810','CT789410','PD789410','PM789410','P','2024-06-05 17:30:00');

CREATE TABLE ItemIngredients (
    Ingredients VARCHAR(50)		NOT NULL,
    ProductID 	CHAR(8)			NOT NULL,

    CONSTRAINT PK_ItemIngredients PRIMARY KEY (Ingredients, ProductID),

    CONSTRAINT FK_ItemIngredients FOREIGN KEY (ProductID)
	REFERENCES Product(ProductID)
);

INSERT INTO ItemIngredients VALUES
('Chicken','PD789401'),
('Pork','PD789402'),
('Shrimp','PD789403'),
('Potato','PD789404'),
('Cheese','PD789405'),
('Beef','PD789406'),
('Chicken','PD789407'),
('Milk','PD789408'),
('Flour','PD789409'),
('Sausage','PD789410');

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