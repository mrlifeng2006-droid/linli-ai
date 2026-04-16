/**
 * 首页
 */
Page({
  data: {
    location: '定位中...',
    banners: [
      { id: 1, imageUrl: '/static/banner1.png' },
      { id: 2, imageUrl: '/static/banner2.png' },
    ],
    entries: [
      { id: 'merchant', name: '商家入驻', icon: '🏪', bgColor: '#FFF3E0' },
      { id: 'generate', name: 'AI生成', icon: '🎬', bgColor: '#E8F5E9' },
      { id: 'marketing', name: '营销工具', icon: '🎁', bgColor: '#E3F2FD' },
      { id: 'distribution', name: '内容分发', icon: '📤', bgColor: '#F3E5F5' },
    ],
    merchants: [] as any[],
  },

  onLoad() {
    this.getLocation();
    this.loadBanners();
    this.loadMerchants();
  },

  onShow() {
    // 刷新数据
  },

  /** 获取位置 */
  getLocation() {
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        this.setData({ location: '附近商家' });
        // TODO: 调用逆地理编码API获取具体地址
      },
      fail: () => {
        this.setData({ location: '全国' });
      },
    });
  },

  /** 加载轮播图 */
  loadBanners() {
    // TODO: 从API获取
  },

  /** 加载商家列表 */
  loadMerchants() {
    // TODO: 从API获取附近商家
    // 暂时显示空状态
    this.setData({ merchants: [] });
  },

  /** 搜索点击 */
  onSearchTap() {
    wx.showToast({ title: '搜索功能开发中', icon: 'none' });
  },

  /** 定位点击 */
  onLocationTap() {
    wx.showToast({ title: '定位功能开发中', icon: 'none' });
  },

  /** 功能入口点击 */
  onEntryTap(e: any) {
    const id = e.currentTarget.dataset.id;
    const pages: Record<string, string> = {
      merchant: '/pages/merchant/merchant',
      generate: '/pages/generate/generate',
      marketing: '/pages/marketing/marketing',
      distribution: '/pages/distribution/distribution',
    };
    if (pages[id]) {
      wx.navigateTo({ url: pages[id] });
    }
  },

  /** 商家点击 */
  onMerchantTap(e: any) {
    wx.navigateTo({ url: `/pages/merchant/merchant?id=${e.currentTarget.dataset.id}` });
  },

  /** 更多商家 */
  onMoreMerchant() {
    wx.showToast({ title: '商家列表开发中', icon: 'none' });
  },

  /** AI生成入口 */
  onGenerateTap() {
    wx.switchTab({ url: '/pages/generate/generate' });
  },
});
