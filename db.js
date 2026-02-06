
import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

const config = {
    user: process.env.DB_USER || 'rainadmin',
    password: process.env.DB_PASSWORD || 'RainPassword123!',
    server: process.env.DB_SERVER || 'rains.database.windows.net',
    database: process.env.DB_NAME || 'rain_sql',
    options: {
        encrypt: true, // Required for Azure SQL
        trustServerCertificate: false
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

let poolPromise;

export const getPool = async () => {
    if (!poolPromise) {
        poolPromise = new sql.ConnectionPool(config)
            .connect()
            .then(pool => {
                console.log('✅ Connected to Azure SQL');
                return pool;
            })
            .catch(err => {
                console.error('❌ Database Connection Failed! Bad Config: ', err);
                poolPromise = null;
                throw err;
            });
    }
    return poolPromise;
};

export { sql };
