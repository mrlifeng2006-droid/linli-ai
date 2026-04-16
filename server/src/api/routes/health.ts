import Router from 'koa-router';
const router = new Router();

router.get('/health', (ctx) => {
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
