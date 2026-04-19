-- 邻里AI V17.0 完整数据库Schema
-- 由 database/index.js 的 initDatabase() 自动加载执行

CREATE TABLE IF NOT EXISTS Merchant (
  id TEXT PRIMARY KEY,
  openid TEXT,
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

CREATE TABLE IF NOT EXISTS SMS_Code (
  id TEXT PRIMARY KEY,
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  purpose TEXT NOT NULL,
  used INTEGER DEFAULT 0,
  expired_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_sms_phone ON SMS_Code(phone, purpose, expired_at);

CREATE TABLE IF NOT EXISTS Wechat_Bind (
  id TEXT PRIMARY KEY,
  merchant_id TEXT NOT NULL,
  openid TEXT NOT NULL,
  unionid TEXT,
  platform TEXT DEFAULT 'miniapp',
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (merchant_id) REFERENCES Merchant(id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_wechat_openid ON Wechat_Bind(openid, platform);
CREATE INDEX IF NOT EXISTS idx_wechat_merchant ON Wechat_Bind(merchant_id);

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

CREATE TABLE IF NOT EXISTS Marketing_Campaign (
  id TEXT PRIMARY KEY,
  merchant_id TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  cover_image TEXT,
  original_price INTEGER NOT NULL,
  target_price INTEGER NOT NULL,
  stock INTEGER NOT NULL,
  stock_used INTEGER DEFAULT 0,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  verify_expire_days INTEGER DEFAULT 7,
  rules TEXT,
  status TEXT DEFAULT 'active',
  participate_count INTEGER DEFAULT 0,
  voucher_count INTEGER DEFAULT 0,
  verify_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_campaign_merchant ON Marketing_Campaign(merchant_id);

CREATE TABLE IF NOT EXISTS Campaign_Participation (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  current_price INTEGER,
  help_count INTEGER DEFAULT 0,
  group_id TEXT,
  is_leader INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  device_fingerprint TEXT,
  ip TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_participation_campaign ON Campaign_Participation(campaign_id);

CREATE TABLE IF NOT EXISTS Bargain_Help_Log (
  id TEXT PRIMARY KEY,
  participation_id TEXT NOT NULL,
  helper_user_id TEXT NOT NULL,
  reduce_amount INTEGER NOT NULL,
  before_amount INTEGER NOT NULL,
  after_amount INTEGER NOT NULL,
  device_fingerprint TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_help_participation ON Bargain_Help_Log(participation_id);

CREATE TABLE IF NOT EXISTS Group_Session (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL,
  leader_user_id TEXT NOT NULL,
  required_count INTEGER NOT NULL,
  current_count INTEGER DEFAULT 1,
  status TEXT DEFAULT 'waiting',
  expire_at TEXT NOT NULL,
  success_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_group_campaign ON Group_Session(campaign_id);

CREATE TABLE IF NOT EXISTS Verify_Attempt_Log (
  id TEXT PRIMARY KEY,
  voucher_code TEXT NOT NULL,
  merchant_id TEXT NOT NULL,
  staff_id TEXT,
  result TEXT NOT NULL,
  error_message TEXT,
  distance_meters INTEGER,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_verify_code ON Verify_Attempt_Log(voucher_code);

CREATE TABLE IF NOT EXISTS Activity_Share_Log (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  share_channel TEXT,
  click_count INTEGER DEFAULT 0,
  convert_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_share_campaign ON Activity_Share_Log(campaign_id);

CREATE TABLE IF NOT EXISTS Merchant_Session (
  id TEXT PRIMARY KEY,
  merchant_id TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  refresh_token TEXT,
  ip_address TEXT,
  user_agent TEXT,
  last_active_at TEXT DEFAULT (datetime('now')),
  expired_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_session_token ON Merchant_Session(token);
CREATE INDEX IF NOT EXISTS idx_session_merchant ON Merchant_Session(merchant_id);

CREATE TABLE IF NOT EXISTS Distribution_History (
  id TEXT PRIMARY KEY,
  merchant_id TEXT NOT NULL,
  content_id TEXT,
  platform TEXT NOT NULL,
  content_text TEXT NOT NULL,
  hashtags TEXT,
  geo_tag TEXT,
  city_tag TEXT,
  status TEXT DEFAULT 'published',
  publish_at TEXT DEFAULT (datetime('now')),
  views INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (merchant_id) REFERENCES Merchant(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_dist_merchant ON Distribution_History(merchant_id, publish_at DESC);
CREATE INDEX IF NOT EXISTS idx_dist_platform ON Distribution_History(platform, publish_at DESC);
