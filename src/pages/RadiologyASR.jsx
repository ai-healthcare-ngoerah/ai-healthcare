import React from 'react';
import { Activity, Mic, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const RadiologyASR = () => {
  const { t } = useTranslation();

  return (
    <div>
      <h1 className="page-title">{t('radiology.title')}</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
        {t('radiology.subtitle')}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
        <div className="card">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>
            {t('radiology.inputSectionTitle')}
          </h2>
          
          <div style={{ width: '100%', height: '120px', backgroundColor: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', cursor: 'pointer' }}>
            <div style={{ textAlign: 'center' }}>
              <Mic size={32} color="var(--primary-color)" style={{ margin: '0 auto 0.5rem' }} />
              <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{t('radiology.clickToDictate')}</span>
            </div>
          </div>

          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
            {t('radiology.orTypeManual')}
          </p>
          
          <textarea 
            style={{ width: '100%', minHeight: '150px', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', resize: 'vertical', fontFamily: 'inherit', marginBottom: '1rem' }}
            placeholder={t('radiology.textareaPlaceholder')}
          ></textarea>

          <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
            <Activity size={18} />
            {t('radiology.formatBtn')}
          </button>
        </div>

        <div className="card" style={{ backgroundColor: '#f8fafc' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={20} color="var(--primary-color)" />
            {t('radiology.outputSectionTitle')}
          </h2>
          <div style={{ padding: '1rem', backgroundColor: 'white', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', minHeight: '300px' }}>
            <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', marginTop: '40%' }}>
              {t('radiology.emptyOutputPlaceholder')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RadiologyASR;
