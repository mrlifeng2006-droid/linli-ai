/**
 * 商家入驻 / 店铺信息管理
 * POST /merchant/profile   创建/更新商家店铺信息（含冷却检查）
 * GET  /merchant/profile   读取当前商家的店铺信息（含冷却倒计时）
 */
import Router from 'koa-router';
import { query, queryOne, execute } from '../../core/database';
import { v4 as uuidv4 } from 'uuid';

const router = new Router({ prefix: '/merchant' });

// 中间件：必须登录
async function requireAuth(ctx: any, next: () => Promise<void>) {
  const user = ctx.state.user as any;
  if (!user || !user.merchantId) {
    ctx.status = 401;
    ctx.body = { code: 401, message: '请先登录' };
    return;
  }
  await next();
}

// GET /merchant/profile
router.get('/profile', requireAuth, async (ctx: any) => {
  const merchantId = ctx.state.user.merchantId as string;

  const profile = await queryOne(
    'SELECT * FROM Merchant_Profile WHERE merchant_id = ?',
    [merchantId]
  ) as any;

  // 未入驻：返回空数据
  if (!profile) {
    ctx.body = {
      code: 0,
      data: {
        is_registered: false,
        can_edit: true,
        cooldown_ends_at: null,
        days_since_update: null,
      }
    };
    return;
  }

  // 读取冷却期
  const cooldownConfig = (await queryOne(
    "SELECT value FROM System_Config WHERE key = 'profile_cooldown_days'"
  )) as any;
  const cooldownDays = parseInt(cooldownConfig?.value || '30', 10);

  let can_edit = true;
  let cooldown_ends_at: string | null = null;
  let days_since_update: number | null = null;

  if (profile.updated_at && cooldownDays > 0) {
    const updatedAt = new Date(profile.updated_at);
    const cooldownEndsAt = new Date(updatedAt.getTime() + cooldownDays * 86400 * 1000);
    const now = new Date();
    const remaining = cooldownEndsAt.getTime() - now.getTime();

    if (remaining > 0) {
      can_edit = false;
      cooldown_ends_at = cooldownEndsAt.toISOString();
    }
    days_since_update = Math.floor((now.getTime() - updatedAt.getTime()) / 86400000);
  }

  // 脱敏电话
  let phoneMasked = profile.phone_number as string;
  if (phoneMasked && phoneMasked.length >= 11) {
    phoneMasked = phoneMasked.substring(0, 3) + '-****-' + phoneMasked.substring(7);
  }

  // 判断入驻是否真正完成（关键字段是否已填写）
  const is_profile_complete = !!(
    profile.store_name && 
    profile.store_name !== '邻里用户' + (phoneMasked?.slice(-4) || '') &&
    profile.industry_cat && 
    profile.location_text
  );

  ctx.body = {
    code: 0,
    data: {
      is_registered: true,
      is_profile_complete,
      id: profile.id,
      store_name: profile.store_name,
      industry_cat: profile.industry_cat,
      industry_tags: profile.industry_tags,
      tone_style: profile.tone_style,
      location_text: profile.location_text,
      city: profile.city,
      district: profile.district,
      features: profile.features,
      target_customer: profile.target_customer,
      contact_name: profile.contact_name,
      phone_number: phoneMasked,
      phone_number_raw: profile.phone_number,
      wechat_id: profile.wechat_id,
      geo_level: profile.geo_level,
      profile_updated_at: profile.updated_at,
      days_since_update,
      can_edit,
      cooldown_ends_at,
      cooldown_days: cooldownDays,
    }
  };
});

// POST /merchant/profile
router.post('/profile', requireAuth, async (ctx: any) => {
  const merchantId = ctx.state.user.merchantId as string;
  const body = (ctx.request.body as any) || {};

  const existing = (await queryOne(
    'SELECT * FROM Merchant_Profile WHERE merchant_id = ?',
    [merchantId]
  )) as any;

  // 冷却检查
  const cooldownConfig = (await queryOne(
    "SELECT value FROM System_Config WHERE key = 'profile_cooldown_days'"
  )) as any;
  const cooldownDays = parseInt(cooldownConfig?.value || '30', 10);

  if (existing && cooldownDays > 0) {
    const updatedAt = new Date(existing.updated_at);
    const cooldownEndsAt = new Date(updatedAt.getTime() + cooldownDays * 86400 * 1000);
    const now = new Date();
    const remaining = cooldownEndsAt.getTime() - now.getTime();

    if (remaining > 0) {
      const daysLeft = Math.ceil(remaining / 86400000);
      ctx.status = 403;
      ctx.body = {
        code: 403,
        message: `距离下次修改还需等待 ${daysLeft} 天`,
        cooldown_days_left: daysLeft,
        cooldown_ends_at: cooldownEndsAt.toISOString(),
      };
      return;
    }
  }

  // 必填校验
  const required = ['store_name', 'industry_cat', 'contact_name', 'phone_number'];
  for (const field of required) {
    if (!body[field]?.toString().trim()) {
      ctx.status = 400;
      ctx.body = { code: 400, message: `缺少必填字段：${field}` };
      return;
    }
  }

  // 行业修改权限检查
  const industryChanged = existing && (existing as any).industry_cat !== body.industry_cat;
  const allowIndustryChange = (await queryOne(
    "SELECT value FROM System_Config WHERE key = 'allow_merchant_change_industry'"
  )) as any;
  if (industryChanged && allowIndustryChange?.value !== 'true') {
    ctx.status = 403;
    ctx.body = {
      code: 403,
      message: '行业类型需联系客服修改，当前设置不允许自行修改'
    };
    return;
  }

  // 写入 / 更新
  const now = new Date().toISOString();

  if (existing) {
    const sets = [
      'store_name = ?', 'industry_cat = ?', 'industry_tags = ?',
      'tone_style = ?', 'location_text = ?', 'city = ?', 'district = ?',
      'features = ?', 'target_customer = ?', 'contact_name = ?',
      'phone_number = ?', 'wechat_id = ?', 'updated_at = ?'
    ].join(', ');

    await execute(
      `UPDATE Merchant_Profile SET ${sets} WHERE merchant_id = ?`,
      [
        body.store_name.trim(),
        body.industry_cat.trim(),
        (body.industry_tags || '').trim(),
        body.tone_style || 'friendly',
        (body.location_text || '').trim(),
        (body.city || '').trim(),
        (body.district || '').trim(),
        (body.features || '').trim(),
        (body.target_customer || '').trim(),
        body.contact_name.trim(),
        body.phone_number.trim(),
        (body.wechat_id || '').trim(),
        now,
        merchantId,
      ]
    );
  } else {
    const id = uuidv4();
    await execute(
      `INSERT INTO Merchant_Profile
       (id, merchant_id, store_name, industry_cat, industry_tags, tone_style,
        location_text, city, district, features, target_customer,
        contact_name, phone_number, wechat_id, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, merchantId,
        body.store_name.trim(),
        body.industry_cat.trim(),
        (body.industry_tags || '').trim(),
        body.tone_style || 'friendly',
        (body.location_text || '').trim(),
        (body.city || '').trim(),
        (body.district || '').trim(),
        (body.features || '').trim(),
        (body.target_customer || '').trim(),
        body.contact_name.trim(),
        body.phone_number.trim(),
        (body.wechat_id || '').trim(),
        now,
      ]
    );
  }

  ctx.body = {
    code: 0,
    message: '店铺信息保存成功',
    data: {
      updated_at: now,
      cooldown_days: cooldownDays,
      cooldown_ends_at: new Date(Date.now() + cooldownDays * 86400000).toISOString(),
    }
  };
});

export default router;
