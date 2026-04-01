import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);

        // Auto remove after 3 seconds
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    }, []);

    const removeToast = (id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}

            {/* Toast Container */}
            <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`
                            pointer-events-auto min-w-[300px] p-4 rounded-xl shadow-2xl border flex items-center gap-3 animate-in slide-in-from-right fade-in duration-300
                            bg-[--bg-card] border-[--border] text-white
                        `}
                    >
                        <div className={`p-2 rounded-lg flex-shrink-0
                            ${toast.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' : ''}
                            ${toast.type === 'error' ? 'bg-red-500/10 text-red-500' : ''}
                            ${toast.type === 'info' ? 'bg-blue-500/10 text-blue-500' : ''}
                        `}>
                            {toast.type === 'success' && <CheckCircle2 size={18} />}
                            {toast.type === 'error' && <AlertCircle size={18} />}
                            {toast.type === 'info' && <Info size={18} />}
                        </div>

                        <p className="text-sm font-medium flex-1">{toast.message}</p>

                        <button onClick={() => removeToast(toast.id)} className="text-[--text-muted] hover:text-white transition-colors p-1 rounded-md hover:bg-[--bg-surface]">
                            <X size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};
