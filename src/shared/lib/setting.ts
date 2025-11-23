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
}

/**
 * Settings Manager - manages extension settings in chrome.storage.sync
 * @template T - The type of settings object (must extend Settings from schema)
 *
 * Note: Version management and migrations are now handled by the centralized
 *       migration system in background/migration.ts
 *
 * @example
 * ```typescript
 * interface MySettings extends Settings {
 *   theme: string;
 *   enabled: boolean;
 * }
 *
 * const manager = new SettingManager<MySettings>(
 *   () => ({ theme: 'dark', enabled: true, actions: {}, blocked: [] })
 * );
 * ```
 */
export class SettingManager<T extends Settings = Settings> implements ISettingManager<T> {
    constructor(private readonly defaultSettings: () => T) {}

    /** Load settings from sync storage with safe fallbacks. */
    async load(): Promise<T> {
        try {
            const raw = await kv.get('sync', 'settings');

            // Accept only plain object settings
            if (raw && typeof raw === 'object') {
                return raw as T;
            }

            // If not initialized or corrupted, initialize with defaults
            return await this.init();
        } catch (error) {
            return await this.init();
        }
    }

    /** Save settings to sync storage. */
    async save(settings: T): Promise<void> {
        await kv.set('sync', 'settings', settings);
    }

    /**
     * Initialize storage with defaults for first-time users.
     */
    private async init(): Promise<T> {
        const s = this.defaultSettings();
        await kv.set('sync', 'settings', s);

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
}
