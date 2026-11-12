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
    <div>
      <h1 className="page-title">{t('claimBpjs.page.title')}</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
        {t('claimBpjs.page.subtitle')}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div className="card">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>{t('claimBpjs.page.uploadTitle')}</h2>
          <form onSubmit={handleUpload}>
            <div
              style={{
                border: '2px dashed var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: '3rem 2rem',
                textAlign: 'center',
                backgroundColor: '#f8fafc',
                marginBottom: '1.5rem',
                cursor: 'pointer',
                opacity: analyzing ? 0.6 : 1
              }}
              onClick={() => !analyzing && document.getElementById('file-upload').click()}
            >
              <Upload size={32} color="var(--primary-color)" style={{ margin: '0 auto 1rem' }} />
              <p style={{ fontWeight: 500, marginBottom: '0.5rem' }}>{t('claimBpjs.page.dropzoneTitle')}</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{t('claimBpjs.page.dropzoneDesc')}</p>
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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', padding: '0.75rem 1rem', backgroundColor: '#f1f5f9', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <File size={20} color="var(--primary-color)" />
                  <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{file.name}</span>
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

            <button type="submit" className="btn-primary" disabled={!file || analyzing} style={{ width: '100%', justifyContent: 'center' }}>
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

        <div>
          {error && (
            <div className="animate-fade-in" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem', backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: 'var(--radius-md)', border: '1px solid #fecaca', marginBottom: '1.5rem' }}>
              <AlertCircle size={20} />
              <span style={{ fontWeight: 500 }}>{error}</span>
            </div>
          )}

          {result ? (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

              {/* Approved Rate Header */}
              {/* <div className="card" style={{ borderLeft: `4px solid ${result.approved_rate === 100 ? 'var(--primary-color)' : result.approved_rate >= 70 ? '#f59e0b' : '#dc2626'}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {result.approved_rate === 100 ? (
                    <CheckCircle2 size={24} color="var(--primary-color)" />
                  ) : result.approved_rate >= 70 ? (
                    <AlertCircle size={24} color="#f59e0b" />
                  ) : (
                    <XCircle size={24} color="#dc2626" />
                  )}
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: result.approved_rate === 100 ? 'var(--primary-dark)' : result.approved_rate >= 70 ? '#b45309' : '#991b1b' }}>
                    Tingkat Persetujuan: {result.approved_rate}%
                  </h3>
                </div>
              </div> */}

              {/* Complete Items */}
              {ensureArray(result.evaluation?.Complete).length > 0 && (
                <div className="card">
                  <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#047857', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle2 size={18} /> {t('claimBpjs.result.complete')}
                  </h4>
                  <ul style={{ paddingLeft: '1.5rem', color: 'var(--text-main)', fontSize: '0.875rem', lineHeight: '1.6' }}>
                    {ensureArray(result.evaluation.Complete).map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Incomplete Items */}
              {ensureArray(result.evaluation?.Incomplete).length > 0 && (
                <div className="card" style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#b91c1c', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <XCircle size={18} /> {t('claimBpjs.result.incomplete')}
                  </h4>
                  <ul style={{ paddingLeft: '1.5rem', color: '#7f1d1d', fontSize: '0.875rem', lineHeight: '1.6', marginTop: '0.5rem' }}>
                    {ensureArray(result.evaluation.Incomplete).map((item, idx) => (
                      <li key={idx} style={{ marginBottom: '0.5rem' }}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Improvement Suggestions */}
              {result.evaluation?.Suggestion && (
                <div className="card" style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#b45309', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertCircle size={18} /> {t('claimBpjs.result.suggestion')}
                  </h4>
                  <p style={{ color: '#78350f', fontSize: '0.875rem', lineHeight: '1.6', margin: 0 }}>
                    {result.evaluation.Suggestion}
                  </p>
                </div>
              )}

              {/* RAG Sources */}
              {ensureArray(result.evaluation?.Sumber_Referensi).length > 0 && (
                <div className="card" style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#166534', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle2 size={16} /> {t('claimBpjs.result.rag')}
                  </h4>
                  <ul style={{ paddingLeft: '1.5rem', color: '#14532d', fontSize: '0.75rem', lineHeight: '1.6', margin: 0 }}>
                    {ensureArray(result.evaluation.Sumber_Referensi).map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

            </div>
          ) : !error && (
            <div className="card" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', minHeight: '200px' }}>
              <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>
                {analyzing ? t('claimBpjs.result.analyzingMsg') : t('claimBpjs.result.emptyMsg')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentChecking;
