import type { ActionOptions, ActionType, CopyFormat, FilterMode } from '@/shared/config';
import { OPTIONS_CONFIG, ACTIONS_CONFIG } from '@/shared/config';
import { Tooltip, ToggleSwitch } from './';

interface AdvancedOptionFieldsProps {
    actionType: ActionType;
    options: ActionOptions;
    onChange: (options: ActionOptions) => void;
}

export const AdvancedOptionFields = ({ actionType, options, onChange }: AdvancedOptionFieldsProps) => {
    const availableOptions = ACTIONS_CONFIG[actionType].filter((opt) => opt !== 'block' && opt !== 'reverse');

    const updateOption = (key: string, value: any) => {
        onChange({ ...options, [key]: value });
    };

    const renderField = (optionKey: string) => {
        const config = OPTIONS_CONFIG[optionKey];
        if (!config) return null;

        switch (config.type) {
            case 'checkbox': {
                const checked = (options[optionKey as keyof ActionOptions] as boolean) ?? false;
                return (
                    <div key={optionKey} className="flex items-start">
                        <ToggleSwitch
                            checked={checked}
                            onChange={(checked) => updateOption(optionKey, checked)}
                            label={config.name}
                        />
                    </div>
                );
            }

            case 'textbox': {
                const value = (options[optionKey as keyof ActionOptions] as number) ?? 0;
                return (
                    <div key={optionKey}>
                        <Tooltip content={config.extra}>
                            <label className="block text-sm font-medium text-slate-700 mb-2">{config.name}</label>
                        </Tooltip>
                        <input
                            type="number"
                            min="0"
                            step="0.1"
                            value={value}
                            onChange={(e) =>
                                updateOption(optionKey, parseFloat((e.target as HTMLInputElement).value) || 0)
                            }
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                    </div>
                );
            }

            case 'selection': {
                if (optionKey === 'smart') {
                    const value = options.smart ?? false;
                    return (
                        <div key={optionKey}>
                            <Tooltip content={config.extra}>
                                <label className="block text-sm font-medium text-slate-700 mb-2">{config.name}</label>
                            </Tooltip>
                            <select
                                value={value ? 'on' : 'off'}
                                onChange={(e) => updateOption('smart', (e.target as HTMLSelectElement).value === 'on')}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
                                {config.data?.map((option) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                        </div>
                    );
                } else if (optionKey === 'copy') {
                    const value = options.copy ?? 0;
                    return (
                        <div key={optionKey}>
                            <Tooltip content={config.extra}>
                                <label className="block text-sm font-medium text-slate-700 mb-2">{config.name}</label>
                            </Tooltip>
                            <select
                                value={value}
                                onChange={(e) =>
                                    updateOption('copy', parseInt((e.target as HTMLSelectElement).value) as CopyFormat)
                                }
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
                                {config.data?.map((option, index) => (
                                    <option key={option} value={index}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                        </div>
                    );
                }
                break;
            }

            case 'selection-textbox': {
                if (optionKey === 'ignore') {
                    const [mode, keywords] = options.ignore ?? [0, ''];
                    return (
                        <div key={optionKey}>
                            <Tooltip content={config.extra}>
                                <label className="block text-sm font-medium text-slate-700 mb-2">{config.name}</label>
                            </Tooltip>
                            <select
                                value={mode}
                                onChange={(e) => {
                                    const newMode = parseInt((e.target as HTMLSelectElement).value) as FilterMode;
                                    updateOption('ignore', [newMode, keywords]);
                                }}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all mb-1">
                                {config.data?.map((option, index) => (
                                    <option key={option} value={index}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                            <input
                                type="text"
                                value={keywords}
                                onChange={(e) => {
                                    const newKeywords = (e.target as HTMLInputElement).value;
                                    updateOption('ignore', [mode, newKeywords]);
                                }}
                                placeholder="keyword1, keyword2, keyword3"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                        </div>
                    );
                }
                break;
            }
        }

        return null;
    };

    if (availableOptions.length === 0) {
        return null;
    }

    return <div className="space-y-4">{availableOptions.map((optionKey) => renderField(optionKey))}</div>;
};
