import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
    // State for notifications
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0); // Track unread count locally for session
    const { user } = useAuth(); // If we need user context, though we fetch global feed for now

    // Fetch initial notifications
    const fetchNotifications = async () => {
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50); // Limit to last 50 for now

            if (error) throw error;
            setNotifications(data || []);
            // Initially, assume all fetched are unread? Or maybe just set 0 for simplicity until new ones come in?
            // Let's set unread to 0 on initial load to avoid annoyance, only new ones trigger badge.
            // Or if we want persistent read status we'd need another table.
            // For now: local session read status. "New since page load" + "Existing but unread in session"? 
            // Simplest: Fetch last 50. Mark internal state `read: false` for all? No, that's annoying.
            // Let's assume all fetched history is "read" or just "history".
            // Only NEW incoming real-time ones are "unread"? 
            // Better UX: Show all, but only highlight new ones.
            // Let's stick to standard behavior: Load all as "read" visually (or checked), or just don't track persistent read.
            // The user wanted "logged".
            // Let's initialize unread count to 0, and any NEW real-time ones increment it.
            // But if user refreshes, they lose unread status. That's acceptable for "Activity Log".

            // Actually, let's just mark everything fetched as "read: true" in local state initially, 
            // and only new ones via subscription get "read: false".
            const initial = (data || []).map(n => ({ ...n, read: true }));
            setNotifications(initial);
        } catch (error) {
            console.error("Error fetching notifications:", error);
        }
    };

    useEffect(() => {
        if (!user) {
            setNotifications([]);
            return;
        }

        fetchNotifications();

        // Subscribe to new notifications
        const subscription = supabase
            .channel('notifications_feed')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
                const newNotif = { ...payload.new, read: false };
                setNotifications(prev => [newNotif, ...prev]);
                setUnreadCount(prev => prev + 1);
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [user]);

    const markAsRead = (id) => {
        setNotifications(prev => prev.map(n =>
            n.id === id ? { ...n, read: true } : n
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
    };

    const clearAll = () => {
        setNotifications([]);
        setUnreadCount(0);
    };

    // Helper to add (now mostly for strict local or optimistic, but better to use DB)
    const addNotification = async (notification) => {
        // We now insert into DB, and the subscription updates the UI.
        // But we might want to support "local only" toasts via this context?
        // No, let's keep this context for the "Activity Feed".
        // Toasts use ToastContext.

        // So addNotification here should actually INSERT to DB.
        try {
            const { error } = await supabase
                .from('notifications')
                .insert([{
                    title: notification.title,
                    message: notification.message,
                    type: notification.type || 'info',
                    actor_id: user?.id,
                    created_at: new Date().toISOString()
                }]);

            if (error) throw error;
        } catch (err) {
            console.error("Failed to add notification:", err);
        }
    };

    const value = {
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearAll,
        addNotification
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};
