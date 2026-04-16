import Router from 'koa-router';
const router = new Router({ prefix: '/distribution' });

// TODO: 阶段3填充 - 内容分发
router.post('/publish', (ctx) => { ctx.body = { code: 0, data: null }; });
router.get('/platforms', (ctx) => { ctx.body = { code: 0, data: [] }; });
router.get('/history', (ctx) => { ctx.body = { code: 0, data: [] }; });

export default router;
