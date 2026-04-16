// 对比测试：Node http vs fetch，看 Authorization header 是否一致
const https = require('https');
const apiKey = 'sk-vkmjqjigyrfxhoevabzzkambmkbhpvhejvpjjrjaskwxtjnz';

const body = JSON.stringify({
  model: 'deepseek-ai/DeepSeek-V3',
  messages: [{ role: 'user', content: '用一句话介绍自己' }],
  max_tokens: 50,
});

console.log('=== 测试1：直接 https.request（参考成功的）===');
const req1 = https.request({
  hostname: 'api.siliconflow.cn', port: 443, path: '/v1/chat/completions', method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  }
}, res => {
  const chunks = []; res.on('data', c => chunks.push(c));
  res.on('end', () => {
    const r = JSON.parse(Buffer.concat(chunks).toString());
    console.log('直接请求结果:', res.statusCode, r.choices?.[0]?.message?.content?.substring(0, 50));
  });
});
req1.write(body); req1.end();

setTimeout(() => {
  console.log('\n=== 测试2：通过 Koa app 的 /api/v1/ai/generate 路由 ===');
  const req2 = http.request({
    hostname: 'localhost', port: 3000, path: '/api/v1/ai/generate', method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Length': Buffer.byteLength(body),
    }
  }, res => {
    const chunks = []; res.on('data', c => chunks.push(c));
    res.on('end', () => {
      const r = Buffer.concat(chunks).toString();
      console.log('Koa路由结果:', res.statusCode, r.substring(0, 300));
    });
  });
  req2.write(body); req2.end();
}, 2000);
