import React, { useState, useEffect } from 'react';
import {
  Calendar,
  User,
  Phone,
  CheckCircle,
  ArrowLeft,
  Stethoscope,
  AlertCircle,
  QrCode,
  ExternalLink,
  RefreshCw,
  Globe,
  Building2,
  ShieldCheck,
  Search,
  Bookmark
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import FloatingChatbotFAB from '../components/chatbot/FloatingChatbotFAB';
import DynamicQRCodeCard from '../components/portal/DynamicQRCodeCard';

const ALL_DOCTORS = [
  { name: "dr. Andi (Umum)", poli: "Poli Umum", hari: "Senin - Sabtu", jam: "08:00 - 14:00" },
  { name: "dr. Budi (Gigi)", poli: "Poli Gigi & Mulut", hari: "Senin - Jumat", jam: "09:00 - 15:00" },
  { name: "dr. Clara (Anak)", poli: "Poli Anak (Pediatri)", hari: "Senin - Kamis", jam: "10:00 - 16:00" },
  { name: "dr. Raditya Pratama, Sp.A", poli: "Poli Anak (Pediatri)", hari: "Jumat - Sabtu", jam: "13:00 - 18:00" },
  { name: "dr. Cynthia Dewi, MARS", poli: "Poli Kebidanan & Kandungan", hari: "Selasa & Kamis", jam: "14:00 - 19:00" },
  { name: "dr. Hendra Sp.PD", poli: "Poli Penyakit Dalam", hari: "Senin - Jumat", jam: "08:30 - 13:30" },
  { name: "dr. Maya Sp.S", poli: "Poli Saraf", hari: "Senin & Rabu", jam: "09:00 - 13:00" },
];

const ReservationForm = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { showToast } = useNotification();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);

  // Form filter & reservation fields
  const [selectedPoli, setSelectedPoli] = useState('Poli Umum');
  const [selectedPelayanan, setSelectedPelayanan] = useState('BPJS Kesehatan');
  const [isSearchingSchedule, setIsSearchingSchedule] = useState(false);
  const [searchScheduleDone, setSearchScheduleDone] = useState(false);
  
  const todayISO = new Date().toISOString().split('T')[0];
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });

  const [formData, setFormData] = useState({
    nama: '',
    noWa: '',
    tanggal: todayISO,
    dokter: ''
  });

  // Auto-fill patient name and contact info if logged in
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        nama: prev.nama || user.name || '',
        noWa: prev.noWa || user.phone || ''
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const filteredDoctors = ALL_DOCTORS.filter((doc) => {
    return doc.poli.toLowerCase().includes(selectedPoli.toLowerCase()) || doc.name === "dr. Andi (Umum)";
  });

  const handleSearchSchedule = () => {
    setIsSearchingSchedule(true);
    setTimeout(() => {
      setIsSearchingSchedule(false);
      setSearchScheduleDone(true);
    }, 400);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        name: formData.nama,
        phone: formData.noWa,
        appointment_date: formData.tanggal,
        doctor_name: formData.dokter,
        poli_name: selectedPoli,
        notes: `Reservasi Mandiri Pasien via Web (${selectedPelayanan})`
      };

      const apiUrl = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8001') + '/api/booking';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const resData = await response.json();
        setSuccessData(resData);
        showToast({
          type: 'success',
          title: t('reservation.form.successTitle'),
          message: t('reservation.form.successMessage')
        });
        setFormData({ nama: '', noWa: '', tanggal: todayISO, dokter: '' });
      } else {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.detail || t('reservation.form.errorDefault'));
      }
    } catch (err) {
      setError(err.message || t('reservation.form.errorDefault'));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSuccessData(null);
    setSearchScheduleDone(false);
    setFormData({ nama: '', noWa: '', tanggal: todayISO, dokter: '' });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9', padding: '1.5rem 1rem', position: 'relative' }}>
      {/* Top Bar Navigation */}
      <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', zIndex: 10, display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
        {['admin', 'superadmin', 'staff'].includes(user?.role) && (
          <Link
            to="/app/ai-agent/reservasi"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.45rem 0.85rem',
              fontSize: '0.85rem',
              fontWeight: 500,
              backgroundColor: '#ffffff',
              color: '#334155',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              textDecoration: 'none',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              transition: 'background-color 0.2s ease, border-color 0.2s ease'
            }}
          >
            <span>{t('reservation.form.viewDashboard')}</span>
          </Link>
        )}

        {/* Language Switcher */}
        <button
          type="button"
          onClick={() => i18n.changeLanguage(i18n.language === 'en' ? 'id' : 'en')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.45rem 0.85rem',
            fontSize: '0.85rem',
            fontWeight: 600,
            backgroundColor: '#ffffff',
            color: '#334155',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            transition: 'background-color 0.2s ease, border-color 0.2s ease'
          }}
          title={i18n.language === 'en' ? "Beralih ke Bahasa Indonesia" : "Switch to English"}
        >
          <Globe size={15} color="#059669" />
          <span>{i18n.language === 'en' ? 'EN' : 'ID'}</span>
        </button>
      </div>

      <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '650px', padding: '2.5rem 2rem', position: 'relative' }}>
        {/* Back Button */}
        <button
          type="button"
          onClick={() => navigate('/options')}
          style={{
            position: 'absolute',
            top: '1.25rem',
            left: '1.25rem',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            border: 'none',
            background: 'transparent',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            transition: 'background-color 0.2s ease, color 0.2s ease',
            zIndex: 20
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#f1f5f9';
            e.currentTarget.style.color = 'var(--text-main)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--text-muted)';
          }}
          title={t('reservation.portal.backHome')}
          aria-label={t('reservation.portal.backHome')}
        >
          <ArrowLeft size={24} />
        </button>

        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem', marginTop: '0.5rem' }}>
          <img
            src="/logos/usada-ai-icon.webp"
            alt="USADA AI Logo"
            style={{ height: '64px', margin: '0 auto 0.75rem', display: 'block', objectFit: 'contain' }}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
            {successData ? t('reservation.portal.title') : t('reservation.form.title')}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            {successData
              ? t('reservation.portal.subtitle')
              : t('reservation.form.subtitle')}
          </p>
        </div>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {successData ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '1.25rem', textAlign: 'center' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', background: '#dcfce7', borderRadius: '50%', color: '#16a34a', marginBottom: '0.5rem' }}>
                <CheckCircle size={28} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#166534', margin: '0 0 0.25rem' }}>
                {t('reservation.form.successTitle')}
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#15803d', margin: '0 0 1rem' }}>
                {t('reservation.form.ticketNumber')}: <strong style={{ color: '#047857' }}>{successData.queue_number || 'A-01'}</strong>
              </p>

              {/* Dynamic QR Pass Card Modular Component */}
              <DynamicQRCodeCard
                portalToken={successData.portal_token}
                queueNumber={successData.queue_number || 'A-01'}
                patientName={successData.name}
                doctorName={successData.doctor_name}
                poliName={successData.poli_name}
                appointmentDate={successData.appointment_date}
                appointmentTime={successData.appointment_time || '09:00'}
                qrCodeUrl={successData.qr_code_url}
                qrPayload={successData.qr_payload}
                shortCode={successData.short_code}
                variant="compact"
                showActions={true}
              />

              <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'left', fontSize: '0.85rem' }}>
                <div><strong>{t('reservation.form.patient')}:</strong> {successData.name}</div>
                <div><strong>{t('reservation.form.doctor')}:</strong> {successData.doctor_name}</div>
                <div><strong>{t('reservation.form.date')}:</strong> {successData.appointment_date} ({successData.appointment_time || '09:00'})</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {successData.portal_token && (
                <Link
                  to={`/patient/portal/${successData.portal_token}`}
                  className="btn-primary"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.875rem', textDecoration: 'none', fontSize: '1rem', fontWeight: 600, background: '#059669', color: '#ffffff', borderRadius: '8px' }}
                >
                  <QrCode size={20} />
                  {t('reservation.form.openPortalBtn')}
                  <ExternalLink size={16} />
                </Link>
              )}

              <button
                type="button"
                onClick={handleReset}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: 500, color: '#475569' }}
              >
                <RefreshCw size={16} />
                {t('reservation.form.bookAnotherBtn')}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Field 1: Poliklinik */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: 'var(--text-main)' }}>
                {t('reservation.form.clinicLabel')}
              </label>
              <div style={{ position: 'relative' }}>
                <Building2 size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                <select
                  name="poli"
                  value={selectedPoli}
                  onChange={(e) => {
                    setSelectedPoli(e.target.value);
                    setFormData((prev) => ({ ...prev, dokter: '' }));
                  }}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem 0.75rem 2.75rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    outline: 'none',
                    backgroundColor: '#ffffff',
                    color: 'var(--text-main)',
                    fontSize: '0.875rem'
                  }}
                >
                  <option value="Poli Umum">Poli Umum</option>
                  <option value="Poli Gigi & Mulut">Poli Gigi & Mulut</option>
                  <option value="Poli Anak (Pediatri)">Poli Anak (Pediatri)</option>
                  <option value="Poli Penyakit Dalam">Poli Penyakit Dalam</option>
                  <option value="Poli Kebidanan & Kandungan">Poli Kebidanan & Kandungan</option>
                  <option value="Poli Saraf">Poli Saraf</option>
                </select>
              </div>
            </div>

            {/* Field 2: Dokter DPJP */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: 'var(--text-main)' }}>
                {t('reservation.form.doctorLabel')}
              </label>
              <div style={{ position: 'relative' }}>
                <Stethoscope size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                <select
                  name="dokter"
                  value={formData.dokter}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem 0.75rem 2.75rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    outline: 'none',
                    backgroundColor: '#ffffff',
                    color: 'var(--text-main)',
                    fontSize: '0.875rem'
                  }}
                >
                  <option value="" disabled>{t('reservation.form.doctorSelectPlaceholder') || 'Ketik untuk memilih dokter DPJP...'}</option>
                  {filteredDoctors.map((doc, idx) => (
                    <option key={idx} value={doc.name}>{doc.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Field 3: Pelayanan */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: 'var(--text-main)' }}>
                {t('reservation.form.serviceLabel')}
              </label>
              <div style={{ position: 'relative' }}>
                <ShieldCheck size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                <select
                  name="pelayanan"
                  value={selectedPelayanan}
                  onChange={(e) => setSelectedPelayanan(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem 0.75rem 2.75rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    outline: 'none',
                    backgroundColor: '#ffffff',
                    color: 'var(--text-main)',
                    fontSize: '0.875rem'
                  }}
                >
                  <option value="BPJS Kesehatan">BPJS Kesehatan</option>
                  <option value="Umum / Mandiri">Umum / Mandiri</option>
                  <option value="Asuransi Swasta">Asuransi Swasta</option>
                </select>
              </div>
            </div>

            {/* Field 4: Tanggal Rencana Periksa (Grid 2 Kolom s/d) */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: 'var(--text-main)' }}>
                {t('reservation.form.dateLabel')}
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '0.75rem', alignItems: 'center' }}>
                <div style={{ position: 'relative' }}>
                  <Calendar size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="date"
                    name="tanggal"
                    value={formData.tanggal}
                    onChange={handleChange}
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem 0.75rem 2.75rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      outline: 'none',
                      fontSize: '0.875rem',
                      backgroundColor: '#ffffff',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                  {t('reservation.form.dateTo') || 's/d'}
                </span>

                <div style={{ position: 'relative' }}>
                  <Calendar size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="date"
                    name="tanggalSelesai"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem 0.75rem 2.75rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      outline: 'none',
                      fontSize: '0.875rem',
                      backgroundColor: '#ffffff',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Tombol Outline: Cari Jadwal Dokter */}
            <button
              type="button"
              onClick={handleSearchSchedule}
              disabled={isSearchingSchedule}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                backgroundColor: '#f8fafc',
                color: 'var(--text-main)',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: isSearchingSchedule ? 'not-allowed' : 'pointer',
                marginBottom: '1.25rem',
                transition: 'background-color 0.2s ease, border-color 0.2s ease'
              }}
              onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; }}
              onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; }}
            >
              {isSearchingSchedule ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>{t('reservation.form.waitingText') || 'Mohon tunggu ...'}</span>
                </>
              ) : (
                <>
                  <Search size={16} color="var(--text-muted)" />
                  <span>{t('reservation.form.searchScheduleBtn') || 'Cari Jadwal Dokter'}</span>
                </>
              )}
            </button>

            {/* Banner Pratinjau Jadwal Praktik Dokter */}
            {searchScheduleDone && (
              <div style={{
                border: '1px solid #bfdbfe',
                backgroundColor: '#eff6ff',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                marginBottom: '1.5rem',
                fontSize: '0.85rem'
              }}>
                <div style={{ fontWeight: 600, color: '#1e3a8a', marginBottom: '0.5rem' }}>
                  📋 Jadwal Praktik Dokter ({selectedPoli}):
                </div>
                <div style={{ color: '#1e40af', lineHeight: 1.5 }}>
                  {filteredDoctors.map((d, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', borderBottom: i < filteredDoctors.length - 1 ? '1px dashed #bfdbfe' : 'none' }}>
                      <span><strong>{d.name}</strong> ({d.poli})</span>
                      <span style={{ color: '#047857', fontWeight: 600 }}>{d.jam} (Kuota Tersedia)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pemisah Bagian: Data Identitas Pasien */}
            <div style={{ borderTop: '1px dashed var(--border-color)', margin: '1.5rem 0 1.25rem', position: 'relative', textAlign: 'center' }}>
              <span style={{ position: 'relative', top: '-0.7rem', background: '#ffffff', padding: '0 0.75rem', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {t('reservation.form.patientSectionTitle') || 'Data Identitas Pasien'}
              </span>
            </div>

            {/* Field 5: Nama Lengkap Pasien */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: 'var(--text-main)' }}>
                {t('reservation.form.patientNameLabel')}
              </label>
              <div style={{ position: 'relative' }}>
                <User size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  name="nama"
                  value={formData.nama}
                  onChange={handleChange}
                  required
                  style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', outline: 'none', boxSizing: 'border-box' }}
                  placeholder={t('reservation.form.patientNamePlaceholder')}
                />
              </div>
            </div>

            {/* Field 6: Nomor WhatsApp Pasien */}
            <div style={{ marginBottom: '1.75rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: 'var(--text-main)' }}>
                {t('reservation.form.phoneLabel')}
              </label>
              <div style={{ position: 'relative' }}>
                <Phone size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="tel"
                  name="noWa"
                  value={formData.noWa}
                  onChange={handleChange}
                  required
                  style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', outline: 'none', boxSizing: 'border-box' }}
                  placeholder={t('reservation.form.phonePlaceholder')}
                />
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '0.35rem', marginBottom: 0 }}>
                {t('reservation.form.phoneHelper')}
              </p>
            </div>

            {/* Tombol Utama: Submit Reservasi */}
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '0.85rem', fontSize: '1rem', borderRadius: 'var(--radius-md)' }}
            >
              {loading ? (
                t('reservation.form.submitting')
              ) : (
                <>
                  <CheckCircle size={18} className="mr-2" />
                  {t('reservation.form.submitBtn') || 'Daftar Janji Temu Sekarang'}
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {/* Floating Action Button for AI Chatbot Assistant */}
      <FloatingChatbotFAB />
    </div>
  );
};

export default ReservationForm;
