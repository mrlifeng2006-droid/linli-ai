import Router from 'koa-router';
const router = new Router({ prefix: '/ai' });

// TODO: 阶段2填充 - AI文案生成
router.post('/generate', (ctx) => { ctx.body = { code: 0, data: null }; });
router.post('/optimize', (ctx) => { ctx.body = { code: 0, data: null }; });
router.get('/templates', (ctx) => { ctx.body = { code: 0, data: [] }; });

export default router;
