import Router from 'koa-router';
import { query, queryOne, execute } from '../../core/database';

const router = new Router({ prefix: '/admin' });

async function requireAdmin(ctx: any, next: () => Promise<void>) {
  await next();
}

router.get('/settings/profile-rules', requireAdmin, async (ctx: any) => {
  const rows = (await query(
    "SELECT key, value, description FROM System_Config WHERE key IN ('profile_cooldown_days', 'allow_merchant_change_industry')"
  )) as any[];

  const rules: Record<string, string> = {};
  for (const row of rows) {
    rules[row.key] = row.value;
  }

  ctx.body = {
    code: 0,
    data: {
      profile_cooldown_days: parseInt(rules['profile_cooldown_days'] || '30', 10),
      allow_merchant_change_industry: rules['allow_merchant_change_industry'] === 'true',
    }
  };
});

router.post('/settings/profile-rules', requireAdmin, async (ctx: any) => {
  const body = (ctx.request.body as any) || {};
  const now = new Date().toISOString();

  if (body.profile_cooldown_days !== undefined) {
    const days = parseInt(body.profile_cooldown_days, 10);
    if (isNaN(days) || days < 0) {
      ctx.status = 400;
      ctx.body = { code: 400, message: '冷却期必须是非负整数' };
      return;
    }
    await execute(
      `INSERT OR REPLACE INTO System_Config (key, value, description, updated_at) VALUES (?, ?, ?, ?)`,
      ['profile_cooldown_days', String(days), '商家店铺信息修改冷却期（天），0=不限制', now]
    );
  }

  if (body.allow_merchant_change_industry !== undefined) {
    await execute(
      `INSERT OR REPLACE INTO System_Config (key, value, description, updated_at) VALUES (?, ?, ?, ?)`,
      ['allow_merchant_change_industry', String(body.allow_merchant_change_industry),
       '是否允许商家自行修改行业类型', now]
    );
  }

  ctx.body = { code: 0, message: '配置已保存' };
});

router.get('/dashboard', requireAdmin, (ctx: any) => { ctx.body = { code: 0, data: null }; });
router.get('/users', requireAdmin, (ctx: any) => { ctx.body = { code: 0, data: [] }; });
router.get('/merchants', requireAdmin, (ctx: any) => { ctx.body = { code: 0, data: [] }; });
router.get('/contents', requireAdmin, (ctx: any) => { ctx.body = { code: 0, data: [] }; });
router.get('/orders', requireAdmin, (ctx: any) => { ctx.body = { code: 0, data: [] }; });

export default router;
