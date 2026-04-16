// pages/generate/generate.js —— 2026-04-17 Echo 重构版
const api = require('../../utils/api.js');

Page({
  data: {
    shopName: '',
    industry: '餐饮美食',
    industryIndex: 0,
    address: '',
    features: '',
    target: '',
    checkedTypes: ['social', 'shortVideo'],
    selectedStyle: 'friendly',
    generating: false,

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
  },

  onShow() {
    const token = wx.getStorageSync('token');
    if (!token) {
      wx.showModal({
        title: '提示',
        content: '请先登录后使用AI生成功能',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) wx.navigateTo({ url: '/pages/login/login' });
        }
      });
    }
  },

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
    const industries = this.data.industryList;
    const index = parseInt(e.detail.value, 10);
    this.setData({
      industryIndex: index,
      industry: industries[index].name,
    });
  },

  toggleType(e) {
    const type = e.currentTarget.dataset.type;
    const checked = [...this.data.checkedTypes];
    const idx = checked.indexOf(type);
    if (idx > -1) {
      checked.splice(idx, 1);
    } else {
      checked.push(type);
    }
    this.setData({ checkedTypes: checked });
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
    if (this.data.checkedTypes.length === 0) {
      wx.showToast({ title: '请至少选择一种内容类型', icon: 'none' });
      return;
    }

    this.setData({ generating: true });
    try {
      const res = await api.ai.generate({
        shopName: this.data.shopName,
        industry: this.data.industry || '其他',
        address: this.data.address,
        features: this.data.features,
        target: this.data.target,
        types: this.data.checkedTypes,
        style: this.data.selectedStyle,
      });

      if (res.code === 0) {
        const result = encodeURIComponent(JSON.stringify(res.data));
        wx.navigateTo({ url: `/pages/result/result?data=${result}` });
      }
    } catch (err) {
      // api层已统一处理toast
    } finally {
      this.setData({ generating: false });
    }
  },
});
