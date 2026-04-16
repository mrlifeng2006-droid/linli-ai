// pages/home/home.js
Page({
  data: {},

  onLoad(options) {},

  // 跳转到AI生成
  goToAI() {
    wx.switchTab({ url: '/pages/generate/generate' });
  },

  // 跳转到商家列表
  goToMerchant() {
    wx.navigateTo({ url: '/pages/merchant/merchant' });
  },

  // 跳转到营销
  goToMarketing() {
    wx.switchTab({ url: '/pages/marketing/marketing' });
  },

  // 跳转到内容分发
  goToDistribution() {
    wx.navigateTo({ url: '/pages/distribution/distribution' });
  },
});
