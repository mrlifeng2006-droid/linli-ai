

// pages/generate/generate.js —— 2026-04-16 22:25 Echo 热重载测试
const app = getApp();

Page({
  data: {
    shopName: '',
    industry: '',
    address: '',
    features: '',
    target: '',

    industryList: [
      { id: 1, name: '餐饮美食' },
      { id: 2, name: '便利超市' },
      { id: 3, name: '水果生鲜' },
      { id: 4, name: '美容美发' },
      { id: 5, name: '教育培训' },
      { id: 6, name: '健身运动' },
      { id: 7, name: '医疗健康' },
      { id: 8, name: '休闲娱乐' },
      { id: 9, name: '家居建材' },
      { id: 10, name: '其他' },
    ],

    checkedTypes: {
      social: true,
      shortVideo: true,
      poster: false,
      groupMsg: false,
    },

    selectedStyle: 'friendly',
    generating: false,
  },

  onLoad() {},

  onShopNameInput(e) {
    this.setData({ shopName: e.detail.value });
  },
  onAddressInput(e) {
    this.setData({ address: e.detail.value });
  },
  onFeaturesInput(e) {
    this.setData({ features: e.detail.value });
  },
  onTargetInput(e) {
    this.setData({ target: e.detail.value });
  },

  onIndustryChange(e) {
    const list = this.data.industryList;
    const index = e.detail.value;
    this.setData({ industry: list[index].name });
  },

  toggleType(e) {
    const type = e.currentTarget.dataset.type;
    const checked = `checkedTypes.${type}`;
    this.setData({ [checked]: !this.data.checkedTypes[type] });
  },

  selectStyle(e) {
    this.setData({ selectedStyle: e.currentTarget.dataset.style });
  },

  async onGenerate() {
    const { shopName, industry, features } = this.data;
    if (!shopName) {
      wx.showToast({ title: '请填写店铺名称', icon: 'none' });
      return;
    }
    if (!features) {
      wx.showToast({ title: '请填写店铺特色', icon: 'none' });
      return;
    }

    this.setData({ generating: true });

    try {
      const res = await wx.request({
        url: 'https://textbook-inspiration-float-touring.trycloudflare.com/api/v1/ai/generate',
        method: 'POST',
        header: { 'Content-Type': 'application/json' },
        data: {
          shopName: this.data.shopName,
          industry: this.data.industry || '其他',
          address: this.data.address,
          features: this.data.features,
          target: this.data.target,
          types: Object.keys(this.data.checkedTypes).filter(k => this.data.checkedTypes[k]),
          style: this.data.selectedStyle,
        },
      });

      const data = res.data;
      if (!data) {
        console.error('响应为空，statusCode:', res.statusCode, 'headers:', res.header);
        wx.showToast({ title: '后端无响应，请确认服务已启动', icon: 'none' });
        return;
      }
      if (data.code === 0) {
        const result = encodeURIComponent(JSON.stringify(data.data));
        wx.navigateTo({ url: `/pages/result/result?data=${result}` });
      } else {
        wx.showToast({ title: data.message || '生成失败', icon: 'none' });
      }
    } catch (err) {
      console.error('generate error:', err);
      wx.showToast({ title: '网络错误，请检查后端服务', icon: 'none' });
    } finally {
      this.setData({ generating: false });
    }
  },
});
