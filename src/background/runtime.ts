import { logger } from '@/shared/lib/logger';
import { RESTRICTED } from '@/shared/constants';
import { runMigrations } from '@/shared/lib/migration';

/** Check if URL should disable action */
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

/** Apply enable/disable per tab */
const applyActionPolicy = async (tabId: number, url?: string | null) => {
    if (isRestrictedUrl(url)) {
        await chrome.action.disable(tabId);
    } else {
        await chrome.action.enable(tabId);
    }
};

// On browser startup: log event
chrome.runtime.onStartup.addListener(() => {
    logger.info('[background] Browser startup');
});

// On tab activation: check current tab URL
chrome.tabs.onActivated.addListener(async ({ tabId }) => {
    try {
        const tab = await chrome.tabs.get(tabId);
        await applyActionPolicy(tabId, tab.url);
    } catch (error: any) {
        // Tab might be closed before we can get its info - just ignore it
        if (error?.message?.includes('No tab with id')) {
            logger.debug(`[runtime] Tab ${tabId} closed before activation handler completed`);
            return;
        }
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
chrome.runtime.onInstalled.addListener(async (details) => {
    logger.info(`[background] Extension installed (reason: ${details.reason})`);

    // Run migrations on install or update
    if (details.reason === 'install' || details.reason === 'update') {
        try {
            await runMigrations();
        } catch (error) {
            logger.error('[background] Migration failed:', error);
            // Don't throw - allow extension to continue with potentially incomplete migration
        }
    }

    // Apply action policy to all existing tabs
    const tabs = await chrome.tabs.query({});
    await Promise.allSettled(tabs.map((t) => applyActionPolicy(t.id!, t.url)));
});
