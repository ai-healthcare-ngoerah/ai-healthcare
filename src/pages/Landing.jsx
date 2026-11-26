import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, TrendingDown, ArrowRight, Clock, Sparkles, ShieldCheck, Stethoscope, Cpu, MessageSquare, Microscope, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { articlesData } from '../data/articlesData';
import ClinicDemoModal from '../components/landing/ClinicDemoModal';
import LandingFloatingAssistant from '../components/landing/LandingFloatingAssistant';
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

  const solutionServices = [
    {
      id: 1,
      tag: t('landing.solution.service1.tag'),
      title: t('landing.solution.service1.title'),
      desc: t('landing.solution.service1.desc'),
      icon: Stethoscope,
      pillClass: 'emerald-pill',
      themeClass: 'theme-emerald'
    },
    {
      id: 2,
      tag: t('landing.solution.service2.tag'),
      title: t('landing.solution.service2.title'),
      desc: t('landing.solution.service2.desc'),
      icon: MessageSquare,
      pillClass: 'green-pill',
      themeClass: 'theme-green'
    },
    {
      id: 3,
      tag: t('landing.solution.service3.tag'),
      title: t('landing.solution.service3.title'),
      desc: t('landing.solution.service3.desc'),
      icon: ShieldCheck,
      pillClass: 'blue-pill',
      themeClass: 'theme-blue'
    },
    {
      id: 4,
      tag: t('landing.solution.service4.tag'),
      title: t('landing.solution.service4.title'),
      desc: t('landing.solution.service4.desc'),
      icon: TrendingDown,
      pillClass: 'amber-pill',
      themeClass: 'theme-amber'
    },
    {
      id: 5,
      tag: t('landing.solution.service5.tag'),
      title: t('landing.solution.service5.title'),
      desc: t('landing.solution.service5.desc'),
      icon: Microscope,
      pillClass: 'purple-pill',
      themeClass: 'theme-purple research-card'
    }
  ];

  const [slideIndex, setSlideIndex] = useState(5);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [touchStartX, setTouchStartX] = useState(null);
  const [touchEndX, setTouchEndX] = useState(null);

  const handleNextSlide = () => {
    setIsTransitioning(true);
    setSlideIndex((prev) => prev + 1);
  };

  const handlePrevSlide = () => {
    setIsTransitioning(true);
    setSlideIndex((prev) => prev - 1);
  };

  const handleTransitionEnd = () => {
    if (slideIndex >= 10) {
      setIsTransitioning(false);
      setSlideIndex((prev) => prev - 5);
    } else if (slideIndex < 5) {
      setIsTransitioning(false);
      setSlideIndex((prev) => prev + 5);
    }
  };

  const handleDotClick = (targetIndex) => {
    setIsTransitioning(true);
    const currentBase = ((slideIndex % 5) + 5) % 5;
    const diff = targetIndex - currentBase;
    setSlideIndex((prev) => prev + diff);
  };

  const handleTouchStart = (e) => {
    setTouchStartX(e.targetTouches[0].clientX);
    setTouchEndX(null);
  };

  const handleTouchMove = (e) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStartX === null || touchEndX === null) return;
    const distance = touchStartX - touchEndX;
    if (distance > 40) {
      handleNextSlide();
    } else if (distance < -40) {
      handlePrevSlide();
    }
    setTouchStartX(null);
    setTouchEndX(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft') {
      handlePrevSlide();
    } else if (e.key === 'ArrowRight') {
      handleNextSlide();
    }
  };

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
          <img src="/logos/usada-ai-icon.webp" alt="USADA AI Logo" style={{ height: '40px', width: '40px', objectFit: 'contain' }} />
          <div className="landing-logo-text">
            <h2>{t('landing.nav.brand', 'USADA AI')}</h2>
            <span className="landing-logo-subtitle">{t('landing.nav.brandSubtitle', 'Sistem Otomasi Klinis oleh Usada Tech')}</span>
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
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '8px',
              padding: '0.45rem 0.85rem',
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
        {/* Hero Section */}
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
              <a
                href="https://wa.me/6285183071646"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary btn-large cta-btn-inverted"
                aria-label={t('landing.hero.consultation', 'Konsultasi Gratis')}
              >
                {t('landing.hero.consultation', 'Konsultasi Gratis')}
              </a>
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
              </section>

              {/* Agitation Card (Red accents) */}
              <section className="pas-card agitation-card">
                <div className="pas-icon-wrapper red-icon" style={{ backgroundColor: 'transparent' }}>
                  <img src="/illustrations/pending.svg" alt="Pending Risk" style={{ width: '60px', height: '60px' }} />
                </div>
                <h2>{t('landing.problem.card2.title')}</h2>
                <p dangerouslySetInnerHTML={{ __html: t('landing.problem.card2.desc').replace('(pending)', '<strong>(pending)</strong>') }}></p>
              </section>
            </div>
          </div>

          {/* Solution Section: 5 Core AI Healthcare Solutions (3-Card Infinite Carousel) */}
          <section id="solusi" className="solution-section">
            <div className="solution-header text-center">
              <span className="section-pill-badge">{t('landing.solution.badge', 'Layanan AI Healthcare')}</span>
              <h2>{t('landing.solution.title')}</h2>
              <p>{t('landing.solution.subtitle')}</p>
            </div>

            <div 
              className="solution-carousel-container"
              tabIndex={0}
              onKeyDown={handleKeyDown}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* Left Floating Arrow */}
              <button 
                type="button"
                className="carousel-arrow-btn arrow-prev" 
                onClick={handlePrevSlide}
                aria-label="Previous Clinical Modules"
              >
                <ChevronLeft size={24} />
              </button>

              {/* Viewport & Sliding Track */}
              <div className="solution-carousel-viewport">
                <div 
                  className="solution-carousel-track"
                  onTransitionEnd={handleTransitionEnd}
                  style={{
                    transform: `translateX(calc(-${slideIndex} * (var(--card-width) + var(--card-gap))))`,
                    transition: isTransitioning ? 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)' : 'none'
                  }}
                >
                  {[...solutionServices, ...solutionServices, ...solutionServices].map((service, index) => {
                    const IconComp = service.icon;
                    const isLeadCard = index % 5 === ((slideIndex % 5) + 5) % 5;

                    return (
                      <div 
                        key={`${service.id}-${index}`} 
                        className={`solution-carousel-card ${service.themeClass} ${isLeadCard ? 'card-lead-active' : ''}`}
                      >
                        <div className="card-top-header">
                          <div className={`service-icon-pill ${service.pillClass}`}>
                            <IconComp size={19} />
                            <span>{service.tag}</span>
                          </div>
                        </div>

                        <h3>{service.title}</h3>
                        <p>{service.desc}</p>

                        <div className="card-bottom-bar">
                          <span className="card-status-pill">
                            <span className="status-dot"></span>
                            Modul Siap Implementasi
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Floating Arrow */}
              <button 
                type="button"
                className="carousel-arrow-btn arrow-next" 
                onClick={handleNextSlide}
                aria-label="Next Clinical Modules"
              >
                <ChevronRight size={24} />
              </button>
            </div>

            {/* Pagination Controls */}
            <div className="carousel-controls-bar">
              <div className="carousel-dots-wrapper">
                {solutionServices.map((_, dotIndex) => {
                  const currentActiveDot = ((slideIndex % 5) + 5) % 5;
                  return (
                    <button
                      key={dotIndex}
                      type="button"
                      className={`carousel-dot-indicator ${dotIndex === currentActiveDot ? 'dot-active' : ''}`}
                      onClick={() => handleDotClick(dotIndex)}
                      aria-label={`Go to module ${dotIndex + 1}`}
                    />
                  );
                })}
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

                <div className="pricing-headline-price">
                  <span className="headline-original-strike">Rp 450.000</span>
                  <div className="headline-price-row">
                    <span className="price-amount">Rp 300.000</span>
                    <span className="price-period">/ bulan</span>
                  </div>
                  <span className="price-tag-sub">1 Service AI</span>
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
                  <div className="pricing-rate-item rate-highlight">
                    <span className="rate-service-count">1 Service AI</span>
                    <div className="rate-price-group">
                      <span className="rate-original-strike">Rp 450.000</span>
                      <span className="rate-amount">Rp 300.000 <small>/ bln</small></span>
                    </div>
                  </div>
                  <div className="pricing-rate-item">
                    <span className="rate-service-count">2 Service AI</span>
                    <div className="rate-price-group">
                      <span className="rate-original-strike">Rp 750.000</span>
                      <span className="rate-amount">Rp 500.000 <small>/ bln</small></span>
                    </div>
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

                <div className="pricing-headline-price">
                  <span className="headline-original-strike">Rp 1.600.000</span>
                  <div className="headline-price-row">
                    <span className="price-amount emerald-amount">Rp 1.000.000</span>
                    <span className="price-period">/ bulan</span>
                  </div>
                  <span className="price-tag-sub emerald-tag-sub">3 Service AI</span>
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
                  <div className="pricing-rate-item rate-highlight emerald-highlight">
                    <span className="rate-service-count">3 Service AI</span>
                    <div className="rate-price-group">
                      <span className="rate-original-strike">Rp 1.600.000</span>
                      <span className="rate-amount">Rp 1.000.000 <small>/ bln</small></span>
                    </div>
                  </div>
                </div>

                <button className="pricing-cta-btn featured-cta-btn" onClick={() => setIsDemoModalOpen(true)}>
                  {t('landing.pricing.plan2.cta')}
                </button>
              </div>

              {/* Plan 3: Paket Max */}
              <div className="pricing-card">
                <div className="featured-ribbon-pill purple-ribbon-pill">{t('landing.pricing.plan3.ribbon', 'Best Performance ⚡')}</div>
                <div className="pricing-card-top">
                  <span className="pricing-tier-pill purple-tier">{t('landing.pricing.plan3.target', 'Full Enterprise')}</span>
                  <h3>{t('landing.pricing.plan3.name')}</h3>
                  <div className="pricing-model-badge purple-model">{t('landing.pricing.plan3.model')}</div>
                </div>

                <div className="pricing-headline-price">
                  <span className="headline-original-strike">Rp 3.200.000</span>
                  <div className="headline-price-row">
                    <span className="price-amount purple-amount">Rp 2.000.000</span>
                    <span className="price-period">/ bulan</span>
                  </div>
                  <span className="price-tag-sub purple-tag-sub">5 Service AI + Research</span>
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
                    <span className="all-in-title">Semua 5 Layanan AI + Modul Research</span>
                    <div className="all-in-price-wrap">
                      <span className="rate-original-strike enterprise-strike">Rp 3.200.000</span>
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
                  <h4>{t('landing.pricing.freeTrialBanner.title', 'Free Trial 1 Bulan untuk 3 RS & Klinik Pertama')}</h4>
                  <p>{t('landing.pricing.freeTrialBanner.desc', 'Coba Paket Standar langsung di server klinik Anda selama 30 hari, gratis dan tanpa komitmen kontrak.')}</p>
                </div>
              </div>
              <button
                type="button"
                className="btn-primary bottom-trial-cta-btn"
                onClick={() => setIsDemoModalOpen(true)}
              >
                <span>{t('landing.pricing.freeTrialBanner.cta', 'Klaim Free Trial Paket Standar')}</span>
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
                    src="/team/gus-agung.webp"
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
                    {art.image && (
                      <div className="article-card-thumb-wrapper">
                        <img
                          src={art.image}
                          alt={data.title}
                          className="article-card-thumb-img"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <div className="article-card-content">
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
              <div className="cta-actions-wrapper">
                <button
                  className="btn-primary btn-large cta-btn-inverted"
                  onClick={() => setIsDemoModalOpen(true)}
                >
                  {t('landing.cta.button')}
                </button>
              </div>
              <div className="cta-trust-row">
                <span>✓ {t('landing.cta.trust1', 'Uji coba 1 bulan gratis untuk 3 faskes pertama')}</span>
                <span className="cta-trust-bullet">•</span>
                <span>✓ {t('landing.cta.trust2', 'Deploy AI lokal aman di server RS/klinik')}</span>
                <span className="cta-trust-bullet">•</span>
                <span>✓ {t('landing.cta.trust3', 'Kepatuhan penuh regulasi PMK 24/2022 & SatuSehat')}</span>
              </div>
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

      <LandingFloatingAssistant onOpenDemo={() => setIsDemoModalOpen(true)} />
    </div>
  );
};

export default Landing;
