import path from 'path';
import { fileURLToPath } from 'url';
import { config as dotenv_config } from 'dotenv';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER_ROOT = path.resolve(__dirname, '../../../');
const dotenvPath = path.join(SERVER_ROOT, '.env');

console.log('__dirname模拟为:', __dirname);
console.log('SERVER_ROOT:', SERVER_ROOT);
console.log('.env路径:', dotenvPath);
console.log('.env存在:', fs.existsSync(dotenvPath));

dotenv_config({ path: dotenvPath });
console.log('DEEPSEEK_API_KEY:', process.env.DEEPSEEK_API_KEY ? '[有值 ✓]' : '[空 ✗]');
console.log('Key前10:', (process.env.DEEPSEEK_API_KEY || '').substring(0, 10));
