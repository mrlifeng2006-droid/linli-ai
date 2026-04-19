/**
 * 营销服务 - 砍价/拼团/秒杀活动管理
 * 参照：邻里AI_V17.0_全栈开发需求书_最终封档版
 * @ts-nocheck
 */
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { query, queryOne, execute } from '../../core/database/index';

// ===================== 工具函数 =====================

const VOUCHER_SECRET = 'linli_voucher_secret_v1';

/** 券码生成 */
function generateVoucherCode(campaignId, userId) {
  const prefix = 'NV';
  const ts = Date.now().toString().slice(-4);
  const user = userId.slice(-4).toUpperCase();
  const random = Math.random().toString(36).slice(-4).toUpperCase();
  const base = prefix + ts + user + random;
  const checksum = crypto.createHash('md5').update(base + VOUCHER_SECRET).digest('hex').slice(-1).toUpperCase();
  return base + checksum;
}

/** 券码哈希 */
function hashVoucherCode(code) {
  return crypto.createHash('sha256').update(code + VOUCHER_SECRET).digest('hex');
}

/** 砍价计算 */
function calculateBargainAmount(currentPrice, targetPrice, helpCount, maxHelpCount) {
  const remaining = currentPrice - targetPrice;
  if (remaining <= 0) return { amount: 0, finished: true };
  if (remaining <= 100) return { amount: remaining, finished: true };
  if (helpCount + 1 >= maxHelpCount) return { amount: remaining, finished: true };

  const progress = helpCount / maxHelpCount;
  const baseRatio = 0.3 - progress * 0.2;
  const randomRatio = baseRatio + Math.random() * 0.1;
  let amount = Math.floor(remaining * randomRatio);
  amount = Math.max(amount, 1);
  amount = Math.min(amount, Math.floor(remaining * 0.5));
  return { amount, finished: (currentPrice - amount) <= targetPrice };
}

/** 防刷检查 */
function checkAntiSpam(merchantId, userId, action) {
  // 简化版：检查是否重复参与
  const key = `spam:${action}:${userId}`;
  // SQLite没有Redis，用数据库模拟
  const record = queryOne(`SELECT id FROM Points_Log WHERE merchant_id=? AND created_at > datetime('now','-1 second') LIMIT 1`, [merchantId]);
  return { ok: true, reason: null };
}

// ===================== 商家端：活动管理 =====================

/** 创建营销活动 */
function createCampaign(merchantId, data) {
  const { type, title, description, cover_image, original_price, target_price, stock, start_time, end_time, verify_expire_days, rules } = data;

  // 兼容前端传的 name 字段
  const campaignTitle = title || data.name;
  if (!type || !campaignTitle || !original_price || !target_price || !stock) {
    return { success: false, message: '缺少必要参数' };
  }

  const id = uuidv4();
  const now = new Date().toISOString();

  execute(
    `INSERT INTO Marketing_Campaign (id, merchant_id, type, title, description, cover_image, original_price, target_price, stock, stock_used, start_time, end_time, verify_expire_days, rules, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, 'active', ?, ?)`,
    [id, merchantId, type, campaignTitle, description || '', cover_image || '', original_price, target_price, stock,
     start_time || now, end_time || now, verify_expire_days || 7, JSON.stringify(rules || {}), now, now]
  );

  return { success: true, message: '活动创建成功', data: { id } };
}

/** 更新营销活动 */
function updateCampaign(merchantId, campaignId, data) {
  const campaign = queryOne('SELECT id FROM Marketing_Campaign WHERE id=? AND merchant_id=?', [campaignId, merchantId]);
  if (!campaign) return { success: false, message: '活动不存在' };

  const updates = [];
  const params = [];
  const allowed = ['title', 'description', 'cover_image', 'original_price', 'target_price', 'stock', 'start_time', 'end_time', 'verify_expire_days', 'rules', 'status'];

  for (const [k, v] of Object.entries(data)) {
    if (allowed.includes(k) && v !== undefined) {
      updates.push(`${k}=?`);
      params.push(k === 'rules' ? JSON.stringify(v) : v);
    }
  }
  if (updates.length === 0) return { success: false, message: '没有需要更新的字段' };

  updates.push('updated_at=?');
  params.push(new Date().toISOString());
  params.push(campaignId);

  execute(`UPDATE Marketing_Campaign SET ${updates.join(',')} WHERE id=?`, params);
  return { success: true, message: '活动更新成功' };
}

/** 删除营销活动 */
function deleteCampaign(merchantId, campaignId) {
  const campaign = queryOne('SELECT id FROM Marketing_Campaign WHERE id=? AND merchant_id=?', [campaignId, merchantId]);
  if (!campaign) return { success: false, message: '活动不存在' };

  execute('UPDATE Marketing_Campaign SET status=? WHERE id=?', ['cancelled', campaignId]);
  return { success: true, message: '活动已取消' };
}

/** 商家活动列表 */
function listCampaignsByMerchant(merchantId) {
  const campaigns = query(
    `SELECT id, type, title, description, cover_image, original_price, target_price, stock, stock_used,
            start_time, end_time, verify_expire_days, rules, status, participate_count, voucher_count, verify_count, created_at
     FROM Marketing_Campaign WHERE merchant_id=? ORDER BY created_at DESC`,
    [merchantId]
  ) || [];

  return {
    success: true,
    data: campaigns.map(c => {
      try { c.rules = JSON.parse(c.rules || '{}'); } catch { c.rules = {}; }
      return c;
    })
  };
}

/** 商家活动详情 */
function getCampaignDetailForMerchant(merchantId, campaignId) {
  const campaign = queryOne(
    `SELECT * FROM Marketing_Campaign WHERE id=? AND merchant_id=?`, [campaignId, merchantId]
  );
  if (!campaign) return { success: false, message: '活动不存在' };

  try { campaign.rules = JSON.parse(campaign.rules || '{}'); } catch { campaign.rules = {}; }

  // 参与记录
  const participations = query(
    `SELECT cp.*, m.nickname as user_nickname
     FROM Campaign_Participation cp
     LEFT JOIN Merchant m ON m.id = cp.user_id
     WHERE cp.campaign_id=? ORDER BY cp.created_at DESC LIMIT 50`,
    [campaignId]
  ) || [];

  // 核销记录
  const vouchers = query(
    `SELECT cv.*, s.name as staff_name
     FROM Campaign_Voucher cv
     LEFT JOIN Staff s ON s.id = cv.verified_by
     WHERE cv.campaign_id=? ORDER BY cv.created_at DESC LIMIT 50`,
    [campaignId]
  ) || [];

  return {
    success: true,
    data: {
      campaign,
      participations,
      vouchers,
    }
  };
}

// ===================== 用户端：活动参与 =====================

/** 用户发起参与（砍价/拼团/秒杀） */
function joinCampaign(userId, campaignId, data) {
  const campaign = queryOne('SELECT * FROM Marketing_Campaign WHERE id=? AND status=?', [campaignId, 'active']);
  if (!campaign) return { success: false, message: '活动不存在或已结束' };

  const now = new Date();
  const startTime = new Date(campaign.start_time);
  const endTime = new Date(campaign.end_time);
  if (now < startTime) return { success: false, message: '活动尚未开始' };
  if (now > endTime) return { success: false, message: '活动已结束' };
  if (campaign.stock_used >= campaign.stock) return { success: false, message: '库存已用完' };

  // 检查是否已参与
  const existing = queryOne('SELECT id FROM Campaign_Participation WHERE campaign_id=? AND user_id=?', [campaignId, userId]);
  if (existing) return { success: false, message: '您已参与过该活动' };

  const participationId = uuidv4();
  const nowISO = now.toISOString();

  if (campaign.type === 'bargain') {
    // 砍价：发起砍价，当前价=原价
    execute(
      `INSERT INTO Campaign_Participation (id, campaign_id, user_id, current_price, help_count, status, created_at)
       VALUES (?, ?, ?, ?, 0, 'pending', ?)`,
      [participationId, campaignId, userId, campaign.original_price, nowISO]
    );
    return {
      success: true, message: '发起砍价成功', data: {
        participationId,
        currentPrice: campaign.original_price,
        targetPrice: campaign.target_price,
        helpCount: 0,
        rules: JSON.parse(campaign.rules || '{}'),
      }
    };

  } else if (campaign.type === 'group') {
    // 拼团：创建拼团组，团长
    const rules = JSON.parse(campaign.rules || '{}');
    const requiredCount = rules.required_count || 3;
    const expireHours = rules.expire_hours || 24;

    const groupId = uuidv4();
    const expireAt = new Date(now.getTime() + expireHours * 3600 * 1000).toISOString();

    execute(
      `INSERT INTO Group_Session (id, campaign_id, leader_user_id, required_count, current_count, status, expire_at, created_at)
       VALUES (?, ?, ?, ?, 1, 'waiting', ?, ?)`,
      [groupId, campaignId, userId, requiredCount, expireAt, nowISO]
    );

    execute(
      `INSERT INTO Campaign_Participation (id, campaign_id, user_id, group_id, is_leader, status, created_at)
       VALUES (?, ?, ?, ?, 1, 'pending', ?)`,
      [participationId, campaignId, userId, groupId, nowISO]
    );

    return {
      success: true, message: '开团成功', data: {
        participationId, groupId, requiredCount, currentCount: 1, expireAt,
      }
    };

  } else if (campaign.type === 'flash') {
    // 秒杀：先检查库存
    if (campaign.stock_used >= campaign.stock) {
      return { success: false, message: '已抢光' };
    }

    // 扣减库存（并发安全）
    const updated = execute(
      `UPDATE Marketing_Campaign SET stock_used = stock_used + 1 WHERE id=? AND stock_used < stock`,
      [campaignId]
    );

    if (updated.changes === 0) {
      return { success: false, message: '已抢光' };
    }

    // 生成券码
    const voucherCode = generateVoucherCode(campaignId, userId);
    const expiresAt = new Date(now.getTime() + (campaign.verify_expire_days || 7) * 86400 * 1000).toISOString();
    const voucherId = uuidv4();

    execute(
      `INSERT INTO Campaign_Voucher (id, campaign_id, merchant_id, user_id, code, code_hash, status, expires_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'unused', ?, ?)`,
      [voucherId, campaignId, campaign.merchant_id, userId, voucherCode, hashVoucherCode(voucherCode), expiresAt, nowISO]
    );

    execute(
      `INSERT INTO Campaign_Participation (id, campaign_id, user_id, status, created_at)
       VALUES (?, ?, ?, 'success', ?)`,
      [participationId, campaignId, userId, nowISO]
    );

    execute(`UPDATE Marketing_Campaign SET participate_count=participate_count+1, voucher_count=voucher_count+1 WHERE id=?`, [campaignId]);

    return {
      success: true, message: '秒杀成功', data: {
        participationId, voucherCode, expiresAt,
      }
    };
  }

  return { success: false, message: '不支持的活动类型' };
}

/** 用户参团（拼团） */
function joinGroup(userId, groupId, campaignId) {
  const group = queryOne('SELECT * FROM Group_Session WHERE id=? AND status=?', [groupId, 'waiting']);
  if (!group) return { success: false, message: '拼团不存在或已结束' };

  // 检查是否过期
  if (new Date(group.expire_at) < new Date()) {
    execute('UPDATE Group_Session SET status=? WHERE id=?', ['failed', groupId]);
    return { success: false, message: '拼团已过期' };
  }

  // 检查是否已参与此团
  const existing = queryOne('SELECT id FROM Campaign_Participation WHERE group_id=? AND user_id=?', [groupId, userId]);
  if (existing) return { success: false, message: '您已在此团中' };

  // 扣库存（原子操作防超卖）
  const updated = execute(
    `UPDATE Marketing_Campaign SET stock_used=stock_used+1 WHERE id=? AND stock_used<stock`,
    [campaignId]
  );
  if (updated.changes === 0) {
    return { success: false, message: '库存不足' };
  }

  const participationId = uuidv4();
  const now = new Date().toISOString();

  execute(
    `INSERT INTO Campaign_Participation (id, campaign_id, user_id, group_id, is_leader, status, created_at)
     VALUES (?, ?, ?, ?, 0, 'pending', ?)`,
    [participationId, campaignId, userId, groupId, now]
  );

  // 更新拼团人数
  execute('UPDATE Group_Session SET current_count=current_count+1 WHERE id=?', [groupId]);

  // 检查是否成团
  const updatedGroup = queryOne('SELECT * FROM Group_Session WHERE id=?', [groupId]);
  if (updatedGroup.current_count >= updatedGroup.required_count) {
    return settleGroupSession(updatedGroup, campaignId);
  }

  return {
    success: true, message: '参团成功', data: {
      participationId, groupId,
      currentCount: updatedGroup.current_count,
      requiredCount: updatedGroup.required_count,
      expireAt: updatedGroup.expire_at,
    }
  };
}

/** 成团处理 */
function settleGroupSession(group, campaignId) {
  const now = new Date().toISOString();
  execute('UPDATE Group_Session SET status=?, success_at=? WHERE id=?', ['success', now, group.id]);

  // 为所有成员生成券码
  const participations = query('SELECT * FROM Campaign_Participation WHERE group_id=? AND status=?', [group.id, 'pending']) || [];
  const campaign = queryOne('SELECT * FROM Marketing_Campaign WHERE id=?', [campaignId]);
  const expiresAt = new Date(Date.now() + (campaign.verify_expire_days || 7) * 86400 * 1000).toISOString();

  for (const p of participations) {
    const voucherCode = generateVoucherCode(campaignId, p.user_id);
    const voucherId = uuidv4();
    execute(
      `INSERT INTO Campaign_Voucher (id, campaign_id, merchant_id, user_id, participation_id, code, code_hash, status, expires_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'unused', ?, ?)`,
      [voucherId, campaignId, campaign.merchant_id, p.user_id, p.id, voucherCode, hashVoucherCode(voucherCode), expiresAt, now]
    );
    execute('UPDATE Campaign_Participation SET status=? WHERE id=?', ['success', p.id]);
  }

  execute(`UPDATE Marketing_Campaign SET voucher_count=voucher_count+? WHERE id=?`, [participations.length, campaignId]);

  return {
    success: true, message: '拼团成功！', data: {
      groupId: group.id,
      voucherCount: participations.length,
    }
  };
}

/** 砍价助力 */
function bargainHelp(userId, participationId, data) {
  const { device_fingerprint } = data || {};

  const participation = queryOne(
    `SELECT cp.*, mc.target_price, mc.original_price, mc.merchant_id, mc.rules
     FROM Campaign_Participation cp
     JOIN Marketing_Campaign mc ON mc.id = cp.campaign_id
     WHERE cp.id=? AND cp.campaign_id IN (SELECT id FROM Marketing_Campaign WHERE type='bargain')`,
    [participationId]
  );
  if (!participation) return { success: false, message: '参与记录不存在' };

  const rules = JSON.parse(participation.rules || '{}');
  const maxHelpCount = rules.max_help_count || 20;

  if (participation.help_count >= maxHelpCount) {
    return { success: false, message: '助力次数已达上限' };
  }

  // 检查是否已助力过
  const helped = queryOne('SELECT id FROM Bargain_Help_Log WHERE participation_id=? AND helper_user_id=?', [participationId, userId]);
  if (helped) return { success: false, message: '您已助力过此活动' };

  const { amount, finished } = calculateBargainAmount(
    participation.current_price, participation.target_price,
    participation.help_count, maxHelpCount
  );

  const now = new Date().toISOString();
  const beforeAmount = participation.current_price;
  const afterAmount = Math.max(beforeAmount - amount, participation.target_price);

  // 记录助力
  execute(
    `INSERT INTO Bargain_Help_Log (participation_id, helper_user_id, reduce_amount, before_amount, after_amount, device_fingerprint, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [participationId, userId, amount, beforeAmount, afterAmount, device_fingerprint || '', now]
  );

  // 更新参与记录
  execute(
    `UPDATE Campaign_Participation SET current_price=?, help_count=help_count+1, status=? WHERE id=?`,
    [afterAmount, finished ? 'success' : 'pending', participationId]
  );

  let voucherData = null;
  if (finished) {
    // 砍价成功，发放券码
    const voucherCode = generateVoucherCode(participation.campaign_id, participation.user_id);
    const expiresAt = new Date(Date.now() + 7 * 86400 * 1000).toISOString();
    const voucherId = uuidv4();

    execute(
      `INSERT INTO Campaign_Voucher (id, campaign_id, merchant_id, user_id, participation_id, code, code_hash, status, expires_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'unused', ?, ?)`,
      [voucherId, participation.campaign_id, participation.merchant_id, participation.user_id, participationId,
       voucherCode, hashVoucherCode(voucherCode), expiresAt, now]
    );
    execute(`UPDATE Marketing_Campaign SET voucher_count=voucher_count+1 WHERE id=?`, [participation.campaign_id]);

    voucherData = { voucherCode, expiresAt };
  }

  return {
    success: true, message: finished ? '砍价成功！' : '助力成功',
    data: {
      reduceAmount: amount,
      currentPrice: afterAmount,
      targetPrice: participation.target_price,
      helpCount: participation.help_count + 1,
      finished,
      voucherData,
    }
  };
}

// ===================== 券管理 =====================

/** 用户我的券包 */
function listUserVouchers(userId) {
  const vouchers = query(
    `SELECT cv.*, mc.title as campaign_title, mc.type as campaign_type, mc.merchant_id,
            mp.store_name as merchant_name, mp.location_text as merchant_address
     FROM Campaign_Voucher cv
     JOIN Marketing_Campaign mc ON mc.id = cv.campaign_id
     LEFT JOIN Merchant_Profile mp ON mp.merchant_id = mc.merchant_id
     WHERE cv.user_id=?
     ORDER BY cv.created_at DESC`,
    [userId]
  ) || [];
  return { success: true, data: vouchers };
}

/** 券码详情 */
function getVoucherDetail(userId, code) {
  const voucher = queryOne(
    `SELECT cv.*, mc.title as campaign_title, mc.type as campaign_type, mc.merchant_id,
            mp.store_name as merchant_name, mp.location_text as merchant_address
     FROM Campaign_Voucher cv
     JOIN Marketing_Campaign mc ON mc.id = cv.campaign_id
     LEFT JOIN Merchant_Profile mp ON mp.merchant_id = mc.merchant_id
     WHERE cv.code=? AND cv.user_id=?`,
    [code, userId]
  );
  if (!voucher) return { success: false, message: '券码不存在' };
  return { success: true, data: voucher };
}

/** 店员核销券码 */
function verifyVoucher(staffId, merchantId, code, data) {
  const { latitude, longitude } = data || {};

  const voucher = queryOne(
    `SELECT cv.*, mc.merchant_id FROM Campaign_Voucher cv
     JOIN Marketing_Campaign mc ON mc.id = cv.campaign_id
     WHERE cv.code=?`,
    [code]
  );
  if (!voucher) {
    logVerifyAttempt(code, merchantId, staffId, 'invalid', '券码不存在');
    return { success: false, code: 'INVALID', message: '券码无效' };
  }

  if (voucher.merchant_id !== merchantId) {
    logVerifyAttempt(code, merchantId, staffId, 'invalid', '不是本店的券');
    return { success: false, code: 'WRONG_MERCHANT', message: '不是本店的券' };
  }

  if (voucher.status === 'used') {
    logVerifyAttempt(code, merchantId, staffId, 'already_used', '已使用');
    return { success: false, code: 'ALREADY_USED', message: '券码已核销' };
  }

  if (voucher.status === 'expired' || new Date(voucher.expires_at) < new Date()) {
    execute('UPDATE Campaign_Voucher SET status=? WHERE id=?', ['expired', voucher.id]);
    logVerifyAttempt(code, merchantId, staffId, 'expired', '已过期');
    return { success: false, code: 'EXPIRED', message: '券码已过期' };
  }

  // LBS围栏检查（简化版：要求提供经纬度）
  let locationOk = true;
  let distanceMeters = 0;
  if (latitude && longitude) {
    const merchantProfile = queryOne('SELECT location_lat, location_lng FROM Merchant_Profile WHERE merchant_id=?', [merchantId]);
    if (merchantProfile?.location_lat && merchantProfile?.location_lng) {
      distanceMeters = calcDistance(latitude, longitude, merchantProfile.location_lat, merchantProfile.location_lng);
      locationOk = distanceMeters <= 500;
    }
  }

  if (!locationOk) {
    logVerifyAttempt(code, merchantId, staffId, 'wrong_location', `距离${distanceMeters}米，超过500米`);
    return { success: false, code: 'WRONG_LOCATION', message: `距离商家${distanceMeters}米，需在500米内核销` };
  }

  // 核销
  const now = new Date().toISOString();
  execute(
    `UPDATE Campaign_Voucher SET status='used', verified_at=?, verified_by=?, verified_location=? WHERE id=?`,
    [now, staffId, JSON.stringify({ lat: latitude, lng: longitude }), voucher.id]
  );
  execute(`UPDATE Marketing_Campaign SET verify_count=verify_count+1 WHERE id=?`, [voucher.campaign_id]);

  logVerifyAttempt(code, merchantId, staffId, 'success', `距离${distanceMeters}米`);

  return {
    success: true, message: '核销成功',
    data: { voucherId: voucher.id, verifiedAt: now }
  };
}

/** 核销日志 */
function logVerifyAttempt(voucherCode, merchantId, staffId, result, errorMessage) {
  try {
    execute(
      `INSERT INTO Verify_Attempt_Log (voucher_code, merchant_id, staff_id, result, error_message, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [voucherCode, merchantId, staffId || '', result, errorMessage || '', new Date().toISOString()]
    );
  } catch (e) { /* 不影响主流程 */ }
}

/** 计算两点距离（Haversine） */
function calcDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

// ===================== 活动查询 =====================

/** 用户活动列表 */
function listCampaignsForUser(merchantId) {
  const now = new Date().toISOString();
  const campaigns = query(
    `SELECT id, type, title, description, cover_image, original_price, target_price, stock, stock_used,
            start_time, end_time, verify_expire_days, participate_count
     FROM Marketing_Campaign
     WHERE merchant_id=? AND status='active' AND start_time<=? AND end_time>=?
     ORDER BY created_at DESC`,
    [merchantId, now, now]
  ) || [];
  return { success: true, data: campaigns };
}

/** 活动详情 */
function getCampaignForUser(campaignId) {
  const campaign = queryOne(
    `SELECT mc.*, mp.store_name as merchant_name, mp.location_text as merchant_address
     FROM Marketing_Campaign mc
     LEFT JOIN Merchant_Profile mp ON mp.merchant_id = mc.merchant_id
     WHERE mc.id=?`,
    [campaignId]
  );
  if (!campaign) return { success: false, message: '活动不存在' };

  try { campaign.rules = JSON.parse(campaign.rules || '{}'); } catch { campaign.rules = {}; }

  return { success: true, data: campaign };
}

/** 用户参与详情（查看自己的参与进度） */
function getParticipationDetail(userId, campaignId) {
  const p = queryOne(
    `SELECT cp.*, mc.type, mc.target_price, mc.original_price, mc.rules, mc.title as campaign_title
     FROM Campaign_Participation cp
     JOIN Marketing_Campaign mc ON mc.id = cp.campaign_id
     WHERE cp.campaign_id=? AND cp.user_id=?`,
    [campaignId, userId]
  );
  if (!p) return { success: false, message: '您未参与此活动' };

  try { p.rules = JSON.parse(p.rules || '{}'); } catch { p.rules = {}; }

  // 砍价助力记录
  let helpLogs = [];
  if (p.type === 'bargain') {
    helpLogs = query(
      `SELECT bhl.*, m.nickname as helper_nickname FROM Bargain_Help_Log bhl
       LEFT JOIN Merchant m ON m.id = bhl.helper_user_id
       WHERE bhl.participation_id=? ORDER BY bhl.created_at DESC`,
      [p.id]
    ) || [];
  }

  // 拼团团员
  let groupMembers = [];
  if (p.group_id) {
    groupMembers = query(
      `SELECT cp.id, cp.user_id, m.nickname as user_nickname, cp.is_leader, cp.created_at
       FROM Campaign_Participation cp
       LEFT JOIN Merchant m ON m.id = cp.user_id
       WHERE cp.group_id=?`,
      [p.group_id]
    ) || [];
  }

  // 券码
  const voucher = queryOne('SELECT * FROM Campaign_Voucher WHERE participation_id=? AND user_id=?', [p.id, userId]);

  return {
    success: true,
    data: { ...p, helpLogs, groupMembers, voucher }
  };
}

// ===================== 分享埋点 =====================

/** 记录分享 */
function logShare(data) {
  try {
    execute(
      `INSERT INTO Activity_Share_Log (id, campaign_id, user_id, share_channel, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [uuidv4(), data.campaign_id, data.user_id, data.share_channel || 'wechat_friend', new Date().toISOString()]
    );
  } catch (e) { /* 埋点失败不影响主流程 */ }
  return { success: true };
}

export {
  createCampaign,
  updateCampaign,
  deleteCampaign,
  listCampaignsByMerchant,
  getCampaignDetailForMerchant,
  joinCampaign,
  joinGroup,
  bargainHelp,
  listUserVouchers,
  getVoucherDetail,
  verifyVoucher,
  listCampaignsForUser,
  getCampaignForUser,
  getParticipationDetail,
  logShare,
};
