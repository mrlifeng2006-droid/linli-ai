// pages/marketing/marketing.js —— 2026-04-17 Echo 重构版
const api = require('../../utils/api.js');

Page({
  data: {
    activities: [],
    geoData: { localViews: 0, naturalViews: 0, interactions: 0 },
    showCreateModal: false,
    loading: false,
    // 创建活动表单
    activityForm: {
      name: '',
      type: 'bargain',  // bargain | group | seckill
      typeIndex: 0,
      discount: '',
      startTime: '',
      endTime: '',
      stock: '',
    },

    activityTypes: [
      { value: 'bargain', name: '🎯 砍价' },
      { value: 'group', name: '👥 拼团' },
      { value: 'seckill', name: '⚡ 秒杀' },
    ],
  },

  onShow() {
    const token = wx.getStorageSync('token');
    if (!token) {
      // 未登录，提示但不跳转
      return;
    }
    this.loadData();
  },

  async loadData() {
    this.setData({ loading: true });
    try {
      const [actRes, geoRes] = await Promise.all([
        api.campaign.merchantList(),
        api.merchant.getGeoReport().catch(() => ({ code: 0, data: {} })),
      ]);

      if (actRes.code === 0) {
        // 格式化活动数据，适配WXML字段名
        const list = (actRes.data.list || []).map(item => ({
          ...item,
          join: item.participant_count || 0,
          statusText: this.getStatusText(item.status),
        }));
        this.setData({ activities: list });
      }
      if (geoRes.code === 0) {
        this.setData({ geoData: geoRes.data || {} });
      }
    } catch (e) {
      // ignore
    } finally {
      this.setData({ loading: false });
    }
  },

  // ===== 活动管理 =====
  goToActivity() {
    this.loadData();
  },

  // 显示创建活动弹窗
  showCreate() {
    const token = wx.getStorageSync('token');
    if (!token) {
      wx.showModal({ title: '提示', content: '请先登录', success: (r) => { if (r.confirm) wx.navigateTo({ url: '/pages/login/login' }); } });
      return;
    }
    this.setData({ showCreateModal: true });
  },

  closeCreate() {
    this.setData({ showCreateModal: false });
  },

  // 活动表单绑定
  onFormChange(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    const form = this.data.activityForm;
    form[field] = value;
    this.setData({ activityForm: form });
  },

  onTypeChange(e) {
    const types = ['bargain', 'group', 'seckill'];
    const form = this.data.activityForm;
    form.type = types[e.detail.value];
    this.setData({ activityForm: form });
  },

  // 提交创建活动
  async onCreateActivity() {
    const { name, type, discount, stock } = this.data.activityForm;
    if (!name) {
      wx.showToast({ title: '请填写活动名称', icon: 'none' }); return;
    }
    if (!discount) {
      wx.showToast({ title: '请填写优惠内容', icon: 'none' }); return;
    }

    const now = new Date();
    const startTime = this.data.activityForm.startTime || this.formatDate(now);
    const endTime = this.data.activityForm.endTime || this.formatDate(new Date(now.getTime() + 7 * 86400000));

    this.setData({ loading: true });
    try {
      const data = {
        name,
        type,
        discount_value: discount,
        stock: stock || 100,
        start_time: startTime,
        end_time: endTime,
        original_price: 100,
        current_price: Math.round(100 * (1 - parseFloat(discount) / 100) * 100) / 100,
        target_price: Math.round(100 * (1 - parseFloat(discount) / 100) * 0.5 * 100) / 100,
        min_helpers: 5,
        max_helpers: 20,
        group_size: 3,
        group_valid_hours: 24,
      };

      const res = await api.campaign.create(data);
      if (res.code === 0) {
        wx.showToast({ title: '活动创建成功', icon: 'success' });
        this.setData({ showCreateModal: false });
        this.loadData();
      }
    } catch (e) {
      // api层已处理
    } finally {
      this.setData({ loading: false });
    }
  },

  // 查看活动详情
  async viewActivity(e) {
    const id = e.currentTarget.dataset.id;
    try {
      const res = await api.campaign.merchantDetail(id);
      if (res.code === 0) {
        // 展示详情
        const activity = res.data;
        let msg = `${activity.name}\n类型：${activity.type}\n参与人数：${activity.participant_count || 0}`;
        if (activity.type === 'seckill') {
          msg += `\n剩余库存：${activity.stock}`;
        }
        wx.showModal({ title: '活动详情', content: msg, showCancel: false });
      }
    } catch (e) {}
  },

  // 删除活动
  async deleteActivity(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除该活动吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            const r = await api.campaign.remove(id);
            if (r.code === 0) {
              wx.showToast({ title: '删除成功', icon: 'success' });
              this.loadData();
            }
          } catch (e) {}
        }
      }
    });
  },

  // 其他入口
  goToPoster() { wx.showToast({ title: '功能开发中', icon: 'none' }); },
  goToDistribution() { wx.switchTab({ url: '/pages/distribution/distribution' }); },
  goToGroup() { wx.showToast({ title: '功能开发中', icon: 'none' }); },
  goToAnalysis() { wx.showToast({ title: '功能开发中', icon: 'none' }); },
  goToTemplate() { wx.showToast({ title: '功能开发中', icon: 'none' }); },

  // 工具函数
  formatDate(d) {
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  },

  // 状态文字映射
  getStatusText(status) {
    const map = { active: '进行中', pending: '未开始', ended: '已结束', expired: '已过期' };
    return map[status] || status;
  },
  getTypeName(type) {
    const map = { bargain: '🎯 砍价', group: '👥 拼团', seckill: '⚡ 秒杀' };
    return map[type] || type;
  },
});
