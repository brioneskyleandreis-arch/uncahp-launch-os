import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import AdsDashboard from '../components/AdsDashboard';
import DateRangePicker from '../components/DateRangePicker';
import { ChevronDown, Layers, LayoutGrid, Search, CheckCircle2, ArrowUpDown, ArrowUp, ArrowDown, Settings2, Image as ImageIcon, Pencil, Check } from 'lucide-react';
import { SiMeta } from 'react-icons/si';
import { fetchMetaCampaigns } from '../lib/metaApi';
import AdCreativeModal from '../components/AdCreativeModal';
import { subDays } from 'date-fns';
import { useClients } from '../context/ClientContext';

const AdsPerformance = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    const [selectedAccountId, setSelectedAccountId] = useState(searchParams.get('accountId') || '');
    const [selectedCampaignId, setSelectedCampaignId] = useState(searchParams.get('campaignId') || '');
    // Note: To keep things simple, we'll keep dateRange purely in local state for now, 
    // as serializing Date objects to URL requires a bit more parsing overhead.
    const [dateRange, setDateRange] = useState({ start: subDays(new Date(), 29), end: subDays(new Date(), 1) });
    const [activeChip, setActiveChip] = useState('30D');
    const [avgPrice, setAvgPrice] = useState('');
    const [isEditingPrice, setIsEditingPrice] = useState(false);

    // Sync state changes to URL
    const [sortConfig, setSortConfig] = useState({ key: 'amountSpent', direction: 'desc' });

    useEffect(() => {
        const newParams = new URLSearchParams(searchParams);
        if (selectedAccountId) newParams.set('accountId', selectedAccountId);
        else newParams.delete('accountId');

        if (selectedCampaignId) newParams.set('campaignId', selectedCampaignId);
        else newParams.delete('campaignId');

        // Only update if the string actually changed to prevent infinite loops
        if (newParams.toString() !== searchParams.toString()) {
            setSearchParams(newParams, { replace: true }); // Use replace so we don't spam browser history
        }
    }, [selectedAccountId, selectedCampaignId, setSearchParams, searchParams]);

    // Live Data State
    const [liveCampaigns, setLiveCampaigns] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeCreativeCampaign, setActiveCreativeCampaign] = useState(null);

    const navigate = useNavigate();
    const { getActiveClients, updateClient } = useClients();
    const activeClients = getActiveClients();
    const selectedAccount = activeClients.find(c => c.adAccountId === selectedAccountId);

    // Set default client on mount if not in URL
    useEffect(() => {
        if (!selectedAccountId && activeClients.length > 0) {
            setSelectedAccountId(activeClients[0].adAccountId);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedAccountId, activeClients.map(c => c.adAccountId).join(',')]);

    // Custom Dropdown State for Accounts
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const dropdownRef = useRef(null);
    const tableScrollRef = useRef(null);
    const topScrollRef = useRef(null);
    const topScrollInnerRef = useRef(null);

    // Sync phantom div width so the top scrollbar accurately mirrors table width
    useEffect(() => {
        if (!tableScrollRef.current || !topScrollInnerRef.current) return;
        const sync = () => {
            if (topScrollInnerRef.current && tableScrollRef.current) {
                topScrollInnerRef.current.style.width = tableScrollRef.current.scrollWidth + 'px';
            }
        };
        sync();
        const observer = new ResizeObserver(sync);
        observer.observe(tableScrollRef.current);
        return () => observer.disconnect();
    });


    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const loadMetaCampaigns = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await fetchMetaCampaigns(selectedAccountId, dateRange);

                // Map raw Meta data to our frontend schema and filter out completed campaigns
                const mappedCampaigns = data
                    .filter(cmp => cmp.effective_status !== 'COMPLETED')
                    .map(cmp => {
                        const spend = parseFloat(cmp.spend || 0);
                        const leads = cmp.leads || 0;
                        const purchases = cmp.purchases || 0;
                        const purchaseValue = parseFloat(cmp.purchaseValue || 0);

                        const cpl = leads > 0 ? spend / leads : 0;
                        const cpp = purchases > 0 ? spend / purchases : 0;

                        // Use Meta's reported revenue if available; otherwise estimate from purchases × client avg price
                        const client = activeClients.find(c => c.adAccountId === selectedAccountId);
                        const unifiedAvgPrice = parseFloat(client?.avgPrice || 0);
                        const specificPrice = client?.campaignPrices?.[cmp.campaign_id];
                        const campaignAvgPrice = specificPrice !== undefined && specificPrice !== null 
                            ? parseFloat(specificPrice) 
                            : unifiedAvgPrice;

                        const effectiveRevenue = purchaseValue > 0 ? purchaseValue : purchases * campaignAvgPrice;
                        const roas = spend > 0 && effectiveRevenue > 0 ? effectiveRevenue / spend : 0;

                        const dailyBudget = cmp.daily_budget ? parseFloat(cmp.daily_budget) / 100 : 0;
                        const lifetimeBudget = cmp.lifetime_budget ? parseFloat(cmp.lifetime_budget) / 100 : 0;
                        const budget = dailyBudget > 0 ? dailyBudget : lifetimeBudget;
                        const budgetType = dailyBudget > 0 ? 'daily' : 'lifetime';

                        return {
                            id: cmp.campaign_id,
                            accountId: selectedAccountId,
                            name: cmp.campaign_name,
                            effective_status: cmp.effective_status,
                            budget: budget,
                            budgetType: budgetType,
                            results: leads,
                            resultType: 'Leads',
                            costPerResult: cpl,
                            purchases: purchases,
                            purchaseValue: purchaseValue,
                            cpp: cpp,
                            roas: roas,
                            amountSpent: spend,
                            impressions: parseInt(cmp.impressions || 0),
                            reach: parseInt(cmp.reach || 0),
                            adCreative: cmp.adCreative,
                        };
                    });

                setLiveCampaigns(mappedCampaigns);

                const urlCampaignId = searchParams.get('campaignId');
                if (urlCampaignId && mappedCampaigns.some(c => c.id === urlCampaignId)) {
                    setSelectedCampaignId(urlCampaignId);
                } else if (mappedCampaigns.length > 0) {
                    setSelectedCampaignId(mappedCampaigns[0].id);
                }
            } catch (err) {
                console.error("Failed to load campaigns:", err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        if (selectedAccountId) {
            loadMetaCampaigns();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedAccountId, dateRange.start?.toISOString(), dateRange.end?.toISOString(), selectedAccount?.avgPrice, JSON.stringify(selectedAccount?.campaignPrices)]);

    // Filter campaigns by account (redundant for now with 1 account, but keeps structure)
    const accountCampaigns = liveCampaigns.filter(c => c.accountId === selectedAccountId);

    const sortedCampaigns = React.useMemo(() => {
        let sortableItems = [...accountCampaigns];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                // Handle string comparisons
                if (typeof aValue === 'string') aValue = aValue.toLowerCase();
                if (typeof bValue === 'string') bValue = bValue.toLowerCase();

                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [accountCampaigns, sortConfig]);

    const requestSort = (key) => {
        let direction = 'desc'; // Default to desc for metrics
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = 'asc';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (columnKey) => {
        if (!sortConfig || sortConfig.key !== columnKey) {
            return <ArrowUpDown size={12} className="opacity-0 group-hover:opacity-40 transition-opacity" />;
        }
        return sortConfig.direction === 'asc' ? <ArrowUp size={12} className="text-[--primary]" /> : <ArrowDown size={12} className="text-[--primary]" />;
    };

    const selectedCampaign = liveCampaigns.find(c => c.id === selectedCampaignId);

    const [campaignAvgPrice, setCampaignAvgPrice] = React.useState('');
    const [isEditingCampaignPrice, setIsEditingCampaignPrice] = React.useState(false);

    // Sync avgPrice input with the selected client's stored price
    React.useEffect(() => {
        const price = selectedAccount?.avgPrice;
        setAvgPrice(price !== undefined && price !== null ? String(price) : '');
    }, [selectedAccount?.id, selectedAccount?.avgPrice]);

    // Sync campaign specific price
    React.useEffect(() => {
        if (!selectedCampaignId) return;
        const price = selectedAccount?.campaignPrices?.[selectedCampaignId];
        setCampaignAvgPrice(price !== undefined && price !== null ? String(price) : '');
    }, [selectedCampaignId, JSON.stringify(selectedAccount?.campaignPrices)]);

    return (
        <div className="flex flex-col h-full bg-[--bg-app] animate-fade-in">
            {/* Header */}
            <div className="h-16 border-b border-[--border] flex items-center justify-between px-6 bg-[--bg-app]">
                <div className="flex item-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-600/20 flex items-center justify-center border border-blue-500/30">
                        <SiMeta size={20} className="text-blue-400" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-[--text-main]">Ad Performance</h1>
                        <p className="text-xs text-[--text-muted]">Meta Ads Manager Integration</p>
                    </div>
                </div>

                {/* Selectors */}
                <div className="flex items-center gap-4">
                    {/* Date Picker */}
                    <DateRangePicker dateRange={dateRange} onChange={(range) => { setDateRange(range); setActiveChip(null); }} />

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
                                    const end = subDays(new Date(), 1);
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

                    {/* Ad Account Selector (Searchable Dropdown) */}
                    <div className="relative group" ref={dropdownRef}>
                        <div
                            className="flex items-center justify-between gap-2 bg-[--bg-surface] border border-[--border] px-3 py-2 rounded-lg min-w-[240px] cursor-pointer hover:border-[--primary] transition-colors"
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        >
                            <div className="flex items-center gap-2 overflow-hidden">
                                {selectedAccount?.logo ? (
                                    <img src={selectedAccount.logo} alt="" className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
                                ) : (
                                    <LayoutGrid size={14} className="text-[--text-muted] flex-shrink-0" />
                                )}
                                <span className="text-sm text-[--text-main] truncate">
                                    {selectedAccount?.name || 'Select Client...'}
                                </span>
                            </div>
                            <ChevronDown size={14} className={`text-[--text-muted] transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                        </div>

                        {isDropdownOpen && (
                            <div className="absolute top-full right-0 mt-2 w-[300px] bg-[--bg-card] border border-[--border] rounded-xl shadow-2xl z-50 overflow-hidden">
                                <div className="p-2 border-b border-[--border] sticky top-0 bg-[--bg-card] z-10">
                                    <div className="relative">
                                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[--text-muted]" />
                                        <input
                                            type="text"
                                            placeholder="Search accounts..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full bg-[--bg-surface] border border-[--border] rounded-lg py-2 pl-9 pr-3 text-sm outline-none focus:border-[--primary] transition-colors"
                                            autoFocus
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </div>
                                </div>
                                <div className="max-h-[300px] overflow-y-auto p-1 custom-scrollbar">
                                    {activeClients
                                        .filter(client => client.name.toLowerCase().includes(searchQuery.toLowerCase()))
                                        .map(client => (
                                            <div
                                                key={client.id}
                                                onClick={() => {
                                                    setSelectedAccountId(client.adAccountId);
                                                    setIsDropdownOpen(false);
                                                    setSearchQuery('');
                                                }}
                                                className={`px-3 py-2.5 rounded-lg text-sm cursor-pointer transition-colors flex items-center justify-between group ${selectedAccountId === client.adAccountId
                                                    ? 'bg-[--primary]/10 text-[--primary] font-medium'
                                                    : 'hover:bg-[--bg-surface] text-[--text-main]'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-2 truncate pr-4">
                                                    {client.logo ? (
                                                        <img src={client.logo} alt="" className="w-4 h-4 rounded-full object-cover flex-shrink-0" />
                                                    ) : null}
                                                    <span className="truncate">{client.name}</span>
                                                </div>
                                                {selectedAccountId === client.adAccountId && <CheckCircle2 size={14} className="text-[--primary] flex-shrink-0" />}
                                            </div>
                                        ))
                                    }
                                    {activeClients.filter(client => client.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                                        <div className="px-3 py-4 text-center text-sm text-[--text-muted]">
                                            No active clients found.
                                        </div>
                                    )}
                                </div>
                                <div className="p-2 border-t border-[--border] bg-[--bg-surface] rounded-b-xl">
                                    <button
                                        onClick={() => {
                                            setIsDropdownOpen(false);
                                            navigate('/clients');
                                        }}
                                        className="w-full flex items-center justify-center gap-2 py-2 px-3 text-sm font-medium text-[--text-muted] hover:text-[--text-main] hover:bg-[--bg-card] rounded-lg transition-colors"
                                    >
                                        <Settings2 size={14} />
                                        Manage Clients
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-6">
                {isLoading ? (
                    <div className="max-w-7xl mx-auto space-y-6 w-full animate-pulse">
                        {/* Context Banner Skeleton */}
                        <div className="bg-[--bg-surface] border border-[--border] rounded-xl p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-[--bg-card] rounded-lg"></div>
                                <div>
                                    <div className="w-48 h-5 bg-[--bg-card] rounded mb-2"></div>
                                    <div className="w-32 h-3 bg-[--bg-card] rounded"></div>
                                </div>
                            </div>
                            <div className="w-20 h-6 bg-[--bg-card] rounded-full"></div>
                        </div>

                        {/* Top Metrics Skeleton */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="bg-[--bg-surface] rounded-xl p-5 border border-[--border] flex flex-col justify-between h-[120px]">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-24 h-4 bg-[--bg-card] rounded"></div>
                                        <div className="w-8 h-8 bg-[--bg-card] rounded-lg"></div>
                                    </div>
                                    <div>
                                        <div className="w-20 h-8 bg-[--bg-card] rounded mb-2"></div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Charts Skeleton */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div className="bg-[--bg-surface] rounded-xl p-5 border border-[--border] h-[300px] flex flex-col">
                                <div className="w-32 h-4 bg-[--bg-card] rounded mb-4"></div>
                                <div className="flex-1 bg-[--bg-card] rounded"></div>
                            </div>
                            <div className="bg-[--bg-surface] rounded-xl p-5 border border-[--border] h-[300px] flex flex-col">
                                <div className="w-32 h-4 bg-[--bg-card] rounded mb-4"></div>
                                <div className="flex-1 bg-[--bg-card] rounded"></div>
                            </div>
                        </div>

                        {/* Matrix Skeleton */}
                        <div className="bg-[--bg-surface] border border-[--border] rounded-xl overflow-hidden mt-6 shadow-sm">
                            <div className="px-6 py-4 border-b border-[--border]">
                                <div className="w-40 h-4 bg-[--bg-card] rounded"></div>
                            </div>
                            <div className="p-0">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="flex gap-4 p-6 border-b border-[--border] items-center">
                                        <div className="w-1/4 h-5 bg-[--bg-card] rounded"></div>
                                        <div className="w-1/6 h-5 bg-[--bg-card] rounded"></div>
                                        <div className="w-1/6 h-5 bg-[--bg-card] rounded"></div>
                                        <div className="w-1/6 h-5 bg-[--bg-card] rounded"></div>
                                        <div className="w-1/6 h-5 bg-[--bg-card] rounded"></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center h-full text-[--error]">
                        <p className="font-bold mb-2">Error loading Meta Ads data</p>
                        <p className="text-sm opacity-80">{error}</p>
                    </div>
                ) : selectedCampaign ? (
                    <div className="max-w-7xl mx-auto space-y-6">
                        {/* Context Banner */}
                        <div className="bg-[--bg-surface] border border-[--border] rounded-xl p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                {selectedAccount?.logo ? (
                                    <img src={selectedAccount.logo} alt="Client Logo" className="w-10 h-10 rounded-lg object-cover" />
                                ) : (
                                    <div className="p-2 bg-[--bg-app] rounded-lg flex items-center justify-center w-10 h-10 border border-[--border]">
                                        <Layers size={20} className="text-blue-400" />
                                    </div>
                                )}
                                <div>
                                    <div className="text-sm font-medium text-[--text-muted]">
                                        {selectedAccount?.name}
                                    </div>
                                    <h2 className="text-xl font-bold text-[--text-main] mt-0.5">{selectedCampaign.name}</h2>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {/* Unified Client Price */}
                                <div className="flex items-center gap-2.5 bg-[--bg-app] border border-[--border] rounded-xl px-4 py-2.5 min-w-[180px] transition-all duration-200 hover:border-[--primary]/40">
                                    <div className="flex flex-col flex-1 gap-0.5">
                                        <span className="text-[10px] font-bold text-[--text-muted] uppercase tracking-widest">Base Avg Price</span>
                                        {isEditingPrice ? (
                                            <div className="flex items-center gap-1">
                                                <span className="text-sm font-semibold text-[--text-muted]">£</span>
                                                <input
                                                    autoFocus
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    placeholder="0.00"
                                                    value={avgPrice}
                                                    onChange={(e) => setAvgPrice(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            const parsed = parseFloat(avgPrice);
                                                            const val = isNaN(parsed) ? null : parsed;
                                                            updateClient(selectedAccount.id, { avgPrice: val });
                                                            setIsEditingPrice(false);
                                                        }
                                                        if (e.key === 'Escape') setIsEditingPrice(false);
                                                    }}
                                                    className="w-20 bg-transparent text-sm font-bold text-[--text-main] outline-none placeholder:text-[--text-muted]/40"
                                                />
                                            </div>
                                        ) : (
                                            <span className="text-sm font-bold text-[--text-main]">
                                                {avgPrice ? `£${parseFloat(avgPrice).toFixed(2)}` : <span className="text-[--text-muted] font-normal italic text-xs">Not set</span>}
                                            </span>
                                        )}
                                    </div>
                                    {isEditingPrice ? (
                                        <button onClick={() => {
                                                const parsed = parseFloat(avgPrice);
                                                const val = isNaN(parsed) ? null : parsed;
                                                updateClient(selectedAccount.id, { avgPrice: val });
                                                setIsEditingPrice(false);
                                            }} className="p-1.5 rounded-lg bg-[--primary]/10 text-[--primary] hover:bg-[--primary]/20"><Check size={13} /></button>
                                    ) : (
                                        <button onClick={() => setIsEditingPrice(true)} className="p-1.5 rounded-lg text-[--text-muted] hover:text-[--primary] hover:bg-[--primary]/10"><Pencil size={13} /></button>
                                    )}
                                </div>

                                {/* Campaign Specific Price Override */}
                                <div className="flex items-center gap-2.5 bg-gradient-to-r from-[--bg-app] to-[--primary]/5 border border-[--border] rounded-xl px-4 py-2.5 min-w-[180px] transition-all duration-200 hover:border-[--primary]/40">
                                    <div className="flex flex-col flex-1 gap-0.5">
                                        <span className="text-[10px] font-bold text-[--primary] uppercase tracking-widest opacity-80">Campaign Override</span>
                                        {isEditingCampaignPrice ? (
                                            <div className="flex items-center gap-1">
                                                <span className="text-sm font-semibold text-[--text-muted]">£</span>
                                                <input
                                                    autoFocus
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    placeholder={avgPrice ? `${parseFloat(avgPrice).toFixed(2)}` : "0.00"}
                                                    value={campaignAvgPrice}
                                                    onChange={(e) => setCampaignAvgPrice(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            const parsed = parseFloat(campaignAvgPrice);
                                                            const val = isNaN(parsed) ? null : parsed;
                                                            const currentPrices = selectedAccount.campaignPrices || {};
                                                            updateClient(selectedAccount.id, { campaignPrices: { ...currentPrices, [selectedCampaignId]: val } });
                                                            setIsEditingCampaignPrice(false);
                                                        }
                                                        if (e.key === 'Escape') setIsEditingCampaignPrice(false);
                                                    }}
                                                    className="w-20 bg-transparent text-sm font-bold text-[--text-main] outline-none placeholder:text-[--text-muted]/40"
                                                />
                                            </div>
                                        ) : (
                                            <span className="text-sm font-bold text-[--primary]">
                                                {campaignAvgPrice ? `£${parseFloat(campaignAvgPrice).toFixed(2)}` : <span className="text-[--text-muted]/60 font-normal italic text-xs uppercase tracking-wider">Using Base Price</span>}
                                            </span>
                                        )}
                                    </div>
                                    {isEditingCampaignPrice ? (
                                        <button onClick={() => {
                                                const parsed = parseFloat(campaignAvgPrice);
                                                const val = isNaN(parsed) ? null : parsed;
                                                const currentPrices = selectedAccount.campaignPrices || {};
                                                updateClient(selectedAccount.id, { campaignPrices: { ...currentPrices, [selectedCampaignId]: val } });
                                                setIsEditingCampaignPrice(false);
                                            }} className="p-1.5 rounded-lg bg-[--primary]/10 text-[--primary] hover:bg-[--primary]/20"><Check size={13} /></button>
                                    ) : (
                                        <button onClick={() => setIsEditingCampaignPrice(true)} className="p-1.5 rounded-lg text-[--text-muted] hover:text-[--primary] hover:bg-[--primary]/10"><Pencil size={13} /></button>
                                    )}
                                </div>

                                <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-2
                                    ${selectedCampaign.effective_status === 'ACTIVE'
                                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                        : 'bg-[--bg-app] text-[--text-muted] border border-[--border]'
                                    }`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${selectedCampaign.effective_status === 'ACTIVE' ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'}`} />
                                    {selectedCampaign.effective_status}
                                </div>
                            </div>
                        </div>

                        {/* The Dashboard */}
                        <AdsDashboard 
                            campaign={selectedCampaign} 
                            dateRange={dateRange} 
                            avgPrice={selectedAccount?.campaignPrices?.[selectedCampaignId] ?? selectedAccount?.avgPrice} 
                        />

                        {/* Campaign Matrix */}
                        <div className="bg-[--bg-surface] border border-[--border] rounded-xl overflow-hidden mt-6 mb-10 shadow-sm">
                            <div className="px-6 py-4 border-b border-[--border] flex items-center justify-between bg-[--bg-card]">
                                <h3 className="text-sm font-bold text-[--text-main] uppercase tracking-wider">All Campaigns ({accountCampaigns.length})</h3>
                                <div className="flex items-center gap-6">
                                    <div className="flex flex-col items-end">
                                        <span className="text-[--text-muted] text-xs font-bold uppercase tracking-wider">Total Leads ({activeChip || 'Custom'})</span>
                                        <span className="font-bold text-emerald-400 text-lg">{accountCampaigns.reduce((sum, c) => sum + (c.results || 0), 0).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Top scrollbar mirror */}
                            <div
                                ref={topScrollRef}
                                className="overflow-x-auto w-full border-b border-[--border]"
                                style={{ height: '12px' }}
                                onScroll={(e) => {
                                    if (tableScrollRef.current) tableScrollRef.current.scrollLeft = e.currentTarget.scrollLeft;
                                }}
                            >
                                <div ref={topScrollInnerRef} style={{ height: '1px' }} />
                            </div>

                            {/* Main table scroll */}
                            <div
                                ref={tableScrollRef}
                                className="overflow-x-auto w-full"
                                onScroll={(e) => {
                                    if (topScrollRef.current) topScrollRef.current.scrollLeft = e.currentTarget.scrollLeft;
                                }}
                            >
                                <table className="w-full text-left min-w-max whitespace-nowrap">
                                    <thead>
                                        <tr className="bg-[--bg-card] border-b border-[--border]">
                                            {/* Frozen first column */}
                                            <th
                                                className="px-6 py-4 text-xs font-semibold text-[--text-muted] tracking-wider uppercase cursor-pointer hover:text-[--text-main] transition-colors group select-none sticky left-0 z-10 bg-[--bg-card] shadow-[2px_0_6px_-2px_rgba(0,0,0,0.3)]"
                                                onClick={() => requestSort('name')}
                                            >
                                                <div className="flex items-center gap-1.5">Campaign Name {getSortIcon('name')}</div>
                                            </th>
                                            <th className="px-6 py-4 text-xs font-semibold text-[--text-muted] tracking-wider uppercase cursor-pointer hover:text-[--text-main] transition-colors group select-none" onClick={() => requestSort('effective_status')}>
                                                <div className="flex items-center gap-1.5">Status {getSortIcon('effective_status')}</div>
                                            </th>
                                            <th className="px-6 py-4 text-xs font-semibold text-[--text-muted] tracking-wider uppercase text-center cursor-pointer hover:text-[--text-main] transition-colors group select-none" onClick={() => requestSort('results')}>
                                                <div className="flex items-center justify-center gap-1.5">Results {getSortIcon('results')}</div>
                                            </th>
                                            <th className="px-6 py-4 text-xs font-semibold text-[--text-muted] tracking-wider uppercase text-center cursor-pointer hover:text-[--text-main] transition-colors group select-none" onClick={() => requestSort('costPerResult')}>
                                                <div className="flex items-center justify-center gap-1.5">Cost per Result {getSortIcon('costPerResult')}</div>
                                            </th>
                                            <th className="px-6 py-4 text-xs font-semibold text-[--text-muted] tracking-wider uppercase text-center cursor-pointer hover:text-[--text-main] transition-colors group select-none" onClick={() => requestSort('budget')}>
                                                <div className="flex items-center justify-center gap-1.5">Budget {getSortIcon('budget')}</div>
                                            </th>
                                            <th className="px-6 py-4 text-xs font-semibold text-[--text-muted] tracking-wider uppercase text-center cursor-pointer hover:text-[--text-main] transition-colors group select-none" onClick={() => requestSort('amountSpent')}>
                                                <div className="flex items-center justify-center gap-1.5">Amount Spent {getSortIcon('amountSpent')}</div>
                                            </th>
                                            <th className="px-6 py-4 text-xs font-semibold text-[--text-muted] tracking-wider uppercase text-center cursor-pointer hover:text-[--text-main] transition-colors group select-none" onClick={() => requestSort('purchases')}>
                                                <div className="flex items-center justify-center gap-1.5">Bookings {getSortIcon('purchases')}</div>
                                            </th>
                                            <th className="px-6 py-4 text-xs font-semibold text-[--text-muted] tracking-wider uppercase text-center cursor-pointer hover:text-[--text-main] transition-colors group select-none" onClick={() => requestSort('cpp')}>
                                                <div className="flex items-center justify-center gap-1.5">CPP {getSortIcon('cpp')}</div>
                                            </th>
                                            <th className="px-6 py-4 text-xs font-semibold text-[--text-muted] tracking-wider uppercase text-center cursor-pointer hover:text-[--text-main] transition-colors group select-none" onClick={() => requestSort('roas')}>
                                                <div className="flex items-center justify-center gap-1.5">ROAS {getSortIcon('roas')}</div>
                                            </th>
                                            <th className="px-6 py-4 text-xs font-semibold text-[--text-muted] tracking-wider uppercase text-center cursor-pointer hover:text-[--text-main] transition-colors group select-none" onClick={() => requestSort('impressions')}>
                                                <div className="flex items-center justify-center gap-1.5">Impressions {getSortIcon('impressions')}</div>
                                            </th>
                                            <th className="px-6 py-4 text-xs font-semibold text-[--text-muted] tracking-wider uppercase text-center cursor-pointer hover:text-[--text-main] transition-colors group select-none" onClick={() => requestSort('reach')}>
                                                <div className="flex items-center justify-center gap-1.5">Reach {getSortIcon('reach')}</div>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[--border]">
                                        {sortedCampaigns.map(cmp => (
                                            <tr
                                                key={cmp.id}
                                                className={`hover:bg-[--bg-card] transition-colors cursor-pointer ${selectedCampaignId === cmp.id ? 'bg-[--primary]/10' : ''}`}
                                                onClick={() => setSelectedCampaignId(cmp.id)}
                                            >
                                                {/* Frozen campaign name cell */}
                                                <td className={`px-6 py-4 sticky left-0 z-10 overflow-hidden shadow-[2px_0_6px_-2px_rgba(0,0,0,0.3)] ${
                                                    selectedCampaignId === cmp.id ? 'bg-[--primary]/10' : 'bg-[--bg-surface]'
                                                } group-hover:bg-[--bg-card]`}>
                                                    <div className="font-bold text-[--text-main] flex items-center gap-2 max-w-[220px] whitespace-normal leading-snug">
                                                        {cmp.name}
                                                        {cmp.adCreative && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setActiveCreativeCampaign(cmp);
                                                                }}
                                                                title="View Ad Creative"
                                                                className="shrink-0 p-1 hover:bg-[--bg-surface] rounded border border-transparent hover:border-[--border] text-[--text-muted] hover:text-[--primary] transition-colors"
                                                            >
                                                                <ImageIcon size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className="text-[10px] uppercase tracking-wider text-[--text-muted] mt-1">{cmp.id}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap min-w-[120px]">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide
                                                        ${cmp.effective_status === 'ACTIVE'
                                                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                            : 'bg-[--bg-app] text-[--text-muted] border border-[--border]'}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${cmp.effective_status === 'ACTIVE' ? 'bg-emerald-400' : 'bg-gray-500'}`} />
                                                        {cmp.effective_status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-bold text-[--text-main] text-center">
                                                    {cmp.results > 0 ? (
                                                        <>{cmp.results.toLocaleString()} <span className="text-xs text-[--text-muted] font-normal">Leads</span></>
                                                    ) : '—'}
                                                </td>
                                                <td className="px-6 py-4 text-sm font-bold text-[--text-main] text-center">
                                                    {cmp.costPerResult > 0 ? (
                                                        <>{'£' + cmp.costPerResult.toFixed(2)}<span className="text-xs text-[--text-muted] font-normal"> /Lead</span></>
                                                    ) : '—'}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-[--text-main] text-center">
                                                    {cmp.budget ? '£' + cmp.budget.toFixed(2) : '—'} <span className="text-xs text-[--text-muted] font-normal">/{cmp.budgetType === 'daily' ? 'day' : 'total'}</span>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-bold text-[--text-main] text-center">
                                                    {cmp.amountSpent > 0 ? '£' + cmp.amountSpent.toFixed(2) : '—'}
                                                </td>
                                                <td className="px-6 py-4 text-sm font-bold text-[--text-main] text-center">
                                                    {cmp.purchases > 0 ? cmp.purchases.toLocaleString() : '—'}
                                                </td>
                                                <td className="px-6 py-4 text-sm font-bold text-[--text-main] text-center">
                                                    {cmp.cpp > 0 ? '£' + cmp.cpp.toFixed(2) : '—'}
                                                </td>
                                                <td className="px-6 py-4 text-sm font-bold text-[--text-main] text-center">
                                                    {cmp.roas > 0 ? cmp.roas.toFixed(2) + 'x' : '—'}
                                                </td>
                                                <td className="px-6 py-4 text-sm font-bold text-[--text-main] text-center">
                                                    {cmp.impressions > 0 ? cmp.impressions.toLocaleString() : '—'}
                                                </td>
                                                <td className="px-6 py-4 text-sm font-bold text-[--text-main] text-center">
                                                    {cmp.reach > 0 ? cmp.reach.toLocaleString() : '—'}
                                                </td>
                                            </tr>
                                        ))}
                                        {accountCampaigns.length === 0 && (
                                            <tr>
                                                <td colSpan="11" className="px-6 py-8 text-center text-[--text-muted]">No campaigns found for this account.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-[--text-muted]">
                        <Layers size={48} className="mb-4 opacity-20" />
                        <p>Select a client and campaign to view performance data.</p>
                    </div>
                )}
            </div>

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

export default AdsPerformance;
