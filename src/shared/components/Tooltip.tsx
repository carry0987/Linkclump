import { useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';

interface TooltipProps {
    content: string;
    children: ComponentChildren;
    position?: 'top' | 'bottom' | 'left' | 'right';
    className?: string;
}

export const Tooltip = ({ content, children, position = 'top', className = '' }: TooltipProps) => {
    const [isVisible, setIsVisible] = useState(false);

    const getTooltipClasses = () => {
        const baseClasses =
            'absolute z-50 px-3 py-2 text-sm bg-gray-900 text-white rounded-lg shadow-lg whitespace-nowrap transition-opacity duration-200';

        const positionClasses = {
            top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
            bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
            left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
            right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
        };

        const arrowClasses = {
            top: 'after:content-[""] after:absolute after:top-full after:left-1/2 after:transform after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-gray-900',
            bottom: 'after:content-[""] after:absolute after:bottom-full after:left-1/2 after:transform after:-translate-x-1/2 after:border-4 after:border-transparent after:border-b-gray-900',
            left: 'after:content-[""] after:absolute after:left-full after:top-1/2 after:transform after:-translate-y-1/2 after:border-4 after:border-transparent after:border-l-gray-900',
            right: 'after:content-[""] after:absolute after:right-full after:top-1/2 after:transform after:-translate-y-1/2 after:border-4 after:border-transparent after:border-r-gray-900'
        };

        return `${baseClasses} ${positionClasses[position]} ${arrowClasses[position]} ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`;
    };

    return (
        <div className={'block'}>
            <div
                className={[`relative inline-block`, className].join(' ').trim()}
                onMouseEnter={() => setIsVisible(true)}
                onMouseLeave={() => setIsVisible(false)}>
                {children}
                <div className={getTooltipClasses()}>{content}</div>
            </div>
        </div>
    );
};
