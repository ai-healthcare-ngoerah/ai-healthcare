import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, Clock, User, Phone, CheckCircle, ArrowLeft, AlertCircle, QrCode, Stethoscope, Share2, HelpCircle, Globe, Download, Printer } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNotification } from '../context/NotificationContext';
import DynamicQRCodeCard from '../components/portal/DynamicQRCodeCard';

const PatientPortal = () => {
  const { t, i18n } = useTranslation();
  const { portalToken } = useParams();
  const { showToast } = useNotification();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  useEffect(() => {
    fetchPortalData();
  }, [portalToken]);

  const fetchPortalData = async () => {
    setLoading(true);
    setError('');
    try {
      const apiUrl = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8001') + `/api/booking/portal/${portalToken}`;
      const response = await fetch(apiUrl);
      if (response.ok) {
        const data = await response.json();
        setAppointment(data);
      } else {
        throw new Error(t('reservation.portal.errorNotFound'));
      }
    } catch (err) {
      setError(err.message || t('reservation.portal.errorNotFound'));
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateCheckin = async () => {
    setIsCheckingIn(true);
    try {
      const apiUrl = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8001') + '/api/booking/checkin';
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portal_token: portalToken })
      });

      if (response.ok) {
        const resData = await response.json();
        showToast({
          type: 'success',
          title: t('reservation.portal.checkinSuccess'),
          message: resData.message || t('reservation.portal.checkinSuccess')
        });
        setAppointment((prev) => ({ ...prev, checkin_status: 'CHECKED_IN', status: 'CHECKED_IN' }));
      } else {
        throw new Error(t('reservation.portal.checkinProcessing'));
      }
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Check-in Error',
        message: err.message
      });
    } finally {
      setIsCheckingIn(false);
    }
  };

  const copyPortalLink = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast({
      type: 'success',
      title: t('reservation.portal.copyLinkBtn'),
      message: t('reservation.portal.linkCopied')
    });
  };

  const handleDownloadQr = () => {
    const qrSrc =
      appointment?.qr_code_url ||
      `${import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8001'}/api/booking/portal/${portalToken}/qr`;
    const link = document.createElement('a');
    link.href = qrSrc;
    link.target = '_blank';
    link.download = `QR-Reservasi-${appointment?.queue_number || portalToken}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast({
      type: 'success',
      title: t('reservation.portal.downloadQrBtn'),
      message: 'Kode QR berhasil disiapkan untuk diunduh.'
    });
  };

  const handlePrintTicket = () => {
    window.print();
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <div className="animate-spin" style={{ width: '40px', height: '40px', border: '3px solid var(--border-color)', borderTopColor: 'var(--primary-color)', borderRadius: '50%', margin: '0 auto 1rem' }} />
          <p>{t('reservation.portal.loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9', padding: '1rem' }}>
        <div className="card" style={{ maxWidth: '480px', width: '100%', padding: '2.5rem 2rem', textAlign: 'center' }}>
          <AlertCircle size={48} color="#dc2626" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
            {t('reservation.portal.errorNotFound')}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>{error}</p>
          <Link to="/" className="btn-primary" style={{ justifyContent: 'center', width: '100%' }}>
            {t('reservation.portal.backHome')}
          </Link>
        </div>
      </div>
    );
  }

  const isCheckedIn = appointment.checkin_status === 'CHECKED_IN';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {/* Header Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <Link to="/options" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.875rem' }}>
            <ArrowLeft size={18} /> {t('reservation.portal.backHome')}
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={() => i18n.changeLanguage(i18n.language === 'en' ? 'id' : 'en')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.4rem 0.75rem',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                backgroundColor: '#ffffff',
                color: '#334155',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
              title={i18n.language === 'en' ? 'Ubah ke Bahasa Indonesia' : 'Switch to English'}
            >
              <Globe size={14} color="var(--primary-color)" />
              <span>{i18n.language === 'en' ? 'EN' : 'ID'}</span>
            </button>

            <button
              onClick={copyPortalLink}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#ffffff', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.4rem 0.75rem', fontSize: '0.8rem', color: 'var(--text-main)', cursor: 'pointer' }}
            >
              <Share2 size={14} /> {t('reservation.portal.copyLinkBtn')}
            </button>
          </div>
        </div>

        {/* Main Ticket Card */}
        <div className="card animate-fade-in" style={{ padding: '0', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)' }}>
          {/* Top Banner Status */}
          {(() => {
            const s = (appointment.status || (isCheckedIn ? 'CHECKED_IN' : 'SCHEDULED')).toUpperCase();
            const isApproved = s === 'APPROVED' || s === 'SCHEDULED';
            const isPending = s === 'PENDING';
            const isCancelled = s === 'CANCELLED';
            const bg = isCheckedIn ? '#ecfdf5' : isPending ? '#fef3c7' : isCancelled ? '#fee2e2' : '#f0f9ff';
            const border = isCheckedIn ? '#a7f3d0' : isPending ? '#fcd34d' : isCancelled ? '#fecaca' : '#bae6fd';
            const textColor = isCheckedIn ? '#047857' : isPending ? '#92400e' : isCancelled ? '#991b1b' : '#0284c7';
            const badgeBg = isCheckedIn ? '#10b981' : isPending ? '#f59e0b' : isCancelled ? '#ef4444' : '#0284c7';
            const label = isCheckedIn 
              ? t('reservation.portal.statusCheckedIn') 
              : isPending 
              ? (i18n.language === 'en' ? 'Awaiting Clinic Approval' : 'Menunggu Persetujuan Klinik')
              : isCancelled
              ? (i18n.language === 'en' ? 'Cancelled' : 'Dibatalkan')
              : (i18n.language === 'en' ? 'Approved & Scheduled' : 'Disetujui & Terjadwal');

            return (
              <div
                style={{
                  padding: '1.25rem',
                  backgroundColor: bg,
                  borderBottom: `1px solid ${border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: textColor, letterSpacing: '0.05em' }}>
                    Status
                  </span>
                  <h3 style={{ margin: '0.2rem 0 0', fontSize: '1.1rem', fontWeight: 700, color: textColor }}>
                    {label}
                  </h3>
                </div>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: badgeBg,
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <CheckCircle size={22} />
                </div>
              </div>
            );
          })()}

          {/* Ticket Body */}
          <div style={{ padding: '2rem' }}>
            {/* Dynamic QR Pass Card Modular Component */}
            <div style={{ marginBottom: '2rem' }}>
              <DynamicQRCodeCard
                portalToken={portalToken}
                queueNumber={appointment.queue_number || 'A-01'}
                patientName={appointment.name}
                doctorName={appointment.doctor_name}
                poliName={appointment.poli_name}
                appointmentDate={appointment.appointment_date}
                appointmentTime={appointment.appointment_time || '09:00'}
                qrCodeUrl={appointment.qr_code_url}
                qrPayload={appointment.qr_payload}
                shortCode={appointment.short_code}
                isCheckedIn={isCheckedIn}
                variant="full"
                showActions={true}
              />
            </div>

            {/* Appointment Details Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                  {t('reservation.form.patient')}
                </span>
                <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <User size={14} color="var(--primary-color)" /> {appointment.name}
                </strong>
              </div>

              <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                  {t('reservation.form.doctor')}
                </span>
                <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Stethoscope size={14} color="var(--primary-color)" /> {appointment.doctor_name}
                </strong>
              </div>

              <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                  {t('reservation.form.date')}
                </span>
                <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Calendar size={14} color="var(--primary-color)" /> {appointment.appointment_date}
                </strong>
              </div>

              <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                  {t('reservation.portal.timeLabel')}
                </span>
                <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Clock size={14} color="var(--primary-color)" /> {appointment.appointment_time}
                </strong>
              </div>
            </div>

            {/* Kiosk Checkin Simulation Button (For Patient Testing) */}
            {!isCheckedIn && (
              <button
                onClick={handleSimulateCheckin}
                disabled={isCheckingIn}
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '0.85rem', fontSize: '0.95rem', marginBottom: '1rem' }}
              >
                {isCheckingIn ? t('reservation.portal.checkinProcessing') : <><QrCode size={18} className="mr-2" /> {t('reservation.portal.simulateCheckinBtn')}</>}
              </button>
            )}

            {/* WhatsApp Help Button */}
            <a
              href="https://wa.me/6285117331646?text=Halo%20RS%20saya%20ingin%20menanyakan%20jadwal%20janji%20temu%20saya"
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: 'var(--text-main)',
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: 500
              }}
            >
              <Phone size={16} color="#16a34a" /> {t('reservation.portal.helpWhatsApp')}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientPortal;
