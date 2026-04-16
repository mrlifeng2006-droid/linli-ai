const BetterSqlite3 = require('better-sqlite3');
const jwt = require('jsonwebtoken');
const http = require('http');

console.log('Step 1: Query DB...');
const db = new BetterSqlite3('D:\\桌面\\邻里Ai代码\\server\\data\\linli_ai.db', { readonly: true });
const merchant = db.prepare('SELECT id FROM Merchant LIMIT 1').get();
db.close();
console.log('Step 1 OK, merchant:', merchant.id);

console.log('Step 2: Generate token...');
const SECRET = 'linli-ai-dev-secret-2026';
const token = jwt.sign({ merchantId: merchant.id }, SECRET, { expiresIn: '7d' });
console.log('Step 2 OK');

console.log('Step 3: HTTP request...');
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

const req = http.request(opts, (res) => {
  console.log('Step 3: Got response, status:', res.statusCode);
  let d = '';
  res.on('data', c => { d += c; });
  res.on('end', () => {
    console.log('Step 3: Body received:', d.substring(0, 500));
  });
});
req.on('error', (e) => {
  console.error('Step 3: Request error:', e.message);
});
console.log('Step 3: Writing body...');
req.write(body);
req.end();
console.log('Step 3: Request sent');
