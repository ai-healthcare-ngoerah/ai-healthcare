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
    <div className="service-sheet animate-fade-in" style={{ maxWidth: '1120px', margin: '0 auto 2.5rem' }}>
      {/* Unified Header & Mode Switcher Band */}
      <div className="service-sheet-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '11px',
              background: '#ecfdf5',
              color: '#047857',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <Stethoscope size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
              {t('scribe.workstation.pageTitle')}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', margin: '0.2rem 0 0 0' }}>
              {t('scribe.workstation.pageSubtitle')}
            </p>
          </div>
        </div>

        <div className="service-segmented-tabs" role="tablist" aria-label="Scribe mode">
          <button
            type="button"
            role="tab"
            aria-selected={activeMode === 'standard'}
            onClick={() => setActiveMode('standard')}
            className={`service-segmented-tab ${activeMode === 'standard' ? 'active' : ''}`}
          >
            <Stethoscope size={16} />
            <span>{t('scribe.workstation.standardMode')}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeMode === 'urgent'}
            onClick={() => setActiveMode('urgent')}
            className={`service-segmented-tab ${activeMode === 'urgent' ? 'active' : ''}`}
            style={activeMode === 'urgent' ? { color: '#dc2626' } : undefined}
          >
            <Flame size={16} />
            <span>{t('scribe.workstation.urgentMode')}</span>
          </button>
        </div>
      </div>

      {/* Render Mode Content Inside Same Unified Sheet */}
      {activeMode === 'urgent' ? (
        <UrgentScribeView />
      ) : (
        <>
          {/* Unsaved Draft Recovery Band */}
          {hasSavedDraft && !soapNote && !transcription && (
            <div
              className="service-sheet-band"
              style={{
                backgroundColor: '#eff6ff',
                borderLeft: '3px solid #2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem'
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
                    borderRadius: '8px',
                    padding: '0.45rem 0.9rem',
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
                    backgroundColor: '#ffffff',
                    color: '#475569',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.45rem 0.8rem',
                    fontSize: '0.825rem',
                    cursor: 'pointer'
                  }}
                >
                  {t('scribe.draft.dismissBtn', 'Abaikan')}
                </button>
              </div>
            </div>
          )}

          {/* Patient Queue Selector Band */}
          {queue.length > 0 && (
            <div
              className="service-sheet-band"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.85rem',
                background: '#fcfcfd'
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
                    color: '#047857',
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
          )}

          {/* Error Alert Band */}
          {error && (
            <div
              className="service-sheet-band"
              style={{
                backgroundColor: '#fef2f2',
                borderLeft: '3px solid #dc2626',
                color: '#991b1b',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}
            >
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          {/* Recording CTA Workspace Band */}
          <div
            className="service-sheet-band"
            style={{
              padding: '3.25rem 2rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: (soapNote || transcription) ? '#f0fdf4' : '#ffffff',
              transition: 'background-color 0.25s ease'
            }}
          >
            <div
              onClick={handleStartRecording}
              style={{
                width: '96px',
                height: '96px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                marginBottom: '1.25rem',
                boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.35)',
                transition: 'transform 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <Mic size={42} color="#ffffff" />
            </div>

            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-main)' }}>
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
                    border: 'none',
                    background: '#f1f5f9',
                    color: '#475569',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  {t('scribe.workstation.clearFormBtn')}
                </button>
              )}
            </div>
          </div>

          {/* Processing Indicator Band */}
          {isProcessing && (
            <div
              className="service-sheet-band animate-fade-in"
              style={{
                padding: '2rem',
                textAlign: 'center',
                backgroundColor: '#f8fafc'
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

          {/* Result Section: Integrated Inside Same Sheet */}
          {(soapNote || transcription) && (
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
