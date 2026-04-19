// pages/result/result.js
Page({
  data: {
    shopName: '',
    results: [],
    images: [],
  },

  onLoad(_options) {
    // 从缓存读取生成结果
    try {
      const data = wx.getStorageSync('generateResult');
      if (data) {
        console.log('result page data:', data);
        this.processResult(data);
        wx.removeStorageSync('generateResult'); // 读取后清理
      } else {
        wx.showToast({ title: '数据获取失败', icon: 'none' });
      }
    } catch (err) {
      console.error('解析结果失败:', err);
      wx.showToast({ title: '数据解析失败', icon: 'none' });
    }
  },

  processResult(data) {
    const typeNameMap = {
      social: '朋友圈文案',
      shortVideo: '短视频脚本',
      poster: '海报文案',
      groupMsg: '群发消息',
    };

    // data.results 是数组，每项 { type, title, content, hashtags }
    const results = (data.results || []).map((item, idx) => {
      // 过滤掉 ==== 分隔的干扰内容，只保留正文
      let displayContent = item.content || '';
      // 去掉顶部的 ==== 行（如果有）
      displayContent = displayContent.replace(/^=+\s*/gm, '').trim();

      return {
        ...item,
        typeName: typeNameMap[item.type] || item.type,
        displayContent,
        hashtags: item.hashtags || '',
      };
    });

    this.setData({
      shopName: data.shopName || '',
      results,
      images: data.images || [],
      imageAnalysis: data.imageAnalysis || '',
    });
  },

  copyContent(e) {
    const index = e.currentTarget.dataset.index;
    const item = this.data.results[index];
    if (!item) return;

    wx.setClipboardData({
      data: item.displayContent + (item.hashtags ? '\n' + item.hashtags : ''),
      success: () => {
        wx.showToast({ title: '已复制到剪贴板', icon: 'success', duration: 1500 });
      },
    });
  },

  previewImage(e) {
    const url = e.currentTarget.dataset.url;
    wx.previewImage({
      current: url,
      urls: this.data.images,
    });
  },

  onBack() {
    wx.navigateBack();
  },

  // 去分发页
  goToDistribution() {
    const data = {
      shopName: this.data.shopName,
      results: this.data.results,
      images: this.data.images,
    };
    wx.setStorageSync('distributionData', data);
    wx.navigateTo({ url: '/pages/distribution/distribution' });
  },

  onShareAppMessage() {
    return {
      title: '邻里AI - 帮我店写营销文案',
      path: '/pages/generate/generate',
    };
  },
});
