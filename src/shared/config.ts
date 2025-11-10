import { SettingManager } from '@/shared/lib/setting';

// ---- Version ----------------------------------------------------------------

export const CURRENT_VERSION = '2' as const;

// ---- Application-specific Types ---------------------------------------------
export enum MouseButton {
    LEFT = 0,
    MIDDLE = 1,
    RIGHT = 2
}

export enum ActionType {
    TABS = 'tabs',
    WINDOW = 'window',
    COPY = 'copy',
    BOOKMARK = 'bookmark'
}

export enum CopyFormat {
    URLS_WITH_TITLES = 0,
    URLS_ONLY = 1,
    URLS_ONLY_SPACE_SEPARATED = 2,
    TITLES_ONLY = 3,
    AS_LINK_HTML = 4,
    AS_LIST_LINK_HTML = 5,
    AS_MARKDOWN = 6
}

export enum FilterMode {
    EXCLUDE = 0,
    INCLUDE = 1
}

export interface ActionOptions {
    smart?: boolean;
    ignore?: [FilterMode, ...string[]];
    delay?: number;
    close?: number;
    block?: boolean;
    reverse?: boolean;
    end?: boolean;
    unfocus?: boolean;
    copy?: CopyFormat;
}

export interface Action {
    mouse: MouseButton;
    key: string;
    action: ActionType;
    color: string;
    options: ActionOptions;
}

export interface Settings {
    actions: Record<string, Action>;
    blocked: string[];
}

// ---- Default Settings -------------------------------------------------------

export const DEFAULT_SETTINGS: Settings = {
    actions: {
        '101': {
            mouse: 0 as MouseButton, // LEFT
            key: 'z', // Z key
            action: 'tabs' as ActionType,
            color: '#FFA500',
            options: {
                smart: false,
                ignore: [0 as FilterMode],
                delay: 0,
                close: 0,
                block: true,
                reverse: false,
                end: false
            }
        }
    },
    blocked: []
};

// ---- Settings Manager Instance ----------------------------------------------
class MySettingManager<T extends Settings> extends SettingManager<T> {
    async migrate(currentSettings: T): Promise<T> {
        let newSettings = { ...currentSettings };

        // Migrate ignore field from [FilterMode, string] to [FilterMode, ...string[]]
        if (newSettings.actions) {
            const migratedActions = { ...newSettings.actions };

            for (const [actionId, action] of Object.entries(migratedActions)) {
                if (action.options?.ignore) {
                    const ignore = action.options.ignore;

                    // Check if it's the old format: [number, string]
                    if (ignore.length === 2 && typeof ignore[1] === 'string') {
                        const [mode, keywordsStr] = ignore;
                        // Split by comma, trim, and filter empty strings
                        const keywords = keywordsStr
                            .split(',')
                            .map((s) => s.trim())
                            .filter((s) => s !== '');

                        // Update to new format: [FilterMode, ...string[]]
                        migratedActions[actionId] = {
                            ...action,
                            options: {
                                ...action.options,
                                ignore: keywords.length > 0 ? [mode as FilterMode, ...keywords] : [mode as FilterMode]
                            }
                        };
                    }
                }
            }

            newSettings.actions = migratedActions;
        }

        return newSettings;
    }
}

export const settingsManager = new MySettingManager<Settings>(CURRENT_VERSION, () => DEFAULT_SETTINGS);

// ---- Advanced Options Configuration -----------------------------------------

export type OptionFieldType = 'selection' | 'textbox' | 'selection-textbox' | 'checkbox';

export interface OptionConfig {
    name: string;
    type: OptionFieldType;
    data?: string[];
    extra: string;
}

export const OPTIONS_CONFIG: Record<string, OptionConfig> = {
    smart: {
        name: 'Smart select',
        type: 'checkbox',
        extra: 'With smart select turned on linkclump tries to select only the important links'
    },
    ignore: {
        name: 'Filter links',
        type: 'selection-textbox',
        data: ['Exclude links with words', 'Include links with words'],
        extra: 'Filter links that include/exclude these words; separate words with a comma ,'
    },
    copy: {
        name: 'Copy format',
        type: 'selection',
        data: [
            'URLS with titles',
            'URLS only',
            'URLS only space separated',
            'titles only',
            'as link HTML',
            'as list link HTML',
            'as Markdown'
        ],
        extra: 'Format of the links saved to the clipboard'
    },
    delay: {
        name: 'Delay in opening',
        type: 'textbox',
        extra: 'Number of seconds between the opening of each link'
    },
    close: {
        name: 'Close tab time',
        type: 'textbox',
        extra: "Number of seconds before closing opened tab (0 means the tab wouldn't close)"
    },
    block: {
        name: 'Block repeat links in selection',
        type: 'checkbox',
        extra: 'Select to block repeat links from opening'
    },
    reverse: {
        name: 'Reverse order',
        type: 'checkbox',
        extra: 'Select to have links opened in reverse order'
    },
    end: {
        name: 'Open tabs at the end',
        type: 'checkbox',
        extra: 'Select to have links opened at the end of all other tabs'
    },
    unfocus: {
        name: 'Do not focus on new window',
        type: 'checkbox',
        extra: 'Select to stop the new window from coming to the front'
    }
};

export const ACTIONS_CONFIG: Record<ActionType, string[]> = {
    [ActionType.WINDOW]: ['smart', 'unfocus', 'ignore', 'delay', 'block', 'reverse'],
    [ActionType.TABS]: ['smart', 'end', 'ignore', 'delay', 'close', 'block', 'reverse'],
    [ActionType.BOOKMARK]: ['smart', 'ignore', 'block', 'reverse'],
    [ActionType.COPY]: ['smart', 'ignore', 'copy', 'block', 'reverse']
};

/**
 * Get default value for an option
 */
export function getDefaultOptionValue(optionKey: string): any {
    switch (optionKey) {
        case 'smart':
            return false;
        case 'ignore':
            return [FilterMode.EXCLUDE];
        case 'delay':
        case 'close':
            return 0;
        case 'block':
            return true;
        case 'reverse':
        case 'end':
        case 'unfocus':
            return false;
        case 'copy':
            return CopyFormat.URLS_WITH_TITLES;
        default:
            return undefined;
    }
}

/**
 * Reset options when action type changes
 * Keeps only options that are compatible with the new action type
 */
export function resetIncompatibleOptions(currentOptions: ActionOptions, newActionType: ActionType): ActionOptions {
    const compatibleOptions = ACTIONS_CONFIG[newActionType];
    const newOptions: ActionOptions = {
        block: currentOptions.block,
        reverse: currentOptions.reverse
    };

    compatibleOptions.forEach((optionKey) => {
        if (optionKey === 'block' || optionKey === 'reverse') {
            // Already set above
            return;
        }

        const currentValue = currentOptions[optionKey as keyof ActionOptions];
        if (currentValue !== undefined) {
            newOptions[optionKey as keyof ActionOptions] = currentValue as any;
        } else {
            newOptions[optionKey as keyof ActionOptions] = getDefaultOptionValue(optionKey);
        }
    });

    return newOptions;
}
