import { kv } from './storage';
import type { Settings } from '@/shared/config';

// ---- Types ------------------------------------------------------------------

/**
 * Settings manager interface for extension settings
 */
export interface ISettingManager<T extends Settings = Settings> {
    load(): Promise<T>;
    save(settings: T): Promise<void>;
    reset(): Promise<T>;
    update(): Promise<void>;
    migrate(currentSettings: T): Promise<T>;
}

/**
 * Settings Manager - manages extension settings in chrome.storage.sync
 * @template T - The type of settings object (must extend Settings from schema)
 *
 * @example
 * ```typescript
 * interface MySettings extends Settings {
 *   theme: string;
 *   enabled: boolean;
 * }
 *
 * const manager = new SettingManager<MySettings>(
 *   '1.0.0',
 *   () => ({ theme: 'dark', enabled: true, actions: {}, blocked: [] })
 * );
 * ```
 */
export class SettingManager<T extends Settings = Settings> implements ISettingManager<T> {
    constructor(
        private readonly currentVersion: string,
        private readonly defaultSettings: () => T
    ) {}

    /** Load settings from sync storage with safe fallbacks. */
    async load(): Promise<T> {
        try {
            // read both keys
            const raw = await kv.get('sync', 'settings');
            const ver = await kv.get('sync', 'version');

            // If not initialized or bad version → initialize
            if (!ver || typeof ver !== 'string') {
                return await this.init();
            }

            // Accept only plain object settings
            if (raw && typeof raw === 'object') {
                return raw as T;
            }

            // If corrupted, re-init
            return await this.init();
        } catch (error) {
            return await this.init();
        }
    }

    /** Save settings to sync storage. */
    async save(settings: T): Promise<void> {
        await kv.set('sync', 'settings', settings as Settings);
    }

    /** Whether storage has been initialized at least once. */
    private async isInit(): Promise<boolean> {
        const ver = await kv.get('sync', 'version');

        return typeof ver === 'string';
    }

    /** Whether stored version matches current version. */
    private async isLatest(): Promise<boolean> {
        const ver = await kv.get('sync', 'version');

        return ver === this.currentVersion;
    }

    /**
     * Initialize storage with defaults for first-time users.
     * Also writes current version.
     */
    private async init(): Promise<T> {
        const s = this.defaultSettings();
        await kv.setAll('sync', {
            settings: s as Settings,
            version: this.currentVersion
        });

        return s;
    }

    /**
     * Reset all settings to defaults.
     * This will clear all current settings and apply the default configuration.
     *
     * @returns The default settings that were applied
     *
     * @example
     * ```typescript
     * // Reset to factory defaults
     * const defaults = await settingManager.reset();
     * console.log('Settings reset to:', defaults);
     * ```
     */
    async reset(): Promise<T> {
        return await this.init();
    }

    /**
     * Migrate settings from old version to new version.
     * Override this method in subclass to implement custom migration logic.
     *
     * @param currentSettings - The current settings loaded from storage
     * @returns The migrated settings
     *
     * @example
     * ```typescript
     * class MySettingManager extends SettingManager<MySettings> {
     *   async migrate(current: MySettings): Promise<MySettings> {
     *     // Add custom migration logic here
     *     return { ...current, newField: 'defaultValue' };
     *   }
     * }
     * ```
     */
    async migrate(currentSettings: T): Promise<T> {
        // Default implementation: no migration, return settings as-is
        return currentSettings;
    }

    /**
     * Ensure storage is initialized and migrate if version changed.
     * Calls the migrate() method when version mismatch is detected.
     */
    async update(): Promise<void> {
        const initialized = await this.isInit();
        if (!initialized) {
            await this.init();
            return;
        }

        const latest = await this.isLatest();
        if (!latest) {
            // Load current settings and apply migration
            const current = await this.load();
            const migrated = await this.migrate(current);

            await kv.setAll('sync', {
                settings: migrated as Settings,
                version: this.currentVersion
            });
        }
    }
}
