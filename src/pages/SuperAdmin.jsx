import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, Users, Cpu, Activity, CheckCircle, AlertCircle, 
  RefreshCw, UserPlus, UserCheck, Phone, ToggleLeft, ToggleRight, Server, MessageSquare, Send, Database,
  Calendar, ArrowRight, History, Search, Filter, Clock
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';


const SuperAdmin = () => {
  const { t, i18n } = useTranslation();
  const { showToast } = useNotification();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [connectors, setConnectors] = useState(null);
  const [loading, setLoading] = useState(true);

  // View state: 'users' or 'logs'
  const [activeView, setActiveView] = useState('users');
  const [activityLogs, setActivityLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logSearch, setLogSearch] = useState('');
  const [logCategoryFilter, setLogCategoryFilter] = useState('all');
  const [logRoleFilter, setLogRoleFilter] = useState('all');

  // User Accounts Filter & Search State
  const [userRoleFilter, setUserRoleFilter] = useState('all'); // 'all' | 'staff' | 'client'
  const [userSearch, setUserSearch] = useState('');

  // New User Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'nurse'
  });
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  // New Client Modal State
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    phone: '',
    medical_record_no: '',
    password: '',
    role: 'client'
  });
  const [isCreatingClient, setIsCreatingClient] = useState(false);

  const fetchActivityLogs = async () => {
    setLoadingLogs(true);
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8001';
    try {
      const res = await fetch(`${apiBase}/api/admin/activities`);
      if (res.ok) {
        const data = await res.json();
        setActivityLogs(data);
      }
    } catch (e) {
      console.error('Failed to fetch activity logs', e);
    } finally {
      setLoadingLogs(false);
    }
  };

  const fetchAdminData = async () => {
    setLoading(true);
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8001';
    try {
      const [statsRes, usersRes, connRes, logsRes] = await Promise.all([
        fetch(`${apiBase}/api/admin/stats`),
        fetch(`${apiBase}/api/admin/users`),
        fetch(`${apiBase}/api/admin/connectors/status`),
        fetch(`${apiBase}/api/admin/activities`)
      ]);

      if (statsRes.ok) {
        try {
          const statsData = await statsRes.json();
          setStats(statsData);
        } catch (e) {
          console.error('Error parsing statsData:', e);
        }
      }
      if (usersRes.ok) {
        try {
          const usersData = await usersRes.json();
          setUsers(Array.isArray(usersData) ? usersData : []);
        } catch (e) {
          console.error('Error parsing usersData:', e);
        }
      }
      if (connRes.ok) {
        try {
          const connData = await connRes.json();
          setConnectors(connData);
        } catch (e) {
          console.error('Error parsing connData:', e);
        }
      }
      if (logsRes.ok) {
        try {
          const logsData = await logsRes.json();
          setActivityLogs(Array.isArray(logsData) ? logsData : []);
        } catch (e) {
          console.error('Error parsing logsData:', e);
        }
      }
    } catch (err) {
      console.error('fetchAdminData network error:', err);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Koneksi ke backend admin terputus.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setIsCreatingUser(true);
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8001';
    try {
      const res = await fetch(`${apiBase}/api/admin/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });

      if (res.ok) {
        showToast({
          type: 'success',
          title: t('admin.users.createSuccess'),
          message: `${newUser.email} (${newUser.role})`
        });
        setIsModalOpen(false);
        setNewUser({ name: '', email: '', password: '', role: 'nurse' });
        fetchAdminData();
      } else {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || 'Gagal menambahkan user.');
      }
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Error',
        message: err.message
      });
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleCreateClient = async (e) => {
    e.preventDefault();
    setIsCreatingClient(true);
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8001';
    try {
      const res = await fetch(`${apiBase}/api/admin/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClient)
      });

      if (res.ok) {
        showToast({
          type: 'success',
          title: t('admin.users.createClientSuccess') || 'Akun klien berhasil didaftarkan!',
          message: `${newClient.name} (${newClient.email})`
        });
        setIsClientModalOpen(false);
        setNewClient({
          name: '',
          email: '',
          phone: '',
          medical_record_no: '',
          password: '',
          role: 'client'
        });
        fetchAdminData();
      } else {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || 'Gagal menambahkan akun klien.');
      }
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Error',
        message: err.message
      });
    } finally {
      setIsCreatingClient(false);
    }
  };

  const getUserRoleBadge = (role) => {
    switch (role?.toLowerCase()) {
      case 'superadmin': return { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca', label: t('admin.users.roleSuperadmin') || 'SuperAdmin' };
      case 'admin': return { bg: '#fff7ed', color: '#c2410c', border: '#ffedd5', label: t('admin.users.roleAdmin') || 'Admin' };
      case 'doctor': return { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0', label: t('admin.users.roleDoctor') || 'Doctor' };
      case 'nurse': return { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe', label: t('admin.users.roleNurse') || 'Nurse' };
      case 'staff': return { bg: '#f5f3ff', color: '#6d28d9', border: '#ddd6fe', label: t('admin.users.roleStaff') || 'Staff' };
      case 'client': return { bg: '#f0fdfa', color: '#0f766e', border: '#99f6e4', label: t('admin.users.roleClient') || 'Client' };
      default: return { bg: '#f8fafc', color: '#475569', border: '#e2e8f0', label: t('admin.users.rolePatient') || 'Patient' };
    }
  };

  const getActionLabel = (action) => {
    return t(`admin.users.actions.${action}`) || action;
  };

  const getCategoryBadge = (category) => {
    const label = t(`admin.users.categories.${category}`) || category;
    switch (category) {
      case 'AUTH': return { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe', label };
      case 'SYSTEM_CONFIG': return { bg: '#f5f3ff', color: '#6d28d9', border: '#ddd6fe', label };
      case 'USER_MANAGEMENT': return { bg: '#fdf4ff', color: '#a21caf', border: '#f5d0fe', label };
      case 'CLINICAL_SCRIBE': return { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0', label };
      case 'TRIAGE_EMERGENCY': return { bg: '#fff1f2', color: '#be123c', border: '#fecdd3', label };
      case 'QUEUE_MANAGEMENT': return { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0', label };
      case 'RESERVATION': return { bg: '#f0f9ff', color: '#0369a1', border: '#bae6fd', label };
      case 'REPORTING': return { bg: '#fefce8', color: '#a16207', border: '#fef08a', label };
      default: return { bg: '#f8fafc', color: '#475569', border: '#e2e8f0', label };
    }
  };

  const getChannelLabel = (channel) => {
    return t(`admin.users.channels.${channel}`) || channel || 'Web';
  };

  const getStatusInfo = (status) => {
    const s = status?.toUpperCase();
    if (s === 'SUCCESS') {
      return {
        bg: '#ecfdf5',
        color: '#047857',
        border: '#a7f3d0',
        dot: '#16a34a',
        label: t('admin.users.resultSuccess') || 'Berhasil'
      };
    }
    if (s === 'WARNING') {
      return {
        bg: '#fffbeb',
        color: '#b45309',
        border: '#fde68a',
        dot: '#f59e0b',
        label: t('admin.users.resultWarning') || 'Perhatian'
      };
    }
    return {
      bg: '#fef2f2',
      color: '#b91c1c',
      border: '#fecaca',
      dot: '#ef4444',
      label: t('admin.users.resultFailed') || 'Gagal'
    };
  };

  const parseUtcDate = (isoString) => {
    if (!isoString) return null;
    let s = String(isoString).trim();
    // If no timezone offset or Z, explicitly mark as UTC
    if (!s.endsWith('Z') && !s.includes('+') && !s.includes('GMT')) {
      s += 'Z';
    }
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  };

  const formatLogTime = (isoString) => {
    if (!isoString) return '-';
    try {
      const d = parseUtcDate(isoString);
      if (!d) return isoString;
      const isEn = i18n?.language?.startsWith('en');
      // Format explicitly in Asia/Makassar (UTC+8 WITA)
      return d.toLocaleString(isEn ? 'en-US' : 'id-ID', {
        timeZone: 'Asia/Makassar',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }) + ' WITA';
    } catch {
      return isoString;
    }
  };

  const getRelativeTime = (isoString) => {
    if (!isoString) return '';
    try {
      const d = parseUtcDate(isoString);
      if (!d) return '';
      const isEn = i18n?.language?.startsWith('en');
      const diffMs = Math.max(0, Date.now() - d.getTime());
      const diffSec = Math.floor(diffMs / 1000);
      if (diffSec < 60) return isEn ? 'just now' : 'baru saja';
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return isEn ? `${diffMin}m ago` : `${diffMin}m lalu`;
      const diffHour = Math.floor(diffMin / 60);
      if (diffHour < 24) return isEn ? `${diffHour}h ago` : `${diffHour}j lalu`;
      const diffDay = Math.floor(diffHour / 24);
      return isEn ? `${diffDay}d ago` : `${diffDay}h lalu`;
    } catch {
      return '';
    }
  };

  const filteredLogs = activityLogs.filter((log) => {
    const matchRole = logRoleFilter === 'all' || log.user_role === logRoleFilter;
    const matchCat = logCategoryFilter === 'all' || log.category === logCategoryFilter;
    const s = logSearch.toLowerCase().trim();
    const actionLabel = getActionLabel(log.action).toLowerCase();
    const catLabel = getCategoryBadge(log.category).label.toLowerCase();
    const matchSearch = !s || (
      (log.user_name && log.user_name.toLowerCase().includes(s)) ||
      (log.user_email && log.user_email.toLowerCase().includes(s)) ||
      (log.action && log.action.toLowerCase().includes(s)) ||
      actionLabel.includes(s) ||
      catLabel.includes(s) ||
      (log.details && log.details.toLowerCase().includes(s)) ||
      (log.ip_address && log.ip_address.toLowerCase().includes(s))
    );
    return matchRole && matchCat && matchSearch;
  });

  // Filtered Users for User Access Governance Table
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Role Category Filter
      let matchRoleCat = true;
      const r = (u.role || '').toLowerCase();
      if (userRoleFilter === 'staff') {
        matchRoleCat = ['superadmin', 'admin', 'doctor', 'nurse', 'staff'].includes(r);
      } else if (userRoleFilter === 'client') {
        matchRoleCat = ['client', 'patient'].includes(r);
      }

      // Search Filter
      const s = userSearch.toLowerCase().trim();
      const matchSearch = !s || (
        (u.name && u.name.toLowerCase().includes(s)) ||
        (u.email && u.email.toLowerCase().includes(s)) ||
        (u.phone && String(u.phone).toLowerCase().includes(s)) ||
        (u.medical_record_no && String(u.medical_record_no).toLowerCase().includes(s)) ||
        (u.role && u.role.toLowerCase().includes(s))
      );

      return matchRoleCat && matchSearch;
    });
  }, [users, userRoleFilter, userSearch]);

  const staffCount = useMemo(() => {
    return users.filter((u) => ['superadmin', 'admin', 'doctor', 'nurse', 'staff'].includes((u.role || '').toLowerCase())).length;
  }, [users]);

  const clientCount = useMemo(() => {
    return users.filter((u) => ['client', 'patient'].includes((u.role || '').toLowerCase())).length;
  }, [users]);

  // Role Guard: SuperAdmin and Admin can access this panel
  if (user && user.role !== 'superadmin' && user.role !== 'admin') {
    return (
      <div className="animate-fade-in" style={{ maxWidth: '650px', margin: '3rem auto' }}>
        <div className="card" style={{ padding: '2.5rem 2rem', textAlign: 'center', borderTop: '4px solid #ef4444' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <ShieldCheck size={36} color="#dc2626" />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.75rem' }}>
            {t('admin.restricted.title')}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '1.75rem' }}>
            {t('admin.restricted.descPrefix')} <strong>{user?.name || user?.email}</strong> {t('admin.restricted.descMiddle')} <span style={{ textTransform: 'capitalize', fontWeight: 600, color: '#2563eb' }}>{user?.role || 'Staff'}</span>.
            {' '}{t('admin.restricted.descSuffix')}
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn-primary" onClick={() => navigate('/options')}>
              {t('admin.restricted.backHub')}
            </button>
            <button className="btn-secondary" onClick={() => navigate('/app/pengaturan')}>
              {t('admin.restricted.quotaBtn')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
            <ShieldCheck size={30} color="var(--primary-color)" />
            <span>{t('admin.title')}</span>
          </h1>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {t('admin.subtitle')}
          </p>
        </div>

        <button
          onClick={fetchAdminData}
          disabled={loading}
          className="btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          {loading ? t('admin.refreshing') : t('admin.refreshBtn')}
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            {t('admin.stats.totalUsers')}
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)', margin: '0.25rem 0' }}>
            {stats ? stats.total_users : '-'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--primary-color)' }}>
            {t('admin.stats.totalUsersSub')}
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            {t('admin.stats.totalBookings')}
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0284c7', margin: '0.25rem 0' }}>
            {stats ? stats.total_appointments : '-'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {t('admin.stats.totalBookingsSub')}
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            {t('admin.stats.totalScribe')}
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#16a34a', margin: '0.25rem 0' }}>
            {stats ? stats.total_scribe_notes : '-'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {t('admin.stats.totalScribeSub')}
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            {t('admin.stats.totalUrgent')}
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#dc2626', margin: '0.25rem 0' }}>
            {stats ? stats.total_urgent_alerts : '-'}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#dc2626' }}>
            {t('admin.stats.totalUrgentSub')}
          </div>
        </div>
      </div>

      {/* Operational Module: Manage Reservations & Queue */}
      <div 
        onClick={() => navigate('/app/ai-agent/reservasi')}
        className="card"
        style={{
          padding: '1.25rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          borderLeft: '4px solid #059669',
          transition: 'all 0.2s ease',
          background: 'linear-gradient(to right, #ffffff, #f0fdf4)',
          borderRadius: '12px',
          boxShadow: 'var(--shadow-sm)'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = 'var(--shadow-md)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'none';
          e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: '#ecfdf5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Calendar size={26} color="#059669" />
          </div>
          <div>
            <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
              {t('options.features.manageReservations.title', 'Manage Reservations & Queue')}
            </h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
              {t('options.features.manageReservations.desc', 'Papan kontrol pendaftaran loket, verifikasi pasien, dan alokasi antrean poliklinik.')}
            </p>
          </div>
        </div>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem',
          padding: '0.45rem 0.85rem',
          backgroundColor: '#059669',
          color: '#ffffff',
          borderRadius: '8px',
          fontWeight: 600,
          fontSize: '0.825rem',
          flexShrink: 0
        }}>
          {t('admin.quickJump.openPage', 'Buka Halaman')} <ArrowRight size={14} />
        </div>
      </div>

      {/* Quick Jump Tile: Model Management & AI Engine (SuperAdmin Only) */}
      {user?.role === 'superadmin' && (
        <div 
          onClick={() => navigate('/app/model-management')}
          className="card"
          style={{
            padding: '1.25rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            borderLeft: '4px solid #0284c7',
            transition: 'all 0.2s ease',
            background: 'linear-gradient(to right, #ffffff, #f0f9ff)',
            borderRadius: '12px',
            boxShadow: 'var(--shadow-sm)'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = 'var(--shadow-md)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: '#e0f2fe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Cpu size={26} color="#0284c7" />
            </div>
            <div>
              <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                {t('admin.quickJump.modelManagementTitle', 'Model Management dan AI Engine Switcher')}
              </h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                {t('admin.quickJump.modelManagementDesc', 'Kelola mesin LLM aktif Azure, Gemini, Groq serta pantau penggunaan token per faskes dan alamat IP client.')}
              </p>
            </div>
          </div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.45rem 0.85rem',
            backgroundColor: '#0284c7',
            color: '#ffffff',
            borderRadius: '8px',
            fontWeight: 600,
            fontSize: '0.825rem',
            flexShrink: 0
          }}>
            {t('admin.quickJump.openPage', 'Buka Halaman')} <ArrowRight size={14} />
          </div>
        </div>
      )}

      {/* Gateway & Connector Status */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <h3 style={{ margin: '0 0 1rem', fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Server size={20} color="#0284c7" />
          {t('admin.connectors.title')}
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <MessageSquare size={24} color="#16a34a" />
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>{t('admin.connectors.waha')}</div>
              <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>
                ● {connectors?.waha_whatsapp?.status || 'CONNECTED'} ({connectors?.waha_whatsapp?.session_name || 'default'})
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <Send size={24} color="#0284c7" />
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>{t('admin.connectors.telegram')}</div>
              <div style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: 600 }}>
                ● {connectors?.telegram_bot?.status || 'CONNECTED'} ({t('admin.connectors.telegramSub')})
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <Database size={24} color="#059669" />
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>{t('admin.connectors.database')}</div>
              <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>
                ● {connectors?.google_sheets?.status || 'SYNCED'} ({t('admin.connectors.databaseSub')})
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RBAC User Management & Track Log Card */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              {activeView === 'logs' ? <History size={20} color="var(--primary-color)" /> : <Users size={20} color="var(--primary-color)" />}
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {activeView === 'logs' ? t('admin.users.logTitle') : t('admin.users.title')}
              </h3>
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {activeView === 'logs' ? t('admin.users.logSubtitle') : t('admin.users.subtitle')}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => {
                const nextView = activeView === 'logs' ? 'users' : 'logs';
                setActiveView(nextView);
                if (nextView === 'logs' && activityLogs.length === 0) {
                  fetchActivityLogs();
                }
              }}
              className={activeView === 'logs' ? 'btn-primary' : 'btn-secondary'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
              title="Track log aktivitas setiap pengguna"
            >
              {activeView === 'logs' ? <Users size={16} /> : <History size={16} />}
              <span>{activeView === 'logs' ? t('admin.users.usersListBtn') : t('admin.users.trackLogBtn')}</span>
            </button>

            {user?.role === 'superadmin' && (
              <button
                type="button"
                onClick={() => setIsClientModalOpen(true)}
                className="btn-primary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.5rem 1rem',
                  backgroundColor: '#0f766e',
                  borderColor: '#0f766e',
                  color: '#ffffff',
                  boxShadow: '0 2px 4px rgba(15, 118, 110, 0.2)'
                }}
                title="Daftarkan akun klien baru dengan nomor WhatsApp"
              >
                <UserCheck size={16} />
                <span>{t('admin.users.addClientBtn') || 'Add Client'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}
            >
              <UserPlus size={16} />
              {t('admin.users.addUserBtn')}
            </button>
          </div>
        </div>

        {activeView === 'users' ? (
          /* User Accounts Table */
          <div>
            {/* Filter Pills & User Search Bar */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              background: '#f8fafc',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              marginBottom: '1rem'
            }}>
              {/* Role Category Tabs */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setUserRoleFilter('all')}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '6px',
                    border: '1px solid',
                    borderColor: userRoleFilter === 'all' ? 'var(--primary-color)' : '#cbd5e1',
                    background: userRoleFilter === 'all' ? '#ecfdf5' : '#ffffff',
                    color: userRoleFilter === 'all' ? '#047857' : '#475569',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {t('admin.users.filterAllUsers') || 'Semua Akun'} ({users.length})
                </button>
                <button
                  type="button"
                  onClick={() => setUserRoleFilter('staff')}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '6px',
                    border: '1px solid',
                    borderColor: userRoleFilter === 'staff' ? '#2563eb' : '#cbd5e1',
                    background: userRoleFilter === 'staff' ? '#eff6ff' : '#ffffff',
                    color: userRoleFilter === 'staff' ? '#1d4ed8' : '#475569',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {t('admin.users.filterStaffUsers') || 'Staf dan Dokter'} ({staffCount})
                </button>
                <button
                  type="button"
                  onClick={() => setUserRoleFilter('client')}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '6px',
                    border: '1px solid',
                    borderColor: userRoleFilter === 'client' ? '#0f766e' : '#cbd5e1',
                    background: userRoleFilter === 'client' ? '#f0fdfa' : '#ffffff',
                    color: userRoleFilter === 'client' ? '#0f766e' : '#475569',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {t('admin.users.filterClientUsers') || 'Klien dan Pasien'} ({clientCount})
                </button>
              </div>

              {/* User Search Input */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: '#ffffff',
                padding: '0.45rem 0.75rem',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                flex: '1 1 220px',
                maxWidth: '320px'
              }}>
                <Search size={15} color="#94a3b8" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Cari nama, email, no HP, role..."
                  style={{
                    border: 'none',
                    outline: 'none',
                    fontSize: '0.825rem',
                    width: '100%',
                    background: 'transparent'
                  }}
                />
              </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600 }}>{t('admin.users.colName')}</th>
                    <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600 }}>{t('admin.users.colEmail')}</th>
                    <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600 }}>{t('admin.users.colPhone') || 'Nomor WhatsApp'}</th>
                    <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600 }}>{t('admin.users.colRole')}</th>
                    <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600 }}>{t('admin.users.colStatus')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#64748b' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
                          <Users size={22} color="#94a3b8" />
                        </div>
                        <div style={{ fontWeight: 600, fontSize: '0.925rem', color: '#334155' }}>
                          {t('admin.users.noUsersFound') || 'Belum ada akun pengguna yang cocok.'}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const badge = getUserRoleBadge(u.role);
                      return (
                        <tr key={u.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--text-main)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                              <span>{u.name}</span>
                              {u.medical_record_no && (
                                <span style={{
                                  fontSize: '0.7rem',
                                  padding: '0.1rem 0.45rem',
                                  borderRadius: '4px',
                                  background: '#f1f5f9',
                                  color: '#475569',
                                  border: '1px solid #e2e8f0'
                                }}>
                                  {u.medical_record_no}
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>{u.email}</td>
                          <td style={{ padding: '0.75rem 1rem', color: '#334155' }}>
                            {u.phone ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#0f766e', fontWeight: 500 }}>
                                <Phone size={13} color="#059669" />
                                {u.phone}
                              </span>
                            ) : (
                              <span style={{ color: '#94a3b8' }}>-</span>
                            )}
                          </td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <span style={{ display: 'inline-block', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>
                              {badge.label}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: u.is_active !== false ? '#16a34a' : '#94a3b8', fontWeight: 600, fontSize: '0.8rem' }}>
                              ● {u.is_active !== false ? t('admin.users.statusActive') : t('admin.users.statusInactive')}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* User Activity Track Log Table View */
          <div>
            {/* Toolbar: Search, Category, Role Filter & Refresh */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              background: '#f8fafc',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              marginBottom: '1rem'
            }}>
              {/* Search Box */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: '#ffffff',
                padding: '0.45rem 0.75rem',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                flex: '1 1 240px',
                maxWidth: '360px'
              }}>
                <Search size={15} color="#94a3b8" />
                <input
                  type="text"
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  placeholder={t('admin.users.searchLogPlaceholder')}
                  style={{
                    border: 'none',
                    outline: 'none',
                    fontSize: '0.85rem',
                    width: '100%',
                    background: 'transparent'
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                {/* Category Filter */}
                <select
                  value={logCategoryFilter}
                  onChange={(e) => setLogCategoryFilter(e.target.value)}
                  style={{
                    padding: '0.45rem 0.75rem',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.825rem',
                    background: '#ffffff',
                    color: '#334155',
                    cursor: 'pointer'
                  }}
                >
                  <option value="all">{t('admin.users.allCategories')}</option>
                  <option value="AUTH">{t('admin.users.categories.AUTH')}</option>
                  <option value="SYSTEM_CONFIG">{t('admin.users.categories.SYSTEM_CONFIG')}</option>
                  <option value="USER_MANAGEMENT">{t('admin.users.categories.USER_MANAGEMENT')}</option>
                  <option value="CLINICAL_SCRIBE">{t('admin.users.categories.CLINICAL_SCRIBE')}</option>
                  <option value="TRIAGE_EMERGENCY">{t('admin.users.categories.TRIAGE_EMERGENCY')}</option>
                  <option value="QUEUE_MANAGEMENT">{t('admin.users.categories.QUEUE_MANAGEMENT')}</option>
                  <option value="RESERVATION">{t('admin.users.categories.RESERVATION')}</option>
                  <option value="PATIENT_PORTAL">{t('admin.users.categories.PATIENT_PORTAL')}</option>
                  <option value="REPORTING">{t('admin.users.categories.REPORTING')}</option>
                </select>

                {/* Role Filter */}
                <select
                  value={logRoleFilter}
                  onChange={(e) => setLogRoleFilter(e.target.value)}
                  style={{
                    padding: '0.45rem 0.75rem',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.825rem',
                    background: '#ffffff',
                    color: '#334155',
                    cursor: 'pointer'
                  }}
                >
                  <option value="all">{t('admin.users.allRoles')}</option>
                  <option value="superadmin">{t('admin.users.roleSuperadmin')}</option>
                  <option value="admin">{t('admin.users.roleAdmin')}</option>
                  <option value="doctor">{t('admin.users.roleDoctor')}</option>
                  <option value="nurse">{t('admin.users.roleNurse')}</option>
                  <option value="staff">{t('admin.users.roleStaff')}</option>
                  <option value="patient">{t('admin.users.rolePatient')}</option>
                </select>

                {/* Refresh Button */}
                <button
                  type="button"
                  onClick={fetchActivityLogs}
                  className="btn-secondary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0.55rem',
                    cursor: 'pointer'
                  }}
                  title="Refresh log aktivitas"
                  aria-label="Refresh log aktivitas"
                >
                  <RefreshCw size={14} className={loadingLogs ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            {/* Activity Logs Table: Compact 4-column layout without horizontal scroll */}
            <div style={{ width: '100%', overflowX: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', tableLayout: 'fixed' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: '0.75rem 0.85rem', color: '#475569', fontWeight: 600, width: '22%' }}>
                      {t('admin.users.colTime')}
                    </th>
                    <th style={{ padding: '0.75rem 0.85rem', color: '#475569', fontWeight: 600, width: '28%' }}>
                      {t('admin.users.colUserRole')}
                    </th>
                    <th style={{ padding: '0.75rem 0.85rem', color: '#475569', fontWeight: 600, width: '38%' }}>
                      {t('admin.users.colActivity')}
                    </th>
                    <th style={{ padding: '0.75rem 0.85rem', color: '#475569', fontWeight: 600, width: '12%', textAlign: 'center' }}>
                      {t('admin.users.colResult', 'Hasil')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ padding: '3rem 1rem', textAlign: 'center', color: '#64748b' }}>
                        <AlertCircle size={24} style={{ margin: '0 auto 0.5rem', opacity: 0.6 }} />
                        <div style={{ fontWeight: 600 }}>{t('admin.users.noLogsFound')}</div>
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => {
                      const roleBadge = getUserRoleBadge(log.user_role);
                      const catBadge = getCategoryBadge(log.category);
                      const statusInfo = getStatusInfo(log.status);

                      return (
                        <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9', verticalAlign: 'top' }}>
                          {/* 1. Time (UTC+8 WITA) */}
                          <td style={{ padding: '0.85rem 0.85rem' }}>
                            <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.825rem', lineHeight: 1.3 }}>
                              {formatLogTime(log.created_at)}
                            </div>
                            <div style={{ fontSize: '0.73rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                              {getRelativeTime(log.created_at)}
                            </div>
                          </td>

                          {/* 2. User & Role (No [] brackets!) */}
                          <td style={{ padding: '0.85rem 0.85rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.85rem' }}>
                                {log.user_name}
                              </span>
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '0.15rem 0.5rem',
                                borderRadius: '9999px',
                                fontSize: '0.72rem',
                                fontWeight: 600,
                                background: roleBadge.bg,
                                color: roleBadge.color,
                                border: `1px solid ${roleBadge.border}`
                              }}>
                                {roleBadge.label}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', wordBreak: 'break-all' }}>
                              {log.user_email}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.15rem' }}>
                              {getChannelLabel(log.channel)} • <span style={{ fontFamily: 'monospace' }}>{log.ip_address || '127.0.0.1'}</span>
                            </div>
                          </td>

                          {/* 3. Activity & Details (No [] brackets!) */}
                          <td style={{ padding: '0.85rem 0.85rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap', marginBottom: '0.3rem' }}>
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '0.15rem 0.45rem',
                                borderRadius: '4px',
                                fontSize: '0.72rem',
                                fontWeight: 600,
                                background: catBadge.bg,
                                color: catBadge.color,
                                border: `1px solid ${catBadge.border}`
                              }}>
                                {catBadge.label}
                              </span>
                              <span style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.84rem' }}>
                                {getActionLabel(log.action)}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.45, wordBreak: 'break-word' }}>
                              {log.details}
                            </div>
                          </td>

                          {/* 4. Result Status */}
                          <td style={{ padding: '0.85rem 0.85rem', textAlign: 'center' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              padding: '0.2rem 0.6rem',
                              borderRadius: '9999px',
                              fontSize: '0.73rem',
                              fontWeight: 600,
                              background: statusInfo.bg,
                              color: statusInfo.color,
                              border: `1px solid ${statusInfo.border}`,
                              whiteSpace: 'nowrap'
                            }}>
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: statusInfo.dot }} />
                              {statusInfo.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '480px', padding: '2rem' }}>
            <h3 style={{ margin: '0 0 1.25rem', fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {t('admin.users.modalTitle')}
            </h3>
            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  {t('admin.users.nameLabel')}
                </label>
                <input
                  type="text"
                  required
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid var(--border-color)', outline: 'none' }}
                  placeholder={t('admin.users.namePlaceholder')}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  {t('admin.users.emailLabel')}
                </label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid var(--border-color)', outline: 'none' }}
                  placeholder={t('admin.users.emailPlaceholder')}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  {t('admin.users.passwordLabel')}
                </label>
                <input
                  type="password"
                  required
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid var(--border-color)', outline: 'none' }}
                  placeholder={t('admin.users.passwordPlaceholder')}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  {t('admin.users.roleLabel')}
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid var(--border-color)', outline: 'none', background: '#ffffff' }}
                >
                  <option value="superadmin">{t('admin.users.roleSuperadmin')}</option>
                  <option value="admin">{t('admin.users.roleAdmin')}</option>
                  <option value="doctor">{t('admin.users.roleDoctor')}</option>
                  <option value="nurse">{t('admin.users.roleNurse')}</option>
                  <option value="staff">{t('admin.users.roleStaff')}</option>
                  <option value="patient">{t('admin.users.rolePatient')}</option>
                  <option value="client">{t('admin.users.roleClient') || 'Client'}</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary"
                  style={{ padding: '0.55rem 1rem' }}
                >
                  {t('admin.users.cancelBtn')}
                </button>
                <button
                  type="submit"
                  disabled={isCreatingUser}
                  className="btn-primary"
                  style={{ padding: '0.55rem 1.25rem' }}
                >
                  {isCreatingUser ? t('admin.users.creating') : t('admin.users.submitBtn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Client Modal */}
      {isClientModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '500px', padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#f0fdfa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UserCheck size={20} color="#0f766e" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  {t('admin.users.clientModalTitle') || 'Daftarkan Akun Klien Baru'}
                </h3>
                <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                  Klien terintegrasi dengan nomor WhatsApp untuk pengingat jadwal dan portal pasien.
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateClient} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  {t('admin.users.nameLabel')} <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newClient.name}
                  onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid var(--border-color)', outline: 'none' }}
                  placeholder="Contoh: Budi Santoso"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  {t('admin.users.emailLabel')} <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="email"
                  required
                  value={newClient.email}
                  onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid var(--border-color)', outline: 'none' }}
                  placeholder="client@gmail.com"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  {t('admin.users.clientPhoneLabel') || 'Nomor WhatsApp'} <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <Phone size={16} color="#94a3b8" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="tel"
                    required
                    value={newClient.phone}
                    onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.75rem 0.65rem 2.25rem', borderRadius: '6px', border: '1px solid var(--border-color)', outline: 'none' }}
                    placeholder="Contoh: 6281234567890"
                  />
                </div>
                <span style={{ fontSize: '0.725rem', color: '#64748b', marginTop: '0.25rem', display: 'block' }}>
                  Gunakan format internasional tanpa spasi contoh 6281234567890 untuk notifikasi WhatsApp.
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  {t('admin.users.clientMrnLabel') || 'Nomor Rekam Medis'}
                </label>
                <input
                  type="text"
                  value={newClient.medical_record_no}
                  onChange={(e) => setNewClient({ ...newClient, medical_record_no: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid var(--border-color)', outline: 'none' }}
                  placeholder="Opsional, contoh: RM-2026-001"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  {t('admin.users.passwordLabel')} <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="password"
                  required
                  value={newClient.password}
                  onChange={(e) => setNewClient({ ...newClient, password: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid var(--border-color)', outline: 'none' }}
                  placeholder="Min 6 karakter"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setIsClientModalOpen(false)}
                  className="btn-secondary"
                  style={{ padding: '0.55rem 1rem' }}
                >
                  {t('admin.users.cancelBtn')}
                </button>
                <button
                  type="submit"
                  disabled={isCreatingClient}
                  className="btn-primary"
                  style={{
                    padding: '0.55rem 1.25rem',
                    backgroundColor: '#0f766e',
                    borderColor: '#0f766e',
                    color: '#ffffff'
                  }}
                >
                  {isCreatingClient ? t('admin.users.creating') : (t('admin.users.submitClientBtn') || 'Simpan Klien')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default SuperAdmin;
