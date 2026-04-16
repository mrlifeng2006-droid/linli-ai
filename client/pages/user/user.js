// pages/user/user.js —— 2026-04-17 Echo 重构版
const api = require('../../utils/api.js');

Page({
  data: {
    isLogin: false,
    isVip: false,
    username: '',
    phone: '',
    isMerchant: false,
    points: 0,
    contentCount: 0,
    favorites: 0,
    browseCount: 0,
    merchantStatus: '', // pending/active/rejected
  },

  onShow() {
    const token = wx.getStorageSync('userInfo');
    if (token) {
      this.setData({ isLogin: true });
    } else {
      this.setData({ isLogin: false });
    }
    this.loadProfile();
  },

  async loadProfile() {
    try {
      const [profileRes, vipRes] = await Promise.all([
        api.auth.getProfile(),
        api.auth.getVipStatus(),
      ]);

      if (profileRes.code === 0) {
        const user = profileRes.data;
        this.setData({
          isLogin: true,
          username: user.nickname || user.phone || '用户',
          phone: user.phone,
          isVip: user.isVip || vipRes.data?.isVip || false,
          isMerchant: user.isMerchant || false,
          merchantStatus: user.merchantStatus || '',
          points: user.points || 0,
          contentCount: user.contentCount || 0,
          favorites: user.favorites || 0,
          browseCount: user.browseCount || 0,
        });
      }
    } catch (e) {
      // 未登录时忽略
    }
  },

  goToLogin() {
    wx.navigateTo({ url: '/pages/login/login' });
  },

  goToHistory() {
    wx.showToast({ title: '功能开发中', icon: 'none' });
  },

  goToFavorites() {
    wx.showToast({ title: '功能开发中', icon: 'none' });
  },

  goToTemplates() {
    wx.showToast({ title: '功能开发中', icon: 'none' });
  },

  goToMyMerchant() {
    if (!this.data.isMerchant) {
      // 未入驻商家，跳转到商家入驻
      wx.navigateTo({ url: '/pages/merchant/merchant' });
    } else {
      // 已入驻，跳转到商家后台
      wx.navigateTo({ url: '/pages/merchant/merchant' });
    }
  },

  goToSettings() {
    wx.showToast({ title: '功能开发中', icon: 'none' });
  },

  goToAbout() {
    wx.showModal({
      title: '关于我们',
      content: '邻里AI V17.0\n本地商家AI营销利器\n\n© 2026 邻里AI团队',
      showCancel: false,
    });
  },

  onLogout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出当前账号吗？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('token');
          wx.removeStorageSync('userInfo');
          this.setData({
            isLogin: false,
            isVip: false,
            isMerchant: false,
            username: '',
            phone: '',
            points: 0,
            contentCount: 0,
            favorites: 0,
            browseCount: 0,
          });
          wx.showToast({ title: '已退出登录', icon: 'success' });
        }
      }
    });
  },
});
