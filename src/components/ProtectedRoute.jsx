import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader } from 'lucide-react';
import { ROLES } from '../constants/roles';

const ProtectedRoute = ({ children }) => {
    const { user, role, isLoading } = useAuth();
    const location = useLocation();

    // While the session is being restored from Supabase on refresh, show a
    // loader instead of immediately redirecting to /login (which would lose the user's current page).
    if (isLoading) {
        return (
            <div className="flex items-center justify-center w-full min-h-screen bg-[--bg-app]">
                <Loader size={28} className="text-[--primary] animate-spin" />
            </div>
        );
    }

    console.log(`[ProtectedRoute Render] path: ${location.pathname}, user: ${!!user}, role: '${role}'`);

    if (!user) {
        return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />;
    }

    const isPendingPage = location.pathname === '/pending-access';
    // Strictly validate against known application roles to prevent default 'authenticated' or empty strings from leaking through
    const hasRole = Boolean(role && ROLES.includes(role));

    // 1. User has NO valid role and is NOT on the pending page -> send to pending page
    if (!hasRole && !isPendingPage) {
        console.log("[ProtectedRoute] Resolving to: /pending-access (User lacks valid role)");
        return <Navigate to="/pending-access" replace />;
    }

    // 2. User HAS a role and IS trying to access pending page -> send to dashboard
    if (hasRole && isPendingPage) {
        console.log("[ProtectedRoute] Resolving to: / (User has role, bouncing from pending)");
        return <Navigate to="/" replace />;
    }

    // 3. Otherwise, render the children (either pending page for no role, or dashboard for role)
    console.log("[ProtectedRoute] Resolving to: Render Children");
    return children;
};

export default ProtectedRoute;
