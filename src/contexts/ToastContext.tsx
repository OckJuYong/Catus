/**
 * 토스트 알림 컨텍스트
 */

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
}

let toastId = 0;

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const getToastStyle = (type: ToastType) => {
    switch (type) {
      case 'success':
        return { backgroundColor: '#5E7057', color: 'white' };
      case 'error':
        return { backgroundColor: '#e57373', color: 'white' };
      case 'warning':
        return { backgroundColor: '#ffb74d', color: '#333' };
      case 'info':
      default:
        return { backgroundColor: '#333', color: 'white' };
    }
  };

  const value: ToastContextValue = {
    showToast
  };

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* 토스트 컨테이너 */}
      <div
        style={{
          position: 'fixed',
          top: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          pointerEvents: 'none',
          width: '90%',
          maxWidth: 360,
        }}
      >
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              onClick={() => removeToast(toast.id)}
              style={{
                padding: '12px 16px',
                borderRadius: 12,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                fontSize: 14,
                fontWeight: 500,
                textAlign: 'center',
                pointerEvents: 'auto',
                cursor: 'pointer',
                ...getToastStyle(toast.type),
              }}
            >
              {toast.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
