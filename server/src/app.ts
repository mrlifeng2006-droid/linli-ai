/**
 * 邻里AI V17.0 后端服务入口
 */
// @ts-ignore
import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import cors from '@koa/cors';
import serve from 'koa-static';
import { config } from './core/config';
import router from './api/routes';

// 创建 Koa 实例
const app = new Koa();

// 中间件
app.use(cors({ origin: '*', credentials: true }));

app.use(bodyParser({ jsonLimit: '10mb', formLimit: '10mb' }));

// 静态文件服务 - 上传的图片
const path = require('path');
app.use(serve(path.resolve(__dirname, '../data/uploads')));

// JWT 认证中间件（在路由之前）
app.use(async (ctx, next) => {
  const authHeader = ctx.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const { verifyToken } = require('./modules/user/auth.service');
      const decoded = verifyToken(token);
      ctx.state.user = decoded;
    } catch (err) {
      // token 无效，但不阻止请求（由具体路由决定是否要求登录）
      console.log('  ⚠️ JWT 验证失败:', (err as Error).message);
    }
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
function bootstrap() {
  // 动态导入数据库模块（CommonJS）
  // @ts-ignore
  var dbModule = require('./core/database');

  dbModule.initDatabase().then(function() {
    var server = app.listen(config.port, '0.0.0.0', function() {
      console.log('\n' +
        '╔══════════════════════════════════════════════╗\n' +
        '║        邻里AI V17.0 后端服务启动成功          ║\n' +
        '╠══════════════════════════════════════════════╣\n' +
        '║   端口:  http://localhost:' + config.port + '\n' +
        '║   环境:  ' + config.nodeEnv + '\n' +
        '║   数据库: SQLite + sql.js\n' +
        '║   时间:  ' + new Date().toLocaleString('zh-CN') + '\n' +
        '╚══════════════════════════════════════════════╝\n'
      );
    });
    server.on('error', function(err) {
      console.error('❌ 服务器监听错误:', err.message);
      process.exit(1);
    });

    // 保持进程运行 - 防止 Promise 链结束后自动退出
    console.log('✅ 服务已就绪，等待请求...');

    // 防止进程意外退出 - 多种方式
    process.stdin.resume();
    // 每5秒输出心跳，防止进程休眠
    setInterval(() => {
      console.log('💓 心跳:', new Date().toISOString());
    }, 5000);
  }).catch(function(err) {
    console.error('❌ 数据库初始化失败:', err);
    process.exit(1);
  });
}

bootstrap();

export default app;
