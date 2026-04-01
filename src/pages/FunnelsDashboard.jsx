import React, { useState, useEffect } from 'react';
import { Filter, Plus, Edit2, Trash2, X, ExternalLink, Activity, Users, DollarSign, Loader2, Settings, Code, Copy, CheckCircle2, ChevronRight, Calendar, ArrowDownUp, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import DateRangePicker from '../components/DateRangePicker';
import { subDays } from 'date-fns';

const FunnelsDashboard = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [funnels, setFunnels] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [dbError, setDbError] = useState(false);
    const [dateRange, setDateRange] = useState({ start: subDays(new Date(), 29), end: new Date() });
    const [activeChip, setActiveChip] = useState('30D');

    // Modal State
    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [activeFunnel, setActiveFunnel] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [copiedScript, setCopiedScript] = useState(null);

    // Forms
    const [createForm, setCreateForm] = useState({ client_id: '', name: '', domain_url: '' });
    const [configForm, setConfigForm] = useState({ headline: '', vsl_video_url: '', stripe_link: '', ghl_form_id: '', meta_pixel_id: '', primary_color: '#f48ccf' });

    useEffect(() => {
        if (user?.user_metadata?.app_settings?.defaultDateRange) {
            const rangeStr = user.user_metadata.app_settings.defaultDateRange;
            const end = new Date();
            if (rangeStr === '7d') {
                setDateRange({ start: subDays(end, 7), end });
                setActiveChip('7D');
            } else if (rangeStr === '30d') {
                setDateRange({ start: subDays(end, 30), end });
                setActiveChip('30D');
            } else if (rangeStr === 'thisMonth') {
                setDateRange({ start: new Date(end.getFullYear(), end.getMonth(), 1), end });
                setActiveChip(null);
            } else if (rangeStr === 'all') {
                setDateRange({ start: new Date('2020-01-01'), end });
                setActiveChip(null);
            }
        }
        fetchFunnels();
    }, [user]);

    const fetchFunnels = async () => {
        setIsLoading(true);
        try {
            // Fetch funnels, configs, and events
            const { data, error } = await supabase
                .from('funnels')
                .select(`
                    *,
                    funnel_configs (*),
                    funnel_events (event_type, metadata, created_at)
                `)
                .order('created_at', { ascending: false });

            if (error) {
                if (error.code === '42P01' || error.message.includes('schema cache')) {
                    setDbError(true);
                } else {
                    addToast(`Failed to load funnels: ${error.message}`, 'error');
                }
            } else {
                setFunnels(data || []);
            }
        } catch (err) {
            console.error("Error fetching funnels:", err);
            addToast('An unexpected error occurred.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateFunnel = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const { data: newFunnel, error } = await supabase
                .from('funnels')
                .insert([{ ...createForm, status: 'Active' }])
                .select()
                .single();

            if (error) throw error;

            // Initialize empty config for new funnel
            const { error: configError } = await supabase
                .from('funnel_configs')
                .insert([{ funnel_id: newFunnel.id }]);

            if (configError) throw configError;

            addToast('Funnel created successfully!', 'success');
            setIsCreateOpen(false);
            setCreateForm({ client_id: '', name: '', domain_url: '' });
            fetchFunnels();
        } catch (error) {
            console.error("Create funnel error detail:", error);
            addToast(`Failed to create funnel: ${error.message}`, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleOpenConfig = (funnel) => {
        setActiveFunnel(funnel);
        setCopiedScript(null);
        const config = funnel.funnel_configs?.[0] || {};
        setConfigForm({
            headline: config.headline || '',
            vsl_video_url: config.vsl_video_url || '',
            stripe_link: config.stripe_link || '',
            ghl_form_id: config.ghl_form_id || '',
            meta_pixel_id: config.meta_pixel_id || '',
            primary_color: config.primary_color || '#f48ccf'
        });
        setIsConfigOpen(true);
    };

    const handleSaveConfig = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('funnel_configs')
                .upsert({
                    funnel_id: activeFunnel.id,
                    ...configForm,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;

            addToast('Funnel configuration saved!', 'success');
            setIsConfigOpen(false);
            fetchFunnels();
        } catch (error) {
            addToast(`Failed to save configuration: ${error.message}`, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Are you sure you want to delete the funnel "${name}"? This action cannot be undone.`)) return;

        try {
            const { error } = await supabase.from('funnels').delete().eq('id', id);
            if (error) throw error;
            addToast('Funnel deleted successfully.', 'success');
            setFunnels(f => f.filter(funnel => funnel.id !== id));
        } catch (error) {
            addToast(`Failed to delete: ${error.message}`, 'error');
        }
    };

    const handleResetStats = async (id, name) => {
        if (!window.confirm(`Are you sure you want to completely clear all analytics stats (views, leads, purchases) for "${name}"? This action is useful for switching from Testing to Live and cannot be undone.`)) return;

        try {
            const { error } = await supabase.from('funnel_events').delete().eq('funnel_id', id);
            if (error) throw error;
            addToast('Funnel stats reset successfully.', 'success');
            fetchFunnels();
        } catch (error) {
            addToast(`Failed to reset stats: ${error.message}`, 'error');
        }
    };

    const generateScript = (eventType, funnelId) => {
        const url = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
        const key = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_ANON_KEY';
        
        return `<script>
  (function() {
    var payload = {
      funnel_id: "${funnelId}",
      event_type: "${eventType}",
      metadata: { url: window.location.href, referrer: document.referrer }
    };
    fetch("${url}/rest/v1/funnel_events", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': "${key}",
        'Authorization': "Bearer ${key}",
        'Prefer': "return=minimal"
      },
      body: JSON.stringify(payload)
    }).catch(function(e) { console.error("Tracking Error:", e) });
  })();
</script>`;
    };

    const copyToClipboard = async (text, id) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedScript(id);
            addToast('Script copied to clipboard!', 'success');
            setTimeout(() => setCopiedScript(null), 3000);
        } catch (err) {
            addToast('Failed to copy', 'error');
        }
    };

    const filterEventsByDateRange = (events, range) => {
        if (!events) return [];
        if (!range || !range.start || !range.end) return events;
        
        const startDate = new Date(range.start);
        startDate.setHours(0, 0, 0, 0);
        
        const endDate = new Date(range.end);
        endDate.setHours(23, 59, 59, 999);
        
        return events.filter(e => {
            const eventDate = new Date(e.created_at);
            return eventDate >= startDate && eventDate <= endDate;
        });
    };

    const getFunnelStats = (funnel) => {
        const events = filterEventsByDateRange(funnel.funnel_events, dateRange);
        const views = events.filter(e => e.event_type === 'view').length;
        const leads = events.filter(e => e.event_type === 'opt_in').length;
        const purchases = events.filter(e => e.event_type === 'purchase').length;
        
        const optInRate = views > 0 ? ((leads / views) * 100).toFixed(1) : '0.0';
        const purchaseRate = leads > 0 ? ((purchases / leads) * 100).toFixed(1) : '0.0';

        return { views, leads, purchases, optInRate, purchaseRate };
    };

    const sortedFunnels = [...funnels].sort((a, b) => {
        return new Date(b.created_at) - new Date(a.created_at);
    });

    if (dbError) {
        return (
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-[--bg-app] text-[--text-main] p-8">
                <div className="max-w-3xl mx-auto bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-8 text-center mt-20">
                    <Settings size={48} className="text-yellow-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-yellow-500 mb-2">Database Schema Missing</h2>
                    <p className="text-[--text-muted] mb-6">
                        It looks like the Supabase tables for Funnel Tracking haven't been created yet or the cache is stale.
                        Please run the `supabase_funnels_schema.sql` script in your SQL Editor, followed by `NOTIFY pgrst, 'reload schema';`.
                    </p>
                    <button onClick={fetchFunnels} className="px-6 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-lg transition-colors font-medium">
                        I've run the script, try again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-[--bg-app] text-[--text-main]">
            <div className="max-w-7xl mx-auto p-4 lg:p-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-[--text-main] flex items-center gap-3">
                            <Filter className="text-[#f48ccf]" />
                            Funnel Tracking
                        </h1>
                        <p className="text-sm text-[--text-muted] mt-1">
                            Manage configurations and view analytics for your external headless funnels.
                        </p>
                    </div>
                    <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
                        {/* Date Picker */}
                        <DateRangePicker 
                            dateRange={dateRange} 
                            onChange={(range) => { setDateRange(range); setActiveChip(null); }} 
                        />

                        {/* Quick-Click Date Chips */}
                        <div className="flex items-center gap-1 bg-[--bg-surface] border border-[--border] rounded-lg p-1">
                            {[
                                { label: '7D', days: 7 },
                                { label: '14D', days: 14 },
                                { label: '30D', days: 30 },
                            ].map(({ label, days }) => (
                                <button
                                    key={label}
                                    onClick={() => {
                                        const end = new Date();
                                        const start = days ? subDays(new Date(), days) : new Date('2020-01-01');
                                        setDateRange({ start, end });
                                        setActiveChip(label);
                                    }}
                                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all duration-150 ${activeChip === label
                                        ? 'bg-[--primary] text-white shadow-sm'
                                        : 'text-[--text-muted] hover:text-[--text-main] hover:bg-[--bg-card]'
                                        }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => setIsCreateOpen(true)}
                            className="flex justify-center items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#f48ccf] to-[#c084fc] text-white rounded-lg font-medium hover:opacity-90 transition-opacity whitespace-nowrap shadow-lg shadow-purple-500/20 w-full md:w-auto"
                        >
                            <Plus size={18} />
                            Create Funnel
                        </button>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex justify-center items-center py-20">
                        <Loader2 className="animate-spin text-[#f48ccf]" size={32} />
                    </div>
                ) : funnels.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-[--bg-card] border border-[--border] rounded-2xl">
                        <Filter size={48} className="text-[--text-muted] mb-4 opacity-50" />
                        <h3 className="text-lg font-bold text-[--text-main] mb-2">No Funnels Built Yet</h3>
                        <p className="text-[--text-muted] text-sm max-w-sm text-center mb-6">
                            Create your first funnel connection to start gathering analytics and managing webhook configurations.
                        </p>
                        <button
                            onClick={() => setIsCreateOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-[--bg-surface] text-[--text-main] rounded-lg border border-[--border] hover:bg-[--border] transition-colors"
                        >
                            <Plus size={18} />
                            Create First Funnel
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        {sortedFunnels.map(funnel => {
                            const stats = getFunnelStats(funnel);
                            return (
                                <div key={funnel.id} className="bg-[--bg-card] border border-[--border] rounded-2xl overflow-hidden flex flex-col group transition-all hover:bg-[--bg-surface]">
                                    <div className="p-5 border-b border-[--border] flex justify-between items-start">
                                        <div className="flex-1 min-w-0 pr-4">
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="font-bold text-lg text-[--text-main] truncate">{funnel.name}</h3>
                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase bg-[--bg-surface-hover] text-[--text-muted] border border-[--border]">
                                                    {funnel.client_id}
                                                </span>
                                            </div>
                                            <a href={funnel.domain_url} target="_blank" rel="noopener noreferrer" className="text-sm text-[#f48ccf] hover:text-[#c084fc] flex items-center gap-1.5 transition-colors truncate">
                                                {funnel.domain_url || 'No URL configured'}
                                                {funnel.domain_url && <ExternalLink size={12} />}
                                            </a>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleResetStats(funnel.id, funnel.name)}
                                                className="p-1.5 bg-[--bg-surface] hover:bg-orange-500/10 text-[--text-muted] hover:text-orange-400 rounded-lg transition-colors border border-[--border] opacity-0 group-hover:opacity-100"
                                                title="Reset Stats"
                                            >
                                                <RefreshCw size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleOpenConfig(funnel)}
                                                className="p-1.5 bg-[--bg-surface] hover:bg-[#f48ccf]/10 text-[--text-muted] hover:text-[#f48ccf] rounded-lg transition-colors border border-[--border]"
                                                title="Configure Details"
                                            >
                                                <Settings size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(funnel.id, funnel.name)}
                                                className="p-1.5 bg-[--bg-surface] hover:bg-red-500/10 text-[--text-muted] hover:text-red-400 rounded-lg transition-colors border border-[--border] opacity-0 group-hover:opacity-100"
                                                title="Delete Funnel"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    
                                    {/* Aesthetic Funnel Analytics */}
                                    <div className="p-5 bg-[rgba(244,140,207,0.02)]">
                                        <div className="flex flex-col gap-2 relative">
                                            {/* Line connecting the steps */}
                                            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-[--border] -translate-y-1/2 z-0 hidden sm:block"></div>
                                            
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 relative z-10">
                                                {/* Views */}
                                                <div className="bg-[--bg-card] border border-[--border] rounded-xl p-4 shadow-sm relative overflow-hidden group/step">
                                                    <div className="absolute inset-0 bg-blue-500/5 transition-colors group-hover/step:bg-blue-500/10"></div>
                                                    <div className="relative flex flex-col items-center text-center">
                                                        <Activity size={18} className="text-blue-400 mb-2" />
                                                        <span className="text-2xl font-black text-[--text-main]">{stats.views}</span>
                                                        <span className="text-xs font-bold uppercase tracking-wider text-[--text-muted] mt-1">Page Views</span>
                                                    </div>
                                                </div>

                                                {/* Leads (Opt-ins) */}
                                                <div className="bg-[--bg-card] border border-[--border] rounded-xl p-4 shadow-sm relative overflow-hidden group/step">
                                                    <div className="absolute inset-x-0 bottom-full bg-emerald-500 rounded-b-lg flex items-center justify-center -translate-y-[calc(100%-1.5rem)] text-[10px] font-bold text-white shadow-md z-20">
                                                        <span className="bg-[--bg-card] text-[--text-muted] px-2 py-0.5 rounded-full border border-[--border] absolute -top-3 whitespace-nowrap shadow-sm">
                                                            {stats.optInRate}% Opt-in
                                                        </span>
                                                    </div>
                                                    <div className="absolute inset-0 bg-emerald-500/5 transition-colors group-hover/step:bg-emerald-500/10"></div>
                                                    <div className="relative flex flex-col items-center text-center mt-3 sm:mt-0">
                                                        <Users size={18} className="text-emerald-400 mb-2" />
                                                        <span className="text-2xl font-black text-[--text-main]">{stats.leads}</span>
                                                        <span className="text-xs font-bold uppercase tracking-wider text-[--text-muted] mt-1">Leads Generated</span>
                                                    </div>
                                                </div>

                                                {/* Purchases */}
                                                <div className="bg-[--bg-card] border border-[--border] rounded-xl p-4 shadow-sm relative overflow-hidden group/step">
                                                    <div className="absolute inset-x-0 bottom-full bg-amber-500 rounded-b-lg flex items-center justify-center -translate-y-[calc(100%-1.5rem)] text-[10px] font-bold text-white shadow-md z-20">
                                                        <span className="bg-[--bg-card] text-[--text-muted] px-2 py-0.5 rounded-full border border-[--border] absolute -top-3 whitespace-nowrap shadow-sm">
                                                            {stats.purchaseRate}% CVR
                                                        </span>
                                                    </div>
                                                    <div className="absolute inset-0 bg-amber-500/5 transition-colors group-hover/step:bg-amber-500/10"></div>
                                                    <div className="relative flex flex-col items-center text-center mt-3 sm:mt-0">
                                                        <DollarSign size={18} className="text-amber-400 mb-2" />
                                                        <span className="text-2xl font-black text-[--text-main]">{stats.purchases}</span>
                                                        <span className="text-xs font-bold uppercase tracking-wider text-[--text-muted] mt-1">Deposits</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Create Funnel Modal */}
            {isCreateOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[--bg-card] border border-[--border] rounded-2xl w-full max-w-md shadow-2xl flex flex-col relative animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 flex items-center justify-between border-b border-[--border]">
                            <h2 className="text-lg font-bold text-[--text-main]">Create New Funnel Connect</h2>
                            <button onClick={() => setIsCreateOpen(false)} className="p-2 text-[--text-muted] hover:text-[--text-main] rounded-lg transition-colors"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleCreateFunnel} className="p-6 flex flex-col gap-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-[--text-muted] mb-1.5">Funnel Name</label>
                                <input required type="text" value={createForm.name} onChange={e => setCreateForm(f => ({...f, name: e.target.value}))} placeholder="e.g. Summer AgeJet Offer" className="w-full bg-[--bg-app] border border-[--border] text-[--text-main] px-4 py-2.5 rounded-lg focus:outline-none focus:border-[#f48ccf] transition-colors" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-[--text-muted] mb-1.5">Client Reference</label>
                                <input required type="text" value={createForm.client_id} onChange={e => setCreateForm(f => ({...f, client_id: e.target.value}))} placeholder="e.g. Emzi Skin" className="w-full bg-[--bg-app] border border-[--border] text-[--text-main] px-4 py-2.5 rounded-lg focus:outline-none focus:border-[#f48ccf] transition-colors" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-[--text-muted] mb-1.5">Live Funnel Domain (Optional)</label>
                                <input type="url" value={createForm.domain_url} onChange={e => setCreateForm(f => ({...f, domain_url: e.target.value}))} placeholder="https://offer.clientdomain.com" className="w-full bg-[--bg-app] border border-[--border] text-[--text-main] px-4 py-2.5 rounded-lg focus:outline-none focus:border-[#f48ccf] transition-colors" />
                            </div>
                            <button disabled={isSaving} type="submit" className="w-full mt-2 bg-gradient-to-r from-[#f48ccf] to-[#c084fc] text-white font-medium py-3 px-4 rounded-lg flex justify-center items-center gap-2 hover:opacity-90 disabled:opacity-50">
                                {isSaving ? <Loader2 size={18} className="animate-spin" /> : 'Create Funnel'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Config & Scripts Modal */}
            {isConfigOpen && activeFunnel && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[--bg-card] border border-[--border] rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col relative max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
                        
                        <div className="px-6 py-4 flex items-center justify-between border-b border-[--border] bg-[--bg-surface] flex-shrink-0">
                            <div>
                                <h2 className="text-lg font-bold text-[--text-main] flex items-center gap-2">
                                    <Settings size={18} className="text-[#f48ccf]" />
                                    Manage Funnel
                                </h2>
                                <p className="text-xs text-[--text-muted] mt-0.5"><span className="font-semibold text-[--text-main]">{activeFunnel.name}</span></p>
                            </div>
                            <button onClick={() => setIsConfigOpen(false)} className="p-2 text-[--text-muted] hover:text-[--text-main] rounded-lg transition-colors"><X size={20} /></button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                            
                            <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-2 duration-300">
                                <h3 className="text-sm font-bold text-[--text-main] uppercase tracking-wider border-b border-[--border] pb-2 flex items-center gap-2">
                                    <Code size={16} /> Universal Tracking Scripts
                                </h3>
                                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl text-sm text-[--text-main]">
                                        <p className="mb-2"><strong>How to use:</strong> Paste these JavaScript snippets anywhere inside the <strong>&lt;head&gt;</strong> or before the closing <strong>&lt;/body&gt;</strong> tag of your specific page/funnel step. They work across any platform (Webflow, WordPress, Shopify, GHL, etc).</p>
                                        <ul className="list-disc pl-5 text-[--text-muted] text-xs">
                                            <li>Do not put them globally across the whole funnel, put them on the specific step.</li>
                                            <li>These instantly fire asynchronous background hits securely to this Supabase database.</li>
                                            <li>Meta Pixel continues functioning normally.</li>
                                        </ul>
                                    </div>

                                    {[
                                        { id: 'view', title: 'Step 1: Landing Page (Tracks "Views")', snippet: generateScript('view', activeFunnel.id) },
                                        { id: 'opt_in', title: 'Step 2: Checkout Page (Tracks "Leads / Opt-ins")', snippet: generateScript('opt_in', activeFunnel.id) },
                                        { id: 'purchase', title: 'Step 3: Thank You Page (Tracks deposit "Purchases")', snippet: generateScript('purchase', activeFunnel.id) }
                                    ].map(scriptObj => (
                                        <div key={scriptObj.id} className="relative group">
                                            <div className="flex justify-between items-end mb-2">
                                                <label className="block text-xs font-bold uppercase tracking-wider text-[--text-main]">{scriptObj.title}</label>
                                                <button 
                                                    onClick={() => copyToClipboard(scriptObj.snippet, scriptObj.id)}
                                                    className="flex items-center gap-1.5 text-xs font-medium text-[#f48ccf] hover:text-[#c084fc] transition-colors bg-[#f48ccf]/10 px-2.5 py-1 rounded-md"
                                                >
                                                    {copiedScript === scriptObj.id ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                                                    {copiedScript === scriptObj.id ? 'Copied' : 'Copy JS'}
                                                </button>
                                            </div>
                                            <pre className="w-full bg-[--bg-surface] border border-[--border] text-[#a5b4fc] px-4 py-3 rounded-xl overflow-x-auto text-[11px] font-mono leading-relaxed custom-scrollbar selection:bg-[#f48ccf]/30">
                                                {scriptObj.snippet}
                                            </pre>
                                        </div>
                                    ))}
                                </div>
                            
                        </div>
                        
                        <div className="p-6 border-t border-[--border] bg-[--bg-surface] flex-shrink-0 flex justify-end">
                            <button onClick={() => setIsConfigOpen(false)} className="px-5 py-2.5 font-medium bg-[--bg-app] text-[--text-main] border border-[--border] hover:bg-[--border] transition-colors rounded-lg">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FunnelsDashboard;
