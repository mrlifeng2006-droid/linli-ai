/**
 * 商家路由 - 商家入驻、商家画像、经营看板、GEO报告、店员管理
 * 参照：邻里AI_V17.0_全栈开发需求书
 * @ts-nocheck
 */
import Router from 'koa-router';
import {
  registerPersonalMerchant, registerBusinessMerchant,
  getMerchantInfo, updateMerchantProfile, refreshLandmarks,
  getMerchantStats, getGeoReport, trackRecruitEntry,
  getStaffList, generateStaffInvite,
} from '../../modules/merchant/merchant.service.js';
import { requireAuth } from '../../modules/user/auth.service.js';

const router = new Router({ prefix: '/merchant' });

/** 中间件：确保 ctx.state.merchantId */
function getMerchantId(ctx) {
  return ctx.state.merchantId;
}

// ---------- 商家入驻 ----------

/** POST /api/v1/merchant/register/personal - 个人商家入驻 */
router.post('/register/personal', requireAuth(), async (ctx) => {
  const merchantId = getMerchantId(ctx);
  const body = ctx.request.body as any;
  if (!body.phone) { ctx.body = { code: 400, message: '手机号不能为空' }; return; }
  const result = registerPersonalMerchant(merchantId, body);
  ctx.status = result.success ? 200 : 400;
  ctx.body = { code: result.success ? 0 : 400, message: result.message, data: result.data };
});

/** POST /api/v1/merchant/register/business - 企业商家入驻 */
router.post('/register/business', requireAuth(), async (ctx) => {
  const merchantId = getMerchantId(ctx);
  const body = ctx.request.body as any;
  if (!body.phone) { ctx.body = { code: 400, message: '手机号不能为空' }; return; }
  if (!body.store_name) { ctx.body = { code: 400, message: '店铺名称不能为空' }; return; }
  const result = registerBusinessMerchant(merchantId, body);
  ctx.status = result.success ? 200 : 400;
  ctx.body = { code: result.success ? 0 : 400, message: result.message, data: result.data };
});

/** GET /api/v1/merchant/info - 获取商家完整信息 */
router.get('/info', requireAuth(), async (ctx) => {
  const result = getMerchantInfo(getMerchantId(ctx));
  ctx.status = result.success ? 200 : 404;
  ctx.body = { code: result.success ? 0 : 404, message: result.message, data: result.data };
});

/** PUT /api/v1/merchant/profile - 更新商家画像 */
router.put('/profile', requireAuth(), async (ctx) => {
  const result = updateMerchantProfile(getMerchantId(ctx), ctx.request.body as any);
  ctx.status = result.success ? 200 : 400;
  ctx.body = { code: result.success ? 0 : 400, message: result.message };
});

/** POST /api/v1/merchant/landmarks/refresh - 刷新地标 */
router.post('/landmarks/refresh', requireAuth(), async (ctx) => {
  const body = ctx.request.body as any;
  if (!body.lat || !body.lng) { ctx.body = { code: 400, message: '经纬度不能为空' }; return; }
  const result = refreshLandmarks(getMerchantId(ctx), body.lat, body.lng);
  ctx.status = result.success ? 200 : 400;
  ctx.body = { code: result.success ? 0 : 400, message: result.message, data: result.data };
});

// ---------- 经营看板 ----------

/** GET /api/v1/merchant/stats - 商家经营看板 */
router.get('/stats', requireAuth(), async (ctx) => {
  const result = getMerchantStats(getMerchantId(ctx));
  ctx.status = result.success ? 200 : 404;
  ctx.body = { code: result.success ? 0 : 404, message: result.message, data: result.data };
});

// ---------- GEO报告 ----------

/** GET /api/v1/merchant/geo-report - GEO优化报告 */
router.get('/geo-report', requireAuth(), async (ctx) => {
  const result = getGeoReport(getMerchantId(ctx));
  ctx.status = result.success ? 200 : 404;
  ctx.body = { code: result.success ? 0 : 404, message: result.message, data: result.data };
});

// ---------- 店员管理 ----------

/** GET /api/v1/merchant/staff/list - 店员列表 */
router.get('/staff/list', requireAuth(), async (ctx) => {
  const result = getStaffList(getMerchantId(ctx));
  ctx.status = result.success ? 200 : 400;
  ctx.body = { code: result.success ? 0 : 400, message: result.message, data: result.data };
});

/** POST /api/v1/merchant/staff/invite - 生成店员邀请码 */
router.post('/staff/invite', requireAuth(), async (ctx) => {
  const result = generateStaffInvite(getMerchantId(ctx), (ctx.request.body as any).staffName);
  ctx.status = result.success ? 200 : 400;
  ctx.body = { code: result.success ? 0 : 400, message: result.message, data: result.data };
});

// ---------- 招募入口埋点 ----------

/** POST /api/v1/merchant/recruit/track - 招募入口埋点 */
router.post('/recruit/track', async (ctx) => {
  const body = ctx.request.body as any;
  if (!body.entry_type || !body.action) { ctx.body = { code: 400, message: '缺少必要参数' }; return; }
  trackRecruitEntry({ user_id: ctx.state?.merchantId || '', ...body });
  ctx.body = { code: 0, message: '埋点成功' };
});

export default router;
