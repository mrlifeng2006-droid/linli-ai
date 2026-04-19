-- 邻里AI V17.0 数据库迁移脚本
-- 运行时机：每次 database/index.js initDatabase() 时自动检测执行

-- ============================================================
-- Migration: V17.0_add_fields
-- 说明：商家入驻功能新增字段
-- ============================================================

-- Merchant_Profile: 新增 target_customer 字段
ALTER TABLE Merchant_Profile ADD COLUMN target_customer TEXT;

-- System_Config: 新增商家入驻配置项（如果不存在则插入）
INSERT OR IGNORE INTO System_Config (key, value, description) VALUES
  ('profile_cooldown_days', '30', '商家店铺信息修改冷却期（天），0=不限制'),
  ('allow_merchant_change_industry', 'false', '是否允许商家自行修改行业类型');
