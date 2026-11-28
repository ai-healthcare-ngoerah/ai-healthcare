import { useState } from 'react';
import { createPortal } from 'react-dom';
import { FileText, X, RotateCcw, Check, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const TranscriptConfirmModal = ({
  isOpen,
  initialTranscript = '',
  isSubmitting = false,
  onConfirm,
  onRerecord,
  onClose,
}) => {
  const { t } = useTranslation();
  const [draftText, setDraftText] = useState(initialTranscript || '');
  const [validationError, setValidationError] = useState('');

  // Sync draft text whenever modal opens with new transcript without cascading useEffect renders
  const [prevOpen, setPrevOpen] = useState(isOpen);
  const [prevTranscript, setPrevTranscript] = useState(initialTranscript);
  if (isOpen !== prevOpen || initialTranscript !== prevTranscript) {
    setPrevOpen(isOpen);
    setPrevTranscript(initialTranscript);
    if (isOpen) {
      setDraftText(initialTranscript || '');
      setValidationError('');
    }
  }

  if (!isOpen) return null;

  const trimmed = draftText.trim();
  const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;

  const handleConfirmClick = () => {
    if (!trimmed) {
      setValidationError(
        t('scribe.transcriptModal.emptyWarning', 'Teks transkrip tidak boleh kosong sebelum membuat catatan SOAP.')
      );
      return;
    }
    setValidationError('');
    onConfirm(trimmed);
  };

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1rem',
      }}
      className="animate-fade-in"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="transcript-confirm-title"
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 20px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.08)',
          width: '100%',
          maxWidth: '640px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.1rem 1.4rem',
            borderBottom: '1px solid var(--border-color)',
            backgroundColor: '#f8fafc',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <FileText size={20} color="var(--primary-color)" aria-hidden="true" />
            <div>
              <h3
                id="transcript-confirm-title"
                style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}
              >
                {t('scribe.transcriptModal.title', 'Konfirmasi Hasil Transkrip')}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label={t('scribe.transcriptModal.cancelBtn', 'Batal')}
            style={{
              background: 'none',
              border: 'none',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              color: '#64748b',
              padding: '4px',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '1.25rem 1.4rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#475569', lineHeight: 1.5 }}>
            {t(
              'scribe.transcriptModal.subtitle',
              'Periksa dan sunting hasil transkrip percakapan di bawah ini sebelum dibuat menjadi catatan SOAP.'
            )}
          </p>

          <textarea
            aria-label={t('scribe.transcriptModal.title', 'Konfirmasi Hasil Transkrip')}
            value={draftText}
            onChange={(e) => {
              setDraftText(e.target.value);
              if (validationError) setValidationError('');
            }}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !isSubmitting) {
                e.preventDefault();
                handleConfirmClick();
              }
            }}
            disabled={isSubmitting}
            placeholder={t('scribe.transcriptModal.placeholder', 'Teks transkrip percakapan...')}
            style={{
              width: '100%',
              minHeight: '220px',
              padding: '0.85rem',
              borderRadius: '8px',
              border: validationError ? '1px solid #dc2626' : '1px solid #cbd5e1',
              fontFamily: 'inherit',
              fontSize: '0.95rem',
              lineHeight: 1.6,
              color: '#0f172a',
              backgroundColor: '#ffffff',
              resize: 'vertical',
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: '20px' }}>
            {validationError ? (
              <span style={{ fontSize: '0.8rem', color: '#dc2626', fontWeight: 500 }}>{validationError}</span>
            ) : (
              <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                {t('scribe.transcriptModal.wordCount', { count: wordCount, defaultValue: `${wordCount} kata` })}
              </span>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '1rem 1.4rem',
            borderTop: '1px solid var(--border-color)',
            backgroundColor: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <button
            type="button"
            onClick={onRerecord}
            disabled={isSubmitting}
            style={{
              backgroundColor: '#ffffff',
              color: '#334155',
              border: '1px solid #cbd5e1',
              padding: '0.55rem 1rem',
              minHeight: '42px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
            }}
          >
            <RotateCcw size={16} />
            <span>{t('scribe.transcriptModal.rerecordBtn', 'Rekam Ulang')}</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                backgroundColor: '#ffffff',
                color: '#475569',
                border: '1px solid #cbd5e1',
                padding: '0.55rem 1.05rem',
                minHeight: '42px',
                borderRadius: '8px',
                fontWeight: 500,
                fontSize: '0.875rem',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
              }}
            >
              {t('scribe.transcriptModal.cancelBtn', 'Batal')}
            </button>

            <button
              type="button"
              onClick={handleConfirmClick}
              disabled={isSubmitting}
              className="btn-primary"
              style={{
                margin: 0,
                padding: '0.55rem 1.35rem',
                minHeight: '42px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.9rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  <span>{t('scribe.transcriptModal.confirmingBtn', 'Membuat Catatan SOAP...')}</span>
                </>
              ) : (
                <>
                  <Check size={17} />
                  <span>{t('scribe.transcriptModal.confirmBtn', 'Buat Catatan SOAP')}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default TranscriptConfirmModal;
