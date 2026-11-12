import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNotification } from '../../context/NotificationContext';

export const ConfirmDialogModal = () => {
  const { t } = useTranslation();
  const { confirmDialog, closeConfirmDialog, handleConfirm, showToast } = useNotification();

  if (!confirmDialog.isOpen) return null;

  const handleCancelClick = () => {
    closeConfirmDialog();
    showToast({
      type: 'info',
      message: t('common.cancelAction', 'Tindakan dibatalkan.'),
    });
  };

  const getIcon = () => {
    switch (confirmDialog.type) {
      case 'danger':
        return <AlertTriangle size={28} color="#ef4444" />;
      case 'warning':
        return <AlertCircle size={28} color="#f59e0b" />;
      default:
        return <Info size={28} color="#3b82f6" />;
    }
  };

  const getConfirmButtonStyle = () => {
    switch (confirmDialog.type) {
      case 'danger':
        return {
          backgroundColor: '#ef4444',
          color: 'white',
        };
      case 'warning':
        return {
          backgroundColor: '#f59e0b',
          color: 'white',
        };
      default:
        return {
          backgroundColor: 'var(--primary-color)',
          color: 'white',
        };
    }
  };

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '1rem',
      }}
      className="animate-fade-in"
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          width: '100%',
          maxWidth: '440px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-color)',
            backgroundColor: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {getIcon()}
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)' }}>
              {confirmDialog.title || t('common.confirmTitle', 'Konfirmasi Tindakan')}
            </h3>
          </div>
          <button
            onClick={handleCancelClick}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: '4px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem', color: 'var(--text-main)', fontSize: '0.95rem', lineHeight: '1.5' }}>
          {confirmDialog.message || t('common.confirmMsg', 'Apakah Anda yakin ingin melanjutkan?')}
        </div>

        {/* Actions */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--border-color)',
            backgroundColor: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '0.75rem',
          }}
        >
          <button
            onClick={handleCancelClick}
            style={{
              backgroundColor: '#ffffff',
              color: 'var(--text-muted)',
              border: '1px solid var(--border-color)',
              padding: '0.55rem 1.1rem',
              borderRadius: 'var(--radius-md)',
              fontWeight: 500,
              cursor: 'pointer',
              fontSize: '0.9rem',
            }}
          >
            {confirmDialog.cancelText || confirmDialog.cancelLabel || t('common.cancelBtn', 'Batal')}
          </button>
          <button
            onClick={handleConfirm}
            style={{
              ...getConfirmButtonStyle(),
              border: 'none',
              padding: '0.55rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '0.9rem',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            }}
          >
            {confirmDialog.confirmText || confirmDialog.confirmLabel || t('common.confirmBtn', 'Ya, Lanjutkan')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
