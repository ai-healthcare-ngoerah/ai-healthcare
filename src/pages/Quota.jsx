import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gauge, AlertCircle, ShieldCheck } from 'lucide-react';
import { getQuota } from '../services/api';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

const Quota = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quota, setQuota] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getQuota();
        setQuota(data);
      } catch (err) {
        setError(err.message || t('settings.errorLoad'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const pct = quota
    ? Math.min(Math.round((quota.used_count / Math.max(quota.monthly_limit, 1)) * 100), 100)
    : 0;

  if (user && user.role !== 'superadmin') {
    return (
      <div style={{ maxWidth: '600px', margin: '3rem auto', textAlign: 'center', padding: '2.5rem', background: '#ffffff', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
          <ShieldCheck size={32} color="#dc2626" />
        </div>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-main)' }}>
          Akses Dibatasi Khusus SuperAdmin
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
          Konfigurasi kuota dan batas server hanya dapat dikelola oleh SuperAdmin penyedia platform AI.
        </p>
        <button className="btn-primary" onClick={() => navigate('/options')}>
          Kembali ke Menu Utama
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="page-title">{t('settings.title')}</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
        {t('settings.subtitle')}
      </p>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem', backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: 'var(--radius-md)', border: '1px solid #fecaca', marginBottom: '1.5rem' }}>
          <AlertCircle size={20} />
          <span style={{ fontWeight: 500 }}>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="card" style={{ color: 'var(--text-muted)' }}>{t('settings.loading')}</div>
      ) : quota ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '1rem', backgroundColor: '#ecfdf5', borderRadius: '50%', color: 'var(--primary-color)' }}>
              <Gauge size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{quota.used_count.toLocaleString('id-ID')}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{t('settings.used')}</p>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '1rem', backgroundColor: '#ecfdf5', borderRadius: '50%', color: 'var(--primary-color)' }}>
              <Gauge size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{quota.remaining.toLocaleString('id-ID')}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{t('settings.remaining')}</p>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '1rem', backgroundColor: '#f1f5f9', borderRadius: '50%', color: 'var(--text-muted)' }}>
              <Gauge size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{quota.monthly_limit.toLocaleString('id-ID')}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{t('settings.monthlyLimit')}</p>
            </div>
          </div>
        </div>
      ) : null}

      {quota && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontWeight: 600 }}>{t('settings.periodUsage')} ({quota.period_start})</span>
            <span style={{ color: 'var(--text-muted)' }}>{pct}%</span>
          </div>
          <div style={{ height: '12px', backgroundColor: '#f1f5f9', borderRadius: '9999px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${pct}%`,
                height: '100%',
                backgroundColor: pct >= 90 ? '#dc2626' : pct >= 70 ? '#f59e0b' : 'var(--primary-color)',
                transition: 'width 0.4s ease',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Quota;
