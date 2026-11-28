import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft, LogOut, User, ChevronDown, Globe,
  LogIn, ArrowUpRight, ChevronLeft, ChevronRight, FileCheck, Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Options.css';

const Options = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Deck carousel states
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animDirection, setAnimDirection] = useState(null); // 'next' | 'prev' | null
  const [incomingIndex, setIncomingIndex] = useState(null);
  const [touchStartX, setTouchStartX] = useState(null);
  const isAnimatingRef = useRef(false);

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
  const isDemo = role === 'demo';
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
      case 'demo':
        return { label: t('options.roles.demo', 'Demo Evaluator'), bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' };
      default:
        return { label: t('options.roles.guest', 'Tamu'), bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' };
    }
  };

  const allOptions = [
    // 1. Asisten Medis / Scribe - Clinical
    {
      id: 'medical-records',
      badge: t('options.features.medicalRecords.badge', 'Klinis'),
      title: t('options.features.medicalRecords.title', 'AI Rekam Medis (Medical Scribe)'),
      icon: <img src="/illustrations/medical-scribe.svg" alt={t('options.features.medicalRecords.title')} className="option-icon-img" />,
      iconBg: '#ecfdf5',
      iconBorder: 'rgba(5, 150, 105, 0.2)',
      badgeBg: '#ecfdf5',
      badgeColor: '#047857',
      path: '/app/asisten-medis',
      visible: isSuperAdmin || isAdmin || isDoctor || isNurse
    },
    // Verifikasi Klaim BPJS - Casemix
    {
      id: 'claim-bpjs',
      badge: t('options.features.bpjsClaim.badge', 'Casemix'),
      title: t('options.features.bpjsClaim.title', 'Verifikasi Klaim BPJS'),
      icon: <img src="/illustrations/claim-bpjs.svg" alt={t('options.features.bpjsClaim.title', 'Verifikasi Klaim BPJS')} className="option-icon-img" />,
      iconBg: '#ecfdf5',
      iconBorder: 'rgba(5, 150, 105, 0.2)',
      badgeBg: '#ecfdf5',
      badgeColor: '#047857',
      path: '/app/bpjs-claim',
      visible: isSuperAdmin || isAdmin || isStaff || isDoctor
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

  // Exclusive AI services for demo evaluator
  const AI_SERVICE_IDS = [
    'medical-records',
    'claim-bpjs',
    'manage-reservations',
    'connect-reservation',
    'dashboard-analysis'
  ];

  const options = isDemo
    ? allOptions.filter(opt => AI_SERVICE_IDS.includes(opt.id))
    : allOptions.filter(opt => opt.visible);
  const total = options.length;
  const safeCurrentIndex = total > 0 ? currentIndex % total : 0;
  const activeCard = total > 0 ? options[safeCurrentIndex] : null;

  const handleNext = useCallback(() => {
    if (isAnimatingRef.current || total <= 1) return;
    isAnimatingRef.current = true;
    setAnimDirection('next');
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % total);
      setAnimDirection(null);
      isAnimatingRef.current = false;
    }, 280);
  }, [total]);

  const handlePrev = useCallback(() => {
    if (isAnimatingRef.current || total <= 1) return;
    isAnimatingRef.current = true;
    const prevIdx = (safeCurrentIndex - 1 + total) % total;
    setIncomingIndex(prevIdx);
    setAnimDirection('prev');
    setTimeout(() => {
      setCurrentIndex(prevIdx);
      setIncomingIndex(null);
      setAnimDirection(null);
      isAnimatingRef.current = false;
    }, 280);
  }, [safeCurrentIndex, total]);

  const handleJumpTo = useCallback((idx) => {
    if (isAnimatingRef.current || idx === safeCurrentIndex || total <= 1) return;
    isAnimatingRef.current = true;
    if (idx > safeCurrentIndex) {
      setAnimDirection('next');
    } else {
      setIncomingIndex(idx);
      setAnimDirection('prev');
    }
    setTimeout(() => {
      setCurrentIndex(idx);
      setIncomingIndex(null);
      setAnimDirection(null);
      isAnimatingRef.current = false;
    }, 280);
  }, [safeCurrentIndex, total]);

  // Keyboard navigation: left / right arrows to switch, Enter to open module
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'Enter') {
        if (activeCard && !isAnimatingRef.current) {
          navigate(activeCard.path);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, activeCard, navigate]);

  // Touch swipe support for mobile
  const handleTouchStart = (e) => {
    if (e.touches && e.touches.length > 0) {
      setTouchStartX(e.touches[0].clientX);
    }
  };

  const handleTouchEnd = (e) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 45) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    setTouchStartX(null);
  };

  const getCardAtOffset = (offset) => {
    if (total === 0) return null;
    return options[(safeCurrentIndex + offset) % total];
  };

  const renderCardContent = (option) => {
    if (!option) return null;
    return (
      <>
        <div className="option-card-top">
          {option.badge ? (
            <span
              className="option-card-badge"
              style={{
                backgroundColor: option.badgeBg || '#f1f5f9',
                color: option.badgeColor || '#0f172a'
              }}
            >
              {option.badge}
            </span>
          ) : <span className="option-card-badge-placeholder" />}
          <div className="option-card-arrow">
            <ArrowUpRight size={18} />
          </div>
        </div>

        <div className="option-icon-center">
          <div
            className="option-icon"
            style={{
              backgroundColor: option.iconBg || '#ecfdf5',
              border: 'none'
            }}
          >
            {option.icon}
          </div>
        </div>

        <div className="option-content-center">
          <h2>{option.title}</h2>
        </div>
      </>
    );
  };

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
                  background: 'white', border: 'none',
                  padding: '0.45rem 0.95rem', borderRadius: 'var(--radius-full)',
                  cursor: 'pointer', fontWeight: 500, color: 'var(--text-main)',
                  boxShadow: '0 2px 6px rgba(15, 23, 42, 0.05)'
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
                  background: 'white', border: 'none',
                  borderRadius: 'var(--radius-md)', padding: '0.5rem',
                  minWidth: '220px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                  zIndex: 100
                }}>
                  <div style={{ padding: '0.65rem 0.75rem', marginBottom: '0.35rem' }}>
                    <p style={{ fontWeight: 600, margin: '0 0 0.35rem 0', fontSize: '0.875rem', color: '#0f172a' }}>
                      {user?.name || 'System Administrator'}
                    </p>
                    {role && (
                      <div style={{ marginBottom: '0.35rem' }}>
                        <span className="options-role-badge" style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '9999px',
                          backgroundColor: getRoleBadge(role).bg,
                          color: getRoleBadge(role).color,
                          border: 'none',
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
                  background: 'white', border: 'none',
                  color: 'var(--text-main)', cursor: 'pointer', fontWeight: 500,
                  padding: '0.45rem 0.75rem', borderRadius: 'var(--radius-full)',
                  fontSize: '0.8rem', boxShadow: '0 2px 6px rgba(15, 23, 42, 0.05)'
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
        {isDemo && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.35rem 0.85rem',
            borderRadius: '9999px',
            backgroundColor: '#ecfdf5',
            color: '#047857',
            fontSize: '0.8rem',
            fontWeight: 600,
            marginBottom: '0.75rem',
            border: 'none'
          }}>
            <Sparkles size={14} color="#059669" />
            <span>{t('options.demoModeBadge', 'Demo Mode: 5 Layanan Otomasi AI Unggulan')}</span>
          </div>
        )}
        <h1>{t('options.title')}</h1>
        <p>{isDemo ? t('options.demoSubtitle', 'Jelajahi dan uji langsung modul kecerdasan buatan klinis serta operasional faskes.') : t('options.subtitle')}</p>
      </div>

      <div className="options-deck-container">
        <div className="options-deck-row">
          <button
            className="deck-side-btn prev-btn"
            onClick={handlePrev}
            aria-label="Sebelumnya"
            title="Sebelumnya (←)"
          >
            <ChevronLeft size={24} />
          </button>

          <div
            className="options-deck-stage"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Layer 3: 3rd card stacked behind */}
            {total > 3 && (
              <div
                key={`layer-3-${(safeCurrentIndex + 3) % total}`}
                className={`deck-card deck-layer-3 ${animDirection === 'next' ? 'deck-step-up-2' : ''}`}
              >
                {renderCardContent(getCardAtOffset(3))}
              </div>
            )}

            {/* Layer 2: 2nd card stacked behind */}
            {total > 2 && (
              <div
                key={`layer-2-${(safeCurrentIndex + 2) % total}`}
                className={`deck-card deck-layer-2 ${animDirection === 'next' ? 'deck-step-up-1' : ''}`}
              >
                {renderCardContent(getCardAtOffset(2))}
              </div>
            )}

            {/* Layer 1: 1st card stacked behind */}
            {total > 1 && (
              <div
                key={`layer-1-${(safeCurrentIndex + 1) % total}`}
                className={`deck-card deck-layer-1 ${animDirection === 'next' ? 'deck-step-up-0' : ''}`}
              >
                {renderCardContent(getCardAtOffset(1))}
              </div>
            )}

            {/* Layer 0: Active front card (1:1 square ratio) */}
            {activeCard && (
              <div
                key={`layer-0-${safeCurrentIndex}`}
                className={`deck-card deck-layer-0 ${animDirection === 'next' ? 'deck-exit-left' : ''} ${animDirection === 'prev' ? 'deck-step-back-1' : ''}`}
                onClick={() => {
                  if (!isAnimatingRef.current) {
                    navigate(activeCard.path);
                  }
                }}
              >
                {renderCardContent(activeCard)}
              </div>
            )}

            {/* Incoming card from left when switching to Prev */}
            {animDirection === 'prev' && incomingIndex !== null && options[incomingIndex] && (
              <div
                key={`incoming-prev-${incomingIndex}`}
                className="deck-card deck-layer-0 deck-enter-from-left"
              >
                {renderCardContent(options[incomingIndex])}
              </div>
            )}
          </div>

          <button
            className="deck-side-btn next-btn"
            onClick={handleNext}
            aria-label="Berikutnya"
            title="Berikutnya (→)"
          >
            <ChevronRight size={24} />
          </button>
        </div>

        {/* Deck Navigation Controls */}
        <div className="deck-controls">
          <div className="deck-dots">
            {options.map((opt, idx) => (
              <button
                key={opt.id}
                className={`deck-dot ${idx === safeCurrentIndex ? 'active' : ''}`}
                onClick={() => handleJumpTo(idx)}
                aria-label={`Pilih ${opt.title}`}
                title={opt.title}
              />
            ))}
          </div>
        </div>
      </div>

      <footer className="global-footer" style={{ marginTop: 'auto', background: 'transparent' }}>
        &copy; 2026 Dikembangkan oleh Usada Tech
      </footer>
    </div>
  );
};

export default Options;
