// ----------------------------------------------------------------------------
// i18n utilities - Type-safe wrapper around chrome.i18n API
// ----------------------------------------------------------------------------

/**
 * Get localized message by key
 * @param messageName - The name of the message as defined in messages.json
 * @param substitutions - Optional substitutions for placeholders
 * @returns Localized message string
 */
export const t = (messageName: string, substitutions?: string | Array<string | number>): string => {
    return chrome.i18n.getMessage(messageName, substitutions);
};

/**
 * Get the current UI locale (e.g., "en", "zh_TW", "ja")
 * @returns Current locale string
 */
export const getLocale = (): string => {
    return chrome.i18n.getUILanguage();
};

/**
 * Get the Accept-Languages header value
 * @returns Promise resolving to comma-separated locale strings
 */
export const getAcceptLanguages = (): Promise<Array<string>> => {
    return new Promise((resolve) => {
        chrome.i18n.getAcceptLanguages((languages) => resolve(languages));
    });
};

/**
 * Detect user's preferred language from browser settings
 * @returns Promise resolving to detected locale or fallback
 */
export const detectUserLanguage = async (): Promise<string> => {
    const languages = await getAcceptLanguages();
    // Return first language or fallback to UI language
    return languages[0] || getLocale();
};

// Convenience object for common translation patterns
export const i18n = {
    t,
    getLocale,
    getAcceptLanguages,
    detectUserLanguage
};
