// Content script entry
import { bus } from '@/shared/lib/messaging';
import { MSG } from '@/shared/constants';
import { mount } from '@/shared/lib/dom';
import { render } from 'preact';
import { useEffect, useState } from 'preact/hooks';

const Overlay = () => {
    const [bg, setBg] = useState<string | null>(null);

    useEffect(() => {
        // Listen messages
        const off = bus.on(MSG.CHANGE_BG, (payload) => {
            const color = payload.color;
            if (color) {
                document.body.style.backgroundColor = color;
                setBg(color);
                return { ok: true };
            }

            return { ok: false };
        });

        return () => off(); // cleanup
    }, []);

    if (!bg) return null;

    return (
        <div
            className="fixed top-2 right-2 z-999 rounded-lg bg-gray-900 text-white text-xs px-2 py-1 shadow-lg"
            style={{ opacity: 0.9 }}>
            Background set to {bg}
        </div>
    );
};

// Auto-mount overlay placeholder
const el = mount('ces-overlay');
render(<Overlay />, el);
