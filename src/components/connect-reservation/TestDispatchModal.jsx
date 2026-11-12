import React from 'react';
import { createPortal } from 'react-dom';
import { Send, X, Phone, AlertTriangle } from 'lucide-react';

const TestDispatchModal = ({
  showTestModal,
  setShowTestModal,
  cleanPhone,
  wahaSessionName,
  testTargetPhone,
  setTestTargetPhone,
  testMessageText,
  setTestMessageText,
  handleExecuteTestDispatch,
  testingDispatch,
}) => {
  if (!showTestModal) return null;

  return createPortal(
    <div className="cr-modal-overlay" onClick={() => setShowTestModal(false)}>
      <div className="cr-test-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="cr-test-modal-header">
          <div className="cr-test-modal-icon-box">
            <Send size={20} />
          </div>
          <div className="cr-test-modal-header-text">
            <h3 className="cr-test-modal-title">Uji Kirim Pesan WhatsApp</h3>
            <p className="cr-test-modal-subtitle">
              Kirim pesan uji coba nyata ke nomor WhatsApp tujuan untuk memverifikasi gateway aktif.
            </p>
          </div>
          <button
            type="button"
            className="cr-test-modal-close-btn"
            onClick={() => setShowTestModal(false)}
            title="Tutup Modal"
            aria-label="Tutup"
          >
            <X size={18} />
          </button>
        </div>

        <div className="cr-test-modal-body">
          <div
            style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '8px',
              padding: '10px 12px',
              marginBottom: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="cr-channel-status-dot online"></div>
              <span style={{ fontSize: '13px', color: '#166534', fontWeight: '600' }}>
                Pengirim Gateway Aktif:
              </span>
              <span style={{ fontSize: '13px', color: '#14532d', fontWeight: '700' }}>
                +{cleanPhone || '6285183071646'}
              </span>
            </div>
            <span style={{ fontSize: '12px', color: '#15803d' }}>
              Sesi: {wahaSessionName || 'Ternak-Automation'}
            </span>
          </div>

          <div className="cr-test-modal-field">
            <label className="cr-test-modal-label">
              <span>Nomor WhatsApp Tujuan Penerima</span>
              <span className="cr-test-modal-required">*</span>
            </label>
            <div className="cr-test-modal-input-wrap">
              <Phone size={16} className="cr-test-input-icon" />
              <input
                type="text"
                inputMode="numeric"
                className="cr-test-modal-input"
                value={testTargetPhone}
                onChange={(e) => setTestTargetPhone(e.target.value)}
                placeholder="Contoh: 081234567890 atau 6281234567890"
                autoFocus
              />
            </div>
            <p className="cr-test-modal-hint">
              Masukkan nomor WhatsApp ponsel lain untuk menguji dan memverifikasi penerimaan pesan dari gateway.
            </p>
            {testTargetPhone && testTargetPhone.replace(/[^0-9]/g, '') === cleanPhone && (
              <div
                style={{
                  marginTop: '6px',
                  fontSize: '12px',
                  color: '#d97706',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <AlertTriangle size={13} />
                <span>
                  Perhatian: Nomor tujuan sama dengan nomor pengirim faskes. Disarankan menggunakan nomor penerima yang berbeda untuk memverifikasi pesan masuk.
                </span>
              </div>
            )}
          </div>

          <div className="cr-test-modal-field">
            <label className="cr-test-modal-label">
              <span>Isi Pesan Uji Coba</span>
            </label>
            <textarea
              className="cr-test-modal-textarea"
              rows={4}
              value={testMessageText}
              onChange={(e) => setTestMessageText(e.target.value)}
              placeholder="Ketik teks pesan uji verifikasi yang ingin dikirimkan..."
            />
          </div>

          <div className="cr-test-gateway-info">
            <div className="cr-channel-status-dot online"></div>
            <span>Sesi Gateway: {wahaSessionName || 'Ternak-Automation'}</span>
          </div>
        </div>

        <div className="cr-test-modal-footer">
          <button
            type="button"
            className="btn btn-secondary cr-test-btn-cancel"
            onClick={() => setShowTestModal(false)}
            disabled={testingDispatch}
          >
            Batal
          </button>
          <button
            type="button"
            className="btn btn-primary cr-test-btn-send"
            onClick={handleExecuteTestDispatch}
            disabled={testingDispatch || !testTargetPhone.trim()}
          >
            <Send size={15} />
            <span>{testingDispatch ? 'Sedang Mengirim...' : 'Kirim Pesan Uji Sekarang'}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default TestDispatchModal;
