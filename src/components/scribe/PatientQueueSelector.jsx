import React from 'react';
import { UserCheck, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const PatientQueueSelector = ({
  queue = [],
  selectedQueueId = '',
  onSelectQueue,
  patientName = '',
  setPatientName,
  patientPhone = '',
  setPatientPhone,
  medicalRecordNo = '',
  setMedicalRecordNo
}) => {
  const { t } = useTranslation();

  return (
    <div
      className="card animate-fade-in"
      style={{
        padding: '1.25rem',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid #cbd5e1',
        backgroundColor: '#ffffff',
        boxShadow: 'var(--shadow-sm)',
        marginBottom: '1.5rem',
        transition: 'all 0.2s ease'
      }}
    >
      {/* Header bar: Compact title + Queue badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          marginBottom: '1rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div
            style={{
              padding: '0.45rem',
              backgroundColor: '#ecfdf5',
              borderRadius: 'var(--radius-md)',
              color: 'var(--primary-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <UserCheck size={18} />
          </div>
          <h3
            style={{
              fontSize: '1.05rem',
              fontWeight: 700,
              color: 'var(--text-main)',
              margin: 0
            }}
          >
            {t('scribe.patientInfo.title', 'Identitas Pasien & Antrean')}
          </h3>
        </div>

        {queue.length > 0 && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.25rem 0.75rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 600,
              backgroundColor: '#f1f5f9',
              color: '#334155',
              border: '1px solid #cbd5e1'
            }}
          >
            <Users size={13} color="var(--primary-color)" />
            {t('scribe.patientInfo.badgeQueue', {
              count: queue.length,
              defaultValue: `${queue.length} Pasien Menunggu Hari Ini`
            })}
          </span>
        )}
      </div>

      {/* Queue Dropdown Selection */}
      <div style={{ marginBottom: '0.85rem' }}>
        <label
          htmlFor="patient-queue-select"
          style={{
            display: 'block',
            fontSize: '0.8rem',
            fontWeight: 600,
            color: '#334155',
            marginBottom: '0.3rem'
          }}
        >
          {t('scribe.patientInfo.queueLabel', 'Pilih dari Antrean Hari Ini')}
        </label>
        <select
          id="patient-queue-select"
          value={selectedQueueId}
          onChange={onSelectQueue}
          style={{
            width: '100%',
            padding: '0.55rem 0.85rem',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            fontSize: '0.875rem',
            color: '#0f172a',
            backgroundColor: '#f8fafc',
            fontWeight: 500,
            outline: 'none',
            transition: 'border 0.2s ease, background-color 0.2s ease'
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--primary-color)';
            e.currentTarget.style.backgroundColor = '#ffffff';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = '#cbd5e1';
            e.currentTarget.style.backgroundColor = '#f8fafc';
          }}
        >
          <option value="">
            {t('scribe.patientInfo.queueManualOption', '-- Input Pasien Baru (Manual) --')}
          </option>
          {queue.map((q) => (
            <option key={q.id || q.appointment_id} value={q.id || q.appointment_id}>
              No. Antrean {q.queue_number || '-'} — {q.patient_name || 'Pasien'}{' '}
              {q.medical_record_no ? `(RM: ${q.medical_record_no})` : ''}{' '}
              {q.complaint ? `— ${q.complaint}` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Patient Input Fields */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '0.75rem'
        }}
      >
        {/* Patient Name */}
        <div>
          <label
            htmlFor="patient-name-input"
            style={{
              display: 'block',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: '#334155',
              marginBottom: '0.3rem'
            }}
          >
            {t('scribe.patientInfo.patientNameLabel', 'Nama Lengkap Pasien')}
          </label>
          <input
            id="patient-name-input"
            type="text"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            placeholder={t('scribe.patientInfo.patientNamePlaceholder', 'Contoh: Budi Santoso')}
            style={{
              width: '100%',
              padding: '0.55rem 0.85rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.875rem',
              color: '#0f172a',
              backgroundColor: '#ffffff',
              outline: 'none',
              transition: 'border 0.2s ease, box-shadow 0.2s ease'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--primary-color)';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(5, 150, 105, 0.1)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#cbd5e1';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </div>

        {/* WhatsApp / Phone */}
        <div>
          <label
            htmlFor="patient-phone-input"
            style={{
              display: 'block',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: '#334155',
              marginBottom: '0.3rem'
            }}
          >
            {t('scribe.patientInfo.phoneLabel', 'No. WhatsApp / HP Pasien')}
          </label>
          <input
            id="patient-phone-input"
            type="text"
            value={patientPhone}
            onChange={(e) => setPatientPhone(e.target.value)}
            placeholder={t('scribe.patientInfo.phonePlaceholder', '08123456789')}
            style={{
              width: '100%',
              padding: '0.55rem 0.85rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.875rem',
              color: '#0f172a',
              backgroundColor: '#ffffff',
              outline: 'none',
              transition: 'border 0.2s ease, box-shadow 0.2s ease'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--primary-color)';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(5, 150, 105, 0.1)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#cbd5e1';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </div>

        {/* Medical Record No (Optional) */}
        <div>
          <label
            htmlFor="patient-rm-input"
            style={{
              display: 'block',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: '#334155',
              marginBottom: '0.3rem'
            }}
          >
            {t('scribe.patientInfo.medicalRecordLabel', 'No. Rekam Medis (Opsional)')}
          </label>
          <input
            id="patient-rm-input"
            type="text"
            value={medicalRecordNo}
            onChange={(e) => setMedicalRecordNo(e.target.value)}
            placeholder={t('scribe.patientInfo.medicalRecordPlaceholder', 'RM-2024-001')}
            style={{
              width: '100%',
              padding: '0.55rem 0.85rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.875rem',
              color: '#0f172a',
              backgroundColor: '#ffffff',
              outline: 'none',
              transition: 'border 0.2s ease, box-shadow 0.2s ease'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--primary-color)';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(5, 150, 105, 0.1)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#cbd5e1';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default PatientQueueSelector;
