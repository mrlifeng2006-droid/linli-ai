/**
 * 配置文件加载
 * 从 .env 读取所有配置项
 */
import dotenv from 'dotenv';
import path from 'path';

// 加载 .env 文件
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  // 服务器
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // 数据库
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    name: process.env.DB_NAME || 'linli_ai',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    charset: 'utf8mb4',
    timezone: '+08:00',
  },

  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: 0,
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'linli-ai-dev-secret-2026',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  // DeepSeek AI
  deepseek: {
    apiKey: process.env.DEEPSEEK_API_KEY || '',
    apiUrl: process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1/chat/completions',
    model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
  },

  // 腾讯云COS
  cos: {
    secretId: process.env.COS_SECRET_ID || '',
    secretKey: process.env.COS_SECRET_KEY || '',
    bucket: process.env.COS_BUCKET || '',
    region: process.env.COS_REGION || 'ap-guangzhou',
    url: process.env.COS_URL || '',
  },

  // FFmpeg
  ffmpeg: {
    path: process.env.FFMPEG_PATH || 'ffmpeg',
    staticPath: process.env.FFMPEG_STATIC_PATH || 'ffmpeg',
  },

  // 微信
  wechat: {
    appid: process.env.WECHAT_APPID || '',
    secret: process.env.WECHAT_SECRET || '',
  },

  // 微信支付
  wechatPay: {
    mchid: process.env.WECHAT_PAY_MCHID || '',
    apiKey: process.env.WECHAT_PAY_API_KEY || '',
    notifyUrl: process.env.WECHAT_PAY_NOTIFY_URL || '',
  },
};

export default config;
