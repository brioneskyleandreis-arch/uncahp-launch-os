import React, { useState, useRef, useEffect } from 'react';
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, subMonths, isSameDay, parseISO } from 'date-fns';
import { Calendar as CalendarIcon, ChevronDown, Check } from 'lucide-react';

const PRESETS = [
    { label: 'Yesterday', getValue: () => ({ start: subDays(new Date(), 1), end: subDays(new Date(), 1) }) },
    { label: 'Last 7 days', getValue: () => ({ start: subDays(new Date(), 7), end: new Date() }) },
    { label: 'Last 14 days', getValue: () => ({ start: subDays(new Date(), 14), end: new Date() }) },
    { label: 'Last 30 days', getValue: () => ({ start: subDays(new Date(), 30), end: new Date() }) },
    { label: 'This month', getValue: () => ({ start: startOfMonth(new Date()), end: new Date() }) },
    { label: 'Last month', getValue: () => ({ start: startOfMonth(subMonths(new Date(), 1)), end: endOfMonth(subMonths(new Date(), 1)) }) },
];

const DateRangePicker = ({ dateRange, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [showCustom, setShowCustom] = useState(false);
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const containerRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handlePresetClick = (preset) => {
        onChange(preset.getValue());
        setIsOpen(false);
    };

    const formatDateRange = (range) => {
        if (!range || !range.start) return 'Select Date Range';
        const startStr = format(range.start, 'MMM d, yyyy');
        const endStr = range.end ? format(range.end, 'MMM d, yyyy') : '';
        return range.end && !isSameDay(range.start, range.end) ? `${startStr} - ${endStr}` : startStr;
    };

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 bg-[--bg-surface] border border-[--border] px-3 py-2 rounded-lg hover:border-[--primary] transition-colors min-w-[240px] justify-between"
            >
                <div className="flex items-center gap-2 text-[--text-main]">
                    <CalendarIcon size={16} className="text-[--text-muted]" />
                    <span className="text-sm font-medium">{formatDateRange(dateRange)}</span>
                </div>
                <ChevronDown size={14} className="text-[--text-muted]" />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-[--bg-card] border border-[--border] rounded-lg shadow-xl z-50 overflow-hidden">
                    <div className="py-1">
                        {PRESETS.map((preset) => (
                            <button
                                key={preset.label}
                                onClick={() => handlePresetClick(preset)}
                                className="w-full text-left px-4 py-2 text-sm hover:bg-[--bg-surface] hover:text-[--primary] transition-colors flex items-center justify-between group"
                            >
                                <span className="text-[--text-main] group-hover:text-[--primary]">{preset.label}</span>
                                {dateRange && dateRange.start && dateRange.end &&
                                    isSameDay(dateRange.start, preset.getValue().start) &&
                                    isSameDay(dateRange.end, preset.getValue().end) && (
                                        <Check size={14} className="text-[--primary]" />
                                    )}
                            </button>
                        ))}

                        {/* Custom Date Range Toggle */}
                        <div className="border-t border-[--border] mt-1 pt-1">
                            <button
                                onClick={() => setShowCustom(!showCustom)}
                                className="w-full text-left px-4 py-2 text-sm hover:bg-[--bg-surface] hover:text-[--primary] transition-colors flex items-center justify-between group"
                            >
                                <span className="text-[--text-main] group-hover:text-[--primary]">Custom Range</span>
                                <ChevronDown size={14} className={`text-[--text-muted] transition-transform ${showCustom ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Custom Date Inputs */}
                            {showCustom && (
                                <div className="px-4 py-3 bg-[--bg-surface]/30 border-t border-[--border] mt-1">
                                    <div className="flex flex-col gap-3">
                                        <div>
                                            <label className="text-xs text-[--text-muted] mb-1 block">Start Date</label>
                                            <input
                                                type="date"
                                                value={customStart}
                                                onChange={(e) => setCustomStart(e.target.value)}
                                                className="w-full bg-[--bg-card] border border-[--border] rounded p-1.5 text-sm outline-none focus:border-[--primary] text-[--text-main] appearance-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-[--text-muted] mb-1 block">End Date</label>
                                            <input
                                                type="date"
                                                value={customEnd}
                                                onChange={(e) => setCustomEnd(e.target.value)}
                                                className="w-full bg-[--bg-card] border border-[--border] rounded p-1.5 text-sm outline-none focus:border-[--primary] text-[--text-main] appearance-none"
                                            />
                                        </div>
                                        <button
                                            onClick={() => {
                                                if (customStart && customEnd) {
                                                    onChange({ start: parseISO(customStart), end: parseISO(customEnd) });
                                                    setIsOpen(false);
                                                }
                                            }}
                                            disabled={!customStart || !customEnd}
                                            className="w-full btn btn-primary py-1.5 text-xs disabled:opacity-50 disabled:cursor-not-allowed justify-center"
                                        >
                                            Apply
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    {/* Custom range implementation can be added here if needed, keeping it simple for now */}
                </div>
            )}
        </div>
    );
};

export default DateRangePicker;
