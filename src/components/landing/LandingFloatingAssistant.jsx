import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Bot, X, Send, ArrowRight, RefreshCw } from 'lucide-react';
import { chatWithAiAgent } from '../../services/api';
import './LandingFloatingAssistant.css';

const LandingFloatingAssistant = ({ onOpenDemo }) => {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);

  const isEn = i18n.language === 'en';

  const getFallbackReply = (text) => {
    const q = text.toLowerCase();
    if (/trial|gratis|free|harga|paket|price|cost|demo/i.test(q)) {
      return isEn
        ? 'USADA AI offers a 1-month free trial of our Standard Suite for the first 3 partner clinics or hospitals, deployed securely on your local server without long-term lock-in. Click "Book Free Clinic Demo" below to schedule onboarding.'
        : 'USADA AI menyediakan uji coba gratis 1 bulan untuk Paket Standar bagi 3 klinik atau RS mitra pertama, dipasang aman langsung di server faskes tanpa kontrak mengikat. Klik tombol "Jadwalkan Demo Gratis" di bawah untuk mendaftar.';
    }
    if (/modul|fitur|layanan|feature|scribe|bpjs|whatsapp|analytics/i.test(q)) {
      return isEn
        ? 'USADA AI covers 5 integrated modules: AI Medical Scribe (SOAP & ICD-10), BPJS Claim Verification, Smart Admission & Queue, Omnichannel WhatsApp AI, and the Operational Analytics Dashboard.'
        : 'USADA AI mencakup 5 modul terintegrasi: AI Medical Scribe (SOAP & ICD-10), Verifikasi Klaim BPJS, Admisi & Antrean Cerdas, WhatsApp AI Omnichannel, dan Dashboard Analisis Operasional.';
    }
    return isEn
      ? 'USADA AI automates clinical documentation, BPJS claim checks, and patient admission workflows in compliance with PMK 24/2022 and SatuSehat. Use the button below to schedule a tailored clinic demo.'
      : 'USADA AI mengotomatiskan pencatatan rekam medis, audit klaim BPJS, dan alur admisi pasien sesuai standar PMK 24/2022 dan SatuSehat. Gunakan tombol di bawah untuk menjadwalkan demo langsung.';
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const sendMessage = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setMessages((prev) => [...prev, { role: 'user', text: trimmed }]);
    setLoading(true);

    try {
      const res = await chatWithAiAgent(trimmed, 'web');
      const reply = res?.reply || res?.response || res?.message;
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: reply || getFallbackReply(trimmed) }
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: getFallbackReply(trimmed) }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const text = input;
    setInput('');
    sendMessage(text);
  };

  const content = (
    <>
      {isOpen && (
        <aside
          className="lfa-drawer"
          role="dialog"
          aria-label={t('landing.floatingAssistant.title')}
        >
          <div className="lfa-drawer-head">
            <div className="lfa-drawer-title-group">
              <div className="lfa-drawer-icon">
                <Bot size={18} />
              </div>
              <h2 className="lfa-drawer-title">{t('landing.floatingAssistant.title')}</h2>
            </div>

            <button
              type="button"
              className="lfa-close-btn"
              onClick={() => setIsOpen(false)}
              title={t('landing.floatingAssistant.closeAria')}
              aria-label={t('landing.floatingAssistant.closeAria')}
            >
              <X size={16} />
            </button>
          </div>

          <div className="lfa-drawer-body">
            <p className="lfa-greeting">{t('landing.floatingAssistant.greeting')}</p>

            {messages.length > 0 && (
              <div className="lfa-messages">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`lfa-msg lfa-msg-${msg.role}`}>
                    {msg.text}
                  </div>
                ))}
                {loading && (
                  <div className="lfa-loading" role="status" aria-live="polite">
                    <RefreshCw size={14} className="spin" />
                    <span>{t('landing.floatingAssistant.loading')}</span>
                  </div>
                )}
              </div>
            )}

            <div className="lfa-quick-prompts">
              <button
                type="button"
                className="lfa-prompt-chip"
                onClick={() => sendMessage(t('landing.floatingAssistant.quickPrompt1'))}
                disabled={loading}
              >
                {t('landing.floatingAssistant.quickPrompt1')}
              </button>
              <button
                type="button"
                className="lfa-prompt-chip"
                onClick={() => sendMessage(t('landing.floatingAssistant.quickPrompt2'))}
                disabled={loading}
              >
                {t('landing.floatingAssistant.quickPrompt2')}
              </button>
            </div>

            {onOpenDemo && (
              <button
                type="button"
                className="lfa-demo-cta"
                onClick={() => {
                  setIsOpen(false);
                  onOpenDemo();
                }}
              >
                <span>{t('landing.floatingAssistant.demoCta')}</span>
                <ArrowRight size={15} />
              </button>
            )}
          </div>

          <form className="lfa-drawer-form" onSubmit={handleSubmit}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('landing.floatingAssistant.inputPlaceholder')}
              aria-label={t('landing.floatingAssistant.inputPlaceholder')}
              className="lfa-input"
              disabled={loading}
            />
            <button
              type="submit"
              className="lfa-send-btn"
              disabled={loading || !input.trim()}
              aria-label={t('landing.floatingAssistant.sendAria')}
            >
              <Send size={15} />
            </button>
          </form>
        </aside>
      )}

      <button
        type="button"
        className="lfa-fab"
        onClick={() => setIsOpen((prev) => !prev)}
        title={t('landing.floatingAssistant.fabAria')}
        aria-label={t('landing.floatingAssistant.fabAria')}
        aria-expanded={isOpen}
      >
        {isOpen ? <X size={22} aria-hidden="true" /> : <Bot size={24} aria-hidden="true" />}
      </button>
    </>
  );

  return typeof document !== 'undefined' ? createPortal(content, document.body) : content;
};

export default LandingFloatingAssistant;
