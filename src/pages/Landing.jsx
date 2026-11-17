import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, TrendingDown, ArrowRight, Clock, Sparkles, ShieldCheck, Stethoscope, Cpu, MessageSquare, Microscope, Mic, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { articlesData } from '../data/articlesData';
import ClinicDemoModal from '../components/landing/ClinicDemoModal';
import './Landing.css';

const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  const lang = i18n.language === 'en' ? 'en' : 'id';
  const featuredArticles = articlesData.slice(0, 3);

  const partnerRow1 = [
    {
      name: 'RSUP Prof. Dr. I.G.N.G. Ngoerah',
      location: 'Denpasar, Bali',
      logo: '/logos/hospitals/Logo-RS-Ngoerah.webp',
      alt: 'Logo RSUP Prof Ngoerah'
    },
    {
      name: 'RS Bali Royal BROS',
      location: 'Denpasar, Bali',
      logo: '/logos/hospitals/Logo-RS-BaliRoyal.webp',
      alt: 'Logo RS Bali Royal'
    },
    {
      name: 'RS Balimed Denpasar',
      location: 'Denpasar, Bali',
      logo: '/logos/hospitals/Logo-RS-Balimed.webp',
      alt: 'Logo RS Balimed'
    },
    {
      name: 'RSU Kertha Usada',
      location: 'Buleleng, Bali',
      logo: '/logos/hospitals/Logo-RS-KerthaUsada.webp',
      alt: 'Logo RSU Kertha Usada'
    }
  ];

  const partnerRow2 = [
    {
      name: 'RS Prima Medika',
      location: 'Denpasar, Bali',
      logo: '/logos/hospitals/Logo-RS-PrimaMedika.webp',
      alt: 'Logo RS Prima Medika'
    },
    {
      name: 'RSUD Sanjiwani Gianyar',
      location: 'Gianyar, Bali',
      logo: '/logos/hospitals/Logo-RS-Sanjiwani.webp',
      alt: 'Logo RSUD Sanjiwani'
    },
    {
      name: 'RSUD Kabupaten Buleleng',
      location: 'Singaraja, Bali',
      logo: '/logos/hospitals/Logo-RS-Buleleng.webp',
      alt: 'Logo RSUD Buleleng'
    }
  ];

  const duplicatedRow1 = [...partnerRow1, ...partnerRow1, ...partnerRow1];
  const duplicatedRow2 = [...partnerRow2, ...partnerRow2, ...partnerRow2, ...partnerRow2];

  const handleCobaGratis = () => {
    if (user) {
      navigate('/options');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="landing-page">
      {/* Navbar */}
      <nav className="landing-navbar">
        <div className="landing-logo">
          <img src="/logos/brand/logo-black.webp" alt="Ternak AI Healthcare Logo" style={{ height: '36px' }} />
          <div className="landing-logo-text">
            <h2>{t('landing.nav.brand', 'Ternak AI Healthcare')}</h2>
            <span className="landing-logo-subtitle">{t('landing.nav.brandSubtitle', 'Anak Usaha Ternak Automation')}</span>
          </div>
        </div>
        <div className="landing-nav-links">
          <a href="#solusi" className="landing-nav-link">{t('landing.nav.solutions', 'Solusi AI')}</a>
          <a href="#harga" className="landing-nav-link">{t('landing.nav.pricing', 'Paket & Harga')}</a>
          <a href="#tentang-kami" className="landing-nav-link">{t('landing.nav.about', 'Tentang Kami')}</a>
          <a href="#founder" className="landing-nav-link">{t('landing.nav.team', 'Our Team')}</a>
          <a href="#artikel" className="landing-nav-link">{t('landing.nav.articles', 'Artikel')}</a>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button
            onClick={() => i18n.changeLanguage(i18n.language === 'en' ? 'id' : 'en')}
            className="lang-toggle-btn"
            style={{
              background: 'transparent',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '0.4rem 0.8rem',
              fontWeight: 600,
              fontSize: '0.875rem',
              color: 'var(--text-main)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease'
            }}
          >
            {i18n.language === 'en' ? 'EN' : 'ID'}
          </button>
          <button className="btn-primary" onClick={handleCobaGratis}>
            {t('landing.nav.tryFree')}
          </button>
        </div>
      </nav>

      <main className="landing-content-wrapper">
        {/* Authentic Software Showcase: Hero Section */}
        <section className="hero-section text-center">
          <div className="hero-content">
            <div className="hero-kicker-trust">
              <span>{t('landing.hero.badge')}</span>
            </div>
            <h1>{t('landing.hero.title')}</h1>
            <p className="subtitle">
              {t('landing.hero.subtitle')}
            </p>
            <div className="hero-cta-wrapper">
              <button className="btn-primary btn-large" onClick={handleCobaGratis}>
                {t('landing.hero.cta')}
              </button>
            </div>

            {/* Authentic Live Workstation Frame (Showing the real product UI) */}
            <div className="hero-app-frame">
              {/* App Window Top Bar */}
              <div className="app-frame-topbar">
                <div className="window-controls">
                  <span className="window-dot dot-close"></span>
                  <span className="window-dot dot-minimize"></span>
                  <span className="window-dot dot-maximize"></span>
                </div>
                <div className="app-frame-title">
                  <Stethoscope size={14} className="window-icon" />
                  <span className="window-app-name">USADA AI Medical Workstation</span>
                  <span className="window-divider">•</span>
                  <span className="window-session">Poli Rawat Jalan — dr. Ida Bagus</span>
                </div>
                <div className="app-frame-status">
                  <span className="live-pulse-dot"></span>
                  <span className="status-label">Voice Scribe Aktif</span>
                </div>
              </div>

              {/* App Window Body: Dual Workstation Layout */}
              <div className="app-frame-body text-left">
                {/* Left Pane: Live Clinical Audio Stream & Transcription */}
                <div className="frame-pane pane-transcription">
                  <div className="pane-header">
                    <div className="pane-title-wrap">
                      <Mic size={15} className="pane-icon" />
                      <h4>Live Ambient Recording</h4>
                    </div>
                    <div className="soundwave-bars" aria-label="Audio stream active">
                      <span className="wave-bar"></span>
                      <span className="wave-bar"></span>
                      <span className="wave-bar"></span>
                      <span className="wave-bar"></span>
                      <span className="wave-bar"></span>
                    </div>
                  </div>
                  <div className="transcript-bubbles">
                    <div className="dialogue-item dialogue-doctor">
                      <span className="dialogue-speaker">Dokter:</span>
                      <p className="dialogue-text">"Selamat pagi Bu Ketut. Ada keluhan apa yang dirasakan beberapa hari ini?"</p>
                    </div>
                    <div className="dialogue-item dialogue-patient">
                      <span className="dialogue-speaker">Pasien:</span>
                      <p className="dialogue-text">"Pagi dok. Sudah 3 hari tenggorokan sakit buat menelan, ada batuk kering dan badan agak meriang semalam."</p>
                    </div>
                    <div className="dialogue-item dialogue-doctor">
                      <span className="dialogue-speaker">Dokter:</span>
                      <p className="dialogue-text">"Baik, kita periksa fisik ya. Tekanan darah normal 120/80, suhu 37.8°C, faring tampak hiperemis."</p>
                    </div>
                  </div>
                  <div className="pane-footer-info">
                    <span className="tech-chip">Engine: Ambient Speech-to-Text</span>
                    <span className="latency-chip">Latency: 180ms</span>
                  </div>
                </div>

                {/* Right Pane: Structured SOAP Notes & Automated ICD-10 Coding */}
                <div className="frame-pane pane-soap">
                  <div className="pane-header">
                    <div className="pane-title-wrap">
                      <FileText size={15} className="pane-icon" />
                      <h4>Resume Medis SOAP Terstruktur</h4>
                    </div>
                    <span className="status-badge-verified">Kepatuhan CPPT 100%</span>
                  </div>
                  <div className="soap-records">
                    <div className="soap-item">
                      <span className="soap-label label-s">S</span>
                      <div className="soap-content">
                        <strong>Subjektif:</strong> Nyeri menelan sejak 3 hari, batuk non-produktif, riwayat subfebris semalam.
                      </div>
                    </div>
                    <div className="soap-item">
                      <span className="soap-label label-o">O</span>
                      <div className="soap-content">
                        <strong>Objektif:</strong> TD 120/80 mmHg, N 82x/m, RR 18x/m, T 37.8°C. Faring: hiperemis (+), tonsil T1/T1 tenang.
                      </div>
                    </div>
                    <div className="soap-item">
                      <span className="soap-label label-a">A</span>
                      <div className="soap-content">
                        <strong>Asesmen:</strong> Faringitis Akut / ISPA
                        <div className="icd-tags">
                          <span className="icd-tag icd-primary">ICD-10: J06.9 (Acute Upper Respiratory Infection)</span>
                          <span className="icd-tag icd-valid">✓ BPJS Casemix Match</span>
                        </div>
                      </div>
                    </div>
                    <div className="soap-item">
                      <span className="soap-label label-p">P</span>
                      <div className="soap-content">
                        <strong>Planning:</strong> Paracetamol 500mg 3x1 prn, Ambroxol 30mg 3x1, edukasi hidrasi cairan hangat.
                      </div>
                    </div>
                  </div>
                  <div className="pane-footer-info pane-footer-soap">
                    <span className="satusehat-sync">
                      <span className="satusehat-dot"></span>
                      Siap Ekspor SatuSehat FHIR & SIMRS
                    </span>
                    <span className="auto-saved-badge">Auto-Saved</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="main-container">
          {/* Proximity & Symmetry: Challenges Grid */}
          <div className="challenges-container">
            <div className="challenges-grid">
              {/* Problem Card (Red accents) */}
              <section className="pas-card problem-card">
                <div className="pas-icon-wrapper red-icon" style={{ backgroundColor: 'transparent' }}>
                  <img src="/illustrations/administrative.svg" alt="Administrative Burden" style={{ width: '70px', height: '70px' }} />
                </div>
                <h2>{t('landing.problem.card1.title')}</h2>
                <p>{t('landing.problem.card1.desc')}</p>
                <div className="card-decoration red-decoration"></div>
              </section>

              {/* Agitation Card (Red accents) */}
              <section className="pas-card agitation-card">
                <div className="pas-icon-wrapper red-icon" style={{ backgroundColor: 'transparent' }}>
                  <img src="/illustrations/pending.svg" alt="Pending Risk" style={{ width: '60px', height: '60px' }} />
                </div>
                <h2>{t('landing.problem.card2.title')}</h2>
                <p dangerouslySetInnerHTML={{ __html: t('landing.problem.card2.desc').replace('(pending)', '<strong>(pending)</strong>') }}></p>
                <div className="card-decoration red-decoration"></div>
              </section>
            </div>
          </div>

          {/* Solution Section: 5 Core AI Healthcare Solutions */}
          <section id="solusi" className="solution-section">
            <div className="solution-header text-center">
              <span className="section-pill-badge">{t('landing.solution.badge', 'Layanan AI Healthcare')}</span>
              <h2>{t('landing.solution.title')}</h2>
              <p>{t('landing.solution.subtitle')}</p>
            </div>

            <div className="solution-grid five-services-grid">
              {/* Service 1: AI Rekam Medis */}
              <div className="solution-card-service">
                <div className="service-icon-pill emerald-pill">
                  <Stethoscope size={22} />
                  <span>{t('landing.solution.service1.tag')}</span>
                </div>
                <h3>{t('landing.solution.service1.title')}</h3>
                <p>{t('landing.solution.service1.desc')}</p>
              </div>

              {/* Service 2: AI Chatbot/Helpdesk & WhatsApp Reminder */}
              <div className="solution-card-service">
                <div className="service-icon-pill green-pill">
                  <MessageSquare size={22} />
                  <span>{t('landing.solution.service2.tag')}</span>
                </div>
                <h3>{t('landing.solution.service2.title')}</h3>
                <p>{t('landing.solution.service2.desc')}</p>
              </div>

              {/* Service 3: AI BPJS */}
              <div className="solution-card-service">
                <div className="service-icon-pill blue-pill">
                  <ShieldCheck size={22} />
                  <span>{t('landing.solution.service3.tag')}</span>
                </div>
                <h3>{t('landing.solution.service3.title')}</h3>
                <p>{t('landing.solution.service3.desc')}</p>
              </div>

              {/* Service 4: AI Finance Health */}
              <div className="solution-card-service">
                <div className="service-icon-pill amber-pill">
                  <TrendingDown size={22} />
                  <span>{t('landing.solution.service4.tag')}</span>
                </div>
                <h3>{t('landing.solution.service4.title')}</h3>
                <p>{t('landing.solution.service4.desc')}</p>
              </div>

              {/* Service 5: AI for Healthcare Research (Khusus Dokter) */}
              <div className="solution-card-service research-card">
                <div className="service-icon-pill purple-pill">
                  <Microscope size={22} />
                  <span>{t('landing.solution.service5.tag')}</span>
                </div>
                <h3>{t('landing.solution.service5.title')}</h3>
                <p>{t('landing.solution.service5.desc')}</p>
              </div>
            </div>
          </section>

          {/* Pricing & Billing Section */}
          <section id="harga" className="pricing-section text-center">
            <div className="section-header-compact">
              <span className="section-pill-badge">{t('landing.pricing.badge')}</span>
              <h2>{t('landing.pricing.title')}</h2>
              <p className="section-header-subtitle">{t('landing.pricing.subtitle')}</p>
            </div>

            {/* Pricing Cards Grid */}
            <div className="pricing-grid">
              {/* Plan 1: Paket Ekonomis */}
              <div className="pricing-card">
                <div className="pricing-card-top">
                  <span className="pricing-tier-pill">{t('landing.pricing.plan1.badge')}</span>
                  <h3>{t('landing.pricing.plan1.name')}</h3>
                  <div className="pricing-model-badge">{t('landing.pricing.plan1.model')}</div>
                </div>

                <ul className="pricing-features-list">
                  {t('landing.pricing.plan1.features', { returnObjects: true })?.map((feat, idx) => (
                    <li key={idx}><CheckCircle size={15} className="feat-check" /> {feat}</li>
                  ))}
                </ul>

                <div className="pricing-maintenance-badge">
                  <CheckCircle size={15} />
                  <span>{t('landing.pricing.plan1.maintenance')}</span>
                </div>

                <div className="pricing-rates-container">
                  <div className="pricing-rate-item">
                    <span className="rate-service-count">1 Service AI</span>
                    <span className="rate-amount">Rp 300.000 <small>/ bln</small></span>
                  </div>
                  <div className="pricing-rate-item">
                    <span className="rate-service-count">2 Service AI</span>
                    <span className="rate-amount">Rp 500.000 <small>/ bln</small></span>
                  </div>
                  <div className="pricing-rate-item rate-highlight">
                    <span className="rate-service-count">5 Service AI (Full)</span>
                    <span className="rate-amount">Rp 1.000.000 <small>/ bln</small></span>
                  </div>
                </div>

                <button className="pricing-cta-btn" onClick={() => setIsDemoModalOpen(true)}>
                  {t('landing.pricing.plan1.cta')}
                </button>
              </div>

              {/* Plan 2: Paket Standar (Best Value) */}
              <div className="pricing-card featured-plan-card">
                <div className="featured-ribbon-pill">{t('landing.pricing.plan2.badge')}</div>
                <div className="pricing-card-top">
                  <span className="pricing-tier-pill emerald-tier">{t('landing.pricing.plan2.target')}</span>
                  <h3>{t('landing.pricing.plan2.name')}</h3>
                  <div className="pricing-model-badge emerald-model">{t('landing.pricing.plan2.model')}</div>
                </div>

                <ul className="pricing-features-list">
                  {t('landing.pricing.plan2.features', { returnObjects: true })?.map((feat, idx) => (
                    <li key={idx}><CheckCircle size={15} className="feat-check emerald-check" /> {feat}</li>
                  ))}
                </ul>

                <div className="pricing-maintenance-badge emerald-maintenance">
                  <CheckCircle size={15} />
                  <span>{t('landing.pricing.plan2.maintenance')}</span>
                </div>

                <div className="pricing-rates-container">
                  <div className="pricing-rate-item">
                    <span className="rate-service-count">1 Service AI</span>
                    <span className="rate-amount">Rp 500.000 <small>/ bln</small></span>
                  </div>
                  <div className="pricing-rate-item">
                    <span className="rate-service-count">3 Service AI</span>
                    <span className="rate-amount">Rp 1.000.000 <small>/ bln</small></span>
                  </div>
                  <div className="pricing-rate-item rate-highlight emerald-highlight">
                    <span className="rate-service-count">5 Service AI (Full)</span>
                    <span className="rate-amount">Rp 1.300.000 <small>/ bln</small></span>
                  </div>
                </div>

                <button className="pricing-cta-btn featured-cta-btn" onClick={() => setIsDemoModalOpen(true)}>
                  {t('landing.pricing.plan2.cta')}
                </button>
              </div>

              {/* Plan 3: Paket Max */}
              <div className="pricing-card">
                <div className="pricing-card-top">
                  <span className="pricing-tier-pill purple-tier">{t('landing.pricing.plan3.badge')}</span>
                  <h3>{t('landing.pricing.plan3.name')}</h3>
                  <div className="pricing-model-badge purple-model">{t('landing.pricing.plan3.model')}</div>
                </div>

                <ul className="pricing-features-list">
                  {t('landing.pricing.plan3.features', { returnObjects: true })?.map((feat, idx) => (
                    <li key={idx}><CheckCircle size={15} className="feat-check purple-check" /> {feat}</li>
                  ))}
                </ul>

                <div className="pricing-maintenance-badge purple-maintenance">
                  <CheckCircle size={15} />
                  <span>{t('landing.pricing.plan3.maintenance')}</span>
                </div>

                <div className="pricing-rates-container single-enterprise-rate">
                  <div className="enterprise-all-in-box">
                    <span className="all-in-title">Semua 5 Layanan + Custom Riset</span>
                    <div className="all-in-price-wrap">
                      <span className="price-big">Rp 2.000.000</span>
                      <span className="price-unit">/ bulan</span>
                    </div>
                  </div>
                </div>

                <button className="pricing-cta-btn" onClick={() => setIsDemoModalOpen(true)}>
                  {t('landing.pricing.plan3.cta')}
                </button>
              </div>
            </div>

            {/* Free Trial Guarantee Bar Below Cards */}
            <div className="pricing-bottom-free-trial-bar">
              <div className="bottom-trial-content">
                <div className="trial-gift-icon">
                  <Sparkles size={22} />
                </div>
                <div className="bottom-trial-text">
                  <h4>{t('landing.pricing.freeTrialBanner.title', 'Free Trial 1 Bulan Penuh untuk 3 RS / Klinik Pertama')}</h4>
                  <p>{t('landing.pricing.freeTrialBanner.desc', 'Nikmati seluruh kapabilitas kecerdasan buatan USADA AI secara gratis tanpa komitmen untuk 3 fasilitas kesehatan pertama di Bali. Buktikan efisiensinya sekarang!')}</p>
                </div>
              </div>
              <button
                type="button"
                className="btn-primary bottom-trial-cta-btn"
                onClick={() => setIsDemoModalOpen(true)}
              >
                <span>{t('landing.pricing.freeTrialBanner.cta', 'Klaim Free Trial 1 Bulan')}</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </section>

          {/* About Us Section */}
          <section id="tentang-kami" className="about-section text-center">
            <div className="section-header-compact">
              <span className="section-pill-badge">{t('landing.about.badge')}</span>
              <h2>{t('landing.about.title')}</h2>
              <p className="section-header-subtitle">{t('landing.about.subtitle')}</p>
            </div>

            <div className="about-grid">
              <div className="about-card">
                <div className="about-icon-pill green-pill">
                  <Clock size={22} />
                  <span>{t('landing.about.mission.tag')}</span>
                </div>
                <h3>{t('landing.about.mission.title')}</h3>
                <p>{t('landing.about.mission.desc')}</p>
              </div>

              <div className="about-card">
                <div className="about-icon-pill teal-pill">
                  <Sparkles size={22} />
                  <span>{t('landing.about.vision.tag')}</span>
                </div>
                <h3>{t('landing.about.vision.title')}</h3>
                <p>{t('landing.about.vision.desc')}</p>
              </div>

              <div className="about-card">
                <div className="about-icon-pill blue-pill">
                  <ShieldCheck size={22} />
                  <span>{t('landing.about.values.tag')}</span>
                </div>
                <h3>{t('landing.about.values.title')}</h3>
                <p>{t('landing.about.values.desc')}</p>
              </div>
            </div>
          </section>

          {/* Social Proof: Bali Healthcare Facilities & Clinics (No testimonials) */}
          <section className="bali-partners-section text-center">
            <div className="partners-header">
              <span className="section-pill-badge">{t('landing.partners.badge')}</span>
              <h2>{t('landing.partners.title')}</h2>
              <p>{t('landing.partners.subtitle')}</p>
            </div>

            <div className="marquee-wrapper">
              {/* Row 1: Bergerak ke Kiri */}
              <div className="marquee-row">
                <div className="marquee-track marquee-track-left">
                  {duplicatedRow1.map((hospital, idx) => (
                    <div key={`row1-${idx}`} className="partner-card marquee-card">
                      <div className="partner-logo-wrapper">
                        <img
                          src={hospital.logo}
                          alt={hospital.alt}
                          className="partner-logo-img"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            if (e.currentTarget.nextElementSibling) {
                              e.currentTarget.nextElementSibling.style.display = 'flex';
                            }
                          }}
                        />
                        <div className="partner-fallback-icon" style={{ display: 'none' }}>
                          🏥
                        </div>
                      </div>
                      <strong className="partner-name">{hospital.name}</strong>
                      <span className="partner-location">{hospital.location}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Row 2: Bergerak ke Kanan (Arah Berlawanan) */}
              <div className="marquee-row">
                <div className="marquee-track marquee-track-right">
                  {duplicatedRow2.map((hospital, idx) => (
                    <div key={`row2-${idx}`} className="partner-card marquee-card">
                      <div className="partner-logo-wrapper">
                        <img
                          src={hospital.logo}
                          alt={hospital.alt}
                          className="partner-logo-img"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            if (e.currentTarget.nextElementSibling) {
                              e.currentTarget.nextElementSibling.style.display = 'flex';
                            }
                          }}
                        />
                        <div className="partner-fallback-icon" style={{ display: 'none' }}>
                          🏥
                        </div>
                      </div>
                      <strong className="partner-name">{hospital.name}</strong>
                      <span className="partner-location">{hospital.location}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Founder & Team Section */}
          <section id="founder" className="team-section text-center">
            <div className="section-header-compact">
              <span className="section-pill-badge">{t('landing.team.badge')}</span>
              <h2>{t('landing.team.title')}</h2>
              <p className="section-header-subtitle">{t('landing.team.subtitle')}</p>
            </div>

            <div className="team-grid dual-founder-layout">
              {/* Member 1: Founder */}
              <div className="team-card horizontal-founder-card">
                <div className="founder-avatar-wrapper">
                  <img
                    src="/team/De-Mahesta.svg?v=1.4"
                    alt={t('landing.team.member1.name')}
                    className="founder-avatar-circle"
                    loading="lazy"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      const fallback = e.target.nextElementSibling;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                  <div className="founder-avatar-fallback emerald-fallback" style={{ display: 'none' }}>
                    <Sparkles size={30} />
                  </div>
                </div>
                <div className="founder-info-right">
                  <h3>{t('landing.team.member1.name')}</h3>
                  <div className="founder-role-row">
                    <span className="founder-role">{t('landing.team.member1.role')}</span>
                    <span className="founder-bullet">•</span>
                    <span className="founder-credential-pill">{t('landing.team.member1.credential')}</span>
                  </div>
                  <p className="founder-desc">{t('landing.team.member1.desc')}</p>
                </div>
              </div>

              {/* Member 2: Co-Founder - Ida Bagus Agung Bajerapany */}
              <div className="team-card horizontal-founder-card">
                <div className="founder-avatar-wrapper">
                  <img
                    src="/team/gus-agung.svg?v=1.0"
                    alt={t('landing.team.member2.name')}
                    className="founder-avatar-circle"
                    loading="lazy"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      const fallback = e.target.nextElementSibling;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                  <div className="founder-avatar-fallback teal-fallback" style={{ display: 'none' }}>
                    <Cpu size={30} />
                  </div>
                </div>
                <div className="founder-info-right">
                  <h3>{t('landing.team.member2.name')}</h3>
                  <div className="founder-role-row">
                    <span className="founder-role">{t('landing.team.member2.role')}</span>
                    <span className="founder-bullet">•</span>
                    <span className="founder-credential-pill">{t('landing.team.member2.credential')}</span>
                  </div>
                  <p className="founder-desc">{t('landing.team.member2.desc')}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Articles & Insights (Scribe active; BPJS & Cost control commented out) */}
          <section id="artikel" className="landing-articles-section">
            <div className="text-center" style={{ marginBottom: '2rem' }}>
              <h2>{t('landing.articles.title')}</h2>
            </div>
            <div className="articles-grid">
              {featuredArticles.map((art) => {
                const data = art[lang] || art.id;
                return (
                  <div key={art.slug} className="article-card active-article">
                    <span className="article-tag">{data.tag}</span>
                    <h3>{data.title}</h3>
                    <p>{data.excerpt}</p>
                    <button
                      className="article-read-btn"
                      onClick={() => navigate(`/artikel/${art.slug}`)}
                    >
                      <span>{t('landing.articles.readMore', 'Selengkapnya')}</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                );
              })}
            </div>

            {articlesData.length > 3 && (
              <div className="view-all-articles-wrapper text-center">
                <button
                  className="view-all-articles-btn"
                  onClick={() => navigate('/artikel')}
                >
                  <span>{t('landing.articles.viewAll', 'Lihat Semua Artikel (Selengkapnya)')}</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            )}
          </section>

          {/* Final CTA */}
          <section className="cta-section text-center">
            <div className="cta-content">
              <h2 style={{ color: '#ffffff' }}>{t('landing.cta.title')}</h2>
              <p>{t('landing.cta.subtitle')}</p>
              <button className="btn-primary btn-large cta-btn-inverted" onClick={handleCobaGratis}>
                {t('landing.cta.button')}
              </button>
            </div>
            <div className="cta-shapes">
              <div className="css-shape shape-circle-small"></div>
              <div className="css-shape shape-circle-large"></div>
            </div>
          </section>
        </div>
      </main>

      <footer className="landing-footer">
        <p>{t('landing.footer.copyright')}</p>
      </footer>

      {/* Clinic Demo & Consultation Modal */}
      <ClinicDemoModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
      />
    </div>
  );
};

export default Landing;
