import { SettingManager } from '@/shared/lib/setting';

// ---- Version ----------------------------------------------------------------

export const CURRENT_VERSION = '1' as const;

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

export const settingsManager = new SettingManager<Settings>(CURRENT_VERSION, () => DEFAULT_SETTINGS);
