/**
 * 用户服务 - 登录注册核心逻辑
 */
import { query, queryOne, execute } from '../../core/database/index.js';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

// 简单的6位数字验证码生成
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// 验证码有效期（分钟）
const CODE_EXPIRE_MINUTES = 10;

// ==================== 发送验证码 ====================

export interface SendCodeResult {
  success: boolean;
  message: string;
  // 开发环境返回验证码方便测试
  code?: string;
}

export async function sendCode(phone: string, purpose: 'login' | 'register' | 'bind_phone'): Promise<SendCodeResult> {
  // 1. 基础验证
  const phoneRegex = /^1[3-9]\d{9}$/;
  if (!phoneRegex.test(phone)) {
    return { success: false, message: '手机号格式不正确' };
  }

  // 2. 检查是否已注册（register 用途时）
  if (purpose === 'register') {
    const existing = queryOne('SELECT id FROM Merchant WHERE phone = ?', [phone]);
    if (existing) {
      return { success: false, message: '该手机号已注册，请直接登录' };
    }
  }

  // 3. 检查是否登录过但未绑定手机（login 用途时）
  if (purpose === 'login') {
    const existing = queryOne('SELECT id FROM Merchant WHERE phone = ?', [phone]);
    if (!existing) {
      return { success: false, message: '该手机号未注册，请先注册' };
    }
  }

  // 4. 防刷：同一手机每分钟只能发一次
  const recent = queryOne(
    `SELECT id FROM SMS_Code WHERE phone = ? AND purpose = ? AND created_at > datetime('now', '-1 minute') AND used = 0`,
    [phone, purpose]
  );
  if (recent) {
    return { success: false, message: '发送太频繁，请稍后再试' };
  }

  // 5. 生成验证码（开发环境直接返回，生产环境调用短信API）
  const code = generateCode();
  const expiredAt = new Date(Date.now() + CODE_EXPIRE_MINUTES * 60 * 1000).toISOString();
  const id = uuidv4();

  execute(
    `INSERT INTO SMS_Code (id, phone, code, purpose, expired_at) VALUES (?, ?, ?, ?, ?)`,
    [id, phone, code, purpose, expiredAt]
  );

  // 6. TODO: 生产环境调用腾讯云短信/阿里云短信
  // await sendSMS(phone, code);

  console.log(`  📱 发送验证码: ${phone} → ${code} (${purpose})`);

  return {
    success: true,
    message: '验证码已发送',
    // 开发环境返回验证码方便测试
    code: code,
  };
}

// ==================== 注册 ====================

export interface RegisterResult {
  success: boolean;
  message: string;
  data?: {
    token: string;
    merchantId: string;
    isNewUser: boolean;
    profile: {
      id: string;
      phone: string;
      nickname: string;
      memberTier: string;
    };
  };
}

export async function register(phone: string, code: string): Promise<RegisterResult> {
  // 1. 验证手机号格式
  const phoneRegex = /^1[3-9]\d{9}$/;
  if (!phoneRegex.test(phone)) {
    return { success: false, message: '手机号格式不正确' };
  }

  // 2. 验证验证码
  const codeRecord = queryOne(
    `SELECT * FROM SMS_Code WHERE phone = ? AND purpose = 'register' AND used = 0 AND expired_at > datetime('now') ORDER BY created_at DESC LIMIT 1`,
    [phone]
  );

  if (!codeRecord) {
    return { success: false, message: '验证码已失效，请重新获取' };
  }
  if (codeRecord.code !== code) {
    return { success: false, message: '验证码错误' };
  }

  // 3. 标记验证码已使用
  execute(`UPDATE SMS_Code SET used = 1 WHERE id = ?`, [codeRecord.id]);

  // 4. 检查是否重复注册
  const existing = queryOne('SELECT id FROM Merchant WHERE phone = ?', [phone]);
  if (existing) {
    return { success: false, message: '该手机号已注册' };
  }

  // 5. 创建商户记录
  const merchantId = uuidv4();
  const nickname = `邻里用户${phone.slice(-4)}`;

  execute(
    `INSERT INTO Merchant (id, phone, nickname, auth_status, member_tier, status, last_login_at)
     VALUES (?, ?, ?, 'pending', 'free', 'active', datetime('now'))`,
    [merchantId, phone, nickname]
  );

  // 6. 创建商户资料（Profile）
  const profileId = uuidv4();
  execute(
    `INSERT INTO Merchant_Profile (id, merchant_id, store_name, contact_name, phone_number)
     VALUES (?, ?, ?, ?, ?)`,
    [profileId, merchantId, nickname, nickname, phone]
  );

  // 7. 生成 JWT token
  const { signToken } = require('./auth.service.js');
  const token = signToken(merchantId);

  return {
    success: true,
    message: '注册成功',
    data: {
      token,
      merchantId,
      isNewUser: true,
      profile: {
        id: merchantId,
        phone,
        nickname,
        memberTier: 'free',
      },
    },
  };
}

// ==================== 登录 ====================

export interface LoginResult {
  success: boolean;
  message: string;
  data?: {
    token: string;
    merchantId: string;
    isNewUser: boolean;
    profile: {
      id: string;
      phone: string;
      nickname: string;
      memberTier: string;
      storeName?: string;
    };
  };
}

export async function login(phone: string, code: string, openid?: string): Promise<LoginResult> {
  // 1. 验证手机号格式
  const phoneRegex = /^1[3-9]\d{9}$/;
  if (!phoneRegex.test(phone)) {
    return { success: false, message: '手机号格式不正确' };
  }

  // 2. 验证验证码
  const codeRecord = queryOne(
    `SELECT * FROM SMS_Code WHERE phone = ? AND purpose = 'login' AND used = 0 AND expired_at > datetime('now') ORDER BY created_at DESC LIMIT 1`,
    [phone]
  );

  if (!codeRecord) {
    return { success: false, message: '验证码已失效，请重新获取' };
  }
  if (codeRecord.code !== code) {
    return { success: false, message: '验证码错误' };
  }

  // 3. 标记验证码已使用
  execute(`UPDATE SMS_Code SET used = 1 WHERE id = ?`, [codeRecord.id]);

  // 4. 查找商户
  let merchant = queryOne('SELECT * FROM Merchant WHERE phone = ?', [phone]);
  let isNewUser = false;

  // 如果没有手机号但有 openid，先绑定手机号
  if (!merchant && openid) {
    // 查找 openid 对应的临时账户
    const wechatBind = queryOne('SELECT merchant_id FROM Wechat_Bind WHERE openid = ?', [openid]);
    if (wechatBind) {
      // 绑定手机号
      execute('UPDATE Merchant SET phone = ?, last_login_at = datetime(\'now\') WHERE id = ?', [phone, wechatBind.merchant_id]);
      merchant = queryOne('SELECT * FROM Merchant WHERE id = ?', [wechatBind.merchant_id]);
    }
  }

  if (!merchant) {
    return { success: false, message: '该手机号未注册，请先注册' };
  }

  // 5. 更新登录时间
  execute("UPDATE Merchant SET last_login_at = datetime('now') WHERE id = ?", [merchant.id]);

  // 6. 生成 JWT token
  const { signToken } = require('./auth.service.js');
  const token = signToken(merchant.id);

  // 7. 获取 Profile
  const profile = queryOne('SELECT store_name FROM Merchant_Profile WHERE merchant_id = ?', [merchant.id]);

  return {
    success: true,
    message: '登录成功',
    data: {
      token,
      merchantId: merchant.id,
      isNewUser,
      profile: {
        id: merchant.id,
        phone: merchant.phone,
        nickname: merchant.nickname,
        memberTier: merchant.member_tier,
        storeName: profile?.store_name,
      },
    },
  };
}

// ==================== 微信小程序登录（静默登录） ====================

export interface WechatLoginResult {
  success: boolean;
  message: string;
  data?: {
    token: string;
    merchantId: string;
    needBindPhone: boolean;
    profile?: {
      id: string;
      phone?: string;
      nickname: string;
      memberTier: string;
    };
  };
}

export async function wechatLogin(code: string, appid: string, secret: string): Promise<WechatLoginResult> {
  // 1. 调用微信 API 换取 openid
  const wxUrl = `https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${secret}&js_code=${code}&grant_type=authorization_code`;

  let wxResult: any;
  try {
    const res = await fetch(wxUrl);
    wxResult = await res.json();
  } catch (err: any) {
    return { success: false, message: '微信服务器通信失败' };
  }

  if (wxResult.errcode) {
    return { success: false, message: `微信错误: ${wxResult.errmsg}` };
  }

  const { openid, unionid } = wxResult;

  // 2. 查找是否已绑定
  const wechatBind = queryOne('SELECT merchant_id FROM Wechat_Bind WHERE openid = ? AND platform = ?', [openid, 'miniapp']);

  if (wechatBind) {
    // 已绑定，直接登录
    execute("UPDATE Merchant SET last_login_at = datetime('now') WHERE id = ?", [wechatBind.merchant_id]);

    const merchant = queryOne('SELECT * FROM Merchant WHERE id = ?', [wechatBind.merchant_id]);
    const profile = queryOne('SELECT store_name FROM Merchant_Profile WHERE merchant_id = ?', [wechatBind.merchant_id]);
    const { signToken } = require('./auth.service.js');
    const token = signToken(merchant.id);

    return {
      success: true,
      message: '登录成功',
      data: {
        token,
        merchantId: merchant.id,
        needBindPhone: !merchant.phone,
        profile: {
          id: merchant.id,
          phone: merchant.phone || undefined,
          nickname: merchant.nickname,
          memberTier: merchant.member_tier,
        },
      },
    };
  }

  // 3. 未绑定，检查是否有 unionid 对应的账号
  let merchantId: string;
  if (unionid) {
    const existing = queryOne('SELECT merchant_id FROM Wechat_Bind WHERE unionid = ?', [unionid]);
    if (existing) {
      // 绑定 openid 到已有账号
      const newId = uuidv4();
      execute('INSERT INTO Wechat_Bind (id, merchant_id, openid, unionid, platform) VALUES (?, ?, ?, ?, ?)',
        [newId, existing.merchant_id, openid, unionid, 'miniapp']);
      execute("UPDATE Merchant SET last_login_at = datetime('now') WHERE id = ?", [existing.merchant_id]);
      const { signToken } = require('./auth.service.js');
      const token = signToken(existing.merchant_id);
      const merchant = queryOne('SELECT * FROM Merchant WHERE id = ?', [existing.merchant_id]);
      return {
        success: true,
        message: '登录成功',
        data: { token, merchantId: existing.merchant_id, needBindPhone: !merchant.phone },
      };
    }
  }

  // 4. 新用户：创建临时账号
  merchantId = uuidv4();
  const nickname = `邻里用户${Math.floor(1000 + Math.random() * 9000)}`;

  execute(
    `INSERT INTO Merchant (id, nickname, auth_status, member_tier, status, last_login_at) VALUES (?, ?, 'pending', 'free', 'active', datetime('now'))`,
    [merchantId, nickname]
  );

  const profileId = uuidv4();
  execute('INSERT INTO Merchant_Profile (id, merchant_id, store_name) VALUES (?, ?, ?)', [profileId, merchantId, nickname]);

  const wechatBindId = uuidv4();
  execute(
    'INSERT INTO Wechat_Bind (id, merchant_id, openid, unionid, platform) VALUES (?, ?, ?, ?, ?)',
    [wechatBindId, merchantId, openid, unionid || null, 'miniapp']
  );

  const { signToken } = require('./auth.service.js');
  const token = signToken(merchantId);

  return {
    success: true,
    message: '新用户创建成功，请绑定手机号',
    data: {
      token,
      merchantId,
      needBindPhone: true,
    },
  };
}
