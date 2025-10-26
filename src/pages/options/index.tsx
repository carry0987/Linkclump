import { settingsManager, type Settings } from '@/shared/config';
import { render } from 'preact';
import { useEffect, useState } from 'preact/hooks';

// Import styles
import '@/shared/styles.css';

const Options = () => {
    const [settings, setSettings] = useState<Settings | null>(null);
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(true);
    const [isLatestVersion, setIsLatestVersion] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                // Ensure settings are initialized
                await settingsManager.update();
                const loadedSettings = await settingsManager.load();
                const latest = await settingsManager.isLatest();
                setSettings(loadedSettings);
                setIsLatestVersion(latest);
            } catch (error) {
                console.error('Failed to load settings:', error);
                setStatus('❌ Failed to load settings');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const saveOptions = async () => {
        if (!settings) return;

        try {
            await settingsManager.save(settings);
            setStatus('✅ Options saved');
            const id = window.setTimeout(() => setStatus(''), 1200);
            void id;
        } catch (error) {
            console.error('Failed to save settings:', error);
            setStatus('❌ Failed to save settings');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-surface dark:bg-(--color-surface-dark) text-gray-900 dark:text-gray-100 flex items-center justify-center p-6">
                <div className="text-center">Loading...</div>
            </div>
        );
    }

    if (!settings) {
        return (
            <div className="min-h-screen bg-surface dark:bg-(--color-surface-dark) text-gray-900 dark:text-gray-100 flex items-center justify-center p-6">
                <div className="text-center text-red-500">Failed to load settings</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface dark:bg-(--color-surface-dark) text-gray-900 dark:text-gray-100 flex items-center justify-center p-6">
            <div className="w-full max-w-md card space-y-6">
                <header>
                    <h1 className="card-header">Extension Options</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Manage your extension preferences. Version: {isLatestVersion ? '✅ Latest' : '⚠️ Needs update'}
                    </p>
                </header>

                <section className="space-y-4">
                    <div>
                        <label className="block mb-1 text-sm font-medium text-gray-600 dark:text-gray-300">
                            Favorite color
                        </label>
                        <select
                            className="input"
                            value={settings.favoriteColor}
                            onChange={(e) => setSettings({ ...settings, favoriteColor: e.currentTarget.value })}>
                            <option value="red">Red</option>
                            <option value="green">Green</option>
                            <option value="blue">Blue</option>
                            <option value="yellow">Yellow</option>
                            <option value="purple">Purple</option>
                            <option value="orange">Orange</option>
                        </select>
                    </div>

                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={settings.likesColor}
                            onChange={(e) => setSettings({ ...settings, likesColor: e.currentTarget.checked })}
                            className="size-4 accent-primary"
                        />
                        <span>I like colors.</span>
                    </label>
                </section>

                <footer className="flex justify-end items-center gap-3 pt-2">
                    <div className="text-sm text-green-600 dark:text-green-400 h-5">{status}</div>
                    <button onClick={saveOptions} className="btn-primary">
                        Save
                    </button>
                </footer>
            </div>
        </div>
    );
};

render(<Options />, document.getElementById('root')!);
