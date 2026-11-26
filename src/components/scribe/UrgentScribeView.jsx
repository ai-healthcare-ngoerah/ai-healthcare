import React, { useState, useRef, useEffect } from 'react';
import { 
  AlertTriangle, Flame, ShieldAlert, HeartPulse, Activity, 
  CheckSquare, Square, Pill, Send, RefreshCw, FileText, CheckCircle2,
  Mic, MicOff, Radio, User, Stethoscope, RotateCcw
} from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import { useTranslation } from 'react-i18next';
import RealtimeAudioModal from './RealtimeAudioModal';

const PRESET_SCENARIOS = [
  {
    title: 'Trauma & Syok Hipovolemik (UGD)',
    text: 'Pasien trauma kecelakaan, tensi 80/50, nadi 130, SpO2 88%, perdarahan 1200cc aktif di paha.',
    setting: 'UGD_TRIAGE'
  },
  {
    title: 'Henti Jantung VF/VT (Resusitasi)',
    text: 'Pasien tidak sadar, nadi tidak teraba, monitor EKG menunjukkan Ventricular Fibrillation (VF), RR 0, SpO2 70%.',
    setting: 'RESUSCITATION'
  },
  {
    title: 'Hipotensi & Pendarahan Masif (Operasi)',
    text: 'Intra-operatif laparatomi, tensi 70/40, MAP 50, nadi 125, perdarahan 1500cc, EtCO2 25.',
    setting: 'OPERATING_ROOM'
  },
  {
    title: 'Krisis Hipertermia Maligna (Kamar Bedah)',
    text: 'Pasien pasca inhalasi Sevoflurane, EtCO2 65, temperatur 39.8, takikardia 145, kekakuan otot ekstremitas.',
    setting: 'OPERATING_ROOM'
  },
  {
    title: 'Kecurigaan Sepsis Berat (ICU/UGD)',
    text: 'Pasien demam tinggi suhu 39.2, respirasi nafas 28 kali per menit, tensi 90/55, GCS 13 tampak letargis.',
    setting: 'ICU_HCU'
  }
];

const CLINICAL_SETTINGS = [
  { id: 'UGD_TRIAGE', label: 'UGD & Triage Trauma' },
  { id: 'OPERATING_ROOM', label: 'Kamar Operasi (Bedah & Anestesi)' },
  { id: 'RESUSCITATION', label: 'Ruang Resusitasi & Code Blue' },
  { id: 'ICU_HCU', label: 'ICU / Intensive Care' }
];

const UrgentScribeView = () => {
  const { t } = useTranslation();
  const { showToast } = useNotification();
  const [clinicalSetting, setClinicalSetting] = useState('UGD_TRIAGE');
  const [telemetryText, setTelemetryText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [alertData, setAlertData] = useState(null);
  const [checklist, setChecklist] = useState([]);
  const [finalCppt, setFinalCppt] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLiveListening, setIsLiveListening] = useState(false);
  const [hasSessionStarted, setHasSessionStarted] = useState(false);
  
  // Realtime Chatbot Messages Feed
  const [chatMessages, setChatMessages] = useState([]);
  
  const recognitionRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  useEffect(() => {
    if (chatMessages.length > 0) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isAnalyzing]);

  const handleToggleMic = () => {
    if (isLiveListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      setIsLiveListening(false);
      if (telemetryText.trim()) {
        handleAnalyze(telemetryText);
      }
    } else {
      setHasSessionStarted(true);
      setIsLiveListening(true);
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        return;
      }

      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'id-ID';

        recognition.onresult = (event) => {
          let currentTranscript = '';
          for (let i = 0; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript + ' ';
          }
          const trimmed = currentTranscript.trim();
          setTelemetryText(trimmed);
        };

        recognition.onerror = (event) => {
          console.warn('Urgent speech error (continuing in manual dictation mode):', event.error);
        };

        recognition.onend = () => {
          if (!recognitionRef.current) {
            setIsLiveListening(false);
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (err) {
        console.warn('Speech recognition start failed (continuing in manual stream mode):', err);
      }
    }
  };

  const handleFinishModalAudio = async (audioBlob, liveText) => {
    setIsModalOpen(false);
    if (liveText && liveText.trim()) {
      setTelemetryText(liveText);
      handleAnalyze(liveText);
    } else if (audioBlob && audioBlob.size > 500) {
      try {
        const formData = new FormData();
        formData.append('audio', audioBlob, 'urgent_audio.webm');
        const apiUrl = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8001') + '/api/scribe/transcribe-live';
        const res = await fetch(apiUrl, {
          method: 'POST',
          body: formData
        });
        if (res.ok) {
          const data = await res.json();
          if (data.text) {
            setTelemetryText(data.text);
            handleAnalyze(data.text);
          }
        }
      } catch (err) {
        console.error('Audio transcribe error:', err);
        showToast({
          type: 'error',
          title: 'Transkripsi Gagal',
          message: 'Gagal mentranskripsi audio rekaman darurat.'
        });
      }
    }
  };

  const handleAnalyze = async (overrideText = null, overrideSetting = null) => {
    const textToSend = (overrideText !== null ? overrideText : telemetryText).trim();
    const settingToSend = overrideSetting || clinicalSetting;

    if (!textToSend) {
      showToast({
        type: 'warning',
        title: 'Input Kosong',
        message: 'Bicarakan kondisi darurat atau pilih salah satu skenario cepat.'
      });
      return;
    }

    // 1. Instantly append Doctor message bubble to chatbot feed
    const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const userMsg = {
      id: 'usr-' + Date.now(),
      sender: 'user',
      text: textToSend,
      timestamp: nowTime,
      setting: settingToSend
    };
    setChatMessages((prev) => [...prev, userMsg]);
    setTelemetryText('');

    setIsAnalyzing(true);
    try {
      const apiUrl = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8001') + '/api/scribe/urgent/stream';
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          raw_text: textToSend,
          clinical_setting: settingToSend,
          patient_weight_kg: 60.0
        })
      });

      if (!response.ok) {
        throw new Error('Gagal mengevaluasi telemetri darurat.');
      }

      const data = await response.json();
      setAlertData(data);
      setChecklist(data.immediate_actions || []);
      setFinalCppt(null);

      // 2. Append AI Co-Pilot emergency evaluation message to chatbot feed
      const aiMsg = {
        id: 'ai-' + Date.now(),
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        data: data
      };
      setChatMessages((prev) => [...prev, aiMsg]);

      showToast({
        type: data.alert_level === 'LIFE_THREATENING' ? 'error' : (data.alert_level === 'CRITICAL' ? 'warning' : 'success'),
        title: `Peringatan: ${data.alert_level}`,
        message: data.primary_condition
      });
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Evaluasi Gagal',
        message: err.message || 'Koneksi ke backend telemetri terputus.'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleToggleChecklist = (id) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
  };

  const handleApplyPreset = (preset) => {
    setClinicalSetting(preset.setting);
    handleAnalyze(preset.text, preset.setting);
  };

  const handleResetSession = () => {
    if (recognitionRef.current && isLiveListening) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setIsLiveListening(false);
    setHasSessionStarted(false);
    setChatMessages([]);
    setAlertData(null);
    setTelemetryText('');
    setFinalCppt(null);
    setChecklist([]);
    showToast({ type: 'info', message: t('scribe.urgent.clearSessionBtn', 'Sesi telemetri darurat telah dibersihkan.') });
  };

  const handleFinalize = async () => {
    const combinedTexts = chatMessages
      .filter((m) => m.sender === 'user')
      .map((m) => m.text)
      .join(' | ');

    if (!combinedTexts.trim()) {
      showToast({ type: 'warning', message: 'Belum ada rekaman kasus darurat untuk difinalisasi.' });
      return;
    }

    setIsFinalizing(true);
    try {
      const apiUrl = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8001') + '/api/scribe/urgent/finalize';
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          raw_text: combinedTexts,
          clinical_setting: clinicalSetting
        })
      });

      if (!response.ok) {
        throw new Error('Gagal menyimpan CPPT darurat.');
      }

      const data = await response.json();
      setFinalCppt(data.cppt_text);
      showToast({
        type: 'success',
        title: 'CPPT Tersimpan',
        message: 'Rekam medis gawat darurat berhasil difinalisasi ke sistem.'
      });
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Gagal Finalisasi',
        message: err.message || 'Terjadi kesalahan saat memfinalisasi CPPT.'
      });
    } finally {
      setIsFinalizing(false);
    }
  };

  const getAlertBadgeColor = (level) => {
    switch (level) {
      case 'LIFE_THREATENING':
        return { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca', bar: '#dc2626' };
      case 'CRITICAL':
        return { bg: '#fff7ed', text: '#c2410c', border: '#ffedd5', bar: '#ea580c' };
      case 'WARNING':
        return { bg: '#fefce8', text: '#a16207', border: '#fef08a', bar: '#d97706' };
      default:
        return { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0', bar: '#059669' };
    }
  };

  const shouldShowCoPilot = hasSessionStarted || chatMessages.length > 0 || isLiveListening || isAnalyzing || telemetryText.trim().length > 0;

  return (
    <div className="urgent-scribe-container animate-fade-in">
      {/* 1. Recording CTA Workspace Band (Urgent Mode) */}
      <div
        className="service-sheet-band"
        style={{
          padding: '3rem 2rem',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: (isLiveListening || chatMessages.length > 0) ? '#fffbfb' : '#ffffff',
          transition: 'background-color 0.25s ease'
        }}
      >
        <div
          onClick={handleToggleMic}
          style={{
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            backgroundColor: '#dc2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            marginBottom: '1.25rem',
            boxShadow: isLiveListening
              ? '0 0 0 10px rgba(220, 38, 38, 0.25), 0 10px 25px -5px rgba(220, 38, 38, 0.5)'
              : '0 10px 25px -5px rgba(220, 38, 38, 0.4)',
            transform: isLiveListening ? 'scale(1.05)' : 'scale(1)',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            if (!isLiveListening) e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseOut={(e) => {
            if (!isLiveListening) e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          {isLiveListening ? (
            <MicOff size={44} color="#ffffff" className="animate-pulse" />
          ) : (
            <Mic size={44} color="#ffffff" />
          )}
        </div>

        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-main)' }}>
          {isLiveListening
            ? t('scribe.urgent.heroTitleActive')
            : (chatMessages.length > 0
                ? t('scribe.urgent.heroBtnRerecord')
                : t('scribe.urgent.heroTitleIdle'))}
        </h2>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '520px', margin: '0 0 1.25rem 0', lineHeight: 1.5 }}>
          {t('scribe.urgent.heroSubtitle')}
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={handleToggleMic}
            className="btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.75rem 2rem',
              fontSize: '1rem',
              backgroundColor: '#dc2626',
              color: '#ffffff',
              borderRadius: '8px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: isLiveListening ? '0 0 12px rgba(220, 38, 38, 0.4)' : 'none'
            }}
          >
            {isLiveListening ? <MicOff size={20} /> : <Mic size={20} />}
            <span>
              {isLiveListening
                ? t('scribe.urgent.heroBtnRecording')
                : (chatMessages.length > 0
                    ? t('scribe.urgent.heroBtnRerecord')
                    : t('scribe.urgent.heroBtnStart'))}
            </span>
          </button>

          {chatMessages.length > 0 && !isLiveListening && (
            <button
              type="button"
              onClick={handleResetSession}
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
              <RotateCcw size={16} />
              <span>{t('scribe.urgent.clearSessionBtn')}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Realtime Emergency AI Co-Pilot Feed (Hidden before recording/chat exists) */}
      {shouldShowCoPilot && (
        <div
          className="service-sheet-band animate-fade-in"
          style={{
            backgroundColor: '#ffffff'
          }}
        >


        {/* Quick Simulation Chips (Hidden as per user request)
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            Simulasi Kasus Instan (Kirim Langsung ke AI):
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {PRESET_SCENARIOS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplyPreset(p)}
                style={{
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  color: '#334155',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = '#dc2626';
                  e.currentTarget.style.color = '#dc2626';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = '#cbd5e1';
                  e.currentTarget.style.color = '#334155';
                }}
              >
                {p.title}
              </button>
            ))}
          </div>
        </div>
        */}

        {/* Chat Stream Message Container */}
        <div
          style={{
            minHeight: '260px',
            maxHeight: '520px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            padding: '1rem',
            backgroundColor: '#f8fafc',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            marginBottom: '1.25rem'
          }}
        >
          {chatMessages.length === 0 && !isLiveListening && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2.5rem 1rem',
                textAlign: 'center',
                color: 'var(--text-muted)'
              }}
            >
              <HeartPulse size={32} color="#94a3b8" style={{ marginBottom: '0.5rem' }} />
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#64748b' }}>
                {t('scribe.urgent.waitingTelemetry')}
              </div>
            </div>
          )}

          {chatMessages.map((msg) => {
              if (msg.sender === 'user') {
                return (
                  <div
                    key={msg.id}
                    className="animate-fade-in"
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      alignItems: 'flex-start',
                      gap: '0.6rem'
                    }}
                  >
                    <div style={{ maxWidth: '80%' }}>
                      <div
                        style={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #cbd5e1',
                          padding: '0.85rem 1.15rem',
                          borderRadius: '14px 14px 2px 14px',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                          color: '#0f172a',
                          fontSize: '0.9rem',
                          lineHeight: 1.5
                        }}
                      >
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#dc2626', marginBottom: '0.25rem' }}>
                          {t('scribe.urgent.medicalTeamSender')}
                        </div>
                        <div>{msg.text}</div>
                      </div>
                      <div style={{ textAlign: 'right', fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.25rem', paddingRight: '0.25rem' }}>
                        {msg.timestamp}
                      </div>
                    </div>

                    <div
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '50%',
                        backgroundColor: '#dc2626',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                        flexShrink: 0
                      }}
                    >
                      <User size={18} />
                    </div>
                  </div>
                );
              }

              // AI Message Bubble
              const data = msg.data || {};
              const colors = getAlertBadgeColor(data.alert_level);
              return (
                <div
                  key={msg.id}
                  className="animate-fade-in"
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-start',
                    alignItems: 'flex-start',
                    gap: '0.6rem'
                  }}
                >
                  <div
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '50%',
                      backgroundColor: colors.bar,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      flexShrink: 0
                    }}
                  >
                    <ShieldAlert size={18} />
                  </div>

                  <div style={{ maxWidth: '88%', width: '100%' }}>
                    <div
                      style={{
                        backgroundColor: '#ffffff',
                        border: `1px solid ${colors.border}`,
                        borderLeft: `5px solid ${colors.bar}`,
                        padding: '1.25rem',
                        borderRadius: '2px 14px 14px 14px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                      }}
                    >
                      {/* Alert Header */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.85rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span
                            style={{
                              padding: '0.25rem 0.65rem',
                              borderRadius: '9999px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              backgroundColor: colors.bg,
                              color: colors.text,
                              border: `1px solid ${colors.border}`
                            }}
                          >
                            {data.alert_level || 'ALERT'}
                          </span>
                          <span style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>
                            {data.primary_condition || 'Kondisi Darurat Terdeteksi'}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          AI Co-Pilot • {msg.timestamp}
                        </span>
                      </div>

                      {/* Vitals Telemetry Grid */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
                          gap: '0.5rem',
                          marginBottom: '1rem'
                        }}
                      >
                        {data.vitals_payload?.bp_str && (
                          <div style={{ background: '#f8fafc', padding: '0.45rem 0.65rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                            <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase' }}>Tekanan Darah</div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>{data.vitals_payload.bp_str}</div>
                          </div>
                        )}
                        {data.vitals_payload?.map !== undefined && (
                          <div style={{ background: '#f8fafc', padding: '0.45rem 0.65rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                            <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase' }}>MAP</div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: data.vitals_payload.map < 65 ? '#dc2626' : '#059669' }}>
                              {data.vitals_payload.map} mmHg
                            </div>
                          </div>
                        )}
                        {data.vitals_payload?.hr && (
                          <div style={{ background: '#f8fafc', padding: '0.45rem 0.65rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                            <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase' }}>Nadi</div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: data.vitals_payload.hr > 100 ? '#ea580c' : '#0f172a' }}>
                              {data.vitals_payload.hr} bpm
                            </div>
                          </div>
                        )}
                        {data.clinical_scores?.shock_index !== undefined && (
                          <div style={{ background: '#f8fafc', padding: '0.45rem 0.65rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                            <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase' }}>Shock Index</div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: data.clinical_scores.shock_index >= 1.3 ? '#dc2626' : (data.clinical_scores.shock_index >= 0.9 ? '#ea580c' : '#059669') }}>
                              {data.clinical_scores.shock_index}
                            </div>
                          </div>
                        )}
                        {data.vitals_payload?.spo2 && (
                          <div style={{ background: '#f8fafc', padding: '0.45rem 0.65rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                            <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase' }}>SpO2</div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: data.vitals_payload.spo2 < 90 ? '#dc2626' : '#059669' }}>
                              {data.vitals_payload.spo2}%
                            </div>
                          </div>
                        )}
                      </div>

                      {/* AI Clinical Recommendation Directive */}
                      {data.ai_recommendation && (
                        <div
                          style={{
                            background: '#eff6ff',
                            border: '1px solid #bfdbfe',
                            borderRadius: '8px',
                            padding: '0.85rem 1rem',
                            marginBottom: '1rem',
                            fontSize: '0.875rem',
                            color: '#1e3a8a',
                            lineHeight: 1.5
                          }}
                        >
                          <strong>{t('scribe.urgent.aiDirectiveTitle')}</strong> {data.ai_recommendation}
                        </div>
                      )}

                      {/* Immediate Checklist Chips */}
                      {checklist && checklist.length > 0 && (
                        <div style={{ marginBottom: '1rem' }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <CheckSquare size={15} color="#0284c7" />
                            <span>{t('scribe.urgent.resuscitationChecklistTitle')}</span>
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                            {checklist.map((item) => (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => handleToggleChecklist(item.id)}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.4rem',
                                  padding: '0.35rem 0.75rem',
                                  borderRadius: '6px',
                                  fontSize: '0.8rem',
                                  fontWeight: 500,
                                  cursor: 'pointer',
                                  background: item.completed ? '#ecfdf5' : '#ffffff',
                                  color: item.completed ? '#047857' : '#334155',
                                  border: item.completed ? '1px solid #a7f3d0' : '1px solid #cbd5e1',
                                  textDecoration: item.completed ? 'line-through' : 'none'
                                }}
                              >
                                {item.completed ? <CheckSquare size={14} color="#059669" /> : <Square size={14} color="#94a3b8" />}
                                <span>{item.action}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Emergency Drug Calculations */}
                      {data.emergency_drugs && data.emergency_drugs.length > 0 && (
                        <div>
                          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Pill size={15} color="#dc2626" />
                            <span>{t('scribe.urgent.emergencyDrugsTitle')}</span>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
                            {data.emergency_drugs.map((drug, dIdx) => (
                              <div
                                key={dIdx}
                                style={{
                                  background: '#fff1f2',
                                  border: '1px solid #fecdd3',
                                  padding: '0.5rem 0.75rem',
                                  borderRadius: '6px',
                                  fontSize: '0.8rem'
                                }}
                              >
                                <div style={{ fontWeight: 700, color: '#9f1239' }}>{drug.name}</div>
                                <div style={{ color: '#0f172a', fontWeight: 600 }}>{drug.calculated_dose}</div>
                                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{drug.route} • {drug.notes}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                </div>
              );
            })}


          {/* AI Thinking / Evaluating Indicator inside Chat Stream */}
          {isAnalyzing && (
            <div
              className="animate-fade-in"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem'
              }}
            >
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  backgroundColor: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff'
                }}
              >
                <RefreshCw size={16} className="animate-spin" />
              </div>
              <div
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  padding: '0.65rem 1rem',
                  borderRadius: '2px 12px 12px 12px',
                  fontSize: '0.85rem',
                  color: '#334155',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <span className="animate-pulse">{t('scribe.urgent.aiEvaluating')}</span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Live Listening Banner Indicator */}
        {isLiveListening && (
          <div
            className="animate-fade-in"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.6rem 1rem',
              backgroundColor: '#fef2f2',
              borderRadius: '8px',
              border: '1px solid #fecaca',
              color: '#991b1b',
              fontSize: '0.85rem',
              marginBottom: '0.75rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span
                style={{
                  display: 'inline-block',
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: '#dc2626',
                  boxShadow: '0 0 8px #dc2626'
                }}
              />
              <span style={{ fontWeight: 600 }}>{t('scribe.urgent.liveListeningActive', 'Mikrofon Aktif Mendengarkan')}</span>
            </div>
            <button
              type="button"
              onClick={handleToggleMic}
              style={{
                background: '#dc2626',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '0.25rem 0.75rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {t('scribe.urgent.evaluateBtn', 'Kirim ke AI')}
            </button>
          </div>
        )}

        {/* Fast Input & Dictation Bar */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              type="text"
              value={telemetryText}
              onChange={(e) => setTelemetryText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAnalyze();
                }
              }}
              placeholder={t('scribe.urgent.telemetryPlaceholder', 'Input kondisi / tanda vital darurat...')}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                paddingRight: '3rem',
                borderRadius: '8px',
                border: isLiveListening ? '2px solid #dc2626' : '1px solid #cbd5e1',
                fontSize: '0.9rem',
                outline: 'none',
                backgroundColor: isLiveListening ? '#fffdfd' : '#ffffff',
                color: '#0f172a',
                transition: 'border 0.2s ease'
              }}
            />

            {/* In-input mic icon */}
            <button
              type="button"
              onClick={handleToggleMic}
              title={isLiveListening ? t('scribe.urgent.liveListeningActive') : t('scribe.urgent.liveListening')}
              style={{
                position: 'absolute',
                top: '50%',
                transform: 'translateY(-50%)',
                right: '0.5rem',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: isLiveListening ? '#dc2626' : '#f1f5f9',
                color: isLiveListening ? '#ffffff' : '#64748b',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              {isLiveListening ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
          </div>

          <button
            type="button"
            onClick={() => handleAnalyze()}
            disabled={isAnalyzing || !telemetryText.trim()}
            className="btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              backgroundColor: '#dc2626',
              color: '#ffffff',
              fontSize: '0.9rem',
              fontWeight: 600,
              borderRadius: '8px'
            }}
          >
            <Send size={16} />
            <span>{isAnalyzing ? t('scribe.urgent.evaluating') : t('scribe.urgent.evaluateBtn', 'Kirim')}</span>
          </button>
        </div>

        {/* Finalize CPPT Option (Only at the end when stabilized) */}
        {chatMessages.length > 0 && (
          <div
            style={{
              marginTop: '1.25rem',
              paddingTop: '1rem',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center'
            }}
          >
            <button
              type="button"
              onClick={handleFinalize}
              disabled={isFinalizing}
              className="btn-secondary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1.15rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                borderRadius: '8px'
              }}
            >
              {isFinalizing ? <RefreshCw size={15} className="animate-spin" /> : <FileText size={15} />}
              <span>{isFinalizing ? t('scribe.urgent.generatingCppt') : t('scribe.urgent.generateCpptBtn')}</span>
            </button>
          </div>
        )}
      </div>
      )}

      {/* Generated Final CPPT Display */}
      {finalCppt && (
        <div className="service-sheet-band animate-fade-in" style={{ background: '#f8fafc' }}>
          <h4 style={{ margin: '0 0 1rem 0', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={18} color="#059669" />
            {t('scribe.urgent.toastCpptGenerated')}
          </h4>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'monospace', fontSize: '0.85rem', background: '#ffffff', padding: '1rem', borderRadius: '8px', border: 'none', margin: 0 }}>
            {finalCppt}
          </pre>
        </div>
      )}

      {/* Realtime Pop-up Audio Modal for Urgent Mode */}
      <RealtimeAudioModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onFinishRecording={handleFinishModalAudio}
        isProcessing={isAnalyzing}
      />

    </div>
  );
};

export default UrgentScribeView;
