const BetterSqlite3 = require('better-sqlite3');
const jwt = require('jsonwebtoken');
const http = require('http');

const dbPath = 'D:\\桌面\\邻里Ai代码\\server\\data\\linli_ai.db';
const db = new BetterSqlite3(dbPath, { readonly: true });
const merchant = db.prepare('SELECT id FROM Merchant LIMIT 1').get();
db.close();

const SECRET = 'linli-ai-dev-secret-2026';
const token = jwt.sign({ merchantId: merchant.id }, SECRET, { expiresIn: '7d' });

const body = JSON.stringify({title:"测试标题",description:"这是测试内容",hashtags:"#美食"});
const opts = {
  hostname: 'localhost', port: 3000,
  path: '/api/v1/content/create', method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token,
    'Content-Length': Buffer.byteLength(body)
  }
};

console.log('测试商户ID:', merchant.id);
const req = http.request(opts, (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Body:', d);
  });
});
req.on('error', e => console.error('连接错误:', e.message));
req.write(body);
req.end();
