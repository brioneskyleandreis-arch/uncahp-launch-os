import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Settings as SettingsIcon, Calendar, Save, Loader2, Globe, ChevronDown, Check } from 'lucide-react';

const PRESETS = [
    { id: 'all', label: 'All Time (Max Available Data)' },
    { id: '7d', label: 'Last 7 Days' },
    { id: '30d', label: 'Last 30 Days' },
    { id: 'thisMonth', label: 'This Month' }
];

const Settings = () => {
    const { user, updateProfile } = useAuth();
    const { addToast } = useToast();
    const [loading, setLoading] = useState(false);
    
    // Default settings
    const [settings, setSettings] = useState({
        defaultDateRange: 'all', // '7d', '30d', 'thisMonth', 'all'
    });

    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        if (user && user.user_metadata?.app_settings) {
            setSettings({
                ...settings,
                ...user.user_metadata.app_settings
            });
        }
    }, [user]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleChange = (e) => {
        setSettings({
            ...settings,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await updateProfile({
                app_settings: settings
            });
            addToast('Settings updated successfully!', 'success');
        } catch (error) {
            console.error("Error updating settings:", error);
            addToast('Failed to update settings.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-[--bg-app] text-[--text-main]">
            <div className="max-w-4xl mx-auto p-4 lg:p-8">
                {/* Header */}
                <div className="mb-8 flex items-center gap-3">
                    <div className="p-2.5 bg-[#f472d0]/10 rounded-xl">
                        <SettingsIcon size={24} className="text-[#f472d0]" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-[--text-muted] bg-clip-text text-transparent">
                            App Settings
                        </h1>
                        <p className="text-[--text-muted] text-sm mt-1">Configure global preferences for your UNCAHP Launch OS.</p>
                    </div>
                </div>

                <div className="bg-[--bg-card] border border-[--border] rounded-2xl p-6 shadow-xl">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        
                        {/* Section: Dashboard Preferences */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 border-b border-[--border] pb-3">
                                <Globe size={18} className="text-[--primary]" />
                                <h2 className="text-lg font-bold text-[--text-main]">Dashboard Preferences</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold tracking-wide text-[--text-muted] flex items-center gap-2">
                                        <Calendar size={14} />
                                        Default Date Range
                                    </label>
                                    <p className="text-xs text-[--text-dim] mb-2 leading-relaxed">
                                        Choose the default time period loaded when you visit the analytics dashboards (Funnels, Ads). 
                                    </p>
                                    <div className="relative" ref={dropdownRef}>
                                        <button
                                            type="button"
                                            onClick={() => setIsOpen(!isOpen)}
                                            className="w-full flex items-center justify-between gap-2 bg-[--bg-surface] border border-[--border] px-4 py-3 rounded-xl hover:border-[--primary] transition-all focus:outline-none focus:ring-2 focus:ring-[--primary]/50 shadow-sm group"
                                        >
                                            <div className="flex items-center gap-2 text-[--text-main]">
                                                <Calendar size={18} className="text-[--primary] group-hover:scale-110 transition-transform" />
                                                <span className="font-medium">
                                                    {PRESETS.find(p => p.id === settings.defaultDateRange)?.label || 'Select Range'}
                                                </span>
                                            </div>
                                            <ChevronDown size={18} className={`text-[--text-muted] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                                        </button>

                                        {isOpen && (
                                            <div className="absolute top-[calc(100%+8px)] right-0 left-0 bg-[--bg-card] border border-[--border] rounded-xl shadow-2xl z-50 overflow-hidden transform opacity-100 scale-100 transition-all origin-top">
                                                <div className="py-2">
                                                    {PRESETS.map((preset) => (
                                                        <button
                                                            key={preset.id}
                                                            type="button"
                                                            onClick={() => {
                                                                handleChange({ target: { name: 'defaultDateRange', value: preset.id } });
                                                                setIsOpen(false);
                                                            }}
                                                            className="w-full text-left px-4 py-3 text-sm hover:bg-[--bg-surface] hover:text-[--primary] transition-colors flex items-center justify-between group"
                                                        >
                                                            <span className={`font-medium ${settings.defaultDateRange === preset.id ? 'text-[--primary]' : 'text-[--text-main] group-hover:text-[--primary]'}`}>
                                                                {preset.label}
                                                            </span>
                                                            {settings.defaultDateRange === preset.id && (
                                                                <Check size={16} className="text-[--primary] animate-in zoom-in" />
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Save Button */}
                        <div className="pt-6 border-t border-[--border] flex justify-end">
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-gradient-to-r from-[#f472d0] to-[#c084fc] hover:opacity-90 text-white font-bold py-3 px-8 rounded-xl transition-all transform active:scale-[0.98] flex items-center gap-2 shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                                {loading ? 'Saving preferences...' : 'Save Settings'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Settings;
