import React, { useState, useRef, useEffect } from 'react';
import type { Timeframe } from '../types';

interface TimeframeDropdownProps {
    timeframe: Timeframe;
    onTimeframeChange: (timeframe: Timeframe) => void;
    timeframes: { value: Timeframe; label: string }[];
    disabled?: boolean;
}

const TimeframeDropdown: React.FC<TimeframeDropdownProps> = ({ timeframe, onTimeframeChange, timeframes, disabled = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const handleSelect = (selectedTimeframe: Timeframe) => {
        onTimeframeChange(selectedTimeframe);
        setIsOpen(false);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);
    
    return (
        <div ref={dropdownRef} className="relative">
            <button
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className="bg-dark-bg rounded-lg px-4 py-2 w-full h-[42px] flex items-center justify-between gap-2 border border-dark-border shadow-sm hover:bg-dark-border transition disabled:opacity-50 disabled:cursor-not-allowed"
                aria-haspopup="true"
                aria-expanded={isOpen}
            >
                <span className="text-base font-semibold text-light-text">{timeframe}</span>
                <i className={`fa-solid fa-chevron-down text-xs text-medium-text transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}></i>
            </button>

            {isOpen && (
                <div
                    className="absolute top-full mt-2 w-48 bg-dark-bg/95 backdrop-blur-lg border border-dark-border/50 rounded-xl shadow-2xl p-2 z-50 origin-top md:origin-top-right animate-dropdown-in left-1/2 -translate-x-1/2 md:left-auto md:right-0 md:translate-x-0"
                    role="menu"
                    aria-orientation="vertical"
                >
                    <div className="grid grid-cols-3 gap-1">
                        {timeframes.map(tf => (
                            <button
                                key={tf.value}
                                onClick={() => handleSelect(tf.value)}
                                className={`w-full text-center p-2 rounded-md font-semibold text-sm transition-colors ${
                                    timeframe === tf.value
                                        ? 'bg-primary text-dark-bg'
                                        : 'text-light-text hover:bg-dark-border'
                                }`}
                                role="menuitem"
                            >
                                {tf.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TimeframeDropdown;