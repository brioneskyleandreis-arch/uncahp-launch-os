/**
 * Utility for fetching data directly from the Meta Graph API.
 * 
 * NOTE: For MVP and local development, we are using the Access Token 
 * exposed in standard VITE_ env vars. Before deploying to production, 
 * this fetch logic MUST be migrated to the Supabase Edge Function 
 * we wrote to prevent exposing the system token to the client bundle.
 */

import { format } from 'date-fns';

const META_ACCESS_TOKEN = import.meta.env.VITE_META_ACCESS_TOKEN;
const DEFAULT_ACCOUNT_ID = import.meta.env.VITE_META_AD_ACCOUNT_ID;
const API_VERSION = 'v19.0';
const BASE_URL = `https://graph.facebook.com/${API_VERSION}`;

// --- Caching Layer for Meta API ---
const apiCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCachedData(key) {
    const cached = apiCache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
        apiCache.delete(key);
        return null;
    }
    return cached.data;
}

function setCachedData(key, data) {
    apiCache.set(key, {
        timestamp: Date.now(),
        data: data
    });
}
// ----------------------------------

/**
 * Fetches campaigns for a given ad account.
 * We fetch standard metrics (spend, impressions) and configure the datePreset.
 */
export async function fetchMetaCampaigns(accountId = DEFAULT_ACCOUNT_ID, dateRange = null) {
    if (!META_ACCESS_TOKEN || !accountId) {
        throw new Error('Missing Meta Access Token or Ad Account ID configuration.');
    }

    const endpoint = `${BASE_URL}/act_${accountId}/campaigns`;

    let insightsQuery = 'insights.date_preset(maximum)';
    if (dateRange && dateRange.start && dateRange.end) {
        const since = format(dateRange.start, 'yyyy-MM-dd');
        const until = format(dateRange.end, 'yyyy-MM-dd');
        insightsQuery = `insights.time_range({"since":"${since}","until":"${until}"})`;
    }

    const params = new URLSearchParams({
        access_token: META_ACCESS_TOKEN,
        fields: `id,name,status,effective_status,daily_budget,lifetime_budget,stop_time,${insightsQuery}{spend,impressions,reach,actions,action_values,cost_per_action_type},ads.limit(1){creative{body,title,image_url,thumbnail_url,video_id,object_story_spec{video_data}}}`,
        filtering: JSON.stringify([{ field: 'effective_status', operator: 'IN', value: ['ACTIVE', 'PAUSED'] }])
    });

    const cacheKey = `campaigns_${accountId}_${dateRange?.start?.toISOString()}_${dateRange?.end?.toISOString()}`;
    const cachedResult = getCachedData(cacheKey);
    if (cachedResult) {
        console.info(`[Meta API Cache] Serving campaigns for ${accountId} from cache.`);
        return cachedResult;
    }

    try {
        const response = await fetch(`${endpoint}?${params.toString()}`);
        const data = await response.json();

        if (data.error) {
            console.error('Meta API Error:', data.error);
            throw new Error(data.error.message || 'Failed to fetch from Meta API');
        }

        // Map the Campaign + Insights nested structure into a flat object for the frontend
        const campaigns = data.data || [];
        const mappedCampaigns = campaigns.map(camp => {
            const insights = (camp.insights && camp.insights.data && camp.insights.data.length > 0) ? camp.insights.data[0] : {};

            // Check if the campaign has a stop time and if it is in the past
            const isCompleted = camp.stop_time ? new Date(camp.stop_time) <= new Date() : false;

            // Extract the true results for Leads using the comprehensive array of Meta lead event strings
            const leadTypesPriority = ['lead', 'onsite_conversion.lead_grouped', 'offsite_complete_registration_add_meta_leads', 'offsite_submit_application_add_meta_leads'];
            let leads = 0;
            if (insights.actions) {
                for (const type of leadTypesPriority) {
                    const action = insights.actions.find(a => a.action_type === type);
                    if (action) {
                        leads = parseInt(action.value || 0);
                        break;
                    }
                }
            }

            // Extract Purchases
            const purchaseTypesPriority = ['purchase', 'offsite_conversion.fb_pixel_purchase'];
            let purchases = 0;
            let purchaseValue = 0;

            if (insights.actions) {
                for (const type of purchaseTypesPriority) {
                    const action = insights.actions.find(a => a.action_type === type);
                    if (action) {
                        purchases = parseInt(action.value || 0);
                        break;
                    }
                }
            }
            if (insights.action_values) {
                for (const type of purchaseTypesPriority) {
                    const actionValue = insights.action_values.find(a => a.action_type === type);
                    if (actionValue) {
                        purchaseValue = parseFloat(actionValue.value || 0);
                        break;
                    }
                }
            }

            // Extract primary ad creative if available
            let adCreative = null;
            if (camp.ads && camp.ads.data && camp.ads.data.length > 0 && camp.ads.data[0].creative) {
                adCreative = camp.ads.data[0].creative;
            }

            return {
                campaign_id: camp.id,
                campaign_name: camp.name,
                status: camp.status,
                // Override status if mathematically past original end date to mirror FB "Completed"
                effective_status: isCompleted ? 'COMPLETED' : camp.effective_status,
                daily_budget: camp.daily_budget,
                lifetime_budget: camp.lifetime_budget,
                spend: insights.spend || 0,
                impressions: insights.impressions || 0,
                reach: insights.reach || 0,
                actions: insights.actions || [],
                cost_per_action_type: insights.cost_per_action_type || [],
                // Pass pre-computed leads straight in to simplify frontend mapping later
                leads: leads,
                purchases: purchases,
                purchaseValue: purchaseValue,
                adCreative: adCreative
            };
        });

        // Store the successfully mapped data in the cache before returning
        setCachedData(cacheKey, mappedCampaigns);
        return mappedCampaigns;
    } catch (error) {
        console.error('Error fetching Meta Campaigns:', error);
        throw error;
    }
}

/**
 * Fetches daily breakdown data for an ad account to power the trend charts.
 */
export async function fetchMetaDailyTrends(campaignId, datePreset = 'last_90d') {
    if (!META_ACCESS_TOKEN || !campaignId) {
        throw new Error('Missing Meta Access Token or Campaign ID configuration.');
    }

    const endpoint = `${BASE_URL}/${campaignId}/insights`;

    const params = new URLSearchParams({
        access_token: META_ACCESS_TOKEN,
        date_preset: datePreset,
        level: 'campaign',
        time_increment: '1', // Daily breakdown
        limit: '100',
        fields: 'date_start,spend,impressions,reach,actions,action_values,cost_per_action_type'
    });

    const cacheKey = `trends_${campaignId}_${datePreset}`;
    const cachedResult = getCachedData(cacheKey);
    if (cachedResult) {
        console.info(`[Meta API Cache] Serving trends for campaign ${campaignId} from cache.`);
        return cachedResult;
    }

    try {
        const response = await fetch(`${endpoint}?${params.toString()}`);
        const data = await response.json();

        if (data.error) {
            console.error('Meta API Error:', data.error);
            throw new Error(data.error.message || 'Failed to fetch from Meta API');
        }

        const trendsData = data.data || [];
        setCachedData(cacheKey, trendsData);
        return trendsData;
    } catch (error) {
        console.error('Error fetching Meta Daily Trends:', error);
        return [];
    }
}

/**
 * Fetches the raw video source URL for a given video ID from the Meta API.
 */
export const fetchVideoSource = async (videoId) => {
    if (!videoId) return null;
    const cacheKey = `video_source_${videoId}`;
    if (apiCache.has(cacheKey)) {
        const cached = apiCache.get(cacheKey);
        if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
            return cached.data;
        }
    }

    try {
        const response = await fetch(`${BASE_URL}/${videoId}?access_token=${META_ACCESS_TOKEN}&fields=source`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        if (data.source) {
            apiCache.set(cacheKey, { data: data.source, timestamp: Date.now() });
            return data.source;
        }
        return null;
    } catch (error) {
        console.error('Error fetching video source:', error);
        return null;
    }
};
