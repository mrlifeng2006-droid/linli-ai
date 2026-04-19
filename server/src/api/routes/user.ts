/**
 * 用户路由 - 登录注册接口
 */
import Router from 'koa-router';
import { sendCode, register, login, wechatLogin } from '../../modules/user/user.service';
import { getCurrentMerchantId, requireAuth } from '../../modules/user/auth.service';
import { queryOne } from '../../core/database/index';

const router = new Router({ prefix: '/user' });

// ---------- 公开接口（无需登录）----------

/**
 * POST /api/v1/user/send-code
 * 发送短信验证码
 * body: { phone: string, purpose: 'login' | 'register' | 'bind_phone' }
 */
router.post('/send-code', async (ctx) => {
  const { phone, purpose = 'login' } = ctx.request.body as any;

  if (!phone) {
    ctx.body = { code: 400, message: '手机号不能为空' };
    return;
  }
  if (!['login', 'register', 'bind_phone'].includes(purpose)) {
    ctx.body = { code: 400, message: 'purpose 参数非法' };
    return;
  }

  const result = await sendCode(phone, purpose);
  ctx.body = {
    code: result.success ? 0 : 400,
    message: result.message,
    ...(result.success && ctx.query._dev && result.code ? { verificationCode: result.code } : {}), // dev模式下返回验证码
  };
});

/**
 * POST /api/v1/user/register
 * 注册
 * body: { phone: string, code: string }
 */
router.post('/register', async (ctx) => {
  const { phone, code } = ctx.request.body as any;

  if (!phone || !code) {
    ctx.body = { code: 400, message: '手机号和验证码不能为空' };
    return;
  }

  const result = await register(phone, code);

  if (!result.success) {
    ctx.status = 400;
    ctx.body = { code: 400, message: result.message };
    return;
  }

  ctx.body = { code: 0, message: result.message, data: result.data };
});

/**
 * POST /api/v1/user/login
 * 登录
 * body: { phone: string, code: string }
 */
router.post('/login', async (ctx) => {
  const { phone, code } = ctx.request.body as any;

  if (!phone || !code) {
    ctx.body = { code: 400, message: '手机号和验证码不能为空' };
    return;
  }

  const result = await login(phone, code);

  if (!result.success) {
    ctx.status = 400;
    ctx.body = { code: 400, message: result.message };
    return;
  }

  ctx.body = { code: 0, message: result.message, data: result.data };
});

/**
 * POST /api/v1/user/wechat-login
 * 微信小程序静默登录
 * body: { code: string }  (wx.login() 获取的 code)
 */
router.post('/wechat-login', async (ctx) => {
  const { code } = ctx.request.body as any;

  if (!code) {
    ctx.body = { code: 400, message: 'code 不能为空' };
    return;
  }

  // 从配置读取微信参数
  const { config } = await import('../../core/config/index');
  const appid = config.wechat.appid;
  const secret = config.wechat.secret;

  if (!appid || !secret) {
    ctx.body = { code: 500, message: '微信配置未设置' };
    return;
  }

  const result = await wechatLogin(code, appid, secret);

  if (!result.success) {
    ctx.status = 400;
    ctx.body = { code: 400, message: result.message };
    return;
  }

  ctx.body = { code: 0, message: result.message, data: result.data };
});

// ---------- 需要登录的接口 ----------

/**
 * GET /api/v1/user/profile
 * 获取当前用户信息
 */
router.get('/profile', requireAuth(), async (ctx) => {
  const merchantId = ctx.state.merchantId;
  const merchant = queryOne('SELECT id, phone, nickname, avatar_url, member_tier, points, status, last_login_at, created_at FROM Merchant WHERE id = ?', [merchantId]);
  const profile = queryOne('SELECT store_name, industry_cat, industry_tags, tone_style, location_text, city, district FROM Merchant_Profile WHERE merchant_id = ?', [merchantId]);

  if (!merchant) {
    ctx.status = 404;
    ctx.body = { code: 404, message: '用户不存在' };
    return;
  }

  ctx.body = {
    code: 0,
    data: {
      id: merchant.id,
      phone: merchant.phone,
      nickname: merchant.nickname,
      avatarUrl: merchant.avatar_url,
      memberTier: merchant.member_tier,
      points: merchant.points,
      status: merchant.status,
      lastLoginAt: merchant.last_login_at,
      createdAt: merchant.created_at,
      isMerchant: !!profile?.store_name,
      storeName: profile?.store_name,
      industryCat: profile?.industry_cat,
      industryTags: profile?.industry_tags ? JSON.parse(profile.industry_tags) : [],
      toneStyle: profile?.tone_style,
      location: {
        text: profile?.location_text,
        city: profile?.city,
        district: profile?.district,
      },
    },
  };
});

/**
 * PUT /api/v1/user/profile
 * 更新用户信息
 * body: { nickname?, avatarUrl?, storeName?, industryCat?, toneStyle?, ... }
 */
router.put('/profile', requireAuth(), async (ctx) => {
  const merchantId = ctx.state.merchantId;
  const body = ctx.request.body as any;

  const allowedFields = ['nickname', 'avatar_url', 'avatarUrl'];
  const profileFields = ['store_name', 'storeName', 'industry_cat', 'industryCat', 'industry_tags', 'industryTags', 'tone_style', 'toneStyle', 'location_text', 'locationText'];

  // 更新 Merchant 表
  const merchantUpdates: string[] = [];
  const merchantValues: any[] = [];

  if (body.nickname) {
    merchantUpdates.push('nickname = ?');
    merchantValues.push(body.nickname);
  }
  if (body.avatarUrl !== undefined) {
    merchantUpdates.push('avatar_url = ?');
    merchantValues.push(body.avatarUrl);
  }

  if (merchantUpdates.length > 0) {
    merchantValues.push(merchantId);
    const { execute } = await import('../../core/database/index');
    execute(`UPDATE Merchant SET ${merchantUpdates.join(', ')}, updated_at = datetime('now') WHERE id = ?`, merchantValues);
  }

  // 更新 Profile 表
  const profileUpdates: string[] = [];
  const profileValues: any[] = [];

  if (body.storeName !== undefined) {
    profileUpdates.push('store_name = ?');
    profileValues.push(body.storeName);
  }
  if (body.industryCat !== undefined) {
    profileUpdates.push('industry_cat = ?');
    profileValues.push(body.industryCat);
  }
  if (body.industryTags !== undefined) {
    profileUpdates.push('industry_tags = ?');
    profileValues.push(JSON.stringify(body.industryTags));
  }
  if (body.toneStyle !== undefined) {
    profileUpdates.push('tone_style = ?');
    profileValues.push(body.toneStyle);
  }
  if (body.locationText !== undefined) {
    profileUpdates.push('location_text = ?');
    profileValues.push(body.locationText);
  }

  if (profileUpdates.length > 0) {
    profileValues.push(merchantId);
    const { execute } = await import('../../core/database/index');
    execute(`UPDATE Merchant_Profile SET ${profileUpdates.join(', ')}, updated_at = datetime('now') WHERE merchant_id = ?`, profileValues);
  }

  ctx.body = { code: 0, message: '更新成功' };
});

/**
 * GET /api/v1/user/vip-status
 * 获取VIP状态
 */
router.get('/vip-status', requireAuth(), async (ctx) => {
  const merchantId = ctx.state.merchantId;
  const merchant = queryOne('SELECT member_tier, member_expire_at, points FROM Merchant WHERE id = ?', [merchantId]);

  if (!merchant) {
    ctx.status = 404;
    ctx.body = { code: 404, message: '用户不存在' };
    return;
  }

  const now = new Date();
  const expireAt = merchant.member_expire_at ? new Date(merchant.member_expire_at) : null;
  const isVip = expireAt && expireAt > now;

  ctx.body = {
    code: 0,
    data: {
      memberTier: merchant.member_tier,
      isVip,
      expireAt: merchant.member_expire_at,
      daysLeft: expireAt ? Math.ceil((expireAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0,
      points: merchant.points,
    },
  };
});

export default router;
