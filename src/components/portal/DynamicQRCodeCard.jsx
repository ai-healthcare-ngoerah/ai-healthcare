import React, { useState } from 'react';
import {
  QrCode,
  Download,
  Printer,
  Copy,
  Check,
  CheckCircle,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Clock,
  Stethoscope,
  Building2,
  Scan,
  RefreshCw
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNotification } from '../../context/NotificationContext';

/**
 * DynamicQRCodeCard - Reusable, well-structured hospital reservation QR Pass component.
 * Supports:
 * - variant="compact": Ideal for post-reservation confirmation modals (ReservationForm)
 * - variant="full": Ideal for dedicated patient portal e-ticket view (PatientPortal)
 */
const DynamicQRCodeCard = ({
  portalToken,
  queueNumber = 'A-01',
  patientName = '',
  doctorName = '',
  poliName = 'Poli Umum',
  clinicName = 'Ternak AI Healthcare',
  appointmentDate = '',
  appointmentTime = '09:00',
  qrCodeUrl = null,
  qrPayload = null,
  shortCode = null,
  isCheckedIn = false,
  variant = 'compact',
  showActions = true,
  onCheckInSimulate = null,
  isCheckingIn = false
}) => {
  const { t } = useTranslation();
  const { showToast } = useNotification();
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Fallback short code e.g. QR-7A9B
  const effectiveShortCode =
    shortCode ||
    (portalToken ? `QR-${portalToken.replace(/-/g, '').slice(0, 4).toUpperCase()}` : 'QR-PASS');

  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8001';
  const effectiveQrUrl =
    !imgError && qrCodeUrl
      ? qrCodeUrl
      : `${apiBase}/api/booking/portal/${portalToken}/qr?size=${variant === 'full' ? 240 : 160}`;

  const portalLink = `${window.location.origin}/patient/portal/${portalToken}`;

  const handleCopyShortCode = () => {
    navigator.clipboard.writeText(effectiveShortCode);
    setCopiedCode(true);
    showToast({
      type: 'success',
      title: 'Kode Disalin',
      message: `Kode tiket ${effectiveShortCode} berhasil disalin ke clipboard.`
    });
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(portalLink);
    setCopiedLink(true);
    showToast({
      type: 'success',
      title: t('reservation.portal.copyLinkBtn') || 'Salin Tautan',
      message: t('reservation.portal.linkCopied') || 'Tautan portal berhasil disalin ke clipboard.'
    });
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDownloadQr = async () => {
    if (isDownloading) return;
    setIsDownloading(true);

    const safeQueue = (queueNumber || 'Tiket').replace(/[^a-zA-Z0-9_-]/g, '');
    const fileName = `QR-Reservasi-${safeQueue}-${effectiveShortCode}.png`;
    const downloadUrl = `${effectiveQrUrl}${effectiveQrUrl.includes('?') ? '&' : '?'}download=1`;

    try {
      // 1. Fetch stream image as binary Blob & create local object URL (bypasses browser cross-origin download restrictions)
      const response = await fetch(downloadUrl);
      if (!response.ok) throw new Error('Gagal mengambil stream gambar dari server.');
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1500);

      showToast({
        type: 'success',
        title: t('reservation.portal.downloadQrBtn') || 'Download QR Code',
        message: `File ${fileName} berhasil diunduh ke folder Downloads.`
      });
    } catch (fetchErr) {
      // 2. Fallback: Draw to HTML5 Canvas and export as PNG blob
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || 250;
          canvas.height = img.naturalHeight || 250;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          canvas.toBlob((canvasBlob) => {
            if (canvasBlob) {
              const canvasUrl = window.URL.createObjectURL(canvasBlob);
              const link = document.createElement('a');
              link.href = canvasUrl;
              link.download = fileName;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              setTimeout(() => window.URL.revokeObjectURL(canvasUrl), 1500);
              showToast({
                type: 'success',
                title: t('reservation.portal.downloadQrBtn') || 'Download QR Code',
                message: `File ${fileName} berhasil diunduh.`
              });
            } else {
              window.open(downloadUrl, '_blank');
            }
          }, 'image/png');
        };
        img.onerror = () => {
          window.open(downloadUrl, '_blank');
        };
        img.src = effectiveQrUrl;
      } catch (canvasErr) {
        window.open(downloadUrl, '_blank');
      }
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const isFull = variant === 'full';

  return (
    <div
      className="dynamic-qr-pass-card"
      style={{
        background: '#ffffff',
        borderRadius: isFull ? '16px' : '12px',
        border: '1px solid #e2e8f0',
        boxShadow: isFull ? '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)' : '0 2px 8px rgba(0, 0, 0, 0.04)',
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      {/* Header Tiket / Branding RS */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#ffffff',
          padding: isFull ? '1.25rem 1.5rem' : '0.85rem 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '3px solid #059669'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <img
            src="/logos/usada-ai-icon.webp"
            alt="USADA AI Logo"
            style={{
              height: isFull ? '32px' : '26px',
              width: 'auto',
              objectFit: 'contain',
              background: '#ffffff',
              padding: '2px 4px',
              borderRadius: '4px'
            }}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          <div>
            <div style={{ fontSize: isFull ? '0.9rem' : '0.8rem', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              {clinicName || 'Ternak AI Healthcare'}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
              {isFull ? 'Digital Hospital Pass & Kiosk Check-in' : 'Kartu Antrean & E-Tiket'}
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              background: isCheckedIn ? '#065f46' : 'rgba(5, 150, 105, 0.25)',
              color: isCheckedIn ? '#a7f3d0' : '#34d399',
              border: '1px solid rgba(52, 211, 153, 0.3)',
              padding: '0.2rem 0.55rem',
              borderRadius: '9999px',
              fontSize: '0.7rem',
              fontWeight: 600
            }}
          >
            {isCheckedIn ? <CheckCircle size={12} /> : <ShieldCheck size={12} />}
            {isCheckedIn ? 'TERVERIFIKASI' : 'VALID PASS'}
          </span>
        </div>
      </div>

      {/* Konten Utama */}
      <div style={{ padding: isFull ? '1.5rem' : '1rem', textAlign: 'center' }}>
        {/* Nomor Antrean Box */}
        <div
          style={{
            background: '#f8fafc',
            border: '1px dashed #cbd5e1',
            borderRadius: '10px',
            padding: isFull ? '1rem' : '0.75rem',
            marginBottom: '1rem'
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {t('reservation.portal.queueLabel') || 'NOMOR ANTREAN'}
          </div>
          <div
            style={{
              fontSize: isFull ? '2.5rem' : '1.85rem',
              fontWeight: 800,
              color: '#059669',
              lineHeight: 1.15,
              margin: '0.25rem 0'
            }}
          >
            {queueNumber}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#334155', fontWeight: 600 }}>
            {poliName} {doctorName ? `• ${doctorName}` : ''}
          </div>
        </div>

        {/* Frame QR Code */}
        <div style={{ display: 'inline-block', position: 'relative', margin: '0.25rem 0 0.75rem' }}>
          <div
            style={{
              padding: isFull ? '0.85rem' : '0.6rem',
              background: '#ffffff',
              borderRadius: '14px',
              border: isCheckedIn ? '2px solid #10b981' : '2px solid #e2e8f0',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
              display: 'inline-block'
            }}
          >
            <img
              src={effectiveQrUrl}
              alt={`QR Code ${effectiveShortCode}`}
              style={{
                width: isFull ? '180px' : '135px',
                height: isFull ? '180px' : '135px',
                display: 'block',
                borderRadius: '8px',
                objectFit: 'contain'
              }}
              loading="eager"
              onError={() => setImgError(true)}
            />
          </div>

          {/* Overlay jika sudah Checked-In */}
          {isCheckedIn && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                borderRadius: '14px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(2px)'
              }}
            >
              <CheckCircle size={isFull ? 46 : 34} color="#10b981" />
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#065f46', marginTop: '0.35rem' }}>
                {t('reservation.portal.statusCheckedIn') || 'SUDAH CHECK-IN'}
              </span>
            </div>
          )}
        </div>

        {/* Human-Readable Short Code Backup */}
        <div style={{ margin: '0.5rem 0 0.85rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: '#f1f5f9',
              border: '1px solid #cbd5e1',
              padding: '0.35rem 0.75rem',
              borderRadius: '6px'
            }}
          >
            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>KODE TIKET:</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', letterSpacing: '0.5px', fontFamily: 'monospace' }}>
              {effectiveShortCode}
            </span>
            <button
              type="button"
              onClick={handleCopyShortCode}
              title="Salin kode tiket"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: copiedCode ? '#059669' : '#64748b',
                padding: '2px',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              {copiedCode ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
        </div>

        {/* Petunjuk Kios Mandiri */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '8px',
            padding: '0.55rem 0.75rem',
            marginBottom: showActions ? '1rem' : '0'
          }}
        >
          <Scan size={16} color="#059669" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: '0.75rem', color: '#166534', textAlign: 'left', lineHeight: 1.35 }}>
            {t('reservation.portal.qrInstructions') ||
              'Arahkan QR Code ke scanner barcode Kios Mandiri di lobi RS saat Anda tiba untuk konfirmasi kedatangan.'}
          </span>
        </div>

        {/* Action Buttons */}
        {showActions && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              flexWrap: 'wrap',
              paddingTop: '0.5rem',
              borderTop: '1px dashed #e2e8f0'
            }}
          >
            <button
              type="button"
              onClick={handleDownloadQr}
              disabled={isDownloading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.78rem',
                padding: '0.45rem 0.75rem',
                backgroundColor: isDownloading ? '#f8fafc' : '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                color: isDownloading ? '#94a3b8' : '#334155',
                cursor: isDownloading ? 'not-allowed' : 'pointer',
                fontWeight: 500,
                transition: 'all 0.15s ease'
              }}
            >
              {isDownloading ? (
                <RefreshCw size={13} className="animate-spin" />
              ) : (
                <Download size={13} />
              )}
              {isDownloading
                ? (t('reservation.portal.downloadingQr') || 'Mengunduh...')
                : (t('reservation.portal.downloadQrBtn') || 'Download QR Code')}
            </button>

            {isFull && (
              <button
                type="button"
                onClick={handlePrint}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.78rem',
                  padding: '0.45rem 0.75rem',
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  color: '#334155',
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                <Printer size={13} />
                {t('reservation.portal.printTicketBtn') || 'Cetak'}
              </button>
            )}

            <button
              type="button"
              onClick={handleCopyLink}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.78rem',
                padding: '0.45rem 0.75rem',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                color: '#334155',
                cursor: 'pointer',
                fontWeight: 500
              }}
            >
              {copiedLink ? <Check size={13} color="#059669" /> : <Copy size={13} />}
              {t('reservation.portal.copyLinkBtn') || 'Salin Tautan'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DynamicQRCodeCard;
