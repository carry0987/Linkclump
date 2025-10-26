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

// Linkclump
import type { CopyFormat } from '@/shared/config';

export function formatLink(link: { url: string; title: string }, format: CopyFormat): string {
    const { url, title } = link;
    switch (format) {
        case 0: // URLS_WITH_TITLES
            return `${title}\t${url}\n`;
        case 1: // URLS_ONLY
            return `${url}\n`;
        case 2: // URLS_ONLY_SPACE_SEPARATED
            return `${url} `;
        case 3: // TITLES_ONLY
            return `${title}\n`;
        case 4: // AS_LINK_HTML
            return `<a href="${url}">${title}</a>\n`;
        case 5: // AS_LIST_LINK_HTML
            return `<li><a href="${url}">${title}</a></li>\n`;
        case 6: // AS_MARKDOWN
            return `[${title}](${url})\n`;
        default:
            return `${url}\n`;
    }
}

export function uniqueLinks(links: { url: string; title: string }[]): { url: string; title: string }[] {
    const seen = new Set<string>();

    return links.filter((link) => {
        if (seen.has(link.url)) {
            return false;
        }
        seen.add(link.url);
        return true;
    });
}
