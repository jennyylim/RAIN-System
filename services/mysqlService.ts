
/**
 * RAIN MySQL Integration Service
 * 
 * Handles communication with a standard MySQL Database.
 * Prerequisites: npm install mysql2 dotenv
 */

import mysql from 'mysql2/promise';

// MySQL Configuration
const MYSQL_CONFIG = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'password',
  database: process.env.MYSQL_DATABASE || 'rain_ledger_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

export const MySQLService = {
  /**
   * Creates a connection pool
   */
  getPool: () => {
    return mysql.createPool(MYSQL_CONFIG);
  },

  /**
   * Syncs a completed UAT Request to the MySQL Ledger
   */
  commitTransaction: async (request: any, asset: any) => {
    const pool = MySQLService.getPool();
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // 1. Update Asset Status
      await connection.execute(
        `UPDATE Assets 
         SET Status = 'Allocated', AssignedTo = ?, Hostname = ?
         WHERE AssetTag = ?`,
        [request.employeeId, asset.hostname, asset.assetTag]
      );

      // 2. Insert UAT Record
      // Note: In this MySQL version, we are storing the Base64 images directly in LONGTEXT columns
      // If using Blob Storage separately, you would pass the URL here instead.
      await connection.execute(
        `INSERT INTO UAT_Records 
         (RequestId, EmployeeId, AssetId, SignedDate, SignatureUrl, PhotoUrl, VerifiedCondition, VerifiedLogin, WitnessITID, Remarks)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            request.id, 
            request.employeeId, 
            asset.id, 
            new Date(request.signedDate), 
            request.signedUAT,    // Base64 String
            request.handoverPhoto,// Base64 String
            1, 
            1,
            request.handoverItEngineerId,
            request.uatRemarks
        ]
      );

      await connection.commit();
      console.log(`[MySQL] Transaction Committed for Request ${request.id}`);
      return true;

    } catch (err) {
      await connection.rollback();
      console.error('[MySQL] Transaction Failed:', err);
      return false;
    } finally {
      connection.release();
    }
  },

  /**
   * Fetches the entire asset inventory
   */
  getInventory: async () => {
    try {
      const pool = MySQLService.getPool();
      const [rows] = await pool.query('SELECT * FROM Assets');
      return rows;
    } catch (err) {
      console.error('[MySQL] Fetch Failed:', err);
      return [];
    }
  }
};
