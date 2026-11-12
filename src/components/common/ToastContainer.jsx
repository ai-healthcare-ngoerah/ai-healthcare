import React from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';

const typeStyles = {
  success: {
    bg: '#f0fdf4',
    border: '#bbf7d0',
    color: '#166534',
    iconColor: '#16a34a',
    Icon: CheckCircle2,
  },
  error: {
    bg: '#fef2f2',
    border: '#fecaca',
    color: '#991b1b',
    iconColor: '#dc2626',
    Icon: AlertCircle,
  },
  warning: {
    bg: '#fffbeb',
    border: '#fde68a',
    color: '#92400e',
    iconColor: '#d97706',
    Icon: AlertTriangle,
  },
  info: {
    bg: '#eff6ff',
    border: '#bfdbfe',
    color: '#1e40af',
    iconColor: '#2563eb',
    Icon: Info,
  },
};

export const ToastContainer = () => {
  const { toasts, removeToast } = useNotification();

  if (!toasts || toasts.length === 0) return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: '1.5rem',
        right: '1.5rem',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        maxWidth: '400px',
        width: 'calc(100vw - 3rem)',
        pointerEvents: 'none',
      }}
    >
      {toasts.map((toast) => {
        const style = typeStyles[toast.type] || typeStyles.info;
        const { Icon } = style;

        return (
          <div
            key={toast.id}
            className="animate-fade-in"
            style={{
              pointerEvents: 'auto',
              backgroundColor: style.bg,
              border: `1px solid ${style.border}`,
              borderRadius: 'var(--radius-md)',
              padding: '0.9rem 1.1rem',
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.05)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              transition: 'all 0.3s ease',
            }}
          >
            <Icon size={20} color={style.iconColor} style={{ marginTop: '2px', flexShrink: 0 }} />
            <div style={{ flexGrow: 1 }}>
              {toast.title && (
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: style.color, marginBottom: '2px' }}>
                  {toast.title}
                </div>
              )}
              <div style={{ fontSize: '0.875rem', color: style.color, lineHeight: '1.4' }}>
                {toast.message}
              </div>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: style.color,
                opacity: 0.6,
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
              onMouseOver={(e) => (e.currentTarget.style.opacity = '1')}
              onMouseOut={(e) => (e.currentTarget.style.opacity = '0.6')}
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>,
    document.body
  );
};
