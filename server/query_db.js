const BetterSqlite3 = require('better-sqlite3');
const path = require('path');
const jwt = require('jsonwebtoken');

const dbPath = 'D:\\桌面\\邻里Ai代码\\server\\data\\linli_ai.db';
const db = new BetterSqlite3(dbPath);

// 查询第一个商户
const merchant = db.prepare('SELECT id, phone, nickname FROM Merchant LIMIT 1').get();
console.log('Merchant:', merchant);

// 生成 token
const SECRET = 'linli-ai-dev-secret-2026';
const token = jwt.sign({ merchantId: merchant.id }, SECRET, { expiresIn: '7d' });
console.log('\nJWT Token:');
console.log(token);

// 测试创建内容
const http = require('http');
const body = JSON.stringify({
  title: "测试标题",
  description: "这是测试内容",
  hashtags: "#美食"
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/v1/content/create',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token,
    'Content-Length': Buffer.byteLength(body)
  }
};

console.log('\n发送创建请求...');
const req = http.request(options, (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', d);
  });
});
req.on('error', e => console.error('Error:', e.message));
req.write(body);
req.end();
