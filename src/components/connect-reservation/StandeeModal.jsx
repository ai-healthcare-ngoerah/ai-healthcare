import React from 'react';
import { Printer } from 'lucide-react';

const StandeeModal = ({
  showStandeeModal,
  setShowStandeeModal,
  clinicName,
  waQrUrl,
  cleanPhone,
}) => {
  if (!showStandeeModal) return null;

  return (
    <div className="cr-modal-overlay" onClick={() => setShowStandeeModal(false)}>
      <div className="cr-modal-standee-card" onClick={(e) => e.stopPropagation()}>
        <div className="cr-standee-print-area">
          <div className="cr-standee-header">
            <h2>{clinicName}</h2>
            <p>Pendaftaran Mandiri &amp; Reservasi Antrean Pasien</p>
          </div>
          <div className="cr-standee-body">
            <div className="cr-standee-qr-frame">
              <img src={waQrUrl} alt="Standee QR" />
            </div>
            <div className="cr-standee-steps">
              <span className="cr-standee-badge">PINDAI DENGAN HP ANDA</span>
              <p>1. Buka kamera ponsel atau aplikasi WhatsApp</p>
              <p>2. Arahkan ke kode QR di atas</p>
              <p>3. Dapatkan nomor antrean resmi dalam 5 detik!</p>
            </div>
          </div>
          <div className="cr-standee-footer">
            <span>Hotline: +{cleanPhone}</span>
            <span>•</span>
            <span>Website: {window.location.host}</span>
          </div>
        </div>

        <div className="cr-modal-actions no-print">
          <button className="cr-btn-primary" onClick={() => window.print()}>
            <Printer size={16} />
            <span>Cetak Standee</span>
          </button>
          <button className="cr-btn-ghost" onClick={() => setShowStandeeModal(false)}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default StandeeModal;
