import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, CheckCircle, MessageSquare, Send, Building2, User, Phone, Sparkles } from 'lucide-react';

const ClinicDemoModal = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    clinic: '',
    need: 'scribe'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate submission delay
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 600);
  };

  const handleReset = () => {
    setIsSuccess(false);
    setFormData({ name: '', phone: '', clinic: '', need: 'scribe' });
    onClose();
  };

  const waText = encodeURIComponent(
    `Halo Tim Usada Tech, saya ingin berkonsultasi mengenai implementasi USADA AI dan mengklaim uji coba gratis 1 bulan untuk fasilitas kesehatan kami di Bali.`
  );
  const waUrl = `https://wa.me/6281234567890?text=${waText}`;

  return (
    <div className="clinic-demo-modal-overlay" onClick={handleReset}>
      <div className="clinic-demo-modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={handleReset} aria-label="Close modal">
          <X size={20} />
        </button>

        {!isSuccess ? (
          <>
            <div className="modal-header">
              <div className="modal-badge">
                <Sparkles size={14} />
                <span>USADA AI Demo</span>
              </div>
              <h3>{t('landing.modal.title')}</h3>
              <p>{t('landing.modal.subtitle')}</p>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>
                  <User size={15} />
                  <span>{t('landing.modal.name')}</span>
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder={t('landing.modal.namePlaceholder')}
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>
                  <Phone size={15} />
                  <span>{t('landing.modal.phone')}</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  placeholder={t('landing.modal.phonePlaceholder')}
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>
                  <Building2 size={15} />
                  <span>{t('landing.modal.clinic')}</span>
                </label>
                <input
                  type="text"
                  name="clinic"
                  required
                  placeholder={t('landing.modal.clinicPlaceholder')}
                  value={formData.clinic}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>
                  <Sparkles size={15} />
                  <span>{t('landing.modal.need')}</span>
                </label>
                <select name="need" value={formData.need} onChange={handleChange}>
                  <option value="scribe">{t('landing.modal.optScribe')}</option>
                  <option value="reservation">{t('landing.modal.optReservation')}</option>
                  <option value="both">{t('landing.modal.optBoth')}</option>
                </select>
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn-primary modal-submit-btn" disabled={isSubmitting}>
                  <Send size={16} />
                  <span>{isSubmitting ? t('landing.modal.submitting') : t('landing.modal.submit')}</span>
                </button>

                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="modal-wa-btn"
                >
                  <MessageSquare size={16} />
                  <span>{t('landing.modal.waDirect')}</span>
                </a>
              </div>
            </form>
          </>
        ) : (
          <div className="modal-success-view">
            <div className="success-icon-wrap">
              <CheckCircle size={48} color="var(--primary-color, #10b981)" />
            </div>
            <h3>Permintaan Terkirim!</h3>
            <p>{t('landing.modal.success')}</p>
            <div className="success-actions">
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}
              >
                <MessageSquare size={16} />
                <span>Buka WhatsApp Sekarang</span>
              </a>
              <button className="btn-outline" onClick={handleReset} style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer' }}>
                {t('landing.modal.close')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClinicDemoModal;
