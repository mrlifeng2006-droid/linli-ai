const http = require('http');

function api(path, method, body, token) {
  return new Promise((resolve, reject) => {
    const opts = { hostname: 'localhost', port: 3000, path, method, headers: { 'Content-Type': 'application/json' } };
    if (token) opts.headers['Authorization'] = 'Bearer ' + token;
    const req = http.request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(d) }); }
        catch { resolve({ status: res.statusCode, data: d }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function ok(label, condition, detail) {
  console.log((condition ? '✅' : '❌') + ' ' + label + (detail ? ': ' + detail : ''));
}

async function test() {
  const ts = Date.now();
  const phone = '138' + String(ts).slice(-8);
  const bphone = '139' + String(ts).slice(-8);

  // A1 验证码
  let r = await api('/api/v1/user/send-code?phone=' + phone + '&purpose=register&_dev=1', 'POST', { phone, purpose: 'register', _dev: '1' });
  const vcode = r.data.verificationCode;
  ok('A1 注册验证码', r.status === 200 && vcode, vcode || r.data.message);
  if (!vcode) return;

  // A2 注册
  r = await api('/api/v1/user/register', 'POST', { phone, code: vcode, password: 'Test123456', nickname: '测试用户A' });
  ok('A2 注册', r.data.code === 0, JSON.stringify(r.data).slice(0, 60));
  const token = r.data.data && r.data.data.token;
  if (!token) return;

  // A3 资料
  r = await api('/api/v1/user/profile', 'GET', null, token);
  ok('A3 用户资料', r.data.code === 0, r.data.data && r.data.data.nickname);

  // A4 VIP
  r = await api('/api/v1/user/vip-status', 'GET', null, token);
  ok('A4 VIP状态', r.data.code === 0, JSON.stringify(r.data.data || r.data.message).slice(0, 40));

  // A5 AI生成
  r = await api('/api/v1/ai/generate', 'POST', { type: 'friend_circle', keywords: '咖啡 深圳', geo: '深圳', style: '温暖' }, token);
  ok('A5 AI生成', r.data.code === 0, r.data.data && r.data.data.length + '条文案');

  // A6 内容列表
  r = await api('/api/v1/content/list', 'GET', null, token);
  ok('A6 内容列表', r.data.code === 0, Array.isArray(r.data.data) ? r.data.data.length + '条' : 'ok');

  // B1 商家验证码
  r = await api('/api/v1/user/send-code', 'POST', { phone: bphone, purpose: 'register', _dev: '1' });
  const bvcode = r.data.verificationCode;
  ok('B1 商家验证码', r.status === 200 && bvcode, bvcode || r.data.message);
  if (!bvcode) return;

  // B2 商家注册
  r = await api('/api/v1/user/register', 'POST', { phone: bphone, code: bvcode, password: 'Test123456', nickname: '商家B' });
  ok('B2 商家注册', r.data.code === 0, JSON.stringify(r.data).slice(0, 60));
  const btoken = r.data.data && r.data.data.token;
  if (!btoken) return;

  // B3 个人入驻
  r = await api('/api/v1/merchant/register/personal', 'POST', { store_name: '深圳咖啡店', city: '深圳市', district: '南山区', location_text: '科技园', location_lat: 22.54, location_lng: 113.95 }, btoken);
  ok('B3 个人入驻', r.data.code === 0, JSON.stringify(r.data.data || r.data.message).slice(0, 60));

  // B4 创建砍价
  r = await api('/api/v1/campaign/create', 'POST', { type: 'bargain', title: '新客砍价', cover_image: 'https://img.com/1.jpg', original_price: 99, target_price: 9.9, stock: 100, start_time: '2026-04-20', end_time: '2026-05-20' }, btoken);
  ok('B4 创建砍价', r.data.code === 0, r.data.data && r.data.data.id ? '✅ ' + r.data.data.id.slice(0, 8) : JSON.stringify(r.data).slice(0, 60));

  // B5 活动列表
  r = await api('/api/v1/campaign/merchant/list', 'GET', null, btoken);
  ok('B5 活动列表', r.data.code === 0, Array.isArray(r.data.data) ? r.data.data.length + '个活动' : JSON.stringify(r.data).slice(0, 60));

  console.log('\n🎉 全部验证完成!');
}

test().catch(e => console.error('Error:', e.message));
