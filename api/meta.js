// This is a Vercel Serverless Function that acts as a secure proxy to the Meta API.
// It ensures that META_ACCESS_TOKEN is kept strictly backend-only.
export default async function handler(req, res) {
    // Check both standard and VITE_ prefixed keys for local dev compatibility
    const token = process.env.META_ACCESS_TOKEN || process.env.VITE_META_ACCESS_TOKEN;
    
    if (!token) {
        return res.status(500).json({ error: { message: 'Server is missing Meta Access Token configuration.' } });
    }

    // Extract the target endpoint and any Graph API parameters
    const { endpoint, ...queryParams } = req.query;

    if (!endpoint) {
        return res.status(400).json({ error: { message: 'Missing target endpoint parameter.' } });
    }

    // The Meta Graph API Base
    const API_VERSION = 'v19.0';
    const GRAPH_URL = `https://graph.facebook.com/${API_VERSION}`;

    // Ensure endpoint starts with slash for clean appending
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    try {
        // Construct the Meta API query string by appending the secure token to the incoming params
        const finalQuery = new URLSearchParams({
            ...queryParams,
            access_token: token
        }).toString();

        const response = await fetch(`${GRAPH_URL}${cleanEndpoint}?${finalQuery}`);
        const data = await response.json();

        // Forward Meta's HTTP status securely
        return res.status(response.status).json(data);
    } catch (error) {
        console.error('[Meta Proxy Route Error]:', error);
        return res.status(500).json({ error: { message: 'Internal server proxy failed.' } });
    }
}
