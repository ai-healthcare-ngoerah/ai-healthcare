import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, AlertTriangle, CheckCircle, TrendingDown, ArrowRight, Clock, Sparkles, ShieldCheck, Stethoscope, Cpu, Award, Mail } from 'lucide-react';
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
          <a href="#solusi" className="landing-nav-link">{t('landing.nav.solutions', 'Solusi')}</a>
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
        {/* Figure/Ground: Hero Section pops out with dark gradient */}
        <section className="hero-section text-center">
          <div className="hero-content">
            <div className="hero-badge-pill">
              <span>{t('landing.hero.badge')}</span>
            </div>
            <h1 style={{ color: '#ffffff' }}>{t('landing.hero.title')}</h1>
            <p className="subtitle">
              {t('landing.hero.subtitle')}
            </p>
            <div className="hero-cta-wrapper">
              <button className="btn-primary btn-large" onClick={handleCobaGratis}>
                {t('landing.hero.cta')}
              </button>
            </div>
          </div>
          {/* Continuity: Wave divider leading down */}
          <div className="wave-divider">
            <svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
              <path d="M985.66,92.83C906.67,72,823.78,31,743.84,14.19c-82.26-17.34-168.06-16.33-250.45.39-57.84,11.73-114,31.07-172,41.86A600.21,600.21,0,0,1,0,27.35V120H1200V95.8C1132.19,118.92,1055.71,111.31,985.66,92.83Z" className="shape-fill"></path>
            </svg>
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

          {/* Solution Section (Figure breaking the Similarity of the red cards) */}
          <section id="solusi" className="solution-section">
            <div className="solution-header text-center">
              <div className="pas-icon-wrapper green-icon" style={{ margin: '0 auto 1rem' }}>
                <CheckCircle size={40} />
              </div>
              <h2>{t('landing.solution.title')}</h2>
              <p>{t('landing.solution.subtitle')}</p>
            </div>

            <div className="solution-grid">
              {/* Solution 1: AI Medical Scribe (Active) */}
              <div className="solution-item">
                <div className="solution-indicator">1</div>
                <div>
                  <strong>{t('landing.solution.point1.title')}</strong>
                  <p>{t('landing.solution.point1.desc')}</p>
                </div>
              </div>

              {/* [COMMENTED OUT - AI CHECKING BPJS CLAIMS]
              <div className="solution-item">
                <div className="solution-indicator">2</div>
                <div>
                  <strong>{t('landing.solution.bpjs.title')}</strong>
                  <p>{t('landing.solution.bpjs.desc')}</p>
                </div>
              </div>
              */}

              {/* Solution 3: AI Patient Reservation (Active) */}
              <div className="solution-item">
                <div className="solution-indicator">2</div>
                <div>
                  <strong>{t('landing.solution.point3.title')}</strong>
                  <p>{t('landing.solution.point3.desc')}</p>
                </div>
              </div>
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

            <div className="team-grid single-founder-layout">
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
                  
                  {/* Ikon Media Sosial Founder */}
                  <div className="founder-social-icons-strip" role="list" aria-label="Media Sosial Founder">
                    <a
                      href="https://www.linkedin.com/in/dewa-mahesta/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="founder-social-icon-btn founder-social-linkedin"
                      title="LinkedIn I Dewa Gede Mahesta Parawangsa"
                      aria-label="LinkedIn"
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
                      </svg>
                    </a>
                    <a
                      href="https://www.instagram.com/ternakai.healthcare"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="founder-social-icon-btn founder-social-instagram"
                      title="Instagram @ternakai.healthcare"
                      aria-label="Instagram"
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                      </svg>
                    </a>
                    <a
                      href="https://www.youtube.com/@ternakai-healthcare"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="founder-social-icon-btn founder-social-youtube"
                      title="YouTube Ternak AI Healthcare"
                      aria-label="YouTube"
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.377.55a3.016 3.016 0 0 0-2.122 2.136C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.55 9.376.55 9.376.55s7.505 0 9.377-.55a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
                    </a>
                    <a
                      href="https://wa.me/6281234567890?text=Halo%20Ternak%20AI%20Healthcare%2C%20saya%20ingin%20konsultasi%20layanan%20USADA%20AI"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="founder-social-icon-btn founder-social-whatsapp"
                      title="WhatsApp Konsultasi Medis"
                      aria-label="WhatsApp"
                    >
                      <img src="/icons/WA.webp" alt="WhatsApp" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
                    </a>
                    <a
                      href="https://github.com/dewamahesta"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="founder-social-icon-btn founder-social-github"
                      title="GitHub Riset AI Medis"
                      aria-label="GitHub"
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                        <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/>
                      </svg>
                    </a>
                    <a
                      href="mailto:contact@ternak.ai"
                      className="founder-social-icon-btn founder-social-email"
                      title="Email contact@ternak.ai"
                      aria-label="Email"
                    >
                      <Mail size={15} />
                    </a>
                  </div>
                </div>
              </div>

              {/* Member 2: CTO - Bambang Wicaksono, M.Kom (Dinonaktifkan sementara) */}
              {/*
              <div className="team-card horizontal-founder-card">
                <div className="founder-avatar-wrapper">
                  <img
                    src="/team/founder_bambang.jpg"
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
              */}

              {/* Member 3: Advisor - dr. Cynthia Dewi, MARS (Dinonaktifkan sementara) */}
              {/*
              <div className="team-card horizontal-founder-card">
                <div className="founder-avatar-wrapper">
                  <img
                    src="/team/founder_cynthia.jpg"
                    alt={t('landing.team.member3.name')}
                    className="founder-avatar-circle"
                    loading="lazy"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      const fallback = e.target.nextElementSibling;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                  <div className="founder-avatar-fallback indigo-fallback" style={{ display: 'none' }}>
                    <Award size={30} />
                  </div>
                </div>
                <div className="founder-info-right">
                  <h3>{t('landing.team.member3.name')}</h3>
                  <div className="founder-role-row">
                    <span className="founder-role">{t('landing.team.member3.role')}</span>
                    <span className="founder-bullet">•</span>
                    <span className="founder-credential-pill">{t('landing.team.member3.credential')}</span>
                  </div>
                  <p className="founder-desc">{t('landing.team.member3.desc')}</p>
                </div>
              </div>
              */}
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

              {/* [COMMENTED OUT - BPJS CLAIMS & COST CONTROL ARTICLES]
              <div className="article-card">
                <span className="article-tag">Kepatuhan BPJS</span>
                <h3>Strategi Menghindari Pending Klaim BPJS di Klinik</h3>
                <p>Panduan lengkap verifikasi berkas klaim digital agar tidak terjadi retur dan pending dari BPJS Kesehatan.</p>
              </div>
              <div className="article-card">
                <span className="article-tag">Efisiensi Biaya</span>
                <h3>Optimasi Patient Flow dan Pengendalian Biaya Operasional Poli</h3>
                <p>Penerapan algoritma penjadwalan cerdas untuk menekan waktu tunggu dan memangkas biaya administrasi klinik.</p>
              </div>
              */}
            </div>

            {/* Conditionally display "Selengkapnya / Lihat Semua Artikel" if more than 3 articles */}
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
