import Router from 'koa-router';
const router = new Router({ prefix: '/merchant' });

// TODO: 阶段3填充
router.get('/info', (ctx) => { ctx.body = { code: 0, data: null }; });
router.post('/register', (ctx) => { ctx.body = { code: 0, data: null }; });
router.put('/profile', (ctx) => { ctx.body = { code: 0, data: null }; });
router.get('/stats', (ctx) => { ctx.body = { code: 0, data: null }; });
router.get('/geo-report', (ctx) => { ctx.body = { code: 0, data: null }; });

export default router;
