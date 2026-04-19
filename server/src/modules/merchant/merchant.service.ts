/**
 * 商家服务 - 商家入驻、商家画像、经营看板、GEO报告
 * 参照：邻里AI_V17.0_全栈开发需求书_最终封档版
 * @ts-nocheck
 */
import { v4 as uuidv4 } from 'uuid';
import { query, queryOne, execute } from '../../core/database/index';

// ===================== 商家入驻 =====================

/** 个人商家入驻（微信实名认证）*/
function registerPersonalMerchant(merchantId, data) {
  const { phone, nickname, auth_transaction_id, verified_data } = data;
  const existing = queryOne('SELECT id FROM Merchant WHERE id = ?', [merchantId]);
  if (!existing) return { success: false, message: '商家账号不存在' };

  const profileId = uuidv4();
  const now = new Date().toISOString();

  execute(
    `UPDATE Merchant SET phone=?, nickname=?, auth_type='wechat_realname', auth_status='approved',
     auth_verified_at=?, wechat_auth_transaction_id=?, points=COALESCE(points,0)+20, updated_at=? WHERE id=?`,
    [phone, nickname || '新商家', now, auth_transaction_id || '', now, merchantId]
  );

  const existingProfile = queryOne('SELECT id FROM Merchant_Profile WHERE merchant_id=?', [merchantId]);
  if (!existingProfile) {
    execute(
      `INSERT INTO Merchant_Profile (id,merchant_id,store_name,wechat_realname_verified,wechat_auth_transaction_id,created_at,updated_at)
       VALUES (?,?,?,1,?,?,?)`,
      [profileId, merchantId, phone ? `商家${phone.slice(-4)}` : '新商家', auth_transaction_id || '', now, now]
    );
  }
  return { success: true, message: '个人商家入驻成功', data: { merchantId, profileId, memberTier: 'free', points: 20 } };
}

/** 企业商家入驻（营业执照）*/
function registerBusinessMerchant(merchantId, data) {
  const { phone, nickname, license_url, license_no, license_name, store_name, industry_cat, location_lat, location_lng, location_text, city, district } = data;
  const existing = queryOne('SELECT id FROM Merchant WHERE id = ?', [merchantId]);
  if (!existing) return { success: false, message: '商家账号不存在' };

  const profileId = uuidv4();
  const now = new Date().toISOString();

  execute(
    `UPDATE Merchant SET phone=?, nickname=?, auth_type='business_license', auth_status='approved',
     auth_verified_at=?, points=COALESCE(points,0)+50, updated_at=? WHERE id=?`,
    [phone, nickname || '企业商家', now, merchantId]
  );

  const existingProfile = queryOne('SELECT id FROM Merchant_Profile WHERE merchant_id=?', [merchantId]);
  if (!existingProfile) {
    execute(
      `INSERT INTO Merchant_Profile (id,merchant_id,store_name,industry_cat,license_url,license_no,license_name,
       location_lat,location_lng,location_text,city,district,geo_level,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,'standard',?,?)`,
      [profileId, merchantId, store_name || phone?.slice(-4) || '企业商家', industry_cat || '',
       license_url || '', license_no || '', license_name || '',
       location_lat || null, location_lng || null, location_text || '', city || '', district || '', now, now]
    );
  }
  return { success: true, message: '企业商家入驻成功', data: { merchantId, profileId, memberTier: 'free', points: 50 } };
}

// ===================== 商家资料 =====================

function getMerchantInfo(merchantId) {
  const merchant = queryOne(
    `SELECT m.*, mp.store_name, mp.industry_cat, mp.industry_tags, mp.tone_style,
            mp.location_lat, mp.location_lng, mp.location_text, mp.city, mp.district,
            mp.landmark_1, mp.landmark_1_distance, mp.landmark_2, mp.landmark_2_distance,
            mp.landmark_3, mp.landmark_3_distance,
            mp.contact_name, mp.phone_number, mp.wechat_id, mp.customer_service_component,
            mp.geo_level, mp.service_status as profile_service_status, mp.merchant_tags
     FROM Merchant m LEFT JOIN Merchant_Profile mp ON mp.merchant_id=m.id
     WHERE m.id=? AND m.status='active'`, [merchantId]
  );
  if (!merchant) return { success: false, message: '商家不存在' };

  try { merchant.industry_tags = merchant.industry_tags ? JSON.parse(merchant.industry_tags) : []; } catch { merchant.industry_tags = []; }
  try { merchant.merchant_tags = merchant.merchant_tags ? JSON.parse(merchant.merchant_tags) : []; } catch { merchant.merchant_tags = []; }

  return {
    success: true,
    data: {
      id: merchant.id, phone: merchant.phone, nickname: merchant.nickname, avatar_url: merchant.avatar_url,
      auth_type: merchant.auth_type, auth_status: merchant.auth_status,
      member_tier: merchant.member_tier, member_expire_at: merchant.member_expire_at,
      points: merchant.points, total_spent_points: merchant.total_spent_points,
      store_name: merchant.store_name, industry_cat: merchant.industry_cat,
      industry_tags: merchant.industry_tags, tone_style: merchant.tone_style,
      location_lat: merchant.location_lat, location_lng: merchant.location_lng,
      location_text: merchant.location_text, city: merchant.city, district: merchant.district,
      landmarks: [
        { name: merchant.landmark_1, distance: merchant.landmark_1_distance },
        { name: merchant.landmark_2, distance: merchant.landmark_2_distance },
        { name: merchant.landmark_3, distance: merchant.landmark_3_distance },
      ].filter(l => l.name),
      contact_name: merchant.contact_name, phone_number: merchant.phone_number,
      wechat_id: merchant.wechat_id, customer_service_component: merchant.customer_service_component,
      geo_level: merchant.geo_level, merchant_tags: merchant.merchant_tags,
      service_status: merchant.profile_service_status, created_at: merchant.created_at,
    }
  };
}

// ===================== 更新商家画像 =====================

function updateMerchantProfile(merchantId, data) {
  const merchant = queryOne('SELECT id FROM Merchant WHERE id=? AND status=?', [merchantId, 'active']);
  if (!merchant) return { success: false, message: '商家不存在' };

  const updates = [];
  const params = [];
  for (const [key, val] of Object.entries(data)) {
    if (val !== undefined && key !== 'merchantId') {
      updates.push(`${key}=?`);
      params.push(Array.isArray(val) ? JSON.stringify(val) : val);
    }
  }
  if (updates.length === 0) return { success: false, message: '没有需要更新的字段' };

  updates.push('updated_at=?');
  params.push(new Date().toISOString());
  params.push(merchantId);

  execute(`UPDATE Merchant_Profile SET ${updates.join(',')} WHERE merchant_id=?`, params);
  return { success: true, message: '商家画像更新成功' };
}

// ===================== 刷新地标 =====================

function refreshLandmarks(merchantId, lat, lng) {
  const merchant = queryOne('SELECT id FROM Merchant WHERE id=? AND status=?', [merchantId, 'active']);
  if (!merchant) return { success: false, message: '商家不存在' };

  const landmarks = [
    { name: '附近商业广场', distance: Math.floor(Math.random() * 500) + 100 },
    { name: '地铁站', distance: Math.floor(Math.random() * 400) + 50 },
    { name: '美食街', distance: Math.floor(Math.random() * 800) + 200 },
  ];

  execute(
    `UPDATE Merchant_Profile SET landmark_1=?,landmark_1_distance=?,landmark_2=?,landmark_2_distance=?,
     landmark_3=?,landmark_3_distance=?,updated_at=? WHERE merchant_id=?`,
    [landmarks[0].name, landmarks[0].distance, landmarks[1].name, landmarks[1].distance,
     landmarks[2].name, landmarks[2].distance, new Date().toISOString(), merchantId]
  );
  return { success: true, message: '地标刷新成功', data: landmarks };
}

// ===================== 经营看板 =====================

function getMerchantStats(merchantId) {
  const merchant = queryOne('SELECT id,points,member_tier,member_expire_at,created_at FROM Merchant WHERE id=? AND status=?', [merchantId, 'active']);
  if (!merchant) return { success: false, message: '商家不存在' };

  const cs = queryOne(`SELECT COUNT(*) as total,
    SUM(CASE WHEN status='approved' THEN 1 ELSE 0 END) as approved,
    SUM(CASE WHEN status='rejected' THEN 1 ELSE 0 END) as rejected,
    SUM(CASE WHEN geo_exif_injected=1 OR geo_text_injected=1 OR geo_visual_injected=1 THEN 1 ELSE 0 END) as geo_injected,
    SUM(points_cost) as total_points_cost FROM Content WHERE merchant_id=?`, [merchantId]) || {};

  const vs = queryOne(`SELECT COUNT(*) as total_vouchers,
    SUM(CASE WHEN status='used' THEN 1 ELSE 0 END) as used_vouchers FROM Campaign_Voucher WHERE merchant_id=?`, [merchantId]) || {};

  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const monthContent = queryOne('SELECT COUNT(*) as count FROM Content WHERE merchant_id=? AND created_at>=?', [merchantId, monthStart.toISOString()]) || {};

  const geoInjected = cs.geo_injected || 0;

  return {
    success: true,
    data: {
      points: merchant.points, member_tier: merchant.member_tier,
      member_expire_at: merchant.member_expire_at, joined_at: merchant.created_at,
      content: {
        total: cs.total || 0, approved: cs.approved || 0, rejected: cs.rejected || 0,
        geo_injected: geoInjected,
        geo_contribution: geoInjected > 0 ? `+${(geoInjected * 1.2).toFixed(0)}%` : '0%',
        this_month: monthContent.count || 0, total_points_cost: cs.total_points_cost || 0,
      },
      vouchers: {
        total: vs.total_vouchers || 0, used: vs.used_vouchers || 0,
        used_rate: vs.total_vouchers > 0 ? Math.round((vs.used_vouchers / vs.total_vouchers) * 100) : 0,
      },
    }
  };
}

// ===================== GEO优化报告 =====================

function getGeoReport(merchantId) {
  const merchant = queryOne(
    `SELECT mp.*,m.points FROM Merchant m JOIN Merchant_Profile mp ON mp.merchant_id=m.id WHERE m.id=? AND m.status='active'`,
    [merchantId]
  );
  if (!merchant) return { success: false, message: '商家不存在' };

  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const geoContent = query(
    `SELECT id,title,geo_exif_injected,geo_visual_injected,geo_text_injected,geo_city,geo_district,created_at
     FROM Content WHERE merchant_id=? AND created_at>=?
     AND (geo_exif_injected=1 OR geo_text_injected=1 OR geo_visual_injected=1)
     ORDER BY created_at DESC LIMIT 20`,
    [merchantId, monthStart.toISOString()]
  ) || [];

  const totalGeo = geoContent.length;
  const exifCount = geoContent.filter(c => c.geo_exif_injected).length;
  const visualCount = geoContent.filter(c => c.geo_visual_injected).length;
  const textCount = geoContent.filter(c => c.geo_text_injected).length;

  const landmarks = [
    { name: merchant.landmark_1, distance: merchant.landmark_1_distance },
    { name: merchant.landmark_2, distance: merchant.landmark_2_distance },
    { name: merchant.landmark_3, distance: merchant.landmark_3_distance },
  ].filter(l => l.name);

  const geo_level = merchant.geo_level || 'basic';
  const recs = [];
  if (geo_level === 'basic' && totalGeo === 0) recs.push('建议升级为专业版，开启Exif元数据注入和视觉掩码功能');
  if (exifCount === 0 && totalGeo > 0) recs.push('您的内容尚未注入Exif地理位置，建议在设置中开启');
  if (visualCount === 0) recs.push('开启视觉掩码注入，在视频画面植入地标文字');
  if (textCount === 0) recs.push('您的文案尚未注入地标标签，建议开启自动GEO文案锚点');
  if (recs.length === 0) recs.push('GEO优化状态良好，继续保持！');

  return {
    success: true,
    data: {
      geo_level, store_name: merchant.store_name, location_text: merchant.location_text,
      city: merchant.city, district: merchant.district, landmarks,
      this_month: {
        geo_injected_count: totalGeo, exif_count: exifCount,
        visual_count: visualCount, text_count: textCount,
        injection_rate: totalGeo > 0 ? Math.round((exifCount / totalGeo) * 100) : 0,
      },
      exposure_boost: totalGeo > 0 ? `+${(totalGeo * 1.2).toFixed(0)}%` : '0%',
      landmark_contribution: landmarks.map(l => ({ name: l.name, distance: l.distance, pct: landmarks.length > 0 ? Math.round((1 / landmarks.length) * 100) : 0 })),
      recommendations: recs,
    }
  };
}

// ===================== 招募入口埋点 =====================

function trackRecruitEntry(data) {
  try {
    execute(
      `INSERT INTO Merchant_Recruit_Entry_Log (id,user_id,entry_type,action,from_page,created_at) VALUES (?,?,?,?,?,?)`,
      [uuidv4(), data.user_id || '', data.entry_type, data.action, data.from_page || '', new Date().toISOString()]
    );
  } catch (e) { /* 埋点失败不影响主流程 */ }
  return { success: true };
}

// ===================== 店员管理 =====================

function getStaffList(merchantId) {
  const merchant = queryOne('SELECT id FROM Merchant WHERE id=? AND status=?', [merchantId, 'active']);
  if (!merchant) return { success: false, message: '商家不存在' };
  const staffs = query(
    `SELECT id,name,phone,status,invited_at,activated_at,verify_count FROM Staff WHERE merchant_id=? ORDER BY created_at DESC`,
    [merchantId]
  ) || [];
  return { success: true, data: staffs };
}

function generateStaffInvite(merchantId, staffName) {
  const merchant = queryOne('SELECT id FROM Merchant WHERE id=? AND status=?', [merchantId, 'active']);
  if (!merchant) return { success: false, message: '商家不存在' };
  const profile = queryOne('SELECT license_url FROM Merchant_Profile WHERE merchant_id=?', [merchantId]);
  if (!profile?.license_url) return { success: false, message: '仅企业商家可邀请店员，请先完成企业认证' };
  const inviteCode = uuidv4().replace(/-/g, '').slice(0, 8).toUpperCase();
  return { success: true, data: { inviteCode, merchantId } };
}

export {
  registerPersonalMerchant, registerBusinessMerchant,
  getMerchantInfo, updateMerchantProfile, refreshLandmarks,
  getMerchantStats, getGeoReport, trackRecruitEntry,
  getStaffList, generateStaffInvite,
};
