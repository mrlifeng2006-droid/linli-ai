const BetterSqlite3 = require('better-sqlite3');
const jwt = require('jsonwebtoken');
const http = require('http');

const dbPath = 'D:\\桌面\\邻里Ai代码\\server\\data\\linli_ai.db';
const db = new BetterSqlite3(dbPath);
const SECRET = 'linli-ai-dev-secret-2026';

// 查询商户状态
const merchant = db.prepare('SELECT id, phone, nickname, status FROM Merchant LIMIT 1').get();
console.log('商户信息:', merchant);

// 更新为active状态
if (merchant && merchant.status !== 'active') {
  db.prepare("UPDATE Merchant SET status = 'active' WHERE id = ?").run(merchant.id);
  console.log('已更新商户状态为 active');
}

// 生成 token
const token = jwt.sign({ merchantId: merchant.id }, SECRET, { expiresIn: '7d' });
console.log('\nJWT Token:', token);

function makeRequest(method, path, body, token) {
  return new Promise((resolve) => {
    const data = body ? JSON.stringify(body) : '';
    const opts = {
      hostname: 'localhost', port: 3000, path, method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token,
        'Content-Length': Buffer.byteLength(data)
      }
    };
    const req = http.request(opts, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { d = JSON.parse(d); } catch {}
        resolve({ status: res.statusCode, body: d });
      });
    });
    req.on('error', e => resolve({ error: e.message }));
    if (data) req.write(data);
    req.end();
  });
}

async function runTests() {
  const token = jwt.sign({ merchantId: merchant.id }, SECRET, { expiresIn: '7d' });
  
  console.log('\n========== 1. 测试创建内容 ==========');
  let r = await makeRequest('POST', '/api/v1/content/create', {
    title: "测试标题",
    description: "这是测试内容",
    hashtags: "#美食"
  }, token);
  console.log('Status:', r.status, '| Response:', JSON.stringify(r.body));
  const contentId = r.body?.data?.id;

  console.log('\n========== 2. 测试内容列表 ==========');
  r = await makeRequest('GET', '/api/v1/content/list?page=1&pageSize=10', null, token);
  console.log('Status:', r.status, '| Response:', JSON.stringify(r.body));

  if (contentId) {
    console.log('\n========== 3. 测试内容详情 ==========');
    r = await makeRequest('GET', `/api/v1/content/detail/${contentId}`, null, token);
    console.log('Status:', r.status, '| Response:', JSON.stringify(r.body));

    console.log('\n========== 4. 测试更新内容 ==========');
    r = await makeRequest('PUT', `/api/v1/content/update/${contentId}`, {
      title: "更新后的标题",
      hashtags: "#美食 #探店"
    }, token);
    console.log('Status:', r.status, '| Response:', JSON.stringify(r.body));

    console.log('\n========== 5. 测试删除内容 ==========');
    r = await makeRequest('DELETE', `/api/v1/content/delete/${contentId}`, null, token);
    console.log('Status:', r.status, '| Response:', JSON.stringify(r.body));
  }
}

runTests().then(() => {
  db.close();
  console.log('\n测试完成');
});
