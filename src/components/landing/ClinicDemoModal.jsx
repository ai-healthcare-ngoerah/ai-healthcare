import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, CheckCircle, Check, MessageSquare, Send, Building2, User, Phone, Sparkles } from 'lucide-react';

const AI_SERVICES = [
  { id: 'scribe', labelKey: 'landing.modal.services.scribe', fallback: 'AI Medical Scribe (SOAP/CPPT)' },
  { id: 'bpjs', labelKey: 'landing.modal.services.bpjs', fallback: 'Verifikasi Klaim BPJS (Casemix)' },
  { id: 'admission', labelKey: 'landing.modal.services.admission', fallback: 'Admisi & Antrean Cerdas' },
  { id: 'connect', labelKey: 'landing.modal.services.connect', fallback: 'Connect & WhatsApp AI' },
  { id: 'analytics', labelKey: 'landing.modal.services.analytics', fallback: 'Dashboard Analisis Data Sains' }
];

const ClinicDemoModal = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    clinic: ''
  });
  const [selectedServices, setSelectedServices] = useState(['scribe']);
  const [serviceError, setServiceError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleToggleService = (serviceId) => {
    setSelectedServices((prev) => {
      const isAlreadySelected = prev.includes(serviceId);
      const updated = isAlreadySelected
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId];
      if (updated.length > 0) setServiceError(false);
      return updated;
    });
  };

  const handleKeyDownService = (e, serviceId) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleToggleService(serviceId);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedServices.length === 0) {
      setServiceError(true);
      return;
    }
    setIsSubmitting(true);
    // Simulate submission delay
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 600);
  };

  const handleReset = () => {
    setIsSuccess(false);
    setServiceError(false);
    setFormData({ name: '', phone: '', clinic: '' });
    setSelectedServices(['scribe']);
    onClose();
  };

  const selectedServiceNames = selectedServices
    .map((sId) => {
      const sObj = AI_SERVICES.find((s) => s.id === sId);
      return sObj ? t(sObj.labelKey, sObj.fallback) : sId;
    })
    .join(', ');

  const clinicPart = formData.clinic.trim() ? ` untuk ${formData.clinic.trim()}` : '';
  const waText = encodeURIComponent(
    `Halo Tim Usada Tech, saya ingin berkonsultasi mengenai implementasi produk USADA AI${clinicPart}.\nLayanan yang kami minati: ${selectedServiceNames || 'Layanan AI USADA'}.\nMohon informasi uji coba gratis dan jadwal konsultasinya.`
  );
  const waUrl = `https://wa.me/6281234567890?text=${waText}`;

  return (
    <div className="clinic-demo-modal-overlay" onClick={handleReset}>
      <div className="clinic-demo-modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={handleReset} aria-label="Close modal">
          <X size={18} />
        </button>

        {!isSuccess ? (
          <>
            <div className="modal-header">
              <div className="modal-badge">
                <Sparkles size={13} />
                <span>USADA AI Demo</span>
              </div>
              <h3>{t('landing.modal.title')}</h3>
              <p>{t('landing.modal.subtitle')}</p>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              {/* Responsive 2-column row for Name & Phone */}
              <div className="modal-form-row">
                <div className="form-group">
                  <label>
                    <User size={14} />
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
                    <Phone size={14} />
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
              </div>

              {/* Full-width Clinic / Facility name */}
              <div className="form-group">
                <label>
                  <Building2 size={14} />
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

              {/* Multi-select AI Services */}
              <div className="form-group service-select-group">
                <div className="service-label-row">
                  <label>
                    <Sparkles size={14} />
                    <span>{t('landing.modal.need')}</span>
                  </label>
                  <span className="service-subhint">{t('landing.modal.needHint', 'Pilih minimal satu layanan')}</span>
                </div>

                <div
                  className={`service-chips-grid ${serviceError ? 'chips-has-error' : ''}`}
                  role="group"
                  aria-label={t('landing.modal.need')}
                >
                  {AI_SERVICES.map((srv) => {
                    const isSelected = selectedServices.includes(srv.id);
                    return (
                      <button
                        key={srv.id}
                        type="button"
                        role="checkbox"
                        aria-checked={isSelected}
                        tabIndex={0}
                        className={`service-chip ${isSelected ? 'active' : ''}`}
                        onClick={() => handleToggleService(srv.id)}
                        onKeyDown={(e) => handleKeyDownService(e, srv.id)}
                      >
                        <span className="chip-indicator">
                          {isSelected ? <Check size={12} strokeWidth={2.6} /> : null}
                        </span>
                        <span className="chip-text">{t(srv.labelKey, srv.fallback)}</span>
                      </button>
                    );
                  })}
                </div>

                {serviceError && (
                  <span className="service-error-text">
                    {t('landing.modal.needError', 'Pilih minimal satu layanan AI.')}
                  </span>
                )}
              </div>

              {/* Action buttons in compact row */}
              <div className="modal-actions-row">
                <button type="submit" className="btn-primary modal-submit-btn" disabled={isSubmitting}>
                  <Send size={15} />
                  <span>{isSubmitting ? t('landing.modal.submitting') : t('landing.modal.submit')}</span>
                </button>

                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="modal-wa-btn"
                >
                  <MessageSquare size={15} />
                  <span>{t('landing.modal.waDirect')}</span>
                </a>
              </div>
            </form>
          </>
        ) : (
          <div className="modal-success-view">
            <div className="success-icon-wrap">
              <CheckCircle size={44} color="var(--primary-color, #10b981)" />
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
                <MessageSquare size={15} />
                <span>Buka WhatsApp Sekarang</span>
              </a>
              <button
                className="btn-outline"
                onClick={handleReset}
                style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer' }}
              >
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
