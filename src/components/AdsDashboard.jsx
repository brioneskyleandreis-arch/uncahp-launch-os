import React, { useMemo, useState, useEffect } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { format, isWithinInterval, startOfDay, endOfDay, eachDayOfInterval } from 'date-fns';
import { fetchMetaDailyTrends } from '../lib/metaApi';

const AdsDashboard = ({ campaign, dateRange, avgPrice = 0 }) => {
    if (!campaign) return null;

    const [dailyData, setDailyData] = useState([]);
    const [isLoadingTrends, setIsLoadingTrends] = useState(false);

    useEffect(() => {
        const loadTrends = async () => {
            if (!campaign?.accountId) return;
            setIsLoadingTrends(true);
            try {
                // Fetch daily breakdowns for this specific campaign
                const data = await fetchMetaDailyTrends(campaign.id);

                // Note: The API returns account-level trends right now. 
                // For a production app, we would ideally filter this by Campaign ID,
                // but Meta's API design requires different query structures for that.
                // For MVP, mapping account trends to show the chart is functioning.
                const mappedData = data.map(day => {
                    const spend = parseFloat(day.spend || 0);
                    const leadTypesPriority = ['lead', 'onsite_conversion.lead_grouped', 'offsite_complete_registration_add_meta_leads', 'offsite_submit_application_add_meta_leads'];
                    let results = 0;
                    if (day.actions) {
                        for (const type of leadTypesPriority) {
                            const action = day.actions.find(a => a.action_type === type);
                            if (action) {
                                results = parseInt(action.value || 0);
                                break;
                            }
                        }
                    }
                    const costPerResult = results > 0 ? spend / results : 0;

                    const clicksAction = day.actions?.find(a => a.action_type === 'link_click');
                    const clicks = clicksAction ? parseInt(clicksAction.value) : 0;
                    const impressions = parseInt(day.impressions || 0);
                    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;

                    const purchaseTypesPriority = ['purchase', 'offsite_conversion.fb_pixel_purchase'];
                    let purchases = 0;
                    let revenue = 0;
                    if (day.actions) {
                        for (const type of purchaseTypesPriority) {
                            const action = day.actions.find(a => a.action_type === type);
                            if (action) {
                                purchases = parseInt(action.value || 0);
                                break;
                            }
                        }
                    }
                    if (day.action_values) {
                        for (const type of purchaseTypesPriority) {
                            const actionValue = day.action_values.find(a => a.action_type === type);
                            if (actionValue) {
                                revenue = parseFloat(actionValue.value || 0);
                                break;
                            }
                        }
                    }

                    const currentAvgPrice = parseFloat(avgPrice || 0);
                    const effectiveRevenue = revenue > 0 ? revenue : purchases * currentAvgPrice;
                    const cpp = purchases > 0 ? spend / purchases : 0;
                    const roas = spend > 0 ? effectiveRevenue / spend : 0;

                    return {
                        date: day.date_start,
                        spend,
                        results,
                        costPerResult,
                        ctr,
                        impressions,
                        clicks,
                        purchases,
                        revenue: effectiveRevenue,
                        cpp,
                        roas
                    };
                }).reverse(); // Meta returns descending, Recharts needs ascending

                setDailyData(mappedData);
            } catch (err) {
                console.error("Failed to load trends:", err);
            } finally {
                setIsLoadingTrends(false);
            }
        };

        loadTrends();
    }, [campaign]);

    // Filter data based on date range and calculate current vs previous period totals
    const processedData = useMemo(() => {
        if (!dateRange || !dateRange.start) return { totals: campaign, chartData: [] };

        const start = startOfDay(dateRange.start);
        const end = endOfDay(dateRange.end || dateRange.start);

        // Calculate the number of days in the range
        const daysDiff = Math.round(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1;
        // Previous period matching the length of current period
        const prevEnd = endOfDay(new Date(start.getTime() - 24 * 60 * 60 * 1000));
        const prevStart = startOfDay(new Date(prevEnd.getTime() - (daysDiff - 1) * 24 * 60 * 60 * 1000));

        let currentResults = 0; let currentSpend = 0; let currentImpressions = 0;
        let currentPurchases = 0; let currentRevenue = 0;
        let prevResults = 0; let prevSpend = 0; let prevImpressions = 0;
        let prevPurchases = 0; let prevRevenue = 0;

        // Map over every day in the requested interval to pad missing days for charts
        const allDays = eachDayOfInterval({ start, end });
        const paddedData = allDays.map(dayDate => {
            const formattedDateStr = format(dayDate, 'yyyy-MM-dd');
            const existingData = dailyData.find(d => d.date === formattedDateStr);

            if (existingData) {
                currentResults += existingData.results || 0;
                currentSpend += existingData.spend || 0;
                currentImpressions += existingData.impressions || 0;
                currentPurchases += existingData.purchases || 0;
                currentRevenue += existingData.revenue || 0;
                return existingData;
            }
            return { date: formattedDateStr, spend: 0, results: 0, costPerResult: 0, ctr: 0, impressions: 0, clicks: 0, purchases: 0, revenue: 0, cpp: 0, roas: 0 };
        });

        // Calculate previous period stats for trend arrows
        dailyData.forEach(day => {
            const dayDate = startOfDay(new Date(day.date));
            if (dayDate >= prevStart && dayDate <= prevEnd) {
                prevResults += day.results || 0;
                prevSpend += day.spend || 0;
                prevImpressions += day.impressions || 0;
                prevPurchases += day.purchases || 0;
                prevRevenue += day.revenue || 0;
            }
        });

        const currentAvgPrice = parseFloat(avgPrice || 0);
        const effectiveCurrentRevenue = currentRevenue > 0 ? currentRevenue : currentPurchases * currentAvgPrice;
        const effectivePrevRevenue = prevRevenue > 0 ? prevRevenue : prevPurchases * currentAvgPrice;

        const currentCpl = currentResults > 0 ? currentSpend / currentResults : 0;
        const prevCpl = prevResults > 0 ? prevSpend / prevResults : 0;
        const currentCpp = currentPurchases > 0 ? currentSpend / currentPurchases : 0;
        const prevCpp = prevPurchases > 0 ? prevSpend / prevPurchases : 0;
        const currentRoas = currentSpend > 0 ? effectiveCurrentRevenue / currentSpend : 0;
        const prevRoas = prevSpend > 0 ? effectivePrevRevenue / prevSpend : 0;

        // Calculate % difference for trends
        const calcTrend = (current, previous, inverse = false) => {
            if (previous === 0) return current > 0 ? { dir: 'up', isGood: !inverse } : { dir: null, isGood: null };
            const diff = ((current - previous) / previous) * 100;
            if (Math.abs(diff) < 1) return { dir: null, isGood: null };
            const isUp = diff > 0;
            const isGood = inverse ? !isUp : isUp;
            return { dir: isUp ? 'up' : 'down', isGood, val: `${Math.abs(diff).toFixed(1)}%` };
        };

        const totals = {
            results: campaign.results,
            resultsTrend: calcTrend(currentResults, prevResults),
            cpl: campaign.costPerResult,
            cplTrend: calcTrend(currentCpl, prevCpl, true), // CPL down is good
            spend: campaign.amountSpent,
            spendTrend: calcTrend(currentSpend, prevSpend, true), // Spend down is good
            budget: campaign.budget,
            budgetType: campaign.budgetType,
            purchases: campaign.purchases,
            purchasesTrend: calcTrend(currentPurchases, prevPurchases),
            cpp: campaign.cpp,
            cppTrend: calcTrend(currentCpp, prevCpp, true), // CPP down is good
            roas: campaign.roas,
            roasTrend: calcTrend(currentRoas, prevRoas)
        };

        return { totals, chartData: paddedData };
    }, [campaign, dailyData, dateRange]);

    const { totals, chartData } = processedData;
    const hasData = chartData.length > 0;

    const formatCurrency = (val) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(val);
    const formatNumber = (val) => val ? new Intl.NumberFormat('en-US').format(val) : '0';

    if (isLoadingTrends) {
        return (
            <div className="w-full animate-pulse">
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
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <MetricCard label="Amount Spent" value={totals.spend > 0 ? formatCurrency(totals.spend) : '-'} trend={totals.spendTrend?.dir} goodTrend={totals.spendTrend?.isGood} />
                <MetricCard label="Results" value={formatNumber(totals.results)} subId={campaign.resultType} trend={totals.resultsTrend?.dir} goodTrend={totals.resultsTrend?.isGood} />
                <MetricCard label="Cost per Lead" value={totals.cpl > 0 ? formatCurrency(totals.cpl) : '-'} trend={totals.cplTrend?.dir} goodTrend={totals.cplTrend?.isGood} />
                <MetricCard label="Bookings" value={formatNumber(totals.purchases)} trend={totals.purchasesTrend?.dir} goodTrend={totals.purchasesTrend?.isGood} />
                <MetricCard label="Cost per Booking" value={totals.cpp > 0 ? formatCurrency(totals.cpp) : '-'} trend={totals.cppTrend?.dir} goodTrend={totals.cppTrend?.isGood} />
                <MetricCard label="ROAS" value={totals.roas > 0 ? totals.roas.toFixed(2) + 'x' : '-'} trend={totals.roasTrend?.dir} goodTrend={totals.roasTrend?.isGood} />
            </div>

            {/* Visual Graphs Section */}
            {hasData ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Results Over Time Chart */}
                    <div className="bg-[--bg-surface] border border-[--border] p-4 rounded-xl shadow-sm">
                        <h3 className="text-sm font-bold text-[--text-muted] uppercase tracking-wide mb-4">{campaign.resultType} Over Time</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorResults" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f48ccf" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#f48ccf" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={(str) => format(new Date(str), 'MMM d')}
                                        stroke="var(--text-muted)"
                                        fontSize={12}
                                    />
                                    <YAxis stroke="var(--text-muted)" fontSize={12} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', borderRadius: '8px' }}
                                        labelStyle={{ color: 'var(--text-main)' }}
                                    />
                                    <Legend />
                                    <Area type="monotone" dataKey="results" stroke="#f48ccf" fill="url(#colorResults)" name={campaign.resultType} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* CPL Trend Chart */}
                    <div className="bg-[--bg-surface] border border-[--border] p-4 rounded-xl shadow-sm">
                        <h3 className="text-sm font-bold text-[--text-muted] uppercase tracking-wide mb-4">CPL Trend</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={(str) => format(new Date(str), 'MMM d')}
                                        stroke="var(--text-muted)"
                                        fontSize={12}
                                    />
                                    <YAxis stroke="var(--text-muted)" fontSize={12} tickFormatter={(val) => formatCurrency(val)} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', borderRadius: '8px' }}
                                        cursor={{ stroke: 'var(--border)', strokeWidth: 1, strokeDasharray: '3 3' }}
                                        formatter={(val) => formatCurrency(val)}
                                    />
                                    <Legend
                                        verticalAlign="bottom"
                                        height={36}
                                        iconType="line"
                                        formatter={(value) => <span style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 'bold' }}>{value.toUpperCase()}</span>}
                                    />
                                    <Line type="monotone" dataKey="costPerResult" stroke="#8b5cf6" strokeWidth={3} dot={{ fill: '#8b5cf6', r: 4, strokeWidth: 2, stroke: 'var(--bg-card)' }} activeDot={{ r: 6, strokeWidth: 0 }} name="CPL" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Purchases Over Time Chart */}
                    <div className="bg-[--bg-surface] border border-[--border] p-4 rounded-xl shadow-sm">
                        <h3 className="text-sm font-bold text-[--text-muted] uppercase tracking-wide mb-4">Bookings Over Time</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorPurchases" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={(str) => format(new Date(str), 'MMM d')}
                                        stroke="var(--text-muted)"
                                        fontSize={12}
                                    />
                                    <YAxis stroke="var(--text-muted)" fontSize={12} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', borderRadius: '8px' }}
                                        labelStyle={{ color: 'var(--text-main)' }}
                                    />
                                    <Legend />
                                    <Area type="monotone" dataKey="purchases" stroke="#10b981" fill="url(#colorPurchases)" name="Bookings" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* ROAS Trend Chart */}
                    <div className="bg-[--bg-surface] border border-[--border] p-4 rounded-xl shadow-sm">
                        <h3 className="text-sm font-bold text-[--text-muted] uppercase tracking-wide mb-4">ROAS Trend</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={(str) => format(new Date(str), 'MMM d')}
                                        stroke="var(--text-muted)"
                                        fontSize={12}
                                    />
                                    <YAxis stroke="var(--text-muted)" fontSize={12} tickFormatter={(val) => `${val.toFixed(1)}x`} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', borderRadius: '8px' }}
                                        cursor={{ stroke: 'var(--border)', strokeWidth: 1, strokeDasharray: '3 3' }}
                                        formatter={(val) => `${val.toFixed(2)}x`}
                                    />
                                    <Legend
                                        verticalAlign="bottom"
                                        height={36}
                                        iconType="line"
                                        formatter={(value) => <span style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 'bold' }}>{value.toUpperCase()}</span>}
                                    />
                                    <Line type="monotone" dataKey="roas" stroke="#f59e0b" strokeWidth={3} dot={{ fill: '#f59e0b', r: 4, strokeWidth: 2, stroke: 'var(--bg-card)' }} activeDot={{ r: 6, strokeWidth: 0 }} name="ROAS" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="h-64 flex items-center justify-center bg-[--bg-surface] border border-[--border] rounded-xl text-[--text-muted]">
                    No data available for this date range
                </div>
            )}

            {/* Table section intentionally removed globally in favor of top-level metrics */}
        </div>
    );
};

const MetricCard = ({ label, value, subId, trend, goodTrend = false }) => (
    <div className="bg-[--bg-card] border border-[--border] p-4 rounded-xl">
        <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-bold text-[--text-muted] uppercase tracking-wide">{label}</span>
            {trend === 'up' && <ArrowUp size={14} className={goodTrend ? 'text-emerald-500' : 'text-emerald-500'} />}
            {trend === 'down' && <ArrowDown size={14} className={goodTrend ? 'text-emerald-500' : 'text-rose-500'} />}
        </div>
        <div className="flex items-baseline gap-2">
            <div className="text-xl font-bold text-[--text-main]">{value}</div>
            {subId && <div className="text-[10px] text-[--text-muted]">{subId}</div>}
        </div>
    </div>
);

export default AdsDashboard;
