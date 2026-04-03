import React, { useState, useMemo } from 'react';
import { useLaunch } from '../context/LaunchContext';
import { useClients } from '../context/ClientContext';
import { useNavigate } from 'react-router-dom';
import { MoreHorizontal, BarChart3, CheckCircle2, AlertTriangle, Clock, Trash2, Rocket, ArrowUpDown } from 'lucide-react';
import { stages } from '../data/mockData';

const Dashboard = () => {
    const { launches: allLaunches, deleteLaunch, fetchLaunches } = useLaunch();
    const { getActiveClients } = useClients();
    const activeClients = getActiveClients();
    const activeClientNames = activeClients.map(c => c.name);

    // Filter launches to only show those for active clients
    const launches = allLaunches.filter(l => activeClientNames.includes(l.client));
    const clients = activeClients; // for logo matching
    const navigate = useNavigate();

    const [sortConfig, setSortConfig] = useState({ key: 'status', direction: 'asc' });

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation(); // Prevent card click
        if (window.confirm("Are you sure you want to delete this launch? This action cannot be undone.")) {
            await deleteLaunch(id);
        }
    };

    const totalLaunches = launches.length;
    // Calculate completed launches based on stage completion
    const completedCount = launches.filter(l => l.completedStages?.length === stages.length).length;

    // Calculate active launches (not complete)
    const activeCount = launches.filter(l => !l.completedStages || l.completedStages.length !== stages.length).length;

    const goal = 20;
    const percentage = Math.round((completedCount / goal) * 100);

    const calculateDeliveryStatus = (launch) => {
        // If already completed, return 'Completed'
        const isComplete = launch.completedStages && launch.completedStages.length === stages.length;
        if (isComplete) return 'Completed';

        // Check if date is passed
        if (!launch.targetLaunchDate) return 'Planned';

        const targetDate = new Date(launch.targetLaunchDate);
        const today = new Date();
        // Reset time part for accurate date comparison
        today.setHours(0, 0, 0, 0);
        targetDate.setHours(0, 0, 0, 0);

        if (today > targetDate) {
            return 'Delayed';
        }
        return 'On Time';
    };

    const sortedLaunches = useMemo(() => {
        let sortableLaunches = [...launches];
        if (sortConfig !== null) {
            sortableLaunches.sort((a, b) => {
                const getPendingStage = (launch) => stages.find(s => !launch.completedStages.includes(s.id));
                const pendingA = getPendingStage(a);
                const pendingB = getPendingStage(b);

                const getVal = (launch, pending) => {
                    switch (sortConfig.key) {
                        case 'client': return launch.client.toLowerCase();
                        case 'offer': return launch.offer.toLowerCase();
                        case 'stage': return pending ? stages.findIndex(s => s.id === pending.id) : stages.length;
                        case 'assigned': return pending ? pending.assigned.toLowerCase() : 'z';
                        case 'target': return new Date(launch.targetLaunchDate || '2099-01-01').getTime();
                        case 'delivery': return calculateDeliveryStatus(launch);
                        case 'status': {
                            const isComplete = launch.completedStages?.length === stages.length;
                            return isComplete ? 1 : 0;
                        }
                        default: return launch.id;
                    }
                };

                const aVal = getVal(a, pendingA);
                const bVal = getVal(b, pendingB);

                if (aVal < bVal) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aVal > bVal) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                // Secondary sort if equal: ID desc
                return b.id - a.id;
            });
        }
        return sortableLaunches;
    }, [launches, sortConfig, stages]);

    const getStatusBadge = (launch) => {
        const status = calculateDeliveryStatus(launch);

        if (status === 'On Time') return <span className="badge badge-success flex items-center gap-1 w-max whitespace-nowrap"><CheckCircle2 size={12} /> On Time</span>;
        if (status === 'Delayed') return <span className="badge badge-warning flex items-center gap-1 w-max whitespace-nowrap"><AlertTriangle size={12} /> Delayed</span>;
        if (status === 'Completed') return <span className="badge badge-success flex items-center gap-1 w-max whitespace-nowrap"><CheckCircle2 size={12} /> Completed</span>;
        return <span className="badge badge-planned flex items-center gap-1 w-max whitespace-nowrap"><Clock size={12} /> {status}</span>;
    };

    const getAssignedAvatar = (name) => {
        // simple mapping or fallback
        const gradients = {
            'James': 'linear-gradient(to right, #fca5a5, #fed7aa)',
            'Cathy': 'linear-gradient(to right, #fdba74, #fde047)',
            'Franz': 'linear-gradient(to right, #cbd5e1, #94a3b8)',
            'Adriana': 'linear-gradient(to right, #d8b4fe, #f0abfc)', // Purple/Pink
            'Patricia': 'linear-gradient(to right, #818cf8, #c4b5fd)', // Indigo/Violet
        };
        return gradients[name] || 'linear-gradient(to right, #ccc, #ddd)';
    };

    const SortHeader = ({ label, sortKey, align = 'center' }) => {
        const isActive = sortConfig.key === sortKey;
        return (
            <div
                className={`cursor-pointer group flex items-center gap-1 hover:text-[--text-main] transition-colors ${align === 'left' ? 'justify-start' : (align === 'right' ? 'justify-end' : 'justify-center')} ${isActive ? 'text-[--text-main]' : ''}`}
                onClick={() => requestSort(sortKey)}
            >
                {label}
                <ArrowUpDown size={12} className={`transition-opacity ${isActive ? 'opacity-100 text-[--primary]' : 'opacity-0 group-hover:opacity-50'}`} />
            </div>
        );
    };

    return (
        <div className="p-8 max-w-7xl mx-auto flex flex-col gap-8 h-full overflow-y-auto">
            {/* Header Area */}
            <div className="flex items-center justify-between">
                <div></div>
                <button onClick={() => navigate('/new-launch')} className="btn btn-primary drop-shadow-lg shadow-[rgba(244,140,207,0.4)]">
                    + Ad Launch
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Card 1 - Pending */}
                <div className="card flex items-center justify-between relative overflow-hidden">
                    <div className="z-10">
                        <div className="flex items-center gap-2 text-[--text-muted] mb-1">
                            <Rocket size={16} className="text-orange-400" />
                            <span className="text-sm font-medium uppercase tracking-wider">Pending Launches</span>
                        </div>
                        <div className="text-5xl font-bold mt-2">{activeCount}</div>
                        <div className="text-sm text-[--text-muted] mt-2">In production</div>

                        <div className="flex flex-wrap -space-x-2 mt-4">
                            {(() => {
                                // Get all active launches
                                const activeLaunches = launches.filter(l => l.completedStages?.length !== stages.length);
                                // Get the assigned person for the current pending stage of each active launch
                                const activeAssignees = activeLaunches.map(launch => {
                                    const pendingStage = stages.find(s => !launch.completedStages.includes(s.id));
                                    return pendingStage ? pendingStage.assigned : null;
                                }).filter(Boolean); // remove nulls

                                // Get unique assignees
                                const uniqueAssignees = [...new Set(activeAssignees)];

                                return uniqueAssignees.slice(0, 5).map((name, i) => (
                                    <div key={i} className="w-8 h-8 rounded-full border-2 border-[--bg-card] flex items-center justify-center text-xs font-bold shadow-sm overflow-hidden" title={name}>
                                        {name === 'Franz' ? (
                                            <img src="https://ui-avatars.com/api/?name=Franz&background=cbd5e1&color=fff&size=64" alt="Franz" className="w-full h-full object-cover"/>
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center" style={{ background: getAssignedAvatar(name), color: 'rgba(0,0,0,0.6)' }}>
                                                {name.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                ));
                            })()}
                            {/* Show +N if there are more than 5 unique assignees */}
                            {(() => {
                                const activeLaunches = launches.filter(l => l.completedStages?.length !== stages.length);
                                const activeAssignees = activeLaunches.map(launch => {
                                    const pendingStage = stages.find(s => !launch.completedStages.includes(s.id));
                                    return pendingStage ? pendingStage.assigned : null;
                                }).filter(Boolean);
                                const uniqueAssignees = [...new Set(activeAssignees)];

                                if (uniqueAssignees.length > 5) {
                                    return (
                                        <div className="w-8 h-8 rounded-full border-2 border-[--bg-card] bg-[--bg-surface] flex items-center justify-center text-xs font-bold text-[--text-muted]">
                                            +{uniqueAssignees.length - 5}
                                        </div>
                                    )
                                }
                                return null;
                            })()}
                        </div>
                    </div>
                    <div className="w-16 h-16 bg-[rgba(59,130,246,0.1)] rounded-xl flex items-center justify-center text-[--info]">
                        <BarChart3 size={32} />
                    </div>
                </div>

                {/* Card 2 - Completed */}
                <div className="card flex items-center justify-between relative overflow-hidden">
                    <div className="z-10">
                        <div className="flex items-center gap-2 text-[--text-muted] mb-1">
                            <CheckCircle2 size={16} className="text-green-500" />
                            <span className="text-sm font-medium uppercase tracking-wider">Completed Launches</span>
                        </div>
                        <div className="text-5xl font-bold mt-2">{completedCount}</div>
                        <div className="text-sm text-[--text-muted] mt-2">Successfully Launched</div>
                    </div>
                    <div className="w-16 h-16 bg-[rgba(34,197,94,0.1)] rounded-xl flex items-center justify-center text-green-500">
                        <CheckCircle2 size={32} />
                    </div>
                </div>
            </div>

            {/* Matrix with Aurora Background */}
            <div className="relative">
                {/* Aurora Background Elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div
                        className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl"
                        style={{
                            background: 'radial-gradient(circle, rgba(244, 140, 207, 0.15) 0%, transparent 70%)',
                            animation: 'aurora-float-1 25s ease-in-out infinite'
                        }}
                    />
                    <div
                        className="absolute top-1/3 right-1/4 w-80 h-80 rounded-full blur-3xl"
                        style={{
                            background: 'radial-gradient(circle, rgba(192, 132, 252, 0.12) 0%, transparent 70%)',
                            animation: 'aurora-float-2 30s ease-in-out infinite'
                        }}
                    />
                    <div
                        className="absolute bottom-0 left-1/2 w-72 h-72 rounded-full blur-3xl"
                        style={{
                            background: 'radial-gradient(circle, rgba(96, 165, 250, 0.1) 0%, transparent 70%)',
                            animation: 'aurora-float-3 28s ease-in-out infinite'
                        }}
                    />
                </div>

                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold tracking-wide">Launch Status Matrix</h2>
                    </div>

                    <div className="flex flex-col gap-3">
                        <div className="grid grid-cols-12 gap-4 px-6 py-2 text-xs font-bold text-[--text-muted] uppercase tracking-wider select-none">
                            <div className="col-span-2"><SortHeader label="Client / Treatment" sortKey="client" align="left" /></div>
                            <div className="col-span-2"><SortHeader label="Offer" sortKey="offer" /></div>
                            <div className="col-span-1"><SortHeader label="Ref #" sortKey="referenceNumber" /></div>
                            <div className="col-span-2"><SortHeader label="Stage" sortKey="stage" /></div>
                            <div className="col-span-1"><SortHeader label="Assigned" sortKey="assigned" /></div>
                            <div className="col-span-1"><SortHeader label="Target" sortKey="target" /></div>
                            <div className="col-span-2"><SortHeader label="Delivery" sortKey="delivery" /></div>
                            <div className="col-span-1 text-right items-center flex justify-end">Actions</div>
                        </div>

                        {sortedLaunches.map((launch) => {
                            // Determine current stage and assignee
                            const pendingStage = stages.find(s => !launch.completedStages.includes(s.id));
                            const label = pendingStage ? pendingStage.label : 'Completed';
                            const assignee = pendingStage ? pendingStage.assigned : 'James'; // Default to James or keep last
                            const isComplete = !pendingStage;

                            return (
                                <div
                                    key={launch.id}
                                    onClick={() => navigate(`/launch/${launch.id}`)}
                                    className="grid grid-cols-12 gap-4 items-center p-5 cursor-pointer group
                                    bg-[--bg-card] backdrop-blur-md
                                    border border-[--border]
                                    rounded-xl
                                    shadow-sm
                                    hover:bg-[--bg-surface-hover] 
                                    hover:border-[--primary]
                                    hover:shadow-md
                                    hover:scale-[1.01]
                                    transition-all duration-300 ease-out"
                                >
                                    {/* Client / Treatment */}
                                    <div className="col-span-2 flex items-center gap-3">
                                        {(() => {
                                            const matchedClient = clients.find(c => c.name === launch.client);
                                            if (matchedClient?.logo) {
                                                return (
                                                    <img src={matchedClient.logo} alt={launch.client} className="w-9 h-9 rounded-lg object-cover" />
                                                );
                                            }
                                            return (
                                                <div className="w-9 h-9 rounded-lg bg-[--bg-surface] flex items-center justify-center text-[--primary] font-bold text-sm">
                                                    {launch.client.charAt(0)}
                                                </div>
                                            );
                                        })()}
                                        <div className="min-w-0">
                                            <div className="font-bold text-sm truncate" title={launch.client}>{launch.client}</div>
                                            <div className="text-xs text-[--text-muted] uppercase truncate" title={launch.treatment}>{launch.treatment}</div>
                                        </div>
                                    </div>

                                    {/* Offer */}
                                    <div className="col-span-2 text-sm text-[--text-main] font-medium text-center truncate px-2" title={launch.offer}>
                                        {launch.offer}
                                    </div>

                                    {/* Reference Number */}
                                    <div className="col-span-1 text-xs text-[--text-muted] font-medium text-center truncate px-1" title={launch.referenceNumber}>
                                        {launch.referenceNumber ? `#${launch.referenceNumber}` : '--'}
                                    </div>

                                    {/* Stage (Earliest Pending) */}
                                    <div className="col-span-2 flex justify-center">
                                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border truncate transition-colors ${isComplete
                                            ? 'border-green-500 text-green-500 bg-green-500/10 group-hover:bg-green-500 group-hover:text-black'
                                            : 'border-[--primary] text-[--primary] bg-[--primary]/10 group-hover:bg-[#e25fe2] group-hover:text-white'
                                            }`}>
                                            {label}
                                        </span>
                                    </div>

                                    {/* Assigned */}
                                    <div className="col-span-1 flex items-center justify-center gap-2">
                                        <div className="w-6 h-6 rounded-full border border-[--bg-app] overflow-hidden" title={assignee}>
                                            {assignee === 'Franz' ? (
                                                <img src="https://ui-avatars.com/api/?name=Franz&background=cbd5e1&color=fff&size=64" alt="Franz" className="w-full h-full object-cover"/>
                                            ) : (
                                                <div className="w-full h-full" style={{ background: getAssignedAvatar(assignee) }}></div>
                                            )}
                                        </div>
                                        <span className="text-xs text-[--text-muted] truncate hidden xl:inline-block">{assignee}</span>
                                    </div>

                                    {/* Date */}
                                    <div className="col-span-1 text-xs font-medium text-center text-[--text-dim]">
                                        {launch.targetLaunchDate}
                                    </div>

                                    {/* Delivery Status */}
                                    <div className="col-span-2 flex justify-center">
                                        {getStatusBadge(launch)}
                                    </div>

                                    {/* Actions (Delete) */}
                                    <div className="col-span-1 flex justify-end">
                                        <button
                                            className="text-[--text-dim] hover:text-red-500 p-2 rounded-full hover:bg-[--bg-surface] transition-all z-10"
                                            onClick={(e) => handleDelete(e, launch.id)}
                                            title="Delete Launch"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
