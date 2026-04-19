/* pages/onboarding/onboarding.js */
const api = require('../../utils/api.js');

Page({
  data: {
    formData: {
      store_name: '',
      industry_cat: '',
      location_text: '',
      features: '',
      target_customer: '',
      contact_name: '',
      phone_number: '',
      wechat_id: '',
      tone_style: 'friendly',
    },
    industryList: [
      { name: '餐饮美食', value: 'catering' },
      { name: '零售便利', value: 'retail' },
      { name: '美容美发', value: 'beauty' },
      { name: '教育培训', value: 'education' },
      { name: '健身运动', value: 'fitness' },
      { name: '汽车服务', value: 'automotive' },
      { name: '家政服务', value: 'housekeeping' },
      { name: '宠物服务', value: 'pet' },
      { name: '其他服务', value: 'other' },
    ],
    loading: false,
    can_edit: true,
    cooldown_ends_at: null,
    cooldown_days_left: 0,
    isEdit: false,
  },

  onLoad() {
    this.loadProfile();
  },

  // 加载已有信息
  async loadProfile() {
    try {
      const res = await api.merchant.getProfile();

      if (res.code === 0 && res.data.is_registered) {
        const data = res.data;
        this.setData({
          formData: {
            store_name: data.store_name || '',
            industry_cat: data.industry_cat || '',
            location_text: data.location_text || '',
            features: data.features || '',
            target_customer: data.target_customer || '',
            contact_name: data.contact_name || '',
            phone_number: data.phone_number_raw || '',
            wechat_id: data.wechat_id || '',
            tone_style: data.tone_style || 'friendly',
          },
          can_edit: data.can_edit,
          cooldown_ends_at: data.cooldown_ends_at,
          cooldown_days_left: data.cooldown_days_left || 0,
          isEdit: true,
        });
      }
    } catch (e) {
      console.error('加载信息失败:', e);
    }
  },

  // 输入框处理
  onFieldInput(e) {
    const { field } = e.currentTarget.dataset;
    const value = e.detail.value;
    this.setData({
      [`formData.${field}`]: value,
    });
  },

  // 行业选择
  onIndustryChange(e) {
    const index = e.detail.value;
    const industry = this.data.industryList[index];
    this.setData({
      'formData.industry_cat': industry.name,
    });
  },

  // 风格选择
  onStyleSelect(e) {
    const style = e.currentTarget.dataset.style;
    this.setData({
      'formData.tone_style': style,
    });
  },

  // 提交
  async onSubmit() {
    if (!this.data.can_edit) {
      wx.showToast({ title: '冷却期内不可修改', icon: 'none' });
      return;
    }

    const d = this.data.formData;
    if (!d.store_name.trim()) {
      wx.showToast({ title: '请输入店铺名称', icon: 'none' });
      return;
    }
    if (!d.industry_cat) {
      wx.showToast({ title: '请选择行业类型', icon: 'none' });
      return;
    }
    if (!d.location_text.trim()) {
      wx.showToast({ title: '请输入详细地址', icon: 'none' });
      return;
    }
    if (!d.contact_name.trim()) {
      wx.showToast({ title: '请输入联系人姓名', icon: 'none' });
      return;
    }
    if (!d.phone_number.trim() || d.phone_number.length < 11) {
      wx.showToast({ title: '请输入正确的手机号', icon: 'none' });
      return;
    }

    this.setData({ loading: true });

    try {
      const res = await api.merchant.updateProfile(d);

      if (res.code === 0) {
        wx.showToast({ title: '保存成功', icon: 'success' });
        setTimeout(() => {
          if (this.data.isEdit) {
            wx.navigateBack();
          } else {
            wx.switchTab({ url: '/pages/home/home' });
          }
        }, 1000);
      } else if (res.code === 403) {
        wx.showModal({
          title: '冷却期内',
          content: res.message,
          showCancel: false,
        });
      } else {
        wx.showToast({ title: res.message || '保存失败', icon: 'none' });
      }
    } catch (e) {
      wx.showToast({ title: '网络错误', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },
});
