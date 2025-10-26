type Level = 'debug' | 'info' | 'warn' | 'error';
const NS = '[Chrome-Extension-Starter]';

const log = (level: Level, ...args: unknown[]) => {
    const time = new Date().toISOString();
    // eslint-disable-next-line no-console
    (console as any)[level]?.(NS, time, ...args);
};

export const logger = {
    debug: (...a: unknown[]) => log('debug', ...a),
    info: (...a: unknown[]) => log('info', ...a),
    warn: (...a: unknown[]) => log('warn', ...a),
    error: (...a: unknown[]) => log('error', ...a)
};
