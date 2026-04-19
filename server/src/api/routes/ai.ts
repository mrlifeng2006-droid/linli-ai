/**
 * AI 文案生成接口
 * POST /api/v1/ai/generate   - 生成营销文案（支持看图分析）
 * POST /api/v1/ai/optimize   - 优化已有文案
 * GET  /api/v1/ai/templates  - 获取文案模板列表
 */
import Router from 'koa-router';
import { config } from '../../core/config';
// @ts-ignore
const db = require('../../core/database');
import crypto from 'crypto';

const router = new Router({ prefix: '/ai' });

// 内容类型 → 平台映射
const TYPE_LABELS: Record<string, string> = {
  social:    '朋友圈文案',
  shortVideo:'短视频脚本',
  poster:    '海报文案',
  groupMsg:  '群发消息',
};

// 文案风格 → 语气描述
const STYLE_LABELS: Record<string, string> = {
  friendly:    '亲切温暖，像朋友推荐',
  professional:'专业可信，适合品牌商家',
  trendy:      '年轻潮流，有网感有梗',
  humor:       '幽默风趣，让人会心一笑',
};

// ────────────────────────────────────────────────
// AI 调用（硅基流动 / DeepSeek 兼容接口）
// ────────────────────────────────────────────────
async function callAI(messages: { role: string; content: string | any[] }[]) {
  const url = 'https://api.siliconflow.cn/v1/chat/completions';
  const apiKey = config.deepseek.apiKey;
  const body = {
    model: 'deepseek-ai/DeepSeek-V3',
    messages,
    temperature: 0.7,
    max_tokens: 1500,
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`AI 接口调用失败 [${res.status}]: ${errText}`);
  }

  const data = await res.json() as any;
  return data.choices?.[0]?.message?.content ?? '';
}

// ────────────────────────────────────────────────
// AI 视觉分析（看图理解）
// 支持 base64 图片列表（最多4张）
// ────────────────────────────────────────────────
async function analyzeImages(imageBase64List: string[]): Promise<string> {
  if (!imageBase64List || imageBase64List.length === 0) return '';

  const url = 'https://api.siliconflow.cn/v1/chat/completions';
  const apiKey = config.deepseek.apiKey;

  // 只取前4张，减少 token 消耗
  const images = imageBase64List.slice(0, 4);

  const content: any[] = [
    {
      type: 'text',
      text: '请仔细分析这些图片，描述：\n1. 图片中的主要商品/菜品/环境是什么？\n2. 有哪些卖点可以提炼？\n3. 适合什么样的营销场景？\n请用简洁的中文回答。',
    },
  ];

  for (const img of images) {
    content.push({
      type: 'image_url',
      image_url: { url: img },
    });
  }

  const body = {
    model: 'Qwen/Qwen2.5-VL-7B-Instruct',
    messages: [{ role: 'user', content }],
    temperature: 0.3,
    max_tokens: 800,
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      console.warn('⚠️ 视觉分析失败:', res.status, err);
      return '';
    }

    const data = await res.json() as any;
    const result = data.choices?.[0]?.message?.content ?? '';
    console.log('👁️ 视觉分析结果:', result.substring(0, 200));
    return result;
  } catch (err: any) {
    console.warn('⚠️ 视觉分析异常:', err.message);
    return '';
  }
}

// ────────────────────────────────────────────────
// 构建生成文案的提示词（图片卖点优先级最高）
// ────────────────────────────────────────────────
function buildGeneratePrompt(params: {
  shopName: string;
  industry: string;
  address: string;
  features: string;
  target: string;
  types: string[];
  style: string;
  imageAnalysis?: string;
}): { system: string; user: string } {
  const typesText = params.types.map(t => TYPE_LABELS[t] || t).join('、');
  const styleText = STYLE_LABELS[params.style] || '亲切温暖';

  // 图片分析结果（最重要，置顶）
  const imageSection = params.imageAnalysis
    ? `## 🔍 图片分析（第一优先级，请务必融入文案）\n${params.imageAnalysis}\n\n## 📝 商家补充信息\n店铺名称：${params.shopName}\n行业类型：${params.industry}\n详细地址：${params.address}\n店铺特色：${params.features}\n目标客群：${params.target}\n`
    : `## 📝 商家信息\n店铺名称：${params.shopName}\n行业类型：${params.industry}\n详细地址：${params.address}\n店铺特色：${params.features}\n目标客群：${params.target}\n`;

  const system = `你是专为本地生活商家服务的 AI 营销文案专家。

【核心原则】
1. 图片分析结果是第一优先级，必须在文案中明确体现（如：图片中的菜品、环境、装修风格、招牌产品等）
2. 商家自填信息作为补充，两者结合生成
3. 如果图片分析结果与商家自填信息有出入，以图片分析为准（因为图片是实拍，更真实）
4. 文案自然融入地理位置信息
5. 语言生动有感染力，适合社交媒体传播
6. 带上合适的 hashtag 标签`;

  const user = `请为以下商家生成营销文案：

${imageSection}
【需要生成的类型】${typesText}
【文案风格】${styleText}

请生成完整可用的文案内容，每种类型之间用"======"分隔。

**重要**：请在文案中至少提到3处图片中识别出的具体细节（菜品名、环境特点、装修风格等），不能只围绕"咖啡"或"牛肉面"这类笼统词。`;

  return { system, user };
}

// ─── POST /ai/generate ───────────────────────────────────────────
router.post('/generate', async (ctx) => {
  console.log('🔔 /ai/generate 被调用');
  const body = ctx.request.body as any;
  const { shopName, industry, address, features, target, types, style, images } = body;

  console.log('📝 请求体 keys:', Object.keys(body));
  console.log('🖼️ 图片数量:', images?.length || 0);

  // 参数校验
  if (!shopName?.trim()) {
    ctx.status = 400;
    ctx.body = { code: 400, message: '请填写店铺名称' };
    return;
  }
  if (!industry?.trim()) {
    ctx.status = 400;
    ctx.body = { code: 400, message: '请选择行业类型' };
    return;
  }
  if (!Array.isArray(types) || types.length === 0) {
    ctx.status = 400;
    ctx.body = { code: 400, message: '请至少选择一种内容类型' };
    return;
  }

  // ── ① 先做视觉分析（如果有图片）─────────────────
  let imageAnalysis = '';
  if (images && images.length > 0) {
    console.log('👁️ 开始分析图片...');
    try {
      imageAnalysis = await analyzeImages(images);
    } catch (err: any) {
      console.warn('⚠️ 图片分析失败，继续生成:', err.message);
    }
  }

  // ── ② 再生成文案 ─────────────────────────────
  let aiContent = '';
  try {
    const { system, user } = buildGeneratePrompt({
      shopName, industry, address,
      features: features || '',
      target: target || '',
      types, style: style || 'friendly',
      imageAnalysis,
    });

    aiContent = await callAI([
      { role: 'system', content: system },
      { role: 'user',   content: user },
    ]);
  } catch (err: any) {
    console.error('❌ AI 文案生成失败:', err.message);
    ctx.status = 500;
    ctx.body = { code: 500, message: `AI 生成失败: ${err.message}` };
    return;
  }

  // ── ③ 保存到数据库 ───────────────────────────
  const openid = body.openid || 'test_openid_001';
  let merchant: any = await db.queryOne('SELECT id FROM Merchant WHERE openid = ?', [openid]);
  if (!merchant) {
    const mid = crypto.randomUUID();
    await db.execute(
      `INSERT INTO Merchant (id, openid, status, created_at, updated_at)
       VALUES (?, ?, 'active', datetime('now'), datetime('now'))`,
      [mid, openid]
    );
    merchant = { id: mid };
    await db.execute(
      `INSERT INTO Merchant_Profile (id, merchant_id, store_name, industry_cat, location_text, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [crypto.randomUUID(), mid, shopName, industry, address || '']
    );
  } else {
    const profile = await db.queryOne('SELECT id FROM Merchant_Profile WHERE merchant_id = ?', [merchant.id]);
    if (profile) {
      await db.execute(
        `UPDATE Merchant_Profile SET store_name=?, industry_cat=?, location_text=? WHERE merchant_id=?`,
        [shopName, industry, address || '', merchant.id]
      );
    } else {
      await db.execute(
        `INSERT INTO Merchant_Profile (id, merchant_id, store_name, industry_cat, location_text, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        [crypto.randomUUID(), merchant.id, shopName, industry, address || '']
      );
    }
  }

  // 解析 AI 返回内容
  const sections = aiContent.split(/={6,}/);
  const results: any[] = [];

  for (const [idx, type] of types.entries()) {
    const content = sections[idx]?.trim() || sections[0]?.trim() || aiContent.trim();
    const contentId = crypto.randomUUID();
    const hashtagMatch = content.match(/#[\u4e00-\u9fa5\w]+/g) || [];
    const hashtags = hashtagMatch.join(' ');
    const lines = content.split('\n').filter(l => l.trim());
    const title = lines[0]?.replace(/^[#*\-\s]+/, '').substring(0, 60) || `${shopName}营销文案`;

    await db.execute(
      `INSERT INTO Content (id, merchant_id, type, title, description, hashtags, geo_text_injected, audit_status, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 1, 'approved', 'generated', datetime('now'), datetime('now'))`,
      [contentId, merchant.id, type, title, content, hashtags]
    );

    results.push({ type, title, content, hashtags, id: contentId });
  }

  ctx.body = {
    code: 0,
    message: '生成成功',
    data: {
      shopName,
      types,
      results,
      imageAnalysis, // 返回图片分析结果，供前端展示
      raw: aiContent,
      generatedAt: new Date().toISOString(),
    },
  };
});

// ─── POST /ai/optimize ──────────────────────────────────────────
router.post('/optimize', async (ctx) => {
  const { content, instruction } = ctx.request.body as any;

  if (!content?.trim()) {
    ctx.status = 400;
    ctx.body = { code: 400, message: '请提供需要优化的文案' };
    return;
  }

  try {
    const system = '你是一个专业的文案优化专家，请根据用户的指示优化文案，保持原意但提升表达效果。';
    const user = `原文案：\n${content}\n\n优化指示：${instruction || '让文案更有吸引力，适合本地生活商家推广'}`;

    const optimized = await callAI([
      { role: 'system', content: system },
      { role: 'user',   content: user },
    ]);

    ctx.body = { code: 0, message: '优化成功', data: { original: content, optimized } };
  } catch (err: any) {
    ctx.status = 500;
    ctx.body = { code: 500, message: `AI 优化失败: ${err.message}` };
  }
});

// ─── GET /ai/templates ───────────────────────────────────────────
router.get('/templates', (ctx) => {
  const templates = [
    { id: '1', name: '新店开业',   desc: '适合新店开业、活动造势', tags: ['开业', '活动', '优惠'] },
    { id: '2', name: '限时促销',   desc: '突出紧迫感，促使用户立即行动', tags: ['限时', '促销', '抢购'] },
    { id: '3', name: '新品推荐',   desc: '介绍新品特点，吸引尝鲜用户', tags: ['新品', '推荐', '尝鲜'] },
    { id: '4', name: '老客召回',   desc: '唤醒沉睡客户，提升复购率', tags: ['老客', '优惠', '召回'] },
    { id: '5', name: '节日营销',   desc: '结合节日氛围，增加情感共鸣', tags: ['节日', '节气', '祝福'] },
    { id: '6', name: '口碑种草',   desc: '真实分享，营造好口碑', tags: ['种草', '推荐', '真实'] },
  ];
  ctx.body = { code: 0, data: templates };
});

export default router;
