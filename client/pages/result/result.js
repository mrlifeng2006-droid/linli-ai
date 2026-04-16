// pages/result/result.js
Page({
  data: {
    shopName: '',
    results: [],
  },

  onLoad(options) {
    // 解析从 generate.js 传来的数据
    try {
      const raw = decodeURIComponent(options.data || '{}');
      const parsed = JSON.parse(raw);
      console.log('result page data:', parsed);
      this.processResult(parsed);
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

  onBack() {
    wx.navigateBack();
  },

  onShareAppMessage() {
    return {
      title: '邻里AI - 帮我店写营销文案',
      path: '/pages/generate/generate',
    };
  },
});
