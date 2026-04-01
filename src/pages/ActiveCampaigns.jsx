import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Layers, Activity, Search, RefreshCw, ArrowUpDown, ArrowUp, ArrowDown, PenTool, ExternalLink, MessageSquare, X, Check, Image as ImageIcon } from 'lucide-react';
import { SiMeta } from 'react-icons/si';
import { fetchMetaCampaigns } from '../lib/metaApi';
import AdCreativeModal from '../components/AdCreativeModal';
import { useClients } from '../context/ClientContext';
import { subDays, format } from 'date-fns';
import DateRangePicker from '../components/DateRangePicker';

const ActiveCampaigns = () => {
    const { getActiveClients } = useClients();
    const activeClients = getActiveClients();

    // Default to 30D to mirror AdsPerformance
    const [dateRange, setDateRange] = useState({ start: subDays(new Date(), 29), end: subDays(new Date(), 1) });
    const [activeChip, setActiveChip] = useState('30D');

    const [allCampaigns, setAllCampaigns] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Local Storage State for Campaign Actions
    const [editingLink, setEditingLink] = useState({});
    const [activeNoteCampaign, setActiveNoteCampaign] = useState(null);
    const [activeCreativeCampaign, setActiveCreativeCampaign] = useState(null);
    const [campaignActions, setCampaignActions] = useState(() => {
        try {
            const saved = localStorage.getItem('uncahp_campaign_actions');
            return saved ? JSON.parse(saved) : {};
        } catch (e) {
            console.error("Failed to parse campaign actions from local storage", e);
            return {};
        }
    });

    const handleActionChange = (campaignId, field, value) => {
        setCampaignActions(prev => {
            const updated = {
                ...prev,
                [campaignId]: {
                    ...(prev[campaignId] || {}),
                    [field]: value
                }
            };
            try {
                localStorage.setItem('uncahp_campaign_actions', JSON.stringify(updated));
            } catch (e) {
                console.error("Failed to save campaign actions to local storage", e);
            }
            return updated;
        });
    };

    useEffect(() => {
        const loadAllCampaignsData = async () => {
            if (activeClients.length === 0) {
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setError(null);
            setLoadingProgress(0);

            let allFetchedCampaigns = [];
            let loadedAccounts = 0;

            try {
                // Fetch sequentially or in parallel? Parallel is faster but might hit rate limits. 
                // We'll do parallel for now as active clients count is likely small.
                const fetchPromises = activeClients.map(async (client) => {
                    if (!client.adAccountId) {
                        loadedAccounts++;
                        return [];
                    }

                    try {
                        const data = await fetchMetaCampaigns(client.adAccountId, dateRange);
                        loadedAccounts++;
                        setLoadingProgress(Math.round((loadedAccounts / activeClients.length) * 100));

                        // Map raw Meta data to our frontend schema, similar to AdsPerformance
                        return data.map(cmp => {
                            const spend = parseFloat(cmp.spend || 0);
                            const leads = cmp.leads || 0;

                            const cpl = leads > 0 ? spend / leads : 0;

                            const dailyBudget = cmp.daily_budget ? parseFloat(cmp.daily_budget) / 100 : 0;
                            const lifetimeBudget = cmp.lifetime_budget ? parseFloat(cmp.lifetime_budget) / 100 : 0;
                            const budget = dailyBudget > 0 ? dailyBudget : lifetimeBudget;
                            const budgetType = dailyBudget > 0 ? 'daily' : 'lifetime';

                            return {
                                id: cmp.campaign_id,
                                accountId: client.adAccountId,
                                clientName: client.name,
                                clientLogo: client.logo,
                                name: cmp.campaign_name,
                                status: cmp.status,
                                effective_status: cmp.effective_status,
                                budget: budget,
                                budgetType: budgetType,
                                results: leads,
                                resultType: 'Leads',
                                costPerResult: cpl,
                                amountSpent: spend,
                                impressions: parseInt(cmp.impressions || 0),
                                reach: parseInt(cmp.reach || 0),
                                adCreative: cmp.adCreative,
                            };
                        });
                    } catch (err) {
                        console.error(`Failed to load campaigns for account ${client.adAccountId}:`, err);
                        loadedAccounts++;
                        setLoadingProgress(Math.round((loadedAccounts / activeClients.length) * 100));
                        return []; // Return empty array for this client on failure to not break all
                    }
                });

                const resultsArray = await Promise.all(fetchPromises);
                allFetchedCampaigns = resultsArray.flat();

                // Only keep truly active campaigns for this monitoring view 
                // Both toggle (status) and delivery (effective_status) must be ACTIVE
                const activeOnly = allFetchedCampaigns.filter(c => c.status === 'ACTIVE' && c.effective_status === 'ACTIVE');
                setAllCampaigns(activeOnly);

            } catch (err) {
                console.error("Failed to load global campaigns:", err);
                setError("Failed to aggregate data across accounts. Please try again.");
            } finally {
                setIsLoading(false);
                setLoadingProgress(100);
            }
        };

        loadAllCampaignsData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeClients.map(c => c.adAccountId).join(','), dateRange.start?.toISOString(), dateRange.end?.toISOString()]);

    const handleDateChipClick = (label, days) => {
        const end = subDays(new Date(), 1);
        const start = days ? subDays(new Date(), days) : new Date('2020-01-01');
        setDateRange({ start, end });
        setActiveChip(label);
    };

    const groupedCampaigns = useMemo(() => {
        // First filter by search
        let filtered = allCampaigns;
        if (searchQuery.trim()) {
            const lowerQuery = searchQuery.toLowerCase();
            filtered = allCampaigns.filter(c =>
                c.name.toLowerCase().includes(lowerQuery) ||
                c.clientName.toLowerCase().includes(lowerQuery)
            );
        }

        // Group by client
        const groups = {};
        filtered.forEach(cmp => {
            if (!groups[cmp.clientName]) {
                groups[cmp.clientName] = {
                    clientName: cmp.clientName,
                    clientLogo: cmp.clientLogo,
                    campaigns: []
                };
            }
            groups[cmp.clientName].campaigns.push(cmp);
        });

        // Convert object to array and sort clients alphabetically
        return Object.values(groups).sort((a, b) => a.clientName.localeCompare(b.clientName));

    }, [allCampaigns, searchQuery]);

    const getSelectStyle = (val) => {
        if (val === 'Yes') return 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10 hover:border-emerald-400/50';
        if (val === 'Not Yet') return 'text-rose-400 border-rose-400/30 bg-rose-400/10 hover:border-rose-400/50';
        if (val === 'Monitoring') return 'text-amber-400 border-amber-400/30 bg-amber-400/10 hover:border-amber-400/50';
        return 'text-[--text-main] bg-[rgba(255,255,255,0.03)] border-transparent hover:border-[--border]';
    };


    return (
        <div className="flex flex-col h-full bg-[--bg-app] animate-fade-in relative">
            {/* Header */}
            <div className="h-16 border-b border-[--border] flex items-center justify-between px-6 bg-[--bg-app] sticky top-0 z-20">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[rgba(244,140,207,0.1)] flex items-center justify-center border border-[rgba(244,140,207,0.2)]">
                        <Activity size={20} className="text-[--primary]" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-[--text-main] flex items-center gap-2">
                            Active Campaigns Monitoring
                            {isLoading && (
                                <RefreshCw size={14} className="text-[--text-muted] animate-spin" />
                            )}
                        </h1>
                        <p className="text-xs text-[--text-muted]">Global view of all active client campaigns</p>
                    </div>
                </div>

                {/* Selectors */}
                <div className="flex items-center gap-4">
                    {/* Date Picker */}
                    <DateRangePicker dateRange={dateRange} onChange={(range) => { setDateRange(range); setActiveChip(null); }} />

                    {/* Quick-Click Date Chips */}
                    <div className="flex items-center gap-1 bg-[--bg-surface] border border-[--border] rounded-lg p-1 shadow-sm">
                        {[
                            { label: '7D', days: 7 },
                            { label: '14D', days: 14 },
                            { label: '30D', days: 30 },
                        ].map(({ label, days }) => (
                            <button
                                key={label}
                                onClick={() => handleDateChipClick(label, days)}
                                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all duration-200 ${activeChip === label
                                    ? 'bg-[--primary] text-white shadow-[0_2px_8px_rgba(244,140,207,0.4)]'
                                    : 'text-[--text-muted] hover:text-[--text-main] hover:bg-[--bg-card]'
                                    }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-7xl mx-auto space-y-6">

                    {/* Controls Row */}
                    <div className="flex items-center justify-between">
                        {/* Search Bar */}
                        <div className="relative w-72">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[--text-muted]" />
                            <input
                                type="text"
                                placeholder="Search by client or campaign..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-[--bg-surface] border border-[--border] rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[--primary] transition-colors focus:shadow-[0_0_0_2px_rgba(244,140,207,0.2)]"
                            />
                        </div>

                        {/* Top Summary Stats */}
                        {!isLoading && !error && (
                            <div className="flex gap-6 text-sm">
                                <div className="flex flex-col items-end">
                                    <span className="text-[--text-muted] text-xs font-bold uppercase tracking-wider">Total Active</span>
                                    <span className="font-bold text-[--text-main] text-lg">{allCampaigns.length}</span>
                                </div>

                                <div className="w-px h-10 bg-[--border]"></div>
                                <div className="flex flex-col items-end">
                                    <span className="text-[--text-muted] text-xs font-bold uppercase tracking-wider">Total Leads ({activeChip || 'Custom'})</span>
                                    <span className="font-bold text-emerald-400 text-lg">{allCampaigns.reduce((sum, c) => sum + c.results, 0).toLocaleString()}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center p-20 space-y-6">
                            <div className="w-16 h-16 rounded-2xl bg-[rgba(244,140,207,0.1)] flex items-center justify-center border border-[rgba(244,140,207,0.2)] animate-pulse">
                                <SiMeta size={32} className="text-[--primary]" />
                            </div>
                            <div className="space-y-2 text-center w-full max-w-sm">
                                <h3 className="text-lg font-bold text-[--text-main]">Fetching Live Meta Data</h3>
                                <p className="text-sm text-[--text-muted]">Aggregating campaigns across {activeClients.length} active clients...</p>

                                {/* Progress bar */}
                                <div className="w-full bg-[--bg-surface] rounded-full h-1.5 mt-4 overflow-hidden border border-[--border]">
                                    <div
                                        className="bg-[--primary] h-full rounded-full transition-all duration-300 ease-out relative"
                                        style={{ width: `${loadingProgress}%` }}
                                    >
                                        <div className="absolute inset-0 bg-white/20 blur shadow-[0_0_10px_rgba(255,255,255,0.8)]"></div>
                                    </div>
                                </div>
                                <div className="text-xs font-bold text-[--text-dim] text-right mt-1">{loadingProgress}%</div>
                            </div>

                            {/* Skeleton Rows */}
                            <div className="w-full space-y-3 mt-8">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <div key={i} className="w-full h-16 bg-[--bg-surface] rounded-xl border border-[--border] animate-pulse flex items-center px-6 gap-6">
                                        <div className="w-8 h-8 rounded-lg bg-[--bg-card]"></div>
                                        <div className="w-48 h-4 rounded bg-[--bg-card]"></div>
                                        <div className="flex-1"></div>
                                        <div className="w-24 h-4 rounded bg-[--bg-card]"></div>
                                        <div className="w-24 h-4 rounded bg-[--bg-card]"></div>
                                        <div className="w-24 h-4 rounded bg-[--bg-card]"></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-[--bg-surface] border border-[--border] rounded-xl text-[--error]">
                            <p className="font-bold mb-2 text-lg">Data Aggregation Error</p>
                            <p className="text-sm opacity-80">{error}</p>
                        </div>
                    ) : groupedCampaigns.length > 0 ? (
                        <div className="space-y-8">
                            {groupedCampaigns.map((group) => (
                                <div key={group.clientName} className="bg-[--bg-surface] border border-[--border] rounded-xl overflow-hidden shadow-sm">
                                    {/* Client Header */}
                                    <div className="bg-[--bg-card] border-b border-[--border] px-6 py-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            {group.clientLogo ? (
                                                <img src={group.clientLogo} alt={group.clientName} className="w-8 h-8 rounded-lg object-cover shadow-sm border border-[--border]" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-lg bg-[--bg-app] flex items-center justify-center border border-[--border] shadow-sm">
                                                    <Layers size={14} className="text-[--text-muted]" />
                                                </div>
                                            )}
                                            <h2 className="font-bold text-base text-[--text-main]">{group.clientName}</h2>
                                        </div>
                                        <div className="text-xs text-[--text-muted] font-semibold bg-[--bg-app] px-2.5 py-1 rounded border border-[--border]">
                                            {group.campaigns.length} Campaign{group.campaigns.length !== 1 && 's'}
                                        </div>
                                    </div>

                                    {/* Client Campaigns Table */}
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left min-w-[1200px]">
                                            <thead>
                                                <tr className="bg-[rgba(255,255,255,0.01)] border-b border-[--border]">
                                                    <th className="px-6 py-4 text-xs font-bold text-[--text-muted] tracking-wider uppercase select-none w-[28%]">
                                                        Campaign Name
                                                    </th>

                                                    <th className="px-4 py-3 text-xs font-bold text-[--text-muted] tracking-wider uppercase select-none text-right">
                                                        Leads ({activeChip || 'Custom'})
                                                    </th>
                                                    <th className="px-4 py-3 text-xs font-bold text-[--text-muted] tracking-wider uppercase select-none text-right">
                                                        CPL ({activeChip || 'Custom'})
                                                    </th>
                                                    <th className="px-4 py-3 text-xs font-bold text-[--text-muted] tracking-wider uppercase select-none text-right">
                                                        Budget
                                                    </th>
                                                    <th className="px-4 py-3 text-xs font-bold text-[--text-muted] tracking-wider uppercase select-none w-48">
                                                        Ad Preview Link
                                                    </th>
                                                    <th className="px-4 py-3 text-xs font-bold text-[--text-muted] tracking-wider uppercase select-none w-48">
                                                        Notes
                                                    </th>
                                                    <th className="px-4 py-3 text-xs font-bold text-[--text-muted] tracking-wider uppercase select-none w-32">
                                                        Need New Creatives
                                                    </th>
                                                    <th className="px-4 py-3 text-xs font-bold text-[--text-muted] tracking-wider uppercase select-none w-32">
                                                        New Ad Copy
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[--border]">
                                                {group.campaigns.map(cmp => {
                                                    const actions = campaignActions[cmp.id] || {};
                                                    return (
                                                        <tr key={`${cmp.accountId}-${cmp.id}`} className="hover:bg-[rgba(255,255,255,0.02)] transition-colors group">
                                                            {/* Campaign Name */}
                                                            <td className="px-6 py-5">
                                                                <div className="font-bold text-sm leading-snug text-[--text-main] group-hover:text-[--primary] transition-colors pr-4 flex items-center gap-2">
                                                                    {cmp.name}
                                                                    {cmp.adCreative && (
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setActiveCreativeCampaign(cmp);
                                                                            }}
                                                                            title="View Ad Creative"
                                                                            className="p-1 hover:bg-[--bg-card] rounded-md text-[--text-muted] hover:text-[--primary] transition-colors flex-shrink-0 border border-transparent hover:border-[--border]"
                                                                        >
                                                                            <ImageIcon size={14} />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                                <div className="text-[10px] text-[--text-muted] mt-1.5 flex items-center gap-2">
                                                                    <span className="flex items-center gap-1 font-bold">
                                                                        <div className={`w-1.5 h-1.5 rounded-full ${cmp.effective_status === 'ACTIVE' ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-amber-400'}`}></div>
                                                                        {cmp.effective_status}
                                                                    </span>
                                                                    <span className="opacity-50">•</span>
                                                                    <span className="uppercase tracking-wider font-mono">{cmp.id}</span>
                                                                </div>
                                                            </td>



                                                            {/* Leads (Results) */}
                                                            <td className="px-4 py-5 text-right">
                                                                <div className="text-sm font-bold text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-md inline-block border border-emerald-400/20">
                                                                    {cmp.results > 0 ? cmp.results.toLocaleString() : '0'}
                                                                </div>
                                                            </td>

                                                            {/* CPL */}
                                                            <td className="px-4 py-5 text-right">
                                                                <div className="text-sm font-semibold text-[--text-main]">
                                                                    {cmp.costPerResult > 0 ? '£' + cmp.costPerResult.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
                                                                </div>
                                                            </td>

                                                            {/* Budget */}
                                                            <td className="px-4 py-5 text-right">
                                                                <div className="text-sm text-[--text-main]">
                                                                    {cmp.budget ? '£' + cmp.budget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
                                                                    <span className="text-[10px] text-[--text-muted] ml-1 uppercase block">/{cmp.budgetType === 'daily' ? 'day' : 'total'}</span>
                                                                </div>
                                                            </td>

                                                            {/* Ad Preview Link */}
                                                            <td className="px-4 py-5">
                                                                {editingLink[cmp.id] || !actions.previewLink ? (
                                                                    <div className="flex items-center gap-1">
                                                                        <input
                                                                            type="url"
                                                                            placeholder="Paste link..."
                                                                            value={actions.previewLink || ''}
                                                                            onChange={(e) => handleActionChange(cmp.id, 'previewLink', e.target.value)}
                                                                            onKeyDown={(e) => {
                                                                                if (e.key === 'Enter') {
                                                                                    e.target.blur();
                                                                                }
                                                                            }}
                                                                            onBlur={() => {
                                                                                if (actions.previewLink) {
                                                                                    setEditingLink(prev => ({ ...prev, [cmp.id]: false }));
                                                                                }
                                                                            }}
                                                                            className="w-full bg-[--bg-surface] border border-[--border] focus:border-[--primary] rounded-md px-3 py-1.5 text-xs text-[--text-main] outline-none transition-colors placeholder:text-[--text-muted]/50"
                                                                        />
                                                                        {actions.previewLink && (
                                                                            <button
                                                                                onClick={() => setEditingLink(prev => ({ ...prev, [cmp.id]: false }))}
                                                                                className="p-1.5 bg-[--primary]/20 text-[--primary] hover:bg-[--primary] hover:text-white rounded-md transition-colors"
                                                                            >
                                                                                <Check size={14} />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex items-center justify-between gap-2 max-w-[192px]">
                                                                        <a
                                                                            href={actions.previewLink.startsWith('http') ? actions.previewLink : `https://${actions.previewLink}`}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="flex-1 min-w-0 flex items-center gap-1.5 text-xs font-medium text-[--text-main] hover:text-[--primary] transition-colors truncate px-2 py-1.5 bg-[rgba(255,255,255,0.02)] border border-[--border] rounded-md"
                                                                        >
                                                                            <ExternalLink size={12} className="flex-shrink-0" />
                                                                            <span className="truncate">Preview Ad</span>
                                                                        </a>
                                                                        <button
                                                                            onClick={() => setEditingLink(prev => ({ ...prev, [cmp.id]: true }))}
                                                                            className="p-1.5 text-[--text-muted] hover:text-[--text-main] hover:bg-[--bg-surface] border border-transparent rounded-md transition-colors flex-shrink-0"
                                                                        >
                                                                            <PenTool size={14} />
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </td>

                                                            {/* Notes */}
                                                            <td className="px-4 py-5">
                                                                <button
                                                                    onClick={() => setActiveNoteCampaign(cmp)}
                                                                    className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md bg-[rgba(255,255,255,0.02)] border border-[--border] hover:bg-[rgba(255,255,255,0.05)] hover:border-[--text-muted]/30 transition-colors text-left group/note"
                                                                >
                                                                    <MessageSquare size={14} className="text-[--text-muted] group-hover/note:text-[--primary] flex-shrink-0" />
                                                                    {actions.notes ? (
                                                                        <span className="text-xs text-[--text-main] truncate">{actions.notes}</span>
                                                                    ) : (
                                                                        <span className="text-xs text-[--text-muted] italic">Add notes...</span>
                                                                    )}
                                                                </button>
                                                            </td>

                                                            {/* Need New Creatives */}
                                                            <td className="px-4 py-5">
                                                                <select
                                                                    value={actions.newCreatives || ''}
                                                                    onChange={(e) => handleActionChange(cmp.id, 'newCreatives', e.target.value)}
                                                                    className={`w-full border rounded-md px-2 py-1.5 text-xs outline-none transition-colors cursor-pointer appearance-none ${getSelectStyle(actions.newCreatives)}`}
                                                                >
                                                                    <option value="" className="bg-[--bg-card] text-[--text-main]">Select...</option>
                                                                    <option value="Yes" className="bg-[--bg-card] text-emerald-400">Yes</option>
                                                                    <option value="Not Yet" className="bg-[--bg-card] text-rose-400">Not Yet</option>
                                                                    <option value="Monitoring" className="bg-[--bg-card] text-amber-400">Monitoring</option>
                                                                </select>
                                                            </td>

                                                            {/* New Ad Copy Process */}
                                                            <td className="px-4 py-5">
                                                                <select
                                                                    value={actions.newCopy || ''}
                                                                    onChange={(e) => handleActionChange(cmp.id, 'newCopy', e.target.value)}
                                                                    className={`w-full border rounded-md px-2 py-1.5 text-xs outline-none transition-colors cursor-pointer appearance-none ${getSelectStyle(actions.newCopy)}`}
                                                                >
                                                                    <option value="" className="bg-[--bg-card] text-[--text-main]">Select...</option>
                                                                    <option value="Yes" className="bg-[--bg-card] text-emerald-400">Yes</option>
                                                                    <option value="Not Yet" className="bg-[--bg-card] text-rose-400">Not Yet</option>
                                                                    <option value="Monitoring" className="bg-[--bg-card] text-amber-400">Monitoring</option>
                                                                </select>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 bg-[--bg-surface] border border-[--border] rounded-xl text-[--text-muted]">
                            <Layers size={48} className="mb-4 opacity-20" />
                            <p className="font-medium text-[--text-main] mb-1">No active campaigns found</p>
                            <p className="text-sm">We couldn't find any active campaigns matching your criteria.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Notes Modal */}
            {activeNoteCampaign && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in"
                    onClick={() => setActiveNoteCampaign(null)}
                >
                    <div
                        className="bg-[--bg-app] border border-[--border] rounded-2xl w-full max-w-lg shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-5 border-b border-[--border]">
                            <div>
                                <h3 className="font-bold text-[--text-main] text-lg">Campaign Notes</h3>
                                <div className="text-xs text-[--text-muted] mt-0.5 line-clamp-1">
                                    {activeNoteCampaign.clientName} / <span className="text-[--text-dim]">{activeNoteCampaign.name}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => setActiveNoteCampaign(null)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[--bg-surface] text-[--text-muted] hover:text-[--text-main] transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-5">
                            <textarea
                                autoFocus
                                value={campaignActions[activeNoteCampaign.id]?.notes || ''}
                                onChange={(e) => handleActionChange(activeNoteCampaign.id, 'notes', e.target.value)}
                                placeholder="Type exhaustive campaign notes here..."
                                className="w-full h-64 bg-[--bg-surface] border border-[--border] text-sm text-[--text-main] p-4 rounded-xl resize-none outline-none focus:border-[--primary] focus:shadow-[0_0_0_2px_rgba(244,140,207,0.1)] transition-all placeholder:text-[--text-muted]/50"
                            />
                        </div>

                        {/* Modal Footer */}
                        <div className="p-5 pt-0 flex justify-end">
                            <button
                                onClick={() => setActiveNoteCampaign(null)}
                                className="px-5 py-2.5 bg-[--primary] text-white text-sm font-bold rounded-xl hover:opacity-90 shadow-[0_0_20px_rgba(244,140,207,0.2)] transition-all"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Ad Creative Modal */}
            <AdCreativeModal
                isOpen={!!activeCreativeCampaign}
                onClose={() => setActiveCreativeCampaign(null)}
                creative={activeCreativeCampaign?.adCreative}
                campaignName={activeCreativeCampaign?.name}
            />
        </div>
    );
};

export default ActiveCampaigns;
