/**
 * CET46 科学记忆引擎 - 平台抽象与原生桥接层
 * 支持环境：Web (PWA) / Electron (Desktop) / Capacitor (Mobile Android)
 */
import { CONFIG } from './config.js';
import logger from './utils/logger.js';

let _notificationIdCounter = 0;

export const getPlatform = (): 'capacitor' | 'electron' | 'web' => {
  if (typeof window !== 'undefined' && (window as any).Capacitor && (window as any).Capacitor.platform !== 'web') {
    return 'capacitor';
  }
  if (typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().includes('electron')) {
    return 'electron';
  }
  return 'web';
};

export const isCapacitor = (): boolean => getPlatform() === 'capacitor';
export const isElectron = (): boolean => getPlatform() === 'electron';

/**
 * 跨端系统通知发送
 * @param {string} title - 通知标题
 * @param {string} body - 通知内容
 * @param {number} [delaySeconds=0] - 延时发送秒数（用于定时复习提醒）
 */
export async function sendLocalNotification(title: string, body: string, delaySeconds: number = 0): Promise<boolean> {
  const platform = getPlatform();

  if (platform === 'capacitor') {
    try {
      const LocalNotifications = (window as any).Capacitor?.Plugins?.LocalNotifications;
      if (LocalNotifications) {
        const permission = await LocalNotifications.requestPermissions();
        if (permission.display === 'granted') {
          const scheduleDate = new Date(Date.now() + delaySeconds * 1000);
          await LocalNotifications.schedule({
            notifications: [
              {
                title,
                body,
                id: ++_notificationIdCounter,
                schedule: delaySeconds > 0 ? { at: scheduleDate } : undefined,
                sound: null,
                attachments: null,
                actionTypeId: '',
                extra: null,
              },
            ],
          });
          logger.info(`[Capacitor] 成功调度原生通知: "${title}"，延迟 ${delaySeconds} 秒`);
          return true;
        }
      }
    } catch (e: any) {
      logger.warn('[Capacitor] 原生通知发送失败:', e.message);
    }
  }

  // Electron 或 Web 降级到 HTML5 Notification API
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      triggerBrowserNotification(title, body, delaySeconds);
      return true;
    } else if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        triggerBrowserNotification(title, body, delaySeconds);
        return true;
      }
    }
  }

  logger.info(`[Bridge] 通知降级显示在控制台: [${title}] ${body}`);
  return false;
}

function triggerBrowserNotification(title: string, body: string, delaySeconds: number): void {
  const showNotification = () => {
    try {
      new Notification(title, {
        body,
        icon: 'icons/icon-192.svg',
      });
    } catch (e: any) {
      logger.warn('[Web] Notification 实例化失败，退化至控制台提示:', e.message);
    }
  };

  // 超过 24 小时或超出 32 位整型上限 (2147483647ms ≈ 24.8天) 的延时，跳过内存定时器避免整数溢出即时错误弹窗
  if (delaySeconds > 24 * 3600 || delaySeconds * 1000 > 2147483647) {
    logger.info(`[Web] 延时时间超过网页生命周期限制 (${delaySeconds}s)，跳过网页端定时器`);
    return;
  }

  if (delaySeconds > 0) {
    setTimeout(showNotification, delaySeconds * 1000);
  } else {
    showNotification();
  }
}

/**
 * 跨端原生 TTS 语音播放（主要用于移动端离线场景下的发音保障）
 * @param {string} text - 朗读文本
 */
export async function speakNative(text: string): Promise<boolean> {
  const platform = getPlatform();

  if (platform === 'capacitor') {
    try {
      const TextToSpeech = (window as any).Capacitor?.Plugins?.TextToSpeech;
      if (TextToSpeech) {
        await TextToSpeech.speak({
          text,
          locale: 'en-US',
          rate: 0.85,
          pitch: 1.0,
          volume: 1.0,
        });
        logger.info(`[Capacitor] 成功播放原生 TTS: "${text}"`);
        return true;
      }
    } catch (e: any) {
      logger.warn('[Capacitor] 原生 TTS 播放失败:', e.message);
    }
  }

  // 降级使用浏览器 SpeechSynthesis
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
    return true;
  }

  logger.warn('[Bridge] 当前平台无可用 TTS 引擎');
  return false;
}

export const DeviceBridge = {
  getPlatform,
  isCapacitor,
  isElectron,
  sendLocalNotification,
  speakNative,

  /**
   * 根据词库中下一次最早到期的复习时间，自动调度系统复习提醒
   */
  async scheduleNextReviewReminder(words: any[], getWordData: (id: any) => any): Promise<void> {
    let minNextReview = Infinity;
    const now = Date.now();
    for (const w of words) {
      const wd = getWordData(w.id);
      if (wd && wd.status === 'review' && wd.nextReview > now) {
        if (wd.nextReview < minNextReview) {
          minNextReview = wd.nextReview;
        }
      }
    }

    if (minNextReview !== Infinity) {
      const delaySeconds = Math.max(10, Math.round((minNextReview - now) / 1000));
      try {
        const LocalNotifications = (window as any).Capacitor?.Plugins?.LocalNotifications;
        if (LocalNotifications) {
          await LocalNotifications.cancel({ notifications: [{ id: 4646 }] });
        }
      } catch (e) {
        if (CONFIG.DEBUG) logger.warn('[Bridge] 取消旧通知失败:', e);
      }

      await sendLocalNotification(
        '📖 46英语',
        '您有新的单词到期需要复习啦！快来巩固记忆吧 ⚡',
        delaySeconds
      );
      logger.info(
        `[Bridge] 已预约复习通知，将在 ${delaySeconds} 秒后（${new Date(minNextReview).toLocaleString()}）到期提示`
      );
    }
  },
};

export default DeviceBridge;
