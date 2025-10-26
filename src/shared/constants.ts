export const FLAGS = {
    ENABLE_OVERLAY: true
} as const;

export const ALARMS = {
    POLL: 'poll',
    DAILY_CLEANUP: 'daily_cleanup'
} as const;

export enum MSG {
    CHANGE_BG = 'CHANGE_BG'
}

export const MESSAGE_SPEC = {
    // example: provide strict typing for CHANGE_BG
    [MSG.CHANGE_BG]: {
        req: {} as { color: string },
        res: {} as { ok: boolean } // optional
    }

    // add more overrides here...
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
