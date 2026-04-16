/**
 * 邻里AI V17.0 - 小程序入口
 */
App<IAppOption>({
  globalData: {
    userInfo: null,
    token: '',
    apiBase: 'http://localhost:3000/api/v1',
    // apiBase: 'https://your-domain.com/api/v1', // 生产环境
  },

  onLaunch() {
    // 检查登录态
    const token = wx.getStorageSync('token');
    if (token) {
      (this.globalData as any).token = token;
    }
    console.log('邻里AI V17.0 启动', new Date().toLocaleString('zh-CN'));
  },
});
