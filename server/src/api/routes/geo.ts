import Router from 'koa-router';
const router = new Router({ prefix: '/geo' });

// TODO: 阶段2填充 - GEO注入
router.post('/inject', (ctx) => { ctx.body = { code: 0, data: null }; });
router.get('/verify', (ctx) => { ctx.body = { code: 0, data: null }; });
router.get('/nearby', (ctx) => { ctx.body = { code: 0, data: null }; });

export default router;
