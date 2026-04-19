// server/src/modules/distribution/distribution.service.ts
import { v4 as uuidv4 } from 'uuid';
import { execute, queryOne, query } from '../../core/database/index';

export interface PublishResult {
  id: string;
  platform: string;
  status: string;
  publishAt: string;
}

export interface DistributionRecord {
  id: string;
  platform: string;
  platformName: string;
  contentText: string;
  hashtags: string;
  geoTag: string;
  cityTag: string;
  status: string;
  publishAt: string;
  views: number;
  clicks: number;
}

// 六大分发平台定义
export const PLATFORMS = [
  { key: 'friend_circle', name: '朋友圈', icon: '🖼️', maxChars: 500, supportGeo: true, color: '#07C160' },
  { key: 'wechat_friend', name: '微信好友', icon: '👥', maxChars: 500, supportGeo: false, color: '#07C160' },
  { key: 'douyin', name: '抖音', icon: '🎵', maxChars: 2000, supportGeo: true, color: '#00F2EA' },
  { key: 'xiaohongshu', name: '小红书', icon: '📕', maxChars: 1000, supportGeo: true, color: '#FF2442' },
  { key: 'weibo', name: '微博', icon: '🌐', maxChars: 2000, supportGeo: true, color: '#E6162D' },
  { key: 'short_video', name: '视频号', icon: '🎬', maxChars: 200, supportGeo: true, color: '#07C160' },
];

/**
 * 发布内容到指定平台（本地记录模拟，实际可对接各平台API）
 */
export async function publishContent(
  merchantId: string,
  platform: string,
  contentText: string,
  hashtags: string,
  geoTag: string,
  cityTag: string,
  contentId?: string
): Promise<PublishResult> {
  const id = uuidv4().replace(/-/g, '').slice(0, 12);
  const now = new Date().toISOString();

  execute(
    `INSERT INTO Distribution_History
     (id, merchant_id, content_id, platform, content_text, hashtags, geo_tag, city_tag, status, publish_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'published', ?, ?)`,
    [id, merchantId, contentId || null, platform, contentText, hashtags, geoTag, cityTag, now, now]
  );

  return {
    id,
    platform,
    status: 'published',
    publishAt: now,
  };
}

/**
 * 查询分发历史
 */
export async function getDistributionHistory(
  merchantId: string,
  page: number = 1,
  pageSize: number = 20
): Promise<{ list: DistributionRecord[]; total: number }> {
  const offset = (page - 1) * pageSize;

  const total = (queryOne(
    'SELECT COUNT(*) as count FROM Distribution_History WHERE merchant_id = ?',
    [merchantId]
  ) as any)?.count || 0;

  const rows = query(
    `SELECT id, platform, content_text, hashtags, geo_tag, city_tag, status, publish_at, views, clicks
     FROM Distribution_History
     WHERE merchant_id = ?
     ORDER BY publish_at DESC
     LIMIT ? OFFSET ?`,
    [merchantId, pageSize, offset]
  ) as any[];

  const list: DistributionRecord[] = rows.map(row => {
    const platformInfo = PLATFORMS.find(p => p.key === row.platform);
    return {
      id: row.id,
      platform: row.platform,
      platformName: platformInfo?.name || row.platform,
      contentText: row.content_text,
      hashtags: row.hashtags,
      geoTag: row.geo_tag,
      cityTag: row.city_tag,
      status: row.status,
      publishAt: row.publish_at,
      views: row.views || 0,
      clicks: row.clicks || 0,
    };
  });

  return { list, total };
}

/**
 * 查询平台统计数据
 */
export async function getPlatformStats(merchantId: string) {
  const rows = query(
    `SELECT platform,
            COUNT(*) as count,
            SUM(views) as total_views,
            SUM(clicks) as total_clicks
     FROM Distribution_History
     WHERE merchant_id = ?
     GROUP BY platform
     ORDER BY count DESC`,
    [merchantId]
  ) as any[];

  return PLATFORMS.map(p => {
    const stat = rows.find(r => r.platform === p.key);
    return {
      ...p,
      count: stat ? stat.count : 0,
      totalViews: stat ? stat.total_views || 0 : 0,
      totalClicks: stat ? stat.total_clicks || 0 : 0,
    };
  });
}
