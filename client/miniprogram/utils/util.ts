/**
 * 邻里AI - 通用工具函数
 */
import dayjs from 'dayjs';

/** 格式化日期 */
export function formatDate(date: string | Date, format = 'YYYY-MM-DD HH:mm') {
  return dayjs(date).format(format);
}

/** 相对时间 */
export function timeAgo(date: string | Date): string {
  const now = dayjs();
  const target = dayjs(date);
  const diff = now.diff(target, 'minute');

  if (diff < 1) return '刚刚';
  if (diff < 60) return `${diff}分钟前`;
  if (diff < 1440) return `${Math.floor(diff / 60)}小时前`;
  if (diff < 10080) return `${Math.floor(diff / 1440)}天前`;
  return formatDate(date, 'YYYY-MM-DD');
}

/** 金额格式化 */
export function formatPrice(price: number): string {
  return `¥${(price / 100).toFixed(2)}`;
}

/** 手机号脱敏 */
export function maskPhone(phone: string): string {
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
}

/** 生成唯一ID */
export function generateId(): string {
  return `${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
}

/** 节流函数 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delay = 300
): (...args: Parameters<T>) => void {
  let last = 0;
  return function (...args: Parameters<T>) {
    const now = Date.now();
    if (now - last > delay) {
      last = now;
      fn(...args);
    }
  };
}

/** 防抖函数 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay = 300
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return function (...args: Parameters<T>) {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/** 复制到剪贴板 */
export function copyText(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    wx.setClipboardData({
      data: text,
      success: () => resolve(),
      fail: reject,
    });
  });
}

/** 打电话 */
export function makePhoneCall(phoneNumber: string): void {
  wx.makePhoneCall({ phoneNumber });
}
