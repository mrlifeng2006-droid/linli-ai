import Router from 'koa-router';
const router = new Router({ prefix: '' });

// 健康检查（独立路由，不受 /api/v1 前缀影响）
router.get('/api/v1/health', (ctx) => {
  ctx.body = {
    code: 0,
    message: 'ok',
    data: {
      service: 'linli-ai-server',
      version: '1.0.0',
      status: 'running',
      timestamp: new Date().toISOString(),
    },
  };
});

export default router;
