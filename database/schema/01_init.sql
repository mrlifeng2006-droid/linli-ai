-- ============================================================
-- 邻里AI V17.0 数据库初始化脚本
-- 数据库: linli_ai
-- 创建时间: 2026-04-16
-- ============================================================

-- 创建数据库
CREATE DATABASE IF NOT EXISTS `linli_ai` 
  DEFAULT CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE `linli_ai`;

-- ============================================================
-- 商家表 (Merchant)
-- ============================================================
CREATE TABLE IF NOT EXISTS `Merchant` (
  `id` VARCHAR(32) PRIMARY KEY COMMENT '商家ID',
  `openid` VARCHAR(64) NOT NULL COMMENT '微信OpenID',
  `unionid` VARCHAR(64) COMMENT '微信UnionID',
  `phone` VARCHAR(20) COMMENT '手机号',
  `nickname` VARCHAR(100) COMMENT '昵称',
  `avatar_url` VARCHAR(500) COMMENT '头像URL',
  
  -- 认证信息
  `auth_type` ENUM('wechat_realname', 'business_license') COMMENT '认证类型',
  `auth_status` ENUM('pending', 'approved', 'rejected') DEFAULT 'pending' COMMENT '认证状态',
  `auth_verified_at` DATETIME COMMENT '认证通过时间',
  `wechat_auth_transaction_id` VARCHAR(64) COMMENT '微信实名认证交易单号',
  
  -- 会员信息
  `member_tier` ENUM('free', 'professional', 'premium') DEFAULT 'free' COMMENT '会员等级',
  `member_expire_at` DATETIME COMMENT '会员过期时间',
  
  -- 积分信息
  `points` INT DEFAULT 0 COMMENT '当前积分余额',
  `total_spent_points` INT DEFAULT 0 COMMENT '累计消耗积分',
  
  -- 状态
  `status` ENUM('active', 'banned', 'deleted') DEFAULT 'active' COMMENT '商家状态',
  `service_status` ENUM('normal', 'banned') DEFAULT 'normal' COMMENT '服务状态',
  
  -- 时间戳
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_login_at` DATETIME COMMENT '最后登录时间',
  `last_ad_show_time` DATETIME COMMENT '上次广告展示时间',
  
  INDEX `idx_openid` (`openid`),
  INDEX `idx_phone` (`phone`),
  INDEX `idx_status` (`status`),
  INDEX `idx_member_tier` (`member_tier`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商家表';

-- ============================================================
-- 认证流水日志表 (Auth_Log)
-- ============================================================
CREATE TABLE IF NOT EXISTS `Auth_Log` (
  `id` VARCHAR(32) PRIMARY KEY COMMENT '认证日志ID',
  `merchant_id` VARCHAR(32) COMMENT '商家ID',
  
  `auth_type` ENUM('wechat_realname', 'business_license', 'phone') NOT NULL COMMENT '认证类型',
  `auth_action` ENUM('init', 'callback', 'success', 'fail', 'retry') NOT NULL COMMENT '认证动作',
  
  `wechat_transaction_id` VARCHAR(128) COMMENT '微信认证交易单号',
  `wechat_api_response` JSON COMMENT '微信接口原始响应',
  `wechat_callback_body` JSON COMMENT '微信回调原始报文',
  
  `request_data` JSON COMMENT '发起认证时的请求数据',
  `verified_data` JSON COMMENT '认证通过后的核实数据',
  
  `auth_status` ENUM('pending', 'approved', 'rejected') DEFAULT 'pending' COMMENT '认证状态',
  `reject_reason` VARCHAR(200) COMMENT '拒绝原因',
  
  `points_refunded` INT DEFAULT 0 COMMENT '已返还积分数量',
  `points_refund_log_id` VARCHAR(32) COMMENT '关联的积分流水记录ID',
  
  `callback_url` VARCHAR(200) COMMENT '微信回调地址',
  `callback_received_at` DATETIME COMMENT '收到微信回调时间',
  `callback_processed_at` DATETIME COMMENT '回调处理完成时间',
  `retry_count` INT DEFAULT 0 COMMENT '重试次数',
  
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `ip_address` VARCHAR(45) COMMENT '发起方IP',
  `user_agent` VARCHAR(500) COMMENT '发起方UA',
  
  INDEX `idx_merchant` (`merchant_id`),
  INDEX `idx_transaction` (`wechat_transaction_id`),
  INDEX `idx_status` (`auth_status`),
  INDEX `idx_created` (`created_at`),
  INDEX `idx_callback_received` (`callback_received_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='认证流水日志表';

-- ============================================================
-- 商家画像表 (Merchant_Profile)
-- ============================================================
CREATE TABLE IF NOT EXISTS `Merchant_Profile` (
  `id` VARCHAR(32) PRIMARY KEY COMMENT '画像ID',
  `merchant_id` VARCHAR(32) NOT NULL COMMENT '商家ID',
  
  `store_name` VARCHAR(100) NOT NULL COMMENT '店铺名称',
  `industry_cat` VARCHAR(100) COMMENT '行业分类',
  `industry_tags` JSON COMMENT '行业标签数组',
  `tone_style` ENUM('humorous', 'premium', 'friendly', 'literary') COMMENT '品牌调性',
  
  `location_lat` DECIMAL(10, 6) COMMENT '纬度',
  `location_lng` DECIMAL(10, 6) COMMENT '经度',
  `location_text` VARCHAR(200) COMMENT '地址文本',
  `city` VARCHAR(50) COMMENT '城市',
  `district` VARCHAR(50) COMMENT '区县',
  
  `landmark_1` VARCHAR(100) COMMENT '地标1名称',
  `landmark_1_distance` INT COMMENT '地标1距离（米）',
  `landmark_2` VARCHAR(100) COMMENT '地标2名称',
  `landmark_2_distance` INT COMMENT '地标2距离（米）',
  `landmark_3` VARCHAR(100) COMMENT '地标3名称',
  `landmark_3_distance` INT COMMENT '地标3距离（米）',
  
  `contact_name` VARCHAR(50) COMMENT '联系人姓名',
  `phone_number` VARCHAR(20) COMMENT '联系电话',
  `wechat_id` VARCHAR(50) COMMENT '微信号',
  `customer_service_component` VARCHAR(200) COMMENT '在线客服组件',
  
  `geo_level` ENUM('basic', 'standard', 'advanced') DEFAULT 'basic' COMMENT 'GEO注入等级',
  
  `license_url` VARCHAR(500) COMMENT '营业执照URL',
  `license_no` VARCHAR(50) COMMENT '营业执照号',
  `license_name` VARCHAR(100) COMMENT '执照上的企业名称',
  
  `wechat_realname_verified` BOOLEAN DEFAULT FALSE COMMENT '微信实名认证是否通过',
  `wechat_auth_transaction_id` VARCHAR(64) COMMENT '微信实名认证交易单号',
  
  `service_status` ENUM('normal', 'banned', 'suspended') DEFAULT 'normal' COMMENT '商家状态',
  `total_spent_points` INT DEFAULT 0 COMMENT '累计消耗积分',
  `last_ad_show_time` DATETIME COMMENT '上次广告展示时间',
  
  `merchant_tags` JSON COMMENT '商家个性化特征标签',
  
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX `idx_merchant` (`merchant_id`),
  INDEX `idx_location` (`location_lat`, `location_lng`),
  INDEX `idx_service_status` (`service_status`),
  FOREIGN KEY (`merchant_id`) REFERENCES `Merchant`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商家画像表';

-- ============================================================
-- 内容表 (Content)
-- ============================================================
CREATE TABLE IF NOT EXISTS `Content` (
  `id` VARCHAR(32) PRIMARY KEY COMMENT '内容ID',
  `merchant_id` VARCHAR(32) NOT NULL COMMENT '商家ID',
  
  `type` ENUM('video', 'image', 'text') DEFAULT 'video' COMMENT '内容类型',
  
  `images` JSON COMMENT '上传的图片URL数组',
  `raw_video_url` VARCHAR(500) COMMENT '原始视频URL',
  `final_video_url` VARCHAR(500) COMMENT '最终视频URL',
  
  `title` VARCHAR(200) COMMENT '标题',
  `description` TEXT COMMENT '文案描述',
  `description_geo` TEXT COMMENT 'GEO注入后的文案',
  `hashtags` JSON COMMENT '标签数组',
  `script` TEXT COMMENT '数字人口播脚本',
  
  `hot_topic_keyword` VARCHAR(100) COMMENT '使用的热点词',
  `hot_topic_score` INT COMMENT '热点匹配分数',
  
  `geo_exif_injected` BOOLEAN DEFAULT FALSE COMMENT 'Exif是否注入',
  `geo_visual_injected` BOOLEAN DEFAULT FALSE COMMENT '视觉掩码是否注入',
  `geo_text_injected` BOOLEAN DEFAULT FALSE COMMENT '文案锚点是否注入',
  
  `audit_status` ENUM('pending', 'approved', 'rejected') DEFAULT 'pending' COMMENT '审核状态',
  `audit_result` TEXT COMMENT '审核结果',
  `audit_id` VARCHAR(32) COMMENT '审核记录ID',
  
  `cos_path` VARCHAR(500) COMMENT 'COS存储路径',
  `file_size` INT COMMENT '文件大小（字节）',
  `duration` INT COMMENT '视频时长（秒）',
  
  `expire_at` DATETIME COMMENT '素材过期时间',
  `storage_tier` ENUM('temp', 'standard', 'permanent') DEFAULT 'standard' COMMENT '存储等级',
  
  `distribute_channels` JSON COMMENT '已分发平台数组',
  `distribute_at` DATETIME COMMENT '分发时间',
  
  `status` ENUM('pending', 'ai_processing', 'video_generating', 'geo_injecting', 
                'audit_pending', 'approved', 'rejected', 'stored', 'distributed',
                'failed') DEFAULT 'pending' COMMENT '内容状态',
  
  `points_cost` INT COMMENT '消耗积分',
  
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX `idx_merchant` (`merchant_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_created` (`created_at`),
  INDEX `idx_expire` (`expire_at`),
  FOREIGN KEY (`merchant_id`) REFERENCES `Merchant`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='内容表';
