const BetterSqlite3 = require('better-sqlite3');
const jwt = require('jsonwebtoken');
const http = require('http');

const db = new BetterSqlite3('D:\\桌面\\邻里Ai代码\\server\\data\\linli_ai.db', { readonly: true });
const merchant = db.prepare('SELECT id FROM Merchant LIMIT 1').get();
db.close();

const SECRET = 'linli-ai-dev-secret-2026';
const token = jwt.sign({ merchantId: merchant.id }, SECRET, { expiresIn: '7d' });

function makeReq(method, path, body, token) {
  return new Promise((resolve) => {
    const data = body ? JSON.stringify(body) : '';
    const req = http.request({
      hostname: 'localhost', port: 3000, path, method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? 'Bearer ' + token : '',
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ s: res.statusCode, b: JSON.parse(d) }); }
        catch { resolve({ s: res.statusCode, b: d }); }
      });
    });
    req.on('error', e => resolve({ e: e.message }));
    if (data) req.write(data);
    req.end();
  });
}

async function main() {
  console.log('商户:', merchant.id.substring(0,8) + '...');
  console.log('\n[1] 未登录访问 -> ', JSON.stringify(await makeReq('GET', '/api/v1/content/list')));
  console.log('\n[2] 登录后创建内容 -> ');
  let r = await makeReq('POST', '/api/v1/content/create', {
    title: '测试标题', description: '这是测试内容', hashtags: '#美食'
  }, token);
  console.log(JSON.stringify(r));
  const contentId = r.b?.data?.id;
  console.log('内容ID:', contentId ? contentId.substring(0,8)+'...' : 'null');

  if (contentId) {
    console.log('\n[3] 获取内容详情 -> ');
    console.log(JSON.stringify(await makeReq('GET', '/api/v1/content/detail/' + contentId, null, token)));
    console.log('\n[4] 更新内容 -> ');
    console.log(JSON.stringify(await makeReq('PUT', '/api/v1/content/update/' + contentId, {
      title: '更新后的标题', hashtags: '#美食 #探店'
    }, token)));
    console.log('\n[5] 获取内容列表 -> ');
    console.log(JSON.stringify(await makeReq('GET', '/api/v1/content/list?page=1&pageSize=5', null, token)));
    console.log('\n[6] 删除内容 -> ');
    console.log(JSON.stringify(await makeReq('DELETE', '/api/v1/content/delete/' + contentId, null, token)));
  }
}

main();
