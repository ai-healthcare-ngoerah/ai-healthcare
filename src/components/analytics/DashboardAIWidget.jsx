import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Bot, X, Send, RefreshCw } from 'lucide-react';
import { analyzeDashboardWithAI } from '../../services/api';
import './DashboardAIWidget.css';

const DashboardAIWidget = ({
  metrics,
  billingForecast,
  patientsForecast,
  timeframe
}) => {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState(null);

  const buildLocalFallback = (customQuestion = '') => {
    const isEn = i18n.language === 'en';
    const topDiag = metrics?.diseases?.[0];
    const topDept = metrics?.departments?.reduce(
      (max, cur) => (cur.utilizationRate > (max?.utilizationRate || 0) ? cur : max),
      metrics?.departments?.[0]
    );
    const billingM = ((metrics?.totalBillingIDR || 0) / 1000000).toFixed(1);
    const revCur = billingForecast?.current_value;
    const revFcst = billingForecast?.after_hours_forecast;
    const patCur = patientsForecast?.current_value;
    const patFcst = patientsForecast?.after_hours_forecast;

    const highlights = [];
    if (topDiag) {
      highlights.push(
        isEn
          ? `Top diagnosis: ${topDiag.name} (${topDiag.count} cases)`
          : `Diagnosis terbanyak: ${topDiag.name} (${topDiag.count} kasus)`
      );
    }
    if (topDept) {
      highlights.push(
        isEn
          ? `Highest clinic load: ${topDept.name} (${topDept.utilizationRate}%)`
          : `Beban poli tertinggi: ${topDept.name} (${topDept.utilizationRate}%)`
      );
    }
    highlights.push(
      isEn
        ? `BPJS share: ${metrics?.bpjsShare || 68}% | ER Triage: ${metrics?.urgentAlertsCount || 0}`
        : `Porsi BPJS: ${metrics?.bpjsShare || 68}% | Triase UGD: ${metrics?.urgentAlertsCount || 0}`
    );

    if (customQuestion && /antre|queue|poli|load|beban|kapasitas|clinic/i.test(customQuestion)) {
      return {
        summary: isEn
          ? `${topDept?.name || 'Primary clinic'} leads utilization at ${topDept?.utilizationRate || 0}% across ${metrics?.totalPatients || 0} patients. Shifting overflow slots will reduce waiting queues.`
          : `${topDept?.name || 'Poliklinik utama'} mencatat utilisasi tertinggi sebesar ${topDept?.utilizationRate || 0}% dari total ${metrics?.totalPatients || 0} pasien. Penambahan slot dokter jaga membantu mengurai antrean.`,
        highlights
      };
    }

    const revNote =
      revCur !== undefined && revFcst !== undefined
        ? isEn
          ? ` Revenue is projected from ${revCur.toFixed(2)}M to ${revFcst.toFixed(2)}M IDR.`
          : ` Pendapatan diproyeksikan dari ${revCur.toFixed(2)} Jt ke ${revFcst.toFixed(2)} Jt IDR.`
        : '';
    const patNote =
      patCur !== undefined && patFcst !== undefined
        ? isEn
          ? ` Visits move from ${patCur.toFixed(1)} to ${patFcst.toFixed(1)}.`
          : ` Kunjungan diprediksi dari ${patCur.toFixed(1)} ke ${patFcst.toFixed(1)}.`
        : '';

    return {
      summary: (
        isEn
          ? `Total volume is ${metrics?.totalPatients || 0} patients with estimated billing of Rp ${billingM}M.`
          : `Total volume tercatat ${metrics?.totalPatients || 0} pasien dengan estimasi tagihan Rp ${billingM} Jt.`
      ) + revNote + patNote,
      highlights
    };
  };

  const runAnalysis = async (customQuestion = '') => {
    setLoading(true);
    try {
      const payload = {
        language: i18n.language === 'en' ? 'en' : 'id',
        timeframe,
        question: customQuestion || null,
        total_patients: metrics?.totalPatients || 0,
        total_billing_idr: metrics?.totalBillingIDR || 0,
        bpjs_share: metrics?.bpjsShare || 68,
        follow_up_rate: metrics?.followUpRate || 64,
        urgent_alerts_count: metrics?.urgentAlertsCount || 0,
        revenue_current: billingForecast?.current_value ?? null,
        revenue_forecast: billingForecast?.after_hours_forecast ?? null,
        patients_current: patientsForecast?.current_value ?? null,
        patients_forecast: patientsForecast?.after_hours_forecast ?? null,
        top_diseases: (metrics?.diseases || []).slice(0, 3).map((d) => ({
          code: d.code,
          name: d.name,
          count: d.count
        })),
        departments: (metrics?.departments || []).map((d) => ({
          name: d.name,
          patientVolume: d.patientVolume,
          utilizationRate: d.utilizationRate
        }))
      };

      const res = await analyzeDashboardWithAI(payload);
      if (res && res.summary) {
        setResult(res);
      } else {
        setResult(buildLocalFallback(customQuestion));
      }
    } catch {
      setResult(buildLocalFallback(customQuestion));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && !result) {
      runAnalysis();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && result) {
      runAnalysis();
    }
  }, [i18n.language]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || loading) return;
    setQuestion('');
    runAnalysis(trimmed);
  };

  const content = (
    <>
      {isOpen && (
        <aside
          className="da-ai-drawer"
          role="dialog"
          aria-label={t('analytics.aiAnalyst.drawerTitle')}
        >
          <div className="da-ai-drawer-head">
            <div className="da-ai-drawer-title-group">
              <div className="da-ai-drawer-icon">
                <Bot size={18} />
              </div>
              <h2 className="da-ai-drawer-title">{t('analytics.aiAnalyst.drawerTitle')}</h2>
            </div>

            <div className="da-ai-drawer-actions">
              <button
                type="button"
                className="da-ai-icon-btn"
                onClick={() => runAnalysis()}
                disabled={loading}
                title={t('analytics.aiAnalyst.refreshAria')}
                aria-label={t('analytics.aiAnalyst.refreshAria')}
              >
                <RefreshCw size={15} className={loading ? 'spin' : ''} />
              </button>
              <button
                type="button"
                className="da-ai-icon-btn"
                onClick={() => setIsOpen(false)}
                title={t('analytics.aiAnalyst.closeAria')}
                aria-label={t('analytics.aiAnalyst.closeAria')}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="da-ai-drawer-body">
            {loading ? (
              <div className="da-ai-loading" role="status" aria-live="polite">
                <RefreshCw size={16} className="spin" />
                <span>{t('analytics.aiAnalyst.loading')}</span>
              </div>
            ) : result ? (
              <>
                <p className="da-ai-summary-text">{result.summary}</p>

                {result.highlights && result.highlights.length > 0 && (
                  <div className="da-ai-highlights">
                    <span className="da-ai-highlights-label">
                      {t('analytics.aiAnalyst.highlightsLabel')}
                    </span>
                    <ul className="da-ai-highlights-list">
                      {result.highlights.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : null}

            <div className="da-ai-quick-prompts">
              <button
                type="button"
                className="da-ai-prompt-chip"
                onClick={() => runAnalysis(t('analytics.aiAnalyst.quickPrompt1'))}
                disabled={loading}
              >
                {t('analytics.aiAnalyst.quickPrompt1')}
              </button>
              <button
                type="button"
                className="da-ai-prompt-chip"
                onClick={() => runAnalysis(t('analytics.aiAnalyst.quickPrompt2'))}
                disabled={loading}
              >
                {t('analytics.aiAnalyst.quickPrompt2')}
              </button>
            </div>
          </div>

          <form className="da-ai-drawer-form" onSubmit={handleSubmit}>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={t('analytics.aiAnalyst.inputPlaceholder')}
              aria-label={t('analytics.aiAnalyst.inputPlaceholder')}
              className="da-ai-input"
              disabled={loading}
            />
            <button
              type="submit"
              className="da-ai-send-btn"
              disabled={loading || !question.trim()}
              aria-label={t('analytics.aiAnalyst.sendAria')}
            >
              <Send size={15} />
            </button>
          </form>
        </aside>
      )}

      <button
        type="button"
        className="da-ai-fab"
        onClick={() => setIsOpen((prev) => !prev)}
        title={t('analytics.aiAnalyst.fabAria')}
        aria-label={t('analytics.aiAnalyst.fabAria')}
        aria-expanded={isOpen}
      >
        {isOpen ? <X size={22} aria-hidden="true" /> : <Bot size={24} aria-hidden="true" />}
      </button>
    </>
  );

  return typeof document !== 'undefined' ? createPortal(content, document.body) : content;
};

export default DashboardAIWidget;
