/**
 * 路由总览
 * 阶段1：只注册基础路由占位，阶段2开始填充具体实现
 */
import Router from 'koa-router';
import userRouter from './user';
import merchantRouter from './merchant';
import contentRouter from './content';
import aiRouter from './ai';
import marketingRouter from './marketing';
import paymentRouter from './payment';
import geoRouter from './geo';
import videoRouter from './video';
import distributionRouter from './distribution';
import adminRouter from './admin';
import healthRouter from './health';

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

// API版本前缀
const API_PREFIX = '/api/v1';

// 注册子路由
router.use(API_PREFIX, healthRouter);
router.use(API_PREFIX, userRouter);
router.use(API_PREFIX, merchantRouter);
router.use(API_PREFIX, contentRouter);
router.use(API_PREFIX, aiRouter);
router.use(API_PREFIX, marketingRouter);
router.use(API_PREFIX, paymentRouter);
router.use(API_PREFIX, geoRouter);
router.use(API_PREFIX, videoRouter);
router.use(API_PREFIX, distributionRouter);
router.use(API_PREFIX, adminRouter);

export default router;
