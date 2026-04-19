/**
 * Vercel Serverless 入口文件
 * 导出 Koa app 实例供 Vercel 使用
 */
// @ts-ignore
import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import cors from '@koa/cors';
import router from './api/routes';

// 创建 Koa 实例
const app = new Koa();

// 中间件
app.use(cors({ origin: '*', credentials: true }));
app.use(bodyParser({ jsonLimit: '10mb', formLimit: '10mb' }));

// 数据库初始化中间件（serverless 环境必需）
app.use(async (ctx, next) => {
  // @ts-ignore
  const db = require('./core/database');
  if (!db.testConnection || !db.testConnection()) {
    await db.initDatabase();
  }
  await next();
});

// 统一响应格式
app.use(async (ctx, next) => {
  try {
    await next();
    if (!ctx.body) ctx.body = { code: 404, message: 'Not Found' };
  } catch (err: any) {
    ctx.status = err.status || 500;
    ctx.body = {
      code: ctx.status,
      message: err.message || 'Internal Server Error',
    };
    console.error('❌ Koa错误:', err.stack || err);
  }
});

// 加载路由
app.use(router.routes());
app.use(router.allowedMethods());

// 导出 app 供 Vercel 使用
export default app;
