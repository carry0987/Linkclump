type Level = 'debug' | 'info' | 'warn' | 'error';
const NS = '[Linkclump]';
const isDev = process.env.NODE_ENV !== 'production';

const noop = () => {};

const log = (level: Level, ...args: unknown[]) => {
    const time = new Date().toISOString();
    console[level]?.(NS, time, ...args);
};

export const logger = {
    debug: isDev ? (...a: unknown[]) => log('debug', ...a) : noop,
    info: isDev ? (...a: unknown[]) => log('info', ...a) : noop,
    warn: isDev ? (...a: unknown[]) => log('warn', ...a) : noop,
    error: isDev ? (...a: unknown[]) => log('error', ...a) : noop
};
