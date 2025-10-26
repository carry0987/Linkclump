/** ------------------------------------------------------------------------
 * Typed Object / Array Helpers
 * ------------------------------------------------------------------------ */

/** Return Object.keys() but preserves keyof type (no string widening). */
export const typedKeys = <T extends object>(obj: T) => Object.keys(obj) as Array<keyof T>;

/** Return Object.entries() with full type inference. */
export const typedEntries = <T extends object>(obj: T) => Object.entries(obj) as Array<[keyof T, T[keyof T]]>;

/** Return Object.values() with correct value types. */
export const typedValues = <T extends object>(obj: T) => Object.values(obj) as Array<T[keyof T]>;

/** Narrow array literal to tuple (useful for fixed-length const arrays). */
export const tuple = <T extends string | number | symbol, const A extends T[]>(...args: A) => args;

/** Create a Set with literal type preservation. */
export const literalSet = <T extends string | number | symbol>(...args: T[]) => new Set<T>(args);
