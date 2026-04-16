-- ============================================================
-- 邻里AI V17.0 数据库建表脚本 - 营销模块
-- ============================================================

USE `linli_ai`;

-- ============================================================
-- 营销活动表 (Marketing_Campaign)
-- ============================================================
CREATE TABLE IF NOT EXISTS `Marketing_Campaign` (
  `id` VARCHAR(32) PRIMARY KEY COMMENT '活动ID',
  `merchant_id` VARCHAR(32) NOT NULL COMMENT '商家ID',
  
  `type` ENUM('bargain', 'group', 'flash') NOT NULL COMMENT '活动类型',
  `title` VARCHAR(100) NOT NULL COMMENT '活动标题',
  `description` TEXT COMMENT '活动详情',
  `cover_image` VARCHAR(255) COMMENT '封面图URL',
  
  `original_price` INT NOT NULL COMMENT '原价（分）',
  `target_price` INT NOT NULL COMMENT '目标价/秒杀价（分）',
  `stock` INT NOT NULL COMMENT '总库存',
  `stock_used` INT DEFAULT 0 COMMENT '已用库存',
  
  `daily_limit` INT DEFAULT 0 COMMENT '每日限领（0不限）',
  `per_user_limit` INT DEFAULT 1 COMMENT '每人限领',
  `member_only` BOOLEAN DEFAULT FALSE COMMENT '仅会员可参与',
  
  `start_time` DATETIME NOT NULL COMMENT '开始时间',
  `end_time` DATETIME NOT NULL COMMENT '结束时间',
  `verify_expire_days` INT DEFAULT 7 COMMENT '券码有效天数',
  
  `rules` JSON COMMENT '扩展规则',
  
  `status` ENUM('draft', 'pending', 'active', 'ended', 'cancelled') DEFAULT 'draft',
  
  `view_count` INT DEFAULT 0 COMMENT '浏览量',
  `participate_count` INT DEFAULT 0 COMMENT '参与人数',
  `voucher_count` INT DEFAULT 0 COMMENT '发券数',
  `verify_count` INT DEFAULT 0 COMMENT '核销数',
  
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX `idx_merchant` (`merchant_id`),
  INDEX `idx_type` (`type`),
  INDEX `idx_status` (`status`),
  INDEX `idx_time` (`start_time`, `end_time`),
  FOREIGN KEY (`merchant_id`) REFERENCES `Merchant`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='营销活动表';

-- ============================================================
-- 活动参与表 (Campaign_Participation)
-- ============================================================
CREATE TABLE IF NOT EXISTS `Campaign_Participation` (
  `id` VARCHAR(32) PRIMARY KEY,
  `campaign_id` VARCHAR(32) NOT NULL,
  `merchant_id` VARCHAR(32) NOT NULL,
  `user_id` VARCHAR(32) NOT NULL COMMENT '用户ID',
  `openid` VARCHAR(64) COMMENT '微信OpenID',
  
  `current_price` INT COMMENT '当前价格（砍价用）',
  `help_count` INT DEFAULT 0 COMMENT '助力次数',
  
  `group_id` VARCHAR(32) COMMENT '拼团组ID',
  `is_leader` BOOLEAN DEFAULT FALSE COMMENT '是否团长',
  
  `grab_time` DATETIME COMMENT '抢购时间',
  
  `status` ENUM('pending', 'success', 'failed', 'expired') DEFAULT 'pending',
  `voucher_id` VARCHAR(32) COMMENT '关联券码ID',
  
  `device_fingerprint` VARCHAR(64) COMMENT '设备指纹',
  `ip` VARCHAR(45) COMMENT 'IP地址',
  
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX `idx_campaign` (`campaign_id`),
  INDEX `idx_user` (`user_id`),
  INDEX `idx_group` (`group_id`),
  INDEX `idx_status` (`status`),
  UNIQUE INDEX `idx_unique_participation` (`campaign_id`, `user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='活动参与表';

-- ============================================================
-- 砍价助力记录表 (Bargain_Help_Log)
-- ============================================================
CREATE TABLE IF NOT EXISTS `Bargain_Help_Log` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `participation_id` VARCHAR(32) NOT NULL COMMENT '参与记录ID',
  `campaign_id` VARCHAR(32) NOT NULL,
  
  `helper_user_id` VARCHAR(32) NOT NULL COMMENT '助力用户ID',
  `helper_openid` VARCHAR(64) COMMENT '助力用户OpenID',
  
  `reduce_amount` INT NOT NULL COMMENT '砍掉金额（分）',
  `before_amount` INT NOT NULL COMMENT '砍前金额',
  `after_amount` INT NOT NULL COMMENT '砍后金额',
  
  `device_fingerprint` VARCHAR(64) COMMENT '设备指纹',
  `ip` VARCHAR(45) COMMENT 'IP地址',
  
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE INDEX `idx_unique_help` (`participation_id`, `helper_user_id`),
  INDEX `idx_campaign` (`campaign_id`),
  INDEX `idx_helper` (`helper_user_id`),
  INDEX `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='砍价助力记录表';

-- ============================================================
-- 拼团组表 (Group_Session)
-- ============================================================
CREATE TABLE IF NOT EXISTS `Group_Session` (
  `id` VARCHAR(32) PRIMARY KEY,
  `campaign_id` VARCHAR(32) NOT NULL,
  `leader_user_id` VARCHAR(32) NOT NULL COMMENT '团长用户ID',
  
  `required_count` INT NOT NULL COMMENT '成团所需人数',
  `current_count` INT DEFAULT 1 COMMENT '当前人数',
  
  `status` ENUM('waiting', 'success', 'failed') DEFAULT 'waiting',
  `expire_at` DATETIME NOT NULL COMMENT '拼团过期时间',
  
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `success_at` DATETIME COMMENT '成团时间',
  
  INDEX `idx_campaign` (`campaign_id`),
  INDEX `idx_leader` (`leader_user_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_expire` (`expire_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='拼团组表';

-- ============================================================
-- 核销券表 (Campaign_Voucher)
-- ============================================================
CREATE TABLE IF NOT EXISTS `Campaign_Voucher` (
  `id` VARCHAR(32) PRIMARY KEY,
  `campaign_id` VARCHAR(32) NOT NULL,
  `merchant_id` VARCHAR(32) NOT NULL,
  `user_id` VARCHAR(32) NOT NULL,
  `participation_id` VARCHAR(32) COMMENT '关联参与记录',
  
  `code` VARCHAR(20) NOT NULL COMMENT '券码',
  `code_hash` VARCHAR(64) COMMENT '券码哈希',
  
  `status` ENUM('unused', 'used', 'expired', 'cancelled') DEFAULT 'unused',
  `expires_at` DATETIME NOT NULL COMMENT '过期时间',
  
  `verified_at` DATETIME COMMENT '核销时间',
  `verified_by` VARCHAR(32) COMMENT '核销人（店员ID）',
  `verified_location` JSON COMMENT '核销位置（经纬度）',
  
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE INDEX `idx_code` (`code`),
  INDEX `idx_code_hash` (`code_hash`),
  INDEX `idx_user` (`user_id`),
  INDEX `idx_merchant` (`merchant_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_expires` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='核销券表';

-- ============================================================
-- 核销尝试日志表 (Verify_Attempt_Log)
-- ============================================================
CREATE TABLE IF NOT EXISTS `Verify_Attempt_Log` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `voucher_code` VARCHAR(20) NOT NULL,
  `merchant_id` VARCHAR(32) NOT NULL,
  `staff_id` VARCHAR(32) COMMENT '操作店员ID',
  
  `result` ENUM('success', 'invalid', 'expired', 'already_used', 'wrong_location') NOT NULL,
  `error_message` VARCHAR(255) COMMENT '错误信息',
  
  `verify_location` JSON COMMENT '核销位置',
  `merchant_location` JSON COMMENT '商家位置',
  `distance_meters` INT COMMENT '距离（米）',
  
  `ip` VARCHAR(45) COMMENT 'IP地址',
  `device_fingerprint` VARCHAR(64) COMMENT '设备指纹',
  
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  INDEX `idx_voucher` (`voucher_code`),
  INDEX `idx_merchant` (`merchant_id`),
  INDEX `idx_result` (`result`),
  INDEX `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='核销尝试日志表';

-- ============================================================
-- 活动分享记录表 (Activity_Share_Log)
-- ============================================================
CREATE TABLE IF NOT EXISTS `Activity_Share_Log` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `campaign_id` VARCHAR(32) NOT NULL,
  `user_id` VARCHAR(32) NOT NULL,
  `participation_id` VARCHAR(32) COMMENT '关联参与记录',
  
  `share_channel` ENUM('wechat_friend', 'wechat_moments', 'wechat_group', 'other') NOT NULL,
  `share_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  `click_count` INT DEFAULT 0 COMMENT '点击次数',
  `convert_count` INT DEFAULT 0 COMMENT '转化次数',
  
  INDEX `idx_campaign` (`campaign_id`),
  INDEX `idx_user` (`user_id`),
  INDEX `idx_channel` (`share_channel`),
  INDEX `idx_time` (`share_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='活动分享记录表';

-- ============================================================
-- 订单表 (Order)
-- ============================================================
CREATE TABLE IF NOT EXISTS `Order` (
  `id` VARCHAR(32) PRIMARY KEY,
  `out_trade_no` VARCHAR(64) NOT NULL COMMENT '商户订单号',
  `merchant_id` VARCHAR(32) NOT NULL,
  
  `type` ENUM('points', 'subscription') COMMENT '订单类型',
  `product_id` VARCHAR(32) COMMENT '商品ID',
  `amount` INT NOT NULL COMMENT '金额（分）',
  
  `status` ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
  `platform` ENUM('android', 'ios', 'h5') COMMENT '支付平台',
  
  `transaction_id` VARCHAR(64) COMMENT '微信支付交易号',
  `paid_at` DATETIME COMMENT '支付时间',
  
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX `idx_out_trade_no` (`out_trade_no`),
  INDEX `idx_merchant` (`merchant_id`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单表';

-- ============================================================
-- 积分流水表 (Points_Log)
-- ============================================================
CREATE TABLE IF NOT EXISTS `Points_Log` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `merchant_id` VARCHAR(32) NOT NULL,
  
  `type` ENUM('earn', 'deduct', 'refund', 'gift') COMMENT '类型',
  `points` INT NOT NULL COMMENT '积分数量（正数）',
  `balance_before` INT COMMENT '变动前余额',
  `balance_after` INT COMMENT '变动后余额',
  
  `description` VARCHAR(200) COMMENT '描述',
  `related_id` VARCHAR(32) COMMENT '关联ID（订单ID/内容ID）',
  
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  INDEX `idx_merchant` (`merchant_id`),
  INDEX `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='积分流水表';

-- ============================================================
-- 店员表 (Staff)
-- ============================================================
CREATE TABLE IF NOT EXISTS `Staff` (
  `id` VARCHAR(32) PRIMARY KEY,
  `merchant_id` VARCHAR(32) NOT NULL COMMENT '所属商家ID',
  `openid` VARCHAR(64) NOT NULL COMMENT '店员OpenID',
  
  `name` VARCHAR(50) COMMENT '店员姓名',
  `phone` VARCHAR(20) COMMENT '店员手机号',
  
  `status` ENUM('pending', 'active', 'inactive') DEFAULT 'pending',
  `invited_at` DATETIME COMMENT '邀请时间',
  `activated_at` DATETIME COMMENT '激活时间',
  
  `verify_count` INT DEFAULT 0 COMMENT '核销次数',
  
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX `idx_merchant` (`merchant_id`),
  INDEX `idx_openid` (`openid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='店员表';
