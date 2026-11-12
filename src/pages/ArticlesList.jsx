import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Calendar, Sparkles, Send, MessageSquare, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { articlesData } from '../data/articlesData';
import ClinicDemoModal from '../components/landing/ClinicDemoModal';
import './ArticlesList.css';

const ArticlesList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  const lang = i18n.language === 'en' ? 'en' : 'id';

  const handleTryForFree = () => {
    if (user) {
      navigate('/options');
    } else {
      navigate('/login');
    }
  };

  const waText = encodeURIComponent(
    'Halo Tim Ternak AI Healthcare & USADA AI, saya ingin konsultasi mengenai implementasi sistem untuk klinik kami di Bali.'
  );
  const waUrl = `https://wa.me/6281234567890?text=${waText}`;

  return (
    <div className="articles-list-page">
      {/* Top Navbar */}
      <nav className="articles-navbar">
        <div className="articles-nav-left">
          <button className="nav-back-btn" onClick={() => navigate('/')}>
            <ArrowLeft size={18} />
            <span>{lang === 'en' ? 'Back to Home' : 'Kembali ke Beranda'}</span>
          </button>
          <div className="nav-brand-wrap" onClick={() => navigate('/')}>
            <img src="/logos/brand/logo-black.webp" alt="Ternak AI Healthcare" style={{ height: '32px' }} />
            <div className="nav-brand-title">
              <strong>Ternak AI Healthcare</strong>
              <span>USADA AI</span>
            </div>
          </div>
        </div>

        <div className="articles-nav-right">
          <button
            onClick={() => i18n.changeLanguage(lang === 'en' ? 'id' : 'en')}
            className="lang-toggle-btn"
            style={{
              background: 'transparent',
              border: '1px solid var(--border-color, #cbd5e1)',
              borderRadius: '8px',
              padding: '0.4rem 0.8rem',
              fontWeight: 600,
              fontSize: '0.875rem',
              color: 'var(--text-main, #0f172a)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease'
            }}
          >
            {lang === 'en' ? 'EN' : 'ID'}
          </button>
          <button className="btn-primary btn-sm" onClick={handleTryForFree}>
            {t('landing.nav.tryFree')}
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="articles-directory-container">
        {/* Header Hero */}
        <header className="articles-directory-header text-center">
          <span className="directory-badge">
            <Sparkles size={14} />
            <span>{t('landing.articlesDirectory.badge', 'Pusat Edukasi Medis')}</span>
          </span>
          <h1>{t('landing.articlesDirectory.title', 'Wawasan & Panduan Digitalisasi Klinik')}</h1>
        </header>

        {/* Articles Cards Grid */}
        <div className="directory-cards-grid">
          {articlesData.map((art) => {
            const data = art[lang] || art.id;
            return (
              <div key={art.slug} className="directory-article-card">
                <div className="card-top-meta">
                  <span className="card-tag">{data.tag}</span>
                  <span className="card-read-time">
                    <Clock size={13} />
                    <span>{data.readTime}</span>
                  </span>
                </div>

                <h3>{data.title}</h3>
                <p>{data.excerpt}</p>

                <div className="card-bottom-bar">
                  <span className="card-date">
                    <Calendar size={13} />
                    <span>{data.date}</span>
                  </span>
                  <button
                    className="card-read-more-btn"
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

        {/* [COMMENTED OUT - DIRECTORY CTA BANNER]
        <section className="directory-cta-banner">
          <div className="directory-cta-content text-center">
            <div className="cta-banner-badge">
              <Sparkles size={14} />
              <span>USADA AI for Clinics</span>
            </div>
            <h2>
              {lang === 'en'
                ? 'Ready to Modernize Your Outpatient Clinic?'
                : 'Siap Meringankan Beban Operasional Klinik Anda?'}
            </h2>
            <p>
              {lang === 'en'
                ? 'Empower clinic physicians with AI medical scribing and automated patient reminders.'
                : 'Tingkatkan produktivitas dokter dan kepuasan pasien klinik Anda dengan USADA AI sekarang.'}
            </p>
            <div className="directory-cta-buttons">
              <button className="btn-primary" onClick={() => setIsDemoModalOpen(true)}>
                <Send size={16} />
                <span>{lang === 'en' ? 'Get Free Demo' : 'Dapatkan Demo Gratis'}</span>
              </button>
              <a href={waUrl} target="_blank" rel="noopener noreferrer" className="btn-wa-action">
                <MessageSquare size={16} />
                <span>{lang === 'en' ? 'Chat on WhatsApp' : 'Konsultasi via WhatsApp'}</span>
              </a>
            </div>
          </div>
        </section>
        */}
      </main>

      {/* Footer */}
      <footer className="articles-footer text-center">
        <p>
          {lang === 'en'
            ? '© 2026 Ternak AI Healthcare (Subsidiary of Ternak Automation). Powered by USADA AI. All Rights Reserved.'
            : '© 2026 Ternak AI Healthcare (Anak Usaha Ternak Automation). Powered by USADA AI. Seluruh Hak Cipta Dilindungi.'}
        </p>
      </footer>

      {/* Clinic Demo Modal */}
      <ClinicDemoModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
      />
    </div>
  );
};

export default ArticlesList;
