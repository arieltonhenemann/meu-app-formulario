import React, { useState, useEffect, useCallback } from 'react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

let addToastFn: ((message: string, type: ToastType) => void) | null = null;

export const toast = {
  success: (message: string) => addToastFn?.(message, 'success'),
  error: (message: string) => addToastFn?.(message, 'error'),
  warning: (message: string) => addToastFn?.(message, 'warning'),
  info: (message: string) => addToastFn?.(message, 'info'),
};

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  useEffect(() => {
    addToastFn = addToast;
    return () => { addToastFn = null; };
  }, [addToast]);

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
    }
  };

  const getColor = (type: ToastType) => {
    switch (type) {
      case 'success': return '#28a745';
      case 'error': return '#dc3545';
      case 'warning': return '#ffc107';
      case 'info': return '#17a2b8';
    }
  };

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 10000,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      maxWidth: '400px',
    }}>
      {toasts.map(t => (
        <div
          key={t.id}
          style={{
            backgroundColor: 'white',
            border: `2px solid ${getColor(t.type)}`,
            borderRadius: '8px',
            padding: '12px 16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            animation: 'slideIn 0.3s ease',
            fontSize: '14px',
            color: '#333',
            fontWeight: 'bold',
          }}
        >
          <span style={{ fontSize: '18px' }}>{getIcon(t.type)}</span>
          <span>{t.message}</span>
          <button
            onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#999',
              fontSize: '16px',
              padding: '0 4px',
            }}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
};
