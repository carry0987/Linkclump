import { kv } from './storage';
import { logger } from './logger';
import { customMigrations } from '@/shared/config';

/**
 * Version format: "x.y.z"
 */
export type Version = string;

/**
 * Migration context provided to migration functions
 */
export interface MigrationContext {
    currentVersion: Version;
    storedVersion: Version | null;
    /**
     * Get storage value by key
     * @param area - Storage area (sync or local)
     * @param key - Storage key
     * @returns Value or undefined if not found
     *
     * @example
     * const theme = await context.getStorage<string>('local', 'theme');
     * const settings = await context.getStorage<MySettings>('sync', 'settings');
     */
    getStorage: <T = unknown>(area: 'sync' | 'local', key: string) => Promise<T | undefined>;
    /**
     * Get all storage values for an area
     * @param area - Storage area (sync or local)
     * @returns All stored values
     *
     * @example
     * const allLocal = await context.getAllStorage('local');
     */
    getAllStorage: (area: 'sync' | 'local') => Promise<Record<string, unknown>>;
}

/**
 * Migration result - what to update in storage
 */
export interface MigrationResult {
    sync?: Record<string, any>;
    local?: Record<string, any>;
}

/**
 * Migration function type
 * Receives context and returns storage updates to apply
 */
export type MigrationFn = (context: MigrationContext) => Promise<void | MigrationResult>;

/**
 * Migration definition interface
 */
export interface Migration {
    version: Version;
    description: string;
    migrate: MigrationFn;
}

/**
 * Parse version string to comparable number array
 * @example parseVersion("1.2.3") => [1, 2, 3]
 */
const parseVersion = (version: Version): number[] => {
    if (typeof version !== 'string') {
        version = String(version);
    }

    return version.split('.').map((n) => parseInt(n, 10) || 0);
};

/**
 * Compare two versions
 * @returns -1 if a < b, 0 if a === b, 1 if a > b
 */
const compareVersions = (a: Version, b: Version): number => {
    const aParts = parseVersion(a);
    const bParts = parseVersion(b);
    const maxLen = Math.max(aParts.length, bParts.length);

    for (let i = 0; i < maxLen; i++) {
        const aVal = aParts[i] || 0;
        const bVal = bParts[i] || 0;
        if (aVal < bVal) return -1;
        if (aVal > bVal) return 1;
    }

    return 0;
};

/**
 * Get migrations from config
 */
const getMigrations = (): Migration[] => {
    return customMigrations;
};

/**
 * Get current stored version
 */
const getStoredVersion = async (): Promise<Version | null> => {
    return (await kv.get('sync', 'version')) || null;
};

/**
 * Get current extension version from manifest
 */
const getCurrentVersion = (): Version => {
    return chrome.runtime.getManifest().version;
};

/**
 * Run all pending migrations
 */
export const runMigrations = async (): Promise<void> => {
    const currentVersion = getCurrentVersion();
    const storedVersion = await getStoredVersion();
    const migrations = getMigrations();

    logger.info(`[migration] Current version: ${currentVersion}, Stored version: ${storedVersion || 'none'}`);

    // If no migrations defined, only update version
    if (migrations.length === 0) {
        logger.info('[migration] No custom migrations defined, only tracking version');

        // Check for downgrade even when no migrations
        if (storedVersion && compareVersions(storedVersion, currentVersion) > 0) {
            logger.warn(
                `[migration] Stored version (${storedVersion}) is newer than current (${currentVersion}). Possible downgrade detected.`
            );

            return;
        }

        if (!storedVersion || compareVersions(storedVersion, currentVersion) !== 0) {
            await kv.set('sync', 'version', currentVersion);
            logger.info(`[migration] Version updated to ${currentVersion}`);
        } else {
            logger.info('[migration] Already at current version');
        }

        return;
    }

    // Create migration context
    const context: MigrationContext = {
        currentVersion,
        storedVersion,
        getStorage: async <T = unknown>(area: 'sync' | 'local', key: string): Promise<T | undefined> => {
            // Use Chrome storage API directly to support dynamic keys
            const storage = area === 'sync' ? chrome.storage.sync : chrome.storage.local;
            const result = await new Promise<Record<string, T>>((resolve) => {
                storage.get([key], (items) => resolve(items as Record<string, T>));
            });
            return result[key];
        },
        getAllStorage: async (area: 'sync' | 'local'): Promise<Record<string, unknown>> => {
            const storage = area === 'sync' ? chrome.storage.sync : chrome.storage.local;
            return new Promise((resolve) => {
                storage.get(null, (items) => resolve(items));
            });
        }
    };

    // If no stored version, this is a fresh install
    if (!storedVersion) {
        logger.info('[migration] Fresh install detected');

        // Run all migrations up to current version
        for (const migration of migrations) {
            if (compareVersions(migration.version, currentVersion) <= 0) {
                try {
                    logger.info(`[migration] Running: ${migration.version} - ${migration.description}`);
                    const result = await migration.migrate(context);

                    // Apply migration results if returned
                    if (result) {
                        if (result.sync) {
                            await chrome.storage.sync.set(result.sync);
                        }
                        if (result.local) {
                            await chrome.storage.local.set(result.local);
                        }
                    }
                } catch (error) {
                    logger.error(`[migration] Failed at ${migration.version}:`, error);
                    throw error; // Stop migration on error
                }
            }
        }

        // Store current version
        await kv.set('sync', 'version', currentVersion);
        logger.info(`[migration] Completed fresh install migrations, version set to ${currentVersion}`);

        return;
    }

    // If stored version is same as current, no migration needed
    if (compareVersions(storedVersion, currentVersion) === 0) {
        logger.info('[migration] Already at current version, no migration needed');

        return;
    }

    // If stored version is newer than current (downgrade), warn but don't migrate
    if (compareVersions(storedVersion, currentVersion) > 0) {
        logger.warn(
            `[migration] Stored version (${storedVersion}) is newer than current (${currentVersion}). Possible downgrade detected.`
        );

        return;
    }

    // Run pending migrations (stored version < current version)
    logger.info(`[migration] Upgrade detected: ${storedVersion} → ${currentVersion}`);

    for (const migration of migrations) {
        // Skip migrations that were already run (version <= stored)
        if (compareVersions(migration.version, storedVersion) <= 0) {
            continue;
        }

        // Skip migrations that are beyond current version
        if (compareVersions(migration.version, currentVersion) > 0) {
            continue;
        }

        // Run this migration
        try {
            logger.info(`[migration] Running: ${migration.version} - ${migration.description}`);
            const result = await migration.migrate(context);

            // Apply migration results if returned
            if (result) {
                if (result.sync) {
                    await chrome.storage.sync.set(result.sync);
                }
                if (result.local) {
                    await chrome.storage.local.set(result.local);
                }
            }
        } catch (error) {
            logger.error(`[migration] Failed at ${migration.version}:`, error);
            throw error; // Stop migration on error
        }
    }

    // Update stored version
    await kv.set('sync', 'version', currentVersion);
    logger.info(`[migration] All migrations completed, version updated to ${currentVersion}`);
};

/**
 * Rollback to a specific version (for emergency use only)
 * Note: This only updates the version number, actual data rollback
 * needs to be implemented manually
 */
export const rollbackVersion = async (targetVersion: Version): Promise<void> => {
    logger.warn(`[migration] Rolling back version to ${targetVersion}`);
    await kv.set('sync', 'version', targetVersion);
    logger.info('[migration] Version rolled back. Note: Data was not restored.');
};

/**
 * Get migration status information
 */
export const getMigrationStatus = async () => {
    const currentVersion = getCurrentVersion();
    const storedVersion = await getStoredVersion();
    const migrations = getMigrations();

    return {
        currentVersion,
        storedVersion,
        needsMigration: storedVersion ? compareVersions(storedVersion, currentVersion) < 0 : false,
        availableMigrations: migrations.map((m) => ({
            version: m.version,
            description: m.description
        }))
    };
};
