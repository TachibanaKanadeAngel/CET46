const isDev = location.hostname === 'localhost' || location.hostname === '127.0.0.1' || location.search.includes('debug');

function formatMessage(level, args) {
  const prefix = `[CET46][${level}]`;
  return [prefix, ...args];
}

const logger = {
  log: (...args) => {
    if (isDev) console.log(...formatMessage('INFO', args));
  },
  info: (...args) => {
    if (isDev) console.info(...formatMessage('INFO', args));
  },
  warn: (...args) => {
    console.warn(...formatMessage('WARN', args));
  },
  error: (...args) => {
    console.error(...formatMessage('ERROR', args));
  },
  debug: (...args) => {
    if (isDev) console.debug(...formatMessage('DEBUG', args));
  },
  group: (label) => {
    if (isDev) console.group(`[CET46] ${label}`);
  },
  groupEnd: () => {
    if (isDev) console.groupEnd();
  },
  time: (label) => {
    if (isDev) console.time(`[CET46] ${label}`);
  },
  timeEnd: (label) => {
    if (isDev) console.timeEnd(`[CET46] ${label}`);
  },
  table: (data, columns) => {
    if (isDev) console.table(data, columns);
  }
};

export default logger;
