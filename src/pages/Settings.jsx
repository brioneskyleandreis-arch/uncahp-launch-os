import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Settings as SettingsIcon, Calendar, Save, Loader2, Globe } from 'lucide-react';

const Settings = () => {
    const { user, updateProfile } = useAuth();
    const { addToast } = useToast();
    const [loading, setLoading] = useState(false);
    
    // Default settings
    const [settings, setSettings] = useState({
        defaultDateRange: 'all', // '7d', '30d', 'thisMonth', 'all'
    });

    useEffect(() => {
        if (user && user.user_metadata?.app_settings) {
            setSettings({
                ...settings,
                ...user.user_metadata.app_settings
            });
        }
    }, [user]);

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
                    <div className="p-2.5 bg-[#f48ccf]/10 rounded-xl">
                        <SettingsIcon size={24} className="text-[#f48ccf]" />
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
                                    <div className="relative">
                                        <select
                                            name="defaultDateRange"
                                            value={settings.defaultDateRange}
                                            onChange={handleChange}
                                            className="w-full bg-[--bg-surface] border border-[--border] rounded-xl py-2.5 px-4 text-[--text-main] appearance-none focus:outline-none focus:ring-2 focus:ring-[--primary]/50 focus:border-[--primary] transition-all cursor-pointer"
                                        >
                                            <option value="all">All Time (Max Available Data)</option>
                                            <option value="7d">Last 7 Days</option>
                                            <option value="30d">Last 30 Days</option>
                                            <option value="thisMonth">This Month</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-[--text-muted]">
                                            <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                                                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path>
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Save Button */}
                        <div className="pt-6 border-t border-[--border] flex justify-end">
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-gradient-to-r from-[#f48ccf] to-[#c084fc] hover:opacity-90 text-white font-bold py-3 px-8 rounded-xl transition-all transform active:scale-[0.98] flex items-center gap-2 shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
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
