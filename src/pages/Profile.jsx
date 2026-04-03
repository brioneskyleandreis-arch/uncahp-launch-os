import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { User, Camera, Save, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Profile = () => {
    const { user, updateProfile } = useAuth();
    const { addToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const fileInputRef = useRef(null);
    const [formData, setFormData] = useState({
        fullName: '',
        avatarUrl: ''
    });

    useEffect(() => {
        if (user) {
            setFormData({
                fullName: user.user_metadata?.full_name || '',
                avatarUrl: user.user_metadata?.avatar_url || ''
            });
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleAvatarUpload = async (e) => {
        try {
            setUploadingAvatar(true);
            const file = e.target.files[0];
            if (!file) return;

            // Generate unique filename
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            setFormData(prev => ({ ...prev, avatarUrl: publicUrl }));
            addToast('Avatar uploaded! Click Save to apply.', 'success');
        } catch (error) {
            console.error('Error uploading avatar:', error);
            addToast(error.message || 'Error uploading avatar', 'error');
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await updateProfile({
                full_name: formData.fullName,
                avatar_url: formData.avatarUrl
            });
            addToast('Profile updated successfully!', 'success');
        } catch (error) {
            console.error("Error updating profile:", error);
            addToast('Failed to update profile.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-[--text-muted] bg-clip-text text-transparent">
                    Customize Profile
                </h1>
                <p className="text-[--text-muted] mt-2">Update your personal information and appearance.</p>
            </div>

            <div className="bg-[--bg-card] border border-[--border] rounded-xl p-8 shadow-lg">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Check for existing avatar or use initials */}
                    <div className="flex items-center gap-6 mb-8">
                        <div className="relative group">
                            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#f472d0] to-[#c084fc] flex items-center justify-center text-white font-bold text-3xl ring-4 ring-[--bg-app] shadow-xl overflow-hidden">
                                {formData.avatarUrl ? (
                                    <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <span>{formData.fullName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}</span>
                                )}
                            </div>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-[--text-main]">{user?.email}</h3>
                            <p className="text-[--text-muted] text-sm">Managed by Supabase Auth</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-[--text-muted]">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-[--text-muted]" size={18} />
                                <input
                                    type="text"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    className="w-full bg-[--bg-app] border border-[--border] rounded-lg py-2.5 pl-10 pr-4 text-[--text-main] focus:ring-2 focus:ring-[--primary] focus:border-transparent outline-none transition-all"
                                    placeholder="Enter your full name"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-[--text-muted]">Avatar Image</label>
                            <div className="relative">
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    ref={fileInputRef}
                                    onChange={handleAvatarUpload}
                                    disabled={uploadingAvatar || loading}
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploadingAvatar || loading}
                                    className="w-full bg-[--bg-app] border border-[--border] rounded-lg py-2.5 px-4 text-[--text-main] hover:bg-[--bg-surface] transition-all flex items-center justify-center gap-2"
                                >
                                    {uploadingAvatar ? (
                                        <Loader2 className="animate-spin" size={18} />
                                    ) : (
                                        <Camera className="text-[--text-muted]" size={18} />
                                    )}
                                    {uploadingAvatar ? 'Uploading...' : 'Upload Image'}
                                </button>
                            </div>
                            <p className="text-xs text-[--text-muted]">Upload a JPG, PNG, or GIF.</p>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-[--border] flex justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-[--primary] hover:bg-[#ff99d6] text-black font-bold py-2.5 px-6 rounded-lg transition-all transform active:scale-95 flex items-center gap-2 shadow-[0_0_15px_rgba(244,140,207,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Profile;
