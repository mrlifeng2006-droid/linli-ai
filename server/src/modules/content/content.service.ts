/**
 * 内容服务 - 内容分发核心业务逻辑
 */
import { query, queryOne, execute } from '../../core/database/index.js';
import { v4 as uuidv4 } from 'uuid';

// ==================== 类型定义 ====================

export interface ContentData {
  type?: string;
  title: string;
  description: string;
  hashtags?: string;
  images?: string;
  rawVideoUrl?: string;
  finalVideoUrl?: string;
  script?: string;
  geoLat?: number;
  geoLng?: number;
  geoCity?: string;
  geoDistrict?: string;
  descriptionGeo?: string;
  geoExifInjected?: number;
  geoVisualInjected?: number;
  geoTextInjected?: number;
}

export interface ContentItem {
  id: string;
  merchantId: string;
  type: string;
  title: string;
  description: string;
  hashtags: string;
  images: string;
  rawVideoUrl: string;
  finalVideoUrl: string;
  descriptionGeo: string;
  geoLat: number;
  geoLng: number;
  geoCity: string;
  geoDistrict: string;
  geoExifInjected: number;
  geoVisualInjected: number;
  geoTextInjected: number;
  auditStatus: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  // 详情字段（仅 getContentDetail 返回）
  script?: string;
  auditResult?: string;
  auditId?: string;
  cosPath?: string;
  fileSize?: number;
  duration?: number;
  expireAt?: string;
  storageTier?: string;
  distributeChannels?: string;
  distributeAt?: string;
  pointsCost?: number;
}

export interface ContentListResult {
  success: boolean;
  message: string;
  data?: {
    list: ContentItem[];
    total: number;
    page: number;
    pageSize: number;
  };
}

export interface ContentDetailResult {
  success: boolean;
  message: string;
  data?: ContentItem;
}

// ==================== 创建内容 ====================

export interface CreateContentResult {
  success: boolean;
  message: string;
  data?: {
    id: string;
  };
}

export function createContent(merchantId: string, data: ContentData): CreateContentResult {
  console.log('[ContentService] createContent called, merchantId:', merchantId, 'data:', JSON.stringify(data).substring(0,100));
  // 1. 基础验证
  if (!merchantId) {
    return { success: false, message: '商家ID不能为空' };
  }
  if (!data.title || data.title.trim() === '') {
    return { success: false, message: '标题不能为空' };
  }
  if (!data.description || data.description.trim() === '') {
    return { success: false, message: '描述不能为空' };
  }

  // 2. 验证商家是否存在
  console.log('[ContentService] checking merchant...');
  const merchant = queryOne('SELECT id FROM Merchant WHERE id = ? AND status = ?', [merchantId, 'active']);
  if (!merchant) {
    return { success: false, message: '商家不存在或已被禁用' };
  }
  console.log('[ContentService] merchant found:', merchant.id);

  // 3. 生成内容ID
  const id = uuidv4();
  const now = new Date().toISOString();
  console.log('[ContentService] inserting content, id:', id);

  // 4. 插入内容记录
  execute(
    `INSERT INTO Content (
      id, merchant_id, type, title, description, hashtags,
      images, raw_video_url, final_video_url, script,
      geo_lat, geo_lng, geo_city, geo_district,
      description_geo, geo_exif_injected, geo_visual_injected, geo_text_injected,
      audit_status, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'active', ?, ?)`,
    [
      id,
      merchantId,
      data.type || 'text',
      data.title.trim(),
      data.description.trim(),
      data.hashtags || '',
      data.images || '',
      data.rawVideoUrl || '',
      data.finalVideoUrl || '',
      data.script || '',
      data.geoLat || null,
      data.geoLng || null,
      data.geoCity || '',
      data.geoDistrict || '',
      data.descriptionGeo || '',
      data.geoExifInjected || 0,
      data.geoVisualInjected || 0,
      data.geoTextInjected || 0,
      now,
      now,
    ]
  );

  return {
    success: true,
    message: '内容创建成功',
    data: { id },
  };
}

// ==================== 获取内容列表 ====================

export function getContentList(merchantId: string, page: number = 1, pageSize: number = 10): ContentListResult {
  // 1. 验证商家
  if (!merchantId) {
    return { success: false, message: '商家ID不能为空' };
  }

  const merchant = queryOne('SELECT id FROM Merchant WHERE id = ? AND status = ?', [merchantId, 'active']);
  if (!merchant) {
    return { success: false, message: '商家不存在或已被禁用' };
  }

  // 2. 分页参数校验
  page = Math.max(1, page);
  pageSize = Math.max(1, Math.min(100, pageSize));
  const offset = (page - 1) * pageSize;

  // 3. 查询总数
  const countResult = queryOne(
    'SELECT COUNT(*) as total FROM Content WHERE merchant_id = ? AND status = ?',
    [merchantId, 'active']
  );
  const total = countResult?.total || 0;

  // 4. 查询列表
  const list = query(
    `SELECT id, merchant_id, type, title, description, hashtags,
            images, raw_video_url, final_video_url,
            description_geo, geo_lat, geo_lng, geo_city, geo_district,
            geo_exif_injected, geo_visual_injected, geo_text_injected,
            audit_status, status, created_at, updated_at
     FROM Content
     WHERE merchant_id = ? AND status = ?
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    [merchantId, 'active', pageSize, offset]
  );

  // 5. 格式化返回
  const formattedList = list.map((item: any) => ({
    id: item.id,
    merchantId: item.merchant_id,
    type: item.type,
    title: item.title,
    description: item.description,
    hashtags: item.hashtags,
    images: item.images,
    rawVideoUrl: item.raw_video_url,
    finalVideoUrl: item.final_video_url,
    descriptionGeo: item.description_geo,
    geoLat: item.geo_lat,
    geoLng: item.geo_lng,
    geoCity: item.geo_city,
    geoDistrict: item.geo_district,
    geoExifInjected: item.geo_exif_injected,
    geoVisualInjected: item.geo_visual_injected,
    geoTextInjected: item.geo_text_injected,
    auditStatus: item.audit_status,
    status: item.status,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  }));

  return {
    success: true,
    message: '获取成功',
    data: {
      list: formattedList,
      total,
      page,
      pageSize,
    },
  };
}

// ==================== 获取内容详情 ====================

export function getContentDetail(id: string): ContentDetailResult {
  if (!id) {
    return { success: false, message: '内容ID不能为空' };
  }

  const item = queryOne(
    `SELECT id, merchant_id, type, title, description, hashtags,
            images, raw_video_url, final_video_url, script,
            description_geo, geo_lat, geo_lng, geo_city, geo_district,
            geo_exif_injected, geo_visual_injected, geo_text_injected,
            audit_status, audit_result, audit_id,
            cos_path, file_size, duration, expire_at, storage_tier,
            distribute_channels, distribute_at,
            points_cost, status, created_at, updated_at
     FROM Content WHERE id = ?`,
    [id]
  );

  if (!item) {
    return { success: false, message: '内容不存在' };
  }

  return {
    success: true,
    message: '获取成功',
    data: {
      id: item.id,
      merchantId: item.merchant_id,
      type: item.type,
      title: item.title,
      description: item.description,
      hashtags: item.hashtags,
      images: item.images,
      rawVideoUrl: item.raw_video_url,
      finalVideoUrl: item.final_video_url,
      script: item.script,
      descriptionGeo: item.description_geo,
      geoLat: item.geo_lat,
      geoLng: item.geo_lng,
      geoCity: item.geo_city,
      geoDistrict: item.geo_district,
      geoExifInjected: item.geo_exif_injected,
      geoVisualInjected: item.geo_visual_injected,
      geoTextInjected: item.geo_text_injected,
      auditStatus: item.audit_status,
      auditResult: item.audit_result,
      auditId: item.audit_id,
      cosPath: item.cos_path,
      fileSize: item.file_size,
      duration: item.duration,
      expireAt: item.expire_at,
      storageTier: item.storage_tier,
      distributeChannels: item.distribute_channels,
      distributeAt: item.distribute_at,
      pointsCost: item.points_cost,
      status: item.status,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    },
  };
}

// ==================== 更新内容 ====================

export interface UpdateContentResult {
  success: boolean;
  message: string;
}

export function updateContent(id: string, merchantId: string, data: Partial<ContentData>): UpdateContentResult {
  if (!id) {
    return { success: false, message: '内容ID不能为空' };
  }
  if (!merchantId) {
    return { success: false, message: '商家ID不能为空' };
  }

  // 1. 验证内容存在且属于该商家
  const existing = queryOne('SELECT id FROM Content WHERE id = ? AND merchant_id = ?', [id, merchantId]);
  if (!existing) {
    return { success: false, message: '内容不存在或无权限修改' };
  }

  // 2. 构建更新字段
  const updates: string[] = [];
  const values: any[] = [];

  if (data.title !== undefined) {
    updates.push('title = ?');
    values.push(data.title.trim());
  }
  if (data.description !== undefined) {
    updates.push('description = ?');
    values.push(data.description.trim());
  }
  if (data.hashtags !== undefined) {
    updates.push('hashtags = ?');
    values.push(data.hashtags);
  }
  if (data.type !== undefined) {
    updates.push('type = ?');
    values.push(data.type);
  }
  if (data.images !== undefined) {
    updates.push('images = ?');
    values.push(data.images);
  }
  if (data.rawVideoUrl !== undefined) {
    updates.push('raw_video_url = ?');
    values.push(data.rawVideoUrl);
  }
  if (data.finalVideoUrl !== undefined) {
    updates.push('final_video_url = ?');
    values.push(data.finalVideoUrl);
  }
  if (data.script !== undefined) {
    updates.push('script = ?');
    values.push(data.script);
  }
  if (data.geoLat !== undefined) {
    updates.push('geo_lat = ?');
    values.push(data.geoLat);
  }
  if (data.geoLng !== undefined) {
    updates.push('geo_lng = ?');
    values.push(data.geoLng);
  }
  if (data.geoCity !== undefined) {
    updates.push('geo_city = ?');
    values.push(data.geoCity);
  }
  if (data.geoDistrict !== undefined) {
    updates.push('geo_district = ?');
    values.push(data.geoDistrict);
  }
  if (data.descriptionGeo !== undefined) {
    updates.push('description_geo = ?');
    values.push(data.descriptionGeo);
  }
  if (data.geoExifInjected !== undefined) {
    updates.push('geo_exif_injected = ?');
    values.push(data.geoExifInjected);
  }
  if (data.geoVisualInjected !== undefined) {
    updates.push('geo_visual_injected = ?');
    values.push(data.geoVisualInjected);
  }
  if (data.geoTextInjected !== undefined) {
    updates.push('geo_text_injected = ?');
    values.push(data.geoTextInjected);
  }

  if (updates.length === 0) {
    return { success: false, message: '没有需要更新的字段' };
  }

  // 3. 执行更新
  updates.push('updated_at = ?');
  values.push(new Date().toISOString());
  values.push(id);
  values.push(merchantId);

  execute(
    `UPDATE Content SET ${updates.join(', ')} WHERE id = ? AND merchant_id = ?`,
    values
  );

  return { success: true, message: '内容更新成功' };
}

// ==================== 删除内容 ====================

export interface DeleteContentResult {
  success: boolean;
  message: string;
}

export function deleteContent(id: string, merchantId: string): DeleteContentResult {
  if (!id) {
    return { success: false, message: '内容ID不能为空' };
  }
  if (!merchantId) {
    return { success: false, message: '商家ID不能为空' };
  }

  // 1. 验证内容存在且属于该商家
  const existing = queryOne('SELECT id FROM Content WHERE id = ? AND merchant_id = ?', [id, merchantId]);
  if (!existing) {
    return { success: false, message: '内容不存在或无权限删除' };
  }

  // 2. 软删除（更新状态）
  execute(
    "UPDATE Content SET status = 'deleted', updated_at = datetime('now') WHERE id = ? AND merchant_id = ?",
    [id, merchantId]
  );

  return { success: true, message: '内容删除成功' };
}
