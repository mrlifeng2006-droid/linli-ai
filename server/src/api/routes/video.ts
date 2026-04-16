import Router from 'koa-router';
const router = new Router({ prefix: '/video' });

// TODO: 阶段2填充 - 视频处理
router.post('/generate', (ctx) => { ctx.body = { code: 0, data: null }; });
router.get('/status/:jobId', (ctx) => { ctx.body = { code: 0, data: null }; });
router.get('/download/:jobId', (ctx) => { ctx.body = { code: 0, data: null }; });
router.post('/upload-to-cos', (ctx) => { ctx.body = { code: 0, data: null }; });

export default router;
