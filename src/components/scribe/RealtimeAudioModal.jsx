import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Mic, MicOff, X, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNotification } from '../../context/NotificationContext';

const RealtimeAudioModal = ({ isOpen, onClose, onFinishRecording, isProcessing }) => {
  const { t, i18n } = useTranslation();
  const { showToast, confirmAction } = useNotification();
  const [recordingTime, setRecordingTime] = useState(0);
  const [liveText, setLiveText] = useState('');
  const [error, setError] = useState(null);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const recognitionRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (liveText) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [liveText]);

  useEffect(() => {
    if (isOpen) {
      startRecordingSession();
    } else {
      stopAllMedia();
    }
    return () => {
      stopAllMedia();
    };
  }, [isOpen]);

  const stopAllMedia = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
  };

  const startRecordingSession = async () => {
    setError(null);
    setLiveText('');
    setRecordingTime(0);
    audioChunksRef.current = [];

    // 1. Start Audio MediaRecorder for Whisper backend
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(1000); // 1 second chunks
    } catch (err) {
      console.error('Microphone error:', err);
      setError(t('scribe.modal.alertMicError'));
      return;
    }

    // 2. Start Web Speech API for Realtime Pop-up Preview
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = (i18n.language && i18n.language.startsWith('en')) ? 'en-US' : 'id-ID';

        recognition.onresult = (event) => {
          let currentTranscript = '';
          for (let i = 0; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript + ' ';
          }
          setLiveText(currentTranscript.trim());
        };

        recognition.onerror = (event) => {
          console.warn('Speech recognition warning:', event.error);
        };

        recognition.start();
        recognitionRef.current = recognition;
      }
    } catch (err) {
      console.warn('Speech recognition not supported in this browser:', err);
    }

    // 3. Start Timer
    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
  };

  const handleFinish = () => {
    stopAllMedia();
    showToast({
      type: 'success',
      title: t('scribe.modal.finishToastTitle', 'Perekaman Selesai'),
      message: t('scribe.modal.finishToastMsg', 'Mentranskripsi rekaman suara untuk dikonfirmasi...'),
    });

    const finalLiveText = liveText;

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      let stopped = false;
      mediaRecorderRef.current.onstop = () => {
        if (stopped) return;
        stopped = true;
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        onFinishRecording(audioBlob, finalLiveText);
      };
      try {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream?.getTracks().forEach(track => track.stop());
      } catch (e) {}

      // Fallback timeout in case onstop doesn't trigger within 500ms
      setTimeout(() => {
        if (!stopped) {
          stopped = true;
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          onFinishRecording(audioBlob, finalLiveText);
        }
      }, 500);
    } else {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      onFinishRecording(audioBlob, finalLiveText);
    }
  };

  const handleCancel = () => {
    confirmAction({
      title: t('scribe.modal.cancelConfirmTitle', 'Batalkan Perekaman'),
      message: t('scribe.modal.cancelConfirmMsg', 'Apakah Anda yakin ingin membatalkan perekaman konsultasi medis ini?'),
      type: 'warning',
      confirmText: t('scribe.modal.cancelConfirmBtn', 'Ya, Batalkan'),
      cancelText: t('common.cancelBtn', 'Batal'),
      onConfirm: () => {
        stopAllMedia();
        if (mediaRecorderRef.current?.stream) {
          mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
        onClose();
        showToast({
          type: 'info',
          message: t('scribe.modal.cancelToast', 'Perekaman audio dibatalkan.'),
        });
      },
    });
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const renderHighlightedWords = () => {
    if (!liveText) {
      return (
        <p style={{ margin: 0, color: 'var(--text-muted)', fontStyle: 'italic' }}>
          {t('scribe.modal.idleText')}
        </p>
      );
    }
    const words = liveText.trim().split(/\s+/);
    if (words.length <= 2) {
      return (
        <p style={{ margin: 0 }}>
          <span style={{
            color: '#000000',
            fontWeight: 700,
            transition: 'all 0.3s ease',
            display: 'inline-block'
          }}>
            {liveText}
          </span>
        </p>
      );
    }
    const normalWords = words.slice(0, -2).join(' ');
    const highlightedWords = words.slice(-2).join(' ');
    return (
      <p style={{ margin: 0 }}>
        <span>{normalWords} </span>
        <span style={{
          color: '#000000',
          fontWeight: 700,
          transition: 'all 0.3s ease',
          display: 'inline-block'
        }}>
          {highlightedWords}
        </span>
      </p>
    );
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1rem'
      }}
      className="animate-fade-in"
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
          width: '100%',
          maxWidth: '600px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-color)',
            backgroundColor: '#f8fafc',
            textAlign: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: '#ef4444',
                animation: 'pulse 1.5s infinite'
              }}
            />
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', textAlign: 'center' }}>
              {t('scribe.modal.title')}
            </h3>
          </div>
          <button
            onClick={handleCancel}
            disabled={isProcessing}
            style={{
              position: 'absolute',
              right: '1.5rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: '4px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '2rem 1.5rem', textAlign: 'center' }}>
          {error ? (
            <div
              style={{
                backgroundColor: '#fef2f2',
                color: '#991b1b',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '1.5rem',
                textAlign: 'left'
              }}
            >
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          ) : (
            <>
              {/* Mic Visual Wave / Pulse Button */}
              <div
                style={{
                  width: '96px',
                  height: '96px',
                  borderRadius: '50%',
                  backgroundColor: isProcessing ? '#3b82f6' : '#ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.5rem',
                  boxShadow: isProcessing
                    ? '0 0 0 12px rgba(59, 130, 246, 0.2)'
                    : '0 0 0 12px rgba(239, 68, 68, 0.2)',
                  transition: 'all 0.3s ease'
                }}
              >
                {isProcessing ? (
                  <Loader2 size={40} color="#ffffff" className="animate-spin" />
                ) : (
                  <Mic size={40} color="#ffffff" />
                )}
              </div>

              {/* Recording Time */}
              <h2
                style={{
                  fontSize: '2rem',
                  fontWeight: 700,
                  color: isProcessing ? '#3b82f6' : '#ef4444',
                  margin: '0 0 0.5rem',
                  fontVariantNumeric: 'tabular-nums'
                }}
              >
                {isProcessing ? t('scribe.modal.processing') : formatTime(recordingTime)}
              </h2>

              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                {isProcessing
                  ? t('scribe.modal.subtitleProcessing')
                  : t('scribe.modal.subtitleRecording')}
              </p>

              {/* Realtime Live Text Preview Box */}
              <div
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  minHeight: '160px',
                  maxHeight: '240px',
                  overflowY: 'auto',
                  textAlign: 'center',
                  color: 'var(--text-main)',
                  fontSize: '1rem',
                  lineHeight: '1.6',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                }}
              >
                {renderHighlightedWords()}
                <div ref={bottomRef} />
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--border-color)',
            backgroundColor: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '0.75rem'
          }}
        >
          <button
            onClick={handleCancel}
            disabled={isProcessing}
            style={{
              backgroundColor: 'white',
              color: 'var(--text-muted)',
              border: '1px solid var(--border-color)',
              padding: '0.6rem 1.2rem',
              borderRadius: 'var(--radius-md)',
              fontWeight: 500,
              cursor: isProcessing ? 'not-allowed' : 'pointer'
            }}
          >
            {t('scribe.modal.cancelBtn')}
          </button>
          <button
            onClick={handleFinish}
            disabled={isProcessing}
            style={{
              backgroundColor: isProcessing ? '#93c5fd' : 'var(--primary-color)',
              color: 'white',
              border: 'none',
              padding: '0.6rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              fontWeight: 600,
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              margin: 0
            }}
          >
            {isProcessing ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>{t('scribe.modal.finishBtnProcessing')}</span>
              </>
            ) : (
              <>
                <Sparkles size={18} />
                <span>{t('scribe.modal.finishBtn')}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default RealtimeAudioModal;
