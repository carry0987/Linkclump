import type { MSG, MESSAGE_SPEC } from '@/shared/constants';

// Build a default message map from MSG keys
export type InferMessageMap<T extends Record<string, string>> = {
    [K in keyof T]: { req?: unknown; res?: unknown };
};

// Merge overrides while keeping defaults for unspecified keys
export type MessageMapOf<
    T extends Record<string, string>,
    O extends Partial<{ [K in keyof T]: { req?: any; res?: any } }>
> = {
    [K in keyof T]: O[K] extends object ? O[K] : { req?: unknown; res?: unknown };
};

// Public message map type used by the bus
export type MessageMap = MessageMapOf<typeof MSG, typeof MESSAGE_SPEC>;
export type Message<T extends string = string, P = unknown> = {
    type: T;
    payload?: P;
};

// Typed storage schema used by createTypedStorage
export interface StorageSchema {
    local: {
        // example keys; adjust to your extension needs
        darkMode: boolean;
        username: string;
    };
    sync: {
        settings: unknown; // Settings object from setting.ts
        version: string;
    };
    // Managed storage is policy-controlled and read-only
    managed: {
        // example keys; adjust to your enterprise policy schema
        orgEnabled: boolean;
        allowedHosts: string[];
    };
    // Session storage is ephemeral (lives with the service worker session)
    session: {
        // example keys; adjust to your extension needs
        lastVisited: string | null;
        tempToken: string | null;
    };
}
