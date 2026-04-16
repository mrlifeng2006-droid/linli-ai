// pages/user/user.js
const app = getApp();

Page({
  data: {
    isLogin: false,
    username: '',
    isVip: false,
    isMerchant: false,
    points: 0,
    contentCount: 0,
    favorites: 0,
    browseCount: 0,
  },

  onShow() {
    const token = wx.getStorageSync('token');
    if (token) {
      this.setData({
        isLogin: true,
        username: wx.getStorageSync('username') || '用户',
        isVip: wx.getStorageSync('isVip') || false,
        isMerchant: wx.getStorageSync('isMerchant') || false,
        points: wx.getStorageSync('points') || 0,
        contentCount: wx.getStorageSync('contentCount') || 0,
        favorites: wx.getStorageSync('favorites') || 0,
        browseCount: wx.getStorageSync('browseCount') || 0,
      });
    } else {
      this.setData({
        isLogin: false,
        username: '',
        isVip: false,
        isMerchant: false,
        points: 0,
        contentCount: 0,
        favorites: 0,
        browseCount: 0,
      });
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
    wx.navigateTo({ url: '/pages/merchant/merchant' });
  },
  goToSettings() {
    wx.showToast({ title: '功能开发中', icon: 'none' });
  },
  goToAbout() {
    wx.showToast({ title: '功能开发中', icon: 'none' });
  },
  onLogout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          wx.clearStorageSync();
          this.setData({
            isLogin: false,
            username: '',
            isVip: false,
            isMerchant: false,
            points: 0,
            contentCount: 0,
            favorites: 0,
            browseCount: 0,
          });
          wx.showToast({ title: '已退出', icon: 'success' });
        }
      },
    });
  },
});
