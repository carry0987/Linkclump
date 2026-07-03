import { describe, expect, it } from 'vitest';
import {
    ActionType,
    customMigrations,
    DEFAULT_SETTINGS,
    MouseButton,
    OpenedLinkStyleMode,
    resetIncompatibleOptions,
    type Settings
} from '@/shared/config';

describe('config', () => {
    it('defaults tab actions to opened-link styling options', () => {
        expect(DEFAULT_SETTINGS.actions['101']?.options.openedLinkStyleMode).toBe(OpenedLinkStyleMode.STYLED);
        expect(DEFAULT_SETTINGS.actions['101']?.options.openedLinkColor).toBe('#0f766e');
    });

    it('preserves opened-link styling options for tab actions when resetting incompatible options', () => {
        const options = resetIncompatibleOptions(
            {
                block: true,
                reverse: false,
                end: true,
                delay: 1,
                close: 5,
                openedLinkStyleMode: OpenedLinkStyleMode.CLASS_ONLY,
                openedLinkColor: '#123456'
            },
            ActionType.TABS
        );

        expect(options.openedLinkStyleMode).toBe(OpenedLinkStyleMode.CLASS_ONLY);
        expect(options.openedLinkColor).toBe('#123456');
        expect(options.end).toBe(true);
        expect(options.delay).toBe(1);
        expect(options.close).toBe(5);
    });

    it('adds default opened-link styling options when switching back to tab actions', () => {
        const options = resetIncompatibleOptions(
            {
                block: true,
                reverse: true
            },
            ActionType.TABS
        );

        expect(options.openedLinkStyleMode).toBe(OpenedLinkStyleMode.STYLED);
        expect(options.openedLinkColor).toBe('#0f766e');
    });

    it('migrates stored tab actions without opened-link settings', async () => {
        const migration = customMigrations.find((entry) => entry.version === '1.4.0');
        const settings: Settings = {
            actions: {
                '101': {
                    mouse: MouseButton.LEFT,
                    key: 'z',
                    action: ActionType.TABS,
                    color: '#FFA500',
                    options: {
                        block: true,
                        reverse: false,
                        end: false,
                        delay: 0,
                        close: 0
                    }
                },
                '102': {
                    mouse: MouseButton.RIGHT,
                    key: 'x',
                    action: ActionType.COPY,
                    color: '#00FF00',
                    options: {
                        block: false,
                        reverse: false
                    }
                }
            },
            blocked: []
        };

        const result = await migration?.migrate({
            currentVersion: '1.4.0',
            storedVersion: '1.3.0',
            getStorage: async <T = unknown>(_area: 'sync' | 'local', _key: string) => settings as T,
            getAllStorage: async () => ({ settings })
        });

        const migratedSettings = result?.sync?.settings as Settings | undefined;
        expect(migratedSettings?.actions['101']?.options.openedLinkStyleMode).toBe(OpenedLinkStyleMode.STYLED);
        expect(migratedSettings?.actions['101']?.options.openedLinkColor).toBe('#0f766e');
        expect(migratedSettings?.actions['102']?.options.openedLinkStyleMode).toBeUndefined();
    });
});
