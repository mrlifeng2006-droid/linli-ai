/**
 * 邻里AI V17.0 后端服务入口
 */
// @ts-ignore
import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import cors from '@koa/cors';
import { config } from './core/config';
import router from './api/routes';

// 创建 Koa 实例
const app = new Koa();

// 中间件
app.use(cors({ origin: '*', credentials: true }));

app.use(bodyParser({ jsonLimit: '10mb', formLimit: '10mb' }));

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

// 全局未捕获异常
process.on('uncaughtException', (err) => {
  console.error('💥 UncaughtException:', err.stack || err);
});
process.on('unhandledRejection', (reason) => {
  console.error('💥 UnhandledRejection:', reason);
});

// 加载路由
app.use(router.routes());
app.use(router.allowedMethods());

// 启动服务器
async function bootstrap() {
  // 动态导入数据库模块（CommonJS）
  // @ts-ignore
  const { testConnection, initTables } = require('./core/database');

  const dbOk = testConnection();
  if (dbOk) initTables();

  app.listen(config.port, () => {
    console.log(`
╔══════════════════════════════════════════════╗
║        邻里AI V17.0 后端服务启动成功          ║
╠══════════════════════════════════════════════╣
║   端口:  http://localhost:${config.port}
║   环境:  ${config.nodeEnv}
║   数据库: SQLite (开发模式)
║   时间:  ${new Date().toLocaleString('zh-CN')}
╚══════════════════════════════════════════════╝
    `);
  });
}

bootstrap().catch(console.error);

export default app;
