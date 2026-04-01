const META_ACCESS_TOKEN = 'EAARj3wcYLnUBQZCLU62LLqFfTnnCUEsA0hsapJtPljzTpAYS9sxBRMGxEyrd4AZBFFh6AG04IVLa3bUC3ti8RY198q0vKAxBNrUioe4SDZAPIIAxewDMZArSXgCxTI2dQZAYCq4zoZAdZBXYLfel5HVZBjsZBqhxN8I0tqXdxU2o4JpeQyh2k8yZAxuY6hRR1YUcSOANM1bfsV';

const clients = [
    { adAccountId: '2861567790701572' },
    { adAccountId: '3152636601449764' },
    { adAccountId: '1692248557999710' },
    { adAccountId: '870404097486807' },
    { adAccountId: '456019313437989' }
];

async function test() {
    let totalActive = 0;
    let totalCompleted = 0;
    let activeCampaignsList = [];

    for (const client of clients) {
        const params = new URLSearchParams({
            access_token: META_ACCESS_TOKEN,
            fields: 'id,name,status,effective_status,stop_time',
            limit: '1000'
        });

        try {
            const res = await fetch(`https://graph.facebook.com/v19.0/act_${client.adAccountId}/campaigns?${params.toString()}`);
            const data = await res.json();

            if (data.data) {
                for (const c of data.data) {
                    const isCompleted = c.stop_time ? new Date(c.stop_time) <= new Date() : false;
                    if (isCompleted) {
                        totalCompleted++;
                    } else if (c.status === 'ACTIVE' && c.effective_status === 'ACTIVE') {
                        totalActive++;
                        activeCampaignsList.push(`=> ${c.name} (Account ${client.adAccountId})`);
                    }
                }
            }
        } catch (e) {
            console.error(`Error with ${client.adAccountId}:`, e);
        }
    }
    console.log(`Total Active (Toggle + Delivery): ${totalActive}`);
    console.log(`Total Completed (End Date Elapsed): ${totalCompleted}`);
    console.log(activeCampaignsList.join('\n'));
}

test();
