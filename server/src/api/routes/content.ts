import Router from 'koa-router';
const router = new Router({ prefix: '/content' });

// TODO: 阶段3填充
router.get('/list', (ctx) => { ctx.body = { code: 0, data: [] }; });
router.post('/create', (ctx) => { ctx.body = { code: 0, data: null }; });
router.get('/detail/:id', (ctx) => { ctx.body = { code: 0, data: null }; });
router.delete('/:id', (ctx) => { ctx.body = { code: 0, data: null }; });
router.get('/templates', (ctx) => { ctx.body = { code: 0, data: [] }; });

export default router;
