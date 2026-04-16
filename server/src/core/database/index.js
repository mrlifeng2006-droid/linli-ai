/**
 * SQLite 数据库连接（开发环境使用，无需安装MySQL）
 * @ts-nocheck
 */
const BetterSqlite3 = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// 动态导入 config（CommonJS）
let config;
try {
  const { default: cfg } = require('../config');
  config = cfg;
} catch {
  config = { db: { sqlite_path: path.resolve(__dirname, '../../../../data/linli_ai.db') }, isDev: true };
}

// 确保数据库目录存在
const dbDir = path.dirname(config.db.sqlite_path);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// 连接数据库
const db = new BetterSqlite3(config.db.sqlite_path, {
  verbose: config.isDev ? (sql) => console.log('  SQL:', sql) : undefined,
});

// WAL 模式
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

/** 执行查询 */
function query(sql, params = []) {
  const stmt = db.prepare(sql);
  return params.length > 0 ? stmt.all(...params) : stmt.all();
}

/** 单行查询 */
function queryOne(sql, params = []) {
  const stmt = db.prepare(sql);
  return params.length > 0 ? stmt.get(...params) : stmt.get();
}

/** 执行增删改 */
function execute(sql, params = []) {
  const stmt = db.prepare(sql);
  return params.length > 0 ? stmt.run(...params) : stmt.run();
}

/** 批量执行 */
function execBatch(sqlStatements) {
  db.exec(sqlStatements);
}

/** 初始化表结构 */
function initTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS Merchant (
      id TEXT PRIMARY KEY,
      openid TEXT NOT NULL,
      unionid TEXT,
      phone TEXT,
      nickname TEXT,
      avatar_url TEXT,
      auth_type TEXT DEFAULT 'wechat_realname',
      auth_status TEXT DEFAULT 'pending',
      auth_verified_at TEXT,
      wechat_auth_transaction_id TEXT,
      member_tier TEXT DEFAULT 'free',
      member_expire_at TEXT,
      points INTEGER DEFAULT 0,
      total_spent_points INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',
      service_status TEXT DEFAULT 'normal',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      last_login_at TEXT,
      last_ad_show_time TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_merchant_openid ON Merchant(openid);
    CREATE INDEX IF NOT EXISTS idx_merchant_status ON Merchant(status);

    CREATE TABLE IF NOT EXISTS Merchant_Profile (
      id TEXT PRIMARY KEY,
      merchant_id TEXT NOT NULL,
      store_name TEXT NOT NULL,
      industry_cat TEXT,
      industry_tags TEXT,
      tone_style TEXT DEFAULT 'friendly',
      location_lat REAL,
      location_lng REAL,
      location_text TEXT,
      city TEXT,
      district TEXT,
      landmark_1 TEXT, landmark_1_distance INTEGER,
      landmark_2 TEXT, landmark_2_distance INTEGER,
      landmark_3 TEXT, landmark_3_distance INTEGER,
      contact_name TEXT, phone_number TEXT, wechat_id TEXT,
      customer_service_component TEXT,
      geo_level TEXT DEFAULT 'basic',
      license_url TEXT, license_no TEXT, license_name TEXT,
      wechat_realname_verified INTEGER DEFAULT 0,
      wechat_auth_transaction_id TEXT,
      service_status TEXT DEFAULT 'normal',
      total_spent_points INTEGER DEFAULT 0,
      last_ad_show_time TEXT,
      merchant_tags TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (merchant_id) REFERENCES Merchant(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_profile_merchant ON Merchant_Profile(merchant_id);

    CREATE TABLE IF NOT EXISTS Content (
      id TEXT PRIMARY KEY,
      merchant_id TEXT NOT NULL,
      type TEXT DEFAULT 'video',
      images TEXT, raw_video_url TEXT, final_video_url TEXT,
      title TEXT, description TEXT, description_geo TEXT,
      hashtags TEXT, script TEXT,
      geo_lat REAL, geo_lng REAL, geo_city TEXT, geo_district TEXT,
      hot_topic_keyword TEXT, hot_topic_score INTEGER DEFAULT 0,
      geo_exif_injected INTEGER DEFAULT 0,
      geo_visual_injected INTEGER DEFAULT 0,
      geo_text_injected INTEGER DEFAULT 0,
      audit_status TEXT DEFAULT 'pending',
      audit_result TEXT, audit_id TEXT,
      cos_path TEXT, file_size INTEGER, duration INTEGER,
      expire_at TEXT, storage_tier TEXT DEFAULT 'standard',
      distribute_channels TEXT, distribute_at TEXT,
      status TEXT DEFAULT 'pending',
      points_cost INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (merchant_id) REFERENCES Merchant(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_content_merchant ON Content(merchant_id);
    CREATE INDEX IF NOT EXISTS idx_content_status ON Content(status);

    CREATE TABLE IF NOT EXISTS Auth_Log (
      id TEXT PRIMARY KEY,
      merchant_id TEXT,
      auth_type TEXT NOT NULL,
      auth_action TEXT NOT NULL,
      wechat_transaction_id TEXT,
      wechat_api_response TEXT, wechat_callback_body TEXT,
      request_data TEXT, verified_data TEXT,
      auth_status TEXT DEFAULT 'pending',
      reject_reason TEXT,
      points_refunded INTEGER DEFAULT 0,
      points_refund_log_id TEXT,
      callback_url TEXT,
      callback_received_at TEXT, callback_processed_at TEXT,
      retry_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      ip_address TEXT, user_agent TEXT
    );

    CREATE TABLE IF NOT EXISTS Points_Log (
      id TEXT PRIMARY KEY,
      merchant_id TEXT NOT NULL,
      action TEXT NOT NULL,
      points INTEGER NOT NULL,
      balance_before INTEGER, balance_after INTEGER,
      description TEXT, related_id TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS Admin (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'operator',
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now')),
      last_login_at TEXT
    );

    CREATE TABLE IF NOT EXISTS System_Config (
      key TEXT PRIMARY KEY,
      value TEXT, description TEXT,
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- 短信验证码表
    CREATE TABLE IF NOT EXISTS SMS_Code (
      id           TEXT PRIMARY KEY,
      phone        TEXT NOT NULL,
      code         TEXT NOT NULL,
      purpose      TEXT NOT NULL,
      used         INTEGER DEFAULT 0,
      expired_at   TEXT NOT NULL,
      created_at   TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_sms_phone ON SMS_Code(phone, purpose, expired_at);

    -- 微信登录绑定表
    CREATE TABLE IF NOT EXISTS Wechat_Bind (
      id          TEXT PRIMARY KEY,
      merchant_id TEXT NOT NULL,
      openid      TEXT NOT NULL,
      unionid     TEXT,
      platform    TEXT DEFAULT 'miniapp',
      created_at  TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (merchant_id) REFERENCES Merchant(id) ON DELETE CASCADE
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_wechat_openid ON Wechat_Bind(openid, platform);
    CREATE INDEX IF NOT EXISTS idx_wechat_merchant ON Wechat_Bind(merchant_id);

    -- 店员表
    CREATE TABLE IF NOT EXISTS Staff (
      id TEXT PRIMARY KEY,
      merchant_id TEXT NOT NULL,
      openid TEXT NOT NULL,
      name TEXT, phone TEXT,
      status TEXT DEFAULT 'pending',
      invited_at TEXT, activated_at TEXT,
      verify_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_staff_merchant ON Staff(merchant_id);
    CREATE INDEX IF NOT EXISTS idx_staff_openid ON Staff(openid);

    -- 招募入口日志表
    CREATE TABLE IF NOT EXISTS Merchant_Recruit_Entry_Log (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      entry_type TEXT NOT NULL,
      action TEXT NOT NULL,
      from_page TEXT,
      device_info TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_recruit_user ON Merchant_Recruit_Entry_Log(user_id);
    CREATE INDEX IF NOT EXISTS idx_recruit_entry ON Merchant_Recruit_Entry_Log(entry_type);

    -- 核销券表
    CREATE TABLE IF NOT EXISTS Campaign_Voucher (
      id TEXT PRIMARY KEY,
      campaign_id TEXT,
      merchant_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      participation_id TEXT,
      code TEXT NOT NULL,
      code_hash TEXT,
      status TEXT DEFAULT 'unused',
      expires_at TEXT,
      verified_at TEXT,
      verified_by TEXT,
      verified_location TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_voucher_merchant ON Campaign_Voucher(merchant_id);
    CREATE INDEX IF NOT EXISTS idx_voucher_code ON Campaign_Voucher(code);
  `);
  console.log('✅ 数据库表初始化完成');
}

/** 测试连接 */
function testConnection() {
  try {
    const result = queryOne('SELECT sqlite_version() as version');
    console.log('✅ SQLite连接成功，版本:', result?.version);
    return true;
  } catch (err) {
    console.error('❌ SQLite连接失败:', err);
    return false;
  }
}

/** 关闭连接 */
function close() {
  db.close();
}

module.exports = { query, queryOne, execute, execBatch, initTables, testConnection, close, default: db };
