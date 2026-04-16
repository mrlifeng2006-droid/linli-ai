/**
 * 邻里AI - HTTP请求封装
 * 统一处理token、错误码、Loading
 */
interface RequestOptions {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: any;
  header?: Record<string, string>;
  showLoading?: boolean;
  showError?: boolean;
}

interface ResponseData {
  code: number;
  message: string;
  data: any;
}

const API_BASE = 'http://localhost:3000/api/v1';
// const API_BASE = 'https://your-domain.com/api/v1'; // 生产环境

function getApp() {
  return getApp<IAppOption>({});
}

/**
 * 通用请求方法
 */
export function request<T = any>(options: RequestOptions): Promise<T> {
  return new Promise((resolve, reject) => {
    const app = getApp();
    const token = app.globalData.token;

    if (options.showLoading !== false) {
      wx.showLoading({ title: '加载中...', mask: true });
    }

    wx.request({
      url: API_BASE + options.url,
      method: options.method || 'GET',
      data: options.data,
      header: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        ...options.header,
      },
      success(res) {
        if (options.showLoading !== false) wx.hideLoading();
        const data = res.data as ResponseData;
        if (data.code === 0) {
          resolve(data.data);
        } else {
          if (options.showError !== false) {
            wx.showToast({
              title: data.message || '请求失败',
              icon: 'none',
              duration: 2000,
            });
          }
          reject(new Error(data.message));
        }
      },
      fail(err) {
        if (options.showLoading !== false) wx.hideLoading();
        if (options.showError !== false) {
          wx.showToast({ title: '网络错误', icon: 'error', duration: 2000 });
        }
        reject(err);
      },
    });
  });
}

// 快捷方法
export const get = <T = any>(url: string, data?: any) =>
  request<T>({ url, method: 'GET', data });

export const post = <T = any>(url: string, data?: any) =>
  request<T>({ url, method: 'POST', data });

export const put = <T = any>(url: string, data?: any) =>
  request<T>({ url, method: 'PUT', data });

export const del = <T = any>(url: string, data?: any) =>
  request<T>({ url, method: 'DELETE', data });
