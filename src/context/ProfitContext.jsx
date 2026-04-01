import React, { createContext, useContext, useState, useEffect } from 'react';

const ProfitContext = createContext(undefined);

export const ProfitProvider = ({ children }) => {
    const [bookings, setBookings] = useState(() => {
        const savedBookings = localStorage.getItem('uncahp_bookings');
        if (savedBookings) {
            return JSON.parse(savedBookings);
        }
        return [];
    });

    useEffect(() => {
        localStorage.setItem('uncahp_bookings', JSON.stringify(bookings));
    }, [bookings]);

    const addBooking = (bookingData) => {
        const newBooking = {
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            ...bookingData
        };
        setBookings(prev => [...prev, newBooking]);
    };

    const updateBooking = (id, updates) => {
        setBookings(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
    };

    const deleteBooking = (id) => {
        setBookings(prev => prev.filter(b => b.id !== id));
    };

    const getBookingsByClientAndMonth = (clientId, targetMonthStr) => {
        // targetMonthStr format: 'YYYY-MM'
        return bookings.filter(b => {
            if (b.clientId !== clientId) return false;
            if (!b.appDate) return false; // Fallback if missing
            const bookingMonth = b.appDate.substring(0, 7); // Extracts 'YYYY-MM' from 'YYYY-MM-DD'
            return bookingMonth === targetMonthStr;
        }).sort((a, b) => new Date(b.appDate) - new Date(a.appDate));
    };

    return (
        <ProfitContext.Provider value={{
            bookings,
            addBooking,
            updateBooking,
            deleteBooking,
            getBookingsByClientAndMonth
        }}>
            {children}
        </ProfitContext.Provider>
    );
};

export const useProfit = () => {
    const context = useContext(ProfitContext);
    if (context === undefined) {
        throw new Error('useProfit must be used within a ProfitProvider');
    }
    return context;
};
