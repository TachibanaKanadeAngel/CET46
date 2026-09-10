import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import logger from '../js/utils/logger.ts';

describe('logger.ts test suite', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'debug').mockImplementation(() => {});
    vi.spyOn(console, 'group').mockImplementation(() => {});
    vi.spyOn(console, 'groupEnd').mockImplementation(() => {});
    vi.spyOn(console, 'time').mockImplementation(() => {});
    vi.spyOn(console, 'timeEnd').mockImplementation(() => {});
    vi.spyOn(console, 'table').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete globalThis.__CET46_FATAL_HANDLER__;
  });

  it('formats and forwards log, info, warn, error, and debug messages', () => {
    logger.log('log message');
    logger.info('info message');
    logger.warn('warn message');
    logger.error('error message');
    logger.debug('debug message');

    expect(console.log).toHaveBeenCalledWith('[CET46][INFO]', 'log message');
    expect(console.info).toHaveBeenCalledWith('[CET46][INFO]', 'info message');
    expect(console.warn).toHaveBeenCalledWith('[CET46][WARN]', 'warn message');
    expect(console.error).toHaveBeenCalledWith('[CET46][ERROR]', 'error message');
    expect(console.debug).toHaveBeenCalledWith('[CET46][DEBUG]', 'debug message');
  });

  it('handles fatal messages and triggers fatalHandler callback', () => {
    const handler = vi.fn();
    globalThis.__CET46_FATAL_HANDLER__ = handler;

    logger.fatal('fatal system error', { code: 500 });
    expect(console.error).toHaveBeenCalledWith('[CET46][FATAL]', 'fatal system error', {
      code: 500,
    });
    expect(handler).toHaveBeenCalledWith(['fatal system error', { code: 500 }]);
  });

  it('supports group, time, and table debugging utilities', () => {
    logger.group('Group 1');
    logger.groupEnd();
    logger.time('timer 1');
    logger.timeEnd('timer 1');
    logger.table([{ a: 1, b: 2 }]);

    expect(console.group).toHaveBeenCalledWith('[CET46] Group 1');
    expect(console.groupEnd).toHaveBeenCalled();
    expect(console.time).toHaveBeenCalledWith('[CET46] timer 1');
    expect(console.timeEnd).toHaveBeenCalledWith('[CET46] timer 1');
    expect(console.table).toHaveBeenCalledWith([{ a: 1, b: 2 }], undefined);
  });
});
