import fs from 'fs';

async function test() {
    const envFile = fs.readFileSync('.env.local', 'utf-8');
    let token = '';
    for (const line of envFile.split('\n')) {
        if (line.startsWith('VITE_META_ACCESS_TOKEN=')) {
            token = line.split('=')[1].replace(/['"]/g, '').trim();
        }
    }

    const accountId = '2861567790701572'; 
    const endpoint = `https://graph.facebook.com/v19.0/act_${accountId}/ads`;
    
    // Test if we can fetch `source` directly inside video_data
    const params = new URLSearchParams({
        access_token: token,
        fields: "creative{video_id,object_story_spec{video_data{source,url,video_url}}}",
        limit: 50
    });

    try {
        const res = await fetch(`${endpoint}?${params.toString()}`);
        const data = await res.json();
        const videoAd = data.data.find(ad => ad.creative?.video_id);
        if (videoAd) {
            console.log(JSON.stringify(videoAd.creative.object_story_spec, null, 2));
        } else {
            console.log("No video ads found.");
        }
    } catch (e) {
        console.error(e);
    }
}
test();
