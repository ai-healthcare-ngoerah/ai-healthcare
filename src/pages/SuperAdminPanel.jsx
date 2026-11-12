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

const SuperAdminPanel = () => {
  const { t, i18n } = useTranslation();
  const { showToast } = useNotification();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [connectors, setConnectors] = useState(null);
  const [loading, setLoading] = useState(true);

  // View state: 'clients' or 'logs'
  const [activeView, setActiveView] = useState('clients');
  const [activityLogs, setActivityLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logSearch, setLogSearch] = useState('');
  const [logCategoryFilter, setLogCategoryFilter] = useState('all');
  const [logRoleFilter, setLogRoleFilter] = useState('all');

  // Client Search State
  const [clientSearch, setClientSearch] = useState('');

  // Add Client Modal State
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
        setActivityLogs(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error('Failed to fetch activity logs', e);
    } finally {
      setLoadingLogs(false);
    }
  };

  const fetchSuperAdminData = async () => {
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
      console.error('fetchSuperAdminData network error:', err);
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
    fetchSuperAdminData();
  }, []);

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
          title: 'Akun klien berhasil didaftarkan',
          message: `${newClient.name} - ${newClient.email}`
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
        fetchSuperAdminData();
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

  // Filter clients specifically for the SaaS Client Management view
  const clientUsers = useMemo(() => {
    return users.filter((u) => {
      const r = (u.role || '').toLowerCase();
      const isClientRole = r === 'client';
      if (!isClientRole) return false;

      const s = clientSearch.toLowerCase().trim();
      if (!s) return true;

      return (
        (u.name && u.name.toLowerCase().includes(s)) ||
        (u.email && u.email.toLowerCase().includes(s)) ||
        (u.phone && String(u.phone).toLowerCase().includes(s)) ||
        (u.medical_record_no && String(u.medical_record_no).toLowerCase().includes(s))
      );
    });
  }, [users, clientSearch]);

  const totalClientsCount = useMemo(() => {
    return users.filter((u) => (u.role || '').toLowerCase() === 'client').length;
  }, [users]);

  const getUserRoleBadge = (role) => {
    switch (role?.toLowerCase()) {
      case 'superadmin': return { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca', label: 'SuperAdmin' };
      case 'admin': return { bg: '#fff7ed', color: '#c2410c', border: '#ffedd5', label: 'Admin' };
      case 'doctor': return { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0', label: 'Doctor' };
      case 'nurse': return { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe', label: 'Nurse' };
      case 'staff': return { bg: '#f5f3ff', color: '#6d28d9', border: '#ddd6fe', label: 'Staff' };
      case 'client': return { bg: '#f0fdfa', color: '#0f766e', border: '#99f6e4', label: 'Client' };
      default: return { bg: '#f8fafc', color: '#475569', border: '#e2e8f0', label: 'Patient' };
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
        label: 'Berhasil'
      };
    }
    if (s === 'WARNING') {
      return {
        bg: '#fffbeb',
        color: '#b45309',
        border: '#fde68a',
        dot: '#f59e0b',
        label: 'Perhatian'
      };
    }
    return {
      bg: '#fef2f2',
      color: '#b91c1c',
      border: '#fecaca',
      dot: '#ef4444',
      label: 'Gagal'
    };
  };

  const parseUtcDate = (isoString) => {
    if (!isoString) return null;
    let s = String(isoString).trim();
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

  // Role Guard: Strictly SuperAdmin Only
  if (user && user.role !== 'superadmin') {
    return (
      <div className="animate-fade-in" style={{ maxWidth: '650px', margin: '3rem auto' }}>
        <div className="card" style={{ padding: '2.5rem 2rem', textAlign: 'center', borderTop: '4px solid #ef4444' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <ShieldCheck size={36} color="#dc2626" />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.75rem' }}>
            Akses Dibatasi Khusus SuperAdmin
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '1.75rem' }}>
            Halaman ini dikhususkan bagi penyedia platform SaaS AI untuk mengelola akun klien dan log aktivitas platform.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn-primary" onClick={() => navigate('/options')}>
              Kembali ke Menu Utama
            </button>
            <button className="btn-secondary" onClick={() => navigate('/app/admin')}>
              Buka Admin Panel
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
            <ShieldCheck size={30} color="#dc2626" />
            <span>Superadmin Panel</span>
          </h1>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Pusat tata kelola penyedia layanan SaaS AI, manajemen akun klien mitra, dan audit trail aktivitas platform.
          </p>
        </div>

        <button
          onClick={fetchSuperAdminData}
          disabled={loading}
          className="btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Memuat Data...' : 'Segarkan Data'}
        </button>
      </div>

      {/* Metric Cards Grid - Matching Admin Panel Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            Total Klien Terdaftar
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f766e', margin: '0.25rem 0' }}>
            {totalClientsCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#0f766e' }}>
            Akun klien fasilitas kesehatan aktif
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            Total Reservasi Sistem
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0284c7', margin: '0.25rem 0' }}>
            {stats ? stats.total_appointments : '-'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Akumulasi transaksi booking pasien
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            Total Catatan Scribe
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#16a34a', margin: '0.25rem 0' }}>
            {stats ? stats.total_scribe_notes : '-'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Dokumen medis terproses otomatis
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            Peringatan Darurat
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#dc2626', margin: '0.25rem 0' }}>
            {stats ? stats.total_urgent_alerts : '-'}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#dc2626' }}>
            Eskalasi kondisi pasien terdeteksi
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
              Manage Reservations & Queue
            </h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
              Papan kontrol pendaftaran loket, verifikasi pasien, dan alokasi antrean poliklinik faskes.
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
          Buka Halaman <ArrowRight size={14} />
        </div>
      </div>

      {/* Quick Jump Tile: Model Management & AI Engine */}
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
              Model Management dan AI Engine Switcher
            </h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
              Kelola mesin LLM aktif Azure, Gemini, Groq serta pantau penggunaan token per faskes dan alamat IP client.
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
          Buka Halaman <ArrowRight size={14} />
        </div>
      </div>

      {/* Gateway & Connector Status */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <h3 style={{ margin: '0 0 1rem', fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Server size={20} color="#0284c7" />
          Status Konektor Gateway Resmi
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <MessageSquare size={24} color="#16a34a" />
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>WhatsApp Gateway Resmi</div>
              <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>
                ● {connectors?.waha_whatsapp?.status || 'CONNECTED'} - Sesi {connectors?.waha_whatsapp?.session_name || 'Ternak-Automation'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <Send size={24} color="#0284c7" />
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>Telegram Bot Channel</div>
              <div style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: 600 }}>
                ● {connectors?.telegram_bot?.status || 'CONNECTED'} - Bot Notifikasi
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <Database size={24} color="#059669" />
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>Sinkronisasi Database</div>
              <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>
                ● {connectors?.google_sheets?.status || 'SYNCED'} - Sinkron Database Cloud
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main SaaS Platform Management Card */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              {activeView === 'logs' ? <History size={20} color="var(--primary-color)" /> : <UserCheck size={20} color="#0f766e" />}
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {activeView === 'logs' ? 'Activity History - Audit Trail Platform' : 'Tata Kelola Klien SaaS AI'}
              </h3>
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {activeView === 'logs' 
                ? 'Pemantauan komprehensif riwayat aksi staf dan sistem secara real-time.' 
                : 'Kelola akun fasilitas kesehatan mitra yang berlangganan dan menggunakan layanan AI.'
              }
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => {
                const nextView = activeView === 'logs' ? 'clients' : 'logs';
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
              title="Beralih antara daftar klien dan riwayat aktivitas"
            >
              {activeView === 'logs' ? <Users size={16} /> : <History size={16} />}
              <span>{activeView === 'logs' ? 'Daftar Klien SaaS' : 'Activity History'}</span>
            </button>

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
              <span>Add Client</span>
            </button>
          </div>
        </div>

        {activeView === 'clients' ? (
          /* Client Accounts Table */
          <div>
            {/* Toolbar: Search and Counter */}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  background: '#f0fdfa',
                  color: '#0f766e',
                  border: '1px solid #99f6e4',
                  fontSize: '0.8rem',
                  fontWeight: 700
                }}>
                  Total Klien Mitra: {totalClientsCount}
                </span>
              </div>

              {/* Client Search Input */}
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
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  placeholder="Cari nama klien, email, no WhatsApp..."
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
                    <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600 }}>Nama Klien Mitra</th>
                    <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600 }}>Email Akun</th>
                    <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600 }}>Nomor WhatsApp Resmi</th>
                    <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600 }}>Peran Akses</th>
                    <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600 }}>Status Akun</th>
                  </tr>
                </thead>
                <tbody>
                  {clientUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#64748b' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
                          <UserCheck size={22} color="#94a3b8" />
                        </div>
                        <div style={{ fontWeight: 600, fontSize: '0.925rem', color: '#334155' }}>
                          Belum ada akun klien faskes yang cocok dengan pencarian.
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                          Klik tombol Add Client untuk mendaftarkan klien baru.
                        </div>
                      </td>
                    </tr>
                  ) : (
                    clientUsers.map((u) => {
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
                                  background: '#f0fdfa',
                                  color: '#0f766e',
                                  border: '1px solid #99f6e4'
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
                              ● {u.is_active !== false ? 'Aktif' : 'Tidak Aktif'}
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
                  placeholder="Cari user, aksi, detail, alamat IP..."
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
                  <option value="all">Semua Kategori</option>
                  <option value="AUTH">Autentikasi</option>
                  <option value="SYSTEM_CONFIG">Konfigurasi Sistem</option>
                  <option value="USER_MANAGEMENT">Manajemen Pengguna</option>
                  <option value="CLINICAL_SCRIBE">Scribe Klinis</option>
                  <option value="TRIAGE_EMERGENCY">Triage Darurat</option>
                  <option value="QUEUE_MANAGEMENT">Manajemen Antrean</option>
                  <option value="RESERVATION">Reservasi</option>
                  <option value="PATIENT_PORTAL">Portal Pasien</option>
                  <option value="REPORTING">Laporan</option>
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
                  <option value="all">Semua Peran</option>
                  <option value="superadmin">SuperAdmin</option>
                  <option value="admin">Admin</option>
                  <option value="client">Client</option>
                  <option value="doctor">Dokter</option>
                  <option value="nurse">Perawat</option>
                  <option value="staff">Staf</option>
                  <option value="patient">Pasien</option>
                </select>

                {/* Refresh Button */}
                <button
                  type="button"
                  onClick={fetchActivityLogs}
                  className="btn-secondary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.45rem 0.75rem',
                    fontSize: '0.825rem',
                    cursor: 'pointer'
                  }}
                  title="Segarkan log aktivitas"
                >
                  <RefreshCw size={13} className={loadingLogs ? 'animate-spin' : ''} />
                  <span>Segarkan</span>
                </button>
              </div>
            </div>

            {/* Activity Logs Table */}
            <div style={{ width: '100%', overflowX: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', tableLayout: 'fixed' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: '0.75rem 0.85rem', color: '#475569', fontWeight: 600, width: '22%' }}>
                      Waktu Transaksi
                    </th>
                    <th style={{ padding: '0.75rem 0.85rem', color: '#475569', fontWeight: 600, width: '28%' }}>
                      Pengguna dan Peran
                    </th>
                    <th style={{ padding: '0.75rem 0.85rem', color: '#475569', fontWeight: 600, width: '38%' }}>
                      Aktivitas dan Detail
                    </th>
                    <th style={{ padding: '0.75rem 0.85rem', color: '#475569', fontWeight: 600, width: '12%', textAlign: 'center' }}>
                      Hasil
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ padding: '3rem 1rem', textAlign: 'center', color: '#64748b' }}>
                        <AlertCircle size={24} style={{ margin: '0 auto 0.5rem', opacity: 0.6 }} />
                        <div style={{ fontWeight: 600 }}>Belum ada log aktivitas yang tercatat.</div>
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => {
                      const roleBadge = getUserRoleBadge(log.user_role);
                      const catBadge = getCategoryBadge(log.category);
                      const statusInfo = getStatusInfo(log.status);

                      return (
                        <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9', verticalAlign: 'top' }}>
                          {/* 1. Time WITA */}
                          <td style={{ padding: '0.85rem 0.85rem' }}>
                            <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.825rem', lineHeight: 1.3 }}>
                              {formatLogTime(log.created_at)}
                            </div>
                            <div style={{ fontSize: '0.73rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                              {getRelativeTime(log.created_at)}
                            </div>
                          </td>

                          {/* 2. User & Role */}
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

                          {/* 3. Activity & Details */}
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

      {/* Add Client Modal - Matching Admin Panel Modal Styling */}
      {isClientModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '500px', padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#f0fdfa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UserCheck size={20} color="#0f766e" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Daftarkan Akun Klien Baru
                </h3>
                <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                  Klien faskes terintegrasi dengan nomor WhatsApp resmi untuk pengingat jadwal dan portal pasien.
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateClient} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Nama Lengkap atau Faskes <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newClient.name}
                  onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid var(--border-color)', outline: 'none' }}
                  placeholder="Contoh: Klinik Pratama Sehat"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Alamat Email Klien <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="email"
                  required
                  value={newClient.email}
                  onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid var(--border-color)', outline: 'none' }}
                  placeholder="client@faskes.com"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Nomor WhatsApp Resmi <span style={{ color: '#ef4444' }}>*</span>
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
                  Gunakan format internasional tanpa spasi contoh 6281234567890 untuk integrasi WhatsApp.
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Nomor Kontrak atau Rekam Medis
                </label>
                <input
                  type="text"
                  value={newClient.medical_record_no}
                  onChange={(e) => setNewClient({ ...newClient, medical_record_no: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid var(--border-color)', outline: 'none' }}
                  placeholder="Opsional, contoh: KONTRAK-2026-001"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Kata Sandi Akun <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="password"
                  required
                  value={newClient.password}
                  onChange={(e) => setNewClient({ ...newClient, password: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid var(--border-color)', outline: 'none' }}
                  placeholder="Minimal 6 karakter"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setIsClientModalOpen(false)}
                  className="btn-secondary"
                  style={{ padding: '0.55rem 1rem' }}
                >
                  Batal
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
                  {isCreatingClient ? 'Menyimpan...' : 'Simpan Klien'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default SuperAdminPanel;
