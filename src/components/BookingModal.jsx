import React, { useState, useEffect } from 'react';
import { X, User, Calendar, PoundSterling, Tag, FileText, Activity, CreditCard, MessageSquare, Briefcase } from 'lucide-react';
import { useProfit } from '../context/ProfitContext';
import { useToast } from '../context/ToastContext';
import { format } from 'date-fns';

const BookingModal = ({ isOpen, onClose, selectedClient, editingBooking = null }) => {
    const { addBooking, updateBooking } = useProfit();
    const { addToast } = useToast();

    const [formData, setFormData] = useState({
        type: 'N', // N, R, T
        patientName: '',
        treatment: '',
        offer: '',
        appDate: format(new Date(), 'yyyy-MM-dd'),
        deposit: '',
        totalRevenue: '',
        cc: '',
        csr: '',
        practitioner: ''
    });

    useEffect(() => {
        if (isOpen) {
            if (editingBooking) {
                setFormData({
                    ...editingBooking,
                    deposit: editingBooking.deposit || '',
                    totalRevenue: editingBooking.totalRevenue || ''
                });
            } else {
                setFormData({
                    type: 'N',
                    patientName: '',
                    treatment: '',
                    offer: '',
                    appDate: format(new Date(), 'yyyy-MM-dd'),
                    deposit: '',
                    totalRevenue: '',
                    cc: '',
                    csr: '',
                    practitioner: ''
                });
            }
        }
    }, [isOpen, editingBooking]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!selectedClient) {
            addToast('error', 'No client selected', 'Select a client first before adding a booking.');
            return;
        }

        const bookingData = {
            ...formData,
            clientId: selectedClient.id,
            deposit: parseFloat(formData.deposit) || 0,
            totalRevenue: parseFloat(formData.totalRevenue) || 0
        };

        if (editingBooking) {
            updateBooking(editingBooking.id, bookingData);
            addToast('success', 'Booking Updated', 'Patient booking has been updated successfully.');
        } else {
            addBooking(bookingData);
            addToast('success', 'Booking Added', 'Patient booking has been logged successfully.');
        }

        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-[--bg-card] border border-[--border] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-full animate-slide-up">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-[--border] bg-[--bg-surface]">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            {editingBooking ? 'Edit Booking' : 'Log New Booking'}
                        </h2>
                        <p className="text-sm text-[--text-muted] mt-1">
                            {selectedClient?.name ? `Logging for ${selectedClient.name}` : 'Select a client first'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-[--bg-card] rounded-lg transition-colors text-[--text-muted] hover:text-[--text-main]"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 flex-1 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Type Indicator (N, R, T) */}
                        <div className="md:col-span-2">
                            <label className="label">Patient Type</label>
                            <div className="flex gap-4">
                                {[
                                    { value: 'N', label: 'New Patient' },
                                    { value: 'R', label: 'Returning Patient' },
                                    { value: 'T', label: 'Treatment Only' }
                                ].map((type) => (
                                    <label key={type.value} className={`flex-1 flex items-center justify-center p-3 rounded-xl border cursor-pointer transition-all ${formData.type === type.value
                                        ? 'border-[--primary] bg-[--primary]/10 text-[--primary] font-bold shadow-sm'
                                        : 'border-[--border] bg-[--bg-surface] text-[--text-muted] hover:bg-[--bg-surface-hover]'
                                        }`}>
                                        <input
                                            type="radio"
                                            name="type"
                                            value={type.value}
                                            checked={formData.type === type.value}
                                            onChange={handleChange}
                                            className="hidden"
                                        />
                                        {type.label}
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Patient Name */}
                        <div>
                            <label className="label">Patient Name *</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-[--text-muted]" size={16} />
                                <input
                                    required
                                    autoFocus
                                    type="text"
                                    name="patientName"
                                    value={formData.patientName}
                                    onChange={handleChange}
                                    placeholder="e.g. Jane Doe"
                                    className="w-full bg-[--bg-surface] border border-[--border] rounded-lg p-3 pl-10 text-[--text-main] focus:ring-2 focus:ring-[--primary] focus:border-transparent outline-none"
                                />
                            </div>
                        </div>

                        {/* Appointment Date */}
                        <div>
                            <label className="label">Appointment Date *</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-[--text-muted]" size={16} />
                                <input
                                    required
                                    type="date"
                                    name="appDate"
                                    value={formData.appDate}
                                    onChange={handleChange}
                                    className="w-full bg-[--bg-surface] border border-[--border] rounded-lg p-3 pl-10 text-[--text-main] focus:ring-2 focus:ring-[--primary] focus:border-transparent outline-none"
                                />
                            </div>
                        </div>

                        {/* Treatment */}
                        <div>
                            <label className="label">Treatment *</label>
                            <div className="relative">
                                <Activity className="absolute left-3 top-1/2 -translate-y-1/2 text-[--text-muted]" size={16} />
                                <input
                                    required
                                    type="text"
                                    name="treatment"
                                    value={formData.treatment}
                                    onChange={handleChange}
                                    placeholder="e.g. Laser Hair Removal"
                                    className="w-full bg-[--bg-surface] border border-[--border] rounded-lg p-3 pl-10 text-[--text-main] focus:ring-2 focus:ring-[--primary] focus:border-transparent outline-none"
                                />
                            </div>
                        </div>

                        {/* Offer / Notes */}
                        <div>
                            <label className="label">Offer / Notes</label>
                            <div className="relative">
                                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-[--text-muted]" size={16} />
                                <input
                                    type="text"
                                    name="offer"
                                    value={formData.offer}
                                    onChange={handleChange}
                                    placeholder="e.g. 50% Off Taster"
                                    className="w-full bg-[--bg-surface] border border-[--border] rounded-lg p-3 pl-10 text-[--text-main] focus:ring-2 focus:ring-[--primary] focus:border-transparent outline-none"
                                />
                            </div>
                        </div>

                        {/* Financials Divider */}
                        <div className="md:col-span-2 mt-4 pt-4 border-t border-[--border]">
                            <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider text-[--text-muted]">Financials</h3>
                        </div>

                        {/* Total Revenue */}
                        <div>
                            <label className="label">Total Revenue (£)</label>
                            <div className="relative">
                                <PoundSterling className="absolute left-3 top-1/2 -translate-y-1/2 text-[--text-muted]" size={16} />
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    name="totalRevenue"
                                    value={formData.totalRevenue}
                                    onChange={handleChange}
                                    placeholder="0.00"
                                    className="w-full bg-[--bg-surface] border border-[--border] rounded-lg p-3 pl-10 text-white focus:ring-2 focus:ring-[--primary] focus:border-transparent outline-none"
                                />
                            </div>
                        </div>

                        {/* Deposit */}
                        <div>
                            <label className="label">Deposit Paid (£)</label>
                            <div className="relative">
                                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-[--text-muted]" size={16} />
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    name="deposit"
                                    value={formData.deposit}
                                    onChange={handleChange}
                                    placeholder="0.00"
                                    className="w-full bg-[--bg-surface] border border-[--border] rounded-lg p-3 pl-10 text-white focus:ring-2 focus:ring-[--primary] focus:border-transparent outline-none"
                                />
                            </div>
                        </div>

                        {/* Staff Divider */}
                        <div className="md:col-span-2 mt-4 pt-4 border-t border-[--border]">
                            <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider text-[--text-muted]">Staff & Tracking</h3>
                        </div>

                        {/* CSR */}
                        <div>
                            <label className="label">CSR (Customer Service)</label>
                            <div className="relative">
                                <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 text-[--text-muted]" size={16} />
                                <input
                                    type="text"
                                    name="csr"
                                    value={formData.csr}
                                    onChange={handleChange}
                                    placeholder="Staff Name"
                                    className="w-full bg-[--bg-surface] border border-[--border] rounded-lg p-3 pl-10 text-white focus:ring-2 focus:ring-[--primary] focus:border-transparent outline-none"
                                />
                            </div>
                        </div>

                        {/* Practitioner */}
                        <div>
                            <label className="label">Practitioner</label>
                            <div className="relative">
                                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-[--text-muted]" size={16} />
                                <input
                                    type="text"
                                    name="practitioner"
                                    value={formData.practitioner}
                                    onChange={handleChange}
                                    placeholder="Staff Name"
                                    className="w-full bg-[--bg-surface] border border-[--border] rounded-lg p-3 pl-10 text-white focus:ring-2 focus:ring-[--primary] focus:border-transparent outline-none"
                                />
                            </div>
                        </div>

                    </div>

                    {/* Footer Actions */}
                    <div className="mt-8 flex items-center justify-end gap-3 sticky bottom-0 bg-[--bg-card] pt-4 border-t border-[--border]">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn hover:bg-[--bg-surface] border border-transparent"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={!selectedClient}
                        >
                            {editingBooking ? 'Save Changes' : 'Add Booking'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BookingModal;
