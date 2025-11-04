interface ToggleSwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: string;
    disabled?: boolean;
    size?: 'sm' | 'md' | 'lg';
    colorOn?: string;
    colorOff?: string;
}

export const ToggleSwitch = ({
    checked,
    onChange,
    label,
    disabled = false,
    size = 'md',
    colorOn = '#3b82f6',
    colorOff = '#d1d5db'
}: ToggleSwitchProps) => {
    const handleChange = () => {
        if (!disabled) {
            onChange(!checked);
        }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onChange(!checked);
        }
    };

    // Size configurations
    const sizeConfig = {
        sm: {
            track: 'h-5 w-9',
            thumb: 'h-4 w-4',
            translate: 'translate-x-4'
        },
        md: {
            track: 'h-6 w-11',
            thumb: 'h-5 w-5',
            translate: 'translate-x-5'
        },
        lg: {
            track: 'h-8 w-14',
            thumb: 'h-6 w-6',
            translate: 'translate-x-6'
        }
    };

    const config = sizeConfig[size];

    return (
        <label className={`flex items-center gap-3 ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
            <div className="relative">
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    disabled={disabled}
                    className="sr-only"
                    role="switch"
                    aria-checked={checked}
                    aria-label={label || 'Toggle switch'}
                />
                <div
                    className={`box block ${config.track} rounded-full transition-colors duration-200 ease-in-out`}
                    style={{ backgroundColor: checked ? colorOn : colorOff }}
                ></div>
                <div
                    className={`absolute left-0.5 top-0.5 flex ${config.thumb} items-center justify-center rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out ${
                        checked ? config.translate : 'translate-x-0'
                    }`}
                ></div>
            </div>
            {label && (
                <span className={`select-none text-sm font-medium ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>
                    {label}
                </span>
            )}
        </label>
    );
};
