// Utility to generate dates relative to today
const getRelativeDate = (daysAgo) => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString().split('T')[0];
};

// Generate realistic daily stats for the last 60 days
const generateDailyStats = (baseSpend, baseROAS) => {
    const stats = [];
    for (let i = 0; i < 60; i++) {
        const date = getRelativeDate(i);
        const dailySpend = baseSpend * (0.8 + Math.random() * 0.4); // +/- 20% variance
        const dailyROAS = baseROAS * (0.7 + Math.random() * 0.6); // +/- 30% variance
        const dailyRevenue = dailySpend * dailyROAS;
        stats.push({
            date,
            spend: parseFloat(dailySpend.toFixed(2)),
            revenue: parseFloat(dailyRevenue.toFixed(2)),
            impressions: Math.floor(dailySpend * 100 * (0.9 + Math.random() * 0.2)),
            clicks: Math.floor(dailySpend * 2 * (0.8 + Math.random() * 0.4)),
        });
    }
    return stats.sort((a, b) => new Date(a.date) - new Date(b.date)); // Sort ascending
};

export const adAccounts = [
    { id: 'act_luxe', name: 'Luxe Aesthetics - Main', currency: 'GBP' },
    { id: 'act_skindeep', name: 'SkinDeep Clinic', currency: 'GBP' },
    { id: 'act_drsmith', name: 'Dr. A. Smith - Private', currency: 'GBP' }
];

export const campaigns = [
    {
        id: 'cmp_botox',
        accountId: 'act_luxe',
        name: 'Botox - New Client Promo',
        status: 'Active',
        delivery: 'active',
        budget: 100.00,
        budgetType: 'daily',
        results: 342,
        resultType: 'Leads',
        costPerResult: 12.50,
        amountSpent: 4275.00,
        impressions: 45000,
        reach: 12000,
        actions: 342, // Will be removed from display but keeping in data for now
        dailyStats: generateDailyStats(100, 3.5), // Spend ~$100/day, ROAS ~3.5
    },
    {
        id: 'cmp_cool',
        accountId: 'act_luxe',
        name: 'CoolSculpting - Summer Ready',
        status: 'Active',
        delivery: 'active',
        budget: 250.00,
        budgetType: 'daily',
        results: 85,
        resultType: 'Leads',
        costPerResult: 45.00,
        amountSpent: 3825.00,
        impressions: 28000,
        reach: 8500,
        actions: 85,
        dailyStats: generateDailyStats(250, 4.2),
    },
    {
        id: 'cmp_laser',
        accountId: 'act_luxe',
        name: 'Laser Hair Removal - Package',
        status: 'Paused',
        delivery: 'inactive',
        budget: 75.00,
        budgetType: 'daily',
        results: 210,
        resultType: 'Leads',
        costPerResult: 8.50,
        amountSpent: 1785.00,
        impressions: 32000,
        reach: 15000,
        actions: 210,
        dailyStats: generateDailyStats(75, 2.8),
    },
    {
        id: 'cmp_hydra',
        accountId: 'act_skindeep',
        name: 'HydraFacial - Glow Up',
        status: 'Active',
        delivery: 'active',
        budget: 50.00,
        budgetType: 'daily',
        results: 120,
        resultType: 'Leads',
        costPerResult: 15.00,
        amountSpent: 1800.00,
        impressions: 18000,
        reach: 6000,
        actions: 120,
        dailyStats: generateDailyStats(50, 5.0),
    }
];
