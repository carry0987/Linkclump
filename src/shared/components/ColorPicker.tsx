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
        <div>
            {label && <label className="block text-sm font-medium mb-1">{label}</label>}
            <div className="relative">
                <div
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full border rounded px-3 py-2 cursor-pointer flex items-center gap-2">
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
        </div>
    );
};
