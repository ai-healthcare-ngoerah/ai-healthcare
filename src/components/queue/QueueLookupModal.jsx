import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, X, Users, BedDouble, Calendar, Clock, Stethoscope, 
  CheckCircle2, AlertCircle, ArrowRight, Download, QrCode, 
  ExternalLink, RefreshCw, Copy, Check, Sparkles 
} from 'lucide-react';
import { lookupQueueByRM } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';

const QueueLookupModal = ({
  isOpen,
  onClose,
  queueType = 'rawat-jalan', // 'rawat-jalan' | 'rawat-inap'
  onViewAll
}) => {
  const navigate = useNavigate();
  const { showToast } = useNotification();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [lookupResult, setLookupResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const inputRef = useRef(null);

  const isInpatient = queueType === 'rawat-inap';
  const themeColor = isInpatient ? '#7c3aed' : '#059669';
  const themeBgSubtle = isInpatient ? '#f5f3ff' : '#ecfdf5';
  const themeBorder = isInpatient ? '#ddd6fe' : '#a7f3d0';

  const modalTitle = isInpatient ? 'Cek Antrean Rawat Inap' : 'Cek Antrean Rawat Jalan';
  const modalSubtitle = isInpatient 
    ? 'Masukkan Nomor Rekam Medis (No. RM) untuk melihat status admisi bangsal dan QR Pass pasien.'
    : 'Masukkan Nomor Rekam Medis (No. RM) untuk melihat nomor antrean poliklinik dan QR Pass Kiosk.';

  const quickSamples = isInpatient 
    ? [
        { label: 'Ni Made Sukartini', rm: 'RM-RI002' },
        { label: 'Kadek Bayu Pratama', rm: 'RM-RI003' },
        { label: 'Bed RI-01', rm: 'RI-01' }
      ]
    : [
        { label: 'RM-0E0649 (Poli Gigi)', rm: 'RM-0E0649' },
        { label: 'Antrean A-01', rm: 'A-01' },
        { label: 'Antrean A-02', rm: 'A-02' }
      ];

  // Auto focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setLookupResult(null);
      setErrorMsg('');
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 150);
    }
  }, [isOpen, queueType]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSearch = async (queryVal = searchQuery) => {
    const targetQ = queryVal.trim();
    if (!targetQ) {
      setErrorMsg('Silakan masukkan Nomor Rekam Medis (No. RM).');
      return;
    }

    setIsSearching(true);
    setErrorMsg('');
    setLookupResult(null);

    try {
      const res = await lookupQueueByRM(targetQ, queueType);
      if (res && res.found) {
        setLookupResult(res);
      } else {
        setErrorMsg(res?.message || 'Nomor Rekam Medis tidak ditemukan dalam jadwal antrean aktif.');
      }
    } catch (err) {
      console.error('Error looking up queue:', err);
      setErrorMsg(err.message || 'Gagal mencari nomor antrean. Silakan coba lagi.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleCopyShortCode = (code) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    showToast?.({
      type: 'success',
      title: 'Kode Disalin',
      message: `Kode pass ${code} berhasil disalin ke clipboard.`
    });
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDownloadQr = async () => {
    if (!lookupResult?.qr_code_url) return;
    setIsDownloading(true);
    try {
      const qrUrl = lookupResult.qr_code_url;
      const resp = await fetch(qrUrl);
      const blob = await resp.blob();
      const objectUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = objectUrl;
      const qNum = lookupResult.appointment?.queue_number || 'PASS';
      link.download = `QR-Antrean-${qNum}-${lookupResult.patient?.medical_record_no || 'RS'}.png`;
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
      // Fallback open in new tab
      window.open(lookupResult.qr_code_url, '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || '').toUpperCase();
    if (s === 'DIRAWAT' || s === 'ADMITTED') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.25rem 0.65rem', borderRadius: '9999px', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', fontSize: '0.75rem', fontWeight: 600 }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#059669', display: 'inline-block' }} /> Aktif Dirawat
        </span>
      );
    } else if (s === 'IN_CONSULTATION') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.25rem 0.65rem', borderRadius: '9999px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', fontSize: '0.75rem', fontWeight: 600 }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2563eb', display: 'inline-block', animation: 'pulse 1.5s infinite' }} /> Sedang Diperiksa
        </span>
      );
    } else if (s === 'CHECKED_IN') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.25rem 0.65rem', borderRadius: '9999px', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', fontSize: '0.75rem', fontWeight: 600 }}>
          <CheckCircle2 size={12} /> Hadir / Check-in
        </span>
      );
    } else if (s === 'MENUNGGU_BED') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.25rem 0.65rem', borderRadius: '9999px', background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', fontSize: '0.75rem', fontWeight: 600 }}>
          <Clock size={12} /> Menunggu Bed
        </span>
      );
    } else if (s === 'SIAP_PULANG') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.25rem 0.65rem', borderRadius: '9999px', background: '#f5f3ff', color: '#6d28d9', border: '1px solid #ddd6fe', fontSize: '0.75rem', fontWeight: 600 }}>
          <CheckCircle2 size={12} /> Rencana Pulang
        </span>
      );
    } else {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.25rem 0.65rem', borderRadius: '9999px', background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', fontSize: '0.75rem', fontWeight: 600 }}>
          <Clock size={12} /> Menunggu Giliran
        </span>
      );
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      zIndex: 9999,
      animation: 'fadeIn 0.2s ease-out'
    }}
    onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}
    >
      <div style={{
        background: '#ffffff',
        borderRadius: '20px',
        maxWidth: '560px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid #e2e8f0',
        padding: '1.75rem',
        position: 'relative',
        boxSizing: 'border-box'
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: '#f1f5f9',
            border: 'none',
            borderRadius: '50%',
            width: '34px',
            height: '34px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#64748b',
            cursor: 'pointer',
            transition: 'background 0.2s'
          }}
          onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#e2e8f0'; e.currentTarget.style.color = '#0f172a'; }}
          onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; e.currentTarget.style.color = '#64748b'; }}
        >
          <X size={18} />
        </button>

        {/* Header Icon & Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            backgroundColor: themeBgSubtle,
            border: `1px solid ${themeBorder}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            {isInpatient ? <BedDouble size={26} color={themeColor} /> : <Users size={26} color={themeColor} />}
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 700, color: '#0f172a' }}>
              {modalTitle}
            </h2>
            <p style={{ margin: 0, fontSize: '0.825rem', color: '#64748b', marginTop: '0.15rem' }}>
              {modalSubtitle}
            </p>
          </div>
        </div>

        {/* Phase 1: Search Form (Visible if no result yet, or collapsible) */}
        {!lookupResult ? (
          <div>
            {/* Search Input Box */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearch();
              }}
              style={{ marginBottom: '1rem' }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                border: '2px solid #cbd5e1',
                borderRadius: '12px',
                padding: '0.5rem 0.85rem',
                background: '#ffffff',
                transition: 'border-color 0.2s',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = themeColor}
              onBlur={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
              >
                <Search size={20} color="#64748b" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Masukkan No. RM (contoh: RM-2026-001)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    border: 'none',
                    outline: 'none',
                    width: '100%',
                    fontSize: '0.95rem',
                    color: '#0f172a',
                    fontWeight: 500
                  }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.2rem' }}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSearching}
                style={{
                  width: '100%',
                  marginTop: '0.85rem',
                  padding: '0.75rem 1rem',
                  backgroundColor: themeColor,
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 600,
                  fontSize: '0.925rem',
                  cursor: isSearching ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: `0 4px 12px ${themeColor}33`,
                  transition: 'opacity 0.2s'
                }}
              >
                {isSearching ? (
                  <>
                    <RefreshCw size={16} className="spin-icon" style={{ animation: 'spin 1s linear infinite' }} />
                    Mencari di Database...
                  </>
                ) : (
                  <>
                    <Search size={16} /> Cari Antrean Pasien
                  </>
                )}
              </button>
            </form>

            {/* Error / Not Found Message */}
            {errorMsg && (
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '10px',
                padding: '0.85rem 1rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.65rem',
                fontSize: '0.85rem',
                color: '#991b1b'
              }}>
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                <div>
                  <div style={{ fontWeight: 600 }}>Antrean Tidak Ditemukan</div>
                  <div>{errorMsg}</div>
                </div>
              </div>
            )}

            {/* Quick Demo Samples */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '0.85rem 1rem',
              marginBottom: '1.25rem'
            }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
                Contoh Cepat (Klik untuk Coba Langsung):
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                {quickSamples.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSearchQuery(sample.rm);
                      handleSearch(sample.rm);
                    }}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      padding: '0.35rem 0.65rem',
                      fontSize: '0.78rem',
                      color: '#334155',
                      fontWeight: 500,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.borderColor = themeColor; e.currentTarget.style.color = themeColor; }}
                    onMouseOut={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.color = '#334155'; }}
                  >
                    <span style={{ fontWeight: 700, color: themeColor }}>{sample.rm}</span>
                    <span style={{ color: '#94a3b8' }}>• {sample.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Bottom Links */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', textAlign: 'center', paddingTop: '0.5rem', borderTop: '1px solid #f1f5f9' }}>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onViewAll();
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: themeColor,
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem'
                }}
              >
                Lihat Seluruh Papan Antrean Rumah Sakit <ArrowRight size={14} />
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate('/reservasi');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                Belum punya reservasi / nomor RM? <strong style={{ color: '#0f172a' }}>Daftar Antrean Baru</strong>
              </button>
            </div>
          </div>
        ) : (
          /* Phase 2: Detail of Queue & QR Code Pass */
          <div style={{ animation: 'fadeIn 0.25s ease-out' }}>
            {/* Ticket Card */}
            <div style={{
              background: '#ffffff',
              border: `2px solid ${themeBorder}`,
              borderRadius: '16px',
              padding: '1.25rem',
              boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
              marginBottom: '1rem'
            }}>
              {/* Header: Queue Number + Status */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', borderBottom: '1px dashed #e2e8f0', paddingBottom: '0.85rem' }}>
                <div>
                  <div style={{ fontSize: '0.725rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                    Nomor Antrean Pasien
                  </div>
                  <div style={{
                    fontSize: '2rem',
                    fontWeight: 800,
                    color: themeColor,
                    lineHeight: 1.1
                  }}>
                    {lookupResult.appointment?.queue_number || 'A-01'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {getStatusBadge(lookupResult.appointment?.status)}
                  {lookupResult.queue_ahead > 0 && (
                    <div style={{ fontSize: '0.75rem', color: '#b45309', marginTop: '0.35rem', fontWeight: 500 }}>
                      {lookupResult.queue_ahead} pasien di depan Anda
                    </div>
                  )}
                </div>
              </div>

              {/* Patient & Clinic Details Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.825rem', marginBottom: '1rem' }}>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.725rem' }}>Nama Pasien:</span>
                  <strong style={{ color: '#0f172a', fontSize: '0.9rem' }}>{lookupResult.patient?.name}</strong>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>No. RM: {lookupResult.patient?.medical_record_no}</span>
                </div>

                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.725rem' }}>Poliklinik / Ruang:</span>
                  <strong style={{ color: themeColor, fontSize: '0.9rem' }}>{lookupResult.appointment?.poli_name}</strong>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>DPJP: {lookupResult.appointment?.doctor_name}</span>
                </div>

                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.725rem' }}>Jadwal / Waktu:</span>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#0f172a', fontWeight: 600 }}>
                    <Clock size={12} color="#64748b" /> {lookupResult.appointment?.appointment_time} WITA
                  </div>
                </div>

                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.725rem' }}>Penjamin:</span>
                  <span style={{
                    display: 'inline-block',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '4px',
                    background: '#f1f5f9',
                    color: '#334155',
                    fontSize: '0.75rem',
                    fontWeight: 600
                  }}>
                    {lookupResult.appointment?.service_type || 'Umum'}
                  </span>
                </div>
              </div>

              {/* SPRI / Notes if available */}
              {lookupResult.appointment?.notes && (
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.78rem',
                  color: '#475569',
                  marginBottom: '1rem'
                }}>
                  <strong>Catatan:</strong> {lookupResult.appointment.notes}
                </div>
              )}

              {/* QR Code Pass Box */}
              <div style={{
                background: themeBgSubtle,
                border: `1px solid ${themeBorder}`,
                borderRadius: '12px',
                padding: '1rem',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: themeColor, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <QrCode size={14} /> Kode QR Kiosk / Check-in Mandiri
                </div>

                {/* QR Image Container */}
                <div style={{
                  background: '#ffffff',
                  padding: '0.5rem',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                  marginBottom: '0.65rem'
                }}>
                  <img
                    src={lookupResult.qr_code_url}
                    alt={`QR Code Antrean ${lookupResult.appointment?.queue_number}`}
                    style={{ width: '150px', height: '150px', display: 'block', objectFit: 'contain' }}
                  />
                </div>

                {/* Pass Code & Copy */}
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
                  marginBottom: '0.75rem'
                }}>
                  <span>Pass: {lookupResult.short_code}</span>
                  <button
                    type="button"
                    onClick={() => handleCopyShortCode(lookupResult.short_code)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.1rem', color: themeColor }}
                    title="Salin Kode Pass"
                  >
                    {copiedCode ? <Check size={13} color="#059669" /> : <Copy size={13} />}
                  </button>
                </div>

                {/* QR Action Buttons */}
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
                      padding: '0.5rem 0.75rem',
                      backgroundColor: themeColor,
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  >
                    <Download size={13} /> {isDownloading ? 'Mengunduh...' : 'Download QR'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      navigate(`/patient/portal/${lookupResult.portal_token}`);
                    }}
                    style={{
                      flex: 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.35rem',
                      padding: '0.5rem 0.75rem',
                      backgroundColor: '#ffffff',
                      color: themeColor,
                      border: `1px solid ${themeColor}`,
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <ExternalLink size={13} /> Buka E-Ticket
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div style={{ display: 'flex', gap: '0.65rem' }}>
              <button
                type="button"
                onClick={() => {
                  setLookupResult(null);
                  setSearchQuery('');
                  setTimeout(() => {
                    if (inputRef.current) inputRef.current.focus();
                  }, 100);
                }}
                style={{
                  flex: 1,
                  padding: '0.65rem 0.85rem',
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  fontWeight: 600,
                  fontSize: '0.825rem',
                  cursor: 'pointer'
                }}
              >
                Cari Pasien Lain
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onViewAll();
                }}
                style={{
                  flex: 1,
                  padding: '0.65rem 0.85rem',
                  backgroundColor: themeColor,
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 600,
                  fontSize: '0.825rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem'
                }}
              >
                Buka Seluruh Antrean <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QueueLookupModal;
