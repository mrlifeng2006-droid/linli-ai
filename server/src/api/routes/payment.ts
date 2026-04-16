import Router from 'koa-router';
const router = new Router({ prefix: '/payment' });

// TODO: 阶段3填充 - 支付
router.post('/create-order', (ctx) => { ctx.body = { code: 0, data: null }; });
router.post('/notify', (ctx) => { ctx.body = { code: 0, data: null }; });
router.post('/refund', (ctx) => { ctx.body = { code: 0, data: null }; });
router.get('/status/:orderId', (ctx) => { ctx.body = { code: 0, data: null }; });

export default router;
