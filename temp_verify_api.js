// temp_verify_api.js - 验证前后端连通性
const http = require('http');

function post(path, data) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function get(path) {
  return new Promise((resolve, reject) => {
    http.get({ hostname: 'localhost', port: 3000, path }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d }));
    }).on('error', reject);
  });
}

async function main() {
  console.log('=== 前后端连通性验证 ===\n');

  // 1. 健康检查
  console.log('1. 健康检查...');
  const h = await get('/api/v1/health');
  console.log('   状态:', h.status, '| 响应:', h.body);

  // 2. 发送验证码
  console.log('\n2. 发送验证码...');
  const s = await post('/api/v1/user/send-code', { phone: '13800138001', purpose: 'login', _dev: 1 });
  console.log('   状态:', s.status, '| 响应:', s.body);

  // 3. 登录
  if (s.status === 200) {
    const sr = JSON.parse(s.body);
    if (sr.verificationCode) {
      console.log('\n3. 登录（验证码：' + sr.verificationCode + '）...');
      const l = await post('/api/v1/user/login', { phone: '13800138001', code: sr.verificationCode, _dev: 1 });
      console.log('   状态:', l.status, '| 响应:', l.body);
      const lr = JSON.parse(l.body);
      if (lr.data && lr.data.token) {
        const token = lr.data.token;
        console.log('\n4. 获取用户资料（带JWT）...');
        const p = await post('/api/v1/user/profile', {},);
        p.headers = { 'Authorization': `Bearer ${token}` };
        // 用GET请求
        const pg = await new Promise((resolve) => {
          http.get({ hostname: 'localhost', port: 3000, path: '/api/v1/user/profile', headers: { 'Authorization': `Bearer ${token}` } }, res => {
            let d = ''; res.on('data', c => d += c); res.on('end', () => resolve({ status: res.statusCode, body: d }));
          });
        });
        console.log('   状态:', pg.status, '| 响应:', pg.body);

        // 5. AI生成
        console.log('\n5. AI文案生成...');
        const ag = await post('/api/v1/ai/generate', {
          shopName: '深圳湾茶餐厅',
          industry: '餐饮美食',
          features: '港式茶餐厅，正宗菠萝油和丝袜奶茶',
          types: ['social'],
          style: 'friendly'
        });
        console.log('   状态:', ag.status, '| 响应:', ag.body.substring(0, 300));
      }
    }
  }
  console.log('\n=== 验证完成 ===');
}

main().catch(e => console.error('ERROR:', e.message));
