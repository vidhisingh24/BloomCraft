import React, { createContext, useContext, useState, useCallback } from 'react';
import { Sparkles, CheckCircle2, Heart } from 'lucide-react';

export interface ToastMessage {
  id: string;
  title: string;
  message?: string;
  type?: 'cart' | 'wishlist' | 'success' | 'info';
}

interface ToastContextType {
  showToast: (title: string, message?: string, type?: ToastMessage['type']) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((title: string, message?: string, type: ToastMessage['type'] = 'cart') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Notification Container */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none items-center w-full max-w-sm px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-center gap-3 px-4 py-3 bg-white/95 backdrop-blur-md border border-[#F4A6B7]/40 shadow-xl rounded-2xl text-[#3D272A] animate-bounce-short transition-all"
            style={{
              boxShadow: '0 10px 25px -5px rgba(217, 107, 130, 0.25)',
            }}
          >
            <div className="w-8 h-8 rounded-full bg-[#FFE3E8] flex items-center justify-center shrink-0 text-[#D96B82]">
              {toast.type === 'wishlist' ? (
                <Heart className="w-4 h-4 fill-[#D96B82]" />
              ) : toast.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-[#3D272A]">{toast.title}</p>
              {toast.message && <p className="text-xs text-[#7A5B62]">{toast.message}</p>}
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
