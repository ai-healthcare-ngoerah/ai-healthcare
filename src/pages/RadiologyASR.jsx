import React from 'react';
import { Activity, Mic, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const RadiologyASR = () => {
  const { t } = useTranslation();

  return (
    <div className="service-sheet animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto 2.5rem' }}>
      <div className="service-sheet-head">
        <div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
            {t('radiology.title')}
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0', fontSize: '0.86rem' }}>
            {t('radiology.subtitle')}
          </p>
        </div>
      </div>

      <div className="service-sheet-split">
        <div className="service-sheet-pane">
          <h2 style={{ fontSize: '1.08rem', fontWeight: 700, marginBottom: '1rem', color: '#0f172a' }}>
            {t('radiology.inputSectionTitle')}
          </h2>
          
          <div style={{ width: '100%', height: '120px', backgroundColor: '#f8fafc', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem', cursor: 'pointer' }}>
            <div style={{ textAlign: 'center' }}>
              <Mic size={32} color="var(--primary-color)" style={{ margin: '0 auto 0.5rem' }} />
              <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{t('radiology.clickToDictate')}</span>
            </div>
          </div>

          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.85rem' }}>
            {t('radiology.orTypeManual')}
          </p>
          
          <textarea 
            style={{ width: '100%', minHeight: '160px', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0', resize: 'vertical', fontFamily: 'inherit', marginBottom: '1.15rem', backgroundColor: '#ffffff', boxSizing: 'border-box' }}
            placeholder={t('radiology.textareaPlaceholder')}
          ></textarea>

          <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', minHeight: '44px' }}>
            <Activity size={18} />
            {t('radiology.formatBtn')}
          </button>
        </div>

        <div className="service-sheet-pane" style={{ backgroundColor: '#fcfcfd' }}>
          <h2 style={{ fontSize: '1.08rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0f172a' }}>
            <FileText size={20} color="var(--primary-color)" />
            {t('radiology.outputSectionTitle')}
          </h2>
          <div style={{ padding: '1.25rem', backgroundColor: '#ffffff', borderRadius: '10px', minHeight: '320px' }}>
            <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', marginTop: '32%' }}>
              {t('radiology.emptyOutputPlaceholder')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RadiologyASR;
