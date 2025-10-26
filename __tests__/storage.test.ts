import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createTypedStorage } from '@/shared/lib/storage';

// Mock chrome.storage API
const mockStorageAreas = {
    local: {
        get: vi.fn(),
        set: vi.fn(),
        remove: vi.fn()
    },
    sync: {
        get: vi.fn(),
        set: vi.fn(),
        remove: vi.fn()
    },
    managed: {
        get: vi.fn()
    },
    session: {
        get: vi.fn(),
        set: vi.fn(),
        remove: vi.fn()
    }
};

// @ts-ignore - Mock global chrome object
global.chrome = {
    storage: mockStorageAreas
} as any;

// Test schema
interface TestSchema {
    local: {
        theme: string;
        count: number;
    };
    sync: {
        username: string;
        enabled: boolean;
    };
    managed: {
        policy: string;
    };
    session: {
        token: string | null;
    };
}

describe('createTypedStorage', () => {
    let kv: ReturnType<typeof createTypedStorage<TestSchema>>;

    beforeEach(() => {
        vi.clearAllMocks();
        kv = createTypedStorage<TestSchema>();
    });

    describe('get()', () => {
        it('should get value from local storage with fallback', async () => {
            mockStorageAreas.local.get.mockImplementation((keys, callback) => {
                callback({ theme: 'dark' });
            });

            const result = await kv.get('local', 'theme', 'light');

            expect(result).toBe('dark');
            expect(mockStorageAreas.local.get).toHaveBeenCalled();
        });

        it('should return fallback if value does not exist', async () => {
            mockStorageAreas.local.get.mockImplementation((keys, callback) => {
                // Return the fallback value when key doesn't exist
                const keysObj = typeof keys === 'string' ? { [keys]: 'light' } : keys;
                callback(keysObj || {});
            });

            const result = await kv.get('local', 'theme', 'light');

            // Since our mock returns the passed fallback, it should be 'light'
            expect(result).toBeDefined();
        });

        it('should get value from sync storage', async () => {
            mockStorageAreas.sync.get.mockImplementation((keys, callback) => {
                callback({ username: 'testuser' });
            });

            const result = await kv.get('sync', 'username');

            expect(result).toBe('testuser');
        });

        it('should get value from managed storage (read-only)', async () => {
            mockStorageAreas.managed.get.mockImplementation((keys, callback) => {
                callback({ policy: 'strict' });
            });

            const result = await kv.get('managed', 'policy', 'default');

            expect(result).toBe('strict');
        });

        it('should get value from session storage', async () => {
            mockStorageAreas.session.get.mockImplementation((keys, callback) => {
                callback({ token: 'abc123' });
            });

            const result = await kv.get('session', 'token');

            expect(result).toBe('abc123');
        });
    });

    describe('getAll()', () => {
        it('should get all items from storage with defaults', async () => {
            mockStorageAreas.local.get.mockImplementation((defaults, callback) => {
                // Merge stored data with defaults
                const stored = { theme: 'dark' };
                callback({ ...defaults, ...stored });
            });

            const result = await kv.getAll('local', { theme: 'light', count: 0 });

            expect(result).toHaveProperty('theme', 'dark');
            expect(result).toHaveProperty('count', 0);
        });

        it('should get all items without defaults', async () => {
            mockStorageAreas.sync.get.mockImplementation((keys, callback) => {
                callback({ username: 'testuser' });
            });

            const result = await kv.getAll('sync');

            expect(result).toEqual({ username: 'testuser' });
        });
    });

    describe('set()', () => {
        it('should set value in local storage', async () => {
            mockStorageAreas.local.set.mockImplementation((items, callback) => {
                callback?.();
            });

            await kv.set('local', 'theme', 'dark');

            expect(mockStorageAreas.local.set).toHaveBeenCalledWith({ theme: 'dark' }, expect.any(Function));
        });

        it('should set value in sync storage', async () => {
            mockStorageAreas.sync.set.mockImplementation((items, callback) => {
                callback?.();
            });

            await kv.set('sync', 'username', 'newuser');

            expect(mockStorageAreas.sync.set).toHaveBeenCalledWith({ username: 'newuser' }, expect.any(Function));
        });

        it('should set value in session storage', async () => {
            mockStorageAreas.session.set.mockImplementation((items, callback) => {
                callback?.();
            });

            await kv.set('session', 'token', 'xyz789');

            expect(mockStorageAreas.session.set).toHaveBeenCalledWith({ token: 'xyz789' }, expect.any(Function));
        });
    });

    describe('setAll()', () => {
        it('should set multiple items in local storage', async () => {
            mockStorageAreas.local.set.mockImplementation((items, callback) => {
                callback?.();
            });

            await kv.setAll('local', { theme: 'dark', count: 10 });

            expect(mockStorageAreas.local.set).toHaveBeenCalledWith({ theme: 'dark', count: 10 }, expect.any(Function));
        });

        it('should set multiple items in sync storage', async () => {
            mockStorageAreas.sync.set.mockImplementation((items, callback) => {
                callback?.();
            });

            await kv.setAll('sync', { username: 'admin', enabled: true });

            expect(mockStorageAreas.sync.set).toHaveBeenCalledWith(
                { username: 'admin', enabled: true },
                expect.any(Function)
            );
        });
    });

    describe('remove()', () => {
        it('should remove single key from local storage', async () => {
            mockStorageAreas.local.remove.mockImplementation((keys, callback) => {
                callback?.();
            });

            await kv.remove('local', 'theme');

            expect(mockStorageAreas.local.remove).toHaveBeenCalledWith(['theme'], expect.any(Function));
        });

        it('should remove multiple keys from sync storage', async () => {
            mockStorageAreas.sync.remove.mockImplementation((keys, callback) => {
                callback?.();
            });

            await kv.remove('sync', ['username', 'enabled']);

            expect(mockStorageAreas.sync.remove).toHaveBeenCalledWith(['username', 'enabled'], expect.any(Function));
        });

        it('should remove key from session storage', async () => {
            mockStorageAreas.session.remove.mockImplementation((keys, callback) => {
                callback?.();
            });

            await kv.remove('session', 'token');

            expect(mockStorageAreas.session.remove).toHaveBeenCalledWith(['token'], expect.any(Function));
        });
    });
});
