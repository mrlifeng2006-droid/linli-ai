/**
 * 邻里AI V17.0 后端服务入口
 */
import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import cors from '@koa/cors';
import { config } from './core/config';
import router from './api/routes';

// 创建 Koa 实例
const app = new Koa();

// 中间件
app.use(cors({
  origin: '*',
  credentials: true,
}));

app.use(bodyParser({
  jsonLimit: '10mb',
  formLimit: '10mb',
}));

// 统一响应格式
app.use(async (ctx, next) => {
  try {
    await next();
    if (!ctx.body) {
      ctx.body = { code: 404, message: 'Not Found' };
    }
  } catch (err: any) {
    ctx.status = err.status || 500;
    ctx.body = {
      code: ctx.status,
      message: err.message || 'Internal Server Error',
      ...(config.nodeEnv === 'development' && { stack: err.stack }),
    };
    if (config.nodeEnv !== 'production') {
      console.error('❌ 错误:', err);
    }
  }
});

// 加载路由
app.use(router.routes());
app.use(router.allowedMethods());

// 启动服务器
async function bootstrap() {
  // 测试数据库连接（阶段2会用到）
  // const { testConnection } = await import('./core/database');
  // await testConnection();

  app.listen(config.port, () => {
    console.log(`
╔══════════════════════════════════════╗
║   邻里AI V17.0 后端服务启动成功      ║
╠══════════════════════════════════════╣
║   端口: ${config.port}
║   环境: ${config.nodeEnv}
║   时间: ${new Date().toLocaleString('zh-CN')}
╚══════════════════════════════════════╝
    `);
  });
}

bootstrap().catch(console.error);

export default app;
