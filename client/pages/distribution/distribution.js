// pages/distribution/distribution.js
const api = require('../../utils/api.js');

Page({
  data: {
    // 从result页传来的内容
    shopName: '',
    results: [],

    // 当前选中的平台
    selectedPlatform: 'friend_circle',
    selectedPlatformName: '朋友圈',
    selectedPlatformColor: '#07C160',
    copyStatus: '',

    // 当前选中平台内容的字数
    formatContentLength: 0,

    // 分发历史
    history: [],
    historyPage: 1,
    historyLoading: false,
    historyHasMore: true,

    // 平台列表
    platforms: [
      { key: 'friend_circle', name: '朋友圈', icon: '🖼️', maxChars: 500, supportGeo: true, color: '#07C160', tip: '加#同城标签更易被附近的人看到' },
      { key: 'wechat_friend', name: '微信好友', icon: '👥', maxChars: 500, supportGeo: false, color: '#07C160', tip: '可直接粘贴发送' },
      { key: 'douyin', name: '抖音', icon: '🎵', maxChars: 2000, supportGeo: true, color: '#00F2EA', tip: '加入位置可增加同城曝光' },
      { key: 'xiaohongshu', name: '小红书', icon: '📕', maxChars: 1000, supportGeo: true, color: '#FF2442', tip: '图片+文案配合，曝光效果更好' },
      { key: 'weibo', name: '微博', icon: '🌐', maxChars: 2000, supportGeo: true, color: '#E6162D', tip: '添加话题标签增加曝光' },
      { key: 'short_video', name: '视频号', icon: '🎬', maxChars: 200, supportGeo: true, color: '#07C160', tip: '文案简洁有力，配合视频更佳' },
    ],

    // 平台映射（key→平台对象，用于WXML简单查找）
    platformMap: {
      friend_circle: { name: '朋友圈', icon: '🖼️', color: '#07C160' },
      wechat_friend: { name: '微信好友', icon: '👥', color: '#07C160' },
      douyin: { name: '抖音', icon: '🎵', color: '#00F2EA' },
      xiaohongshu: { name: '小红书', icon: '📕', color: '#FF2442' },
      weibo: { name: '微博', icon: '🌐', color: '#E6162D' },
      short_video: { name: '视频号', icon: '🎬', color: '#07C160' },
    },

    // Tab
    activeTab: 'publish',
    tabs: [
      { key: 'publish', label: '发布内容' },
      { key: 'history', label: '分发记录' },
    ],
  },

  onLoad(options) {
    try {
      const raw = decodeURIComponent(options.data || '{}');
      const parsed = JSON.parse(raw);
      this.setData({
        shopName: parsed.shopName || '',
        results: parsed.results || [],
      });
    } catch (err) {
      console.error('解析分发数据失败:', err);
    }
    this.loadHistory();
    this.updateContentLength();
  },

  // ========== Tab切换 ==========
  onTabChange(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ activeTab: tab });
    if (tab === 'history' && this.data.history.length === 0) {
      this.loadHistory();
    }
  },

  // ========== 选中平台 ==========
  onSelectPlatform(e) {
    const platform = e.currentTarget.dataset.platform;
    const platformInfo = this.data.platforms.find(p => p.key === platform);
    this.setData({
      selectedPlatform: platform,
      selectedPlatformName: platformInfo ? platformInfo.name : platform,
      selectedPlatformColor: platformInfo ? platformInfo.color : '#eee',
      copyStatus: ''
    });
    this.updateContentLength();
  },

  updateContentLength() {
    const item = this.getSelectedContent();
    if (!item) {
      this.setData({ formatContentLength: 0 });
      return;
    }
    const text = this.formatContentForPlatform(this.data.selectedPlatform, item);
    this.setData({ formatContentLength: text.length });
  },

  // ========== 获取当前要分发的内容 ==========
  getSelectedContent() {
    const { results } = this.data;
    if (results.length === 0) return null;
    // 默认选第一条
    return results[0];
  },

  // ========== 格式化平台内容 ==========
  formatContentForPlatform(platform, item) {
    if (!item) return '';
    let text = item.displayContent || item.content || '';

    // 去掉顶部分隔符
    text = text.replace(/^=+\s*/gm, '').trim();

    const hashtags = item.hashtags || '';

    // 平台特定处理
    switch (platform) {
      case 'friend_circle':
        // 朋友圈：文案+标签+店名
        return `${text}\n\n${hashtags ? hashtags + '\n' : ''}📍 {{店铺位置}}\n🏪 ${this.data.shopName}`;

      case 'douyin':
        // 抖音：话题+文案+店名
        return `${hashtags ? hashtags + '\n' : ''}\n${text}\n\n🏪 {{店铺名称}}\n📍 {{店铺位置}}`;

      case 'xiaohongshu':
        // 小红书：emoji装饰+正文+标签
        const emoji = '✨';
        return `${emoji} ${text} ${emoji}\n\n${hashtags ? hashtags + '\n\n' : ''}📍 {{店铺位置}}\n🏪 {{店铺名称}}`;

      case 'weibo':
        // 微博：话题格式
        return `${hashtags ? hashtags + '\n\n' : ''}${text}\n\n🏪 {{店铺名称}}\n📍 {{店铺位置}}`;

      case 'short_video':
        // 视频号：简短有力
        return `${text}\n\n${hashtags ? hashtags + '\n' : ''}📍 {{店铺位置}}`;

      case 'wechat_friend':
      default:
        // 微信好友：直接发送格式
        return `${text}\n\n${hashtags ? hashtags + '\n' : ''}🏪 ${this.data.shopName}`;
    }
  },

  // ========== 复制并发布 ==========
  async onCopyAndPublish(e) {
    const platform = e.currentTarget.dataset.platform;
    const item = this.getSelectedContent();
    if (!item) {
      wx.showToast({ title: '没有可分发的内容', icon: 'none' });
      return;
    }

    const platformInfo = this.data.platforms.find(p => p.key === platform);
    const text = this.formatContentForPlatform(platform, item);

    // 检查字数限制
    if (text.length > platformInfo.maxChars) {
      wx.showToast({ title: `${platformInfo.name}限制${platformInfo.maxChars}字`, icon: 'none' });
      return;
    }

    // 复制到剪贴板
    wx.setClipboardData({
      data: text,
      success: () => {
        wx.showToast({ title: `${platformInfo.name}文案已复制`, icon: 'success' });
        this.setData({ copyStatus: platform });

        // 发送到后端记录
        this.publishToBackend(platform, text, item);
      },
      fail: () => {
        wx.showToast({ title: '复制失败', icon: 'none' });
      },
    });
  },

  // 记录到后端
  async publishToBackend(platform, text, item) {
    try {
      await api.distribution.publish({
        platform,
        contentText: text,
        hashtags: item.hashtags || '',
        geoTag: '📍 {{店铺位置}}',
        cityTag: '',
        contentId: item.id,
      });
    } catch (err) {
      console.error('记录分发失败:', err);
    }
  },

  // ========== 分发历史 ==========
  async loadHistory() {
    if (this.data.historyLoading) return;
    this.setData({ historyLoading: true });
    try {
      const res = await api.distribution.history(this.data.historyPage, 20);
      if (res.code === 0) {
        const newList = res.data.list || [];
        this.setData({
          history: this.data.historyPage === 1 ? newList : [...this.data.history, ...newList],
          historyHasMore: newList.length >= 20,
          historyLoading: false,
        });
      } else {
        this.setData({ historyLoading: false });
      }
    } catch (err) {
      this.setData({ historyLoading: false });
    }
  },

  onReachBottom() {
    if (this.data.activeTab !== 'history') return;
    if (!this.data.historyHasMore) return;
    this.setData({ historyPage: this.data.historyPage + 1 });
    this.loadHistory();
  },

  onPullDownRefresh() {
    if (this.data.activeTab === 'history') {
      this.setData({ historyPage: 1, history: [] });
      this.loadHistory().finally(() => wx.stopPullDownRefresh());
    } else {
      wx.stopPullDownRefresh();
    }
  },

  // 复制历史记录
  onCopyHistory(e) {
    const item = e.currentTarget.dataset.item;
    const text = item.contentText;
    wx.setClipboardData({
      data: text,
      success: () => wx.showToast({ title: '已复制', icon: 'success' }),
    });
  },
});
