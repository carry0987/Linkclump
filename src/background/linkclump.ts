import { bus } from '@/shared/lib/messaging';
import { MSG } from '@/shared/constants';
import { settingsManager } from '@/shared/config';
import { formatLink, uniqueLinks } from '@/shared/lib/utils';
import type { Action } from '@/shared/config';
import type { Link } from '@/shared/types';

// Initialize settings on install or update
chrome.runtime.onInstalled.addListener(async () => {
    await settingsManager.update();
});

// Handle LINKCLUMP_INIT message
bus.on(MSG.LINKCLUMP_INIT, async () => {
    const settings = await settingsManager.load();

    return {
        actions: settings.actions,
        blocked: settings.blocked
    };
});

// Handle LINKCLUMP_UPDATE message
bus.on(MSG.LINKCLUMP_UPDATE, async (payload) => {
    if (payload?.settings) {
        await settingsManager.save(payload.settings);

        // Broadcast update to all tabs
        const tabs = await chrome.tabs.query({});
        for (const tab of tabs) {
            if (tab.id) {
                try {
                    await bus.sendToTab(tab.id, MSG.LINKCLUMP_UPDATE, { settings: payload.settings });
                } catch (error) {
                    // Ignore errors for tabs that don't have content script
                }
            }
        }
    }

    return { ok: true };
});

// Handle LINKCLUMP_ACTIVATE message
bus.on(MSG.LINKCLUMP_ACTIVATE, async (payload, sender) => {
    if (!payload?.urls || !payload?.setting) {
        return { ok: false };
    }

    let urls = (payload.urls || []).filter(
        (link): link is Link => link !== undefined && typeof link.url === 'string' && typeof link.title === 'string'
    );
    const setting = payload.setting as Action;

    // Block duplicate URLs if enabled
    if (setting.options.block) {
        urls = uniqueLinks(urls);
    }

    if (urls.length === 0) {
        return { ok: true };
    }

    // Reverse order if enabled
    if (setting.options.reverse) {
        urls = urls.reverse();
    }

    switch (setting.action) {
        case 'copy':
            await handleCopy(urls, setting, sender.tab?.id);
            break;
        case 'bookmark':
            await handleBookmark(urls);
            break;
        case 'window':
            await handleWindow(urls, setting);
            break;
        case 'tabs':
            await handleTabs(urls, setting, sender.tab?.id);
            break;
    }

    return { ok: true };
});

async function handleCopy(urls: Link[], setting: Action, tabId?: number) {
    let text = '';
    const copyFormat = setting.options.copy || 0;

    for (const link of urls) {
        text += formatLink(link, copyFormat);
    }

    if (copyFormat === 5) {
        // AS_LIST_LINK_HTML
        text = `<ul>\n${text}</ul>\n`;
    }

    // Send the text to content script to copy to clipboard
    if (tabId) {
        try {
            await bus.sendToTab(tabId, MSG.LINKCLUMP_COPY, { text });
        } catch (error) {
            console.error('Failed to send copy message to content script:', error);
        }
    }
}

async function handleBookmark(urls: Link[]) {
    try {
        const bookmarkTree = await chrome.bookmarks.getTree();
        // Use "Other Bookmarks" folder (index 1)
        const otherBookmarks = bookmarkTree[0].children?.[1];

        if (otherBookmarks) {
            const folderName = `Linkclump ${new Date().toLocaleString()}`;
            const folder = await chrome.bookmarks.create({
                parentId: otherBookmarks.id,
                title: folderName
            });

            for (const link of urls) {
                await chrome.bookmarks.create({
                    parentId: folder.id,
                    title: link.title,
                    url: link.url
                });
            }
        }
    } catch (error) {
        console.error('Failed to create bookmarks:', error);
    }
}

async function handleWindow(urls: Link[], setting: Action) {
    try {
        const currentWindow = await chrome.windows.getCurrent();
        const firstUrl = urls.shift();

        if (firstUrl) {
            const newWindow = await chrome.windows.create({
                url: firstUrl.url,
                focused: !setting.options.unfocus
            });

            if (newWindow && urls.length > 0 && newWindow.id) {
                await openTabsSequentially(urls, setting.options.delay || 0, newWindow.id, undefined, null, 0);
            }

            if (setting.options.unfocus && currentWindow.id) {
                await chrome.windows.update(currentWindow.id, { focused: true });
            }
        }
    } catch (error) {
        console.error('Failed to open window:', error);
    }
}

async function handleTabs(urls: Link[], setting: Action, senderTabId?: number) {
    try {
        if (!senderTabId) return;

        const tab = await chrome.tabs.get(senderTabId);
        const currentWindow = await chrome.windows.getCurrent();

        const tabIndex = setting.options.end ? null : tab.index + 1;

        await openTabsSequentially(
            urls,
            setting.options.delay || 0,
            currentWindow.id!,
            tab.id,
            tabIndex,
            setting.options.close || 0
        );
    } catch (error) {
        console.error('Failed to open tabs:', error);
    }
}

async function openTabsSequentially(
    urls: Link[],
    delay: number,
    windowId: number,
    openerTabId: number | undefined,
    tabPosition: number | null,
    closeTime: number
) {
    if (urls.length === 0) return;

    const firstUrl = urls.shift();
    if (!firstUrl) return;

    const createOptions: chrome.tabs.CreateProperties = {
        windowId,
        url: firstUrl.url,
        active: false
    };

    // Only add openerTabId if no delay (to prevent tabs from not opening if opener is closed)
    if (!delay && openerTabId) {
        createOptions.openerTabId = openerTabId;
    }

    if (tabPosition !== null) {
        createOptions.index = tabPosition;
    }

    const newTab = await chrome.tabs.create(createOptions);

    if (closeTime > 0 && newTab.id) {
        setTimeout(() => {
            if (newTab.id) {
                chrome.tabs.remove(newTab.id);
            }
        }, closeTime * 1000);
    }

    if (urls.length > 0) {
        const nextTabPosition = tabPosition !== null ? tabPosition + 1 : null;
        setTimeout(() => {
            openTabsSequentially(urls, delay, windowId, openerTabId, nextTabPosition, closeTime);
        }, delay * 1000);
    }
}
