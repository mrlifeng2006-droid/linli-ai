/**
 * MySQL 数据库连接池
 */
import mysql from 'mysql2/promise';
import config from '../config';

const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  database: config.db.name,
  user: config.db.user,
  password: config.db.password,
  charset: config.db.charset,
  timezone: config.db.timezone,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

/** 执行SQL（查询） */
export async function query<T = any>(sql: string, values?: any[]): Promise<T> {
  const [rows] = await pool.execute(sql, values);
  return rows as T;
}

/** 执行SQL（增删改） */
export async function execute(sql: string, values?: any[]): Promise<any> {
  const [result] = await pool.execute(sql, values);
  return result;
}

/** 测试连接 */
export async function testConnection(): Promise<boolean> {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    console.log('✅ MySQL连接成功');
    return true;
  } catch (err) {
    console.error('❌ MySQL连接失败:', err);
    return false;
  }
}

/** 关闭连接池 */
export async function closePool(): Promise<void> {
  await pool.end();
}

export default pool;
