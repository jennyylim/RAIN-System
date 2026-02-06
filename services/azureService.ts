import sql from "mssql";

// Azure Configuration
const sqlConfig = {
  user: process.env.AZURE_SQL_USER || 'rainadmin',
  password: process.env.AZURE_SQL_PASSWORD || 'RainPassword123!',
  database: process.env.AZURE_SQL_DATABASE || 'rain_sql',
  server: process.env.AZURE_SQL_SERVER || 'rains.database.windows.net',
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  },
  options: {
    encrypt: true, // Required for Azure
    trustServerCertificate: false 
  }
};

export const AzureSQLService = {
  getConnection: async () => {
    try {
      const pool = await sql.connect(sqlConfig);
      return pool;
    } catch (err) {
      console.error('[Azure SQL] Connection Failed:', err);
      return null;
    }
  },

  commitTransaction: async (request: any, asset: any) => {
    let pool;
    try {
      pool = await AzureSQLService.getConnection();
      if (!pool) return false;

      const transaction = new sql.Transaction(pool);
      await transaction.begin();
      const requestRequest = new sql.Request(transaction);
      
      await requestRequest.query`
        UPDATE Assets 
        SET Status = 'Allocated', AssignedTo = ${request.employeeId}, LastUpdated = GETDATE()
        WHERE AssetTag = ${asset.assetTag}
      `;

      const verifiedCond = request.verifiedCondition ? 1 : 0;
      const verifiedLogin = request.verifiedLogin ? 1 : 0;

      await requestRequest.query`
        INSERT INTO UAT_Records (RequestId, EmployeeId, AssetId, SignedDate, SignatureUrl, PhotoUrl, VerifiedCondition, VerifiedLogin, WitnessITID, Remarks)
        VALUES (${request.id}, ${request.employeeId}, ${asset.id}, ${new Date(request.signedDate)}, ${request.signedUAT}, ${request.handoverPhoto}, ${verifiedCond}, ${verifiedLogin}, ${request.handoverItEngineerId}, ${request.uatRemarks})
      `;

      await transaction.commit();
      return true;
    } catch (err) {
      console.error('[Azure SQL] Transaction Failed:', err);
      return false;
    }
  },

  getInventory: async () => {
    try {
      const pool = await AzureSQLService.getConnection();
      if (!pool) return [];
      const result = await pool.request().query('SELECT * FROM Assets');
      return result.recordset;
    } catch (err) {
      console.error('[Azure SQL] Fetch Failed:', err);
      return [];
    }
  }
};