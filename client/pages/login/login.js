// pages/login/login.js
const api = require('../../utils/api.js');

Page({
  data: {
    phone: '',
    code: '',
    loading: false,
    countdown: 0,
  },

  onPhoneInput(e) {
    this.setData({ phone: e.detail.value });
  },

  onCodeInput(e) {
    this.setData({ code: e.detail.value });
  },

  async onSendCode() {
    const { phone } = this.data;
    if (!phone || phone.length !== 11) {
      wx.showToast({ title: '请输入正确的手机号', icon: 'none' });
      return;
    }
    if (this.data.countdown > 0) return;

    try {
      await api.auth.sendCode(phone, 'login');
      wx.showToast({ title: '验证码已发送', icon: 'success' });
      // 倒计时60秒
      this.setData({ countdown: 60 });
      const timer = setInterval(() => {
        const c = this.data.countdown - 1;
        if (c <= 0) {
          clearInterval(timer);
          this.setData({ countdown: 0 });
        } else {
          this.setData({ countdown: c });
        }
      }, 1000);
    } catch (e) {
      // 错误已由api层统一处理
    }
  },

  async onLogin() {
    const { phone, code } = this.data;
    if (!phone || !code) {
      wx.showToast({ title: '请填写完整信息', icon: 'none' });
      return;
    }
    this.setData({ loading: true });
    try {
      const res = await api.auth.login(phone, code);
      if (res.code === 0) {
        // 保存token和用户信息
        wx.setStorageSync('token', res.data.token);
        wx.setStorageSync('userInfo', res.data.user);
        wx.showToast({ title: '登录成功', icon: 'success' });
        // 跳转到首页
        setTimeout(() => {
          wx.switchTab({ url: '/pages/home/home' });
        }, 1000);
      }
      // 错误由api层统一处理
    } catch (e) {
      // api层已处理toast
    } finally {
      this.setData({ loading: false });
    }
  },

  goRegister() {
    wx.navigateTo({ url: '/pages/register/register' });
  },
});
