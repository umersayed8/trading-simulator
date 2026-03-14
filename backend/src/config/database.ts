import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Database connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'stocksim',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Test database connection
export async function testConnection(): Promise<boolean> {
  try {
    const connection = await pool.getConnection();
    console.log('Database connected successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Execute a query with parameters
export async function query<T>(sql: string, params?: any[]): Promise<T> {
  const [rows] = await pool.execute(sql, params);
  return rows as T;
}

// Get a single row
export async function queryOne<T>(sql: string, params?: any[]): Promise<T | null> {
  const rows = await query<T[]>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

// Insert and return the inserted ID
export async function insert(sql: string, params?: any[]): Promise<number> {
  const [result] = await pool.execute(sql, params);
  return (result as mysql.ResultSetHeader).insertId;
}

// Update/delete and return affected rows
export async function update(sql: string, params?: any[]): Promise<number> {
  const [result] = await pool.execute(sql, params);
  return (result as mysql.ResultSetHeader).affectedRows;
}

// Transaction helper
export async function transaction<T>(
  callback: (connection: mysql.PoolConnection) => Promise<T>
): Promise<T> {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export default pool;
