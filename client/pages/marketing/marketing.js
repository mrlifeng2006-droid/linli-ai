// pages/marketing/marketing.js
Page({
  data: {
    activities: [],
    geoData: {
      local曝光: 0,
      自然曝光: 0,
      互动: 0,
    },
  },

  onLoad() {},

  goToActivity() { wx.showToast({ title: '功能开发中', icon: 'none' }); },
  goToPoster() { wx.showToast({ title: '功能开发中', icon: 'none' }); },
  goToDistribution() { wx.switchTab({ url: '/pages/distribution/distribution' }); },
  goToGroup() { wx.showToast({ title: '功能开发中', icon: 'none' }); },
  goToAnalysis() { wx.showToast({ title: '功能开发中', icon: 'none' }); },
  goToTemplate() { wx.showToast({ title: '功能开发中', icon: 'none' }); },
});
