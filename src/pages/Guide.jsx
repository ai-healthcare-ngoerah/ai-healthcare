import React from 'react';
import { Stethoscope, Activity, MessageSquare, FileCheck, BookOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Guide = () => {
  const { t } = useTranslation();

  return (
    <div>
      <h1 className="page-title">{t('guide.title')}</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
        {t('guide.subtitle')}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

        {/* 1. Asisten Medis (SOAP AI & Input Suara) */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <Stethoscope size={24} color="var(--primary-color)" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{t('guide.features.scribe.title')}</h2>
          </div>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: '1.6' }}>
            {t('guide.features.scribe.desc')}
          </p>
          <ul style={{ paddingLeft: '1.5rem', color: 'var(--text-main)', lineHeight: '1.6' }}>
            {t('guide.features.scribe.steps', { returnObjects: true }).map((step, idx) => (
              <li key={idx} dangerouslySetInnerHTML={{ __html: step }} />
            ))}
          </ul>
        </div>

        {/* 2. Mode Darurat & Kamar Bedah (Telemetri & Shock Index) */}
        <div className="card" style={{ borderLeft: '4px solid #dc2626' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <Activity size={24} color="#dc2626" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{t('guide.features.urgent.title')}</h2>
          </div>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: '1.6' }}>
            {t('guide.features.urgent.desc')}
          </p>
          <ul style={{ paddingLeft: '1.5rem', color: 'var(--text-main)', lineHeight: '1.6' }}>
            {t('guide.features.urgent.steps', { returnObjects: true }).map((step, idx) => (
              <li key={idx} dangerouslySetInnerHTML={{ __html: step }} />
            ))}
          </ul>
        </div>

        {/* 3. Layanan Pasien & Pengingat WhatsApp */}
        <div className="card" style={{ borderLeft: '4px solid #16a34a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <MessageSquare size={24} color="#16a34a" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{t('guide.features.whatsapp.title')}</h2>
          </div>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: '1.6' }}>
            {t('guide.features.whatsapp.desc')}
          </p>
          <ul style={{ paddingLeft: '1.5rem', color: 'var(--text-main)', lineHeight: '1.6' }}>
            {t('guide.features.whatsapp.steps', { returnObjects: true }).map((step, idx) => (
              <li key={idx} dangerouslySetInnerHTML={{ __html: step }} />
            ))}
          </ul>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <FileCheck size={24} color="var(--primary-color)" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Pengecekan Dokumen Klaim BPJS</h2>
          </div>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: '1.6' }}>
            Fitur ini digunakan untuk mengevaluasi apakah dokumen pasien sudah memenuhi syarat klaim BPJS secara otomatis.
          </p>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <BookOpen size={24} color="var(--primary-color)" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Manajemen Basis Pengetahuan BPJS</h2>
          </div>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: '1.6' }}>
            Kelola pedoman dan aturan BPJS yang digunakan oleh AI untuk mengevaluasi klaim.
          </p>
        </div>

      </div>
    </div>
  );
};

export default Guide;
