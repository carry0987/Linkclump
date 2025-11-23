import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock chrome runtime API
const mockManifest = { version: '1.2.0' };
const mockStorage = {
    sync: new Map<string, any>(),
    local: new Map<string, any>()
};

// Mock chrome.runtime
const mockRuntime = {
    getManifest: vi.fn(() => mockManifest)
};

// Mock chrome.storage
const mockStorageSync = {
    get: vi.fn((keys: any, callback: any) => {
        const result: Record<string, any> = {};
        if (keys === undefined || keys === null) {
            // Get all
            mockStorage.sync.forEach((value, key) => {
                result[key] = value;
            });
        } else if (typeof keys === 'object' && !Array.isArray(keys)) {
            // Get with defaults
            Object.keys(keys).forEach((key) => {
                result[key] = mockStorage.sync.get(key) ?? keys[key];
            });
        } else {
            // Get specific keys
            const keyArray = Array.isArray(keys) ? keys : [keys];
            keyArray.forEach((key: string) => {
                const value = mockStorage.sync.get(key);
                if (value !== undefined) result[key] = value;
            });
        }
        callback(result);
    }),
    set: vi.fn((items: Record<string, any>, callback: any) => {
        Object.entries(items).forEach(([key, value]) => {
            mockStorage.sync.set(key, value);
        });
        callback();
    }),
    remove: vi.fn((keys: string | string[], callback: any) => {
        const keyArray = Array.isArray(keys) ? keys : [keys];
        keyArray.forEach((key) => mockStorage.sync.delete(key));
        callback();
    })
};

const mockStorageLocal = {
    get: vi.fn((keys: any, callback: any) => {
        const result: Record<string, any> = {};
        if (keys === undefined || keys === null) {
            mockStorage.local.forEach((value, key) => {
                result[key] = value;
            });
        } else if (typeof keys === 'object' && !Array.isArray(keys)) {
            Object.keys(keys).forEach((key) => {
                result[key] = mockStorage.local.get(key) ?? keys[key];
            });
        } else {
            const keyArray = Array.isArray(keys) ? keys : [keys];
            keyArray.forEach((key: string) => {
                const value = mockStorage.local.get(key);
                if (value !== undefined) result[key] = value;
            });
        }
        callback(result);
    }),
    set: vi.fn((items: Record<string, any>, callback: any) => {
        Object.entries(items).forEach(([key, value]) => {
            mockStorage.local.set(key, value);
        });
        callback();
    }),
    remove: vi.fn((keys: string | string[], callback: any) => {
        const keyArray = Array.isArray(keys) ? keys : [keys];
        keyArray.forEach((key) => mockStorage.local.delete(key));
        callback();
    })
};

// @ts-ignore - Mock global chrome object
global.chrome = {
    runtime: mockRuntime,
    storage: {
        sync: mockStorageSync,
        local: mockStorageLocal,
        onChanged: {
            addListener: vi.fn(),
            removeListener: vi.fn()
        }
    }
} as any;

// Import after mocking
import { runMigrations, getMigrationStatus, rollbackVersion, type Migration } from '@/shared/lib/migration';

// Mock customMigrations
vi.mock('@/shared/config', () => ({
    customMigrations: [] as Migration[],
    settingsManager: {} as any
}));

describe('Migration System', () => {
    beforeEach(() => {
        // Clear all storage
        mockStorage.sync.clear();
        mockStorage.local.clear();
        vi.clearAllMocks();
    });

    describe('Fresh Install (No Custom Migrations)', () => {
        it('should only track version when no migrations defined', async () => {
            // No stored version
            mockManifest.version = '1.2.0';

            await runMigrations();

            // Check that version was stored
            expect(mockStorage.sync.get('version')).toBe('1.2.0');

            // No migrations should have run
            expect(mockStorage.local.get('darkMode')).toBeUndefined();
            expect(mockStorage.local.get('username')).toBeUndefined();
            expect(mockStorage.sync.get('settings')).toBeUndefined();
        });
    });

    describe('Version Upgrade (No Custom Migrations)', () => {
        it('should only update version on upgrade when no migrations defined', async () => {
            // Simulate existing version
            mockStorage.sync.set('version', '1.0.0');
            mockManifest.version = '1.2.0';

            await runMigrations();

            // Should update to current version
            expect(mockStorage.sync.get('version')).toBe('1.2.0');

            // No migrations should have run
            expect(mockStorage.sync.get('settings')).toBeUndefined();
        });

        it('should preserve existing data when updating version', async () => {
            // Already at v1.1.0 with existing data
            mockStorage.sync.set('version', '1.1.0');
            mockStorage.local.set('darkMode', true);
            mockStorage.local.set('customData', 'test');
            mockManifest.version = '1.2.0';

            await runMigrations();

            // Should not modify existing data
            expect(mockStorage.local.get('darkMode')).toBe(true);
            expect(mockStorage.local.get('customData')).toBe('test');
            expect(mockStorage.sync.get('version')).toBe('1.2.0');
        });
    });

    describe('Same Version', () => {
        it('should not run migrations if already at current version', async () => {
            mockStorage.sync.set('version', '1.2.0');
            mockManifest.version = '1.2.0';

            await runMigrations();

            // Version should remain unchanged
            expect(mockStorage.sync.get('version')).toBe('1.2.0');
        });
    });

    describe('Downgrade Detection', () => {
        it('should warn but not migrate on downgrade', async () => {
            // Stored version is newer
            mockStorage.sync.set('version', '2.0.0');
            mockManifest.version = '1.2.0';

            await runMigrations();

            // Should not change version
            expect(mockStorage.sync.get('version')).toBe('2.0.0');
        });
    });

    describe('Migration Status', () => {
        it('should return correct migration status with no custom migrations', async () => {
            mockStorage.sync.set('version', '1.0.0');
            mockManifest.version = '1.2.0';

            const status = await getMigrationStatus();

            expect(status.currentVersion).toBe('1.2.0');
            expect(status.storedVersion).toBe('1.0.0');
            expect(status.needsMigration).toBe(true);
            expect(status.availableMigrations).toHaveLength(0); // No custom migrations
        });

        it('should indicate no migration needed when versions match', async () => {
            mockStorage.sync.set('version', '1.2.0');
            mockManifest.version = '1.2.0';

            const status = await getMigrationStatus();

            expect(status.needsMigration).toBe(false);
            expect(status.availableMigrations).toHaveLength(0);
        });
    });

    describe('Version Rollback', () => {
        it('should rollback version', async () => {
            mockStorage.sync.set('version', '1.2.0');

            await rollbackVersion('1.0.0');

            expect(mockStorage.sync.get('version')).toBe('1.0.0');
        });
    });

    describe('No Custom Migrations Behavior', () => {
        it('should run successfully without any custom migrations', async () => {
            mockManifest.version = '1.2.0';

            await expect(runMigrations()).resolves.not.toThrow();
            expect(mockStorage.sync.get('version')).toBe('1.2.0');
        });
    });

    describe('Idempotency', () => {
        it('should be safe to run migrations multiple times', async () => {
            mockManifest.version = '1.2.0';

            // Run migrations twice
            await runMigrations();
            const firstVersion = mockStorage.sync.get('version');

            await runMigrations();
            const secondVersion = mockStorage.sync.get('version');

            // Version should remain consistent
            expect(secondVersion).toBe(firstVersion);
            expect(secondVersion).toBe('1.2.0');
        });
    });
});
