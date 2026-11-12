import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Mic, Stethoscope, AlertCircle, Flame, Users, FileText, RotateCcw } from 'lucide-react';
import { uploadAudioScribe, generateSoapFromText, getTodayQueue } from '../services/scribeService';
import RealtimeAudioModal from '../components/scribe/RealtimeAudioModal';
import SoapFormView from '../components/scribe/SoapFormView';
import UrgentScribeView from '../components/scribe/UrgentScribeView';
import PatientSearchDropdown from '../components/scribe/PatientSearchDropdown';
import { useTranslation } from 'react-i18next';
import useScribeDraft from '../hooks/useScribeDraft';

const MedicalScribe = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const modeParam = searchParams.get('mode');
  const [userSelectedMode, setUserSelectedMode] = useState(null);
  const activeMode = userSelectedMode ?? (modeParam === 'urgent' ? 'urgent' : 'standard');
  const setActiveMode = (mode) => {
    setUserSelectedMode(mode);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('mode', mode);
      return next;
    }, { replace: true });
  };
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  // Patient Identity & Queue State
  const [queue, setQueue] = useState([]);
  const [selectedQueueId, setSelectedQueueId] = useState('');
  const [patientId, setPatientId] = useState('');
  const [patientName, setPatientName] = useState(() => t('scribe.patientInfo.defaultPatientName', 'Pasien Rekam Medis'));
  const [patientPhone, setPatientPhone] = useState('');
  const [medicalRecordNo, setMedicalRecordNo] = useState('');

  // Result state
  const [transcription, setTranscription] = useState('');
  const [soapNote, setSoapNote] = useState('');

  // Draft persistence hook
  const { hasSavedDraft, getDraft, clearDraft } = useScribeDraft({
    soapNote,
    transcription,
    patientInfo: {
      patientId,
      patientName,
      patientPhone,
      medicalRecordNo,
      selectedQueueId
    },
    enabled: Boolean(soapNote || transcription)
  });

  const handleRestoreDraft = () => {
    const draft = getDraft();
    if (draft) {
      if (draft.soapNote) setSoapNote(draft.soapNote);
      if (draft.transcription) setTranscription(draft.transcription);
      if (draft.patientInfo) {
        if (draft.patientInfo.patientId) setPatientId(draft.patientInfo.patientId);
        if (draft.patientInfo.patientName) setPatientName(draft.patientInfo.patientName);
        if (draft.patientInfo.patientPhone) setPatientPhone(draft.patientInfo.patientPhone);
        if (draft.patientInfo.medicalRecordNo) setMedicalRecordNo(draft.patientInfo.medicalRecordNo);
        if (draft.patientInfo.selectedQueueId) setSelectedQueueId(draft.patientInfo.selectedQueueId);
      }
    }
  };

  useEffect(() => {
    const fetchQueue = async () => {
      try {
        const data = await getTodayQueue();
        if (Array.isArray(data)) {
          setQueue(data);
        }
      } catch (err) {
        console.error('Failed to load queue in MedicalScribe:', err);
      }
    };
    fetchQueue();
  }, []);

  const handleSelectQueue = (eOrId) => {
    const qId = typeof eOrId === 'object' && eOrId?.target ? eOrId.target.value : (eOrId || '');
    setSelectedQueueId(qId);
    if (!qId) {
      setPatientId('');
      setPatientName(t('scribe.patientInfo.defaultPatientName', 'Pasien Rekam Medis'));
      setPatientPhone('');
      setMedicalRecordNo('');
      return;
    }
    const selected = queue.find((q) => String(q.id) === String(qId) || String(q.appointment_id) === String(qId));
    if (selected) {
      const pName = selected.name || selected.patient_name || '';
      setPatientId(selected.patient_id || '');
      setPatientName(pName);
      setPatientPhone(selected.phone || '');
      setMedicalRecordNo(selected.medical_record_no || '');
    }
  };

  const handleStartRecording = () => {
    setError(null);
    setIsModalOpen(true);
  };

  const handleFinishRecording = async (audioBlob, liveText) => {
    setIsProcessing(true);
    setError(null);

    try {
      if (audioBlob && audioBlob.size > 500) {
        try {
          // 1. Send recorded audio to backend Whisper Large v3 Turbo (Auto-Detect Language) & Groq LLM
          const response = await uploadAudioScribe(audioBlob, 'recording.webm');
          setTranscription(response.transcription || liveText || '');
          setSoapNote(response.soap_note || '');
          setIsModalOpen(false);
          setIsProcessing(false);
          return;
        } catch (uploadErr) {
          console.warn('Audio upload/Whisper failed, attempting Smart Fallback with liveText:', uploadErr);
        }
      }

      // 2. Smart Fallback: if audio upload failed or blob is too small, use liveText from Web Speech API
      if (liveText && liveText.trim().length > 0) {
        const fallbackResponse = await generateSoapFromText(liveText);
        setTranscription(liveText);
        setSoapNote(fallbackResponse.soap_note || '');
        setIsModalOpen(false);
      } else {
        throw new Error(t('scribe.modal.idleText', 'Rekaman audio kosong atau tidak dapat dikenali. Silakan coba lagi dan pastikan berbicara di dekat mikrofon.'));
      }
    } catch (err) {
      console.error('Audio scribe error:', err);
      setError(err.message || 'Terjadi kesalahan saat memproses audio dengan AI.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setTranscription('');
    setSoapNote('');
    setError(null);
    clearDraft();
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header Page */}
      <div style={{ marginBottom: '1.75rem', textAlign: 'center' }}>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', fontSize: '2rem' }}>
          <Stethoscope size={28} color="var(--primary-color)" />
          <span>{t('scribe.workstation.pageTitle')}</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0.25rem 0 0 0' }}>
          {t('scribe.workstation.pageSubtitle')}
        </p>
      </div>

      {/* Mode Switcher Tabs */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'inline-flex', background: '#f1f5f9', padding: '0.35rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <button
            type="button"
            onClick={() => setActiveMode('standard')}
            style={{
              padding: '0.6rem 1.5rem',
              borderRadius: '9px',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: activeMode === 'standard' ? '#ffffff' : 'transparent',
              color: activeMode === 'standard' ? 'var(--primary-color)' : 'var(--text-muted)',
              boxShadow: activeMode === 'standard' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <Stethoscope size={18} />
            <span>{t('scribe.workstation.standardMode')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('urgent')}
            style={{
              padding: '0.6rem 1.5rem',
              borderRadius: '9px',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: activeMode === 'urgent' ? '#ffffff' : 'transparent',
              color: activeMode === 'urgent' ? '#dc2626' : 'var(--text-muted)',
              boxShadow: activeMode === 'urgent' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <Flame size={18} />
            <span>{t('scribe.workstation.urgentMode')}</span>
          </button>
        </div>
      </div>

      {/* Render Mode Content */}
      {activeMode === 'urgent' ? (
        <UrgentScribeView />
      ) : (
        <>
          {/* Unsaved Draft Recovery Banner */}
          {hasSavedDraft && !soapNote && !transcription && (
            <div
              style={{
                width: '100%',
                marginBottom: '1.5rem',
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '12px',
                padding: '0.85rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem',
                boxSizing: 'border-box'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', color: '#1e40af', fontSize: '0.875rem' }}>
                <FileText size={18} color="#2563eb" />
                <span>
                  <strong>{t('scribe.draft.detectedTitle', 'Draf Catatan Ditemukan:')}</strong>{' '}
                  {t('scribe.draft.detectedMsg', 'Terdapat draf SOAP tersimpan dari sesi sebelumnya.')}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={handleRestoreDraft}
                  style={{
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.4rem 0.85rem',
                    fontSize: '0.825rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                >
                  <RotateCcw size={14} />
                  <span>{t('scribe.draft.restoreBtn', 'Pulihkan Draf')}</span>
                </button>
                <button
                  type="button"
                  onClick={clearDraft}
                  style={{
                    backgroundColor: 'transparent',
                    color: '#64748b',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '0.4rem 0.75rem',
                    fontSize: '0.825rem',
                    cursor: 'pointer'
                  }}
                >
                  {t('scribe.draft.dismissBtn', 'Abaikan')}
                </button>
              </div>
            </div>
          )}

          {/* Patient Queue Selector (Wide & Web-Responsive) */}
          {queue.length > 0 && (
            <div style={{ width: '100%', marginBottom: '1.5rem', boxSizing: 'border-box' }}>
              <div
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.85rem',
                  background: '#ffffff',
                  padding: '0.75rem 1.25rem',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  boxSizing: 'border-box'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '130px' }}>
                  <Users size={18} color="var(--primary-color)" />
                  <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                    {t('scribe.patientInfo.queueLabelShort', 'Pasien Antrean:')}
                  </span>
                </div>

                <PatientSearchDropdown
                  queue={queue}
                  selectedQueueId={selectedQueueId}
                  onSelectQueue={handleSelectQueue}
                  placeholder={t('scribe.patientInfo.queuePlaceholder', 'Pilih Antrean Hari Ini')}
                />

                {patientId && (
                  <span
                    style={{
                      fontSize: '0.75rem',
                      background: '#ecfdf5',
                      color: 'var(--primary-color)',
                      padding: '0.3rem 0.75rem',
                      borderRadius: 'var(--radius-full)',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--primary-color)' }} />
                    {t('scribe.patientInfo.activeStatus', 'Aktif:')} {patientName}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div
              style={{
                backgroundColor: '#fef2f2',
                color: '#991b1b',
                padding: '1rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '1.5rem',
                border: '1px solid #fecaca'
              }}
            >
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          {/* Recording CTA Card (Hero at the top) */}
          <div
            className="card"
            style={{
              padding: '3.5rem 2rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              border: (soapNote || transcription) ? '2px solid #bbf7d0' : '2px dashed var(--border-color)',
              backgroundColor: (soapNote || transcription) ? '#f0fdf4' : '#fcfcfd',
              borderRadius: 'var(--radius-lg)',
              transition: 'all 0.3s ease',
              marginBottom: '1.5rem'
            }}
          >
            <div
              onClick={handleStartRecording}
              style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                marginBottom: '1.25rem',
                boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.4)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <Mic size={44} color="#ffffff" />
            </div>

            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-main)' }}>
              {(soapNote || transcription) ? t('scribe.workstation.rerecordTitle') : t('scribe.landing.title')}
            </h2>
            <p style={{ color: 'var(--text-muted)', maxWidth: '480px', margin: '0 0 1.5rem', lineHeight: '1.6' }}>
              {(soapNote || transcription)
                ? t('scribe.workstation.rerecordSubtitle')
                : t('scribe.landing.description')}
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={handleStartRecording}
                className="btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  padding: '0.75rem 2rem',
                  fontSize: '1rem'
                }}
              >
                <Mic size={20} />
                <span>{(soapNote || transcription) ? t('scribe.workstation.rerecordBtn') : t('scribe.landing.button')}</span>
              </button>

              {(soapNote || transcription) && (
                <button
                  type="button"
                  onClick={handleReset}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1.5rem',
                    fontSize: '0.95rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    background: '#ffffff',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  {t('scribe.workstation.clearFormBtn')}
                </button>
              )}
            </div>
          </div>

          {/* Processing Indicator below CTA */}
          {isProcessing && (
            <div
              className="card animate-fade-in"
              style={{
                marginTop: '1.5rem',
                padding: '2rem',
                textAlign: 'center',
                backgroundColor: '#f8fafc',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)'
              }}
            >
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', color: 'var(--primary-color)', fontWeight: 600 }}>
                <span className="animate-spin" style={{ display: 'inline-block', width: '20px', height: '20px', border: '2px solid var(--primary-color)', borderTopColor: 'transparent', borderRadius: '50%' }} />
                <span>{t('scribe.workstation.processingAudio')}</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.5rem 0 0 0' }}>
                {t('scribe.workstation.processingAudioSubtitle')}
              </p>
            </div>
          )}

          {/* Result Section: SOAP Form View rendered below recording card */}
          {(soapNote || transcription) && (
            <div className="animate-fade-in" style={{ marginTop: '2rem' }}>
              <SoapFormView
                soapNote={soapNote}
                transcription={transcription}
                onReset={handleReset}
                onClearDraft={clearDraft}
                initialPatient={{
                  patientId,
                  patientName,
                  patientPhone,
                  medicalRecordNo,
                  selectedQueueId
                }}
                onPatientChange={({ patientId: newPid, patientName: newPName, patientPhone: newPPhone, medicalRecordNo: newRM }) => {
                  if (newPid !== undefined) setPatientId(newPid);
                  if (newPName !== undefined) setPatientName(newPName);
                  if (newPPhone !== undefined) setPatientPhone(newPPhone);
                  if (newRM !== undefined) setMedicalRecordNo(newRM);
                }}
              />
            </div>
          )}

          {/* Realtime Pop-up Modal */}
          <RealtimeAudioModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onFinishRecording={handleFinishRecording}
            isProcessing={isProcessing}
          />
        </>
      )}
    </div>
  );
};

export default MedicalScribe;
