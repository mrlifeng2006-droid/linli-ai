/**
 * Redis 客户端
 */
import Redis from 'ioredis';
import config from '../config';

const redis = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password || undefined,
  db: config.redis.db,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
});

redis.on('connect', () => {
  console.log('✅ Redis连接成功');
});

redis.on('error', (err) => {
  console.error('❌ Redis连接失败:', err.message);
});

export default redis;
