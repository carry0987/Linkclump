import type { Settings, Action, ActionType } from '@/shared/config';
import { settingsManager, DEFAULT_SETTINGS, resetIncompatibleOptions } from '@/shared/config';
import { bus } from '@/shared/lib/messaging';
import { MSG } from '@/shared/constants';
import { ColorPicker, ToggleSwitch, Tooltip, InfoIcon, AdvancedOptionFields } from '@/shared/components';
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
    const [expandedActions, setExpandedActions] = useState<Record<string, boolean>>({});

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

    const toggleAdvancedOptions = (id: string) => {
        setExpandedActions((prev) => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const handleActionTypeChange = (id: string, newActionType: ActionType) => {
        const newActions = { ...settings.actions };
        const currentAction = newActions[id];

        // Reset incompatible options when action type changes
        const resetOptions = resetIncompatibleOptions(currentAction.options, newActionType);

        newActions[id] = {
            ...currentAction,
            action: newActionType,
            options: resetOptions
        };

        setSettings({ ...settings, actions: newActions });
    };

    return (
        <div className="max-w-5xl mx-auto">
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-slate-800 mb-2">Linkclump Settings</h1>
                <p className="text-slate-600">Configure your link clumping actions and preferences</p>
            </div>

            <div className="mb-8">
                <h2 className="text-2xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                    </svg>
                    Actions
                </h2>

                <div className="space-y-4">
                    {Object.entries(settings.actions).map(([id, action], index) => (
                        <div
                            key={id}
                            className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 p-6 border border-slate-200">
                            <div className="flex justify-between items-start mb-6">
                                <h3 className="text-lg font-semibold text-slate-800">Action #{index + 1}</h3>
                                <button
                                    onClick={() => deleteAction(id)}
                                    className="bg-red-500 hover:bg-red-600 text-white font-medium px-4 py-2 rounded-lg transition-colors duration-200 text-sm cursor-pointer">
                                    Delete
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <Tooltip content="Choose which mouse button to use for this action. Left button is most common.">
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Mouse Button
                                        </label>
                                    </Tooltip>
                                    <select
                                        value={action.mouse}
                                        onChange={(e) => {
                                            const newActions = { ...settings.actions };
                                            newActions[id].mouse = parseInt((e.target as HTMLSelectElement).value);
                                            setSettings({ ...settings, actions: newActions });
                                        }}
                                        className="w-full px-4 py-3 text-slate-700 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
                                        <option value="0">Left</option>
                                        <option value="1">Middle</option>
                                        <option value="2">Right</option>
                                    </select>
                                </div>

                                <div>
                                    <Tooltip content="Hold this key while clicking to trigger the action. Use (None) if you don't want to require a modifier key.">
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Modifier Key
                                        </label>
                                    </Tooltip>
                                    <select
                                        value={action.key}
                                        onChange={(e) => {
                                            const newActions = { ...settings.actions };
                                            newActions[id].key = (e.target as HTMLSelectElement).value;
                                            setSettings({ ...settings, actions: newActions });
                                        }}
                                        className="w-full px-4 py-3 text-slate-700 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
                                        {Object.entries(getAvailableKeys(action.mouse)).map(([key, keyName]) => (
                                            <option key={key} value={key}>
                                                {keyName}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Action</label>
                                    <select
                                        value={action.action}
                                        onChange={(e) => {
                                            handleActionTypeChange(
                                                id,
                                                (e.target as HTMLSelectElement).value as ActionType
                                            );
                                        }}
                                        className="w-full px-4 py-3 text-slate-700 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
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

                            <div className="flex flex-col gap-3">
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

                            {/* Advanced Options Section */}
                            <div className="mt-4 border-t pt-4">
                                <button
                                    onClick={() => toggleAdvancedOptions(id)}
                                    className="flex items-center justify-between w-full text-left font-medium text-blue-600 hover:text-blue-800 cursor-pointer">
                                    <span>Advanced Options</span>
                                    <span className="text-xl">{expandedActions[id] ? '−' : '+'}</span>
                                </button>

                                {expandedActions[id] && (
                                    <div className="mt-4">
                                        <AdvancedOptionFields
                                            actionType={action.action}
                                            options={action.options}
                                            onChange={(newOptions) => {
                                                const newActions = { ...settings.actions };
                                                newActions[id].options = newOptions;
                                                setSettings({ ...settings, actions: newActions });
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <button
                    onClick={addAction}
                    className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-xl transition-colors duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Add Action
                </button>
            </div>

            <div className="mb-8">
                <h2 className="text-2xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                        />
                    </svg>
                    Blocked Sites
                    <InfoIcon
                        tooltip="Add website patterns where Linkclump should be disabled. Supports regular expressions for advanced matching."
                        position="right"
                    />
                </h2>

                <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
                    <textarea
                        value={settings.blocked.join('\n')}
                        onChange={(e) => {
                            const blocked = (e.target as HTMLTextAreaElement).value.split('\n').filter((s) => s.trim());
                            setSettings({ ...settings, blocked });
                        }}
                        className="w-full h-40 px-4 py-3 text-slate-700 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none font-mono text-sm"
                        placeholder="Enter one pattern per line (regex supported)&#10;Examples:&#10;*.google.com&#10;https://example.com/*&#10;/^https://secure\..*/"></textarea>
                    <p className="text-sm text-slate-500 mt-2">
                        Enter one pattern per line. Supports regex patterns for advanced filtering.
                    </p>
                </div>
            </div>

            <div className="flex justify-end">
                {saved && <span className="text-green-600 self-center mr-5">Settings saved!</span>}
                <button
                    onClick={handleSave}
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-4 rounded-xl transition-colors duration-200 shadow-md hover:shadow-lg flex items-center gap-2 cursor-pointer">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Save Settings
                </button>
            </div>
        </div>
    );
};

render(<OptionsPage />, document.getElementById('root')!);
