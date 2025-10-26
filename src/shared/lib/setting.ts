import { kv } from './storage';
import type { Settings } from '@/shared/config';

// ---- Types ------------------------------------------------------------------

/**
 * Settings manager interface for extension settings
 */
export interface ISettingManager<T extends Settings = Settings> {
    load(): Promise<T>;
    save(settings: T): Promise<void>;
    isInit(): Promise<boolean>;
    isLatest(): Promise<boolean>;
    init(): Promise<T>;
    update(): Promise<void>;
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
    async isInit(): Promise<boolean> {
        const ver = await kv.get('sync', 'version');

        return typeof ver === 'string';
    }

    /** Whether stored version matches current version. */
    async isLatest(): Promise<boolean> {
        const ver = await kv.get('sync', 'version');

        return ver === this.currentVersion;
    }

    /**
     * Initialize storage with defaults for first-time users.
     * Also writes current version.
     */
    async init(): Promise<T> {
        const s = this.defaultSettings();
        await kv.setAll('sync', {
            settings: s as Settings,
            version: this.currentVersion
        });

        return s;
    }

    /**
     * Ensure storage is initialized and optionally migrate.
     * Override this method to implement custom migration logic.
     */
    async update(): Promise<void> {
        const initialized = await this.isInit();
        if (!initialized) {
            await this.init();
            return;
        }

        const latest = await this.isLatest();
        if (!latest) {
            // Migration hook: override this method in subclass for custom migration logic
            const current = await this.load();
            const migrated = { ...current };

            await kv.setAll('sync', {
                settings: migrated as Settings,
                version: this.currentVersion
            });
        }
    }
}
