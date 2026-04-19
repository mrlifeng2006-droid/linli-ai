/**
 * 邻里AI V17.0 - 小程序入口
 */
App({
  globalData: {
    userInfo: null,
    token: '',
    apiBase: 'http://localhost:3000/api/v1',
  },

  onLaunch() {
    // 检查登录态
    const token = wx.getStorageSync('token');
    if (token) {
      this.globalData.token = token;
    }
    console.log('邻里AI V17.0 启动', new Date().toLocaleString('zh-CN'));
  },
});
