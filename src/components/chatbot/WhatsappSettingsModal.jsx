import React, { useState } from 'react';
import { Save, X, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { updateWhatsappSettings } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';

const WhatsappSettingsModal = ({ 
  initialData, 
  form: externalForm, 
  setForm: externalSetForm, 
  onSave: externalOnSave, 
  onSuccess, 
  onClose 
}) => {
  const { t } = useTranslation();
  const { showToast } = useNotification();

  const [formData, setFormData] = useState({
    clinic_name: initialData?.clinic_name || externalForm?.clinic_name || '',
    whatsapp_number: initialData?.whatsapp_number || externalForm?.whatsapp_number || '',
    whatsapp_label: initialData?.whatsapp_label || externalForm?.whatsapp_label || '',
    promo_message: initialData?.promo_message || externalForm?.promo_message || ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (key, value) => {
    const updated = { ...formData, [key]: value };
    setFormData(updated);
    if (typeof externalSetForm === 'function') {
      externalSetForm(updated);
    }
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (typeof externalOnSave === 'function') {
      return externalOnSave();
    }

    setIsSubmitting(true);
    try {
      const res = await updateWhatsappSettings(formData);
      showToast({
        type: 'success',
        title: t('chatbot.settings.savedTitle', 'Pengaturan Berhasil Disimpan'),
        message: t('chatbot.settings.savedMsg', 'Konfigurasi WhatsApp dan pesan promosi berhasil diperbarui.')
      });
      if (typeof onSuccess === 'function') {
        onSuccess(res || formData);
      }
      if (typeof onClose === 'function') {
        onClose();
      }
    } catch (err) {
      showToast({
        type: 'error',
        title: t('chatbot.settings.errorTitle', 'Gagal Menyimpan Pengaturan'),
        message: err.message || 'Terjadi kesalahan saat menghubungi server.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card animate-fade-in" style={{ marginTop: '1.5rem', marginBottom: '1.5rem', border: '1px solid var(--primary-color)', boxShadow: 'var(--shadow-md)', background: '#ffffff', borderRadius: 'var(--radius-md)', padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
          {t('chatbot.settings.modalTitle', 'Pengaturan WhatsApp & Pesan Promosi')}
        </h3>
        <button
          type="button"
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}
          title={t('common.close', 'Tutup')}
        >
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSave}>
        {[
          { key: 'clinic_name', label: t('chatbot.settings.clinicName', 'Nama Klinik / Faskes') },
          { key: 'whatsapp_number', label: t('chatbot.settings.whatsappNumber', 'Nomor WhatsApp Hotline') },
          { key: 'whatsapp_label', label: t('chatbot.settings.serviceLabel', 'Label Layanan') },
        ].map(({ key, label }) => (
          <div key={key} style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-main)' }}>
              {label}
            </label>
            <input
              type="text"
              value={formData?.[key] || ''}
              onChange={(e) => handleChange(key, e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                fontSize: '0.9rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>
        ))}

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-main)' }}>
            {t('chatbot.settings.promoMessage', 'Pesan Promosi / Template Broadcast')}
          </label>
          <textarea
            value={formData?.promo_message || ''}
            onChange={(e) => handleChange('promo_message', e.target.value)}
            style={{
              width: '100%',
              minHeight: '110px',
              padding: '0.75rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              resize: 'vertical',
              fontFamily: 'inherit',
              fontSize: '0.9rem',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isSubmitting}
            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
          >
            {t('common.cancel', 'Batal')}
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0.5rem 1.15rem', fontSize: '0.85rem' }}
          >
            {isSubmitting ? (
              <>
                <RefreshCw size={15} className="spin" />
                <span>{t('common.saving', 'Menyimpan...')}</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>{t('chatbot.settings.saveBtn', 'Simpan Pengaturan')}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default WhatsappSettingsModal;
