import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Calendar, Clock, Users, Phone, Stethoscope, MoreVertical, 
  Search, Check, X, RefreshCw, Layers, ArrowLeft 
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  getTodayQueue, getAppointments, updateAppointmentStatus, 
  updateAppointmentDetails, deleteAppointment, getPatientsDirectory,
  getLocalTodayISO
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

const PatientReservation = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast, confirmAction } = useNotification();

  const isDoctor = user?.role === 'doctor';

  // Route Guard: If a patient accesses this internal hospital queue dashboard, redirect to self-service reservation
  useEffect(() => {
    if (user && user.role === 'patient') {
      navigate('/reservasi', { replace: true });
    }
  }, [user, navigate]);

  // Active tab state: 'queue' | 'reservations' | 'patients'
  const initialTab = searchParams.get('tab') || 'queue';
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['queue', 'reservations', 'patients'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Queue state (defaults to client local date in UTC+8)
  const [queueDate, setQueueDate] = useState(getLocalTodayISO());
  const [queueQuery, setQueueQuery] = useState('');
  const [queueList, setQueueList] = useState([]);
  const [loadingQueue, setLoadingQueue] = useState(false);

  // Reservations state
  const [reservationList, setReservationList] = useState([]);
  const [loadingReservations, setLoadingReservations] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('all');
  const [reservationQuery, setReservationQuery] = useState('');

  // Patients state
  const [patientList, setPatientList] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [patientQuery, setPatientQuery] = useState('');

  // Dropdown action dot 3 state (Floating Portal Above Table)
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [activeMenuItem, setActiveMenuItem] = useState(null);
  const [activeMenuSource, setActiveMenuSource] = useState('queue');
  const [menuCoords, setMenuCoords] = useState({ top: 0, left: 0, openAbove: false });
  const menuRef = useRef(null);

  // Reschedule Modal state
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [rescheduleForm, setRescheduleForm] = useState({
    appointment_date: '',
    appointment_time: '',
    doctor_name: '',
    notes: ''
  });
  const [isSubmittingReschedule, setIsSubmittingReschedule] = useState(false);

  const handleCloseMenu = () => {
    setActiveMenuId(null);
    setActiveMenuItem(null);
  };

  const handleToggleMenu = (e, item, source = 'queue') => {
    e.stopPropagation();
    if (activeMenuId === item.appointment_id) {
      handleCloseMenu();
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const menuWidth = 160;
    const menuHeight = source === 'reservations' ? 190 : 160;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openAbove = spaceBelow < menuHeight && rect.top > menuHeight;

    let left = rect.right - menuWidth;
    if (left < 10) left = 10;
    if (left + menuWidth > window.innerWidth - 10) {
      left = window.innerWidth - menuWidth - 10;
    }

    const top = openAbove ? Math.max(10, rect.top - menuHeight - 4) : Math.min(window.innerHeight - menuHeight - 10, rect.bottom + 4);

    setMenuCoords({ top, left, openAbove });
    setActiveMenuItem(item);
    setActiveMenuSource(source);
    setActiveMenuId(item.appointment_id);
  };

  // Close dropdown menu when clicking outside, scrolling, or resizing
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        handleCloseMenu();
      }
    };
    const handleScrollOrResize = () => {
      handleCloseMenu();
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const fetchQueue = async (targetDate = queueDate) => {
    setLoadingQueue(true);
    try {
      const data = await getTodayQueue(targetDate);
      setQueueList(Array.isArray(data) ? data : []);
    } catch (err) {
      showToast({ type: 'error', title: t('whatsapp.toasts.loadError'), message: err.message });
    } finally {
      setLoadingQueue(false);
    }
  };

  const fetchReservations = async () => {
    setLoadingReservations(true);
    try {
      const params = {
        status: statusFilter,
        date_filter: dateFilter,
        is_control: false
      };
      if (isDoctor && user?.name) {
        params.doctor_name = user.name;
      }
      const data = await getAppointments(params);
      setReservationList(Array.isArray(data) ? data : []);
    } catch (err) {
      showToast({ type: 'error', title: t('whatsapp.toasts.loadError'), message: err.message });
    } finally {
      setLoadingReservations(false);
    }
  };

  const fetchPatients = async (query = '') => {
    setLoadingPatients(true);
    try {
      const data = await getPatientsDirectory(query, 100);
      setPatientList(Array.isArray(data) ? data : []);
    } catch (err) {
      showToast({ type: 'error', title: t('whatsapp.toasts.loadError'), message: err.message });
    } finally {
      setLoadingPatients(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'queue') {
      fetchQueue(queueDate);
    } else if (activeTab === 'reservations') {
      fetchReservations();
    } else if (activeTab === 'patients') {
      fetchPatients(patientQuery);
    }
  }, [activeTab, statusFilter, dateFilter, queueDate]);

  const handleUpdateStatus = async (appointmentId, newStatus, confirmMsg = null) => {
    const execute = async () => {
      try {
        await updateAppointmentStatus(appointmentId, newStatus);
        showToast({
          type: 'success',
          title: t('whatsapp.toasts.statusUpdated'),
          message: `${t('whatsapp.table.status')}: ${t(`whatsapp.statuses.${newStatus}`, newStatus)}`
        });
        setActiveMenuId(null);
        // Refresh both lists so queue and reservations are always in sync
        fetchQueue(queueDate);
        fetchReservations();
      } catch (err) {
        showToast({ type: 'error', title: t('whatsapp.toasts.statusUpdateError'), message: err.message });
      }
    };

    if (confirmMsg) {
      confirmAction({
        title: confirmMsg.title,
        message: confirmMsg.message,
        confirmLabel: confirmMsg.label || t('whatsapp.actions.confirm', 'Konfirmasi'),
        onConfirm: execute
      });
    } else {
      execute();
    }
  };

  const handleDelete = (appointmentId) => {
    confirmAction({
      title: t('whatsapp.modals.confirmDeleteTitle'),
      message: t('whatsapp.modals.confirmDeleteDesc'),
      confirmLabel: t('whatsapp.actions.delete'),
      onConfirm: async () => {
        try {
          await deleteAppointment(appointmentId);
          showToast({ type: 'success', title: t('whatsapp.toasts.deleteSuccess') });
          setActiveMenuId(null);
          fetchQueue(queueDate);
          fetchReservations();
        } catch (err) {
          showToast({ type: 'error', title: t('whatsapp.toasts.deleteError'), message: err.message });
        }
      }
    });
  };

  const handleOpenScribe = (item) => {
    const params = new URLSearchParams();
    if (item.patient_id) params.set('patient_id', item.patient_id);
    if (item.name) params.set('patient_name', item.name);
    if (item.medical_record_no) params.set('mrn', item.medical_record_no);
    navigate(`/app/asisten-medis?${params.toString()}`);
  };

  const handleOpenRescheduleModal = (item) => {
    setRescheduleTarget(item);
    setRescheduleForm({
      appointment_date: item.appointment_date || '',
      appointment_time: item.appointment_time || '09:00',
      doctor_name: item.doctor_name || '',
      notes: item.notes || ''
    });
    setActiveMenuId(null);
  };

  const handleSubmitReschedule = async (e) => {
    e.preventDefault();
    if (!rescheduleTarget) return;
    setIsSubmittingReschedule(true);
    try {
      await updateAppointmentDetails(rescheduleTarget.appointment_id, rescheduleForm);
      showToast({ type: 'success', title: t('whatsapp.toasts.rescheduleSuccess') });
      setRescheduleTarget(null);
      fetchQueue(queueDate);
      fetchReservations();
    } catch (err) {
      showToast({ type: 'error', title: t('whatsapp.toasts.rescheduleError'), message: err.message });
    } finally {
      setIsSubmittingReschedule(false);
    }
  };

  const filteredQueueList = queueList.filter((item) => {
    if (!queueQuery.trim()) return true;
    const q = queueQuery.toLowerCase();
    const name = (item.name || '').toLowerCase();
    const mrn = (item.medical_record_no || '').toLowerCase();
    const phone = (item.phone || '').toLowerCase();
    const doctor = (item.doctor_name || '').toLowerCase();
    return name.includes(q) || mrn.includes(q) || phone.includes(q) || doctor.includes(q);
  });

  const renderStatusBadge = (status) => {
    const s = (status || 'SCHEDULED').toUpperCase();
    const config = {
      PENDING: { bg: '#fef3c7', color: '#92400e', border: '#fcd34d' },
      APPROVED: { bg: '#e0e7ff', color: '#3730a3', border: '#c7d2fe' },
      SCHEDULED: { bg: '#f0f9ff', color: '#0369a1', border: '#bae6fd' },
      CHECKED_IN: { bg: '#ccfbf1', color: '#115e59', border: '#99f6e4' },
      IN_CONSULTATION: { bg: '#f3e8ff', color: '#6b21a8', border: '#e9d5ff' },
      COMPLETED: { bg: '#dcfce7', color: '#166534', border: '#bbf7d0' },
      CANCELLED: { bg: '#fee2e2', color: '#991b1b', border: '#fecaca' }
    };
    const c = config[s] || config.SCHEDULED;
    return (
      <span style={{
        display: 'inline-block',
        padding: '0.2rem 0.6rem',
        borderRadius: '4px',
        fontSize: '0.75rem',
        fontWeight: 700,
        backgroundColor: c.bg,
        color: c.color,
        border: `1px solid ${c.border}`
      }}>
        {t(`whatsapp.statuses.${s}`, s)}
      </span>
    );
  };

  const filteredReservationList = reservationList.filter((item) => {
    if (!reservationQuery.trim()) return true;
    const q = reservationQuery.toLowerCase();
    const name = (item.name || item.patient_name || '').toLowerCase();
    const mrn = (item.medical_record_no || '').toLowerCase();
    const phone = (item.phone || '').toLowerCase();
    const doctor = (item.doctor_name || '').toLowerCase();
    const notes = (item.notes || '').toLowerCase();
    return name.includes(q) || mrn.includes(q) || phone.includes(q) || doctor.includes(q) || notes.includes(q);
  });
  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '3.5rem', fontFamily: "'DM Sans', 'Plus Jakarta Sans', system-ui, sans-serif" }}>
      {/* Top Header Card (Consistent with MedicalScribe layout) */}
      <div style={{
        marginBottom: '1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        backgroundColor: '#ffffff',
        padding: '1.25rem 1.5rem',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.25rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: '#f0fdf4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary-color)'
            }}>
              <Calendar size={20} />
            </div>
            <h1 style={{
              fontSize: '1.35rem',
              fontWeight: 800,
              color: 'var(--text-main)',
              margin: 0,
              letterSpacing: '-0.02em'
            }}>
              {t('whatsapp.reservationTitle', 'Loket Admisi & Antrean Pasien')}
            </h1>
          </div>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.4 }}>
            {activeTab === 'queue' && t('whatsapp.tabs.queueDesc', 'Pantau antrean poliklinik hari ini dan panggil nomor giliran pasien.')}
            {activeTab === 'reservations' && t('whatsapp.tabs.onlineDesc', 'Daftar permohonan reservasi mandiri masuk dari WhatsApp dan Website.')}
            {activeTab === 'patients' && t('whatsapp.tabs.patientsDesc', 'Direktori data rekam medis pasien terdaftar di klinik.')}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <button 
            type="button"
            onClick={() => {
              if (activeTab === 'queue') fetchQueue();
              if (activeTab === 'reservations') fetchReservations();
              if (activeTab === 'patients') fetchPatients(patientQuery);
            }} 
            className="btn btn-secondary" 
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <RefreshCw size={14} className={loadingQueue || loadingReservations || loadingPatients ? 'spin' : ''} />
            <span>{t('whatsapp.refreshBtn', 'Refresh')}</span>
          </button>
        </div>
      </div>

      {/* SAKA-Style High-Precision Pill Tabs Navigation */}
      <div style={{
        display: 'flex',
        marginBottom: '1.5rem',
        background: '#f1f5f9',
        padding: '4px',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        gap: '6px'
      }}>
        <button
          type="button"
          onClick={() => handleTabChange('queue')}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1rem',
            borderRadius: '8px',
            border: 'none',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: 'pointer',
            background: activeTab === 'queue' ? '#ffffff' : 'transparent',
            color: activeTab === 'queue' ? 'var(--primary-dark, #047857)' : 'var(--text-muted)',
            boxShadow: activeTab === 'queue' ? '0 1px 3px rgba(15, 23, 42, 0.08)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          <Clock size={16} />
          <span>{t('whatsapp.tabs.queue', 'Antrean Hari Ini')}</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('reservations')}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1rem',
            borderRadius: '8px',
            border: 'none',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: 'pointer',
            background: activeTab === 'reservations' ? '#ffffff' : 'transparent',
            color: activeTab === 'reservations' ? 'var(--primary-dark, #047857)' : 'var(--text-muted)',
            boxShadow: activeTab === 'reservations' ? '0 1px 3px rgba(15, 23, 42, 0.08)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          <Calendar size={16} />
          <span>{t('whatsapp.tabs.reservations', 'Permohonan Reservasi')}</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('patients')}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1rem',
            borderRadius: '8px',
            border: 'none',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: 'pointer',
            background: activeTab === 'patients' ? '#ffffff' : 'transparent',
            color: activeTab === 'patients' ? 'var(--primary-dark, #047857)' : 'var(--text-muted)',
            boxShadow: activeTab === 'patients' ? '0 1px 3px rgba(15, 23, 42, 0.08)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          <Users size={16} />
          <span>{t('whatsapp.tabs.patients', 'Direktori Pasien')}</span>
        </button>
      </div>

      {/* TAB 1: ANTREAN HARI INI */}
      {activeTab === 'queue' && (
        <div className="card" style={{ padding: '1.25rem', borderRadius: '12px', background: '#fff', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
          {/* Queue Toolbar: Search & Date Selector */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
            marginBottom: '1rem',
            paddingBottom: '0.75rem',
            borderBottom: '1px solid var(--border-color)'
          }}>
            {/* Left: Quick Search */}
            <div style={{ position: 'relative', minWidth: '220px', flex: '1 1 240px', maxWidth: '340px' }}>
              <input
                type="text"
                value={queueQuery}
                onChange={(e) => setQueueQuery(e.target.value)}
                placeholder={t('whatsapp.filters.searchQueue', 'Cari pasien antrean, dokter, No. RM...')}
                className="input"
                style={{
                  width: '100%',
                  padding: '0.42rem 0.75rem 0.42rem 2.2rem',
                  fontSize: '0.82rem',
                  borderRadius: 'var(--radius-md)'
                }}
              />
              <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>

            {/* Right: Date Picker & Today Reset */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#f8fafc', padding: '0.3rem 0.6rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <Calendar size={14} color="var(--primary-color)" />
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  {t('whatsapp.filters.queueDate', 'Tanggal Antrean:')}
                </span>
                <input
                  type="date"
                  value={queueDate}
                  onChange={(e) => setQueueDate(e.target.value)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: 'var(--text-main)',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                />
              </div>

              {queueDate !== getLocalTodayISO() ? (
                <button
                  type="button"
                  onClick={() => setQueueDate(getLocalTodayISO())}
                  style={{
                    padding: '0.35rem 0.65rem',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    borderRadius: '6px',
                    border: '1px solid #bfdbfe',
                    backgroundColor: '#eff6ff',
                    color: '#1d4ed8',
                    cursor: 'pointer'
                  }}
                >
                  {t('whatsapp.filters.backToToday', 'Kembali ke Hari Ini')}
                </button>
              ) : (
                <span style={{
                  padding: '0.3rem 0.6rem',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  borderRadius: '4px',
                  backgroundColor: '#ecfdf5',
                  color: '#047857',
                  border: '1px solid #a7f3d0'
                }}>
                  {t('whatsapp.filters.todayBadge', '● Hari Ini - Waktu Lokal')}
                </span>
              )}

              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, marginLeft: '0.25rem' }}>
                {t('whatsapp.filters.totalPatients', { count: filteredQueueList.length, defaultValue: `Total: ${filteredQueueList.length} Pasien` })}
              </span>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.65rem 0.75rem', fontWeight: 600 }}>{t('whatsapp.table.queueNo', 'No. Antrean')}</th>
                  <th style={{ padding: '0.65rem 0.75rem', fontWeight: 600 }}>{t('whatsapp.table.patient', 'Pasien')}</th>
                  <th style={{ padding: '0.65rem 0.75rem', fontWeight: 600 }}>{t('whatsapp.table.mrn', 'No. RM')}</th>
                  <th style={{ padding: '0.65rem 0.75rem', fontWeight: 600 }}>{t('whatsapp.table.schedule', 'Jadwal')}</th>
                  <th style={{ padding: '0.65rem 0.75rem', fontWeight: 600 }}>{t('whatsapp.table.doctor', 'Dokter')}</th>
                  <th style={{ padding: '0.65rem 0.75rem', fontWeight: 600 }}>{t('whatsapp.table.status', 'Status')}</th>
                  <th style={{ padding: '0.65rem 0.75rem', fontWeight: 600, textAlign: 'right' }}>{t('whatsapp.table.action', 'Aksi')}</th>
                </tr>
              </thead>
              <tbody>
                {loadingQueue ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      {t('whatsapp.loading', 'Memuat data...')}
                    </td>
                  </tr>
                ) : filteredQueueList.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                      <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                          <Users size={20} />
                        </div>
                        <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                          {queueDate === getLocalTodayISO() 
                            ? t('whatsapp.table.emptyQueue', 'Tidak ada pasien dalam antrean hari ini.')
                            : t('whatsapp.table.emptyQueueDate', { date: queueDate, defaultValue: `Tidak ada pasien dalam antrean pada tanggal ${queueDate}.` })}
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredQueueList.map((item, idx) => (
                    <tr key={item.appointment_id || idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.75rem', fontWeight: 700, color: 'var(--primary-color)' }}>
                        {item.queue_number || `A-${idx + 1 < 10 ? '0' : ''}${idx + 1}`}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{item.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.phone}</div>
                      </td>
                      <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.8rem', color: '#475569' }}>
                        {item.medical_record_no || '-'}
                      </td>
                      <td style={{ padding: '0.75rem', whiteSpace: 'nowrap' }}>
                        {item.appointment_time || '09:00'}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <div>{item.doctor_name || t('whatsapp.table.generalDoctor', 'dr. Umum')}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.poli_name || t('whatsapp.table.generalClinic', 'Poli Umum')}</div>
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        {renderStatusBadge(item.status)}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          {item.status !== 'IN_CONSULTATION' && item.status !== 'COMPLETED' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(item.appointment_id, 'IN_CONSULTATION')}
                              style={{
                                padding: '0.3rem 0.6rem',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                background: '#f3e8ff',
                                color: '#6b21a8',
                                border: '1px solid #d8b4fe',
                                cursor: 'pointer'
                              }}
                            >
                              {t('whatsapp.actions.call', 'Panggil Antrean')}
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleOpenScribe(item)}
                            style={{
                              padding: '0.3rem 0.6rem',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              background: '#ecfdf5',
                              color: '#047857',
                              border: '1px solid #a7f3d0',
                              cursor: 'pointer'
                            }}
                          >
                            {t('whatsapp.actions.openScribe', 'Buka Rekam Medis')}
                          </button>

                          {/* Dot 3 Dropdown (Triggers Portal Menu Above Table) */}
                          <button
                            type="button"
                            onClick={(e) => handleToggleMenu(e, item, 'queue')}
                            style={{
                              padding: '0.3rem',
                              borderRadius: '4px',
                              border: activeMenuId === item.appointment_id ? '1px solid var(--primary-color)' : '1px solid var(--border-color)',
                              background: activeMenuId === item.appointment_id ? '#f1f5f9' : '#fff',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.15s ease'
                            }}
                            title={t('whatsapp.actions.optionsMenu', 'Menu Opsi')}
                          >
                            <MoreVertical size={15} color={activeMenuId === item.appointment_id ? 'var(--primary-color)' : 'var(--text-muted)'} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: DAFTAR RESERVASI PASIEN */}
      {activeTab === 'reservations' && (
        <div className="card" style={{ padding: '1.25rem', borderRadius: '12px', background: '#fff', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
          {/* Unified Non-Redundant Toolbar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
            marginBottom: '1rem',
            paddingBottom: '0.75rem',
            borderBottom: '1px solid var(--border-color)'
          }}>
            {/* Left: Quick Search */}
            <div style={{ position: 'relative', minWidth: '220px', flex: '1 1 240px', maxWidth: '340px' }}>
              <input
                type="text"
                value={reservationQuery}
                onChange={(e) => setReservationQuery(e.target.value)}
                placeholder={t('whatsapp.filters.searchPatient', 'Cari nama pasien, No. RM, atau nomor telepon...')}
                className="input"
                style={{
                  width: '100%',
                  padding: '0.42rem 0.75rem 0.42rem 2.2rem',
                  fontSize: '0.82rem',
                  borderRadius: 'var(--radius-md)'
                }}
              />
              <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>

            {/* Right Group: Date Range Tabs + Single Status Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
              {/* Date Range Segmented Buttons */}
              <div style={{
                display: 'inline-flex',
                background: '#f1f5f9',
                padding: '0.2rem',
                borderRadius: '6px',
                border: '1px solid var(--border-color)'
              }}>
                {['all', 'today', 'upcoming', 'past'].map((df) => (
                  <button
                    key={df}
                    type="button"
                    onClick={() => setDateFilter(df)}
                    style={{
                      padding: '0.3rem 0.65rem',
                      borderRadius: '4px',
                      fontSize: '0.785rem',
                      fontWeight: dateFilter === df ? 700 : 500,
                      cursor: 'pointer',
                      border: 'none',
                      background: dateFilter === df ? '#ffffff' : 'transparent',
                      color: dateFilter === df ? 'var(--primary-color)' : 'var(--text-muted)',
                      boxShadow: dateFilter === df ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {t(`whatsapp.filters.${df}`, df)}
                  </button>
                ))}
              </div>

              {/* Single Compact Status Dropdown (Eliminates redundant "All" button) */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{
                    padding: '0.42rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: '1px solid var(--border-color)',
                    backgroundColor: '#ffffff',
                    color: statusFilter === 'ALL' ? 'var(--text-main)' : 'var(--primary-color)',
                    outline: 'none',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <option value="ALL">{t('whatsapp.filters.filterStatus', 'Semua Status')}</option>
                  <option value="PENDING">{t('whatsapp.statuses.PENDING', 'Menunggu')}</option>
                  <option value="APPROVED">{t('whatsapp.statuses.APPROVED', 'Disetujui')}</option>
                  <option value="SCHEDULED">{t('whatsapp.statuses.SCHEDULED', 'Terjadwal')}</option>
                  <option value="COMPLETED">{t('whatsapp.statuses.COMPLETED', 'Selesai')}</option>
                  <option value="CANCELLED">{t('whatsapp.statuses.CANCELLED', 'Dibatalkan')}</option>
                </select>
              </div>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.65rem 0.75rem', fontWeight: 600 }}>{t('whatsapp.table.schedule', 'Jadwal')}</th>
                  <th style={{ padding: '0.65rem 0.75rem', fontWeight: 600 }}>{t('whatsapp.table.patient', 'Pasien & No. RM')}</th>
                  <th style={{ padding: '0.65rem 0.75rem', fontWeight: 600 }}>{t('whatsapp.table.doctor', 'Dokter')}</th>
                  <th style={{ padding: '0.65rem 0.75rem', fontWeight: 600 }}>{t('whatsapp.table.notes', 'Catatan / Keluhan')}</th>
                  <th style={{ padding: '0.65rem 0.75rem', fontWeight: 600 }}>{t('whatsapp.table.status', 'Status')}</th>
                  <th style={{ padding: '0.65rem 0.75rem', fontWeight: 600 }}>{t('whatsapp.table.reminder', 'Pengingat AI')}</th>
                  <th style={{ padding: '0.65rem 0.75rem', fontWeight: 600, textAlign: 'right' }}>{t('whatsapp.table.action', 'Aksi')}</th>
                </tr>
              </thead>
              <tbody>
                {loadingReservations ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      {t('whatsapp.loading', 'Memuat data...')}
                    </td>
                  </tr>
                ) : filteredReservationList.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                      <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                          <Calendar size={20} />
                        </div>
                        <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                          {t('whatsapp.table.emptyAppointments', 'Belum ada reservasi masuk.')}
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredReservationList.map((item) => (
                    <tr key={item.appointment_id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.75rem', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{item.appointment_date}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.appointment_time}</div>
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{item.name}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.15rem' }}>
                          <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#64748b' }}>
                            {item.medical_record_no || '-'}
                          </span>
                          {item.phone && (
                            <a
                              href={`https://wa.me/${item.phone.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{ fontSize: '0.75rem', color: 'var(--primary-color)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
                              title={t('whatsapp.actions.chatWa', 'Chat WhatsApp')}
                            >
                              <Phone size={11} /> {item.phone}
                            </a>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <div>{item.doctor_name || t('whatsapp.table.generalDoctor', 'dr. Umum')}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.poli_name || t('whatsapp.table.generalClinic', 'Poli Umum')}</div>
                      </td>
                      <td style={{ padding: '0.75rem', maxWidth: '280px' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.notes || '-'}>
                          {item.notes || '-'}
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        {renderStatusBadge(item.status)}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{ fontSize: '0.75rem', color: '#047857', fontWeight: 600 }}>
                          {item.reminder_status || t('whatsapp.table.autoActive', 'Otomatis Aktif')}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {/* Dot 3 Dropdown (Triggers Portal Menu Above Table) */}
                        <button
                          type="button"
                          onClick={(e) => handleToggleMenu(e, item, 'reservations')}
                          style={{
                            padding: '0.3rem',
                            borderRadius: '4px',
                            border: activeMenuId === item.appointment_id ? '1px solid var(--primary-color)' : '1px solid var(--border-color)',
                            background: activeMenuId === item.appointment_id ? '#f1f5f9' : '#fff',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.15s ease'
                          }}
                          title={t('whatsapp.actions.optionsMenu', 'Menu Opsi')}
                        >
                          <MoreVertical size={15} color={activeMenuId === item.appointment_id ? 'var(--primary-color)' : 'var(--text-muted)'} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: DIREKTORI PASIEN */}
      {activeTab === 'patients' && (
        <div className="card" style={{ padding: '1.25rem', borderRadius: '12px', background: '#fff', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
          <form onSubmit={(e) => { e.preventDefault(); fetchPatients(patientQuery); }} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
              <input
                type="text"
                value={patientQuery}
                onChange={(e) => setPatientQuery(e.target.value)}
                placeholder={t('whatsapp.filters.searchPatient', 'Cari nama pasien, No. RM, atau nomor telepon...')}
                className="input"
                style={{ width: '100%', paddingLeft: '2.25rem', fontSize: '0.85rem' }}
              />
              <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
            <button type="submit" className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
              {t('whatsapp.filters.search', 'Cari')}
            </button>
          </form>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.65rem 0.75rem', fontWeight: 600 }}>{t('whatsapp.table.mrn', 'No. RM')}</th>
                  <th style={{ padding: '0.65rem 0.75rem', fontWeight: 600 }}>{t('whatsapp.table.patient', 'Nama Pasien')}</th>
                  <th style={{ padding: '0.65rem 0.75rem', fontWeight: 600 }}>{t('whatsapp.table.contact', 'Kontak WhatsApp')}</th>
                  <th style={{ padding: '0.65rem 0.75rem', fontWeight: 600 }}>{t('whatsapp.table.visits', 'Total Kunjungan')}</th>
                  <th style={{ padding: '0.65rem 0.75rem', fontWeight: 600 }}>{t('whatsapp.table.lastVisit', 'Kunjungan Terakhir')}</th>
                  <th style={{ padding: '0.65rem 0.75rem', fontWeight: 600 }}>{t('whatsapp.table.registered', 'Terdaftar')}</th>
                  <th style={{ padding: '0.65rem 0.75rem', fontWeight: 600, textAlign: 'right' }}>{t('whatsapp.table.action', 'Aksi')}</th>
                </tr>
              </thead>
              <tbody>
                {loadingPatients ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      {t('whatsapp.loading', 'Memuat data...')}
                    </td>
                  </tr>
                ) : patientList.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
                      {t('whatsapp.table.emptyPatients', 'Data pasien tidak ditemukan.')}
                    </td>
                  </tr>
                ) : (
                  patientList.map((p) => (
                    <tr key={p.patient_id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontWeight: 600, color: 'var(--primary-color)' }}>
                        {p.medical_record_no || '-'}
                      </td>
                      <td style={{ padding: '0.75rem', fontWeight: 600, color: 'var(--text-main)' }}>
                        {p.name}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        {p.phone ? (
                          <a
                            href={`https://wa.me/${p.phone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: 'var(--primary-color)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                          >
                            <Phone size={13} /> {p.phone}
                          </a>
                        ) : '-'}
                      </td>
                      <td style={{ padding: '0.75rem', fontWeight: 600 }}>
                        {p.total_visits} {t('whatsapp.table.visitsUnit', 'sesi')}
                      </td>
                      <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>
                        {p.last_visit_date || '-'}
                      </td>
                      <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>
                        {p.created_at ? p.created_at.split('T')[0] : '-'}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => handleOpenScribe({ patient_id: p.patient_id, name: p.name, medical_record_no: p.medical_record_no })}
                          style={{
                            padding: '0.3rem 0.65rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            background: '#ecfdf5',
                            color: '#047857',
                            border: '1px solid #a7f3d0',
                            cursor: 'pointer'
                          }}
                        >
                          {t('whatsapp.actions.openScribe', 'Buka Rekam Medis')}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FLOATING ACTION DROPDOWN PORTAL (Floats cleanly above the table section) */}
      {activeMenuId && activeMenuItem && createPortal(
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            top: `${menuCoords.top}px`,
            left: `${menuCoords.left}px`,
            background: '#ffffff',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            zIndex: 9999,
            minWidth: '155px',
            padding: '0.35rem 0',
            textAlign: 'left'
          }}
        >
          <button
            type="button"
            onClick={() => {
              const id = activeMenuItem.appointment_id;
              handleCloseMenu();
              handleUpdateStatus(id, 'APPROVED');
            }}
            style={{
              display: 'block', width: '100%', padding: '0.5rem 0.85rem', border: 'none', background: 'none',
              fontSize: '0.8rem', textAlign: 'left', cursor: 'pointer', color: 'var(--text-main)', fontWeight: 500
            }}
            onMouseEnter={(e) => e.target.style.background = '#f8fafc'}
            onMouseLeave={(e) => e.target.style.background = 'none'}
          >
            {t('whatsapp.actions.approve', 'Setujui')}
          </button>

          <button
            type="button"
            onClick={() => {
              const target = activeMenuItem;
              handleCloseMenu();
              handleOpenRescheduleModal(target);
            }}
            style={{
              display: 'block', width: '100%', padding: '0.5rem 0.85rem', border: 'none', background: 'none',
              fontSize: '0.8rem', textAlign: 'left', cursor: 'pointer', color: 'var(--text-main)', fontWeight: 500
            }}
            onMouseEnter={(e) => e.target.style.background = '#f8fafc'}
            onMouseLeave={(e) => e.target.style.background = 'none'}
          >
            {t('whatsapp.actions.reschedule', 'Ubah Jadwal')}
          </button>

          {activeMenuSource === 'reservations' && (
            <button
              type="button"
              onClick={() => {
                const target = activeMenuItem;
                handleCloseMenu();
                handleOpenScribe(target);
              }}
              style={{
                display: 'block', width: '100%', padding: '0.5rem 0.85rem', border: 'none', background: 'none',
                fontSize: '0.8rem', textAlign: 'left', cursor: 'pointer', color: 'var(--text-main)', fontWeight: 500
              }}
              onMouseEnter={(e) => e.target.style.background = '#f8fafc'}
              onMouseLeave={(e) => e.target.style.background = 'none'}
            >
              {t('whatsapp.actions.openScribe', 'Buka Rekam Medis')}
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              const id = activeMenuItem.appointment_id;
              handleCloseMenu();
              handleUpdateStatus(id, 'CANCELLED', {
                title: t('whatsapp.modals.confirmCancelTitle'),
                message: t('whatsapp.modals.confirmCancelDesc')
              });
            }}
            style={{
              display: 'block', width: '100%', padding: '0.5rem 0.85rem', border: 'none', background: 'none',
              fontSize: '0.8rem', textAlign: 'left', cursor: 'pointer', color: '#b91c1c', fontWeight: 500
            }}
            onMouseEnter={(e) => e.target.style.background = '#fef2f2'}
            onMouseLeave={(e) => e.target.style.background = 'none'}
          >
            {t('whatsapp.actions.cancel', 'Batalkan')}
          </button>

          <button
            type="button"
            onClick={() => {
              const id = activeMenuItem.appointment_id;
              handleCloseMenu();
              handleDelete(id);
            }}
            style={{
              display: 'block', width: '100%', padding: '0.5rem 0.85rem', border: 'none', background: 'none',
              fontSize: '0.8rem', textAlign: 'left', cursor: 'pointer', color: '#991b1b', borderTop: '1px solid #f1f5f9', fontWeight: 500
            }}
            onMouseEnter={(e) => e.target.style.background = '#fef2f2'}
            onMouseLeave={(e) => e.target.style.background = 'none'}
          >
            {t('whatsapp.actions.delete', 'Hapus')}
          </button>
        </div>,
        document.body
      )}

      {/* RESCHEDULE MODAL */}
      {rescheduleTarget && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 'var(--radius-md)',
            width: '100%',
            maxWidth: '460px',
            boxShadow: 'var(--shadow-lg)',
            padding: '1.25rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
                {t('whatsapp.modals.rescheduleTitle', 'Ubah Jadwal Janji Temu')}
              </h3>
              <button
                onClick={() => setRescheduleTarget(null)}
                style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '0.25rem' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitReschedule} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                  {t('whatsapp.modals.dateLabel', 'Tanggal')}
                </label>
                <input
                  type="date"
                  required
                  value={rescheduleForm.appointment_date}
                  onChange={(e) => setRescheduleForm({ ...rescheduleForm, appointment_date: e.target.value })}
                  className="input"
                  style={{ width: '100%', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                  {t('whatsapp.modals.timeLabel', 'Waktu')}
                </label>
                <input
                  type="time"
                  required
                  value={rescheduleForm.appointment_time}
                  onChange={(e) => setRescheduleForm({ ...rescheduleForm, appointment_time: e.target.value })}
                  className="input"
                  style={{ width: '100%', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                  {t('whatsapp.modals.doctorLabel', 'Dokter')}
                </label>
                <input
                  type="text"
                  required
                  value={rescheduleForm.doctor_name}
                  onChange={(e) => setRescheduleForm({ ...rescheduleForm, doctor_name: e.target.value })}
                  className="input"
                  style={{ width: '100%', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                  {t('whatsapp.modals.notesLabel', 'Catatan')}
                </label>
                <textarea
                  rows="3"
                  value={rescheduleForm.notes}
                  onChange={(e) => setRescheduleForm({ ...rescheduleForm, notes: e.target.value })}
                  className="input"
                  style={{ width: '100%', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setRescheduleTarget(null)}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.85rem' }}
                >
                  {t('whatsapp.modals.close', 'Batal')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReschedule}
                  className="btn btn-primary"
                  style={{ fontSize: '0.85rem' }}
                >
                  {isSubmittingReschedule ? t('whatsapp.loading') : t('whatsapp.modals.save', 'Simpan Perubahan')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientReservation;
