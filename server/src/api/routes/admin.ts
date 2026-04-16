import Router from 'koa-router';
const router = new Router({ prefix: '/admin' });

// TODO: 阶段4填充 - Admin后台
router.get('/dashboard', (ctx) => { ctx.body = { code: 0, data: null }; });
router.get('/users', (ctx) => { ctx.body = { code: 0, data: [] }; });
router.get('/merchants', (ctx) => { ctx.body = { code: 0, data: [] }; });
router.get('/contents', (ctx) => { ctx.body = { code: 0, data: [] }; });
router.get('/orders', (ctx) => { ctx.body = { code: 0, data: [] }; });

export default router;
