import { Fragment } from 'preact';
import { useState } from 'preact/hooks';
import { Sketch, type ColorResult } from '@uiw/react-color';

interface ColorPickerProps {
    color: string;
    onChange: (color: string) => void;
    label?: string;
}

export const ColorPicker = ({ color, onChange, label }: ColorPickerProps) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleColorChange = (colorResult: ColorResult) => {
        onChange(colorResult.hex);
    };

    return (
        <Fragment>
            {label && <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>}
            <div className="relative">
                <div
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-slate-700 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
                    <div className="w-4 h-4 rounded border" style={{ backgroundColor: color }} />
                    <span>{color}</span>
                </div>
                {isOpen && (
                    <div className="absolute z-10 mt-2">
                        <div className="fixed inset-0" onClick={() => setIsOpen(false)} />
                        <div className="relative">
                            <Sketch color={color} onChange={handleColorChange} />
                        </div>
                    </div>
                )}
            </div>
        </Fragment>
    );
};
