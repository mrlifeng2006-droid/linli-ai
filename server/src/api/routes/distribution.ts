// server/src/api/routes/distribution.ts
import Router from 'koa-router';
import { requireAuth } from '../../modules/user/auth.service';
import {
  publishContent,
  getDistributionHistory,
  getPlatformStats,
  PLATFORMS,
} from '../../modules/distribution/distribution.service';

const router = new Router({ prefix: '/distribution' });

// ========== 公开平台列表 ==========
router.get('/platforms', (ctx) => {
  ctx.body = { code: 0, data: PLATFORMS };
});

// ========== 发布内容 ==========
// POST /api/v1/distribution/publish
router.post('/publish', requireAuth(), async (ctx) => {
  const { merchantId } = ctx.state;
  const body = ctx.request.body as any;

  const { platform, contentText, hashtags, geoTag, cityTag, contentId } = body;

  if (!platform || !contentText) {
    ctx.status = 400;
    ctx.body = { code: 400, message: 'platform 和 contentText 不能为空' };
    return;
  }

  const validPlatform = PLATFORMS.find(p => p.key === platform);
  if (!validPlatform) {
    ctx.status = 400;
    ctx.body = { code: 400, message: '不支持的分发平台' };
    return;
  }

  // 平台字数限制
  if (contentText.length > validPlatform.maxChars) {
    ctx.status = 400;
    ctx.body = {
      code: 400,
      message: `${validPlatform.name} 文案不能超过 ${validPlatform.maxChars} 字，当前 ${contentText.length} 字`,
    };
    return;
  }

  const result = await publishContent(
    merchantId,
    platform,
    contentText,
    hashtags || '',
    geoTag || '',
    cityTag || '',
    contentId
  );

  ctx.body = { code: 0, data: result };
});

// ========== 分发历史 ==========
// GET /api/v1/distribution/history?page=1&pageSize=20
router.get('/history', requireAuth(), async (ctx) => {
  const { merchantId } = ctx.state;
  const page = parseInt(ctx.query.page as string) || 1;
  const pageSize = Math.min(parseInt(ctx.query.pageSize as string) || 20, 50);

  const result = await getDistributionHistory(merchantId, page, pageSize);

  ctx.body = { code: 0, data: result };
});

// ========== 平台统计数据 ==========
// GET /api/v1/distribution/stats
router.get('/stats', requireAuth(), async (ctx) => {
  const { merchantId } = ctx.state;
  const stats = await getPlatformStats(merchantId);

  ctx.body = { code: 0, data: stats };
});

export default router;
