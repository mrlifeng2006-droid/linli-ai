-- ============================================================
-- 邻里AI V17.0 数据库迁移
-- 增加用户相关表和索引
-- 运行方式: node -e "require('./core/database').execBatch(require('fs').readFileSync('./src/core/database/migration.sql','utf8'))"
-- ============================================================

-- 短信验证码表（开发环境简化版，生产环境建议用Redis）
CREATE TABLE IF NOT EXISTS SMS_Code (
  id           TEXT PRIMARY KEY,
  phone        TEXT NOT NULL,
  code         TEXT NOT NULL,
  purpose      TEXT NOT NULL,       -- 'login' | 'register' | 'bind_phone'
  used         INTEGER DEFAULT 0,
  expired_at   TEXT NOT NULL,       -- 过期时间
  created_at   TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_sms_phone ON SMS_Code(phone, purpose, expired_at);

-- 商户登录会话表（记录每次登录，可选）
CREATE TABLE IF NOT EXISTS Merchant_Session (
  id              TEXT PRIMARY KEY,
  merchant_id     TEXT NOT NULL,
  token           TEXT UNIQUE NOT NULL,
  refresh_token   TEXT,
  ip_address      TEXT,
  user_agent      TEXT,
  last_active_at  TEXT DEFAULT (datetime('now')),
  expired_at      TEXT NOT NULL,
  created_at      TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_session_token ON Merchant_Session(token);
CREATE INDEX IF NOT EXISTS idx_session_merchant ON Merchant_Session(merchant_id);

-- 微信登录绑定表（用于多端登录）
CREATE TABLE IF NOT EXISTS Wechat_Bind (
  id          TEXT PRIMARY KEY,
  merchant_id TEXT NOT NULL,
  openid      TEXT NOT NULL,
  unionid     TEXT,
  platform    TEXT DEFAULT 'miniapp',   -- miniapp | official | h5
  created_at  TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (merchant_id) REFERENCES Merchant(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_wechat_openid ON Wechat_Bind(openid, platform);
CREATE INDEX IF NOT EXISTS idx_wechat_merchant ON Wechat_Bind(merchant_id);
