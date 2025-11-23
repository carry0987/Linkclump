import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SettingManager } from '@/shared/lib/setting';
import type { Settings } from '@/shared/config';
import { MouseButton, ActionType } from '@/shared/config';

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

const defaultSettings = (): Settings => ({
    actions: {
        '101': {
            mouse: MouseButton.LEFT,
            key: 'z',
            action: ActionType.TABS,
            color: '#FFA500',
            options: {
                smart: false,
                ignore: [0],
                delay: 0,
                close: 0,
                block: true,
                reverse: false,
                end: false
            }
        }
    },
    blocked: []
});

describe('SettingManager', () => {
    let manager: SettingManager<Settings>;

    beforeEach(() => {
        vi.clearAllMocks();
        manager = new SettingManager<Settings>(defaultSettings);
    });

    describe('reset()', () => {
        it('should reset settings to defaults', async () => {
            mockStorage.sync.set.mockImplementation((items, callback) => callback?.());

            const result = await manager.reset();

            expect(result).toEqual(defaultSettings());
            expect(mockStorage.sync.set).toHaveBeenCalledWith({ settings: defaultSettings() }, expect.any(Function));
        });
    });

    describe('load()', () => {
        it('should load existing settings when properly stored', async () => {
            const storedSettings: Settings = {
                actions: {
                    '102': {
                        mouse: MouseButton.RIGHT,
                        key: 'x',
                        action: ActionType.WINDOW,
                        color: '#00FF00',
                        options: {
                            smart: true,
                            block: false,
                            reverse: true
                        }
                    }
                },
                blocked: ['example.com']
            };

            mockStorage.sync.get.mockImplementation((keys, callback) => {
                if (Array.isArray(keys) && keys.includes('settings')) {
                    callback?.({ settings: storedSettings });
                } else {
                    callback?.({ settings: storedSettings });
                }
            });

            const result = await manager.load();

            expect(result).toEqual(storedSettings);
        });

        it('should initialize if settings are missing', async () => {
            mockStorage.sync.get.mockImplementation((keys, callback) => {
                callback?.({}); // No settings stored
            });
            mockStorage.sync.set.mockImplementation((items, callback) => callback?.());

            const result = await manager.load();

            expect(result).toEqual(defaultSettings());
            expect(mockStorage.sync.set).toHaveBeenCalled();
        });

        it('should initialize if settings are corrupted', async () => {
            mockStorage.sync.get.mockImplementation((keys, callback) => {
                callback?.({ settings: 'invalid' }); // Corrupted data (not an object)
            });
            mockStorage.sync.set.mockImplementation((items, callback) => callback?.());

            const result = await manager.load();

            expect(result).toEqual(defaultSettings());
        });

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
            const newSettings: Settings = {
                actions: {
                    '103': {
                        mouse: MouseButton.MIDDLE,
                        key: 'c',
                        action: ActionType.COPY,
                        color: '#0000FF',
                        options: {
                            smart: false,
                            block: true,
                            copy: 0
                        }
                    }
                },
                blocked: []
            };
            mockStorage.sync.set.mockImplementation((items, callback) => callback?.());

            await manager.save(newSettings);

            expect(mockStorage.sync.set).toHaveBeenCalledWith({ settings: newSettings }, expect.any(Function));
        });
    });
});
