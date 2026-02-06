
-- RAIN Azure SQL (MSSQL) Database Schema

-- 1. Users Table (Employees & IT Staff)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Employees' and xtype='U')
CREATE TABLE Employees (
    EmployeeID VARCHAR(50) PRIMARY KEY,
    FirstName VARCHAR(100) NOT NULL,
    LastName VARCHAR(100) NOT NULL,
    Email VARCHAR(200) NOT NULL UNIQUE,
    Department VARCHAR(100),
    Role VARCHAR(100),
    Status VARCHAR(50) DEFAULT 'Active',
    DateJoined DATE,
    ReportingOfficerID VARCHAR(50)
);

-- 2. Assets Table (Laptop Inventory)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Assets' and xtype='U')
CREATE TABLE Assets (
    AssetID VARCHAR(50) PRIMARY KEY,
    AssetTag VARCHAR(50) NOT NULL UNIQUE,
    Brand VARCHAR(50),
    Model VARCHAR(100),
    SerialNumber VARCHAR(100) NOT NULL UNIQUE,
    Status VARCHAR(50) DEFAULT 'In Stock',
    AssignedTo VARCHAR(50) NULL,
    PurchaseDate DATE,
    WarrantyExpiry DATE,
    Specs VARCHAR(MAX),
    Hostname VARCHAR(100) NULL,
    LastUpdated DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (AssignedTo) REFERENCES Employees(EmployeeID)
);

-- 3. Requests Table (Provisioning Queue)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='AssetRequests' and xtype='U')
CREATE TABLE AssetRequests (
    RequestID VARCHAR(50) PRIMARY KEY,
    EmployeeID VARCHAR(50) NOT NULL,
    Type VARCHAR(50),
    RequestedModel VARCHAR(100),
    Status VARCHAR(50) DEFAULT 'Pending',
    CollectionDate DATETIME,
    AssignedAssetID VARCHAR(50) NULL,
    FOREIGN KEY (EmployeeID) REFERENCES Employees(EmployeeID),
    FOREIGN KEY (AssignedAssetID) REFERENCES Assets(AssetID)
);

-- 4. UAT_Records Table (Signed Handover Logs)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='UAT_Records' and xtype='U')
CREATE TABLE UAT_Records (
    RecordID INT IDENTITY(1,1) PRIMARY KEY,
    RequestId VARCHAR(50) NOT NULL,
    EmployeeId VARCHAR(50) NOT NULL,
    AssetId VARCHAR(50) NOT NULL,
    SignedDate DATETIME DEFAULT GETDATE(),
    SignatureUrl VARCHAR(MAX), 
    PhotoUrl VARCHAR(MAX),     
    VerifiedCondition BIT DEFAULT 0,
    VerifiedLogin BIT DEFAULT 0,
    WitnessITID VARCHAR(50),
    Remarks VARCHAR(MAX),
    FOREIGN KEY (RequestId) REFERENCES AssetRequests(RequestID),
    FOREIGN KEY (EmployeeId) REFERENCES Employees(EmployeeID),
    FOREIGN KEY (AssetId) REFERENCES Assets(AssetID)
);

-- SEED DATA (Clean Roles)
DELETE FROM Employees WHERE Role IN ('PowerIT', 'HR Admin', 'ITBAU', 'End User');

-- 1. PowerIT (Full Access)
INSERT INTO Employees (EmployeeID, FirstName, LastName, Email, Department, Role, Status)
VALUES ('PWR-001', 'Admin', 'Master', 'powerit@rain.com', 'IT Management', 'PowerIT', 'Active');

-- 2. HR IT Admin (Personnel Specialist)
INSERT INTO Employees (EmployeeID, FirstName, LastName, Email, Department, Role, Status)
VALUES ('HR-101', 'Sarah', 'Jenkins', 'hr.admin@rain.com', 'Human Resources', 'HR Admin', 'Active');

-- 3. ITBAU (Operations & Fleet)
INSERT INTO Employees (EmployeeID, FirstName, LastName, Email, Department, Role, Status)
VALUES ('BAU-201', 'Kevin', 'Tech', 'it.bau@rain.com', 'IT Operations', 'ITBAU', 'Active');

-- 4. End User (Deployment Access - Assigned an ID for login)
INSERT INTO Employees (EmployeeID, FirstName, LastName, Email, Department, Role, Status)
VALUES ('EMP-UAT-99', 'Cynthia', 'Matthew', 'cynthia.m@rain.com', 'Architecture', 'End User', 'Active');
