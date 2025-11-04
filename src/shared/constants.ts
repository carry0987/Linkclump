import type { Action, Settings } from './config';

export const FLAGS = {
    ENABLE_OVERLAY: true
} as const;

export const ALARMS = {
    POLL: 'poll',
    DAILY_CLEANUP: 'daily_cleanup'
} as const;

export enum MSG {
    LINKCLUMP_ACTIVATE = 'LINKCLUMP_ACTIVATE',
    LINKCLUMP_INIT = 'LINKCLUMP_INIT',
    LINKCLUMP_UPDATE = 'LINKCLUMP_UPDATE',
    LINKCLUMP_COPY = 'LINKCLUMP_COPY'
}

export const MESSAGE_SPEC = {
    [MSG.LINKCLUMP_ACTIVATE]: {
        req: {} as { urls: Array<{ url: string; title: string }>; setting: any },
        res: {} as { ok: boolean }
    },

    [MSG.LINKCLUMP_INIT]: {
        req: {} as Record<string, never>,
        res: {} as { actions: Record<string, Action>; blocked: string[] }
    },

    [MSG.LINKCLUMP_UPDATE]: {
        req: {} as { settings: any },
        res: {} as { ok: boolean }
    },

    [MSG.LINKCLUMP_COPY]: {
        req: {} as { text: string },
        res: {} as { ok: boolean }
    }
} as const;

export const RESTRICTED = {
    // common internal schemes we should not run on
    schemes: ['chrome', 'chrome-extension', 'chrome-untrusted', 'devtools', 'edge', 'about'],
    // urls where extension UI is forbidden (Chrome/Edge web stores)
    hosts: [
        /^(?:https?:\/\/)?chrome\.google\.com\/webstore\/?/i,
        /^(?:https?:\/\/)?microsoftedge\.microsoft\.com\/addons\/?/i
    ]
} as const;

export type RestrictedScheme = (typeof RESTRICTED.schemes)[number];

// Linkclump constants
export const Z_INDEX = 2147483647;
export const OS_WIN = 1;
export const OS_LINUX = 0;
export const OS_MAC = 2;
export const LEFT_BUTTON = 0;
export const END_KEY = 'End';
export const HOME_KEY = 'Home';
