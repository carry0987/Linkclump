import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SettingManager } from '@/shared/lib/setting';

// Mock chrome.storage API
const mockStorage = {
    sync: {
        get: vi.fn(),
        set: vi.fn()
    }
};

// @ts-ignore - Mock global chrome object
global.chrome = {
    storage: mockStorage
} as any;

interface TestSettings {
    theme: string;
    enabled: boolean;
    count: number;
}

const defaultSettings = (): TestSettings => ({
    theme: 'dark',
    enabled: true,
    count: 0
});

describe('SettingManager', () => {
    let manager: SettingManager<TestSettings>;

    beforeEach(() => {
        vi.clearAllMocks();
        manager = new SettingManager<TestSettings>('1.0.0', defaultSettings);
    });

    describe('init()', () => {
        it('should initialize with default settings', async () => {
            mockStorage.sync.set.mockImplementation((items, callback) => callback?.());

            const result = await manager.init();

            expect(result).toEqual(defaultSettings());
            expect(mockStorage.sync.set).toHaveBeenCalledWith(
                {
                    settings: defaultSettings(),
                    version: '1.0.0'
                },
                expect.any(Function)
            );
        });
    });

    describe('load()', () => {
        it('should load existing settings when properly stored', async () => {
            const storedSettings = { theme: 'light', enabled: false, count: 5 };

            mockStorage.sync.get.mockImplementation((key, callback) => {
                if (key === 'settings') {
                    callback?.({ settings: storedSettings });
                } else if (key === 'version') {
                    callback?.({ version: '1.0.0' });
                } else {
                    callback?.({});
                }
            });

            const result = await manager.load();

            // Verify it's an object with the expected properties
            expect(result).toBeTypeOf('object');
            expect(result).toHaveProperty('theme');
            expect(result).toHaveProperty('enabled');
            expect(result).toHaveProperty('count');
        }, 10000);

        it('should initialize if version is missing', async () => {
            mockStorage.sync.get.mockImplementation((key, callback) => {
                callback?.({}); // No version stored
            });
            mockStorage.sync.set.mockImplementation((items, callback) => callback?.());

            const result = await manager.load();

            expect(result).toEqual(defaultSettings());
            expect(mockStorage.sync.set).toHaveBeenCalled();
        });

        it('should initialize if settings are corrupted', async () => {
            mockStorage.sync.get.mockImplementation((key, callback) => {
                if (key === 'settings') {
                    callback?.({ settings: 'invalid' }); // Corrupted data
                } else if (key === 'version') {
                    callback?.({ version: '1.0.0' });
                } else {
                    callback?.({});
                }
            });
            mockStorage.sync.set.mockImplementation((items, callback) => callback?.());

            const result = await manager.load();

            expect(result).toEqual(defaultSettings());
        }, 10000);

        it('should handle errors gracefully', async () => {
            mockStorage.sync.get.mockImplementation(() => {
                throw new Error('Storage error');
            });
            mockStorage.sync.set.mockImplementation((items, callback) => callback?.());

            const result = await manager.load();

            expect(result).toEqual(defaultSettings());
        });
    });

    describe('save()', () => {
        it('should save settings to sync storage', async () => {
            const newSettings: TestSettings = {
                theme: 'light',
                enabled: false,
                count: 10
            };
            mockStorage.sync.set.mockImplementation((items, callback) => callback?.());

            await manager.save(newSettings);

            expect(mockStorage.sync.set).toHaveBeenCalledWith({ settings: newSettings }, expect.any(Function));
        });
    });

    describe('isInit()', () => {
        it('should return true if version exists', async () => {
            mockStorage.sync.get.mockImplementation((keys, callback) => {
                callback?.({ version: '1.0.0' });
            });

            const result = await manager.isInit();

            expect(result).toBe(true);
        });

        it('should return false if version does not exist', async () => {
            mockStorage.sync.get.mockImplementation((keys, callback) => {
                callback?.({});
            });

            const result = await manager.isInit();

            expect(result).toBe(false);
        });
    });

    describe('isLatest()', () => {
        it('should return true if versions match', async () => {
            mockStorage.sync.get.mockImplementation((keys, callback) => {
                callback?.({ version: '1.0.0' });
            });

            const result = await manager.isLatest();

            expect(result).toBe(true);
        });

        it('should return false if versions do not match', async () => {
            mockStorage.sync.get.mockImplementation((keys, callback) => {
                callback?.({ version: '0.9.0' });
            });

            const result = await manager.isLatest();

            expect(result).toBe(false);
        });

        it('should return false if version does not exist', async () => {
            mockStorage.sync.get.mockImplementation((keys, callback) => {
                callback?.({});
            });

            const result = await manager.isLatest();

            expect(result).toBe(false);
        });
    });

    describe('update()', () => {
        it('should initialize if not initialized', async () => {
            mockStorage.sync.get.mockImplementation((keys, callback) => {
                callback?.({}); // Not initialized
            });
            mockStorage.sync.set.mockImplementation((items, callback) => callback?.());

            await manager.update();

            expect(mockStorage.sync.set).toHaveBeenCalledWith(
                {
                    settings: defaultSettings(),
                    version: '1.0.0'
                },
                expect.any(Function)
            );
        });

        it('should migrate settings when version is outdated', async () => {
            const oldSettings = { theme: 'light', enabled: false, count: 5 };

            mockStorage.sync.get.mockImplementation((key, callback) => {
                if (key === 'version') {
                    callback?.({ version: '0.9.0' }); // Old version
                } else if (key === 'settings') {
                    callback?.({ settings: oldSettings });
                } else {
                    callback?.({});
                }
            });
            mockStorage.sync.set.mockImplementation((items, callback) => callback?.());

            await manager.update();

            // Verify that settings were updated with new version
            expect(mockStorage.sync.set).toHaveBeenCalled();
            const callArgs = mockStorage.sync.set.mock.calls[0][0];
            expect(callArgs).toHaveProperty('version', '1.0.0');
            expect(callArgs).toHaveProperty('settings');
        }, 10000);

        it('should do nothing if already latest', async () => {
            mockStorage.sync.get.mockImplementation((keys, callback) => {
                callback?.({ version: '1.0.0' });
            });

            await manager.update();

            expect(mockStorage.sync.set).not.toHaveBeenCalled();
        });
    });
});
