/**
 * 内容路由 - 内容分发接口
 */
import Router from 'koa-router';
import {
  createContent,
  getContentList,
  getContentDetail,
  updateContent,
  deleteContent,
  type ContentData,
} from './content.service.js';
import { getCurrentMerchantId, requireAuth } from '../user/auth.service.js';
import { queryOne } from '../../core/database/index.js';

const router = new Router({ prefix: '/content' });

// ---------- 需要登录的接口 ----------

/**
 * POST /api/v1/content/create
 * 创建内容
 * body: { type?, title, description, hashtags?, images?, geoLat?, geoLng?, geoCity?, geoDistrict?, ... }
 */
router.post('/create', requireAuth(), async (ctx) => {
  const merchantId = ctx.state.merchantId;
  const body = ctx.request.body as any;

  if (!body.title) {
    ctx.body = { code: 400, message: '标题不能为空' };
    return;
  }
  if (!body.description) {
    ctx.body = { code: 400, message: '描述不能为空' };
    return;
  }

  const data: ContentData = {
    type: body.type,
    title: body.title,
    description: body.description,
    hashtags: body.hashtags,
    images: body.images,
    rawVideoUrl: body.rawVideoUrl,
    finalVideoUrl: body.finalVideoUrl,
    script: body.script,
    geoLat: body.geoLat,
    geoLng: body.geoLng,
    geoCity: body.geoCity,
    geoDistrict: body.geoDistrict,
    descriptionGeo: body.descriptionGeo,
    geoExifInjected: body.geoExifInjected,
    geoVisualInjected: body.geoVisualInjected,
    geoTextInjected: body.geoTextInjected,
  };

  const result = createContent(merchantId, data);

  if (!result.success) {
    ctx.status = 400;
    ctx.body = { code: 400, message: result.message };
    return;
  }

  ctx.body = { code: 0, message: result.message, data: result.data };
});

/**
 * GET /api/v1/content/list
 * 获取内容列表（分页）
 * query: { page?, pageSize? }
 */
router.get('/list', requireAuth(), async (ctx) => {
  const merchantId = ctx.state.merchantId;
  const page = parseInt(ctx.query.page as string) || 1;
  const pageSize = parseInt(ctx.query.pageSize as string) || 10;

  const result = getContentList(merchantId, page, pageSize);

  if (!result.success) {
    ctx.status = 400;
    ctx.body = { code: 400, message: result.message };
    return;
  }

  ctx.body = { code: 0, message: result.message, data: result.data };
});

/**
 * GET /api/v1/content/detail/:id
 * 获取内容详情
 * params: { id }
 */
router.get('/detail/:id', requireAuth(), async (ctx) => {
  const { id } = ctx.params;

  if (!id) {
    ctx.body = { code: 400, message: '内容ID不能为空' };
    return;
  }

  const result = getContentDetail(id);

  if (!result.success) {
    ctx.status = 404;
    ctx.body = { code: 404, message: result.message };
    return;
  }

  ctx.body = { code: 0, message: result.message, data: result.data };
});

/**
 * PUT /api/v1/content/update/:id
 * 更新内容
 * params: { id }
 * body: { title?, description?, hashtags?, ... }
 */
router.put('/update/:id', requireAuth(), async (ctx) => {
  const merchantId = ctx.state.merchantId;
  const { id } = ctx.params;
  const body = ctx.request.body as any;

  if (!id) {
    ctx.body = { code: 400, message: '内容ID不能为空' };
    return;
  }

  const data: Partial<ContentData> = {};
  if (body.title !== undefined) data.title = body.title;
  if (body.description !== undefined) data.description = body.description;
  if (body.hashtags !== undefined) data.hashtags = body.hashtags;
  if (body.type !== undefined) data.type = body.type;
  if (body.images !== undefined) data.images = body.images;
  if (body.rawVideoUrl !== undefined) data.rawVideoUrl = body.rawVideoUrl;
  if (body.finalVideoUrl !== undefined) data.finalVideoUrl = body.finalVideoUrl;
  if (body.script !== undefined) data.script = body.script;
  if (body.geoLat !== undefined) data.geoLat = body.geoLat;
  if (body.geoLng !== undefined) data.geoLng = body.geoLng;
  if (body.geoCity !== undefined) data.geoCity = body.geoCity;
  if (body.geoDistrict !== undefined) data.geoDistrict = body.geoDistrict;
  if (body.descriptionGeo !== undefined) data.descriptionGeo = body.descriptionGeo;
  if (body.geoExifInjected !== undefined) data.geoExifInjected = body.geoExifInjected;
  if (body.geoVisualInjected !== undefined) data.geoVisualInjected = body.geoVisualInjected;
  if (body.geoTextInjected !== undefined) data.geoTextInjected = body.geoTextInjected;

  const result = updateContent(id, merchantId, data);

  if (!result.success) {
    ctx.status = 400;
    ctx.body = { code: 400, message: result.message };
    return;
  }

  ctx.body = { code: 0, message: result.message };
});

/**
 * DELETE /api/v1/content/delete/:id
 * 删除内容（软删除）
 * params: { id }
 */
router.delete('/delete/:id', requireAuth(), async (ctx) => {
  const merchantId = ctx.state.merchantId;
  const { id } = ctx.params;

  if (!id) {
    ctx.body = { code: 400, message: '内容ID不能为空' };
    return;
  }

  const result = deleteContent(id, merchantId);

  if (!result.success) {
    ctx.status = 400;
    ctx.body = { code: 400, message: result.message };
    return;
  }

  ctx.body = { code: 0, message: result.message };
});

export default router;
