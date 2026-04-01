import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, ArrowRight, LayoutDashboard } from 'lucide-react';
import { useLaunch } from '../context/LaunchContext';

const LaunchSuccess = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { launches } = useLaunch();

    // Find the launch to display some details (optional, but nice)
    // Use loose equality for ID matching just in case of string/number differences
    const launch = launches.find(l => l.id == id);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[--bg-app] p-4">
            <div className="card max-w-lg w-full text-center p-12 space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="w-24 h-24 bg-[rgba(16,185,129,0.1)] text-[--success] rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 size={48} strokeWidth={3} />
                </div>

                <div className="space-y-2">
                    <h1 className="text-3xl font-bold">Launch Initiated!</h1>
                    <p className="text-[--text-muted]">
                        Your new ad campaign has been successfully created and added to the queue.
                    </p>
                </div>

                {launch && (
                    <div className="bg-[--bg-surface] p-4 rounded-lg border border-[--border] text-left">
                        <div className="text-xs text-[--text-muted] uppercase font-bold mb-1">Client</div>
                        <div className="font-medium text-lg text-[--text-main]">{launch.client}</div>
                        <div className="text-sm text-[--primary] mt-1">{launch.treatment}</div>
                    </div>
                )}

                <div className="flex flex-col gap-3 pt-4">
                    <button
                        onClick={() => navigate(`/launch/${id}`)}
                        className="btn btn-primary w-full py-3 text-lg flex items-center justify-center gap-2 group"
                    >
                        Go to Launch Details <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </button>

                    <button
                        onClick={() => navigate('/')}
                        className="btn btn-glass w-full py-3 flex items-center justify-center gap-2 hover:bg-[--bg-surface-hover]"
                    >
                        <LayoutDashboard size={20} /> Back to Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LaunchSuccess;
