import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const sendToBackground = vi.fn();
const on = vi.fn();

vi.mock('@/shared/lib/messaging', () => ({
    bus: {
        sendToBackground,
        on
    }
}));

describe('content core drag selection', () => {
    beforeEach(() => {
        vi.resetModules();
        sendToBackground.mockReset();
        on.mockReset();
        document.body.innerHTML = '<a href="https://example.com">Example</a>';
        Object.defineProperty(window.navigator, 'userAgent', {
            value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
            configurable: true
        });

        sendToBackground.mockResolvedValue({
            actions: {
                '101': {
                    mouse: 0,
                    key: 'z',
                    action: 'tabs',
                    color: '#FFA500',
                    options: {
                        smart: false,
                        ignore: [0],
                        delay: 0,
                        close: 0,
                        block: true,
                        reverse: false,
                        end: false,
                        openedLinkStyleMode: 'styled',
                        openedLinkColor: '#0f766e'
                    }
                }
            },
            blocked: []
        });
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('shows the selection box when dragging with Z + left mouse', async () => {
        await import('@/content/core');
        await Promise.resolve();

        const mouseDown = new MouseEvent('mousedown', { button: 0, bubbles: true, clientX: 10, clientY: 10 });
        Object.defineProperties(mouseDown, {
            pageX: { value: 10 },
            pageY: { value: 10 }
        });

        const mouseMove = new MouseEvent('mousemove', { button: 0, bubbles: true, clientX: 40, clientY: 40 });
        Object.defineProperties(mouseMove, {
            pageX: { value: 40 },
            pageY: { value: 40 }
        });

        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', bubbles: true }));
        window.dispatchEvent(mouseDown);
        window.dispatchEvent(mouseMove);

        const selectionBox = document.body.querySelector('span');

        expect(sendToBackground).toHaveBeenCalledWith('LINKCLUMP_INIT', {});
        expect(selectionBox).toBeTruthy();
        expect((selectionBox as HTMLSpanElement).style.visibility).toBe('visible');
        expect((selectionBox as HTMLSpanElement).style.border).toBe('2px dotted rgb(255, 165, 0)');
    });
});
