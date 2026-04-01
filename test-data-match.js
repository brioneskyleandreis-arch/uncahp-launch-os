const META_ACCESS_TOKEN = 'EAARj3wcYLnUBQZCLU62LLqFfTnnCUEsA0hsapJtPljzTpAYS9sxBRMGxEyrd4AZBFFh6AG04IVLa3bUC3ti8RY198q0vKAxBNrUioe4SDZAPIIAxewDMZArSXgCxTI2dQZAYCq4zoZAdZBXYLfel5HVZBjsZBqhxN8I0tqXdxU2o4JpeQyh2k8yZAxuY6hRR1YUcSOANM1bfsV';

const clients = [
    { adAccountId: '2861567790701572' },
    { adAccountId: '3152636601449764' },
    { adAccountId: '1692248557999710' },
    { adAccountId: '870404097486807' },
    { adAccountId: '456019313437989' }
];

async function test() {
    for (const client of clients) {
        const params1 = new URLSearchParams({
            access_token: META_ACCESS_TOKEN,
            fields: `id,name,insights.time_range({"since":"2026-02-02","until":"2026-03-03"}){spend,actions}`,
            limit: '500'
        });

        try {
            const res1 = await fetch(`https://graph.facebook.com/v19.0/act_${client.adAccountId}/campaigns?${params1.toString()}`);
            const data1 = await res1.json();

            if (data1.data) {
                const camp = data1.data.find(c => c.name.toLowerCase().includes('aquapure'));
                if (camp) {
                    console.log(`\nFound an Aquapure campaign in account: ${client.adAccountId}`);
                    console.log(`ID: ${camp.id}, Name: ${camp.name}`);

                    const insights = camp.insights?.data?.[0] || {};
                    const leadTypes = ['lead', 'offsite_complete_registration_add_meta_leads', 'onsite_conversion.lead_grouped', 'offsite_submit_application_add_meta_leads'];

                    if (insights.actions) {
                        const leadActions = insights.actions.filter(a => leadTypes.includes(a.action_type));
                        console.log("Lead Actions:", JSON.stringify(leadActions, null, 2));
                    }
                }
            }
        } catch (e) { }
    }
}

test();
