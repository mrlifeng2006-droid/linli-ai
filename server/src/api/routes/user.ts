import Router from 'koa-router';
const router = new Router({ prefix: '/user' });

// TODO: 阶段3填充
router.get('/profile', (ctx) => { ctx.body = { code: 0, data: null }; });
router.put('/profile', (ctx) => { ctx.body = { code: 0, data: null }; });
router.post('/register', (ctx) => { ctx.body = { code: 0, data: null }; });
router.post('/login', (ctx) => { ctx.body = { code: 0, data: null }; });
router.post('/logout', (ctx) => { ctx.body = { code: 0, data: null }; });
router.get('/vip-status', (ctx) => { ctx.body = { code: 0, data: null }; });

export default router;
