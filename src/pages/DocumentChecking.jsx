import React, { useState, useEffect } from 'react';
import { Upload, File, AlertCircle, CheckCircle2, XCircle, Loader2, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { checkDocumentClaim, getDocumentHistory, getDocumentHistoryById } from '../services/api';
import { useNotification } from '../context/NotificationContext';

const DocumentChecking = () => {
  const { t } = useTranslation();
  const { showToast, confirmAction } = useNotification();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [file, setFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    // Only kept this here in case there's legacy state, but we don't need it on this page anymore
  }, []);

  // Check URL for ID
  useEffect(() => {
    const id = searchParams.get('id');
    if (id) {
      const fetchResult = async () => {
        setAnalyzing(true);
        try {
          const data = await getDocumentHistoryById(id);
          setResult(data);
        } catch (err) {
          setError(err.message || t('claimBpjs.history.loadError'));
        } finally {
          setAnalyzing(false);
        }
      };
      fetchResult();
    } else {
      setResult(null);
    }
  }, [searchParams]);

  const ensureArray = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') return [val];
    return [];
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setAnalyzing(true);
    setError('');
    setResult(null);
    sessionStorage.removeItem('documentCheckResult');

    try {
      const response = await checkDocumentClaim(file);
      setResult(response);
      
      // Add to URL
      if (response.check_id) {
        setSearchParams({ id: response.check_id });
      }

      showToast({
        type: 'success',
        title: t('claimBpjs.toast.analyzeSuccessTitle'),
        message: t('claimBpjs.toast.analyzeSuccessMsg'),
      });
    } catch (err) {
      setError(err.message || t('claimBpjs.toast.defaultError'));
      showToast({
        type: 'error',
        title: t('claimBpjs.toast.analyzeErrorTitle'),
        message: err.message || t('claimBpjs.toast.analyzeErrorMsg'),
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleRemoveFile = () => {
    confirmAction({
      title: t('claimBpjs.deleteConfirm.title'),
      message: t('claimBpjs.deleteConfirm.message'),
      type: 'warning',
      confirmText: t('claimBpjs.deleteConfirm.confirmBtn'),
      onConfirm: () => {
        setFile(null);
        setResult(null);
        setError('');
        setSearchParams({}); // Clear URL
        showToast({
          type: 'info',
          message: t('claimBpjs.toast.deleteSuccessMsg'),
        });
      },
    });
  };

  return (
    <div className="service-sheet animate-fade-in" style={{ maxWidth: '1240px', margin: '0 auto 2.5rem' }}>
      <div className="service-sheet-head">
        <div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
            {t('claimBpjs.page.title')}
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0', fontSize: '0.86rem' }}>
            {t('claimBpjs.page.subtitle')}
          </p>
        </div>
      </div>

      <div className="service-sheet-band">
        <h2 style={{ fontSize: '1.08rem', fontWeight: 700, marginBottom: '1.15rem', color: '#0f172a' }}>
          {t('claimBpjs.page.uploadTitle')}
        </h2>
        <form onSubmit={handleUpload}>
          <div
            style={{
              border: '1.5px dashed #cbd5e1',
              borderRadius: '12px',
              padding: '2.75rem 1.75rem',
              textAlign: 'center',
              backgroundColor: '#f8fafc',
              marginBottom: '1.25rem',
              cursor: analyzing ? 'not-allowed' : 'pointer',
              opacity: analyzing ? 0.6 : 1,
              transition: 'background-color 0.15s ease'
            }}
            onClick={() => !analyzing && document.getElementById('file-upload').click()}
          >
            <Upload size={32} color="var(--primary-color)" style={{ margin: '0 auto 1rem' }} />
            <p style={{ fontWeight: 600, marginBottom: '0.45rem', color: '#0f172a' }}>{t('claimBpjs.page.dropzoneTitle')}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>{t('claimBpjs.page.dropzoneDesc')}</p>
            <input
              id="file-upload"
              type="file"
              style={{ display: 'none' }}
              onChange={(e) => {
                const selected = e.target.files && e.target.files[0];
                if (!selected) return;
                if (!selected.name.toLowerCase().endsWith('.pdf')) {
                  setError(t('claimBpjs.page.pdfError'));
                  return;
                }
                setError('');
                setFile(selected);
              }}
              accept=".pdf"
              disabled={analyzing}
            />
          </div>

          {file && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', padding: '0.75rem 1rem', backgroundColor: '#f1f5f9', borderRadius: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <File size={18} color="var(--primary-color)" />
                <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#0f172a' }}>{file.name}</span>
              </div>
              <button
                type="button"
                onClick={handleRemoveFile}
                disabled={analyzing}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  background: 'none',
                  border: 'none',
                  color: '#ef4444',
                  cursor: analyzing ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  fontSize: '0.85rem'
                }}
              >
                <Trash2 size={16} />
                <span>{t('claimBpjs.page.deleteBtn')}</span>
              </button>
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={!file || analyzing} style={{ width: '100%', justifyContent: 'center', minHeight: '44px' }}>
            {analyzing ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                {t('claimBpjs.page.analyzingBtn')}
              </>
            ) : (
              t('claimBpjs.page.startBtn')
            )}
          </button>
        </form>
      </div>

      <div className="service-sheet-band" style={{ backgroundColor: '#fcfcfd' }}>
        {error && (
          <div className="animate-fade-in" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.9rem 1rem', backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: '8px', borderLeft: '3px solid #dc2626', marginBottom: result ? '1.25rem' : 0 }}>
            <AlertCircle size={18} />
            <span style={{ fontWeight: 500, fontSize: '0.88rem' }}>{error}</span>
          </div>
        )}

        {result ? (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {ensureArray(result.evaluation?.Complete).length > 0 && (
              <div style={{ borderLeft: '3px solid #047857', paddingLeft: '1rem' }}>
                <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#047857', margin: '0 0 0.55rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle2 size={18} /> {t('claimBpjs.result.complete')}
                </h4>
                <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-main)', fontSize: '0.875rem', lineHeight: '1.6', margin: 0 }}>
                  {ensureArray(result.evaluation.Complete).map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {ensureArray(result.evaluation?.Incomplete).length > 0 && (
              <div style={{ backgroundColor: '#fef2f2', borderLeft: '3px solid #dc2626', padding: '1rem 1.15rem', borderRadius: '8px' }}>
                <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#b91c1c', margin: '0 0 0.55rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <XCircle size={18} /> {t('claimBpjs.result.incomplete')}
                </h4>
                <ul style={{ paddingLeft: '1.25rem', color: '#7f1d1d', fontSize: '0.875rem', lineHeight: '1.6', margin: 0 }}>
                  {ensureArray(result.evaluation.Incomplete).map((item, idx) => (
                    <li key={idx} style={{ marginBottom: '0.35rem' }}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.evaluation?.Suggestion && (
              <div style={{ backgroundColor: '#fffbeb', borderLeft: '3px solid #d97706', padding: '1rem 1.15rem', borderRadius: '8px' }}>
                <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#b45309', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertCircle size={18} /> {t('claimBpjs.result.suggestion')}
                </h4>
                <p style={{ color: '#78350f', fontSize: '0.875rem', lineHeight: '1.6', margin: 0 }}>
                  {result.evaluation.Suggestion}
                </p>
              </div>
            )}

            {ensureArray(result.evaluation?.Sumber_Referensi).length > 0 && (
              <div style={{ backgroundColor: '#f0fdf4', borderLeft: '3px solid #16a34a', padding: '0.9rem 1.15rem', borderRadius: '8px' }}>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#166534', margin: '0 0 0.45rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle2 size={16} /> {t('claimBpjs.result.rag')}
                </h4>
                <ul style={{ paddingLeft: '1.25rem', color: '#14532d', fontSize: '0.78rem', lineHeight: '1.6', margin: 0 }}>
                  {ensureArray(result.evaluation.Sumber_Referensi).map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : !error && (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', margin: 0, fontSize: '0.88rem' }}>
            {analyzing ? t('claimBpjs.result.analyzingMsg') : t('claimBpjs.result.emptyMsg')}
          </p>
        )}
      </div>
    </div>
  );
};

export default DocumentChecking;
