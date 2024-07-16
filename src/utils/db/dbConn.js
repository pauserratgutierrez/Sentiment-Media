import mysql from 'mysql2/promise';

const config = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT
};

const pool = mysql.createPool({
  ...config,
  connectionLimit: 10,
  queueLimit: 0
});

export async function query(sql, params, connection = null) {
  const conn = connection || await pool.getConnection();
  try {
    const [rows] = await conn.execute(sql, params);
    return rows;
  } catch (err) {
    console.error(`Error executing DB query: ${err}`);
    throw err;
  } finally {
    if (!connection) {
      conn.release();
    }
  }
};

export async function getConnection() {
  return await pool.getConnection();
}

export async function closePool() {
  try {
    await pool.end();
    console.log('DB pool closed');
  } catch (err) {
    console.error(`Error closing DB pool: ${err}`);
  }
};

// Handle app termination
const handleAppTermination = async () => {
  await closePool();
  process.exit(0);
};

process.on('SIGINT', handleAppTermination);
process.on('SIGTERM', handleAppTermination);
