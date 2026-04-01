import React, { useState, useRef } from 'react';
import { Plus, Edit2, Trash2, X, Image as ImageIcon, Briefcase, CheckCircle2 } from 'lucide-react';
import { useClients } from '../context/ClientContext';
import { useToast } from '../context/ToastContext';

const ClientList = () => {
    const { clients, addClient, updateClient, deleteClient } = useClients();
    const { addToast } = useToast();

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
    const [formData, setFormData] = useState({ name: '', adAccountId: '', status: 'ACTIVE', logo: '' });
    const fileInputRef = useRef(null);

    const handleOpenModal = (client = null) => {
        if (client) {
            setEditingClient(client);
            setFormData({ name: client.name, adAccountId: client.adAccountId, status: client.status, logo: client.logo || '' });
        } else {
            setEditingClient(null);
            setFormData({ name: '', adAccountId: '', status: 'ACTIVE', logo: '' });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingClient(null);
    };

    const handleLogoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, logo: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!formData.name.trim() || !formData.adAccountId.trim()) {
            addToast('error', 'Name and Ad Account ID are required.');
            return;
        }

        if (editingClient) {
            updateClient(editingClient.id, formData);
            addToast('success', 'Client updated successfully');
        } else {
            addClient(formData);
            addToast('success', 'Client added successfully');
        }
        handleCloseModal();
    };

    const handleDelete = (id, name) => {
        if (window.confirm(`Are you sure you want to delete ${name}? This will not affect their Meta data.`)) {
            deleteClient(id);
            addToast('success', 'Client removed');
        }
    };

    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-[--bg-app] text-[--text-main]">
            <div className="max-w-7xl mx-auto p-4 lg:p-8">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-[--text-main] flex items-center gap-3">
                            <Briefcase className="text-[#f48ccf]" />
                            Client Management
                        </h1>
                        <p className="text-sm text-[--text-muted] mt-1">
                            Manage your active clients, logos, and their Meta Ad Account IDs.
                        </p>
                    </div>
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#f48ccf] to-[#c084fc] text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
                    >
                        <Plus size={18} />
                        Add Client
                    </button>
                </div>

                {/* Data Grid */}
                {clients.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-[--bg-card] border border-[--border] rounded-2xl">
                        <Briefcase size={48} className="text-[--text-muted] mb-4 opacity-50" />
                        <h3 className="text-lg font-bold text-[--text-main] mb-2">No clients yet</h3>
                        <p className="text-[--text-muted] text-sm max-w-sm text-center mb-6">
                            Add your first client to start tracking their ad accounts and building their profit dashboard.
                        </p>
                        <button
                            onClick={() => handleOpenModal()}
                            className="flex items-center gap-2 px-4 py-2 bg-[--bg-surface] text-[--text-main] rounded-lg border border-[--border] hover:bg-[--border] transition-colors"
                        >
                            <Plus size={18} />
                            Add First Client
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {clients.map(client => (
                            <div key={client.id} className="bg-[--bg-card] border border-[--border] rounded-2xl p-6 relative group transition-all hover:bg-[--bg-surface]">

                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-[--bg-surface] border border-[--border] overflow-hidden flex items-center justify-center flex-shrink-0">
                                            {client.logo ? (
                                                <img src={client.logo} alt={client.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <ImageIcon className="text-[--text-muted] opacity-50" size={24} />
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-[--text-main] truncate max-w-[160px]" title={client.name}>{client.name}</h3>
                                            <div className="text-xs text-[--text-muted] uppercase tracking-wider mt-1">{client.adAccountId}</div>
                                        </div>
                                    </div>

                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase ${client.status === 'ACTIVE'
                                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                        : 'bg-[--bg-app] text-[--text-muted] border border-[--border]'
                                        }`}>
                                        {client.status}
                                    </span>
                                </div>

                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                    <button
                                        onClick={() => handleOpenModal(client)}
                                        className="p-1.5 bg-[--bg-surface] hover:bg-[#f48ccf]/20 text-[--text-muted] hover:text-[#f48ccf] rounded-md transition-colors border border-[--border] hover:border-[#f48ccf]/30 shadow-sm"
                                        title="Edit Client"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(client.id, client.name)}
                                        className="p-1.5 bg-[--bg-surface] hover:bg-red-500/20 text-[--text-muted] hover:text-red-400 rounded-md transition-colors border border-[--border] hover:border-red-500/30 shadow-sm"
                                        title="Delete Client"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Manage Client Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[--bg-card] border border-[--border] rounded-2xl w-full max-w-md shadow-2xl flex flex-col relative animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="px-6 py-4 flex items-center justify-between border-b border-[--border]">
                            <h2 className="text-lg font-bold text-[--text-main]">
                                {editingClient ? 'Edit Client' : 'Add New Client'}
                            </h2>
                            <button
                                onClick={handleCloseModal}
                                className="p-2 text-[--text-muted] hover:text-[--text-main] rounded-lg hover:bg-[--bg-surface] transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6">

                            {/* Logo Upload */}
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-20 h-20 rounded-2xl bg-[--bg-surface] border-2 border-dashed border-[--border] overflow-hidden flex items-center justify-center relative group">
                                    {formData.logo ? (
                                        <img src={formData.logo} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <ImageIcon className="text-[--text-muted] opacity-50 block" size={32} />
                                    )}
                                    <div
                                        className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <span className="text-xs font-bold text-white uppercase tracking-wider drop-shadow-md">Upload</span>
                                    </div>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/png, image/jpeg, image/webp"
                                        onChange={handleLogoUpload}
                                    />
                                </div>
                                {formData.logo && (
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, logo: '' }))}
                                        className="text-xs text-red-400 hover:text-red-300 transition-colors"
                                    >
                                        Remove Logo
                                    </button>
                                )}
                            </div>

                            <div className="flex flex-col gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-[--text-muted] mb-1.5">
                                        Client Name
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                                        placeholder="e.g. Acme Corp"
                                        className="w-full bg-[--bg-surface] border border-[--border] text-[--text-main] px-4 py-2.5 rounded-lg focus:outline-none focus:border-[#f48ccf] transition-colors"
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-[--text-muted] mb-1.5">
                                        Meta Ad Account ID
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.adAccountId}
                                        onChange={(e) => setFormData(p => ({ ...p, adAccountId: e.target.value }))}
                                        placeholder="Numeric ID only (e.g. 123456789)"
                                        className="w-full bg-[--bg-surface] border border-[--border] text-[--text-main] px-4 py-2.5 rounded-lg focus:outline-none focus:border-[#f48ccf] transition-colors font-mono text-sm"
                                    />
                                    <p className="text-[10px] text-[--text-muted] mt-1.5">
                                        You can find this in your Meta Business Settings.
                                    </p>
                                </div>
                                <div className="mt-2">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <div className={`relative w-10 h-5 transition-colors rounded-full ${formData.status === 'ACTIVE' ? 'bg-[#f48ccf]' : 'bg-[--border]'}`}>
                                            <div className={`absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-transform ${formData.status === 'ACTIVE' ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                        </div>
                                        <span className="text-sm font-medium text-[--text-main]">
                                            {formData.status === 'ACTIVE' ? 'Active Client' : 'Inactive Client'}
                                        </span>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={formData.status === 'ACTIVE'}
                                            onChange={(e) => setFormData(p => ({ ...p, status: e.target.checked ? 'ACTIVE' : 'INACTIVE' }))}
                                        />
                                    </label>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-gradient-to-r from-[#f48ccf] to-[#c084fc] text-white font-medium py-3 px-4 rounded-lg hover:opacity-90 transition-opacity mt-4 flex items-center justify-center gap-2"
                            >
                                <CheckCircle2 size={18} />
                                {editingClient ? 'Save Changes' : 'Create Client'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientList;
