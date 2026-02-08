
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { getPool, sql } from './db.js';
import PDFDocument from 'pdfkit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Health Check
app.get('/health', (req, res) => res.send('RAIN Cloud Gateway Active'));

/**
 * TASK 2: Role-Based Access Control (RBAC) Logic
 * Validates email and returns role-based redirect URL.
 */
app.post('/api/login', async (req, res) => {
    const { email } = req.body;
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('Email', sql.VarChar, email)
            .query('SELECT * FROM Employees WHERE Email = @Email');

        if (result.recordset.length === 0) {
            return res.status(401).json({ success: false, message: 'User not found' });
        }

        const user = result.recordset[0];
        let redirectUrl = '/login';

        switch (user.Role) {
            case 'PowerIT':
                redirectUrl = '/it'; // Full Access
                break;
            case 'HR Admin':
                redirectUrl = '/hr'; // Personnel Hub
                break;
            case 'ITBAU':
                redirectUrl = '/it'; // Fleet Control
                break;
            case 'End User':
                redirectUrl = '/employee'; // UAT Portal
                break;
            default:
                redirectUrl = '/employee';
        }

        res.json({
            success: true,
            user: {
                id: user.EmployeeID,
                name: `${user.FirstName} ${user.LastName}`,
                email: user.Email,
                role: user.Role,
                department: user.Department
            },
            redirectUrl
        });

    } catch (err) {
        console.error('Login Error:', err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

/**
 * TASK 3: UAT PDF & Image Workflow
 * Updates DB and generates PDF receipt.
 */
app.post('/api/uat/sign', async (req, res) => {
    const { requestId, employeeId, assetId, signatureUrl, photoUrl, remarks } = req.body;

    if (!requestId || !employeeId || !assetId) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    try {
        const pool = await getPool();
        const transaction = new sql.Transaction(pool);
        
        await transaction.begin();
        const request = new sql.Request(transaction);

        // 1. Update Asset Status from 'Reserved' to 'Allocated' (Assigned)
        await request
            .input('AssetId', sql.VarChar, assetId)
            .input('EmployeeId', sql.VarChar, employeeId)
            .query(`
                UPDATE Assets 
                SET Status = 'Allocated', AssignedTo = @EmployeeId, LastUpdated = GETDATE()
                WHERE AssetID = @AssetId
            `);

        // 2. Insert UAT Record
        await request
            .input('RequestId', sql.VarChar, requestId)
            .input('RecEmployeeId', sql.VarChar, employeeId)
            .input('RecAssetId', sql.VarChar, assetId)
            .input('SignatureUrl', sql.VarChar(sql.MAX), signatureUrl)
            .input('PhotoUrl', sql.VarChar(sql.MAX), photoUrl)
            .input('Remarks', sql.VarChar(sql.MAX), remarks || '')
            .query(`
                INSERT INTO UAT_Records (RequestId, EmployeeId, AssetId, SignedDate, SignatureUrl, PhotoUrl, VerifiedCondition, VerifiedLogin, Remarks)
                VALUES (@RequestId, @RecEmployeeId, @RecAssetId, GETDATE(), @SignatureUrl, @PhotoUrl, 1, 1, @Remarks)
            `);

        await transaction.commit();

        // 3. Generate PDF
        // We fetch details again to ensure accurate PDF data
        const details = await pool.request()
            .input('AssetIdDetails', sql.VarChar, assetId)
            .query(`SELECT Brand, Model, SerialNumber, AssetTag FROM Assets WHERE AssetID = @AssetIdDetails`);
        
        const assetDetails = details.recordset[0];

        const doc = new PDFDocument();
        const filename = `UAT_${requestId}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

        doc.pipe(res);

        // PDF Content
        doc.fontSize(25).text('RAIN Asset Handover Receipt', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Date: ${new Date().toLocaleString()}`);
        doc.text(`Request Ref: ${requestId}`);
        doc.moveDown();
        
        doc.fontSize(16).text('Asset Details', { underline: true });
        doc.fontSize(12).text(`Tag: ${assetDetails?.AssetTag}`);
        doc.text(`Model: ${assetDetails?.Brand} ${assetDetails?.Model}`);
        doc.text(`Serial: ${assetDetails?.SerialNumber}`);
        doc.moveDown();

        doc.fontSize(16).text('Sign-Off', { underline: true });
        doc.text(`Custodian ID: ${employeeId}`);
        doc.text('I hereby acknowledge receipt of the above hardware in good working condition.');
        
        if (signatureUrl && signatureUrl.startsWith('data:image')) {
            doc.moveDown();
            doc.text('Signature:');
            const sigBuffer = Buffer.from(signatureUrl.split(',')[1], 'base64');
            doc.image(sigBuffer, { fit: [250, 100] });
        }

        if (photoUrl && photoUrl.startsWith('data:image')) {
            doc.moveDown();
            doc.text('Handover Evidence:');
            const photoBuffer = Buffer.from(photoUrl.split(',')[1], 'base64');
            doc.image(photoBuffer, { fit: [250, 200] });
        }

        doc.end();

    } catch (err) {
        console.error('UAT Sign Error:', err);
        res.status(500).json({ success: false, message: 'Transaction Failed' });
    }
});

/**
 * TASK 4: DB Ledger View
 * Restricted access to full inventory history.
 */
app.get('/api/ledger', async (req, res) => {
    const role = req.headers['x-role']; // Simple role check for demo purposes

    if (!role || (role !== 'PowerIT' && role !== 'HR Admin' && role !== 'ITBAU')) {
        return res.status(403).json({ success: false, message: 'Access Denied: Insufficient Privileges' });
    }

    try {
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT 
                a.AssetTag, a.Brand, a.Model, a.Status, a.LastUpdated,
                e.FirstName + ' ' + e.LastName as CustodianName,
                e.Department
            FROM Assets a
            LEFT JOIN Employees e ON a.AssignedTo = e.EmployeeID
        `);
        res.json(result.recordset);
    } catch (err) {
        console.error('Ledger Error:', err);
        res.status(500).json({ success: false, message: 'Database Error' });
    }
});

// Serve Static Frontend
app.use(express.static(path.join(__dirname, 'dist')));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  return res.sendFile(path.join(__dirname, "dist", "index.html"));
});


import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { getPool, sql } from './db.js';
import PDFDocument from 'pdfkit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Health Check
app.get('/health', (req, res) => res.send('RAIN Cloud Gateway Active'));

/**
 * TASK 2: Role-Based Access Control (RBAC) Logic
 * Validates email and returns role-based redirect URL.
 */
app.post('/api/login', async (req, res) => {
    const { email } = req.body;
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('Email', sql.VarChar, email)
            .query('SELECT * FROM Employees WHERE Email = @Email');

        if (result.recordset.length === 0) {
            return res.status(401).json({ success: false, message: 'User not found' });
        }

        const user = result.recordset[0];
        let redirectUrl = '/login';

        switch (user.Role) {
            case 'PowerIT':
                redirectUrl = '/it'; // Full Access
                break;
            case 'HR Admin':
                redirectUrl = '/hr'; // Personnel Hub
                break;
            case 'ITBAU':
                redirectUrl = '/it'; // Fleet Control
                break;
            case 'End User':
                redirectUrl = '/employee'; // UAT Portal
                break;
            default:
                redirectUrl = '/employee';
        }

        res.json({
            success: true,
            user: {
                id: user.EmployeeID,
                name: `${user.FirstName} ${user.LastName}`,
                email: user.Email,
                role: user.Role,
                department: user.Department
            },
            redirectUrl
        });

    } catch (err) {
        console.error('Login Error:', err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

/**
 * TASK 3: UAT PDF & Image Workflow
 * Updates DB and generates PDF receipt.
 */
app.post('/api/uat/sign', async (req, res) => {
    const { requestId, employeeId, assetId, signatureUrl, photoUrl, remarks } = req.body;

    if (!requestId || !employeeId || !assetId) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    try {
        const pool = await getPool();
        const transaction = new sql.Transaction(pool);
        
        await transaction.begin();
        const request = new sql.Request(transaction);

        // 1. Update Asset Status from 'Reserved' to 'Allocated' (Assigned)
        await request
            .input('AssetId', sql.VarChar, assetId)
            .input('EmployeeId', sql.VarChar, employeeId)
            .query(`
                UPDATE Assets 
                SET Status = 'Allocated', AssignedTo = @EmployeeId, LastUpdated = GETDATE()
                WHERE AssetID = @AssetId
            `);

        // 2. Insert UAT Record
        await request
            .input('RequestId', sql.VarChar, requestId)
            .input('RecEmployeeId', sql.VarChar, employeeId)
            .input('RecAssetId', sql.VarChar, assetId)
            .input('SignatureUrl', sql.VarChar(sql.MAX), signatureUrl)
            .input('PhotoUrl', sql.VarChar(sql.MAX), photoUrl)
            .input('Remarks', sql.VarChar(sql.MAX), remarks || '')
            .query(`
                INSERT INTO UAT_Records (RequestId, EmployeeId, AssetId, SignedDate, SignatureUrl, PhotoUrl, VerifiedCondition, VerifiedLogin, Remarks)
                VALUES (@RequestId, @RecEmployeeId, @RecAssetId, GETDATE(), @SignatureUrl, @PhotoUrl, 1, 1, @Remarks)
            `);

        await transaction.commit();

        // 3. Generate PDF
        // We fetch details again to ensure accurate PDF data
        const details = await pool.request()
            .input('AssetIdDetails', sql.VarChar, assetId)
            .query(`SELECT Brand, Model, SerialNumber, AssetTag FROM Assets WHERE AssetID = @AssetIdDetails`);
        
        const assetDetails = details.recordset[0];

        const doc = new PDFDocument();
        const filename = `UAT_${requestId}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

        doc.pipe(res);

        // PDF Content
        doc.fontSize(25).text('RAIN Asset Handover Receipt', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Date: ${new Date().toLocaleString()}`);
        doc.text(`Request Ref: ${requestId}`);
        doc.moveDown();
        
        doc.fontSize(16).text('Asset Details', { underline: true });
        doc.fontSize(12).text(`Tag: ${assetDetails?.AssetTag}`);
        doc.text(`Model: ${assetDetails?.Brand} ${assetDetails?.Model}`);
        doc.text(`Serial: ${assetDetails?.SerialNumber}`);
        doc.moveDown();

        doc.fontSize(16).text('Sign-Off', { underline: true });
        doc.text(`Custodian ID: ${employeeId}`);
        doc.text('I hereby acknowledge receipt of the above hardware in good working condition.');
        
        if (signatureUrl && signatureUrl.startsWith('data:image')) {
            doc.moveDown();
            doc.text('Signature:');
            const sigBuffer = Buffer.from(signatureUrl.split(',')[1], 'base64');
            doc.image(sigBuffer, { fit: [250, 100] });
        }

        if (photoUrl && photoUrl.startsWith('data:image')) {
            doc.moveDown();
            doc.text('Handover Evidence:');
            const photoBuffer = Buffer.from(photoUrl.split(',')[1], 'base64');
            doc.image(photoBuffer, { fit: [250, 200] });
        }

        doc.end();

    } catch (err) {
        console.error('UAT Sign Error:', err);
        res.status(500).json({ success: false, message: 'Transaction Failed' });
    }
});

/**
 * TASK 4: DB Ledger View
 * Restricted access to full inventory history.
 */
app.get('/api/ledger', async (req, res) => {
    const role = req.headers['x-role']; // Simple role check for demo purposes

    if (!role || (role !== 'PowerIT' && role !== 'HR Admin' && role !== 'ITBAU')) {
        return res.status(403).json({ success: false, message: 'Access Denied: Insufficient Privileges' });
    }

    try {
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT 
                a.AssetTag, a.Brand, a.Model, a.Status, a.LastUpdated,
                e.FirstName + ' ' + e.LastName as CustodianName,
                e.Department
            FROM Assets a
            LEFT JOIN Employees e ON a.AssignedTo = e.EmployeeID
        `);
        res.json(result.recordset);
    } catch (err) {
        console.error('Ledger Error:', err);
        res.status(500).json({ success: false, message: 'Database Error' });
    }
});

// Serve Static Frontend
app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));

// prevents “container is running but unreachable” in ACA
app.listen(PORT, "0.0.0.0", () => console.log(`🚀 RAIN Server running on port ${PORT}`));


