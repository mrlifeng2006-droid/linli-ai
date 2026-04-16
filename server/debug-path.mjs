// 精确验证 dist/core/config 运行时 __dirname
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fs from 'fs';

// 模拟 dist/core/config/__dirname 的实际值
const SIMULATED_DIR = 'D:\\桌面\\邻里Ai代码\\server\\dist\\core\\config';

// 用 '../../../..' 测试（4层 = 到桌面）
console.log('../../..:', path.resolve(SIMULATED_DIR, '../../../..'));
console.log('../../..:', path.resolve(SIMULATED_DIR, '../../../'));

// 加载看能不能找到 .env
const candidates = [
  path.resolve(SIMULATED_DIR, '../../../..'),
  path.resolve(SIMULATED_DIR, '../../../'),
  path.resolve(SIMULATED_DIR, '../../'),
  path.resolve(SIMULATED_DIR, '../'),
];

for (const root of candidates) {
  const envPath = path.join(root, '.env');
  const exists = fs.existsSync(envPath);
  console.log(`${exists ? '✅' : '❌'} ${root} → ${path.basename(root)}`);
  if (exists) {
    dotenv.config({ path: envPath });
    console.log('   DEEPSEEK_API_KEY:', process.env.DEEPSEEK_API_KEY ? '[有值 ✓]' : '[空]');
    console.log('   Key前10:', (process.env.DEEPSEEK_API_KEY || '').substring(0, 10));
  }
}
