import React, { createContext, useContext, useState, useEffect } from 'react';

const ClientContext = createContext(undefined);

export const ClientProvider = ({ children }) => {
    const defaultClients = [
        {
            id: '2861567790701572',
            name: 'Omarosa Laser Clinic',
            adAccountId: '2861567790701572',
            status: 'ACTIVE',
            logo: null
        }
    ];

    const [clients, setClients] = useState(() => {
        const savedClients = localStorage.getItem('uncahp_clients');
        if (savedClients) {
            return JSON.parse(savedClients);
        }

        // Migration path: if no 'uncahp_clients' but 'uncahp_ad_accounts' exists, migrate them
        const legacyAccounts = localStorage.getItem('uncahp_ad_accounts');
        if (legacyAccounts) {
            try {
                const parsedLegacy = JSON.parse(legacyAccounts);
                const migrated = parsedLegacy.map(acc => ({
                    id: acc.id || crypto.randomUUID(),
                    name: acc.name,
                    adAccountId: acc.id,
                    status: 'ACTIVE',
                    logo: null
                }));
                return migrated;
            } catch (e) {
                console.error("Failed to migrate legacy ad accounts", e);
            }
        }

        return defaultClients;
    });

    useEffect(() => {
        localStorage.setItem('uncahp_clients', JSON.stringify(clients));
    }, [clients]);

    const addClient = (client) => {
        setClients(prev => [...prev, { ...client, id: crypto.randomUUID() }]);
    };

    const updateClient = (id, updates) => {
        setClients(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    };

    const deleteClient = (id) => {
        setClients(prev => prev.filter(c => c.id !== id));
    };

    const getActiveClients = () => clients.filter(c => c.status === 'ACTIVE');

    return (
        <ClientContext.Provider value={{
            clients,
            addClient,
            updateClient,
            deleteClient,
            getActiveClients
        }}>
            {children}
        </ClientContext.Provider>
    );
};

export const useClients = () => {
    const context = useContext(ClientContext);
    if (context === undefined) {
        throw new Error('useClients must be used within a ClientProvider');
    }
    return context;
};
