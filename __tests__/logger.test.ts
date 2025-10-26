import { describe, it, expect, beforeEach, vi } from 'vitest';
import { logger } from '@/shared/lib/logger';

describe('Logger', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    describe('API', () => {
        it('should expose all log level methods', () => {
            expect(typeof logger.debug).toBe('function');
            expect(typeof logger.info).toBe('function');
            expect(typeof logger.warn).toBe('function');
            expect(typeof logger.error).toBe('function');
        });
    });

    describe('debug()', () => {
        it('should log debug messages', () => {
            const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});

            logger.debug('Debug message', { data: 'test' });

            expect(spy).toHaveBeenCalled();
            expect(spy.mock.calls[0][0]).toContain('[Chrome-Extension-Starter]');
            expect(spy.mock.calls[0][2]).toBe('Debug message');
        });
    });

    describe('info()', () => {
        it('should log info messages', () => {
            const spy = vi.spyOn(console, 'info').mockImplementation(() => {});

            logger.info('Info message');

            expect(spy).toHaveBeenCalled();
            expect(spy.mock.calls[0][0]).toContain('[Chrome-Extension-Starter]');
        });

        it('should log multiple arguments', () => {
            const spy = vi.spyOn(console, 'info').mockImplementation(() => {});

            logger.info('User action', { user: 'John', action: 'login' });

            expect(spy).toHaveBeenCalled();
            expect(spy.mock.calls[0].length).toBeGreaterThan(2);
        });
    });

    describe('warn()', () => {
        it('should log warning messages', () => {
            const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});

            logger.warn('Warning message');

            expect(spy).toHaveBeenCalled();
            expect(spy.mock.calls[0][0]).toContain('[Chrome-Extension-Starter]');
        });
    });

    describe('error()', () => {
        it('should log error messages', () => {
            const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

            logger.error('Error message', new Error('Test error'));

            expect(spy).toHaveBeenCalled();
            expect(spy.mock.calls[0][0]).toContain('[Chrome-Extension-Starter]');
        });

        it('should log Error objects', () => {
            const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
            const error = new Error('Something went wrong');

            logger.error('Failed operation', error);

            expect(spy).toHaveBeenCalled();
            expect(spy.mock.calls[0][3]).toBe(error);
        });
    });

    describe('Timestamp', () => {
        it('should include ISO timestamp', () => {
            const spy = vi.spyOn(console, 'info').mockImplementation(() => {});

            logger.info('Test');

            const timestamp = spy.mock.calls[0][1];
            expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
        });
    });
});
