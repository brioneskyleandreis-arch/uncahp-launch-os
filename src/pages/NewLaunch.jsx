import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLaunch } from '../context/LaunchContext';
import { useClients } from '../context/ClientContext';
import { ArrowLeft, Rocket, Loader2, ChevronDown } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const NewLaunch = () => {
    const navigate = useNavigate();
    const { addLaunch } = useLaunch();
    const { getActiveClients } = useClients();
    const { addToast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const activeClients = getActiveClients();

    const initialFormState = {
        client: '',
        treatment: '',
        offer: '',
        notes: '',
        startDate: '',
        targetLaunchDate: '',
        launchType: '',
        referenceNumber: ''
    };

    const [formData, setFormData] = useState(initialFormState);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.client || !formData.treatment) {
            addToast("Please fill in Client and Treatment fields.", "error");
            return;
        }

        setIsSubmitting(true);

        const { launchType, ...otherFormData } = formData;

        const newLaunch = {
            ...otherFormData,
            launch_type: launchType,
            status: 'Planned',
            assignedTo: 'James', // Default for now
            stage: 'systems_setup',
            completedStages: [],
            messages: []
        };

        try {
            await addLaunch(newLaunch);
            addToast("Launch created successfully!", "success");
            navigate('/');
        } catch (error) {
            console.error("Submission error:", error);
            addToast(`Failed to create launch: ${error.message}`, "error");
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar w-full">
            <div className="p-8 max-w-7xl mx-auto flex flex-col gap-6 w-full">
                <div className="flex justify-between items-center">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[--text-muted] hover:text-[--text-main] transition-colors w-fit">
                    <ArrowLeft size={16} /> Back to Dashboard
                </button>
            </div>

            <div className="flex flex-col items-center mb-6">
                <div className="w-16 h-16 bg-[--bg-surface] rounded-2xl flex items-center justify-center text-[--primary] mb-4 shadow-lg shadow-[rgba(244,140,207,0.2)]">
                    <Rocket size={32} />
                </div>
                <h1 className="text-3xl font-bold">Launch Configuration</h1>
                <p className="text-[--text-muted] mt-2">Set up the foundational details for your new campaign.</p>
            </div>

            <form onSubmit={handleSubmit} className="card p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 items-start">
                    {/* --- Row 1 --- */}
                    {/* Client */}
                    <div>
                        <label className="label">Client *</label>
                        <div className="relative">
                            <select
                                autoFocus
                                name="client"
                                value={formData.client}
                                onChange={handleChange}
                                required
                                disabled={isSubmitting}
                                className="w-full bg-[--bg-card] border border-[--border] rounded-lg p-3 text-[--text-main] appearance-none focus:ring-2 focus:ring-[--primary] focus:border-transparent outline-none pr-10"
                            >
                                <option value="">Select a Client</option>
                                {activeClients.map(client => (
                                    <option key={client.id} value={client.name}>
                                        {client.name}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-[--text-muted] pointer-events-none" size={20} />
                        </div>
                    </div>

                    {/* Launch Type */}
                    <div>
                        <label className="label">Launch Type *</label>
                        <div className="relative">
                            <select
                                name="launchType"
                                value={formData.launchType}
                                onChange={handleChange}
                                required
                                disabled={isSubmitting}
                                className="w-full bg-[--bg-card] border border-[--border] rounded-lg p-3 text-[--text-main] appearance-none focus:ring-2 focus:ring-[--primary] focus:border-transparent outline-none pr-10"
                            >
                                <option value="">Select Type</option>
                                <option value="New Client">New Client</option>
                                <option value="New Offer">New Offer</option>
                                <option value="Reframe">Reframe</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-[--text-muted] pointer-events-none" size={20} />
                        </div>
                    </div>

                    {/* --- Row 2 --- */}
                    {/* Treatment */}
                    <div>
                        <label className="label">Treatment *</label>
                        <input
                            type="text"
                            name="treatment"
                            placeholder="e.g. Laser Hair Removal"
                            value={formData.treatment}
                            onChange={handleChange}
                            required
                            disabled={isSubmitting}
                        />
                    </div>

                    {/* Offer Details */}
                    <div>
                        <label className="label">Offer Details</label>
                        <textarea
                            name="offer"
                            rows="3"
                            placeholder="Describe the offer (e.g. 50% off first session)..."
                            value={formData.offer}
                            onChange={handleChange}
                            disabled={isSubmitting}
                        />
                    </div>

                    {/* --- Row 3 --- */}
                    {/* Start Date */}
                    <div>
                        <label className="label">Start Date</label>
                        <input
                            type="date"
                            name="startDate"
                            value={formData.startDate}
                            onChange={handleChange}
                            disabled={isSubmitting}
                        />
                    </div>

                    {/* Target Launch Date */}
                    <div>
                        <label className="label">Target Launch Date</label>
                        <input
                            type="date"
                            name="targetLaunchDate"
                            value={formData.targetLaunchDate}
                            onChange={handleChange}
                            disabled={isSubmitting}
                        />
                    </div>
                    
                    {/* Reference Number */}
                    <div className="md:col-span-2">
                        <label className="label">Reference Number (Manual)</label>
                        <input
                            type="text"
                            name="referenceNumber"
                            placeholder="e.g. REF-12345"
                            value={formData.referenceNumber}
                            onChange={handleChange}
                            disabled={isSubmitting}
                        />
                    </div>
                </div>

                {/* Notes (Full Width) */}
                <div className="mt-6">
                    <label className="label mb-2 block">Notes</label>
                    <textarea
                        name="notes"
                        rows="3"
                        placeholder="Any extra information for the team..."
                        value={formData.notes}
                        onChange={handleChange}
                        disabled={isSubmitting}
                        className="w-full bg-[--bg-surface] border border-[--border] text-[--text-main] px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-[--primary] focus:border-transparent transition-colors"
                    />
                </div>

                <div className="flex items-center justify-end gap-4 mt-4 pt-4 border-t border-[--border]">
                    <button type="button" onClick={() => navigate(-1)} className="btn hover:bg-[--bg-surface]" disabled={isSubmitting}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <Loader2 size={16} className="animate-spin mr-2" />
                                Creating...
                            </>
                        ) : (
                            'Set up Launch →'
                        )}
                    </button>
                </div>
            </form>
            </div>
        </div>
    );
};

export default NewLaunch;
