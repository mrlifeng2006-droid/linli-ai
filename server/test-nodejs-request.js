// 用 Node.js 原生 http 发请求（绕过 PowerShell 编码问题）
const http = require('http');

const body = JSON.stringify({
  shopName: '老王咖啡馆',
  industry: '咖啡厅',
  address: '深圳市南山区',
  features: '手冲咖啡，环境安静',
  target: '周边程序员',
  types: ['social'],
  style: 'friendly',
});

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/v1/ai/generate',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  },
}, res => {
  const chunks = [];
  res.on('data', c => chunks.push(c));
  res.on('end', () => {
    const r = Buffer.concat(chunks).toString();
    console.log('Status:', res.statusCode);
    try {
      const j = JSON.parse(r);
      console.log('code:', j.code, 'message:', j.message);
      if (j.data) {
        console.log('内容预览:', j.data.raw?.substring(0, 200));
      }
    } catch {
      console.log('raw:', r.substring(0, 300));
    }
  });
});

req.on('error', e => console.error('Error:', e.message));
req.write(body);
req.end();
