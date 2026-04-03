import React, { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Plus,
    Activity,
    LogOut,
    Menu,
    X,
    Bell,
    Settings,
    Users,
    Briefcase,
    TrendingUp,
    Sun,
    Moon,
    User,
    Filter,
    Check
} from 'lucide-react';
import { SiMeta } from '@icons-pack/react-simple-icons';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useNotifications } from '../context/NotificationContext';
import { useTheme } from '../context/ThemeContext';

const AppLayout = () => {
    const { user, signOut } = useAuth();
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const profileRef = useRef(null);
    const notificationRef = useRef(null);

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setIsNotificationsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="flex w-full h-screen bg-[--bg-app] text-[--text-main] relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div
                    className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[100px] opacity-20"
                    style={{ background: 'radial-gradient(circle, #f472d0 0%, transparent 70%)' }}
                />
                <div
                    className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[100px] opacity-20"
                    style={{ background: 'radial-gradient(circle, #c084fc 0%, transparent 70%)' }}
                />
            </div>

            {/* Sidebar */}
            <aside className="w-20 lg:w-64 flex-shrink-0 border-r border-[--border] flex flex-col justify-between p-4 relative z-10">
                <div className="flex flex-col gap-6">
                    {/* Logo Area */}
                    <div className="h-12 flex items-center gap-3 px-2">
                        <img
                            src="/UNCAHP LOGO.png"
                            alt="UNCAHP Logo"
                            className="h-10 w-auto object-contain"
                        />
                        <span className="font-bold text-sm hidden lg:block text-[--text-main] tracking-wide">UNCAHP</span>
                    </div>

                    {/* Nav Items */}
                    <nav className="flex flex-col gap-2">
                        <NavLink
                            to="/"
                            className={({ isActive }) => `flex items-center gap-3 p-3 rounded-lg transition-colors ${isActive ? 'bg-[--bg-surface-hover] text-[--text-main]' : 'text-[--text-muted] hover:text-[--text-main] hover:bg-[--bg-surface]'}`}
                        >
                            <LayoutDashboard size={20} />
                            <span className="hidden lg:block font-medium">Ad Launch Dashboard</span>
                        </NavLink>
                        <NavLink
                            to="/new-launch"
                            className={({ isActive }) => `flex items-center gap-3 p-3 rounded-lg transition-colors ${isActive ? 'bg-[--bg-surface-hover] text-[--text-main]' : 'text-[--text-muted] hover:text-[--text-main] hover:bg-[--bg-surface]'}`}
                        >
                            <Plus size={20} />
                            <span className="hidden lg:block font-medium">Ad Launch</span>
                        </NavLink>
                        <NavLink
                            to="/ads"
                            className={({ isActive }) => `flex items-center gap-3 p-3 rounded-lg transition-colors ${isActive ? 'bg-[--bg-surface-hover] text-[--text-main]' : 'text-[--text-muted] hover:text-[--text-main] hover:bg-[--bg-surface]'}`}
                        >
                            <SiMeta size={20} />
                            <span className="hidden lg:block font-medium">Ad Performance</span>
                        </NavLink>
                        <NavLink
                            to="/active-campaigns"
                            className={({ isActive }) => `flex items-center gap-3 p-3 rounded-lg transition-colors ${isActive ? 'bg-[--bg-surface-hover] text-[--text-main]' : 'text-[--text-muted] hover:text-[--text-main] hover:bg-[--bg-surface]'}`}
                        >
                            <Activity size={20} />
                            <span className="hidden lg:block font-medium">Active Campaigns</span>
                        </NavLink>
                        <NavLink
                            to="/clients"
                            className={({ isActive }) => `flex items-center gap-3 p-3 rounded-lg transition-colors ${isActive ? 'bg-[--bg-surface-hover] text-[--text-main]' : 'text-[--text-muted] hover:text-[--text-main] hover:bg-[--bg-surface]'}`}
                        >
                            <Briefcase size={20} />
                            <span className="hidden lg:block font-medium">Clients</span>
                        </NavLink>
                        <NavLink
                            to="/funnels"
                            className={({ isActive }) => `flex items-center gap-3 p-3 rounded-lg transition-colors ${isActive ? 'bg-[--bg-surface-hover] text-[--text-main]' : 'text-[--text-muted] hover:text-[--text-main] hover:bg-[--bg-surface]'}`}
                        >
                            <Filter size={20} />
                            <span className="hidden lg:block font-medium">Funnels</span>
                        </NavLink>
                        {/* 
                        <NavLink
                            to="/profit-tracker"
                            className={({ isActive }) => `flex items-center gap-3 p-3 rounded-lg transition-colors ${isActive ? 'bg-[--bg-surface-hover] text-[--text-main]' : 'text-[--text-muted] hover:text-[--text-main] hover:bg-[--bg-surface]'}`}
                        >
                            <TrendingUp size={20} />
                            <span className="hidden lg:block font-medium">Profit Tracker</span>
                        </NavLink>
                        */}
                        <div className="h-px bg-[--divider] my-2 mx-2"></div>
                        {user?.role === 'Admin' && (
                            <NavLink
                                to="/members"
                                className={({ isActive }) => `flex items-center gap-3 p-3 rounded-lg transition-colors ${isActive ? 'bg-[--bg-surface-hover] text-[--text-main]' : 'text-[--text-muted] hover:text-[--text-main] hover:bg-[--bg-surface]'}`}
                            >
                                <Users size={20} />
                                <span className="hidden lg:block font-medium">Members</span>
                            </NavLink>
                        )}
                    </nav>
                </div>

                {/* Bottom Actions */}
                <div className="flex flex-col gap-2 mt-auto">
                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className="flex items-center gap-3 p-3 w-full text-[--text-muted] hover:text-[--text-main] hover:bg-[--bg-surface] rounded-lg transition-colors text-left"
                    >
                        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                        <span className="hidden lg:block font-medium">
                            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                        </span>
                    </button>

                    <NavLink 
                        to="/settings"
                        className={({ isActive }) => `flex items-center gap-3 p-3 rounded-lg transition-colors ${isActive ? 'bg-[--bg-surface-hover] text-[--text-main]' : 'text-[--text-muted] hover:text-[--text-main] hover:bg-[--bg-surface]'}`}
                    >
                        <Settings size={20} />
                        <span className="hidden lg:block font-medium">Settings</span>
                    </NavLink>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
                {/* Header */}
                <header className="h-16 border-b border-[--border] flex items-center justify-between px-6 flex-shrink-0">
                    <div>
                    </div>
                    <div className="flex items-center gap-4">
                        {/* Notifications */}
                        <div className="relative" ref={notificationRef}>
                            <button
                                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                                className="p-2 text-[--text-muted] hover:text-[--text-main] transition-colors relative outline-none"
                            >
                                <Bell size={20} />
                                {unreadCount > 0 && (
                                    <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#f472d0] rounded-full border border-[--bg-app]"></span>
                                )}
                            </button>

                            {/* Notification Dropdown */}
                            {isNotificationsOpen && (
                                <div className="absolute right-0 mt-2 w-80 rounded-xl bg-[--bg-card] border border-[--border] shadow-2xl z-[100] animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                                    <div className="flex items-center justify-between px-4 py-3 border-b border-[--border] bg-[--bg-surface]">
                                        <h3 className="font-semibold text-sm text-[--text-main]">Notifications</h3>
                                        {unreadCount > 0 && (
                                            <button
                                                onClick={markAllAsRead}
                                                className="text-xs text-[--primary] hover:text-[--text-main] transition-colors font-medium"
                                            >
                                                Mark all read
                                            </button>
                                        )}
                                    </div>
                                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                                        {notifications.length === 0 ? (
                                            <div className="p-8 text-center text-[--text-muted] text-sm">
                                                No notifications yet.
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-[--divider]">
                                                {notifications.map((notification) => (
                                                    <div
                                                        key={notification.id}
                                                        className={`p-4 hover:bg-[--bg-surface] transition-colors ${!notification.read ? 'bg-[rgba(244,140,207,0.05)]' : ''} `}
                                                    >
                                                        <div className="flex justify-between items-start gap-3">
                                                            <div className="flex-1 min-w-0">
                                                                <p className={`text-sm ${!notification.read ? 'text-[--text-main] font-medium' : 'text-[--text-muted]'} `}>{notification.title}</p>
                                                                <p className="text-xs text-[--text-dim] mt-1 line-clamp-2">{notification.message}</p>
                                                                <span className="text-[10px] text-[--text-dim] mt-2 block">{notification.time}</span>
                                                            </div>
                                                            {!notification.read && (
                                                                <button
                                                                    onClick={() => markAsRead(notification.id)}
                                                                    className="text-[--text-muted] hover:text-[--primary] transition-colors p-1"
                                                                    title="Mark as read"
                                                                >
                                                                    <Check size={14} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-2 border-t border-[--border] bg-[--bg-surface] text-center">
                                        <button className="text-xs text-[--text-muted] hover:text-[--text-main] transition-colors w-full py-1">
                                            View all activity
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Profile Dropdown */}
                        <div className="relative" ref={profileRef}>
                            <button
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                                className="flex items-center gap-2 focus:outline-none"
                            >
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#f472d0] to-[#c084fc] flex items-center justify-center text-white font-bold text-xs ring-2 ring-[--bg-app] ring-offset-2 ring-offset-[#f472d0]/10 transition-all hover:ring-offset-[#f472d0]/30 overflow-hidden">
                                    {user?.user_metadata?.avatar_url ? (
                                        <img
                                            src={user.user_metadata.avatar_url}
                                            alt="Avatar"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        user?.email?.charAt(0).toUpperCase() || 'U'
                                    )}
                                </div>
                            </button>

                            {/* Dropdown Menu */}
                            {isProfileOpen && (
                                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[--bg-card] border border-[--border] shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                                    <div className="px-4 py-3 border-b border-[--border] mb-1">
                                        <p className="text-sm font-medium text-[--text-main] truncate">
                                            {user?.user_metadata?.full_name || 'User'}
                                        </p>
                                        <p className="text-xs text-[--text-muted] truncate mt-0.5">
                                            {user?.email}
                                        </p>
                                    </div>

                                    <div className="p-1">
                                        <button
                                            onClick={() => {
                                                setIsProfileOpen(false);
                                                navigate('/profile');
                                            }}
                                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[--text-muted] hover:text-[--text-main] hover:bg-[--bg-surface] rounded-lg transition-colors cursor-pointer mb-1"
                                        >
                                            <User size={16} />
                                            Customize Profile
                                        </button>
                                        <button
                                            onClick={handleLogout}
                                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[--text-muted] hover:text-red-400 hover:bg-[rgba(248,113,113,0.1)] rounded-lg transition-colors cursor-pointer"
                                        >
                                            <LogOut size={16} />
                                            Sign Out
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="flex-1 overflow-hidden flex flex-col">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AppLayout;
