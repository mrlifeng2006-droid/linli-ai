// 诊断：直接打印 config 加载结果
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
console.log('API Key:', process.env.DEEPSEEK_API_KEY ? '[已加载]' : '[未加载]');
console.log('Key前20字符:', (process.env.DEEPSEEK_API_KEY || '').substring(0, 20));
