type Level = 'debug' | 'info' | 'warn' | 'error';
const NS = '[Linkclump]';

const log = (level: Level, ...args: unknown[]) => {
    const time = new Date().toISOString();
    console[level]?.(NS, time, ...args);
};

export const logger = {
    debug: (...a: unknown[]) => log('debug', ...a),
    info: (...a: unknown[]) => log('info', ...a),
    warn: (...a: unknown[]) => log('warn', ...a),
    error: (...a: unknown[]) => log('error', ...a)
};
