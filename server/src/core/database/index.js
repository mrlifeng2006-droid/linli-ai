/**
 * 数据库连接层 - 支持 SQLite（本地）和 PostgreSQL（Railway 云）
 * @ts-nocheck
 */
const path = require('path');
const fs = require('fs');
const { config } = require('../config');

let db = null;
let isPostgres = false;

/** 初始化数据库 */
async function initDatabase() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (databaseUrl) {
    // ====== PostgreSQL 模式（Railway 云） ======
    console.log('  🔄 连接到 PostgreSQL...');
    const { Pool } = require('pg');
    
    const pool = new Pool({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false }
    });
    
    // 测试连接
    const client = await pool.connect();
    console.log('  ✅ PostgreSQL 连接成功');
    
    // 创建兼容层（将 pg 封装成类似 sql.js 的接口）
    db = {
      _pool: pool,
      _client: client,
      
      run(sql, params) {
        return pool.query(sql, params);
      },
      
      exec(sql) {
        return pool.query(sql);
      },
      
      prepare(sql) {
        return {
          _sql: sql,
          bind(params) { return this; },
          step() { return false; }, // 不支持游标
          getAsObject() { return {}; },
          free() {}
        };
      }
    };
    
    isPostgres = true;
    
    // 自动建表
    await initTablesPg(pool);
    
  } else {
    // ====== SQLite 模式（本地开发） ======
    console.log('  🔄 初始化 SQLite...');
    const initSqlJs = require('sql.js');
    
    const dbPath = config.db.sqlite_path || path.resolve(__dirname, '../../data/linli_ai.db');
    const dbDir = path.dirname(dbPath);
    
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    const SQL = await initSqlJs();
    
    if (fs.existsSync(dbPath)) {
      const buffer = fs.readFileSync(dbPath);
      db = new SQL.Database(buffer);
      console.log(`  ✅ 加载已有数据库: ${dbPath} (${buffer.length} bytes)`);
    } else {
      db = new SQL.Database();
      console.log(`  ✅ 创建新数据库: ${dbPath}`);
    }
    
    db.run('PRAGMA foreign_keys = ON');
    initTables();
  }
  
  console.log('  ✅ 数据库初始化完成');
}

/** PostgreSQL 建表 */
async function initTablesPg(pool) {
  const schemaPath = path.join(__dirname, 'schema.sql');
  if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    // PostgreSQL 不支持 AUTOINCREMENT，用 SERIAL 替代
    const pgSchema = schema
      .replace(/INTEGER PRIMARY KEY AUTOINCREMENT/gi, 'SERIAL PRIMARY KEY')
      .replace(/AUTOINCREMENT/gi, 'SERIAL')
      .replace(/`/g, '"'); // MySQL 反引号转 PostgreSQL 双引号
    
    await pool.query(pgSchema);
    console.log('  ✅ PostgreSQL 表初始化完成');
  }
}

/** 保存数据库（SQLite 需要） */
function saveDatabase() {
  if (!db || isPostgres) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  const dbPath = config.db.sqlite_path || path.resolve(__dirname, '../../data/linli_ai.db');
  fs.writeFileSync(dbPath, buffer);
}

/** 初始化表结构（SQLite） */
function initTables() {
  if (!db) throw new Error('数据库未初始化');
  const schemaPath = path.join(__dirname, 'schema.sql');
  if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    db.exec(schema);
    console.log('  ✅ SQLite 表初始化完成');
  } else {
    console.error('  ❌ schema.sql 不存在:', schemaPath);
  }

  // 执行迁移脚本（字段新增等）
  const migPath = path.join(__dirname, 'migrations.sql');
  if (fs.existsSync(migPath)) {
    const mig = fs.readFileSync(migPath, 'utf-8');
    db.exec(mig);
    console.log('  ✅ SQLite 迁移脚本执行完成');
  }

  saveDatabase();
}

/** 执行查询 */
function query(sql, params = []) {
  if (!db) throw new Error('数据库未初始化');
  
  try {
    if (isPostgres) {
      // PostgreSQL 模式
      const res = db._pool.query(sql, params);
      return res.then(r => r.rows);
    } else {
      // SQLite 模式
      const stmt = db.prepare(sql);
      if (params.length > 0) stmt.bind(params);
      const results = [];
      while (stmt.step()) {
        results.push(stmt.getAsObject());
      }
      stmt.free();
      return results;
    }
  } catch (e) {
    console.error('  ❌ query 错误:', e.message, 'SQL:', sql);
    throw e;
  }
}

/** 单行查询 */
async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

/** 执行增删改 */
async function execute(sql, params = []) {
  if (!db) throw new Error('数据库未初始化');
  
  try {
    if (isPostgres) {
      const res = await db._pool.query(sql, params);
      return { changes: res.rowCount };
    } else {
      if (params.length > 0) {
        db.run(sql, params);
      } else {
        db.run(sql);
      }
      saveDatabase();
      return { changes: db.getRowsModified() };
    }
  } catch (e) {
    console.error('  ❌ execute 错误:', e.message, 'SQL:', sql);
    throw e;
  }
}

/** 测试连接 */
function testConnection() {
  return db !== null;
}

/** 关闭数据库 */
async function closeDatabase() {
  if (db) {
    if (isPostgres) {
      await db._pool.end();
    } else {
      saveDatabase();
      db.close();
    }
    db = null;
    console.log('  数据库已关闭');
  }
}

module.exports = { initDatabase, initTables, query, queryOne, execute, closeDatabase };
