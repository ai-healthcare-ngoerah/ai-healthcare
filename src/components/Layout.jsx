import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, FileCheck, Stethoscope, Activity, BookOpen, Settings, HelpCircle, LogOut, MessageCircle, MessageSquare, ArrowLeft, User, ChevronDown, FileText, Menu, Globe, Bot, ShieldCheck, Calendar, CalendarCheck, X, Sliders, Sparkles, Layers, Clock, Users, Cpu, BarChart3 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Layout = () => {

  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => typeof window !== 'undefined' ? window.innerWidth > 768 : true);
  const dropdownRef = useRef(null);

  const closeSidebarOnMobile = () => {
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      setIsSidebarOpen(false);
    }
  };

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navigate = useNavigate();
  const location = useLocation();

  // Auto-collapse sidebar on medium laptop/tablet screens (<= 1180px) for Medical Scribe workstation
  useEffect(() => {
    if (typeof window !== 'undefined' && location.pathname === '/app/asisten-medis' && window.innerWidth <= 1180 && window.innerWidth > 768) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const [searchParams] = useSearchParams();
  const currentTab = searchParams.get('tab');

  const isSuperAdmin = user?.role === 'superadmin';

  const isSystemContext = location.pathname.startsWith('/app/admin') ||
    location.pathname.startsWith('/app/superadmin') ||
    location.pathname.startsWith('/app/model-management') ||
    location.pathname.startsWith('/app/panduan') ||
    location.pathname.startsWith('/app/pengaturan');

  const isReservationContext = location.pathname.startsWith('/app/ai-agent/reservasi');

  const isConnectContext = location.pathname.startsWith('/app/connect-reservation');

  const isDashboardContext = location.pathname.startsWith('/app/dashboard');

  const isBpjsContext = location.pathname.startsWith('/app/bpjs-claim') ||
    location.pathname.startsWith('/app/claim-verification') ||
    location.pathname.startsWith('/app/pengecekan-dokumen');

  const isAiContext = isReservationContext || isConnectContext || isDashboardContext || isBpjsContext || location.pathname.startsWith('/app/antrean');

  return (
    <div className="layout-container">
      {/* Mobile Backdrop Overlay */}
      {isSidebarOpen && (
        <div className="sidebar-backdrop" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar - Context-Aware based on Active Clinical Domain */}
      <aside className={`sidebar ${isSidebarOpen ? '' : 'sidebar-closed'}`}>
        <div className="sidebar-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <img src="/logos/usada-ai-icon.webp" alt="USADA AI Logo" style={{ height: '32px', width: '32px', objectFit: 'contain' }} />
            <h2>USADA AI</h2>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="sidebar-close-btn"
            title="Tutup Menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <button
            onClick={() => { closeSidebarOnMobile(); navigate('/options'); }}
            className="nav-link"
            style={{
              marginBottom: '0.65rem',
              background: '#f1f5f9',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
              color: 'var(--text-main)',
              fontWeight: 600
            }}
            title="Buka Hub Layanan Klinis"
          >
            <LayoutDashboard size={18} color="var(--primary-color)" />
            <span>{t('layout.back')}</span>
          </button>

          {isSystemContext ? (
            <>
              {/* Context: Manajemen & Tata Kelola */}
              <div className="sidebar-section-header">
                {t('layout.sections.admin')}
              </div>
              {isSuperAdmin ? (
                <>
                  <NavLink to="/app/superadmin" onClick={closeSidebarOnMobile} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    <ShieldCheck size={18} color="#dc2626" />
                    <span>{t('layout.nav.superadminPanel', 'Superadmin Panel')}</span>
                  </NavLink>
                  <NavLink to="/app/admin" onClick={closeSidebarOnMobile} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    <Users size={18} />
                    <span>{t('layout.nav.userAccounts', 'Admin Panel')}</span>
                  </NavLink>
                  <NavLink to="/app/model-management" onClick={closeSidebarOnMobile} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    <Cpu size={18} />
                    <span>{t('layout.nav.modelManagement', 'Model Management')}</span>
                  </NavLink>
                  <NavLink to="/app/pengaturan" onClick={closeSidebarOnMobile} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    <Settings size={18} />
                    <span>{t('layout.nav.settings')}</span>
                  </NavLink>
                </>
              ) : (
                <NavLink to="/app/admin" onClick={closeSidebarOnMobile} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <ShieldCheck size={18} />
                  <span>{t('layout.nav.userAccounts', 'Admin Panel')}</span>
                </NavLink>
              )}
              <NavLink to="/app/panduan" onClick={closeSidebarOnMobile} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <HelpCircle size={18} />
                <span>{t('layout.nav.guide')}</span>
              </NavLink>
            </>
          ) : isReservationContext ? (
            <>
              {/* Context: Loket Admisi & Antrean Pasien */}
              <div className="sidebar-section-header">
                {t('layout.sections.admission', 'Loket Admisi & Antrean')}
              </div>
              <button
                type="button"
                onClick={() => { closeSidebarOnMobile(); navigate('/app/ai-agent/reservasi?tab=queue'); }}
                className={`nav-link ${(!currentTab || currentTab === 'queue') ? 'active' : ''}`}
                style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                <Clock size={18} />
                <span>{t('layout.nav.todayQueue', "Antrean Hari Ini")}</span>
              </button>
              <button
                type="button"
                onClick={() => { closeSidebarOnMobile(); navigate('/app/ai-agent/reservasi?tab=reservations'); }}
                className={`nav-link ${currentTab === 'reservations' ? 'active' : ''}`}
                style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                <Calendar size={18} />
                <span>{t('layout.nav.onlineReservation', "Reservasi Online")}</span>
              </button>
              <button
                type="button"
                onClick={() => { closeSidebarOnMobile(); navigate('/app/ai-agent/reservasi?tab=patients'); }}
                className={`nav-link ${currentTab === 'patients' ? 'active' : ''}`}
                style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                <Users size={18} />
                <span>{t('layout.nav.patientDirectory', "Direktori Pasien")}</span>
              </button>

              <div style={{ margin: '0.75rem 0 0.5rem', borderTop: '1px solid var(--border-color)', opacity: 0.6 }} />

              <button
                type="button"
                onClick={() => { closeSidebarOnMobile(); navigate('/app/connect-reservation?tab=channels'); }}
                className="nav-link"
                style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', color: '#059669' }}
                title="Buka Integrasi Saluran Reservasi"
              >
                <Layers size={18} />
                <span>{t('layout.nav.goToConnect', "Hubungkan Saluran")}</span>
              </button>
            </>
          ) : isConnectContext ? (
            <>
              {/* Context: Integrasi & Saluran Reservasi */}
              <div className="sidebar-section-header">
                {t('layout.sections.connect', 'Connect Reservation')}
              </div>
              <button
                type="button"
                onClick={() => { closeSidebarOnMobile(); navigate('/app/connect-reservation?tab=channels'); }}
                className={`nav-link ${(!currentTab || currentTab === 'channels') ? 'active' : ''}`}
                style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                <Layers size={18} />
                <span>{t('layout.nav.channels', "Saluran Komunikasi")}</span>
              </button>
              <button
                type="button"
                onClick={() => { closeSidebarOnMobile(); navigate('/app/connect-reservation?tab=logs'); }}
                className={`nav-link ${currentTab === 'logs' ? 'active' : ''}`}
                style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                <Bot size={18} />
                <span>{t('layout.nav.chatLogs', "Log Chat")}</span>
              </button>
              <button
                type="button"
                onClick={() => { closeSidebarOnMobile(); navigate('/app/connect-reservation?tab=summary'); }}
                className={`nav-link ${currentTab === 'summary' ? 'active' : ''}`}
                style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                <Sparkles size={18} />
                <span>{t('layout.nav.summary', "Ringkasan Eksekutif")}</span>
              </button>

              <div style={{ margin: '0.75rem 0 0.5rem', borderTop: '1px solid var(--border-color)', opacity: 0.6 }} />

              <button
                type="button"
                onClick={() => { closeSidebarOnMobile(); navigate('/app/ai-agent/reservasi?tab=queue'); }}
                className="nav-link"
                style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', color: '#059669' }}
                title="Buka Loket Pemanggilan Antrean"
              >
                <Calendar size={18} />
                <span>{t('layout.nav.goToAdmission', "Buka Loket Admisi")}</span>
              </button>
            </>
          ) : isBpjsContext ? (
            <>
              {/* Context: Casemix & Verifikasi Klaim BPJS */}
              <div className="sidebar-section-header">
                {t('layout.sections.bpjsClaim', 'Casemix & Klaim BPJS')}
              </div>
              <NavLink to="/app/bpjs-claim" end onClick={closeSidebarOnMobile} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <FileCheck size={18} />
                <span>{t('layout.nav.documentChecking', 'Pengecekan Dokumen')}</span>
              </NavLink>
              <NavLink to="/app/bpjs-claim/history" onClick={closeSidebarOnMobile} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <Clock size={18} />
                <span>{t('layout.nav.documentHistory', 'Riwayat Pengecekan')}</span>
              </NavLink>
              <NavLink to="/app/bpjs-claim/knowledge" onClick={closeSidebarOnMobile} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <BookOpen size={18} />
                <span>{t('layout.nav.bpjsKnowledge', 'Basis Pengetahuan BPJS')}</span>
              </NavLink>
              <NavLink to="/app/claim-verification" onClick={closeSidebarOnMobile} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <ShieldCheck size={18} />
                <span>{t('layout.nav.claimVerification', 'Verifikasi Klaim SIMRS')}</span>
              </NavLink>
            </>
          ) : isDashboardContext ? (
            <>
              {/* Context: Dashboard Analisis Data Sains */}
              <div className="sidebar-section-header">
                Data Sains Kesehatan
              </div>
              <NavLink to="/app/dashboard-analisis" onClick={closeSidebarOnMobile} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <BarChart3 size={18} color="#2563eb" />
                <span>Dashboard Analisis</span>
              </NavLink>

              <div style={{ margin: '0.75rem 0 0.5rem', borderTop: '1px solid var(--border-color)', opacity: 0.6 }} />

              <div className="sidebar-section-header">
                Aksi Cepat Layanan
              </div>
              <button
                type="button"
                onClick={() => { closeSidebarOnMobile(); navigate('/app/asisten-medis'); }}
                className="nav-link"
                style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                <Stethoscope size={18} />
                <span>Scribe Medis & SOAP</span>
              </button>
              <button
                type="button"
                onClick={() => { closeSidebarOnMobile(); navigate('/app/ai-agent/reservasi?tab=queue'); }}
                className="nav-link"
                style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                <Clock size={18} />
                <span>Loket Admisi & Antrean</span>
              </button>
              <button
                type="button"
                onClick={() => { closeSidebarOnMobile(); navigate('/app/connect-reservation?tab=channels'); }}
                className="nav-link"
                style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                <Layers size={18} />
                <span>Saluran Reservasi</span>
              </button>
            </>
          ) : (
            <>
              {/* Context: Pelayanan Medis & Dokter */}
              <div className="sidebar-section-header">
                {t('layout.sections.clinical')}
              </div>
              <NavLink to="/app/asisten-medis" end onClick={closeSidebarOnMobile} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <Stethoscope size={18} />
                <span>{t('layout.nav.scribe')}</span>
              </NavLink>
              <NavLink to="/app/asisten-medis/riwayat" onClick={closeSidebarOnMobile} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <FileText size={18} />
                <span>{t('layout.nav.scribeHistory')}</span>
              </NavLink>
              {/* <NavLink to="/app/asisten-medis/kustomisasi" onClick={closeSidebarOnMobile} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <Sliders size={18} />
                <span>{t('layout.nav.scribeCustomize', 'Kustomisasi Pemetaan')}</span>
              </NavLink> */}
              <NavLink to="/app/asisten-medis/ai-knowledge" onClick={closeSidebarOnMobile} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <BookOpen size={18} />
                <span>{t('layout.nav.aiKnowledge', 'Basis Pengetahuan AI')}</span>
              </NavLink>
            </>
          )}

          {/* Persistent Superadmin Panel Link for Superadmin across all workspaces */}
          {!isSystemContext && isSuperAdmin && (
            <>
              <div style={{ margin: '0.75rem 0 0.5rem', borderTop: '1px solid var(--border-color)', opacity: 0.6 }} />
              <NavLink
                to="/app/superadmin"
                onClick={closeSidebarOnMobile}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                style={{ color: '#dc2626', fontWeight: 600 }}
                title="Superadmin Panel"
              >
                <ShieldCheck size={18} color="#dc2626" />
                <span>{t('layout.nav.superadminPanel', 'Superadmin Panel')}</span>
              </NavLink>
            </>
          )}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className={`main-content ${isSidebarOpen ? '' : 'sidebar-closed'}`}>
        <header className="top-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              title={t('layout.header.toggleSidebar')}
              className="topbar-icon-button"
            >
              <Menu size={18} />
            </button>
            <div className="header-status-badges" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="data-chip data-chip-sage" style={{ border: 'none' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--primary-color)' }} />
                <span>{t('layout.header.clinicConnected', 'Clinic Connected')}</span>
              </span>
              {/* Active Workspace Domain Indicator */}
              {isBpjsContext ? (
                <span className="data-chip data-chip-sage" style={{ border: 'none', background: '#ecfdf5', color: '#065f46' }}>
                  <FileCheck size={13} />
                  <span>{t('layout.sections.bpjsClaim', 'Casemix & Klaim BPJS')}</span>
                </span>
              ) : isReservationContext ? (
                <span className="data-chip data-chip-ochre" style={{ border: 'none' }}>
                  <Calendar size={13} />
                  <span>{t('layout.sections.admission', 'Loket Admisi')}</span>
                </span>
              ) : isConnectContext ? (
                <span className="data-chip data-chip-ochre" style={{ border: 'none' }}>
                  <Layers size={13} />
                  <span>{t('layout.sections.connect', 'Connect Reservation')}</span>
                </span>
              ) : isDashboardContext ? (
                <span className="data-chip data-chip-sage" style={{ border: 'none', background: '#eff6ff', color: '#1d4ed8' }}>
                  <BarChart3 size={13} />
                  <span>Data Sains Kesehatan</span>
                </span>
              ) : isSystemContext ? (
                <span className="data-chip data-chip-terracotta" style={{ border: 'none' }}>
                  <ShieldCheck size={13} />
                  <span>{t('layout.sections.admin')}</span>
                </span>
              ) : (
                <span className="data-chip data-chip-sage" style={{ border: 'none' }}>
                  <Stethoscope size={13} />
                  <span>{t('layout.sections.clinical')}</span>
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Quick Language Switcher Button */}
            <button
              type="button"
              onClick={() => i18n.changeLanguage(i18n.language === 'en' ? 'id' : 'en')}
              title={i18n.language === 'en' ? 'Ganti ke Bahasa Indonesia' : 'Switch to English'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.45rem 0.85rem',
                minHeight: '40px',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                backgroundColor: '#f1f5f9',
                color: 'var(--text-main)',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background-color 0.15s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
            >
              <Globe size={14} color="var(--primary-color)" />
              <span>{i18n.language === 'en' ? 'EN' : 'ID'}</span>
            </button>

            {/* Repositioned Section 2: Manajemen & Sistem inside User Profile Menu */}
            <div className="user-profile" style={{ position: 'relative' }} ref={dropdownRef}>
              <button
                className="header-user-btn"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.65rem',
                  background: '#f8fafc', border: 'none',
                  padding: '0.4rem 0.85rem', minHeight: '40px', borderRadius: 'var(--radius-md)',
                  cursor: 'pointer', color: 'var(--text-main)'
                }}
              >
                <div style={{ background: 'var(--primary-color)', color: '#ffffff', padding: '0.3rem', borderRadius: '4px', display: 'flex' }}>
                  <User size={15} />
                </div>
                <div className="header-user-info" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.2 }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user?.name || user?.email?.split('@')[0] || t('layout.header.userDefault')}</span>
                  <span style={{ fontSize: '0.65rem', color: user?.role === 'demo' ? '#059669' : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: user?.role === 'demo' ? 700 : 500 }}>{user?.role === 'demo' ? 'DEMO EVALUATOR' : (user?.role || 'Staff Medis')}</span>
                </div>
                <ChevronDown size={14} color="var(--text-muted)" style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', marginLeft: '0.25rem' }} />
              </button>

              {isDropdownOpen && (
                <div style={{
                  position: 'absolute', top: '120%', right: 0,
                  background: 'var(--bg-surface)', border: 'none',
                  borderRadius: 'var(--radius-md)', padding: '0.5rem',
                  minWidth: '240px', boxShadow: '0 10px 28px rgba(15, 23, 42, 0.1)',
                  zIndex: 100
                }}>
                  <div style={{ padding: '0.5rem', borderBottom: '1px solid var(--border-color)', marginBottom: '0.5rem' }}>
                    <p style={{ fontWeight: 600, margin: 0, fontSize: '0.875rem' }}>{user?.name || t('layout.header.userDefault')}</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email || 'admin@rs.com'}</p>
                  </div>

                  {/* Manajemen & Sistem Links */}
                  <div style={{ marginBottom: '0.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                    <div style={{ padding: '0.25rem 0.5rem 0.4rem', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8' }}>
                      {t('layout.sections.admin')}
                    </div>
                    <button
                      onClick={() => { setIsDropdownOpen(false); navigate('/app/panduan'); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.6rem',
                        background: 'none', border: 'none', color: 'var(--text-main)',
                        cursor: 'pointer', fontWeight: 500, width: '100%',
                        padding: '0.5rem', borderRadius: 'var(--radius-sm)',
                        textAlign: 'left', fontSize: '0.85rem'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <HelpCircle size={16} color="var(--primary-color)" />
                      {t('layout.nav.guide')}
                    </button>
                    <button
                      onClick={() => { setIsDropdownOpen(false); navigate('/app/pengaturan'); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.6rem',
                        background: 'none', border: 'none', color: 'var(--text-main)',
                        cursor: 'pointer', fontWeight: 500, width: '100%',
                        padding: '0.5rem', borderRadius: 'var(--radius-sm)',
                        textAlign: 'left', fontSize: '0.85rem'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <Settings size={16} color="var(--primary-color)" />
                      {t('layout.nav.settings')}
                    </button>
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
          </div>
        </header>

        <div className="page-content animate-fade-in">
          <Outlet />
        </div>

        {/* Global Footer */}
        <footer className="global-footer">
          {t('layout.footer')}
        </footer>
      </main>
    </div>
  );
};

export default Layout;
