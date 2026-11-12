import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Loader2, FileText, ChevronRight } from 'lucide-react';
import { getDocumentHistory } from '../services/api';
import { useNotification } from '../context/NotificationContext';

const DocumentCheckingHistory = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showToast } = useNotification();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const data = await getDocumentHistory();
        setHistory(data);
      } catch (err) {
        console.error(err);
        showToast({ type: 'error', message: t('claimBpjs.history.loadError') });
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [t, showToast]);

  return (
    <div>
      <h1 className="page-title">{t('claimBpjs.history.title')}</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
        Lihat riwayat pengecekan dokumen klaim BPJS sebelumnya.
      </p>

      <div className="card">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <Loader2 className="animate-spin" size={32} color="var(--primary-color)" />
          </div>
        ) : history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <FileText size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <p>{t('claimBpjs.history.empty')}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {history.map((h) => (
              <div 
                key={h.id}
                onClick={() => navigate(`/app/pengecekan-dokumen?id=${h.id}`)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  padding: '1rem 1.5rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s',
                  backgroundColor: '#fff'
                }}
                onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--primary-color)'}
                onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ padding: '0.5rem', backgroundColor: '#f1f5f9', borderRadius: '8px' }}>
                    <FileText size={20} color="var(--primary-color)" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 0.25rem 0' }}>{h.file_name}</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>
                      {new Date(h.created_at).toLocaleDateString()} {new Date(h.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <ChevronRight size={20} color="var(--text-muted)" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentCheckingHistory;
