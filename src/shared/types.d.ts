import type { MSG, MESSAGE_SPEC } from '@/shared/constants';
import type { Settings } from './config';

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

// Structured error response type
export interface ErrorResponse {
    error: {
        message: string;
        code?: string;
        details?: unknown;
    };
}

// Typed storage schema used by createTypedStorage
export interface StorageSchema {
    sync: {
        settings: Settings;
        version: string;
    };
}

// Link-related types
export interface Link {
    url: string;
    title: string;
}

export interface LinkElement extends HTMLAnchorElement {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    width: number;
    height: number;
    box: HTMLElement | null;
    important: boolean;
}
