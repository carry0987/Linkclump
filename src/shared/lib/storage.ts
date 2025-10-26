import type { StorageSchema } from '@/shared/types';

// ----------------------------------------------------------------------------
// Typed KV storage with 4 areas: local | sync | managed | session
// ----------------------------------------------------------------------------

// All possible Chrome storage areas
type AllAreas = 'local' | 'sync' | 'managed' | 'session';
// From a given schema S, compute valid areas (keys intersect AllAreas)
type AreasOf<S> = Extract<keyof S, AllAreas>;
type ValueOf<T, K extends keyof T> = T[K];
type StrictPartial<T> = { [K in keyof T]?: T[K] };

// Map area name to chrome.storage bucket
const areaOf = (area: AllAreas) => {
    switch (area) {
        case 'local':
            return chrome.storage.local;
        case 'sync':
            return chrome.storage.sync;
        case 'managed':
            return chrome.storage.managed; // read-only
        case 'session':
            return chrome.storage.session; // ephemeral
    }
};

// Factory that binds to your schema S
export function createTypedStorage<S extends Partial<Record<AllAreas, Record<string, any>>>>() {
    // Narrow Area to only those present in S
    type Area = AreasOf<S>;

    // -------------------------
    // get() overloads & impl
    // -------------------------

    // get with fallback: value is guaranteed
    function get<A extends Area, K extends keyof S[A]>(
        area: A,
        key: K,
        fallback: ValueOf<S[A], K>
    ): Promise<ValueOf<S[A], K>>;

    // get without fallback: value may be undefined
    function get<A extends Area, K extends keyof S[A]>(area: A, key: K): Promise<ValueOf<S[A], K> | undefined>;

    // implementation
    async function get(area: AllAreas, key: string, fallback?: unknown): Promise<unknown> {
        const bucket = areaOf(area);
        const result = await new Promise<Record<string, unknown>>((resolve) => {
            // if no fallback provided, query key only (no default injection)
            if (typeof fallback === 'undefined') {
                bucket.get([key], (v) => resolve(v));
            } else {
                bucket.get({ [key]: fallback }, (v) => resolve(v));
            }
        });

        return result[key];
    }

    // -------------------------
    // getAll() overloads & impl
    // -------------------------

    // getAll with defaults: fully shaped object
    function getAll<A extends Area>(area: A, defaults: Partial<S[A]>): Promise<S[A]>;

    // getAll without defaults: partial object (only stored keys)
    function getAll<A extends Area>(area: A): Promise<Partial<S[A]>>;

    // implementation
    async function getAll(area: AllAreas, defaults?: Record<string, unknown>): Promise<Record<string, unknown>> {
        const bucket = areaOf(area);
        const result = await new Promise<Record<string, unknown>>((resolve) => {
            // Chrome API: get(null/undefined) returns all items
            bucket.get((defaults ?? undefined) as any, (v) => resolve(v));
        });

        return result;
    }

    // -------------------------
    // set() overloads & impl
    // -------------------------

    // Allowed: local | sync | session
    function set<A extends Exclude<Area, 'managed'>, K extends keyof S[A]>(
        area: A,
        key: K,
        value: ValueOf<S[A], K>
    ): Promise<void>;

    // Forbidden: managed (compile-time)
    function set(area: Extract<'managed', Area>, key: never, value: never): Promise<never>;

    // Implementation
    async function set(area: AllAreas, key: string, value: unknown): Promise<void> {
        if (area === 'managed') {
            // Runtime guard (should be unreachable if types are respected)
            throw new Error('[storage.managed] set is not allowed (read-only by policy).');
        }
        const bucket = areaOf(area);
        await new Promise<void>((resolve) => bucket.set({ [key]: value }, () => resolve()));
    }

    // ----------------------------
    // setAll() overloads & impl
    // ----------------------------

    // Allowed: local | sync | session
    function setAll<A extends Exclude<Area, 'managed'>>(area: A, items: StrictPartial<S[A]>): Promise<void>;

    // Forbidden: managed (compile-time)
    function setAll(area: Extract<'managed', Area>, items: never): Promise<never>;

    // Implementation
    async function setAll(area: AllAreas, items: Record<string, unknown>): Promise<void> {
        if (area === 'managed') {
            // Runtime guard
            throw new Error('[storage.managed] setAll is not allowed (read-only by policy).');
        }
        const bucket = areaOf(area);
        await new Promise<void>((resolve) => bucket.set(items, () => resolve()));
    }

    // ----------------------------
    // remove() overloads & impl
    // ----------------------------

    // Allowed: local | sync | session
    function remove<A extends Exclude<Area, 'managed'>, K extends keyof S[A]>(area: A, key: K | K[]): Promise<void>;

    // Forbidden: managed (compile-time)
    function remove(area: Extract<'managed', Area>, key: never): Promise<never>;

    // Implementation
    async function remove(area: AllAreas, key: string | string[]): Promise<void> {
        if (area === 'managed') {
            // Runtime guard
            throw new Error('[storage.managed] remove is not allowed (read-only by policy).');
        }
        const bucket = areaOf(area);
        const keys = Array.isArray(key) ? key : [key];
        await new Promise<void>((resolve) => bucket.remove(keys, () => resolve()));
    }

    // Watch a single key change with strong typing
    const watch = <A extends Area, K extends keyof S[A]>(
        area: A,
        key: K,
        cb: (current: ValueOf<S[A], K> | undefined, previous: ValueOf<S[A], K> | undefined) => void
    ) => {
        const handler = (changes: { [k: string]: chrome.storage.StorageChange }, areaName: AllAreas) => {
            if ((areaName as Area) !== area) return;
            const change = changes[key as string];
            if (!change) return;
            cb(change.newValue as any, change.oldValue as any);
        };
        chrome.storage.onChanged.addListener(handler);
        return () => chrome.storage.onChanged.removeListener(handler);
    };

    return { get, getAll, set, setAll, remove, watch };
}

// Export a concrete typed instance bound to your schema
export const kv = createTypedStorage<StorageSchema>();
