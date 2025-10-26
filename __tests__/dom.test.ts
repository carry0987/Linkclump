import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mount } from '@/shared/lib/dom';

describe('DOM Utils', () => {
    beforeEach(() => {
        // Clean up document body before each test
        document.body.innerHTML = '';
    });

    afterEach(() => {
        // Clean up after each test
        document.body.innerHTML = '';
    });

    describe('mount()', () => {
        it('should create and append element with default id', () => {
            const el = mount();

            expect(el).toBeInstanceOf(HTMLDivElement);
            expect(el.id).toBe('ces-root');
            expect(document.body.contains(el)).toBe(true);
        });

        it('should create and append element with custom id', () => {
            const customId = 'custom-root';
            const el = mount(customId);

            expect(el.id).toBe(customId);
            expect(document.body.contains(el)).toBe(true);
        });

        it('should return existing element if already mounted', () => {
            const firstCall = mount('test-root');
            const secondCall = mount('test-root');

            expect(firstCall).toBe(secondCall);
            expect(document.querySelectorAll('#test-root')).toHaveLength(1);
        });

        it('should append to document.body', () => {
            const el = mount('body-test');

            expect(el.parentElement).toBe(document.body);
        });

        it('should handle multiple different mounts', () => {
            const el1 = mount('root-1');
            const el2 = mount('root-2');
            const el3 = mount('root-3');

            expect(el1.id).toBe('root-1');
            expect(el2.id).toBe('root-2');
            expect(el3.id).toBe('root-3');
            expect(document.body.children).toHaveLength(3);
        });

        it('should preserve existing element content', () => {
            const el = mount('preserve-test');
            el.innerHTML = '<span>Content</span>';

            const elAgain = mount('preserve-test');

            expect(elAgain.innerHTML).toBe('<span>Content</span>');
        });
    });
});
