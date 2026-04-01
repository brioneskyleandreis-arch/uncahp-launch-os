export const initialLaunches = [
    {
        id: '1',
        client: 'Samantha Rose',
        treatment: 'Collagen Rebuild Facial',
        offer: '50% off first session',
        launch_type: 'New Client',
        notes: 'Focus on before/after results.',
        startDate: '2023-10-01',
        targetLaunchDate: '2023-10-15',
        status: 'On Time',
        assignedTo: 'James',
        stage: 'adriana_approve_systems', // Next pending
        completedStages: ['systems_setup'],
        messages: [
            { id: 1, user: 'Cathy', text: 'Systems are ready.', time: '10:23 AM' },
            { id: 2, user: 'James', text: 'Waiting for approval.', time: '10:45 AM' }
        ]
    },
    {
        id: '2',
        client: 'Emzi Skin',
        treatment: 'AgeJet',
        offer: 'Free consultation',
        launch_type: 'Reframe',
        notes: 'Emphasize pain-free aspect.',
        startDate: '2023-10-01',
        targetLaunchDate: '2023-10-12',
        status: 'Delayed',
        assignedTo: 'James',
        stage: 'live',
        completedStages: [
            'systems_setup',
            'adriana_approve_systems',
            'cathy_approve_systems',
            'creative_brief',
            'creative_creation',
            'creative_approval_adriana',
            'ad_copy_creation',
            'approve_ad_copy',
            'launch_setup_go_live'
        ],
        messages: []
    },
    {
        id: '3',
        client: 'Pulse Laser',
        treatment: 'Laser Hair Removal',
        offer: 'Buy 1 Get 1',
        launch_type: 'New Offer',
        notes: 'Target young professionals.',
        startDate: '2023-10-10',
        targetLaunchDate: '2023-10-28',
        status: 'On Time',
        assignedTo: 'Cathy',
        stage: 'creative_creation',
        completedStages: ['systems_setup', 'adriana_approve_systems', 'cathy_approve_systems', 'creative_brief'],
        messages: []
    }
];

export const users = [
    { name: 'James', avatar: 'linear-gradient(to right, #fca5a5, #fed7aa)' },
    { name: 'Cathy', avatar: 'linear-gradient(to right, #fdba74, #fde047)' },
    { name: 'Franz', avatar: 'linear-gradient(to right, #cbd5e1, #94a3b8)' },
];

export const stages = [
    { id: 'systems_setup', label: 'Systems Setup', assigned: 'Franz' },
    { id: 'adriana_approve_systems', label: 'Adriana Approve Systems', assigned: 'Adriana' },
    { id: 'cathy_approve_systems', label: 'Cathy Approve Systems', assigned: 'Cathy' },
    { id: 'creative_brief', label: 'Creative Brief', assigned: 'Adriana' },
    { id: 'creative_creation', label: 'Creative Creation', assigned: 'Patricia' },
    { id: 'creative_approval_adriana', label: 'Creative Approval', assigned: 'Adriana' },
    { id: 'ad_copy_creation', label: 'Ad Copy Creation', assigned: 'James' },
    { id: 'approve_ad_copy', label: 'Approve Ad Copy', assigned: 'Adriana' },
    { id: 'launch_setup_go_live', label: 'Launch Setup and Go Live', assigned: 'James' },
];
