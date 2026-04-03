import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
    format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
    subMonths, addMonths, isSameDay, isSameMonth, addDays, isWithinInterval, 
    startOfDay, endOfDay, isBefore, isAfter, parse, isValid
} from 'date-fns';
import { Calendar as CalendarIcon, ChevronDown, Check, ChevronLeft, ChevronRight } from 'lucide-react';

const PRESETS = [
    { label: 'Last 7 days', getValue: () => ({ start: startOfDay(subDays(new Date(), 6)), end: endOfDay(new Date()) }) },
    { label: 'Last 14 days', getValue: () => ({ start: startOfDay(subDays(new Date(), 13)), end: endOfDay(new Date()) }) },
    { label: 'Last 28 days', getValue: () => ({ start: startOfDay(subDays(new Date(), 27)), end: endOfDay(new Date()) }) },
    { label: 'Last 30 days', getValue: () => ({ start: startOfDay(subDays(new Date(), 29)), end: endOfDay(new Date()) }) },
    { type: 'divider' },
    { label: 'Today', getValue: () => ({ start: startOfDay(new Date()), end: endOfDay(new Date()) }) },
    { label: 'Yesterday', getValue: () => ({ start: startOfDay(subDays(new Date(), 1)), end: endOfDay(subDays(new Date(), 1)) }) },
    { label: 'Today and yesterday', getValue: () => ({ start: startOfDay(subDays(new Date(), 1)), end: endOfDay(new Date()) }) },
    { label: 'This week', getValue: () => ({ start: startOfWeek(new Date(), { weekStartsOn: 0 }), end: endOfDay(new Date()) }) },
    { label: 'Last week', getValue: () => ({ start: startOfWeek(subDays(startOfWeek(new Date(), { weekStartsOn: 0 }), 1), { weekStartsOn: 0 }), end: endOfDay(endOfWeek(subDays(startOfWeek(new Date(), { weekStartsOn: 0 }), 1), { weekStartsOn: 0 })) }) },
    { label: 'This month', getValue: () => ({ start: startOfMonth(new Date()), end: endOfDay(new Date()) }) },
    { label: 'Last month', getValue: () => ({ start: startOfMonth(subMonths(new Date(), 1)), end: endOfDay(endOfMonth(subMonths(new Date(), 1))) }) },
];

const DateRangePicker = ({ dateRange, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    // Internal State for selection process
    const [tempStart, setTempStart] = useState(dateRange?.start || startOfDay(subDays(new Date(), 29)));
    const [tempEnd, setTempEnd] = useState(dateRange?.end || endOfDay(new Date()));
    const [clickStep, setClickStep] = useState(0); // 0 = ready for start, 1 = ready for end
    const [hoverDate, setHoverDate] = useState(null);
    const [displayMonth, setDisplayMonth] = useState(startOfMonth(dateRange?.start || subDays(new Date(), 29)));
    const [activePreset, setActivePreset] = useState('Last 30 days');
    
    // Bottom controls local state
    const [isCompare, setIsCompare] = useState(false);
    const [leftInput, setLeftInput] = useState(format(tempStart, 'MMM d, yyyy'));
    const [rightInput, setRightInput] = useState(format(tempEnd, 'MMM d, yyyy'));

    // Update inputs when external range changes
    useEffect(() => {
        if (dateRange?.start && dateRange?.end) {
            setTempStart(dateRange.start);
            setTempEnd(dateRange.end);
            setDisplayMonth(startOfMonth(dateRange.start));
            setLeftInput(format(dateRange.start, 'MMM d, yyyy'));
            setRightInput(format(dateRange.end, 'MMM d, yyyy'));
        }
    }, [dateRange, isOpen]); // Sync when opening too

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
                setClickStep(0); // Reset selection state if they click away
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handlePresetClick = (preset) => {
        const range = preset.getValue();
        setTempStart(range.start);
        setTempEnd(range.end);
        setLeftInput(format(range.start, 'MMM d, yyyy'));
        setRightInput(format(range.end, 'MMM d, yyyy'));
        setDisplayMonth(startOfMonth(range.start));
        setActivePreset(preset.label);
        setClickStep(0);
    };

    const handleDayClick = (day) => {
        setActivePreset(null);
        if (clickStep === 0) {
            setTempStart(startOfDay(day));
            setTempEnd(endOfDay(day)); // Temporarily set end to start so UI doesn't visually break
            setLeftInput(format(day, 'MMM d, yyyy'));
            setRightInput(format(day, 'MMM d, yyyy'));
            setClickStep(1);
        } else {
            if (isBefore(day, tempStart)) {
                // If they click a day before start, make that the new start, keep end pending
                setTempStart(startOfDay(day));
                setLeftInput(format(day, 'MMM d, yyyy'));
            } else {
                setTempEnd(endOfDay(day));
                setRightInput(format(day, 'MMM d, yyyy'));
                setClickStep(0);
            }
        }
    };

    const handleDayHover = (day) => {
        if (clickStep === 1) {
            setHoverDate(day);
        }
    };

    const handleMouseLeaveGrid = () => {
        setHoverDate(null);
    };

    const handleUpdate = () => {
        onChange({ start: tempStart, end: tempEnd });
        setIsOpen(false);
    };

    const parseManualInput = (value, isStart) => {
        try {
            const parsed = parse(value, 'MMM d, yyyy', new Date());
            if (isValid(parsed)) {
                if (isStart) {
                    if (isAfter(parsed, tempEnd)) return; // Invalid manual range
                    setTempStart(startOfDay(parsed));
                    setDisplayMonth(startOfMonth(parsed));
                } else {
                    if (isBefore(parsed, tempStart)) return;
                    setTempEnd(endOfDay(parsed));
                }
                setActivePreset(null);
            }
        } catch (e) {
            // Ignore invalid parses while typing
        }
    };

    const renderMonthGrid = (monthDate) => {
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
        const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

        const days = [];
        let day = startDate;
        while (day <= endDate) {
            days.push(day);
            day = addDays(day, 1);
        }

        const currentEnd = clickStep === 1 && hoverDate && isAfter(hoverDate, tempStart) ? hoverDate : tempEnd;

        return (
            <div className="w-[280px]" onMouseLeave={handleMouseLeaveGrid}>
                {/* Month/Year Header */}
                <div className="flex items-center justify-between mb-4">
                    <span className="font-bold text-[--text-main]">
                        {format(monthDate, 'MMM')} <span className="font-normal text-[--text-muted]">{format(monthDate, 'yyyy')}</span>
                    </span>
                    <div className="flex gap-1">
                        <button onClick={() => setDisplayMonth(subMonths(displayMonth, 1))} className="p-1 hover:bg-[--bg-surface] rounded text-[--text-muted] transition-colors"><ChevronLeft size={18} /></button>
                        <button onClick={() => setDisplayMonth(addMonths(displayMonth, 1))} className="p-1 hover:bg-[--bg-surface] rounded text-[--text-muted] transition-colors"><ChevronRight size={18} /></button>
                    </div>
                </div>

                {/* Days of Week */}
                <div className="grid grid-cols-7 mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                        <div key={d} className="text-center text-xs text-[--text-muted] font-medium py-1">{d}</div>
                    ))}
                </div>

                {/* Day Grid */}
                <div className="grid grid-cols-7 gap-y-1">
                    {days.map((day, i) => {
                        const isCurrentMonth = isSameMonth(day, monthDate);
                        const isSelectedStart = isSameDay(day, tempStart);
                        const isSelectedEnd = isSameDay(day, currentEnd);
                        const isInRange = isWithinInterval(day, { start: startOfDay(tempStart), end: endOfDay(currentEnd) });
                        
                        let bgClass = "bg-transparent";
                        let textClass = isCurrentMonth ? "text-[--text-main]" : "text-[--text-muted] opacity-40";
                        let roundedClass = "rounded-none";

                        if (isSelectedStart && isSelectedEnd) {
                            bgClass = "bg-[#f472d0]";
                            textClass = "text-white font-bold";
                            roundedClass = "rounded-lg";
                        } else if (isSelectedStart) {
                            bgClass = "bg-[#f472d0]";
                            textClass = "text-white font-bold";
                            roundedClass = "rounded-l-lg";
                        } else if (isSelectedEnd) {
                            bgClass = "bg-[#f472d0]";
                            textClass = "text-white font-bold";
                            roundedClass = "rounded-r-lg";
                        } else if (isInRange) {
                            bgClass = "bg-[#f472d0]/20";
                            textClass = isCurrentMonth ? "text-[--text-main] font-medium" : "text-[#f472d0] opacity-70";
                        }

                        return (
                            <div key={day.toString()} className={`relative h-9 flex items-center justify-center`}>
                                {/* Background Highlight Span */}
                                {isInRange && !isSelectedStart && !isSelectedEnd && (
                                    <div className={`absolute inset-0 ${bgClass}`}></div>
                                )}
                                {(isSelectedStart && !isSelectedEnd && currentEnd > tempStart) && (
                                    <div className={`absolute right-0 top-0 bottom-0 left-1/2 bg-[#f472d0]/20`}></div>
                                )}
                                {(!isSelectedStart && isSelectedEnd && currentEnd > tempStart) && (
                                    <div className={`absolute left-0 top-0 bottom-0 right-1/2 bg-[#f472d0]/20`}></div>
                                )}

                                <button
                                    onClick={() => handleDayClick(day)}
                                    onMouseEnter={() => handleDayHover(day)}
                                    className={`relative z-10 w-8 h-8 flex items-center justify-center text-sm transition-all
                                        ${textClass} ${roundedClass} 
                                        ${isSelectedStart || isSelectedEnd ? 'bg-[#f472d0]' : 'hover:bg-[#f472d0]/30 rounded-lg'}
                                    `}
                                >
                                    {format(day, 'd')}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
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
                className="flex items-center gap-2 bg-[--bg-surface] border border-[--border] px-3 py-2 rounded-lg hover:border-[#f472d0] transition-colors min-w-[280px] justify-between shadow-sm"
            >
                <div className="flex items-center gap-3 text-[--text-main]">
                    <CalendarIcon size={16} className="text-[#f472d0]" />
                    <span className="text-sm font-medium">{formatDateRange(dateRange)}</span>
                </div>
                <ChevronDown size={14} className="text-[--text-muted]" />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 bg-[--bg-card] border border-[--border] rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col w-[850px] animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex flex-1 min-h-[400px]">
                        {/* Sidebar Presets */}
                        <div className="w-[200px] border-r border-[--border] bg-[--bg-surface]/50 flex flex-col py-2 overflow-y-auto custom-scrollbar">
                            <span className="px-5 py-2 text-xs font-bold uppercase tracking-wider text-[--text-muted]">Recently used</span>
                            {PRESETS.map((preset, idx) => {
                                if (preset.type === 'divider') return <div key={idx} className="h-px bg-[--border] my-2 mx-4"></div>;
                                return (
                                    <button
                                        key={preset.label}
                                        onClick={() => handlePresetClick(preset)}
                                        className="w-full text-left px-5 py-2 hover:bg-[--bg-surface] transition-colors flex items-center gap-3 group"
                                    >
                                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${activePreset === preset.label ? 'border-[#f472d0] bg-transparent' : 'border-[--border] bg-[--bg-app]'}`}>
                                            {activePreset === preset.label && <div className="w-2 h-2 rounded-full bg-[#f472d0]"></div>}
                                        </div>
                                        <span className={`text-sm ${activePreset === preset.label ? 'text-[--text-main] font-medium' : 'text-[--text-muted] group-hover:text-[--text-main]'}`}>
                                            {preset.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Calendar Area */}
                        <div className="flex-1 flex flex-col p-6">
                            <div className="flex justify-between gap-10">
                                {renderMonthGrid(displayMonth)}
                                {renderMonthGrid(addMonths(displayMonth, 1))}
                            </div>
                        </div>
                    </div>

                    {/* Bottom Controls */}
                    <div className="border-t border-[--border] bg-[--bg-surface] px-6 py-4 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-6">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={isCompare} onChange={() => setIsCompare(!isCompare)} className="w-4 h-4 rounded border-[--border] accent-[#f472d0] bg-[--bg-app]" />
                                <span className="text-sm font-medium text-[--text-main]">Compare</span>
                            </label>
                            
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <div className="flex items-center gap-2 bg-[--bg-app] border border-[--border] rounded-lg px-3 py-1.5 min-w-[140px]">
                                        <div className={`w-3 h-3 rounded-full ${isCompare ? 'bg-orange-400' : 'bg-[#f472d0]/50'}`}></div>
                                        <span className="text-sm text-[--text-main] truncate max-w-[100px]">{activePreset || "Custom"}</span>
                                        <ChevronDown size={14} className="text-[--text-muted] ml-auto" />
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <input 
                                        type="text" 
                                        value={leftInput}
                                        onChange={(e) => {
                                            setLeftInput(e.target.value);
                                            parseManualInput(e.target.value, true);
                                        }}
                                        className="bg-[--bg-app] border border-[--border] rounded-lg px-3 py-1.5 text-sm w-[130px] outline-none focus:border-[#f472d0] text-[--text-main]" 
                                    />
                                    <span className="mx-2 text-[--text-muted]">-</span>
                                    <input 
                                        type="text" 
                                        value={rightInput}
                                        onChange={(e) => {
                                            setRightInput(e.target.value);
                                            parseManualInput(e.target.value, false);
                                        }}
                                        className="bg-[--bg-app] border border-[--border] rounded-lg px-3 py-1.5 text-sm w-[130px] outline-none focus:border-[#f472d0] text-[--text-main]" 
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <span className="text-xs text-[--text-muted]">Dates are shown in Local Time</span>
                            <div className="flex gap-2">
                                <button onClick={() => setIsOpen(false)} className="px-4 py-1.5 text-sm font-medium border border-[--border] hover:bg-[--bg-app] text-[--text-main] rounded-lg transition-colors">Cancel</button>
                                <button onClick={handleUpdate} className="px-4 py-1.5 text-sm font-medium bg-[#f472d0] text-white rounded-lg hover:bg-[#f472d0]/90 transition-colors">Update</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DateRangePicker;
