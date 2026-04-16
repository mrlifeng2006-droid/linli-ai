-- ============================================================
-- 邻里AI V17.0 数据库建表脚本 - 系统与工具模块
-- ============================================================

USE `linli_ai`;

-- ============================================================
-- 开屏广告表 (Splash_Ad)
-- ============================================================
CREATE TABLE IF NOT EXISTS `Splash_Ad` (
  `id` VARCHAR(32) PRIMARY KEY COMMENT '广告ID',
  `name` VARCHAR(100) NOT NULL COMMENT '广告名称',
  
  `type` ENUM('platform', 'self', 'activity') COMMENT '广告类型',
  `media_type` ENUM('image', 'video') COMMENT '素材类型',
  `media_url` VARCHAR(500) NOT NULL COMMENT '素材URL',
  `media_md5` VARCHAR(32) COMMENT '素材MD5值',
  `media_size` BIGINT COMMENT '素材文件大小（字节）',
  `thumbnail_url` VARCHAR(500) COMMENT '缩略图URL',
  
  `title` VARCHAR(100) COMMENT '广告标题',
  `subtitle` VARCHAR(200) COMMENT '副标题',
  `landing_page` VARCHAR(500) COMMENT '落地页URL',
  
  `target_audience` JSON COMMENT '目标人群配置',
  `start_time` DATETIME COMMENT '投放开始时间',
  `end_time` DATETIME COMMENT '投放结束时间',
  `daily_budget` DECIMAL(10, 2) COMMENT '每日预算',
  
  `impressions` INT DEFAULT 0 COMMENT '曝光量',
  `clicks` INT DEFAULT 0 COMMENT '点击量',
  `skip_count` INT DEFAULT 0 COMMENT '跳过次数',
  
  `cpm_rate` DECIMAL(10, 2) COMMENT 'CPM费率（元/千次）',
  `cpc_rate` DECIMAL(10, 2) COMMENT 'CPC费率（元/次）',
  `revenue` DECIMAL(10, 2) DEFAULT 0 COMMENT '累计收入',
  
  `status` ENUM('pending', 'active', 'paused', 'ended') DEFAULT 'pending' COMMENT '投放状态',
  `priority` INT DEFAULT 0 COMMENT '优先级',
  
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX `idx_status` (`status`),
  INDEX `idx_time` (`start_time`, `end_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='开屏广告表';

-- ============================================================
-- 广告曝光日志表 (Ad_Impression_Log)
-- ============================================================
CREATE TABLE IF NOT EXISTS `Ad_Impression_Log` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `ad_id` VARCHAR(32) NOT NULL COMMENT '广告ID',
  `merchant_id` VARCHAR(32) COMMENT '商家ID',
  
  `type` ENUM('show', 'click', 'skip') COMMENT '行为类型',
  `device_info` VARCHAR(500) COMMENT '设备信息',
  `location` VARCHAR(100) COMMENT '用户位置',
  
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  INDEX `idx_ad` (`ad_id`),
  INDEX `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='广告曝光日志表';

-- ============================================================
-- 内容审核表 (Content_Audit)
-- ============================================================
CREATE TABLE IF NOT EXISTS `Content_Audit` (
  `id` VARCHAR(32) PRIMARY KEY COMMENT '审核ID',
  `content_id` VARCHAR(32) NOT NULL COMMENT '内容ID',
  
  `status` ENUM('pending', 'approved', 'rejected') COMMENT '审核状态',
  `risk_level` ENUM('low', 'medium', 'high') COMMENT '风险等级',
  `violation_type` VARCHAR(100) COMMENT '违规类型',
  `violation_details` TEXT COMMENT '违规详情',
  
  `audit_provider` VARCHAR(50) COMMENT '审核服务商',
  `audit_result` TEXT COMMENT '审核原始结果',
  
  `auditor_id` VARCHAR(32) COMMENT '人工审核员ID',
  `audited_at` DATETIME COMMENT '审核时间',
  
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  INDEX `idx_content` (`content_id`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='内容审核表';

-- ============================================================
-- GEO注入日志表 (GEO_Injection_Log)
-- ============================================================
CREATE TABLE IF NOT EXISTS `GEO_Injection_Log` (
  `id` VARCHAR(32) PRIMARY KEY,
  `content_id` VARCHAR(32) NOT NULL,
  `merchant_id` VARCHAR(32) NOT NULL,
  
  `exif_injected` BOOLEAN DEFAULT FALSE,
  `visual_mask_injected` BOOLEAN DEFAULT FALSE,
  `text_anchor_injected` BOOLEAN DEFAULT FALSE,
  
  `landmarks_used` JSON COMMENT '使用的地标',
  `level` ENUM('basic', 'standard', 'advanced') COMMENT 'GEO等级',
  
  `duration_ms` INT COMMENT '注入耗时（毫秒）',
  `error_message` TEXT COMMENT '错误信息',
  
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  INDEX `idx_content` (`content_id`),
  INDEX `idx_merchant` (`merchant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='GEO注入日志表';

-- ============================================================
-- 热点表 (Hot_Topic)
-- ============================================================
CREATE TABLE IF NOT EXISTS `Hot_Topic` (
  `id` VARCHAR(32) PRIMARY KEY,
  `keyword` VARCHAR(100) NOT NULL COMMENT '关键词',
  `heat` INT COMMENT '热度值',
  
  `category` VARCHAR(50) COMMENT '分类',
  `source` VARCHAR(50) COMMENT '来源',
  
  `fetched_at` DATETIME COMMENT '抓取时间',
  `expires_at` DATETIME COMMENT '过期时间',
  
  INDEX `idx_keyword` (`keyword`),
  INDEX `idx_heat` (`heat`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='热点表';

-- ============================================================
-- Agent决策日志表 (Agent_Decision_Log)
-- ============================================================
CREATE TABLE IF NOT EXISTS `Agent_Decision_Log` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `merchant_id` VARCHAR(32) NOT NULL,
  
  `type` VARCHAR(50) COMMENT '决策类型',
  `message` TEXT COMMENT '决策消息',
  `priority` ENUM('low', 'medium', 'high') COMMENT '优先级',
  
  `executed_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  INDEX `idx_merchant` (`merchant_id`),
  INDEX `idx_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Agent决策日志表';

-- ============================================================
-- Agent感知日志表 (Agent_Perception_Log)
-- ============================================================
CREATE TABLE IF NOT EXISTS `Agent_Perception_Log` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `merchant_id` VARCHAR(32) NOT NULL COMMENT '商家ID',
  
  `trigger_type` ENUM('weather', 'hot_topic', 'holiday', 'inactive', 'points_low', 'member_expiring') NOT NULL COMMENT '触发类型',
  
  `trigger_data` JSON COMMENT '触发数据详情',
  
  `suggestion` TEXT COMMENT 'AI生成的营销建议',
  `suggestion_title` VARCHAR(100) COMMENT '建议标题',
  
  `action_taken` BOOLEAN DEFAULT FALSE COMMENT '商家是否采纳建议',
  `action_type` VARCHAR(50) COMMENT '采取的行动类型',
  `action_at` DATETIME COMMENT '采取行动的时间',
  
  `related_content_id` VARCHAR(32) COMMENT '关联的内容ID',
  
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  INDEX `idx_merchant` (`merchant_id`),
  INDEX `idx_trigger_type` (`trigger_type`),
  INDEX `idx_created` (`created_at`),
  INDEX `idx_action_taken` (`action_taken`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Agent感知日志表';

-- ============================================================
-- 招募入口埋点表 (Merchant_Recruit_Entry_Log)
-- ============================================================
CREATE TABLE IF NOT EXISTS `Merchant_Recruit_Entry_Log` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `user_id` VARCHAR(32) COMMENT '用户ID',
  
  `entry_type` ENUM('tab_bar', 'personal_center', 'share_page', 'splash_ad', 'push') NOT NULL COMMENT '入口类型',
  `action` ENUM('view', 'click') NOT NULL COMMENT '行为类型',
  
  `from_page` VARCHAR(100) COMMENT '来源页面',
  `device_info` JSON COMMENT '设备信息',
  
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  INDEX `idx_user` (`user_id`),
  INDEX `idx_entry` (`entry_type`),
  INDEX `idx_action` (`action`),
  INDEX `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='招募入口埋点日志表';

-- ============================================================
-- 招募推送日志表 (Merchant_Recruit_Push_Log)
-- ============================================================
CREATE TABLE IF NOT EXISTS `Merchant_Recruit_Push_Log` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `user_id` VARCHAR(32) NOT NULL COMMENT '用户ID',
  
  `trigger_type` ENUM('open_3times', 'first_order', 'holiday') COMMENT '触发类型',
  `push_content` TEXT COMMENT '推送内容',
  
  `pushed_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '推送时间',
  `clicked` BOOLEAN DEFAULT FALSE COMMENT '是否点击',
  `clicked_at` DATETIME COMMENT '点击时间',
  
  INDEX `idx_user` (`user_id`),
  INDEX `idx_trigger` (`trigger_type`),
  INDEX `idx_pushed` (`pushed_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='招募推送日志表';

-- ============================================================
-- 定价配置表 (Pricing_Config)
-- ============================================================
CREATE TABLE IF NOT EXISTS `Pricing_Config` (
  `id` VARCHAR(32) PRIMARY KEY,
  `service_type` VARCHAR(50) NOT NULL COMMENT '服务类型',
  
  `base_points` INT NOT NULL COMMENT '基础积分',
  `audit_cost_included` BOOLEAN DEFAULT FALSE,
  `audit_cost_points` INT DEFAULT 0,
  `geo_cost_included` BOOLEAN DEFAULT FALSE,
  `geo_cost_points` INT DEFAULT 0,
  
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE INDEX `idx_service` (`service_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='定价配置表';

-- ============================================================
-- 系统配置表 (System_Config)
-- ============================================================
CREATE TABLE IF NOT EXISTS `System_Config` (
  `key` VARCHAR(100) PRIMARY KEY,
  `value` JSON NOT NULL COMMENT '配置值',
  `description` VARCHAR(200) COMMENT '配置说明',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统配置表';

-- ============================================================
-- 初始化系统配置
-- ============================================================
INSERT INTO `System_Config` (`key`, `value`, `description`) VALUES
('customer_service', '{"wechat_id": "neighborai_service", "qr_code_url": ""}', '客服配置'),
('points_pricing', '{"20": 100, "50": 200, "100": 350, "200": 600}', '积分定价'),
('subscription_pricing', '{"professional_monthly": 2990, "professional_yearly": 19900, "premium_yearly": 19900}', '订阅定价'),
('content_lifecycle', '{"free_days": 7, "professional_days": 30, "premium_days": -1}', '素材保留天数（-1表示永久）'),
('geo_landmarks', '{"min_distance": 100, "max_distance": 3000, "min_count": 3}', '地标配置'),
('video_settings', '{"max_duration": 60, "max_file_size": 52428800, "codec": "h264"}', '视频配置');

-- ============================================================
-- 初始化定价配置
-- ============================================================
INSERT INTO `Pricing_Config` (`id`, `service_type`, `base_points`, `audit_cost_included`, `geo_cost_included`) VALUES
('price_content_basic', 'content_basic', 50, TRUE, FALSE),
('price_content_geo', 'content_geo', 80, TRUE, TRUE),
('price_marketing_bargain', 'marketing_bargain', 30, FALSE, FALSE),
('price_marketing_group', 'marketing_group', 50, FALSE, FALSE),
('price_marketing_flash', 'marketing_flash', 40, FALSE, FALSE);
