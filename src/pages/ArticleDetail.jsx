import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Clock, Calendar, User, Quote, Sparkles, MessageSquare, Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { articlesData } from '../data/articlesData';
import ClinicDemoModal from '../components/landing/ClinicDemoModal';
import './ArticleDetail.css';

const ArticleDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  const handleTryForFree = () => {
    if (user) {
      navigate('/options');
    } else {
      navigate('/login');
    }
  };

  const lang = i18n.language === 'en' ? 'en' : 'id';
  const article = articlesData.find((a) => a.slug === slug);
  const data = article ? article[lang] || article.id : null;

  const waText = encodeURIComponent(
    `Halo Tim Ternak AI Healthcare & USADA AI, saya membaca artikel "${data ? data.title : ''}" dan ingin konsultasi implementasi untuk klinik kami di Bali.`
  );
  const waUrl = `https://wa.me/6281234567890?text=${waText}`;

  if (!data) {
    return (
      <div className="article-not-found-page">
        <div className="not-found-card text-center">
          <h2>{lang === 'en' ? 'Article Not Found' : 'Artikel Tidak Ditemukan'}</h2>
          <p>
            {lang === 'en'
              ? 'The article you are looking for is not available or has been moved.'
              : 'Artikel yang Anda cari tidak tersedia atau tautan telah berpindah.'}
          </p>
          <button className="btn-primary" onClick={() => navigate('/')}>
            <ArrowLeft size={16} />
            <span>{lang === 'en' ? 'Back to Home' : 'Kembali ke Beranda'}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="article-detail-page">
      {/* Article Navbar */}
      <nav className="article-navbar">
        <div className="article-nav-left">
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

        <div className="article-nav-right">
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

      <main className="article-main-container">
        {/* Article Header */}
        <header className="article-hero-header">
          <div className="article-meta-badges">
            <span className="article-category-badge">{data.tag}</span>
            <span className="article-read-time">
              <Clock size={14} />
              <span>{data.readTime}</span>
            </span>
            <span className="article-date">
              <Calendar size={14} />
              <span>{data.date}</span>
            </span>
          </div>

          <h1 className="article-headline">{data.title}</h1>

          <div className="article-author-bar">
            <div className="author-avatar">
              <User size={16} />
            </div>
            <div className="author-info">
              <strong>{data.author}</strong>
              <span>{lang === 'en' ? 'Medical Health-Tech Editorial' : 'Tim Editorial Medis & Health-Tech'}</span>
            </div>
          </div>
        </header>

        {/* Lead Excerpt */}
        <div className="article-lead-box">
          <p>{data.excerpt}</p>
        </div>

        {/* Article Body Content */}
        <article className="article-content-body">
          {data.content.map((item, index) => {
            if (item.type === 'heading') {
              return <h2 key={index} className="article-subheading">{item.text}</h2>;
            }
            if (item.type === 'quote') {
              return (
                <blockquote key={index} className="article-callout-quote">
                  <Quote size={24} className="quote-icon" />
                  <p>{item.text}</p>
                </blockquote>
              );
            }
            if (item.type === 'list') {
              return (
                <ul key={index} className="article-feature-list">
                  {item.items.map((listItem, i) => (
                    <li key={i}>{listItem}</li>
                  ))}
                </ul>
              );
            }
            return <p key={index} className="article-paragraph">{item.text}</p>;
          })}
        </article>

        {/* In-Article Conversion Banner */}
        <section className="article-cta-banner">
          <div className="cta-banner-content">
            <div className="cta-banner-badge">
              <Sparkles size={14} />
              <span>USADA AI for Clinics</span>
            </div>
            <h2>
              {lang === 'en'
                ? 'Ready to Transform Your Clinic with USADA AI?'
                : 'Tertarik Menerapkan USADA AI di Klinik Anda?'}
            </h2>
            <p>
              {lang === 'en'
                ? 'Free clinic doctors from documentation burdens with ambient medical scribing and automated patient flow.'
                : 'Bebaskan dokter klinik Anda dari beban mengetik resume medis dengan asisten suara otomatis dan sistem reservasi pintar.'}
            </p>
            <div className="cta-banner-buttons">
              <button className="btn-primary" onClick={() => setIsDemoModalOpen(true)}>
                <Send size={16} />
                <span>{lang === 'en' ? 'Schedule Free Clinic Demo' : 'Jadwalkan Demo Gratis Klinik'}</span>
              </button>
              <a href={waUrl} target="_blank" rel="noopener noreferrer" className="btn-wa-action">
                <MessageSquare size={16} />
                <span>{lang === 'en' ? 'Chat on WhatsApp' : 'Konsultasi via WhatsApp'}</span>
              </a>
            </div>
          </div>
        </section>

        {/* Read More / Next Navigation */}
        <div className="article-bottom-nav">
          <button className="nav-back-link" onClick={() => navigate('/')}>
            <ArrowLeft size={16} />
            <span>{lang === 'en' ? 'Back to All Solutions & Articles' : 'Kembali ke Beranda & Semua Artikel'}</span>
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="article-footer">
        <p>
          {lang === 'en'
            ? '© 2026 Usada Tech • USADA AI Healthcare. All Rights Reserved.'
            : '© 2026 Usada Tech • USADA AI Healthcare. Seluruh Hak Cipta Dilindungi.'}
        </p>
      </footer>

      {/* Demo Modal */}
      <ClinicDemoModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
      />
    </div>
  );
};

export default ArticleDetail;
