import { SettingManager } from '@/shared/lib/setting';

// ---- Version ----------------------------------------------------------------

export const CURRENT_VERSION = '1' as const;

// ---- Application-specific Types ---------------------------------------------

/**
 * Example settings interface for your Chrome Extension.
 * Customize this interface to match your extension's needs.
 */
export interface Settings {
    favoriteColor: string;
    likesColor: boolean;
    // Add more settings as needed
}

// ---- Default Settings -------------------------------------------------------

const defaultSettings = (): Settings => ({
    favoriteColor: 'blue',
    likesColor: true
});

// ---- Settings Manager Instance ----------------------------------------------

export const settingsManager = new SettingManager<Settings>(CURRENT_VERSION, defaultSettings);
