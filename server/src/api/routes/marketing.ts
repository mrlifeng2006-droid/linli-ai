import Router from 'koa-router';
const router = new Router({ prefix: '/marketing' });

// TODO: 阶段3填充 - 营销工具
router.get('/bargain/list', (ctx) => { ctx.body = { code: 0, data: [] }; });
router.post('/bargain/create', (ctx) => { ctx.body = { code: 0, data: null }; });
router.get('/groupbuy/list', (ctx) => { ctx.body = { code: 0, data: [] }; });
router.post('/groupbuy/create', (ctx) => { ctx.body = { code: 0, data: null }; });
router.get('/seckill/list', (ctx) => { ctx.body = { code: 0, data: [] }; });
router.post('/seckill/create', (ctx) => { ctx.body = { code: 0, data: null }; });

export default router;
