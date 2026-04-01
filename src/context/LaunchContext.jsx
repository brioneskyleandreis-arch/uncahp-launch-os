import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const LaunchContext = createContext();

export const useLaunch = () => useContext(LaunchContext);

export const LaunchProvider = ({ children }) => {
    const [launchesRaw, setLaunchesRaw] = useState([]);
    const [messages, setMessages] = useState([]);
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch launches
    const fetchLaunches = async () => {
        try {
            const { data, error } = await supabase
                .from('launches')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Sanitize data (defaults for null arrays/objects)
            const sanitizedData = (data || []).map(l => ({
                ...l,
                completedStages: l.completedStages || [],
                // messages property will be populated from separate table logic
                resources: l.resources || {}
            }));

            setLaunchesRaw(sanitizedData);
        } catch (error) {
            console.error("Error fetching launches:", error);
        }
    };

    // Fetch messages
    const fetchMessages = async () => {
        try {
            const { data, error } = await supabase
                .from('launch_messages')
                .select('*')
                .order('created_at', { ascending: true });

            if (error) {
                console.warn("Error fetching messages (table might be missing?):", error);
                return;
            }
            setMessages(data || []);
        } catch (error) {
            console.error("Error fetching messages:", error);
        }
    };

    // Fetch profiles
    const fetchProfiles = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*');

            if (error) {
                console.warn("Error fetching profiles:", error);
                return;
            }
            setProfiles(data || []);
        } catch (error) {
            console.error("Error in fetchProfiles:", error);
        }
    };

    // Initial fetch and subscription
    useEffect(() => {
        const init = async () => {
            setLoading(true);
            await Promise.all([fetchLaunches(), fetchMessages(), fetchProfiles()]);
            setLoading(false);
        };
        init();

        // Real-time for launches
        const launchSubscription = supabase
            .channel('launches_channel')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'launches' }, (payload) => {
                console.log('Launch Change received!', payload);
                fetchLaunches();
            })
            .subscribe();

        // Real-time for messages
        const messageSubscription = supabase
            .channel('messages_channel')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'launch_messages' }, (payload) => {
                console.log('Message Change received!', payload);
                fetchMessages();
            })
            .subscribe();

        // Real-time for profiles
        const profileSubscription = supabase
            .channel('profiles_channel')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
                fetchProfiles();
            })
            .subscribe();

        return () => {
            launchSubscription.unsubscribe();
            messageSubscription.unsubscribe();
            profileSubscription.unsubscribe();
        };
    }, []);

    // Derived state: combine launches with messages
    const launches = launchesRaw.map(launch => ({
        ...launch,
        messages: messages
            .filter(m => String(m.launch_id) === String(launch.id))
            // Map table columns to app's usage if needed, or update app to use new columns
            // App uses: { id, user, userId, text, time, isSystem, attachment }
            .map(m => {
                // Format time and date from created_at
                const date = new Date(m.created_at);
                const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

                // Resolve user name from profiles if possible, or fallback
                const userProfile = profiles.find(p => p.id === m.user_id);
                const userName = userProfile?.full_name || userProfile?.username || 'Unknown User';
                const userAvatar = userProfile?.avatar_url || null;

                return {
                    id: m.id,
                    userId: m.user_id,
                    user: userName, // Legacy compat
                    avatarUrl: userAvatar, // Global avatar sync
                    text: m.text,
                    time: timeStr,
                    date: dateStr,
                    attachment: m.attachment,
                    isSystem: m.is_system,
                    created_at: m.created_at
                };
            })
    }));

    const addLaunch = async (newLaunch) => {
        try {
            const { data, error } = await supabase
                .from('launches')
                .insert([newLaunch])
                .select()
                .single();

            if (error) throw error;

            // Log notification
            const userName = newLaunch.createdBy || 'Unknown User';
            await supabase.from('notifications').insert([{
                title: "New Launch Created",
                message: `${newLaunch.client} - ${newLaunch.offer} has been added by ${userName}.`,
                type: "info",
                created_at: new Date().toISOString()
            }]);

            return data.id;
        } catch (e) {
            console.error("Error adding document: ", e);
            throw e;
        }
    };

    const updateLaunchStage = async (launchId, stageId, user) => {
        try {
            const currentLaunch = launchesRaw.find(l => String(l.id) === String(launchId));
            if (!currentLaunch) return;

            const updatedStages = [...(currentLaunch.completedStages || []), stageId];
            const uniqueStages = [...new Set(updatedStages)];

            const { error } = await supabase
                .from('launches')
                .update({ completedStages: uniqueStages })
                .eq('id', launchId);

            if (error) throw error;

            // Notification Logic
            const { stages } = await import('../data/mockData');
            const stage = stages.find(s => s.id === stageId);
            if (stage) {
                const userName = user?.user_metadata?.full_name || user?.email || 'Unknown User';

                // System Message
                await addMessage(launchId, {
                    text: `${stage.label} completed by ${userName}.`,
                    isSystem: true,
                    user: 'System' // metadata
                }, true); // isSystem flag for internal logic

                // Global Notification
                await supabase.from('notifications').insert([{
                    title: "Stage Completed",
                    message: `${currentLaunch.client} - ${currentLaunch.offer}: '${stage.label}' completed by ${userName}.`,
                    type: "success",
                    actor_id: user?.id,
                    created_at: new Date().toISOString()
                }]);
            }
        } catch (e) {
            console.error("Error updating stage: ", e);
            throw e;
        }
    };

    const updateLaunchResources = async (launchId, resources, user) => {
        try {
            const { error } = await supabase
                .from('launches')
                .update({ resources })
                .eq('id', launchId);

            if (error) throw error;

            const userName = user?.user_metadata?.full_name || user?.email || 'Unknown User';

            // System Message
            await addMessage(launchId, {
                text: `Campaign resources updated by ${userName}.`,
                isSystem: true,
                user: 'System'
            }, true);

            // Global Notification
            const currentLaunch = launchesRaw.find(l => String(l.id) === String(launchId));
            if (currentLaunch) {
                await supabase.from('notifications').insert([{
                    title: "Resources Updated",
                    message: `${currentLaunch.client} resources updated by ${userName}.`,
                    type: "info",
                    actor_id: user?.id,
                    created_at: new Date().toISOString()
                }]);
            }
        } catch (e) {
            console.error("Error updating resources: ", e);
            throw e;
        }
    };

    // Modified addMessage to use new table
    const addMessage = async (launchId, messageData, isSystem = false) => {
        try {
            const userSession = await supabase.auth.getSession();
            const currentUser = userSession.data.session?.user;

            // For system messages, we might not have a user_id, or we use the actor's ID
            // messageData comes from LaunchDetails as: { user, userId, text, time, attachment... }

            const payload = {
                launch_id: launchId,
                user_id: isSystem ? null : (messageData.userId || currentUser?.id),
                text: messageData.text,
                attachment: messageData.attachment || null,
                is_system: isSystem || messageData.isSystem || false,
                created_at: new Date().toISOString()
            };

            const { error } = await supabase
                .from('launch_messages')
                .insert([payload]);

            if (error) throw error;
            await fetchMessages();
        } catch (e) {
            console.error("Error adding message: ", e);
            throw e;
        }
    };

    const uploadFile = async (launchId, file) => {
        try {
            const currentLaunch = launchesRaw.find(l => String(l.id) === String(launchId));
            const userSession = await supabase.auth.getSession();
            const currentUser = userSession.data.session?.user;
            const userName = currentUser?.user_metadata?.full_name || currentUser?.email || 'Unknown User';

            const timestamp = Date.now();
            const fileName = `${timestamp}-${file.name}`;
            const filePath = `${launchId}/${fileName}`;

            const { data, error } = await supabase.storage
                .from('chat-uploads')
                .upload(filePath, file, { cacheControl: '3600', upsert: false });

            if (error) throw new Error(`Upload failed: ${error.message}`);

            const { data: { publicUrl } } = supabase.storage
                .from('chat-uploads')
                .getPublicUrl(filePath);

            // Notification
            if (currentLaunch) {
                await supabase.from('notifications').insert([{
                    title: "File Uploaded",
                    message: `${userName} uploaded '${file.name}' to ${currentLaunch.client} - ${currentLaunch.offer}.`,
                    type: "info",
                    actor_id: currentUser?.id,
                    created_at: new Date().toISOString()
                }]);
            }

            return {
                url: publicUrl,
                name: file.name,
                size: file.size,
                type: file.type.startsWith('image/') ? 'image' : 'file'
            };
        } catch (e) {
            console.error("Error uploading file: ", e);
            throw e;
        }
    };

    const deleteLaunch = async (launchId) => {
        try {
            const launchToDelete = launchesRaw.find(l => String(l.id) === String(launchId));
            const userSession = await supabase.auth.getSession();
            const currentUser = userSession.data.session?.user;
            const userName = currentUser?.user_metadata?.full_name || currentUser?.email || 'Unknown User';

            const { error } = await supabase
                .from('launches')
                .delete()
                .eq('id', launchId);

            if (error) throw error;

            if (launchToDelete) {
                await supabase.from('notifications').insert([{
                    title: "Launch Deleted",
                    message: `${launchToDelete.client} - ${launchToDelete.offer} was deleted by ${userName}.`,
                    type: "warning",
                    actor_id: currentUser?.id,
                    created_at: new Date().toISOString()
                }]);
            }
        } catch (e) {
            console.error("Error deleting launch: ", e);
        }
    };

    const updateLaunchNotes = async (launchId, notes) => {
        try {
            const currentLaunch = launchesRaw.find(l => String(l.id) === String(launchId));
            const userSession = await supabase.auth.getSession();
            const currentUser = userSession.data.session?.user;
            const userName = currentUser?.user_metadata?.full_name || currentUser?.email || 'Unknown User';

            const { error } = await supabase
                .from('launches')
                .update({ notes })
                .eq('id', launchId);

            if (error) throw error;

            if (currentLaunch) {
                await supabase.from('notifications').insert([{
                    title: "Notes Updated",
                    message: `Notes for ${currentLaunch.client} updated by ${userName}.`,
                    type: "info",
                    actor_id: currentUser?.id,
                    created_at: new Date().toISOString()
                }]);
            }

        } catch (e) {
            console.error("Error updating notes: ", e);
            throw e;
        }
    };

    const undoLaunchStage = async (launchId, stageId, user) => {
        try {
            const currentLaunch = launchesRaw.find(l => String(l.id) === String(launchId));
            if (!currentLaunch) return;

            const updatedStages = (currentLaunch.completedStages || []).filter(id => id !== stageId);

            const { error } = await supabase
                .from('launches')
                .update({ completedStages: updatedStages })
                .eq('id', launchId);

            if (error) throw error;

            const { stages } = await import('../data/mockData');
            const stage = stages.find(s => s.id === stageId);
            if (stage) {
                const userName = user?.user_metadata?.full_name || user?.email || 'Unknown User';

                // System Message
                await addMessage(launchId, {
                    text: `${stage.label} marked as incomplete by ${userName}.`,
                    isSystem: true,
                    user: 'System'
                }, true);

                // Global Notification
                await supabase.from('notifications').insert([{
                    title: "Stage Reverted",
                    message: `${currentLaunch.client}: '${stage.label}' marked incomplete by ${userName}.`,
                    type: "warning",
                    actor_id: user?.id,
                    created_at: new Date().toISOString()
                }]);
            }
        } catch (e) {
            console.error("Error undoing stage: ", e);
            throw e;
        }
    };

    // --- Ad Metrics Logic ---
    const fetchAdMetrics = async (launchId) => {
        try {
            const { data, error } = await supabase
                .from('ad_metrics')
                .select('*')
                .eq('launch_id', launchId)
                .order('date', { ascending: true });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error("Error fetching ad metrics:", error);
            return [];
        }
    };

    const addAdMetric = async (metricData) => {
        try {
            const { data, error } = await supabase
                .from('ad_metrics')
                .upsert(metricData)
                .select()
                .single();

            if (error) throw error;

            const currentLaunch = launchesRaw.find(l => String(l.id) === String(metricData.launch_id));
            const userSession = await supabase.auth.getSession();
            const user = userSession.data.session?.user;

            // Log notification
            await supabase.from('notifications').insert([{
                title: 'Ads Data Updated',
                message: `New performance data added for ${currentLaunch?.client || 'Launch'}.`,
                type: 'info',
                actor_id: user?.id,
                created_at: new Date().toISOString()
            }]);

            return data;
        } catch (error) {
            console.error("Error adding ad metric:", error);
            throw error;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen w-full bg-[#0f1014] text-white flex-col gap-4">
                <div className="w-8 h-8 border-4 border-[#f48ccf] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-medium animate-pulse">Initializing UNCAHP OS...</p>
            </div>
        );
    }

    return (
        <LaunchContext.Provider value={{ launches, profiles, addLaunch, updateLaunchStage, undoLaunchStage, updateLaunchResources, updateLaunchNotes, addMessage, uploadFile, deleteLaunch, loading, fetchLaunches, fetchAdMetrics, addAdMetric }}>
            {children}
        </LaunchContext.Provider>
    );
};
