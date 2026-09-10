const isDev =
  typeof location !== 'undefined' &&
  (location.hostname === 'localhost' ||
    location.hostname === '127.0.0.1' ||
    (location.search || '').includes('debug'));

function formatMessage(level: string, args: unknown[]): unknown[] {
  const prefix = `[CET46][${level}]`;
  return [prefix, ...args];
}

const logger = {
  log: (...args: unknown[]) => {
    if (isDev) console.log(...formatMessage('INFO', args));
  },
  info: (...args: unknown[]) => {
    if (isDev) console.info(...formatMessage('INFO', args));
  },
  warn: (...args: unknown[]) => {
    console.warn(...formatMessage('WARN', args));
  },
  error: (...args: unknown[]) => {
    console.error(...formatMessage('ERROR', args));
  },
  fatal: (...args: unknown[]) => {
    console.error(...formatMessage('FATAL', args));
    const fatalHandler = (globalThis as unknown as { __CET46_FATAL_HANDLER__?: (a: unknown[]) => void }).__CET46_FATAL_HANDLER__;
    if (typeof fatalHandler === 'function') {
      try { fatalHandler(args); } catch (_) { /* swallow */ }
    }
  },
  debug: (...args: unknown[]) => {
    if (isDev) console.debug(...formatMessage('DEBUG', args));
  },
  group: (label: string) => {
    if (isDev) console.group(`[CET46] ${label}`);
  },
  groupEnd: () => {
    if (isDev) console.groupEnd();
  },
  time: (label: string) => {
    if (isDev) console.time(`[CET46] ${label}`);
  },
  timeEnd: (label: string) => {
    if (isDev) console.timeEnd(`[CET46] ${label}`);
  },
  table: (data: unknown, columns?: string[]) => {
    if (isDev) console.table(data as Record<string, unknown> | ArrayLike<unknown>, columns);
  },
};

export default logger;