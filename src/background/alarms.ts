import { logger } from '@/shared/lib/logger';
import { kv } from '@/shared/lib/storage';
import { typedKeys } from '@/shared/lib/utils';
import { ALARMS } from '@/shared/constants';
import { settingsManager } from '@/shared/config';

const INTERVAL_MIN = 0.1; // 6s polling interval
const DAILY_AT = '08:00'; // local time HH:mm

const ensureAlarm = async (name: string, create: () => void) => {
    const existing = await new Promise<chrome.alarms.Alarm | undefined>((r) => chrome.alarms.get(name, r));
    if (!existing) create();
};

/** Create or restore alarms safely */
export const setupAlarms = async () => {
    await ensureAlarm(ALARMS.POLL, () => {
        chrome.alarms.create(ALARMS.POLL, { periodInMinutes: INTERVAL_MIN });
        logger.info(`[alarms] Created periodic '${ALARMS.POLL}' (${INTERVAL_MIN}min)`);
    });

    await ensureAlarm(ALARMS.DAILY_CLEANUP, () => {
        const [hour, min] = DAILY_AT.split(':').map(Number);
        const now = new Date();
        const first = new Date();
        first.setHours(hour, min, 0, 0);
        if (first <= now) first.setDate(first.getDate() + 1);
        chrome.alarms.create(ALARMS.DAILY_CLEANUP, { when: first.getTime(), periodInMinutes: 24 * 60 });
        logger.info(`[alarms] Created daily '${ALARMS.DAILY_CLEANUP}' at ${DAILY_AT}`);
    });

    // optional: first tick
    try {
        logger.debug('[alarms] POLL first tick (on setup)', new Date().toISOString());
    } catch (err) {
        logger.error('[alarms] first tick error', err);
    }
};

/** Handle alarm events */
chrome.alarms.onAlarm.addListener(async (a) => {
    switch (a.name) {
        case ALARMS.POLL: {
            try {
                logger.debug('[alarms] POLL tick', new Date().toISOString());

                // Example: fetch user settings from storage using settingsManager
                const settings = await settingsManager.load();
                if (settings.likesColor) {
                    logger.debug(`[alarms] User likes color: ${settings.favoriteColor}`);
                }

                // TODO: perform your background task here (e.g., API call, cache cleanup)
            } catch (err) {
                logger.error('[alarms] POLL error', err);
            }
            break;
        }

        case ALARMS.DAILY_CLEANUP: {
            try {
                logger.info('[alarms] Running daily cleanup');
                // use 'session' or 'sync' depending on your schema
                const data = await kv.getAll('session', {});
                for (const k of typedKeys(data)) {
                    if (k.startsWith('temp_')) await kv.remove('session', k);
                }
                logger.info('[alarms] Cleanup complete');
            } catch (err) {
                logger.error('[alarms] DAILY_CLEANUP error', err);
            }
            break;
        }

        default:
            logger.warn(`[alarms] Unknown alarm triggered: ${a.name}`);
    }
});

/** Optional: reinitialize alarms when extension restarts */
chrome.runtime.onStartup.addListener(() => {
    setupAlarms().catch((e) => logger.error('[alarms] setup failed', e));
});

chrome.runtime.onInstalled.addListener(({ reason }) => {
    if (reason === 'install' || reason === 'update') {
        // Clean setup or upgrade
        chrome.alarms.clearAll();
        logger.info(`[alarms] Extension ${reason}, setting up alarms`);
        setupAlarms().catch((e) => logger.error('[alarms] setup failed', e));
    }
});
