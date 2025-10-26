import { logger } from '@/shared/lib/logger';
import { RESTRICTED } from '@/shared/constants';

chrome.runtime.onStartup.addListener(() => {
    logger.info('[background] Browser startup');
});

/** Check if URL should disable popup/action */
const isRestrictedUrl = (raw?: string | null) => {
    if (!raw) return true;

    // fast-path scheme check (works for custom schemes like chrome://)
    const scheme = raw.split(':', 1)[0]?.toLowerCase();
    if (RESTRICTED.schemes.includes(scheme as any)) return true;

    // http/https host checks
    if (scheme === 'http' || scheme === 'https') {
        try {
            const u = new URL(raw);
            const normalized = `${u.protocol}//${u.host}${u.pathname}`;
            // match against restricted hosts (regex)
            if (RESTRICTED.hosts.some((rx) => rx.test(normalized))) return true;
            return false;
        } catch {
            // failed to parse ⇒ be conservative
            return true;
        }
    }

    // unknown schemes ⇒ conservative deny
    return true;
};

/** Apply enable/disable + popup per tab */
const applyActionPolicy = async (tabId: number, url?: string | null) => {
    if (isRestrictedUrl(url)) {
        // Option A: completely disable the action
        await chrome.action.disable(tabId);
        // Option B (alternative): keep enabled but remove popup
        // await chrome.action.setPopup({ tabId, popup: '' });
    } else {
        await chrome.action.enable(tabId);
        await chrome.action.setPopup({ tabId, popup: 'popup.html' });
    }
};

// On tab activation: check current tab URL
chrome.tabs.onActivated.addListener(async ({ tabId }) => {
    try {
        const tab = await chrome.tabs.get(tabId);
        await applyActionPolicy(tabId, tab.url);
    } catch (e) {
        // If URL not available (e.g., restricted), disable by default
        await applyActionPolicy(tabId, null);
    }
});

// On tab URL update: re-apply policy when URL changes
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' || changeInfo.url) {
        await applyActionPolicy(tabId, changeInfo.url ?? tab.url);
    }
});

// On install: set default popup for all existing tabs
chrome.runtime.onInstalled.addListener(async () => {
    logger.info('[background] Extension installed');
    const tabs = await chrome.tabs.query({});
    await Promise.all(tabs.map((t) => applyActionPolicy(t.id!, t.url)));
});
