import React, { useState, useEffect, useMemo } from 'react';
import { useProfit } from '../context/ProfitContext';
import { useClients } from '../context/ClientContext';
import { fetchMetaCampaigns } from '../lib/metaApi';
import BookingModal from '../components/BookingModal';
import {
    TrendingUp,
    Calendar,
    Users,
    PoundSterling,
    Plus,
    CreditCard,
    MoreVertical,
    Trash2,
    Edit2
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';

const ProfitTracker = () => {
    const { getActiveClients } = useClients();
    const clients = getActiveClients();
    const { bookings, deleteBooking } = useProfit();

    // State
    const [selectedClientId, setSelectedClientId] = useState('');
    const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBooking, setEditingBooking] = useState(null);

    // Meta Ads State
    const [adSpend, setAdSpend] = useState(0);
    const [isLoadingSpend, setIsLoadingSpend] = useState(false);

    // Derived Data
    const selectedClient = clients.find(c => c.id === selectedClientId);

    useEffect(() => {
        // Auto-select first client if none selected and clients exist
        if (!selectedClientId && clients.length > 0) {
            setSelectedClientId(clients[0].id);
        }
    }, [clients, selectedClientId]);

    const filteredBookings = useMemo(() => {
        return bookings.filter(b => {
            if (b.clientId !== selectedClientId) return false;
            const bookingMonth = b.appDate.substring(0, 7); // yyyy-MM
            return bookingMonth === selectedMonth;
        });
    }, [bookings, selectedClientId, selectedMonth]);

    const stats = useMemo(() => {
        const totalRevenue = filteredBookings.reduce((sum, b) => sum + (parseFloat(b.totalRevenue) || 0), 0);
        const totalDeposits = filteredBookings.reduce((sum, b) => sum + (parseFloat(b.deposit) || 0), 0);
        return {
            totalBookings: filteredBookings.length,
            totalRevenue,
            totalDeposits,
            netProfit: totalRevenue - adSpend
        };
    }, [filteredBookings, adSpend]);

    // Fetch Meta Ads spend when client or month changes
    useEffect(() => {
        const fetchSpend = async () => {
            if (!selectedClient?.adAccountId) {
                setAdSpend(0);
                return;
            }

            setIsLoadingSpend(true);
            try {
                // Determine date range for the selected month
                // Append '-01' to make it a valid date string
                const date = parseISO(`${selectedMonth}-01`);
                const start = startOfMonth(date);
                const end = endOfMonth(date);

                const campaigns = await fetchMetaCampaigns(selectedClient.adAccountId, { start, end });

                // Sum up the spend from all campaigns for the month
                const totalSpend = campaigns.reduce((sum, camp) => sum + (parseFloat(camp.spend) || 0), 0);
                setAdSpend(totalSpend);
            } catch (error) {
                console.error('Failed to fetch ad spend for Profit Tracker:', error);
                setAdSpend(0);
            } finally {
                setIsLoadingSpend(false);
            }
        };

        if (selectedClientId && selectedMonth) {
            fetchSpend();
        }
    }, [selectedClientId, selectedMonth, selectedClient]);

    const handleEdit = (booking) => {
        setEditingBooking(booking);
        setIsModalOpen(true);
    };

    const handleCreateNew = () => {
        setEditingBooking(null);
        setIsModalOpen(true);
    };

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this booking?')) {
            deleteBooking(id);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in relative z-10 w-full min-w-0 p-6">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[--text-main] flex items-center gap-2">
                        <TrendingUp className="text-[--primary]" />
                        Profit Tracker
                    </h1>
                    <p className="text-[--text-muted]">Log patient bookings and track actual revenue against ad spend.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Client Selector */}
                    <div className="relative">
                        <select
                            value={selectedClientId}
                            onChange={(e) => setSelectedClientId(e.target.value)}
                            className="appearance-none bg-[--bg-surface] border border-[--border] rounded-lg py-2 pl-4 pr-10 text-[--text-main] focus:outline-none focus:border-[--primary] min-w-[180px]"
                        >
                            {clients.length === 0 && <option value="">No clients available</option>}
                            {clients.map(client => (
                                <option key={client.id} value={client.id}>{client.name}</option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[--text-muted]">
                            <TrendingUp size={16} /> {/* Generic icon for dropdown */}
                        </div>
                    </div>

                    {/* Month Selector */}
                    <div className="relative">
                        <input
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="bg-[--bg-surface] border border-[--border] rounded-lg p-2 text-[--text-main] focus:outline-none focus:border-[--primary] [color-scheme:dark]"
                        />
                    </div>

                    <button
                        onClick={handleCreateNew}
                        disabled={!selectedClient}
                        className="btn btn-primary flex items-center gap-2"
                    >
                        <Plus size={18} />
                        Log Patient
                    </button>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[--bg-card] border border-[--border] rounded-xl p-5 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-[--text-muted] font-medium text-sm">Total Bookings</p>
                        <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
                            <Users size={18} />
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-[--text-main]">{stats.totalBookings}</h3>
                </div>

                <div className="bg-[--bg-card] border border-[--border] rounded-xl p-5 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-[--text-muted] font-medium text-sm">Expected Revenue</p>
                        <div className="p-2 bg-green-500/10 text-green-500 rounded-lg">
                            <PoundSterling size={18} />
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-[--text-main]">£{stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                    <p className="text-xs text-[--text-muted] mt-1">
                        inc. £{stats.totalDeposits.toLocaleString()} deposits
                    </p>
                </div>

                <div className="bg-[--bg-card] border border-[--border] rounded-xl p-5 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-[--text-muted] font-medium text-sm">Ad Spend {isLoadingSpend && '(Loading...)'}</p>
                        <div className="p-2 bg-rose-500/10 text-rose-500 rounded-lg">
                            <CreditCard size={18} />
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-[--text-main]">
                        £{adSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h3>
                    <p className="text-xs text-[--text-muted] mt-1">
                        {selectedClient?.adAccountId ? 'Extracted from Meta Ads' : 'No Ad Account linked'}
                    </p>
                </div>

                <div className={`bg-[--bg-card] border border-[--border] rounded-xl p-5 shadow-sm ${stats.netProfit >= 0 ? 'border-t-4 border-t-green-500' : 'border-t-4 border-t-rose-500'}`}>
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-[--text-muted] font-medium text-sm">Net Profit</p>
                        <div className={`p-2 rounded-lg ${stats.netProfit >= 0 ? 'bg-green-500/10 text-green-500' : 'bg-rose-500/10 text-rose-500'}`}>
                            <TrendingUp size={18} />
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-[--text-main]">
                        £{stats.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h3>
                    <p className="text-xs text-[--text-muted] mt-1">Revenue minus Ad Spend</p>
                </div>
            </div>

            {/* Bookings Table */}
            <div className="bg-[--bg-card] border border-[--border] rounded-xl overflow-hidden shadow-sm flex flex-col min-h-[400px]">
                <div className="p-5 border-b border-[--border]">
                    <h2 className="text-lg font-bold text-[--text-main]">Patient Bookings ({format(parseISO(`${selectedMonth}-01`), 'MMMM yyyy')})</h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[--bg-surface] text-[--text-muted] text-sm uppercase tracking-wider border-b border-[--border]">
                                <th className="p-4 font-medium">Date</th>
                                <th className="p-4 font-medium">Patient</th>
                                <th className="p-4 font-medium">Type</th>
                                <th className="p-4 font-medium">Treatment</th>
                                <th className="p-4 font-medium">Revenue</th>
                                <th className="p-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[--border]">
                            {filteredBookings.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-[--text-muted]">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Calendar className="text-[--border] mb-2" size={32} />
                                            <p>No bookings logged for this month.</p>
                                            <button
                                                onClick={handleCreateNew}
                                                disabled={!selectedClient}
                                                className="mt-2 text-[--primary] hover:underline"
                                            >
                                                Log the first patient
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredBookings.map(booking => (
                                    <tr key={booking.id} className="hover:bg-[--bg-surface-hover] transition-colors group">
                                        <td className="p-4 whitespace-nowrap text-[--text-main]">
                                            {format(parseISO(booking.appDate), 'MMM dd, yyyy')}
                                        </td>
                                        <td className="p-4 font-medium text-[--text-main]">
                                            {booking.patientName}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 text-xs font-bold rounded-full ${booking.type === 'N' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                                                booking.type === 'R' ? 'bg-purple-500/10 text-purple-500 border border-purple-500/20' :
                                                    'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                                }`}>
                                                {booking.type === 'N' ? 'New' : booking.type === 'R' ? 'Returning' : 'Treatment'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-[--text-muted]">
                                            {booking.treatment}
                                        </td>
                                        <td className="p-4 font-medium text-green-400">
                                            £{Number(booking.totalRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEdit(booking)}
                                                    className="p-1.5 text-[--text-muted] hover:text-[--text-main] bg-[--bg-surface] hover:bg-[--border] rounded-md transition-colors"
                                                    title="Edit Booking"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(booking.id)}
                                                    className="p-1.5 text-[--text-muted] hover:text-rose-400 bg-[--bg-surface] hover:bg-[--border] rounded-md transition-colors"
                                                    title="Delete Booking"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <BookingModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                selectedClient={selectedClient}
                editingBooking={editingBooking}
            />
        </div>
    );
};

export default ProfitTracker;
