import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Search, Loader, Shield, User, ChevronDown, Check, Trash2 } from 'lucide-react';
import { ROLES } from '../constants/roles';

const Members = () => {
    const { user, isAdmin } = useAuth();
    const { addToast } = useToast();
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        fetchMembers();
    }, []);

    const fetchMembers = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setMembers(data || []);
        } catch (error) {
            console.error('Error fetching members:', error);
            addToast('Failed to load members', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleRoleUpdate = async (memberId, newRole) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ role: newRole })
                .eq('id', memberId);

            if (error) throw error;

            setMembers(members.map(m =>
                m.id === memberId ? { ...m, role: newRole } : m
            ));
            setEditingId(null);
            addToast('Role updated successfully', 'success');
        } catch (error) {
            console.error('Error updating role:', error);
            addToast('Failed to update role', 'error');
        }
    };

    const handleDeleteUser = async (memberId) => {
        if (!window.confirm("Are you SURE you want to permanently delete this user? This action cannot be undone.")) return;

        try {
            const { error } = await supabase.rpc('delete_user_as_admin', { user_id_to_delete: memberId });

            if (error) throw error;

            setMembers(members.filter(m => m.id !== memberId));
            addToast('User permanently deleted', 'success');
        } catch (error) {
            console.error('Error deleting user:', error);
            addToast('Failed to delete user', 'error');
        }
    };

    const filteredMembers = members.filter(member =>
        (member.full_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (member.full_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (member.email?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    );

    if (!isAdmin) {
        return (
            <div className="flex items-center justify-center h-full text-[--text-muted]">
                Access Denied
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-[--bg-app] p-6 gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[--text-main] mb-1">Team Members</h1>
                    <p className="text-[--text-muted] text-sm">Manage user roles and access</p>
                </div>
                <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[--text-muted]" size={16} />
                    <input
                        type="text"
                        placeholder="Search members..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-[--bg-surface] border border-[--border] rounded-lg text-sm text-[--text-main] focus:border-[--primary] outline-none transition-colors"
                    />
                </div>
            </div>

            <div className="bg-[--bg-card] border border-[--border] rounded-xl shadow-lg">
                {loading ? (
                    <div className="flex items-center justify-center p-12">
                        <Loader className="animate-spin text-[--primary]" size={24} />
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-[--border] bg-[--bg-surface]">
                                <th className="p-4 text-xs font-semibold text-[--text-muted] uppercase tracking-wider">User</th>
                                <th className="p-4 text-xs font-semibold text-[--text-muted] uppercase tracking-wider">Role</th>
                                <th className="p-4 text-xs font-semibold text-[--text-muted] uppercase tracking-wider">Joined</th>
                                <th className="p-4 text-xs font-semibold text-[--text-muted] uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[--divider]">
                            {filteredMembers.map((member) => (
                                <tr key={member.id} className="group hover:bg-[--bg-surface] transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-[--bg-app] border border-[--border] flex items-center justify-center overflow-hidden">
                                                {member.avatar_url ? (
                                                    <img src={member.avatar_url} alt={member.full_name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-sm font-bold text-[--text-muted]">
                                                        {(member.full_name || member.username || '?').charAt(0).toUpperCase()}
                                                    </span>
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-medium text-[--text-main]">{member.full_name || 'Unknown User'}</div>
                                                <div className="text-xs text-[--text-muted]">{member.email || 'No email'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            {member.role === 'Admin' ? (
                                                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center gap-1.5">
                                                    <Shield size={12} />
                                                    Admin
                                                </span>
                                            ) : member.role ? (
                                                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-[--bg-app] border border-[--border] text-[--text-main]">
                                                    {member.role}
                                                </span>
                                            ) : (
                                                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                                                    No Role
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 text-sm text-[--text-muted]">
                                        {new Date(member.created_at || Date.now()).toLocaleDateString()}
                                    </td>
                                    <td className="p-4 text-right relative">
                                        {editingId === member.id ? (
                                            <div className="absolute right-10 top-1/2 -translate-y-1/2 z-10 bg-[--bg-surface] border border-[--border] rounded-lg shadow-xl w-48">
                                                <div className="p-1 max-h-60 overflow-y-auto">
                                                    {ROLES.map(role => (
                                                        <button
                                                            key={role}
                                                            onClick={() => handleRoleUpdate(member.id, role)}
                                                            className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center justify-between
                                                                ${member.role === role ? 'bg-[--primary]/10 text-[--primary]' : 'text-[--text-muted] hover:text-[--text-main] hover:bg-[--bg-card]'}
                                                            `}
                                                        >
                                                            {role}
                                                            {member.role === role && <Check size={14} />}
                                                        </button>
                                                    ))}
                                                    <div className="h-px bg-[--divider] my-1 mx-2"></div>
                                                    <button
                                                        onClick={() => handleRoleUpdate(member.id, null)}
                                                        className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center justify-between 
                                                            ${!member.role ? 'bg-[--primary]/10 text-[--primary]' : 'text-[--text-muted] hover:text-[--text-main] hover:bg-[--bg-card]'}
                                                        `}
                                                    >
                                                        Remove Role
                                                        {!member.role && <Check size={14} />}
                                                    </button>
                                                </div>
                                                <button
                                                    onClick={() => setEditingId(null)}
                                                    className="w-full border-t border-[--border] p-2 text-xs text-[--text-muted] hover:text-[--text-main]"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-end gap-3">
                                                <button
                                                    onClick={() => setEditingId(member.id)}
                                                    className="text-xs font-medium text-[--primary] hover:text-[--text-main] transition-colors"
                                                >
                                                    Edit Role
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(member.id)}
                                                    className="p-1.5 text-[--text-muted] hover:text-red-400 hover:bg-[rgba(248,113,113,0.1)] rounded transition-colors"
                                                    title="Delete User"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default Members;
