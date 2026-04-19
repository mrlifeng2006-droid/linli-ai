// utils/api.js —— 邻里AI 统一API请求工具（v2 路由已对齐后端）
// 自动检测环境：模拟器用localhost，真机用局域网IP
const isDevTools = wx.getSystemInfoSync().platform === 'devtools';
const API_BASE = isDevTools 
  ? 'http://localhost:3000/api/v1'
  : 'http://192.168.10.220:3000/api/v1';

/**
 * 统一请求封装
 * @param {string} path  - API路径
 * @param {string} method - GET|POST|PUT|DELETE
 * @param {object} data  - 请求体数据
 * @param {boolean} auth - 是否携带JWT（默认false）
 */
function request(path, method = 'GET', data = null, auth = false) {
  return new Promise((resolve, reject) => {
    const header = { 'Content-Type': 'application/json' };
    if (auth) {
      const token = wx.getStorageSync('token');
      if (token) header['Authorization'] = `Bearer ${token}`;
    }

    wx.request({
      url: API_BASE + path,
      method,
      header,
      data: data || undefined,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else if (res.statusCode === 401) {
          wx.removeStorageSync('token');
          wx.removeStorageSync('userInfo');
          wx.showToast({ title: '请先登录', icon: 'none' });
          setTimeout(() => wx.navigateTo({ url: '/pages/login/login' }), 1000);
          reject({ code: 401, message: '未登录' });
        } else {
          wx.showToast({ title: res.data?.message || '请求失败', icon: 'none' });
          reject(res.data);
        }
      },
      fail: (err) => {
        wx.showToast({ title: '网络错误，请检查后端服务', icon: 'none' });
        reject(err);
      }
    });
  });
}

// ===== 认证模块 =====
const auth = {
  // 发送验证码（_dev作为query参数）
  sendCode(phone, purpose = 'register') {
    return request('/user/send-code?_dev=1', 'POST', { phone, purpose });
  },
  // 注册
  register(phone, code) {
    return request('/user/register', 'POST', { phone, code });
  },
  // 登录
  login(phone, code) {
    return request('/user/login', 'POST', { phone, code });
  },
  // 获取用户资料
  getProfile() {
    return request('/user/profile', 'GET', null, true);
  },
  // 获取VIP状态
  getVipStatus() {
    return request('/user/vip-status', 'GET', null, true);
  },
};

// ===== 商家模块 =====
const merchant = {
  // 发送验证码
  sendCode(phone) {
    return request('/user/send-code?_dev=1', 'POST', { phone, purpose: 'merchant_register' });
  },
  // 个人商家注册（需先登录）
  registerPersonal(phone, code) {
    return request('/merchant/register/personal', 'POST', { phone, code }, true);
  },
  // 企业商家入驻（需先登录）
  registerEnterprise(data) {
    return request('/merchant/register/business', 'POST', data, true);
  },
  // 获取商家店铺信息（入驻信息）
  getProfile() {
    return request('/merchant/profile', 'GET', null, true);
  },
  // 更新商家店铺信息
  updateProfile(data) {
    return request('/merchant/profile', 'POST', data, true);
  },
  // 刷新地标
  refreshLandmarks() {
    return request('/merchant/landmarks/refresh', 'POST', null, true);
  },
  // 经营看板
  getDashboard() {
    return request('/merchant/stats', 'GET', null, true);
  },
  // GEO优化报告
  getGeoReport() {
    return request('/merchant/geo-report', 'GET', null, true);
  },
  // 店员邀请
  inviteStaff(phone, code) {
    return request('/merchant/staff/invite', 'POST', { phone, code }, true);
  },
  // 店员列表
  getStaffList() {
    return request('/merchant/staff/list', 'GET', null, true);
  },
};

// ===== AI生成模块 =====
const ai = {
  // 生成文案
  generate(data) {
    return request('/ai/generate', 'POST', data, true);
  },
  // 获取文案模板列表
  getTemplates() {
    return request('/ai/templates', 'GET', null, true);
  },
};

// ===== 内容分发模块 =====
const content = {
  // 创建内容
  create(data) {
    return request('/content/create', 'POST', data, true);
  },
  // 内容列表
  list(page = 1, pageSize = 10) {
    return request(`/content/list?page=${page}&pageSize=${pageSize}`, 'GET', null, true);
  },
  // 内容详情
  detail(id) {
    return request(`/content/detail/${id}`, 'GET', null, true);
  },
  // 更新内容
  update(id, data) {
    return request(`/content/update/${id}`, 'PUT', data, true);
  },
  // 删除内容
  remove(id) {
    return request(`/content/delete/${id}`, 'DELETE', null, true);
  },
};

// ===== 营销模块 =====
const campaign = {
  // 创建活动
  create(data) {
    return request('/campaign/create', 'POST', data, true);
  },
  // 更新活动
  update(id, data) {
    return request(`/campaign/update/${id}`, 'PUT', data, true);
  },
  // 删除活动
  remove(id) {
    return request(`/campaign/delete/${id}`, 'DELETE', null, true);
  },
  // 商家活动列表
  merchantList() {
    return request('/campaign/merchant/list', 'GET', null, true);
  },
  // 商家活动详情
  merchantDetail(id) {
    return request(`/campaign/merchant/detail/${id}`, 'GET', null, true);
  },
  // 用户活动列表
  list(page = 1, pageSize = 10) {
    return request(`/campaign/list?page=${page}&pageSize=${pageSize}`, 'GET', null, true);
  },
  // 用户活动详情
  detail(id) {
    return request(`/campaign/detail/${id}`, 'GET', null, true);
  },
  // 参与活动（砍价/秒杀）
  join(campaignId) {
    return request('/campaign/join', 'POST', { campaign_id: campaignId }, true);
  },
  // 参团
  joinGroup(groupSessionId) {
    return request('/campaign/join-group', 'POST', { group_session_id: groupSessionId }, true);
  },
  // 砍价助力
  bargainHelp(participationId) {
    return request('/campaign/bargain-help', 'POST', { participation_id: participationId }, true);
  },
  // 参与详情
  participationDetail(campaignId) {
    return request(`/campaign/participation/${campaignId}`, 'GET', null, true);
  },
  // 秒杀抢购
  seckill(campaignId) {
    return request('/campaign/join', 'POST', { campaign_id: campaignId }, true);
  },
  // 我的券包
  myVouchers() {
    return request('/campaign/vouchers', 'GET', null, true);
  },
  // 券码详情
  voucherDetail(code) {
    return request(`/campaign/voucher/${code}`, 'GET', null, true);
  },
  // 店员核销
  verify(code, staffId) {
    return request('/campaign/verify', 'POST', { code, staff_id: staffId }, true);
  },
  // 分享埋点
  share(campaignId) {
    return request('/campaign/share', 'POST', { campaign_id: campaignId }, true);
  },
};

module.exports = {
  API_BASE,
  request,
  auth,
  merchant,
  ai,
  content,
  campaign,
  distribution: {
    // 获取平台列表
    getPlatforms() {
      return request('/distribution/platforms', 'GET');
    },
    // 发布内容
    publish(data) {
      return request('/distribution/publish', 'POST', data, true);
    },
    // 分发历史
    history(page = 1, pageSize = 20) {
      return request(`/distribution/history?page=${page}&pageSize=${pageSize}`, 'GET', null, true);
    },
    // 平台统计
    stats() {
      return request('/distribution/stats', 'GET', null, true);
    },
  },
};
