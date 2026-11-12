import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft, LogOut, User, ChevronDown, Globe,
  LogIn, ArrowUpRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Options.css';

const Options = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // User role evaluation
  const role = user?.role;
  const isAuthenticated = Boolean(user && user.role);

  const isSuperAdmin = role === 'superadmin';
  const isAdmin = role === 'admin';
  const isDoctor = role === 'doctor';
  const isNurse = role === 'nurse';
  const isStaff = role === 'staff';
  const isPatient = role === 'patient';
  const isGuest = !isAuthenticated;

  // Role Badge Styling Helper
  const getRoleBadge = (r) => {
    switch (r) {
      case 'superadmin':
        return { label: t('options.roles.superadmin', 'SuperAdmin'), bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' };
      case 'admin':
        return { label: t('options.roles.admin', 'Administrator'), bg: '#fff7ed', color: '#c2410c', border: '#ffedd5' };
      case 'doctor':
        return { label: t('options.roles.doctor', 'Dokter Spesialis'), bg: '#ecfdf5', color: '#047857', border: '#a7f3d0' };
      case 'nurse':
        return { label: t('options.roles.nurse', 'Perawat'), bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' };
      case 'staff':
        return { label: t('options.roles.staff', 'Staf Pendaftaran'), bg: '#f5f3ff', color: '#6d28d9', border: '#ddd6fe' };
      case 'patient':
        return { label: t('options.roles.patient', 'Pasien'), bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' };
      default:
        return { label: t('options.roles.guest', 'Tamu'), bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' };
    }
  };

  const allOptions = [
    // 1. Asisten Medis / Scribe - Clinical
    {
      id: 'medical-records',
      badge: t('options.features.medicalRecords.badge', 'Klinis'),
      title: t('options.features.medicalRecords.title', 'Rekam Medis & Asisten Klinis'),
      icon: <img src="/illustrations/medical-scribe.svg" alt={t('options.features.medicalRecords.title')} className="option-icon-img" />,
      iconBg: '#ecfdf5',
      iconBorder: 'rgba(5, 150, 105, 0.2)',
      badgeBg: '#ecfdf5',
      badgeColor: '#047857',
      path: '/app/asisten-medis',
      visible: isSuperAdmin || isAdmin || isDoctor || isNurse
    },
    // 2. Loket Admission & Antrean Pasien - Front-Desk Operations
    {
      id: 'manage-reservations',
      badge: t('options.features.manageReservations.badge', 'Operasional'),
      title: t('options.features.manageReservations.title', 'Loket Admission & Antrean'),
      icon: <img src="/illustrations/medical-chatbot.svg" alt={t('options.features.manageReservations.title')} className="option-icon-img" />,
      iconBg: '#f0fdf4',
      iconBorder: 'rgba(5, 150, 105, 0.2)',
      badgeBg: '#f0fdf4',
      badgeColor: '#15803d',
      path: '/app/ai-agent/reservasi',
      visible: isSuperAdmin || isAdmin || isStaff || isNurse
    },
    // 2b. Hubungkan Reservasi - Gateway Integration
    {
      id: 'connect-reservation',
      badge: t('options.features.connectReservation.badge', 'Gateway'),
      title: t('options.features.connectReservation.title', 'Connect & Saluran Reservasi'),
      icon: <img src="/icons/Connect.webp" alt={t('options.features.connectReservation.title')} className="option-icon-img" />,
      iconBg: '#ecfdf5',
      iconBorder: 'rgba(5, 150, 105, 0.2)',
      badgeBg: '#ecfdf5',
      badgeColor: '#047857',
      path: '/app/connect-reservation?tab=channels',
      visible: isSuperAdmin || isAdmin || isStaff
    },
    // 3. Reservasi Pasien Mandiri - Kiosk / Pasien
    {
      id: 'reservation-booking',
      badge: t('options.features.reservation.badge', 'Mandiri'),
      title: t('options.features.reservation.title', 'Reservasi Pasien'),
      icon: <img src="/icons/patient.png" alt={t('options.features.reservation.title')} className="option-icon-img" />,
      iconBg: '#f0fdf4',
      iconBorder: 'rgba(5, 150, 105, 0.2)',
      badgeBg: '#f0fdf4',
      badgeColor: '#15803d',
      path: '/reservasi',
      visible: isSuperAdmin || isAdmin || isNurse || isStaff || isPatient || isGuest
    },
    // 4. Antrean Rawat Jalan - Public & All Roles
    {
      id: 'antrean-rawat-jalan',
      badge: t('options.features.rawatJalan.badge', 'Antrean'),
      title: t('options.features.rawatJalan.title', 'Antrean Rawat Jalan'),
      icon: <img src="/icons/Outpatient.webp" alt={t('options.features.rawatJalan.title')} className="option-icon-img" />,
      iconBg: '#ecfdf5',
      iconBorder: 'rgba(5, 150, 105, 0.2)',
      badgeBg: '#ecfdf5',
      badgeColor: '#047857',
      path: '/app/antrean/rawat-jalan',
      visible: true
    },
    // 5. Antrean Rawat Inap - Public & All Roles
    {
      id: 'antrean-rawat-inap',
      badge: t('options.features.rawatInap.badge', 'Rawat Inap'),
      title: t('options.features.rawatInap.title', 'Antrean Rawat Inap'),
      icon: <img src="/icons/Inpatient.webp" alt={t('options.features.rawatInap.title')} className="option-icon-img" />,
      iconBg: '#f5f3ff',
      iconBorder: 'rgba(109, 40, 217, 0.15)',
      badgeBg: '#f5f3ff',
      badgeColor: '#6d28d9',
      path: '/app/antrean/rawat-inap',
      visible: true
    },
    // 6. Jadwal Dokter - Public & All Roles
    {
      id: 'jadwal-dokter',
      badge: t('options.features.jadwalDokter.badge', 'Jadwal'),
      title: t('options.features.jadwalDokter.title', 'Jadwal Dokter'),
      icon: <img src="/icons/Schedule.webp" alt={t('options.features.jadwalDokter.title')} className="option-icon-img" />,
      iconBg: '#f0f9ff',
      iconBorder: 'rgba(2, 132, 199, 0.15)',
      badgeBg: '#f0f9ff',
      badgeColor: '#0284c7',
      path: '/app/jadwal-dokter',
      visible: true
    },
    // 7. Dashboard Analisis - Healthcare Data Science
    {
      id: 'dashboard-analysis',
      badge: t('options.features.dashboardAnalysis.badge', 'Data Sains'),
      title: t('options.features.dashboardAnalysis.title', 'Dashboard Analisis'),
      icon: <img src="/icons/Analytics.svg" alt={t('options.features.dashboardAnalysis.title', 'Dashboard Analisis')} className="option-icon-img" />,
      iconBg: '#eff6ff',
      iconBorder: 'rgba(37, 99, 235, 0.2)',
      badgeBg: '#eff6ff',
      badgeColor: '#1d4ed8',
      path: '/app/dashboard-analisis',
      visible: isSuperAdmin || isAdmin || isDoctor || isStaff || isNurse
    },
    // 8. Admin Panel
    {
      id: 'admin-panel',
      badge: t('options.features.adminPanel.badge', 'Sistem'),
      title: t('options.features.adminPanel.title', 'Admin Panel'),
      icon: <img src="/icons/Admin.webp" alt={t('options.features.adminPanel.title')} className="option-icon-img" />,
      iconBg: '#ecfdf5',
      iconBorder: 'rgba(5, 150, 105, 0.2)',
      badgeBg: '#ecfdf5',
      badgeColor: '#047857',
      path: '/app/admin',
      visible: isAdmin && !isSuperAdmin
    },
    // 8. Superadmin Panel
    {
      id: 'superadmin-panel',
      badge: t('options.features.superadminPanel.badge', 'SaaS'),
      title: t('options.features.superadminPanel.title', 'Superadmin Panel'),
      icon: <img src="/icons/Admin.webp" alt={t('options.features.superadminPanel.title')} className="option-icon-img" />,
      iconBg: '#fef2f2',
      iconBorder: 'rgba(220, 38, 38, 0.15)',
      badgeBg: '#fef2f2',
      badgeColor: '#b91c1c',
      path: '/app/superadmin',
      visible: isSuperAdmin
    }
  ];

  const options = allOptions.filter(opt => opt.visible);

  return (
    <div className="options-page">
      <div className="options-top-bar">
        <button className="btn-back" style={{ margin: 0 }} onClick={() => navigate('/')}>
          <ArrowLeft size={20} /> {t('options.back')}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: 'auto' }}>
          {isAuthenticated ? (
            <div className="user-profile" style={{ position: 'relative' }} ref={dropdownRef}>
              <button
                className="options-user-btn"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  background: 'white', border: '1px solid var(--border-color)',
                  padding: '0.45rem 0.95rem', borderRadius: 'var(--radius-full)',
                  cursor: 'pointer', fontWeight: 500, color: 'var(--text-main)',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}
              >
                <div style={{ background: 'var(--primary-color)', color: 'white', padding: '0.25rem', borderRadius: '50%', display: 'flex' }}>
                  <User size={15} />
                </div>
                <span className="options-user-name" style={{ fontWeight: 600 }}>
                  {user?.name || user?.email?.split('@')[0]}
                </span>
                <ChevronDown size={15} color="var(--text-muted)" style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>

              {isDropdownOpen && (
                <div style={{
                  position: 'absolute', top: '120%', right: 0,
                  background: 'white', border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)', padding: '0.5rem',
                  minWidth: '220px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  zIndex: 100
                }}>
                  <div style={{ padding: '0.65rem 0.75rem', borderBottom: '1px solid var(--border-color)', marginBottom: '0.5rem' }}>
                    <p style={{ fontWeight: 600, margin: '0 0 0.35rem 0', fontSize: '0.875rem', color: '#0f172a' }}>
                      {user?.name || 'System Administrator'}
                    </p>
                    {/* Role badge placed strictly below user name inside the dropdown */}
                    {role && (
                      <div style={{ marginBottom: '0.35rem' }}>
                        <span className="options-role-badge" style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '9999px',
                          backgroundColor: getRoleBadge(role).bg,
                          color: getRoleBadge(role).color,
                          border: `1px solid ${getRoleBadge(role).border}`,
                          letterSpacing: '0.02em',
                          display: 'inline-block'
                        }}>
                          {getRoleBadge(role).label}
                        </span>
                      </div>
                    )}
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</p>
                  </div>
                  <button
                    onClick={() => i18n.changeLanguage(i18n.language === 'en' ? 'id' : 'en')}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      background: 'none', border: 'none', color: 'var(--text-main)',
                      cursor: 'pointer', fontWeight: 500, width: '100%',
                      padding: '0.5rem', borderRadius: 'var(--radius-sm)',
                      textAlign: 'left', marginBottom: '0.25rem'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <Globe size={16} />
                    {t('options.language')}: {i18n.language === 'en' ? 'EN' : 'ID'}
                  </button>
                  <button
                    onClick={handleLogout}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      background: 'none', border: 'none', color: '#ef4444',
                      cursor: 'pointer', fontWeight: 500, width: '100%',
                      padding: '0.5rem', borderRadius: 'var(--radius-sm)',
                      textAlign: 'left'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <LogOut size={16} />
                    {t('options.logout')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                onClick={() => i18n.changeLanguage(i18n.language === 'en' ? 'id' : 'en')}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                  background: 'white', border: '1px solid var(--border-color)',
                  color: 'var(--text-main)', cursor: 'pointer', fontWeight: 500,
                  padding: '0.45rem 0.75rem', borderRadius: 'var(--radius-full)',
                  fontSize: '0.8rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}
              >
                <Globe size={14} /> {i18n.language === 'en' ? 'EN' : 'ID'}
              </button>
              <button
                onClick={() => navigate('/login')}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
                  background: 'var(--primary-color, #059669)', color: '#ffffff',
                  border: 'none', borderRadius: 'var(--radius-full)',
                  padding: '0.45rem 0.95rem', cursor: 'pointer',
                  fontWeight: 600, fontSize: '0.825rem',
                  boxShadow: '0 2px 4px rgba(5, 150, 105, 0.2)'
                }}
              >
                <LogIn size={14} /> {t('options.loginAction', 'Masuk / Login Petugas')}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="options-header">
        <h1>{t('options.title')}</h1>
        <p>{t('options.subtitle')}</p>
      </div>

      <div className="options-grid">
        {options.map((option) => (
          <div
            key={option.id}
            className="option-card group"
            onClick={() => {
              navigate(option.path);
            }}
          >
            <div className="option-card-top">
              <div
                className="option-icon"
                style={{
                  backgroundColor: option.iconBg || '#ecfdf5',
                  borderColor: option.iconBorder || 'rgba(5, 150, 105, 0.15)'
                }}
              >
                {option.icon}
              </div>
              <div className="option-card-actions">
                {option.badge && (
                  <span
                    className="option-card-badge"
                    style={{
                      backgroundColor: option.badgeBg || '#f1f5f9',
                      color: option.badgeColor || '#0f172a'
                    }}
                  >
                    {option.badge}
                  </span>
                )}
                <div className="option-card-arrow">
                  <ArrowUpRight size={17} />
                </div>
              </div>
            </div>
            <div className="option-content">
              <h2>{option.title}</h2>
            </div>
          </div>
        ))}
      </div>

      <footer className="global-footer" style={{ marginTop: 'auto', background: 'transparent' }}>
        &copy; 2026 Made by Ternak Automation
      </footer>
    </div>
  );
};

export default Options;
