import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, RefreshCw, Search, 
  Clock, AlertCircle, CheckCircle2, UserCheck, 
  QrCode, Download, ExternalLink, Copy, Check, X 
} from 'lucide-react';
import { lookupQueueByRM } from '../services/api';
import { useNotification } from '../context/NotificationContext';

const RawatJalan = () => {
  const navigate = useNavigate();
  const { showToast } = useNotification();
  
  // Lookup state
  const [rmQuery, setRmQuery] = useState('');
  const [isSearchingRm, setIsSearchingRm] = useState(false);
  const [personalQueue, setPersonalQueue] = useState(null);
  const [rmError, setRmError] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const rmInputRef = useRef(null);

  // Handle Search No. RM
  const handleSearchRm = async (e) => {
    if (e) e.preventDefault();
    const cleanQ = rmQuery.trim();
    if (!cleanQ) {
      setRmError('Silakan masukkan Nomor Rekam Medis - No. RM.');
      return;
    }

    setIsSearchingRm(true);
    setRmError('');
    setPersonalQueue(null);

    try {
      const res = await lookupQueueByRM(cleanQ, 'rawat-jalan');
      if (res && res.found) {
        setPersonalQueue(res);
      } else {
        setRmError(res?.message || 'Nomor Rekam Medis tidak ditemukan dalam jadwal antrean aktif.');
      }
    } catch (err) {
      console.error('Error looking up queue by RM:', err);
      setRmError(err.message || 'Gagal mencari nomor antrean. Silakan coba lagi.');
    } finally {
      setIsSearchingRm(false);
    }
  };

  const handleCopyShortCode = (code) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    showToast?.({
      type: 'success',
      title: 'Kode Disalin',
      message: `Kode pass ${code} berhasil disalin.`
    });
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDownloadQr = async () => {
    if (!personalQueue?.qr_code_url) return;
    setIsDownloading(true);
    try {
      const resp = await fetch(personalQueue.qr_code_url);
      const blob = await resp.blob();
      const objectUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = objectUrl;
      const qNum = personalQueue.appointment?.queue_number || 'PASS';
      link.download = `QR-Antrean-${qNum}-${personalQueue.patient?.medical_record_no || 'RS'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);

      showToast?.({
        type: 'success',
        title: 'QR Code Diunduh',
        message: 'Kode QR antrean berhasil disimpan ke perangkat Anda.'
      });
    } catch (err) {
      window.open(personalQueue.qr_code_url, '_blank');
    } finally {
      setIsDownloading(false);
    }
  };


  const getStatusBadge = (status) => {
    const s = (status || '').toUpperCase();
    switch (s) {
      case 'IN_CONSULTATION':
        return (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
            padding: '0.3rem 0.75rem', borderRadius: '9999px',
            backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe',
            fontWeight: 600, fontSize: '0.78rem'
          }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#2563eb', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
            Sedang Diperiksa
          </span>
        );
      case 'CHECKED_IN':
        return (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
            padding: '0.3rem 0.75rem', borderRadius: '9999px',
            backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0',
            fontWeight: 600, fontSize: '0.78rem'
          }}>
            <UserCheck size={13} />
            Hadir / Check-in
          </span>
        );
      case 'COMPLETED':
      case 'SELESAI':
        return (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
            padding: '0.3rem 0.75rem', borderRadius: '9999px',
            backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1',
            fontWeight: 600, fontSize: '0.78rem'
          }}>
            <CheckCircle2 size={13} />
            Selesai
          </span>
        );
      default:
        return (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
            padding: '0.3rem 0.75rem', borderRadius: '9999px',
            backgroundColor: '#fffbeb', color: '#b45309', border: '1px solid #fde68a',
            fontWeight: 600, fontSize: '0.78rem'
          }}>
            <Clock size={13} />
            Menunggu
          </span>
        );
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg-main, #f8fafc)',
      color: 'var(--text-main, #0f172a)',
      padding: '1.5rem',
      fontFamily: "'DM Sans', 'Plus Jakarta Sans', system-ui, sans-serif"
    }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* Top Navigation */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem'
        }}>
          <button
            onClick={() => navigate('/options')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 0.85rem',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              color: '#64748b',
              fontWeight: 500,
              fontSize: '0.875rem',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            <ArrowLeft size={16} /> Kembali ke Menu
          </button>
        </div>

        {/* Minimal Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
            Antrean Rawat Jalan
          </h1>
        </div>

        {/* No. RM Search Box (Simple & Clean) */}
        {!personalQueue && (
          <div style={{
            maxWidth: '580px',
            margin: '0 auto 2.5rem',
            background: '#ffffff',
            borderRadius: '12px',
            padding: '1.75rem',
            boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04), 0 0 0 1px rgba(15, 23, 42, 0.02)',
            border: '1px solid #e2e8f0'
          }}>
            <form onSubmit={handleSearchRm}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '0.65rem 0.85rem',
                background: '#ffffff',
                marginBottom: '1rem'
              }}>
                <Search size={20} color="#64748b" />
                <input
                  ref={rmInputRef}
                  type="text"
                  placeholder="Masukkan Nomor Rekam Medis - No. RM..."
                  value={rmQuery}
                  onChange={(e) => setRmQuery(e.target.value)}
                  style={{
                    border: 'none',
                    outline: 'none',
                    width: '100%',
                    fontSize: '1rem',
                    color: '#0f172a',
                    fontWeight: 500
                  }}
                />
                {rmQuery && (
                  <button
                    type="button"
                    onClick={() => setRmQuery('')}
                    style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={isSearchingRm}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  backgroundColor: '#059669',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  cursor: isSearchingRm ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                {isSearchingRm ? (
                  <>
                    <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    Mencari Antrean...
                  </>
                ) : (
                  <>
                    <Search size={16} /> Cari Antrean Pasien
                  </>
                )}
              </button>
            </form>

            {rmError && (
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '10px',
                padding: '0.75rem 1rem',
                marginTop: '1rem',
                fontSize: '0.85rem',
                color: '#991b1b',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <AlertCircle size={16} /> {rmError}
              </div>
            )}

            <div style={{ textAlign: 'center', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
              <button
                type="button"
                onClick={() => navigate('/app/antrean/rawat-jalan/semua')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#059669',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                Lihat Seluruh Papan Antrean Poliklinik →
              </button>
            </div>
          </div>
        )}

        {/* Personal Queue Result Card & QR Pass */}
        {personalQueue && (
          <div style={{
            maxWidth: '580px',
            margin: '0 auto 2.5rem',
            background: '#ffffff',
            borderRadius: '12px',
            padding: '1.75rem',
            boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04), 0 0 0 1px rgba(15, 23, 42, 0.02)',
            border: '1px solid rgba(5, 150, 105, 0.35)'
          }}>
            {/* Header: Queue Number + Status */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px dashed #e2e8f0', paddingBottom: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                  Nomor Antrean Anda
                </div>
                <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#059669', lineHeight: 1.1 }}>
                  {personalQueue.appointment?.queue_number || 'A-01'}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                {getStatusBadge(personalQueue.appointment?.status)}
                {personalQueue.queue_ahead > 0 && (
                  <div style={{ fontSize: '0.78rem', color: '#b45309', marginTop: '0.35rem', fontWeight: 500 }}>
                    {personalQueue.queue_ahead} pasien di depan Anda
                  </div>
                )}
              </div>
            </div>

            {/* Patient & Clinic Details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              <div>
                <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>Nama Pasien:</span>
                <strong style={{ color: '#0f172a', fontSize: '0.95rem' }}>{personalQueue.patient?.name}</strong>
                <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>No. RM: {personalQueue.patient?.medical_record_no}</span>
              </div>

              <div>
                <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>Poliklinik:</span>
                <strong style={{ color: '#059669', fontSize: '0.95rem' }}>{personalQueue.appointment?.poli_name}</strong>
                <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>DPJP: {personalQueue.appointment?.doctor_name}</span>
              </div>

              <div>
                <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>Waktu Pelayanan:</span>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: '#0f172a', fontWeight: 600 }}>
                  <Clock size={13} color="#64748b" /> {personalQueue.appointment?.appointment_time} WITA
                </div>
              </div>

              <div>
                <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>Penjamin:</span>
                <span style={{
                  display: 'inline-block',
                  padding: '0.15rem 0.55rem',
                  borderRadius: '4px',
                  background: '#ecfdf5',
                  color: '#047857',
                  fontSize: '0.75rem',
                  fontWeight: 600
                }}>
                  {personalQueue.appointment?.service_type || 'Umum'}
                </span>
              </div>
            </div>

            {/* QR Code Pass Box */}
            <div style={{
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: '14px',
              padding: '1.25rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              marginBottom: '1.25rem'
            }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#047857', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <QrCode size={14} /> Kode QR Kiosk / Check-in Mandiri
              </div>

              <div style={{
                background: '#ffffff',
                padding: '0.65rem',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                marginBottom: '0.65rem'
              }}>
                <img
                  src={personalQueue.qr_code_url}
                  alt={`QR Antrean ${personalQueue.appointment?.queue_number}`}
                  style={{ width: '160px', height: '160px', display: 'block', objectFit: 'contain' }}
                />
              </div>

              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '0.25rem 0.65rem',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: '#0f172a',
                marginBottom: '0.85rem'
              }}>
                <span>Pass: {personalQueue.short_code}</span>
                <button
                  type="button"
                  onClick={() => handleCopyShortCode(personalQueue.short_code)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.1rem', color: '#059669' }}
                  title="Salin Kode Pass"
                >
                  {copiedCode ? <Check size={13} color="#059669" /> : <Copy size={13} />}
                </button>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', width: '100%', maxWidth: '340px' }}>
                <button
                  type="button"
                  onClick={handleDownloadQr}
                  disabled={isDownloading}
                  style={{
                    flex: 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem',
                    padding: '0.55rem 0.75rem',
                    backgroundColor: '#059669',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.825rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <Download size={14} /> {isDownloading ? 'Mengunduh...' : 'Download QR'}
                </button>

                <button
                  type="button"
                  onClick={() => navigate(`/patient/portal/${personalQueue.portal_token}`)}
                  style={{
                    flex: 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem',
                    padding: '0.55rem 0.75rem',
                    backgroundColor: '#ffffff',
                    color: '#059669',
                    border: '1px solid #059669',
                    borderRadius: '8px',
                    fontSize: '0.825rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <ExternalLink size={14} /> Buka E-Ticket
                </button>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.65rem' }}>
              <button
                type="button"
                onClick={() => {
                  setPersonalQueue(null);
                  setRmQuery('');
                  setTimeout(() => {
                    if (rmInputRef.current) rmInputRef.current.focus();
                  }, 100);
                }}
                style={{
                  flex: 1,
                  padding: '0.65rem',
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Cari No. RM Lain
              </button>

              <button
                type="button"
                onClick={() => navigate('/app/antrean/rawat-jalan/semua')}
                style={{
                  flex: 1,
                  padding: '0.65rem',
                  backgroundColor: '#059669',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Lihat Semua Antrean →
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default RawatJalan;
