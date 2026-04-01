import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Fetch initial session
        const initSession = async () => {
            try {
                const { data, error } = await supabase.auth.getSession();
                if (error) {
                    console.error("Auth session error:", error);
                } else if (data.session?.user) {
                    // Wait for the role too before turning off the loading gate,
                    // otherwise ProtectedRoute sees user+no-role and briefly redirects to /pending-access,
                    // which then bounces back to / (Dashboard) once role loads — losing the user's page.
                    const fetchedRole = await fetchRole(data.session.user.id);
                    setUser({ ...data.session.user, role: fetchedRole });
                }
            } finally {
                setIsLoading(false);
            }
        };

        initSession();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') {
                if (session?.user) {
                    // Update user state while preserving the existing role to prevent redirect flashing
                    setUser(prev => ({ ...session.user, role: prev?.role }));

                    // Fetch role in the background to ensure it's up to date
                    fetchRole(session.user.id).then(fetchedRole => {
                        setUser(prev => prev ? { ...prev, role: fetchedRole } : null);
                    });
                }
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchRole = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', userId)
                .single();

            if (error) {
                console.warn("Error fetching profile role:", error);
                return null;
            }
            return data?.role || null;
        } catch (err) {
            console.error("Failed to fetch user role:", err);
            return null;
        }
    };

    const updateProfile = async (updates) => {
        try {
            // 1. Update auth.users (metadata)
            const { data, error } = await supabase.auth.updateUser({
                data: updates
            });

            if (error) throw error;

            if (data?.user) {
                setUser(prev => ({ ...prev, ...data.user }));

                // 2. Sync to public.profiles table
                const { error: profileError } = await supabase
                    .from('profiles')
                    .update({
                        full_name: updates.full_name,
                        avatar_url: updates.avatar_url,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', data.user.id);

                if (profileError) {
                    console.error("Failed to sync profile check to DB:", profileError);
                }

                // Log notification
                await supabase.from('notifications').insert([{
                    title: "Profile Updated",
                    message: `${updates.full_name || 'User'} updated their profile.`,
                    type: "info",
                    actor_id: data.user.id,
                    created_at: new Date().toISOString()
                }]);
            }
        } catch (error) {
            console.error("Error updating profile:", error);
            throw error;
        }
    };

    const value = {
        signUp: (data) => supabase.auth.signUp(data),
        signIn: (data) => supabase.auth.signInWithPassword(data),
        signOut: () => supabase.auth.signOut(),
        user,
        role: user?.role || null,
        isAdmin: user?.role === 'Admin',
        isLoading,
        updateProfile
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
