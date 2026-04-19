/**
 * 路由总览
 * 使用 koa-router v12 API
 */
import Router from 'koa-router';
import userRouter from './user';
import merchantRouter from './merchant';
import contentRouter from './content';
import aiRouter from './ai';
import marketingRouter from './marketing';
import campaignRouter from './campaign';
import paymentRouter from './payment';
import geoRouter from './geo';
import videoRouter from './video';
import distributionRouter from './distribution';
import adminRouter from './admin';
import healthRouter from './health';
import uploadRouter from './upload';

const router = new Router();

// 健康检查
router.get('/health', (ctx) => {
  ctx.body = {
    code: 0,
    message: 'ok',
    data: {
      service: 'linli-ai-server',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    },
  };
});

// API 版本前缀
const API = '/api/v1';

// 子路由：注册到 /api/v1 前缀下
router.use(API, healthRouter.routes(), healthRouter.allowedMethods());
router.use(API, userRouter.routes(), userRouter.allowedMethods());
router.use(API, merchantRouter.routes(), merchantRouter.allowedMethods());
router.use(API, contentRouter.routes(), contentRouter.allowedMethods());
router.use(API, aiRouter.routes(), aiRouter.allowedMethods());
router.use(API, marketingRouter.routes(), marketingRouter.allowedMethods());
router.use(API, campaignRouter.routes(), campaignRouter.allowedMethods());
router.use(API, paymentRouter.routes(), paymentRouter.allowedMethods());
router.use(API, geoRouter.routes(), geoRouter.allowedMethods());
router.use(API, videoRouter.routes(), videoRouter.allowedMethods());
router.use(API, distributionRouter.routes(), distributionRouter.allowedMethods());
router.use(API, adminRouter.routes(), adminRouter.allowedMethods());
router.use(API, uploadRouter.routes(), uploadRouter.allowedMethods());

export default router;
