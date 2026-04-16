// 直接测试 SiliconFlow API Key 是否有效
const https = require('https');

const apiKey = 'sk-vkmjqjigyrfxhoevabzzkambmkbhpvhejvpjjrjaskwxtjnz';

const body = JSON.stringify({
  model: 'deepseek-ai/DeepSeek-V3',
  messages: [
    { role: 'user', content: '你是谁？用一句话回答。' }
  ],
  max_tokens: 50,
});

const options = {
  hostname: 'api.siliconflow.cn',
  port: 443,
  path: '/v1/chat/completions',
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  }
};

const req = https.request(options, (res) => {
  const chunks = [];
  res.on('data', c => chunks.push(c));
  res.on('end', () => {
    const response = Buffer.concat(chunks).toString('utf8');
    console.log('HTTP Status:', res.statusCode);
    try {
      const json = JSON.parse(response);
      if (res.statusCode === 200) {
        console.log('✅ Key 有效！');
        console.log('回答:', json.choices?.[0]?.message?.content);
      } else {
        console.log('❌ Key 无效或受限');
        console.log('error:', json.error);
      }
    } catch {
      console.log('Raw:', response.substring(0, 300));
    }
  });
});

req.on('error', e => console.error('请求失败:', e.message));
req.write(body);
req.end();
