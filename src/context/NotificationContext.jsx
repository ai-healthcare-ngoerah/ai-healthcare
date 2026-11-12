import React, { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '',
    confirmLabel: '',
    cancelText: '',
    cancelLabel: '',
    type: 'danger',
    onConfirm: null,
  });

  const showToast = useCallback(({ type = 'success', message = '', title = '' }) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    const newToast = { id, type, message, title };
    
    setToasts((prev) => [...prev, newToast]);

    // Auto dismiss toast after 3500ms
    setTimeout(() => {
      removeToast(id);
    }, 3500);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const confirmAction = useCallback(({
    title = '',
    message = '',
    confirmText = '',
    confirmLabel = '',
    cancelText = '',
    cancelLabel = '',
    type = 'danger',
    onConfirm = () => {},
  }) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      confirmText: confirmText || confirmLabel || '',
      cancelText: cancelText || cancelLabel || '',
      type,
      onConfirm,
    });
  }, []);

  const closeConfirmDialog = useCallback(() => {
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const handleConfirm = useCallback(() => {
    if (confirmDialog.onConfirm) {
      confirmDialog.onConfirm();
    }
    closeConfirmDialog();
  }, [confirmDialog, closeConfirmDialog]);

  return (
    <NotificationContext.Provider
      value={{
        toasts,
        showToast,
        removeToast,
        confirmDialog,
        confirmAction,
        closeConfirmDialog,
        handleConfirm,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
