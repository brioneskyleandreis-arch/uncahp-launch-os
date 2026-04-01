import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, ShieldAlert } from 'lucide-react';

const PendingAccess = () => {
    const { signOut, user } = useAuth();

    return (
        <div className="min-h-screen w-full bg-[--bg-app] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div
                    className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[120px] opacity-10"
                    style={{ background: 'radial-gradient(circle, #f48ccf 0%, transparent 70%)' }}
                />
                <div
                    className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[120px] opacity-10"
                    style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)' }}
                />
            </div>

            <div className="bg-[--bg-surface] border border-[--border] p-8 rounded-2xl shadow-xl max-w-md w-full text-center relative overflow-hidden">
                <div className="w-16 h-16 bg-[rgba(245,158,11,0.1)] rounded-full flex items-center justify-center mx-auto mb-6 text-[--warning]">
                    <ShieldAlert size={32} />
                </div>

                <h1 className="text-2xl font-bold text-[--text-main] mb-2">Access Pending</h1>
                <p className="text-[--text-muted] mb-8 leading-relaxed">
                    Hello <span className="text-[--text-main] font-medium">{user?.user_metadata?.full_name || user?.email}</span>,<br />
                    Your account has been created successfully but is awaiting administrative approval.
                </p>

                <div className="bg-[--bg-surface] border border-[--border] rounded-lg p-4 mb-8 text-sm text-[--text-dim]">
                    Please contact the system administrator to have a role assigned to your account.
                </div>

                <button
                    onClick={() => signOut()}
                    className="btn btn-glass w-full flex items-center justify-center gap-2"
                >
                    <LogOut size={18} />
                    Sign Out
                </button>
            </div>
        </div>
    );
};

export default PendingAccess;
