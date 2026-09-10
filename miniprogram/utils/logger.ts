// 简单日志封装（小程序环境）
let isDev = false;
let isRelease = false;
try {
  const accountInfo = wx.getAccountInfoSync?.();
  const envVersion = accountInfo?.miniProgram?.envVersion;
  isDev = envVersion && envVersion !== 'release';
  isRelease = envVersion === 'release';
} catch (e) {
  isDev = false;
  isRelease = false;
}

const logger = {
  debug(...args) {
    if (isDev) console.debug('[CET46]', ...args);
  },
  info(...args) {
    if (!isRelease) console.info('[CET46]', ...args);
  },
  warn(...args) {
    if (!isRelease) console.warn('[CET46]', ...args);
  },
  error(...args) {
    console.error('[CET46]', ...args);
  },
};

module.exports = logger;
