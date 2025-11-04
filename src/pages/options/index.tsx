import type { Settings, Action, ActionType } from '@/shared/config';
import { settingsManager, DEFAULT_SETTINGS } from '@/shared/config';
import { bus } from '@/shared/lib/messaging';
import { MSG } from '@/shared/constants';
import { ColorPicker, ToggleSwitch, Tooltip, InfoIcon } from '@/shared/components';
import { render } from 'preact';
import { useEffect, useState } from 'preact/hooks';

// Import styles
import '@/shared/styles.css';

// Helper function to get available keys based on mouse button and OS
const getAvailableKeys = (mouseButton: number) => {
    const keys: Record<string, string> = {};

    // Modifier keys
    keys['Shift'] = 'Shift';
    keys['Control'] = 'Ctrl';

    // Note: On Linux, Alt is typically reserved for window management
    // We'll include it for now, but you may want to detect OS if needed
    keys['Alt'] = 'Alt';

    // Allow no key for left button and on Windows for right button
    // For simplicity, we'll allow no key for all mouse buttons
    keys[''] = '(None)';

    // Add A-Z keys (a-z)
    for (let i = 0; i < 26; i++) {
        const char = String.fromCharCode(97 + i); // lowercase
        keys[char] = char.toUpperCase();
    }

    return keys;
};

const OptionsPage = () => {
    const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const result = await settingsManager.load();
                if (result) {
                    setSettings(result);
                }
            } catch (error) {
                console.error('Failed to load settings:', error);
            }
        };

        loadSettings();
    }, []);

    const handleSave = async () => {
        await settingsManager.save(settings);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);

        // Notify all tabs about settings update
        await bus.sendToBackground(MSG.LINKCLUMP_UPDATE, { settings });
    };

    const addAction = () => {
        const newId = String(Date.now());
        const newAction: Action = {
            mouse: 0,
            key: 'z',
            action: 'tabs' as ActionType,
            color: '#FFA500',
            options: {
                smart: false,
                ignore: [0],
                delay: 0,
                close: 0,
                block: true,
                reverse: false,
                end: false
            }
        };

        setSettings({
            ...settings,
            actions: {
                ...settings.actions,
                [newId]: newAction
            }
        });
    };

    const deleteAction = (id: string) => {
        const newActions = { ...settings.actions };
        delete newActions[id];
        setSettings({ ...settings, actions: newActions });
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">Linkclump Settings</h1>

                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">Actions</h2>

                    {Object.entries(settings.actions).map(([id, action], index) => (
                        <div key={id} className="border rounded p-4 mb-4">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-lg font-semibold">Action #{index + 1}</h3>
                                <button
                                    onClick={() => deleteAction(id)}
                                    className="bg-red-600 border-red-600 border rounded-full inline-flex items-center justify-center py-2 px-6 text-center text-base font-medium text-white hover:bg-red-800 hover:border-red-800 cursor-pointer">
                                    Delete
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Tooltip content="Choose which mouse button to use for this action. Left button is most common.">
                                        <label className="block text-sm font-medium mb-1">Mouse Button</label>
                                    </Tooltip>
                                    <select
                                        value={action.mouse}
                                        onChange={(e) => {
                                            const newActions = { ...settings.actions };
                                            newActions[id].mouse = parseInt((e.target as HTMLSelectElement).value);
                                            setSettings({ ...settings, actions: newActions });
                                        }}
                                        className="w-full border rounded px-3 py-2">
                                        <option value="0">Left</option>
                                        <option value="1">Middle</option>
                                        <option value="2">Right</option>
                                    </select>
                                </div>

                                <div>
                                    <Tooltip content="Hold this key while clicking to trigger the action. Use (None) if you don't want to require a modifier key.">
                                        <label className="block text-sm font-medium mb-1">Modifier Key</label>
                                    </Tooltip>
                                    <select
                                        value={action.key}
                                        onChange={(e) => {
                                            const newActions = { ...settings.actions };
                                            newActions[id].key = (e.target as HTMLSelectElement).value;
                                            setSettings({ ...settings, actions: newActions });
                                        }}
                                        className="w-full border rounded px-3 py-2">
                                        {Object.entries(getAvailableKeys(action.mouse)).map(([key, keyName]) => (
                                            <option key={key} value={key}>
                                                {keyName}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Action</label>
                                    <select
                                        value={action.action}
                                        onChange={(e) => {
                                            const newActions = { ...settings.actions };
                                            newActions[id].action = (e.target as HTMLSelectElement).value as any;
                                            setSettings({ ...settings, actions: newActions });
                                        }}
                                        className="w-full border rounded px-3 py-2">
                                        <option value="tabs">Open as Tabs</option>
                                        <option value="window">Open in New Window</option>
                                        <option value="copy">Copy to Clipboard</option>
                                        <option value="bookmark">Bookmark</option>
                                    </select>
                                </div>

                                <div>
                                    <ColorPicker
                                        label="Color"
                                        color={action.color}
                                        onChange={(newColor) => {
                                            const newActions = { ...settings.actions };
                                            newActions[id].color = newColor;
                                            setSettings({ ...settings, actions: newActions });
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="mt-4 space-y-3">
                                <Tooltip content="Prevents opening the same link multiple times if you accidentally select it twice.">
                                    <ToggleSwitch
                                        checked={action.options.block ?? false}
                                        onChange={(checked) => {
                                            const newActions = { ...settings.actions };
                                            newActions[id].options.block = checked;
                                            setSettings({ ...settings, actions: newActions });
                                        }}
                                        label="Block duplicate links"
                                    />
                                </Tooltip>

                                <Tooltip content="Opens links in reverse order (last selected link opens first).">
                                    <ToggleSwitch
                                        checked={action.options.reverse ?? false}
                                        onChange={(checked) => {
                                            const newActions = { ...settings.actions };
                                            newActions[id].options.reverse = checked;
                                            setSettings({ ...settings, actions: newActions });
                                        }}
                                        label="Reverse order"
                                    />
                                </Tooltip>
                            </div>
                        </div>
                    ))}

                    <button
                        onClick={addAction}
                        className="w-full bg-blue-500 text-white rounded px-4 py-2 hover:bg-blue-600 cursor-pointer">
                        Add Action
                    </button>
                </div>

                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">
                        Blocked Sites
                        <InfoIcon
                            tooltip="Add website patterns where Linkclump should be disabled. Supports regular expressions for advanced matching."
                            position="right"
                        />
                    </h2>
                    <textarea
                        value={settings.blocked.join('\n')}
                        onChange={(e) => {
                            const blocked = (e.target as HTMLTextAreaElement).value.split('\n').filter((s) => s.trim());
                            setSettings({ ...settings, blocked });
                        }}
                        placeholder="Enter one pattern per line (regex supported)&#10;Examples:&#10;*.google.com&#10;https://example.com/*&#10;/^https://secure\..*/"
                        className="w-full border rounded px-3 py-2 h-32"
                    />
                </div>

                <div className="flex justify-end gap-4">
                    {saved && <span className="text-green-600 self-center">Settings saved!</span>}
                    <button
                        onClick={handleSave}
                        className="bg-green-500 text-white rounded px-6 py-2 hover:bg-green-600">
                        Save Settings
                    </button>
                </div>
            </div>
        </div>
    );
};

render(<OptionsPage />, document.getElementById('root')!);
