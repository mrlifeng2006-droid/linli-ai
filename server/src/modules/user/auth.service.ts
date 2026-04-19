/**
 * 鉴权服务 - JWT Token 生成与验证
 */
import jwt from 'jsonwebtoken';
import { config } from '../../core/config/index';
import { queryOne } from '../../core/database/index';

export interface TokenPayload {
  merchantId: string;
  iat: number;
  exp: number;
}

/** 生成 JWT Token */
export function signToken(merchantId: string): string {
  return jwt.sign({ merchantId }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn as string,
  } as any);
}

/** 验证 JWT Token，返回 payload 或 null */
export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, config.jwt.secret) as TokenPayload;
  } catch {
    return null;
  }
}

/** 从请求头提取 Bearer Token */
export function extractToken(ctx: any): string | null {
  const auth = ctx.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;
  return auth.slice(7);
}

/** 从 Token 获取当前登录商户ID（未找到返回 null） */
export function getCurrentMerchantId(ctx: any): string | null {
  const token = extractToken(ctx);
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;

  // 验证商户是否存在
  const merchant = queryOne('SELECT id FROM Merchant WHERE id = ? AND status = ?', [payload.merchantId, 'active']);
  if (!merchant) return null;

  return payload.merchantId;
}

/** 需要登录的中间件（Koa） */
export function requireAuth() {
  return async (ctx: any, next: any) => {
    const merchantId = getCurrentMerchantId(ctx);
    if (!merchantId) {
      ctx.status = 401;
      ctx.body = { code: 401, message: '请先登录' };
      return;
    }
    ctx.state.merchantId = merchantId;
    await next();
  };
}
