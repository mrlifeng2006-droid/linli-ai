// pages/generate/generate.js —— 2026-04-20 v3：零表单，自动读取商家入驻信息
const api = require('../../utils/api.js');

Page({
  data: {
    // 商家信息（从后端自动读取）
    merchant: null,
    // 内容类型选择
    checkedTypes: { social: true, shortVideo: true, poster: false, groupMsg: false },
    // 文案风格
    selectedStyle: 'friendly',
    // 状态
    generating: false,
    compressProgress: '',
    uploadedImages: [],
    // 加载状态
    loadingMerchant: true,
    merchantError: false,
  },

  onLoad() {
    this.loadMerchantProfile();
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

  // 加载商家入驻信息
  async loadMerchantProfile() {
    this.setData({ loadingMerchant: true, merchantError: false });
    try {
      const res = await api.merchant.getProfile();
      if (res.code === 0) {
        if (!res.data.is_profile_complete) {
          // 未完整入驻，跳转入驻页
          wx.showModal({
            title: '请先完善店铺信息',
            content: '使用AI生成功能前，需要先填写店铺名称、行业和地址',
            showCancel: false,
            success: () => {
              wx.navigateTo({ url: '/pages/onboarding/onboarding' });
            }
          });
          return;
        }
        // 已入驻，使用商家数据
        this.setData({
          merchant: res.data,
          selectedStyle: res.data.tone_style || 'friendly',
          loadingMerchant: false,
        });
      }
    } catch (e) {
      console.error('加载商家信息失败:', e);
      this.setData({ loadingMerchant: false, merchantError: true });
    }
  },

  // 跳转去修改商家信息
  goToOnboarding() {
    wx.navigateTo({ url: '/pages/onboarding/onboarding' });
  },

  // 重新加载
  retryLoad() {
    this.loadMerchantProfile();
  },

  toggleType(e) {
    const type = e.currentTarget.dataset.type;
    const checked = { ...this.data.checkedTypes };
    checked[type] = !checked[type];
    this.setData({ checkedTypes: checked });
  },

  selectStyle(e) {
    this.setData({ selectedStyle: e.currentTarget.dataset.style });
  },

  chooseImage() {
    const remaining = 9 - this.data.uploadedImages.length;
    wx.chooseMedia({
      count: remaining,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const newImages = res.tempFiles.map((f) => {
          const ext = (f.tempFilePath.split('.').pop() || 'jpg').toLowerCase();
          const persistPath = `${wx.env.USER_DATA_PATH}/img_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.${ext}`;
          try {
            const saved = wx.getFileSystemManager().saveFileSync(f.tempFilePath, persistPath);
            return saved.savedFilePath || persistPath;
          } catch (e) {
            console.warn('保存图片失败，使用临时路径:', e);
            return f.tempFilePath;
          }
        });
        this.setData({ uploadedImages: [...this.data.uploadedImages, ...newImages] });
      }
    });
  },

  deleteImage(e) {
    const idx = e.currentTarget.dataset.index;
    const images = [...this.data.uploadedImages];
    images.splice(idx, 1);
    this.setData({ uploadedImages: images });
  },

  // 图片压缩
  async compressImagesToBase64(filePaths) {
    if (!filePaths || filePaths.length === 0) return [];

    const base64List = [];
    const files = filePaths.slice(0, 4);

    for (let i = 0; i < files.length; i++) {
      const filePath = files[i];
      const fileName = filePath.substring(filePath.lastIndexOf('/') + 1);

      this.setData({ compressProgress: `⏳ 处理第${i + 1}/${files.length}张图片...` });

      try {
        const result = await Promise.race([
          this._compressSingleImage(filePath),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('图片处理超时')), 15000)
          ),
        ]);

        if (result) base64List.push(result);
      } catch (err) {
        console.warn(`⚠️ 第${i + 1}张处理失败，跳过:`, err.message);
      }
    }

    this.setData({ compressProgress: '' });
    return base64List;
  },

  _compressSingleImage(filePath) {
    return new Promise((resolve) => {
      wx.compressImage({
        src: filePath,
        quality: 50,
        success: (compressed) => {
          setTimeout(() => {
            wx.getFileSystemManager().readFile({
              filePath: compressed.tempFilePath,
              encoding: 'base64',
              success: (r) => resolve('data:image/jpeg;base64,' + r.data),
              fail: () => {
                wx.getFileSystemManager().readFile({
                  filePath: filePath,
                  encoding: 'base64',
                  success: (r2) => resolve('data:image/jpeg;base64,' + r2.data),
                  fail: () => resolve(null),
                });
              },
            });
          }, 100);
        },
        fail: () => {
          wx.getFileSystemManager().readFile({
            filePath: filePath,
            encoding: 'base64',
            success: (r) => resolve('data:image/jpeg;base64,' + r.data),
            fail: () => resolve(null),
          });
        },
      });
    });
  },

  async onGenerate() {
    const selectedTypes = Object.keys(this.data.checkedTypes).filter(k => this.data.checkedTypes[k]);
    if (selectedTypes.length === 0) {
      wx.showToast({ title: '请至少选择一种内容类型', icon: 'none' });
      return;
    }

    const m = this.data.merchant;
    if (!m) {
      wx.showToast({ title: '商家信息加载失败，请重试', icon: 'none' });
      return;
    }

    this.setData({ generating: true });

    try {
      let imageBase64List = [];
      if (this.data.uploadedImages.length > 0) {
        this.setData({ compressProgress: '⏳ 正在处理图片...' });
        imageBase64List = await this.compressImagesToBase64(this.data.uploadedImages);
      }

      const typeMap = { social: 'social', shortVideo: 'shortVideo', poster: 'poster', groupMsg: 'groupMsg' };
      const types = selectedTypes.map(t => typeMap[t] || t);

      this.setData({ compressProgress: '🤖 AI正在分析中...' });
      wx.showLoading({ title: 'AI分析中...', mask: true });

      const res = await api.ai.generate({
        shopName: m.store_name,
        industry: m.industry_cat,
        address: m.location_text,
        features: m.features,
        target: m.target_customer,
        types,
        style: this.data.selectedStyle,
        images: imageBase64List,
      });

      wx.hideLoading();
      this.setData({ compressProgress: '', generating: false });

      if (res.code === 0) {
        const resultData = res.data;
        resultData.images = this.data.uploadedImages;
        wx.setStorageSync('generateResult', resultData);
        wx.navigateTo({ url: '/pages/result/result' });
      }
    } catch (err) {
      wx.hideLoading();
      this.setData({ compressProgress: '', generating: false });
    }
  },
});
