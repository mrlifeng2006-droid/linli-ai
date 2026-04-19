/**
 * 营销活动路由 - 砍价/拼团/秒杀
 * 参照：邻里AI_V17.0_全栈开发需求书
 * @ts-nocheck
 */
import Router from 'koa-router';
import {
  createCampaign, updateCampaign, deleteCampaign,
  listCampaignsByMerchant, getCampaignDetailForMerchant,
  joinCampaign, joinGroup, bargainHelp,
  listUserVouchers, getVoucherDetail, verifyVoucher,
  listCampaignsForUser, getCampaignForUser,
  getParticipationDetail, logShare,
} from '../../modules/campaign/campaign.service';
import { requireAuth } from '../../modules/user/auth.service';

const router = new Router({ prefix: '/campaign' });

// ---------- 商家端：活动管理 ----------

/** POST /api/v1/campaign/create - 创建营销活动 */
router.post('/create', requireAuth(), async (ctx) => {
  const { merchantId } = ctx.state;
  const body = ctx.request.body as any;
  const result = createCampaign(merchantId, body);
  ctx.status = result.success ? 200 : 400;
  ctx.body = { code: result.success ? 0 : 400, message: result.message, data: result.data };
});

/** PUT /api/v1/campaign/update/:id - 更新营销活动 */
router.put('/update/:id', requireAuth(), async (ctx) => {
  const { merchantId } = ctx.state;
  const result = updateCampaign(merchantId, ctx.params.id, ctx.request.body as any);
  ctx.status = result.success ? 200 : 400;
  ctx.body = { code: result.success ? 0 : 400, message: result.message };
});

/** DELETE /api/v1/campaign/delete/:id - 删除/取消营销活动 */
router.delete('/delete/:id', requireAuth(), async (ctx) => {
  const { merchantId } = ctx.state;
  const result = deleteCampaign(merchantId, ctx.params.id);
  ctx.status = result.success ? 200 : 400;
  ctx.body = { code: result.success ? 0 : 400, message: result.message };
});

/** GET /api/v1/campaign/merchant/list - 商家活动列表 */
router.get('/merchant/list', requireAuth(), async (ctx) => {
  const { merchantId } = ctx.state;
  const result = listCampaignsByMerchant(merchantId);
  ctx.body = { code: 0, message: 'success', data: result.data };
});

/** GET /api/v1/campaign/merchant/detail/:id - 商家活动详情 */
router.get('/merchant/detail/:id', requireAuth(), async (ctx) => {
  const { merchantId } = ctx.state;
  const result = getCampaignDetailForMerchant(merchantId, ctx.params.id);
  ctx.status = result.success ? 200 : 404;
  ctx.body = { code: result.success ? 0 : 404, message: result.message, data: result.data };
});

// ---------- 店员端：核销 ----------

/** POST /api/v1/campaign/verify - 店员核销券码 */
router.post('/verify', requireAuth(), async (ctx) => {
  const { merchantId } = ctx.state;
  const body = ctx.request.body as any;
  if (!body.code) { ctx.body = { code: 400, message: '券码不能为空' }; return; }
  const result = verifyVoucher(merchantId, merchantId, body.code, body);
  ctx.status = result.success ? 200 : 400;
  ctx.body = { code: result.success ? 0 : 400, message: result.message, data: result.data };
});

// ---------- 用户端：活动 ----------

/** GET /api/v1/campaign/list - 活动列表（用户端） */
router.get('/list', requireAuth(), async (ctx) => {
  const { merchantId } = ctx.state;
  const result = listCampaignsForUser(merchantId);
  ctx.body = { code: 0, message: 'success', data: result.data };
});

/** GET /api/v1/campaign/detail/:id - 活动详情（用户端） */
router.get('/detail/:id', requireAuth(), async (ctx) => {
  const result = getCampaignForUser(ctx.params.id);
  ctx.status = result.success ? 200 : 404;
  ctx.body = { code: result.success ? 0 : 404, message: result.message, data: result.data };
});

/** POST /api/v1/campaign/join - 发起参与（砍价开团/秒杀抢购） */
router.post('/join', requireAuth(), async (ctx) => {
  const { merchantId } = ctx.state;
  const body = ctx.request.body as any;
  if (!body.campaign_id) { ctx.body = { code: 400, message: '活动ID不能为空' }; return; }
  const result = joinCampaign(merchantId, body.campaign_id, body);
  ctx.status = result.success ? 200 : 400;
  ctx.body = { code: result.success ? 0 : 400, message: result.message, data: result.data };
});

/** POST /api/v1/campaign/join-group - 参团（拼团） */
router.post('/join-group', requireAuth(), async (ctx) => {
  const { merchantId } = ctx.state;
  const body = ctx.request.body as any;
  if (!body.group_id || !body.campaign_id) { ctx.body = { code: 400, message: '缺少必要参数' }; return; }
  const result = joinGroup(merchantId, body.group_id, body.campaign_id);
  ctx.status = result.success ? 200 : 400;
  ctx.body = { code: result.success ? 0 : 400, message: result.message, data: result.data };
});

/** POST /api/v1/campaign/bargain-help - 砍价助力 */
router.post('/bargain-help', requireAuth(), async (ctx) => {
  const { merchantId } = ctx.state;
  const body = ctx.request.body as any;
  if (!body.participation_id) { ctx.body = { code: 400, message: '参与ID不能为空' }; return; }
  const result = bargainHelp(merchantId, body.participation_id, body);
  ctx.status = result.success ? 200 : 400;
  ctx.body = { code: result.success ? 0 : 400, message: result.message, data: result.data };
});

/** GET /api/v1/campaign/participation/:campaignId - 我的参与详情 */
router.get('/participation/:campaignId', requireAuth(), async (ctx) => {
  const { merchantId } = ctx.state;
  const result = getParticipationDetail(merchantId, ctx.params.campaignId);
  ctx.status = result.success ? 200 : 404;
  ctx.body = { code: result.success ? 0 : 404, message: result.message, data: result.data };
});

// ---------- 用户端：券包 ----------

/** GET /api/v1/campaign/vouchers - 我的券包 */
router.get('/vouchers', requireAuth(), async (ctx) => {
  const { merchantId } = ctx.state;
  const result = listUserVouchers(merchantId);
  ctx.body = { code: 0, message: 'success', data: result.data };
});

/** GET /api/v1/campaign/voucher/:code - 券码详情 */
router.get('/voucher/:code', requireAuth(), async (ctx) => {
  const { merchantId } = ctx.state;
  const result = getVoucherDetail(merchantId, ctx.params.code);
  ctx.status = result.success ? 200 : 404;
  ctx.body = { code: result.success ? 0 : 404, message: result.message, data: result.data };
});

// ---------- 分享埋点 ----------

/** POST /api/v1/campaign/share - 记录分享 */
router.post('/share', requireAuth(), async (ctx) => {
  const { merchantId } = ctx.state;
  const body = ctx.request.body as any;
  if (!body.campaign_id) { ctx.body = { code: 400, message: '活动ID不能为空' }; return; }
  logShare({ ...body, user_id: merchantId });
  ctx.body = { code: 0, message: 'success' };
});

export default router;
