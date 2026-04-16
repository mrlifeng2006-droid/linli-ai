// 测试 AI 生成接口
const http = require('http');

const postData = JSON.stringify({
  shopName: '老王咖啡馆',
  industry: '咖啡厅',
  address: '深圳市南山区科技园',
  features: '手冲咖啡，环境安静',
  target: '周边程序员',
  types: ['social', 'shortVideo'],
  style: 'friendly',
});

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/v1/ai/generate',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(postData),
  },
}, (res) => {
  console.log('HTTP Status:', res.statusCode);
  const chunks = [];
  res.on('data', c => chunks.push(c));
  res.on('end', () => {
    const body = Buffer.concat(chunks).toString('utf8');
    try {
      const json = JSON.parse(body);
      console.log('code:', json.code);
      console.log('message:', json.message);
      if (json.data) {
        console.log('results count:', json.data.results?.length);
        console.log('content[0] preview:', (json.data.results?.[0]?.content || '').substring(0, 200));
      }
    } catch(e) {
      console.log('parse error:', e.message);
      console.log('raw:', body.substring(0, 300));
    }
  });
});

req.on('error', e => console.error('request error:', e.message));
req.write(postData);
req.end();
