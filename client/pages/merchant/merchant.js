// pages/merchant/merchant.js —— 商家入驻/管理页
const api = require('../../utils/api.js');

Page({
  data: {
    // 商家入驻表单
    formData: {
      phone: '',
      store_name: '',
      city: '深圳市',
      district: '',
      location_text: '',
      location_lat: 0,
      location_lng: 0,
      industry_cat: '餐饮美食',
    },

    // 商家信息
    merchantInfo: null,
    stats: null,
    geoReport: null,

    // 状态
    isMerchant: false,
    isLoading: false,
    isRegistering: false,

    // 行业列表
    industryList: [
      '餐饮美食', '便利超市', '水果生鲜', '美容美发',
      '休闲娱乐', '教育培训', '医疗健康', '服装鞋帽',
      '家居建材', '汽车服务', '其他'
    ],
    industryIndex: 0,
    industryName: '请选择行业',

    // tab
    activeTab: 'info',
    tabs: [
      { key: 'info', label: '商家信息' },
      { key: 'stats', label: '经营数据' },
      { key: 'staff', label: '店员管理' },
    ],
  },

  onLoad() {
    this.checkMerchantStatus();
  },

  onShow() {
    // 每次进入刷新数据
    if (this.data.isMerchant) {
      this.loadMerchantData();
    }
  },

  // ========== 初始化带默认值的安全数据 ==========
  getSafeStats(stats) {
    return {
      total_views: stats ? (stats.total_views || 0) : 0,
      total_clicks: stats ? (stats.total_clicks || 0) : 0,
      total_shares: stats ? (stats.total_shares || 0) : 0,
      total_content: stats ? (stats.total_content || 0) : 0,
      conversion_rate: stats ? (stats.conversion_rate || '0%') : '0%',
    };
  },

  getSafeGeoReport(report) {
    return {
      geoCoverage: report ? (report.geoCoverage || 0) : 0,
      landmarkCount: report ? (report.landmarkCount || 0) : 0,
      estExposure: report ? (report.estExposure || 0) : 0,
    };
  },

  getSafeMerchantInfo(info) {
    return {
      store_name: info ? (info.store_name || '我的商家') : '我的商家',
      industry_cat: info ? (info.industry_cat || '餐饮美食') : '餐饮美食',
      city: info ? (info.city || '-') : '-',
      location_text: info ? (info.location_text || '-') : '-',
      nickname: info ? (info.nickname || '我的商家') : '我的商家',
    };
  },

  // 检查商家状态
  async checkMerchantStatus() {
    this.setData({ isLoading: true });
    try {
      const res = await api.request('/merchant/info', 'GET', null, true);
      if (res.code === 0 && res.data) {
        this.setData({ isMerchant: true, merchantInfo: this.getSafeMerchantInfo(res.data), isLoading: false });
        this.loadMerchantData();
      } else {
        this.setData({ isMerchant: false, isLoading: false });
      }
    } catch (err) {
      this.setData({ isMerchant: false, isLoading: false });
    }
  },

  // 加载商家数据
  async loadMerchantData() {
    const promises = [
      api.request('/merchant/info', 'GET', null, true).catch(() => null),
      api.request('/merchant/stats', 'GET', null, true).catch(() => null),
      api.request('/merchant/geo-report', 'GET', null, true).catch(() => null),
    ];
    const [infoRes, statsRes, geoRes] = await Promise.all(promises);
    this.setData({
      merchantInfo: infoRes && infoRes.code === 0 ? this.getSafeMerchantInfo(infoRes.data) : this.getSafeMerchantInfo(null),
      stats: statsRes && statsRes.code === 0 ? this.getSafeStats(statsRes.data) : this.getSafeStats(null),
      geoReport: geoRes && geoRes.code === 0 ? this.getSafeGeoReport(geoRes.data) : this.getSafeGeoReport(null),
    });
  },

  // ========== 入驻表单 ==========

  onStoreNameInput(e) {
    this.setData({ 'formData.store_name': e.detail.value });
  },

  onLocationTextInput(e) {
    this.setData({ 'formData.location_text': e.detail.value });
  },

  onIndustryChange(e) {
    const idx = parseInt(e.detail.value);
    this.setData({
      industryIndex: idx,
      industryName: this.data.industryList[idx] || '请选择行业',
      'formData.industry_cat': this.data.industryList[idx],
    });
  },

  onCityChange(e) {
    this.setData({ 'formData.city': e.detail.value });
  },

  onDistrictChange(e) {
    this.setData({ 'formData.district': e.detail.value });
  },

  // 获取当前位置
  onGetLocation() {
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        this.setData({
          'formData.location_lat': res.latitude,
          'formData.location_lng': res.longitude,
        });
        wx.showToast({ title: '定位成功', icon: 'success' });
      },
      fail: () => {
        wx.showToast({ title: '请开启位置权限', icon: 'none' });
      },
    });
  },

  // 提交个人入驻
  async onRegisterPersonal() {
    const { store_name, city, district, location_text, location_lat, location_lng, industry_cat } = this.data.formData;
    if (!store_name) {
      wx.showToast({ title: '请填写店铺名称', icon: 'none' });
      return;
    }
    if (!city) {
      wx.showToast({ title: '请选择城市', icon: 'none' });
      return;
    }

    this.setData({ isRegistering: true });
    try {
      // 先检查手机号
      const phone = wx.getStorageSync('phone') || '';
      const res = await api.request('/merchant/register/personal', 'POST', {
        phone,
        store_name,
        city,
        district: district || '',
        location_text: location_text || '',
        location_lat,
        location_lng,
        industry_cat,
      }, true);

      if (res.code === 0) {
        wx.showToast({ title: '入驻成功', icon: 'success' });
        setTimeout(() => {
          this.setData({ isMerchant: true });
          this.checkMerchantStatus();
        }, 1500);
      } else {
        wx.showToast({ title: res.message || '入驻失败', icon: 'none' });
      }
    } catch (err) {
      wx.showToast({ title: '网络错误', icon: 'none' });
    } finally {
      this.setData({ isRegistering: false });
    }
  },

  // ========== 经营看板 ==========

  async onRefreshStats() {
    await this.loadMerchantData();
    wx.showToast({ title: '已刷新', icon: 'success' });
  },

  // ========== 店员管理 ==========

  async onInviteStaff() {
    wx.showModal({
      title: '邀请店员',
      content: '店员可通过商家码扫码入驻，每个商家最多10名店员',
      confirmText: '生成邀请码',
      success: async (res) => {
        if (res.confirm) {
          try {
            const r = await api.request('/merchant/staff/invite', 'POST', {}, true);
            if (r.code === 0 && r.data) {
              wx.showModal({
                title: '邀请码',
                content: '邀请码：' + r.data.invite_code + '\n让店员扫码即可入驻',
                showCancel: false,
              });
            } else {
              wx.showToast({ title: r.message || '生成失败', icon: 'none' });
            }
          } catch (err) {
            wx.showToast({ title: '网络错误', icon: 'none' });
          }
        }
      },
    });
  },

  // ========== tab切换 ==========

  onTabChange(e) {
    this.setData({ activeTab: e.currentTarget.dataset.tab });
  },

  // ========== 跳转到营销页 ==========
  goToMarketing() {
    wx.switchTab({ url: '/pages/marketing/marketing' });
  },

  // ========== GEO刷新 ==========
  async onRefreshGeo() {
    const { location_lat, location_lng } = this.data.formData;
    if (!location_lat || !location_lng) {
      wx.showToast({ title: '请先获取位置', icon: 'none' });
      return;
    }
    try {
      const res = await api.request('/merchant/landmarks/refresh', 'POST', {
        lat: location_lat,
        lng: location_lng,
      }, true);
      if (res.code === 0) {
        wx.showToast({ title: 'GEO已刷新', icon: 'success' });
        this.loadMerchantData();
      } else {
        wx.showToast({ title: res.message || '刷新失败', icon: 'none' });
      }
    } catch (err) {
      wx.showToast({ title: '网络错误', icon: 'none' });
    }
  },
});
