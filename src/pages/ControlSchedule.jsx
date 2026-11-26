import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  CalendarCheck, Clock, Phone, Stethoscope, MoreVertical, 
  Search, Check, X, Edit, Trash2, RefreshCw 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  getAppointments, updateAppointmentStatus, 
  updateAppointmentDetails, deleteAppointment 
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

const ControlSchedule = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast, confirmAction } = useNotification();

  const isDoctor = user?.role === 'doctor';

  const [controlList, setControlList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Dropdown action dot 3 state (Floating Portal Above Table)
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [activeMenuItem, setActiveMenuItem] = useState(null);
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

  const handleToggleMenu = (e, item) => {
    e.stopPropagation();
    if (activeMenuId === item.appointment_id) {
      handleCloseMenu();
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const menuWidth = 160;
    const menuHeight = 190; // 5 action buttons
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

  const fetchControls = async () => {
    setLoading(true);
    try {
      const params = {
        status: statusFilter,
        date_filter: dateFilter,
        is_control: true
      };
      if (isDoctor && user?.name) {
        params.doctor_name = user.name;
      }
      const data = await getAppointments(params);
      setControlList(Array.isArray(data) ? data : []);
    } catch (err) {
      showToast({ type: 'error', title: t('whatsapp.toasts.loadError'), message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchControls();
  }, [statusFilter, dateFilter]);

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
        fetchControls();
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
          fetchControls();
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
      notes: item.control_reason || item.notes || ''
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
      fetchControls();
    } catch (err) {
      showToast({ type: 'error', title: t('whatsapp.toasts.rescheduleError'), message: err.message });
    } finally {
      setIsSubmittingReschedule(false);
    }
  };

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

  const filteredControlList = controlList.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const name = (item.name || item.patient_name || '').toLowerCase();
    const mrn = (item.medical_record_no || '').toLowerCase();
    const phone = (item.phone || '').toLowerCase();
    const doctor = (item.doctor_name || '').toLowerCase();
    const notes = (item.control_reason || item.notes || '').toLowerCase();
    return name.includes(q) || mrn.includes(q) || phone.includes(q) || doctor.includes(q) || notes.includes(q);
  });

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title" style={{ margin: '0 0 0.25rem 0', fontSize: '1.45rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CalendarCheck size={24} color="var(--primary-color)" />
            <span>{t('whatsapp.controlTitle', 'Jadwal Kontrol Pasien')}</span>
          </h1>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            {t('whatsapp.controlSubtitle', 'Jadwal kontrol pasca-konsultasi yang terbit otomatis dari anjuran dokter pada Medical Scribe.')}
          </p>
        </div>

        <button 
          onClick={fetchControls} 
          className="btn btn-secondary" 
          style={{ padding: '0.55rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          title={t('whatsapp.refreshBtn', 'Refresh')}
          aria-label={t('whatsapp.refreshBtn', 'Refresh')}
        >
          <RefreshCw size={15} className={loading ? 'spin' : ''} />
        </button>
      </div>

      {/* Main Table Card */}
      <div className="card" style={{ padding: '1rem', borderRadius: 'var(--radius-md)', background: '#fff', border: '1px solid var(--border-color)' }}>
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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.65rem 0.75rem', fontWeight: 600 }}>{t('whatsapp.table.schedule', 'Jadwal Kontrol')}</th>
                <th style={{ padding: '0.65rem 0.75rem', fontWeight: 600 }}>{t('whatsapp.table.patient', 'Pasien & No. RM')}</th>
                <th style={{ padding: '0.65rem 0.75rem', fontWeight: 600 }}>{t('whatsapp.table.doctor', 'Dokter')}</th>
                <th style={{ padding: '0.65rem 0.75rem', fontWeight: 600 }}>{t('whatsapp.table.notes', 'Alasan Kontrol Lanjutan')}</th>
                <th style={{ padding: '0.65rem 0.75rem', fontWeight: 600 }}>{t('whatsapp.table.status', 'Status')}</th>
                <th style={{ padding: '0.65rem 0.75rem', fontWeight: 600 }}>{t('whatsapp.table.reminder', 'Pengingat AI')}</th>
                <th style={{ padding: '0.65rem 0.75rem', fontWeight: 600, textAlign: 'right' }}>{t('whatsapp.table.action', 'Aksi')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    {t('whatsapp.loading', 'Memuat data...')}
                  </td>
                </tr>
              ) : filteredControlList.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
                    {t('whatsapp.table.emptyAppointments', 'Belum ada jadwal kontrol terdaftar.')}
                  </td>
                </tr>
              ) : (
                filteredControlList.map((item) => (
                  <tr key={item.appointment_id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.15s' }}>
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
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.control_reason || item.notes || '-'}>
                        {item.control_reason || item.notes || '-'}
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
                        onClick={(e) => handleToggleMenu(e, item)}
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

export default ControlSchedule;
