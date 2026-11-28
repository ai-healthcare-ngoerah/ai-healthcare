import { useState, useEffect, useCallback, useRef } from 'react';
import { Copy, Check, Sparkles, FileText, RotateCcw, Save, X, Download, CheckCircle, UserCheck, Activity } from 'lucide-react';
import { saveAs } from 'file-saver';
import { buildSoapDocxBlob } from '../../utils/scribeDocxTemplate';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { saveScribeNote, analyzeClinicalScribe, finalizeConsultation, getTodayQueue } from '../../services/scribeService';
import { useNotification } from '../../context/NotificationContext';
import PatientSearchDropdown from './PatientSearchDropdown';
import useScribeDraft from '../../hooks/useScribeDraft';

const SoapFormView = ({
  soapNote: initialSoap,
  soapMapping = null,
  transcription: initialTranscription,
  autoAnalyzeTrigger = 0,
  onReset,
  onClearDraft = null,
  initialPatient = null,
  onPatientChange = null
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showToast, confirmAction } = useNotification();
  const [transcription, setTranscription] = useState(initialTranscription || '');
  const [copied, setCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [queue, setQueue] = useState([]);
  const [selectedQueueId, setSelectedQueueId] = useState(initialPatient?.selectedQueueId || '');
  const [patientId, setPatientId] = useState(initialPatient?.patientId || '');
  const [patientName, setPatientName] = useState(initialPatient?.patientName || '');
  const [patientPhone, setPatientPhone] = useState(initialPatient?.patientPhone || '');
  const [medicalRecordNo, setMedicalRecordNo] = useState(initialPatient?.medicalRecordNo || '');

  // Synchronize state when initialPatient changes (without cascading render effects)
  const [prevPatient, setPrevPatient] = useState(initialPatient);
  if (initialPatient !== prevPatient) {
    setPrevPatient(initialPatient);
    if (initialPatient?.patientName !== undefined) {
      setPatientName(initialPatient.patientName);
    }
    if (initialPatient?.patientPhone !== undefined) setPatientPhone(initialPatient.patientPhone);
    if (initialPatient?.medicalRecordNo !== undefined) setMedicalRecordNo(initialPatient.medicalRecordNo);
    if (initialPatient?.patientId !== undefined) setPatientId(initialPatient.patientId);
    if (initialPatient?.selectedQueueId !== undefined) setSelectedQueueId(initialPatient.selectedQueueId);
  }

  // Clinical Analysis (ICD + RAG Control) State
  const [clinicalResult, setClinicalResult] = useState(null);
  const [isAnalyzingClinical, setIsAnalyzingClinical] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);

  // Fetch today's patient queue
  useEffect(() => {
    const fetchQueue = async () => {
      try {
        const data = await getTodayQueue();
        if (Array.isArray(data)) {
          setQueue(data);
        }
      } catch (err) {
        console.error('Failed to load queue:', err);
      }
    };
    fetchQueue();
  }, []);

  const handleSelectQueue = (eOrId) => {
    const qId = typeof eOrId === 'object' && eOrId?.target ? eOrId.target.value : (eOrId || '');
    setSelectedQueueId(qId);
    if (!qId) {
      if (onPatientChange) {
        onPatientChange({ patientId: '', patientName: 'Pasien Rekam Medis', patientPhone: '', medicalRecordNo: '' });
      }
      return;
    }
    const selected = queue.find((q) => String(q.id) === String(qId) || String(q.appointment_id) === String(qId));
    if (selected) {
      const newPid = selected.patient_id || '';
      const newPName = selected.name || selected.patient_name || '';
      const newPhone = selected.phone || '';
      const newRM = selected.medical_record_no || '';
      setPatientId(newPid);
      setPatientName(newPName);
      setPatientPhone(newPhone);
      setMedicalRecordNo(newRM);
      if (onPatientChange) {
        onPatientChange({ patientId: newPid, patientName: newPName, patientPhone: newPhone, medicalRecordNo: newRM });
      }
    }
  };

  // Helper to parse the raw string into 4 fields
  const parseSoap = (text) => {
    let s = '', o = '', a = '', p = '';
    if (!text) return { s, o, a, p };
    
    // Matches standard S:, O:, A:, P:, as well as Subjektif, ### 1. Subjective, **S:**, etc.
    const sectionPattern = /(?:^|\n)\s*(?:[#*_~-]+\s*)*(?:\d+[.)]\s*)?(?:(S)(?:ubjective|ubjektif)?|(O)(?:bjective|bjektif)?|(A)(?:ssessment|sesmen)?|(P)(?:lan|lanning|erencanaan|rencana)?)(?:\s*\([^)]*\))?\s*(?:[#*_~-]*\s*)*(?:[:-]\s*|\n|$)/gi;

    const matches = [];
    let match;
    while ((match = sectionPattern.exec(text)) !== null) {
      const letter = (match[1] || match[2] || match[3] || match[4] || '').toUpperCase();
      if (letter) {
        matches.push({
          letter,
          index: match.index,
          length: match[0].length
        });
      }
    }

    if (matches.length >= 1) {
      for (let i = 0; i < matches.length; i++) {
        const cur = matches[i];
        const next = matches[i + 1];
        const start = cur.index + cur.length;
        const end = next ? next.index : text.length;
        const content = text.substring(start, end).trim();

        if (cur.letter === 'S' && !s) s = content;
        else if (cur.letter === 'O' && !o) o = content;
        else if (cur.letter === 'A' && !a) a = content;
        else if (cur.letter === 'P' && !p) p = content;
      }
    } else {
      // Fallback to classic split with support for numbered and markdown headers
      const parts = text.split(/(?:^|\n)\s*(?:[#*_~-]+\s*)*(?:\d+[.)]\s*)?([SOAP])(?:[a-z]*|\s*\([^)]*\))?\s*(?:[#*_~-]*\s*)*[:\n]/i);
      for (let i = 1; i < parts.length; i += 2) {
        const label = parts[i].toUpperCase();
        const content = (parts[i + 1] || '').trim();
        if (label === 'S' && !s) s = content;
        else if (label === 'O' && !o) o = content;
        else if (label === 'A' && !a) a = content;
        else if (label === 'P' && !p) p = content;
      }
    }

    if (!s && !o && !a && !p) {
      s = text.trim();
    }

    return { s, o, a, p };
  };

  const resolveFields = (soapStr, mappingObj) => {
    if (mappingObj && typeof mappingObj === 'object') {
      return {
        s: mappingObj.subjective || '',
        o: mappingObj.objective || '',
        a: mappingObj.assessment || '',
        p: mappingObj.plan || '',
      };
    }
    return parseSoap(soapStr || '');
  };

  const [initialParsed] = useState(() => resolveFields(initialSoap || '', soapMapping));
  const [sText, setSText] = useState(() => initialParsed.s);
  const [oText, setOText] = useState(() => initialParsed.o);
  const [aText, setAText] = useState(() => initialParsed.a);
  const [pText, setPText] = useState(() => initialParsed.p);

  // Sync state if initialSoap or soapMapping changes from parent without cascading render effects
  const [prevSoapProp, setPrevSoapProp] = useState(initialSoap);
  const [prevMappingProp, setPrevMappingProp] = useState(soapMapping);
  if (initialSoap !== prevSoapProp || soapMapping !== prevMappingProp) {
    setPrevSoapProp(initialSoap);
    setPrevMappingProp(soapMapping);
    const parsed = resolveFields(initialSoap || '', soapMapping);
    setSText(parsed.s);
    setOText(parsed.o);
    setAText(parsed.a);
    setPText(parsed.p);
  }

  // Derived active soapNote for Saving/Exporting (only populated sections)
  const soapNote = [
    sText ? `S (Subjective):\n${sText}` : '',
    oText ? `O (Objective):\n${oText}` : '',
    aText ? `A (Assessment):\n${aText}` : '',
    pText ? `P (Plan):\n${pText}` : '',
  ]
    .filter(Boolean)
    .join('\n\n');


  // Auto-sync draft as user modifies individual fields
  useScribeDraft({
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

  const handleCopy = () => {
    navigator.clipboard.writeText(soapNote);
    setCopied(true);
    showToast({ type: 'info', message: 'Teks berhasil disalin ke clipboard.' });
    setTimeout(() => setCopied(false), 2000);
  };

  const executeFinalize = useCallback(async () => {
    setIsFinalizing(true);
    try {
      const payload = {
        patient_id: patientId || null,
        patient_name: patientName.trim() || 'Pasien Umum',
        phone: patientPhone || null,
        medical_record_no: medicalRecordNo || null,
        soap: {
          subjective: sText,
          objective: oText,
          assessment: aText,
          plan: pText
        },
        clinical: clinicalResult || {
          icd_10: aText || 'Umum',
          icd_9: null,
          must_control: false,
          control_interval_days: 7,
          control_date: null,
          control_reason: 'Evaluasi berkala'
        },
        raw_text: soapNote,
        transcription: transcription,
        doctor_name: 'dr. Umum',
        poli_name: 'Poli Umum'
      };

      const res = await finalizeConsultation(payload);
      if (onClearDraft) {
        onClearDraft();
      }
      setSaveSuccess(true);
      showToast({
        type: 'success',
        title: t('scribe.form.saveSuccessTitle', 'Berhasil Disimpan'),
        message: res.message || t('scribe.form.saveSuccessMsg', 'Catatan SOAP berhasil disimpan.')
      });
      setTimeout(() => {
        setSaveSuccess(false);
        navigate('/app/asisten-medis/riwayat');
      }, 1200);
    } catch (err) {
      console.error('Save consultation error:', err);
      showToast({
        type: 'error',
        title: t('scribe.form.saveErrorTitle', 'Gagal Menyimpan'),
        message: err.message || t('scribe.form.saveErrorMsg', 'Gagal menyimpan catatan medis.')
      });
    } finally {
      setIsFinalizing(false);
    }
  }, [
    patientId,
    patientName,
    patientPhone,
    medicalRecordNo,
    sText,
    oText,
    aText,
    pText,
    clinicalResult,
    soapNote,
    transcription,
    onClearDraft,
    t,
    showToast,
    navigate
  ]);

  // Clinical Hotkey: Ctrl+Enter (Quick Save)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (!isSaving && !isFinalizing) {
          executeFinalize();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [executeFinalize, isSaving, isFinalizing]);

  const handleAnalyzeClinical = useCallback(async () => {
    if (!sText.trim() && !oText.trim() && !aText.trim() && !pText.trim()) {
      showToast({
        type: 'warning',
        title: 'Form Kosong',
        message: 'Silakan isi minimal salah satu bagian SOAP sebelum evaluasi klinis.'
      });
      return;
    }

    setIsAnalyzingClinical(true);
    try {
      const res = await analyzeClinicalScribe(
        {
          subjective: sText,
          objective: oText,
          assessment: aText,
          plan: pText
        },
        patientId || null
      );
      const clinicalData = res?.clinical || res;
      setClinicalResult(clinicalData);
      showToast({
        type: 'success',
        title: t('scribe.form.evalSuccessTitle', 'Evaluasi Klinis Selesai'),
        message: `ICD-10: ${clinicalData?.icd_10 || '-'} | ICD-9: ${clinicalData?.icd_9 || '-'} | Kontrol: ${clinicalData?.must_control ? 'Wajib' : 'Opsional'}`
      });
    } catch (err) {
      console.error('Clinical analysis error:', err);
      showToast({
        type: 'error',
        title: t('scribe.form.evalErrorTitle', 'Gagal Analisis'),
        message: err.message || t('scribe.form.evalErrorMsg', 'Gagal menganalisis kode dan jadwal kontrol.')
      });
    } finally {
      setIsAnalyzingClinical(false);
    }
  }, [sText, oText, aText, pText, patientId, showToast, t]);

  // Automatically trigger ICD-10/9 & follow-up evaluation right after SOAP creation from recording
  const lastAutoTriggerRef = useRef(0);
  useEffect(() => {
    if (autoAnalyzeTrigger > 0 && autoAnalyzeTrigger !== lastAutoTriggerRef.current) {
      lastAutoTriggerRef.current = autoAnalyzeTrigger;
      handleAnalyzeClinical();
    }
  }, [autoAnalyzeTrigger, handleAnalyzeClinical]);

  const handleCancel = () => {
    confirmAction({
      title: t('scribe.form.cancelEditConfirmTitle', 'Batalkan Pengeditan'),
      message: t('scribe.form.cancelEditConfirmMsg', 'Apakah Anda yakin ingin membatalkan pengeditan? Teks akan dikembalikan ke kondisi awal.'),
      type: 'warning',
      confirmText: t('scribe.form.cancelEditConfirmBtn', 'Ya, Batalkan'),
      cancelText: t('common.cancelBtn', 'Batal'),
      onConfirm: () => {
        const p = resolveFields(initialSoap || '', soapMapping);
        setSText(p.s);
        setOText(p.o);
        setAText(p.a);
        setPText(p.p);
        setTranscription(initialTranscription || '');
        showToast({ type: 'info', message: t('scribe.form.cancelEditToast', 'Pengeditan dikembalikan ke awal.') });
      },
    });
  };

  const handleExport = async () => {
    try {
      const blob = await buildSoapDocxBlob({
        patientName: patientName.trim() || 'Pasien Umum',
        medicalRecordNo: medicalRecordNo || '-',
        doctorName: 'dr. Umum',
        poliName: 'Poli Umum',
        soap: {
          subjective: sText,
          objective: oText,
          assessment: aText,
          plan: pText,
        },
        soapNote,
        clinical: clinicalResult,
        transcription,
      });
      const nameSlug = patientName
        .trim()
        .replace(/[^a-zA-Z0-9_-]+/g, '_')
        .replace(/^_+|_+$/g, '');
      const fileSuffix = nameSlug ? `${nameSlug}_` : '';
      saveAs(blob, `Rekam_Medis_SOAP_${fileSuffix}${new Date().toISOString().slice(0, 10)}.docx`);
    } catch (err) {
      console.error('Export docx error:', err);
      alert('Gagal mengekspor ke file Word.');
    }
  };

  return (
    <div className="service-sheet-band animate-fade-in">
      {/* Save Success Alert */}
      {saveSuccess && (
        <div
          style={{
            backgroundColor: '#ecfdf5',
            color: '#065f46',
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            marginBottom: '1.5rem',
            border: 'none',
            borderLeft: '3px solid #059669',
            fontWeight: 500,
          }}
        >
          <CheckCircle size={20} />
          <span>{t('scribe.form.successSave')}</span>
        </div>
      )}

      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              padding: '0.6rem',
              backgroundColor: '#ecfdf5',
              borderRadius: 'var(--radius-md)',
              color: 'var(--primary-color)',
            }}
          >
            <Sparkles size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
              {t('scribe.form.title')}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
              {t('scribe.form.subtitle')}
            </p>
          </div>
        </div>

        {/* Top Action Buttons: Copy & New Session */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            type="button"
            onClick={handleCopy}
            className="btn-secondary"
            style={{
              margin: 0,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1.15rem',
            }}
          >
            {copied ? <Check size={18} /> : <Copy size={18} />}
            <span>{copied ? t('scribe.form.copyBtnCopied') : t('scribe.form.copyBtn')}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              confirmAction({
                title: t('scribe.form.newSessionConfirmTitle'),
                message: t('scribe.form.newSessionConfirmMsg'),
                type: 'warning',
                confirmText: t('scribe.form.newSessionConfirmBtn'),
                cancelText: t('common.cancelBtn', 'Batal'),
                onConfirm: () => {
                  onReset();
                  showToast({ type: 'info', message: t('scribe.form.newSessionStarted') });
                },
              });
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.65rem',
              padding: '0.65rem 2.25rem',
              minWidth: '170px',
              border: '1px solid #cbd5e1',
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#f1f5f9',
              cursor: 'pointer',
              color: '#334155',
              fontWeight: 600,
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            }}
            title={t('scribe.form.newSessionBtn')}
          >
            <RotateCcw size={16} />
            <span>{t('scribe.form.newSessionBtn')}</span>
          </button>
        </div>
      </div>

      {/* Draft / Record Name Form */}
      <div
        style={{
          backgroundColor: '#f8fafc',
          padding: '0.9rem 1.1rem',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.35rem',
        }}
      >
        <label
          htmlFor="scribe-draft-name"
          style={{
            fontSize: '0.8rem',
            fontWeight: 700,
            color: '#1e293b',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <FileText size={15} aria-hidden="true" color="var(--primary-color)" />
          <span>{t('scribe.form.draftNameLabel', 'Nama Draf / Catatan')}</span>
        </label>
        <input
          id="scribe-draft-name"
          type="text"
          value={patientName}
          onChange={(e) => {
            const val = e.target.value;
            setPatientName(val);
            if (onPatientChange) {
              onPatientChange({ patientId, patientName: val, patientPhone, medicalRecordNo });
            }
          }}
          placeholder={t('scribe.form.draftNamePlaceholder', 'Contoh: Draf Konsultasi Budi Santoso')}
          style={{
            width: '100%',
            minHeight: '42px',
            padding: '0.5rem 0.75rem',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            fontSize: '0.925rem',
            backgroundColor: '#ffffff',
            color: '#0f172a',
          }}
        />
        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
          {t('scribe.form.draftNameHint', 'Nama ini disimpan bersama draf dan digunakan sebagai nama catatan di Riwayat.')}
        </span>
      </div>

      {/* Patient Information & Queue Selector (Commented Out)
      <div
        style={{
          backgroundColor: '#f8fafc',
          padding: '1.25rem',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1.5rem',
          border: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1e293b', fontWeight: 600 }}>
            <UserCheck size={18} color="var(--primary-color)" />
            <span>{t('scribe.patientInfo.title', 'Identitas Pasien & Antrean Konsultasi')}</span>
          </div>
          {queue.length > 0 && (
            <span style={{ fontSize: '0.8rem', backgroundColor: '#e2e8f0', color: '#475569', padding: '0.25rem 0.65rem', borderRadius: '12px', fontWeight: 600 }}>
              {t('scribe.patientInfo.badgeQueue', { count: queue.length, defaultValue: `${queue.length} Pasien Menunggu Hari Ini` })}
            </span>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
              {t('scribe.patientInfo.queueLabel', 'Pilih dari Antrean')}
            </label>
            <PatientSearchDropdown
              queue={queue}
              selectedQueueId={selectedQueueId}
              onSelectQueue={handleSelectQueue}
              placeholder={t('scribe.patientInfo.queueManualOption', '-- Input Pasien Manual --')}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
              {t('scribe.patientInfo.patientNameLabel', 'Nama Pasien')}
            </label>
            <input
              type="text"
              value={patientName}
              onChange={(e) => {
                const val = e.target.value;
                setPatientName(val);
                if (onPatientChange) onPatientChange({ patientId, patientName: val, patientPhone, medicalRecordNo });
              }}
              placeholder={t('scribe.patientInfo.patientNamePlaceholder', 'Nama Lengkap Pasien')}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '0.875rem',
                backgroundColor: '#ffffff',
                color: '#0f172a',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
              {t('scribe.patientInfo.phoneLabel', 'No. WhatsApp / HP Pasien')}
            </label>
            <input
              type="text"
              value={patientPhone}
              onChange={(e) => {
                const val = e.target.value;
                setPatientPhone(val);
                if (onPatientChange) onPatientChange({ patientId, patientName, patientPhone: val, medicalRecordNo });
              }}
              placeholder={t('scribe.patientInfo.phonePlaceholder', '08123456789 (Pengingat WA)')}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '0.875rem',
                backgroundColor: '#ffffff',
                color: '#0f172a',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
              {t('scribe.patientInfo.medicalRecordLabel', 'No. Rekam Medis (Opsional)')}
            </label>
            <input
              type="text"
              value={medicalRecordNo}
              onChange={(e) => {
                const val = e.target.value;
                setMedicalRecordNo(val);
                if (onPatientChange) onPatientChange({ patientId, patientName, patientPhone, medicalRecordNo: val });
              }}
              placeholder={t('scribe.patientInfo.medicalRecordPlaceholder', 'RM-00123')}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '0.875rem',
                backgroundColor: '#ffffff',
                color: '#0f172a',
              }}
            />
          </div>
        </div>
      </div>
      */}

      {/* SOAP Content Section Heading */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '0.75rem',
          marginBottom: '1.25rem',
          gap: '0.5rem',
          fontWeight: 600,
          fontSize: '1rem',
          color: 'var(--primary-color)',
        }}
      >
        <Sparkles size={18} />
        <span>{t('scribe.form.tabSoap')}</span>
      </div>

      {/* Editable Content Area */}
      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', backgroundColor: '#f8fafc', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: 'none' }}>
            <div>
              <label style={{ fontWeight: '700', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', color: '#0f172a', fontSize: '0.9rem' }}>
                <div style={{ width: '28px', height: '28px', backgroundColor: '#e2e8f0', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', marginRight: '0.5rem', color: '#0f172a', fontWeight: 800 }}>S</div>
                Subjective (Subjektif)
              </label>
              <textarea
                value={sText}
                onChange={(e) => setSText(e.target.value)}
                placeholder="Keluhan pasien..."
                style={{ width: '100%', minHeight: '90px', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', resize: 'vertical', fontFamily: 'inherit', fontSize: '0.95rem', backgroundColor: '#ffffff', color: '#0f172a' }}
              />
            </div>
            
            <div>
              <label style={{ fontWeight: '700', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', color: '#0f172a', fontSize: '0.9rem' }}>
                <div style={{ width: '28px', height: '28px', backgroundColor: '#e2e8f0', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', marginRight: '0.5rem', color: '#0f172a', fontWeight: 800 }}>O</div>
                Objective (Objektif)
              </label>
              <textarea
                value={oText}
                onChange={(e) => setOText(e.target.value)}
                placeholder="Hasil pemeriksaan klinis..."
                style={{ width: '100%', minHeight: '90px', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', resize: 'vertical', fontFamily: 'inherit', fontSize: '0.95rem', backgroundColor: '#ffffff', color: '#0f172a' }}
              />
            </div>

            <div>
              <label style={{ fontWeight: '700', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', color: '#0f172a', fontSize: '0.9rem' }}>
                <div style={{ width: '28px', height: '28px', backgroundColor: '#e2e8f0', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', marginRight: '0.5rem', color: '#0f172a', fontWeight: 800 }}>A</div>
                Assessment (Asesmen)
              </label>
              <textarea
                value={aText}
                onChange={(e) => setAText(e.target.value)}
                placeholder="Diagnosis kerja..."
                style={{ width: '100%', minHeight: '90px', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', resize: 'vertical', fontFamily: 'inherit', fontSize: '0.95rem', backgroundColor: '#ffffff', color: '#0f172a' }}
              />
            </div>

            <div>
              <label style={{ fontWeight: '700', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', color: '#0f172a', fontSize: '0.9rem' }}>
                <div style={{ width: '28px', height: '28px', backgroundColor: '#e2e8f0', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', marginRight: '0.5rem', color: '#0f172a', fontWeight: 800 }}>P</div>
                Plan (Rencana)
              </label>
              <textarea
                value={pText}
                onChange={(e) => setPText(e.target.value)}
                placeholder="Tindakan dan resep pengobatan..."
                style={{ width: '100%', minHeight: '90px', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', resize: 'vertical', fontFamily: 'inherit', fontSize: '0.95rem', backgroundColor: '#ffffff', color: '#0f172a' }}
              />
            </div>
          </div>
      </div>

      {/* Clinical Coding (ICD-10/9) & RAG Control Recommendation */}
      <div
        style={{
          marginTop: '1.25rem',
          padding: '1.25rem',
          borderRadius: 'var(--radius-md)',
          backgroundColor: '#f8fafc',
          border: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={18} color="#0284c7" />
              {t('scribe.clinical.evalTitle')}
            </h4>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
              {t('scribe.clinical.evalSubtitle')}
            </p>
          </div>

          <button
            type="button"
            onClick={handleAnalyzeClinical}
            disabled={isAnalyzingClinical}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.55rem 1.15rem',
              backgroundColor: isAnalyzingClinical ? '#94a3b8' : '#0284c7',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: isAnalyzingClinical ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 6px rgba(2, 132, 199, 0.2)',
            }}
          >
            <Sparkles size={16} />
            <span>{isAnalyzingClinical ? t('scribe.clinical.analyzing') : t('scribe.clinical.analyzeBtn')}</span>
          </button>
        </div>

        {clinicalResult && (
          <div
            style={{
              padding: '1rem',
              borderRadius: '8px',
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>
                  {t('scribe.clinical.icd10Label')}
                </span>
                <input
                  type="text"
                  value={clinicalResult.icd_10 || ''}
                  onChange={(e) => setClinicalResult({ ...clinicalResult, icd_10: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.45rem 0.65rem',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#0f172a',
                  }}
                />
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>
                  {t('scribe.clinical.icd9Label')}
                </span>
                <input
                  type="text"
                  value={clinicalResult.icd_9 || ''}
                  onChange={(e) => setClinicalResult({ ...clinicalResult, icd_9: e.target.value })}
                  placeholder={t('scribe.clinical.icd9Placeholder')}
                  style={{
                    width: '100%',
                    padding: '0.45rem 0.65rem',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.875rem',
                  }}
                />
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>
                  {t('scribe.clinical.controlStatusLabel')}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.35rem' }}>
                  <span
                    style={{
                      padding: '0.3rem 0.75rem',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      backgroundColor: clinicalResult.must_control ? '#fef2f2' : '#f0fdf4',
                      color: clinicalResult.must_control ? '#b91c1c' : '#15803d',
                      border: clinicalResult.must_control ? '1px solid #fecaca' : '1px solid #bbf7d0',
                    }}
                  >
                    {clinicalResult.must_control ? t('scribe.clinical.mandatoryControl') : t('scribe.clinical.optionalControl')}
                  </span>
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>
                  {t('scribe.clinical.controlDateLabel')}
                </span>
                <input
                  type="date"
                  value={clinicalResult.control_date || ''}
                  onChange={(e) => setClinicalResult({ ...clinicalResult, control_date: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.45rem 0.65rem',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.875rem',
                  }}
                />
              </div>
            </div>

            {/* Control Reason / Clinical Advice (Commented Out)
            <div>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>
                {t('scribe.clinical.controlReasonLabel')}
              </span>
              <textarea
                value={clinicalResult.control_reason || ''}
                onChange={(e) => setClinicalResult({ ...clinicalResult, control_reason: e.target.value })}
                rows={2}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.85rem',
                  resize: 'vertical',
                }}
              />
            </div>
            */}

            {/* Clinical Citations & ICD-10 / ICD-9 Grounding Candidates */}
            {(clinicalResult.rag_citations?.length > 0 || clinicalResult.icd_candidates?.icd10?.length > 0 || clinicalResult.icd_candidates?.icd9?.length > 0) && (
              <div
                style={{
                  marginTop: '0.25rem',
                  padding: '0.85rem',
                  backgroundColor: '#f8fafc',
                  borderRadius: '8px',
                  border: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.6rem',
                }}
              >
                {/* Citations */}
                {clinicalResult.rag_citations?.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#047857', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <FileText size={14} aria-hidden="true" />
                      {t('scribe.clinical.guidelinesLabel', 'Pedoman Klinis:')}
                    </span>
                    {clinicalResult.rag_citations.map((cite, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: '0.75rem',
                          backgroundColor: '#ecfdf5',
                          color: '#065f46',
                          border: 'none',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '6px',
                          fontWeight: 500,
                        }}
                      >
                        {cite}
                      </span>
                    ))}
                  </div>
                )}

                {/* ICD-10 & ICD-9-CM Candidates (Max 3, neutral styling without highlight) */}
                {[
                  {
                    key: 'icd10',
                    label: t('scribe.clinical.icd10CandidatesLabel', 'Kandidat ICD-10:'),
                    items: (clinicalResult.icd_candidates?.icd10 || []).slice(0, 3),
                    getText: (c) => `${c.code} - ${c.name_id || c.name_en}`,
                    onPick: (c) =>
                      setClinicalResult({
                        ...clinicalResult,
                        icd_10: `${c.code} - ${c.name_id || c.name_en}`,
                      }),
                  },
                  {
                    key: 'icd9',
                    label: t('scribe.clinical.icd9CandidatesLabel', 'Kandidat ICD-9-CM:'),
                    items: (clinicalResult.icd_candidates?.icd9 || []).slice(0, 3),
                    getText: (c) => `${c.code} - ${c.desc_indo || c.desc}`,
                    onPick: (c) =>
                      setClinicalResult({
                        ...clinicalResult,
                        icd_9: `${c.code} - ${c.desc_indo || c.desc}`,
                      }),
                  },
                ]
                  .filter((group) => group.items.length > 0)
                  .map((group) => (
                    <div key={group.key} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>
                        {group.label}
                      </span>
                      {group.items.map((c, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => group.onPick(c)}
                          title={`Pilih ${c.code}`}
                          style={{
                            fontSize: '0.75rem',
                            padding: '0.25rem 0.55rem',
                            backgroundColor: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            color: '#475569',
                            fontWeight: 400,
                          }}
                        >
                          {group.getText(c)}
                        </button>
                      ))}
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Action Buttons: Cancel, Single Save, Export */}
      <div
        style={{
          marginTop: '1.5rem',
          paddingTop: '1.25rem',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          {t('scribe.form.hint')}
        </span>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleCancel}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              minHeight: '44px',
              padding: '0.6rem 1.2rem',
              border: '1px solid #e2e8f0',
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#ffffff',
              color: '#475569',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <X size={18} aria-hidden="true" />
            <span>{t('scribe.form.cancelBtn')}</span>
          </button>

          <button
            type="button"
            onClick={handleExport}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              minHeight: '44px',
              padding: '0.6rem 1.2rem',
              border: '1px solid #e2e8f0',
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#ffffff',
              color: '#334155',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--primary-color)'; }}
            onMouseOut={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; }}
          >
            <Download size={18} aria-hidden="true" />
            <span>{t('scribe.form.exportBtn')}</span>
          </button>

          <button
            type="button"
            onClick={executeFinalize}
            disabled={isFinalizing || isSaving}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              minHeight: '44px',
              padding: '0.6rem 1.45rem',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              backgroundColor: (isFinalizing || isSaving) ? '#94a3b8' : '#059669',
              color: '#ffffff',
              fontWeight: 600,
              cursor: (isFinalizing || isSaving) ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 6px rgba(5, 150, 105, 0.22)',
            }}
          >
            <Save size={18} aria-hidden="true" />
            <span>{(isFinalizing || isSaving) ? t('scribe.form.saveBtnSaving', 'Menyimpan...') : t('scribe.form.saveBtn', 'Simpan')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SoapFormView;
