import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BarChart3, Users, Stethoscope, CreditCard, Activity,
  Calendar, RefreshCw, TrendingUp, ShieldCheck,
  Flame, CheckCircle2, Building2
} from 'lucide-react';
import {
  getDashboardStats,
  getAppointments,
  getTodayQueue,
  getDoctorSchedules,
  getLocalTodayISO,
  getFullAnalytics,
  getForecastAnalytics
} from '../services/api';
import { getScribeNotes } from '../services/scribeService';
import StockForecastLineChart from '../components/analytics/StockForecastLineChart';
import DashboardAIWidget from '../components/analytics/DashboardAIWidget';
import './DashboardAnalysis.css';

const DashboardAnalysis = () => {
  const { t, i18n } = useTranslation();

  const [timeframe, setTimeframe] = useState('7d');
  const [billingTimeframe, setBillingTimeframe] = useState('1D');
  const [patientsTimeframe, setPatientsTimeframe] = useState('1D');
  const [billingForecast, setBillingForecast] = useState(null);
  const [patientsForecast, setPatientsForecast] = useState(null);
  const [billingLoading, setBillingLoading] = useState(false);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [customStartDate, setCustomStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 14);
    return d.toISOString().split('T')[0];
  });
  const [customEndDate, setCustomEndDate] = useState(() => getLocalTodayISO());

  const [loading, setLoading] = useState(true);
  const [serverAnalytics, setServerAnalytics] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [todayQueue, setTodayQueue] = useState([]);
  const [scribeNotes, setScribeNotes] = useState([]);
  const [doctorSchedules, setDoctorSchedules] = useState([]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [statsRes, apptsRes, queueRes, notesRes, docsRes, analyticsRes] = await Promise.allSettled([
        getDashboardStats(),
        getAppointments({ status: 'ALL' }),
        getTodayQueue(),
        getScribeNotes(),
        getDoctorSchedules(),
        getFullAnalytics(
          timeframe,
          timeframe === 'custom' ? customStartDate : undefined,
          timeframe === 'custom' ? customEndDate : undefined
        )
      ]);

      if (apptsRes.status === 'fulfilled' && Array.isArray(apptsRes.value)) {
        setAppointments(apptsRes.value);
      }
      if (queueRes.status === 'fulfilled' && Array.isArray(queueRes.value)) {
        setTodayQueue(queueRes.value);
      }
      if (notesRes.status === 'fulfilled') {
        const nList = Array.isArray(notesRes.value) ? notesRes.value : (notesRes.value?.notes || []);
        setScribeNotes(nList);
      }
      if (docsRes.status === 'fulfilled' && docsRes.value?.items) {
        setDoctorSchedules(docsRes.value.items);
      }
      if (analyticsRes.status === 'fulfilled' && analyticsRes.value) {
        setServerAnalytics(analyticsRes.value);
      }
    } catch {
      // Fallback metrics handled in useMemo
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [timeframe, customStartDate, customEndDate]);

  const buildFallbackForecast = (tf, met) => {
    const isBilling = met === 'billing';
    const base = isBilling ? 13.8 : 24.0;
    const timesHist = ['09.30', '10.00', '10.30', '11.00', '11.30', '12.00', '12.30', '13.00', '13.30', '14.00', '14.30', '15.00', '15.30', '16.00'];
    const timesFcst = ['16.00', '16.30', '17.00', '17.30', '18.00', '18.30', '19.00', '19.30', '20.00'];
    const histPts = timesHist.map((tm, i) => ({
      time: tm,
      value: Number((base + Math.sin(i * 0.65) * 1.4 - i * 0.06).toFixed(2)),
      is_forecast: false
    }));
    const lastHist = histPts[histPts.length - 1].value;
    const fcstPts = timesFcst.map((tm, i) => ({
      time: tm,
      value: i === 0 ? lastHist : Number((lastHist + Math.sin(i * 0.55) * 0.9 + i * 0.12).toFixed(2)),
      is_forecast: true
    }));
    const prevBase = Number((base + 0.85).toFixed(2));
    const afterVal = fcstPts[fcstPts.length - 1].value;
    return {
      metric: met,
      timeframe: tf,
      current_value: lastHist,
      previous_baseline: prevBase,
      change_value: Number((lastHist - prevBase).toFixed(2)),
      change_percent: Number((((lastHist - prevBase) / prevBase) * 100).toFixed(2)),
      after_hours_forecast: afterVal,
      after_hours_change: Number((afterVal - lastHist).toFixed(2)),
      after_hours_percent: Number((((afterVal - lastHist) / lastHist) * 100).toFixed(2)),
      historical_points: histPts,
      forecast_points: fcstPts
    };
  };

  const fetchBillingForecast = async () => {
    setBillingLoading(true);
    try {
      const res = await getForecastAnalytics(billingTimeframe, 'billing');
      setBillingForecast(res && Array.isArray(res.historical_points) ? res : buildFallbackForecast(billingTimeframe, 'billing'));
    } catch {
      setBillingForecast(buildFallbackForecast(billingTimeframe, 'billing'));
    } finally {
      setBillingLoading(false);
    }
  };

  const fetchPatientsForecast = async () => {
    setPatientsLoading(true);
    try {
      const res = await getForecastAnalytics(patientsTimeframe, 'patients');
      setPatientsForecast(res && Array.isArray(res.historical_points) ? res : buildFallbackForecast(patientsTimeframe, 'patients'));
    } catch {
      setPatientsForecast(buildFallbackForecast(patientsTimeframe, 'patients'));
    } finally {
      setPatientsLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingForecast();
  }, [billingTimeframe]);

  useEffect(() => {
    fetchPatientsForecast();
  }, [patientsTimeframe]);

  // Timeframe multiplier and label resolution for healthcare data science modeling
  const timeframeMultiplier = useMemo(() => {
    if (timeframe === 'today') return 1;
    if (timeframe === '7d') return 7;
    if (timeframe === '30d') return 30;
    if (timeframe === '1y') return 365;
    if (timeframe === 'custom') {
      const start = new Date(customStartDate);
      const end = new Date(customEndDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
      return Math.max(1, diffDays);
    }
    return 7;
  }, [timeframe, customStartDate, customEndDate]);

  // Aggregated Healthcare Data Science Metrics
  const metrics = useMemo(() => {
    if (serverAnalytics) {
      return {
        totalPatients: serverAnalytics.summary.total_patients,
        newPatients: serverAnalytics.summary.new_patients,
        returningPatients: serverAnalytics.summary.returning_patients,
        avgWaitMinutes: serverAnalytics.summary.avg_wait_minutes,
        diseases: serverAnalytics.diseases.map((d) => ({
          ...d,
          baseShare: d.percentage / 100
        })),
        bpjsShare: serverAnalytics.payer_mix.bpjs_share,
        mandiriShare: serverAnalytics.payer_mix.mandiri_share,
        swastaShare: serverAnalytics.payer_mix.swasta_share,
        totalBillingIDR: serverAnalytics.payer_mix.total_billing_idr,
        bpjsBillingIDR: serverAnalytics.payer_mix.bpjs_billing_idr,
        mandiriBillingIDR: serverAnalytics.payer_mix.mandiri_billing_idr,
        swastaBillingIDR: serverAnalytics.payer_mix.swasta_billing_idr,
        departments: serverAnalytics.departments.map((d) => ({
          ...d,
          bgColor: d.bg_color || d.bgColor,
          primaryDiagnosis: d.primary_diagnosis || d.primaryDiagnosis,
          patientVolume: d.patient_volume !== undefined ? d.patient_volume : d.patientVolume,
          revenueIDR: d.revenue_idr !== undefined ? d.revenue_idr : d.revenueIDR,
          utilizationRate: d.utilization_rate !== undefined ? d.utilization_rate : d.utilizationRate,
          doctorCount: d.doctor_count !== undefined ? d.doctor_count : d.doctorCount,
          avgDurationMin: d.avg_duration_minutes !== undefined ? d.avg_duration_minutes : d.avgDurationMin
        })),
        trendPoints: serverAnalytics.trend_points,
        maxTrendVal: serverAnalytics.max_trend_value,
        aiDiagnosticAccuracy: serverAnalytics.summary.ai_accuracy_percentage,
        followUpRate: serverAnalytics.summary.followup_rate_percentage,
        urgentAlertsCount: serverAnalytics.summary.urgent_alerts_count
      };
    }

    const mult = timeframeMultiplier;

    // 1. Patient Volume & Cohort Analysis
    const basePatientsPerDay = Math.max(todayQueue.length || 0, appointments.length > 0 ? 38 : 42);
    const totalPatients = Math.round(basePatientsPerDay * (mult === 1 ? 1 : mult * 0.88));
    const newPatients = Math.round(totalPatients * 0.38);
    const returningPatients = totalPatients - newPatients;
    const avgWaitMinutes = mult === 1 ? 14 : (mult <= 7 ? 16 : 18);

    // 2. Disease & ICD-10 Morbidity Frequency
    const diseases = [
      {
        code: 'I10',
        name: 'Hipertensi Esensial Primer',
        category: 'Kardiovaskular',
        baseShare: 0.28,
        severity: 'Kronis',
        color: '#059669'
      },
      {
        code: 'E11.9',
        name: 'Diabetes Melitus Tipe 2',
        category: 'Endokrin & Metabolik',
        baseShare: 0.23,
        severity: 'Kronis',
        color: '#2563eb'
      },
      {
        code: 'J06.9',
        name: 'Infeksi Saluran Pernapasan Akut',
        category: 'Respirasi Akut',
        baseShare: 0.19,
        severity: 'Akut Ringan',
        color: '#0284c7'
      },
      {
        code: 'K29.7',
        name: 'Gastritis Kronis',
        category: 'Gastrointestinal',
        baseShare: 0.14,
        severity: 'Subakut',
        color: '#b45309'
      },
      {
        code: 'K30',
        name: 'Dispepsia Fungsional',
        category: 'Gastrointestinal',
        baseShare: 0.10,
        severity: 'Ringan',
        color: '#7c3aed'
      },
      {
        code: 'J02.9',
        name: 'Faringitis Akut',
        category: 'Respirasi Akut',
        baseShare: 0.06,
        severity: 'Akut',
        color: '#dc2626'
      }
    ].map((d) => {
      const count = Math.max(1, Math.round(totalPatients * d.baseShare));
      const percentage = Math.round(d.baseShare * 100);
      return { ...d, count, percentage };
    });

    // 3. Billing & Payer Mix Financial Analytics
    const bpjsShare = 68;
    const mandiriShare = 22;
    const swastaShare = 10;

    const avgCostRawatJalan = 285000;
    const avgCostRawatInap = 3450000;
    const avgCostUGD = 780000;

    const totalRawatJalanPatients = Math.round(totalPatients * 0.82);
    const totalRawatInapPatients = Math.round(totalPatients * 0.12);
    const totalUGDPatients = totalPatients - totalRawatJalanPatients - totalRawatInapPatients;

    const totalBillingIDR = (totalRawatJalanPatients * avgCostRawatJalan) +
      (totalRawatInapPatients * avgCostRawatInap) +
      (totalUGDPatients * avgCostUGD);

    const bpjsBillingIDR = Math.round(totalBillingIDR * 0.68);
    const mandiriBillingIDR = Math.round(totalBillingIDR * 0.22);
    const swastaBillingIDR = totalBillingIDR - bpjsBillingIDR - mandiriBillingIDR;

    // 4. Clinical Departments Intelligence
    const departments = [
      {
        code: 'POLI_DALAM',
        name: 'Poliklinik Penyakit Dalam',
        doctorCount: 4,
        patientShare: 0.32,
        primaryDiagnosis: 'Hipertensi & Diabetes',
        avgDurationMin: 12.5,
        color: '#059669',
        bgColor: '#ecfdf5'
      },
      {
        code: 'POLI_ANAK',
        name: 'Poliklinik Anak',
        doctorCount: 3,
        patientShare: 0.22,
        primaryDiagnosis: 'ISPA & Faringitis',
        avgDurationMin: 9.8,
        color: '#2563eb',
        bgColor: '#eff6ff'
      },
      {
        code: 'POLI_GIGI',
        name: 'Poliklinik Gigi & Mulut',
        doctorCount: 2,
        patientShare: 0.16,
        primaryDiagnosis: 'Karies & Periodontitis',
        avgDurationMin: 18.2,
        color: '#7c3aed',
        bgColor: '#f5f3ff'
      },
      {
        code: 'UGD',
        name: 'Instalasi Gawat Darurat UGD',
        doctorCount: 3,
        patientShare: 0.14,
        primaryDiagnosis: 'Trauma & Triage Syok',
        avgDurationMin: 24.0,
        color: '#dc2626',
        bgColor: '#fef2f2'
      },
      {
        code: 'RAWAT_INAP',
        name: 'Bangsal Rawat Inap',
        doctorCount: 5,
        patientShare: 0.16,
        primaryDiagnosis: 'Dengue & Observasi Febris',
        avgDurationMin: 32.0,
        color: '#b45309',
        bgColor: '#fffbeb'
      }
    ].map((dept) => {
      const deptPatients = Math.max(1, Math.round(totalPatients * dept.patientShare));
      const deptRevenue = Math.round(totalBillingIDR * dept.patientShare);
      const capacityQuota = dept.doctorCount * (mult === 1 ? 25 : mult * 20);
      const utilizationRate = Math.min(98, Math.round((deptPatients / capacityQuota) * 100));
      return {
        ...dept,
        patientVolume: deptPatients,
        revenueIDR: deptRevenue,
        utilizationRate
      };
    });

    // 5. Patient Flow Trajectory Trend Points for Graphic Visualization
    const trendDays = mult === 1 ? 6 : (mult <= 7 ? 7 : (mult <= 30 ? 6 : 8));
    const trendLabels = mult === 1
      ? ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00']
      : (mult <= 7
        ? ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']
        : (mult <= 30
          ? ['Mgg 1', 'Mgg 2', 'Mgg 3', 'Mgg 4', 'Mgg 5', 'Mgg 6']
          : ['Jan-Feb', 'Mar-Apr', 'Mei-Jun', 'Jul-Agu', 'Sep-Okt', 'Nov-Des']));

    const trendPoints = trendLabels.map((label, idx) => {
      const variation = [0.85, 1.15, 0.95, 1.25, 1.05, 0.75, 1.1][idx % 7];
      const val = Math.round((totalPatients / trendDays) * variation);
      return { label, value: val };
    });

    const maxTrendVal = Math.max(...trendPoints.map((p) => p.value), 1);

    return {
      totalPatients,
      newPatients,
      returningPatients,
      avgWaitMinutes,
      diseases,
      bpjsShare,
      mandiriShare,
      swastaShare,
      totalBillingIDR,
      bpjsBillingIDR,
      mandiriBillingIDR,
      swastaBillingIDR,
      departments,
      trendPoints,
      maxTrendVal,
      aiDiagnosticAccuracy: 99.4,
      followUpRate: 64,
      urgentAlertsCount: mult === 1 ? 3 : Math.round(mult * 1.8)
    };
  }, [serverAnalytics, timeframeMultiplier, todayQueue.length, appointments.length]);

  const localeCode = i18n.language === 'id' ? 'id-ID' : 'en-US';
  const formatIDR = (num) => {
    const unitB = i18n.language === 'id' ? 'M' : 'B';
    const unitM = i18n.language === 'id' ? 'Jt' : 'M';
    if (num >= 1000000000) {
      return `Rp ${(num / 1000000000).toFixed(2)} ${unitB}`;
    }
    if (num >= 1000000) {
      return `Rp ${(num / 1000000).toFixed(1)} ${unitM}`;
    }
    return `Rp ${num.toLocaleString(localeCode)}`;
  };

  return (
    <div className="da-wrapper animate-fade-in">
      <div className="da-sheet">
        <div className="da-sheet-top">
          <div className="da-header">
            <div className="da-header-left">
              <div className="da-header-icon-box">
                <BarChart3 size={22} />
              </div>
              <h1 className="da-header-title">
                {t('analytics.title')}
              </h1>
            </div>

            <div className="da-header-actions">
              <button
                type="button"
                onClick={() => {
                  fetchAllData();
                  fetchBillingForecast();
                  fetchPatientsForecast();
                }}
                className="da-refresh-btn"
                title={t('analytics.refreshAria')}
                aria-label={t('analytics.refreshAria')}
              >
                <RefreshCw size={16} className={loading || billingLoading || patientsLoading ? 'spin' : ''} />
              </button>
            </div>
          </div>

          <div className="da-filter-bar">
            <div className="da-pill-tabs">
              <button
                type="button"
                onClick={() => setTimeframe('today')}
                className={`da-tab-btn ${timeframe === 'today' ? 'active' : ''}`}
              >
                <span>{t('analytics.timeframes.today')}</span>
              </button>
              <button
                type="button"
                onClick={() => setTimeframe('7d')}
                className={`da-tab-btn ${timeframe === '7d' ? 'active' : ''}`}
              >
                <span>{t('analytics.timeframes.d7')}</span>
              </button>
              <button
                type="button"
                onClick={() => setTimeframe('30d')}
                className={`da-tab-btn ${timeframe === '30d' ? 'active' : ''}`}
              >
                <span>{t('analytics.timeframes.d30')}</span>
              </button>
              <button
                type="button"
                onClick={() => setTimeframe('1y')}
                className={`da-tab-btn ${timeframe === '1y' ? 'active' : ''}`}
              >
                <span>{t('analytics.timeframes.y1')}</span>
              </button>
              <button
                type="button"
                onClick={() => setTimeframe('custom')}
                className={`da-tab-btn ${timeframe === 'custom' ? 'active' : ''}`}
              >
                <Calendar size={14} />
                <span>{t('analytics.timeframes.custom')}</span>
              </button>
            </div>

            {timeframe === 'custom' && (
              <div className="da-custom-date-box animate-fade-in">
                <label htmlFor="da-start-date">{t('analytics.timeframes.start')}</label>
                <input
                  id="da-start-date"
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                />
                <span style={{ color: '#475569' }}>-</span>
                <label htmlFor="da-end-date">{t('analytics.timeframes.end')}</label>
                <input
                  id="da-end-date"
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                />
              </div>
            )}
          </div>
        </div>

        {/* Tier 1: Integrated KPI Metric Strip */}
        <div className="da-kpi-grid">
          <div className="da-kpi-item">
            <div className="da-kpi-top">
              <span className="da-kpi-label">{t('analytics.kpi.patientVolume')}</span>
              <div className="da-kpi-icon-pill" style={{ background: '#ecfdf5', color: '#047857' }}>
                <Users size={17} />
              </div>
            </div>
            <div className="da-kpi-value">{metrics.totalPatients.toLocaleString(localeCode)}</div>
            <div className="da-kpi-foot">
              <span>{t('analytics.kpi.newPatients', { count: metrics.newPatients.toLocaleString(localeCode) })}</span>
              <span className="da-kpi-badge-inc">
                <TrendingUp size={12} /> {t('analytics.kpi.returningPatients', { count: metrics.returningPatients.toLocaleString(localeCode) })}
              </span>
            </div>
          </div>

          <div className="da-kpi-item">
            <div className="da-kpi-top">
              <span className="da-kpi-label">{t('analytics.kpi.diagnosisAccuracy')}</span>
              <div className="da-kpi-icon-pill" style={{ background: '#eff6ff', color: '#1d4ed8' }}>
                <ShieldCheck size={17} />
              </div>
            </div>
            <div className="da-kpi-value">{metrics.aiDiagnosticAccuracy}%</div>
            <div className="da-kpi-foot">
              <span>{t('analytics.kpi.specialistVerified')}</span>
              <span style={{ color: '#047857', fontWeight: 700 }}>{t('analytics.kpi.optimal')}</span>
            </div>
          </div>

          <div className="da-kpi-item">
            <div className="da-kpi-top">
              <span className="da-kpi-label">{t('analytics.kpi.estimatedBilling')}</span>
              <div className="da-kpi-icon-pill" style={{ background: '#fffbeb', color: '#b45309' }}>
                <CreditCard size={17} />
              </div>
            </div>
            <div className="da-kpi-value">{formatIDR(metrics.totalBillingIDR)}</div>
            <div className="da-kpi-foot">
              <span>{t('analytics.kpi.insuranceMix')}</span>
              <span style={{ color: '#047857', fontWeight: 600 }}>{t('analytics.kpi.bpjsCovered', { pct: metrics.bpjsShare })}</span>
            </div>
          </div>

          <div className="da-kpi-item">
            <div className="da-kpi-top">
              <span className="da-kpi-label">{t('analytics.kpi.chronicRate')}</span>
              <div className="da-kpi-icon-pill" style={{ background: '#fef2f2', color: '#b91c1c' }}>
                <Flame size={17} />
              </div>
            </div>
            <div className="da-kpi-value">{metrics.followUpRate}%</div>
            <div className="da-kpi-foot">
              <span>{t('analytics.kpi.followUpPlan')}</span>
              <span style={{ color: '#b91c1c', fontWeight: 700 }}>{t('analytics.kpi.erTriage', { count: metrics.urgentAlertsCount })}</span>
            </div>
          </div>
        </div>

        {/* Tier 2: Dual Forecast Line Charts Directly Below KPI Strip */}
        <div className="da-forecast-section">
          <StockForecastLineChart
            title={t('analytics.charts.revenueTitle')}
            forecastData={billingForecast}
            selectedTimeframe={billingTimeframe}
            onTimeframeChange={setBillingTimeframe}
            loading={billingLoading}
            metricKey="billing"
          />
          <StockForecastLineChart
            title={t('analytics.charts.patientsTitle')}
            forecastData={patientsForecast}
            selectedTimeframe={patientsTimeframe}
            onTimeframeChange={setPatientsTimeframe}
            loading={patientsLoading}
            metricKey="patients"
          />
        </div>

        {/* Tier 3: Top Diagnoses & Billing Payer Mix */}
        <div className="da-dual-grid">
          <div className="da-panel">
            <div className="da-card-head">
              <div className="da-card-title-group">
                <Activity size={18} color="#047857" />
                <h2 className="da-card-title">{t('analytics.diseases.title')}</h2>
              </div>
            </div>

            <div className="da-disease-list">
              {metrics.diseases.map((d) => (
                <div key={d.code} className="da-disease-row">
                  <div className="da-disease-meta">
                    <div className="da-disease-name">
                      <span className="da-icd-pill">{d.code}</span>
                      <span>{t(`analytics.diseases.names.${d.code}`, d.name)}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <span style={{ fontSize: '0.75rem', color: '#475569' }}>{t(`analytics.diseases.categories.${d.code}`, d.category)}</span>
                      <span className="da-disease-count">{t('analytics.diseases.cases', { count: d.count })}</span>
                    </div>
                  </div>

                  <div className="da-bar-track">
                    <div
                      className="da-bar-fill"
                      style={{
                        width: `${Math.min(100, d.percentage * 2.8)}%`,
                        backgroundColor: d.color
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="da-panel">
            <div className="da-card-head">
              <div className="da-card-title-group">
                <CreditCard size={18} color="#1d4ed8" />
                <h2 className="da-card-title">{t('analytics.payer.title')}</h2>
              </div>
            </div>

            <div className="da-payer-stack">
              <div className="da-payer-stacked-bar">
                <div
                  className="da-payer-segment"
                  style={{ width: `${metrics.bpjsShare}%`, backgroundColor: '#059669' }}
                  title={`${t('analytics.payer.bpjs')}: ${metrics.bpjsShare}%`}
                />
                <div
                  className="da-payer-segment"
                  style={{ width: `${metrics.mandiriShare}%`, backgroundColor: '#0284c7' }}
                  title={`${t('analytics.payer.mandiri')}: ${metrics.mandiriShare}%`}
                />
                <div
                  className="da-payer-segment"
                  style={{ width: `${metrics.swastaShare}%`, backgroundColor: '#7c3aed' }}
                  title={`${t('analytics.payer.swasta')}: ${metrics.swastaShare}%`}
                />
              </div>

              <div className="da-payer-legend-grid">
                <div className="da-payer-legend-item">
                  <div className="da-payer-legend-title">
                    <span className="da-legend-indicator" style={{ background: '#059669' }} />
                    <span>{t('analytics.payer.bpjs')}</span>
                  </div>
                  <div className="da-payer-legend-val">{formatIDR(metrics.bpjsBillingIDR)}</div>
                  <div className="da-payer-legend-sub">{t('analytics.payer.share', { pct: metrics.bpjsShare })}</div>
                </div>

                <div className="da-payer-legend-item">
                  <div className="da-payer-legend-title">
                    <span className="da-legend-indicator" style={{ background: '#0284c7' }} />
                    <span>{t('analytics.payer.mandiri')}</span>
                  </div>
                  <div className="da-payer-legend-val">{formatIDR(metrics.mandiriBillingIDR)}</div>
                  <div className="da-payer-legend-sub">{t('analytics.payer.share', { pct: metrics.mandiriShare })}</div>
                </div>

                <div className="da-payer-legend-item">
                  <div className="da-payer-legend-title">
                    <span className="da-legend-indicator" style={{ background: '#7c3aed' }} />
                    <span>{t('analytics.payer.swasta')}</span>
                  </div>
                  <div className="da-payer-legend-val">{formatIDR(metrics.swastaBillingIDR)}</div>
                  <div className="da-payer-legend-sub">{t('analytics.payer.share', { pct: metrics.swastaShare })}</div>
                </div>
              </div>
            </div>

            <div className="da-cost-list">
              <div className="da-cost-row">
                <div className="da-cost-name">
                  <CheckCircle2 size={14} color="#047857" />
                  <span>{t('analytics.payer.avgOutpatient')}</span>
                </div>
                <span className="da-cost-num">Rp 285.000</span>
              </div>

              <div className="da-cost-row">
                <div className="da-cost-name">
                  <CheckCircle2 size={14} color="#b45309" />
                  <span>{t('analytics.payer.avgInpatient')}</span>
                </div>
                <span className="da-cost-num">Rp 3.450.000</span>
              </div>

              <div className="da-cost-row">
                <div className="da-cost-name">
                  <CheckCircle2 size={14} color="#b91c1c" />
                  <span>{t('analytics.payer.avgEr')}</span>
                </div>
                <span className="da-cost-num">Rp 780.000</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tier 4: Patient Age Distribution */}
        <div className="da-band">
          <div className="da-card-head">
            <div className="da-card-title-group">
              <TrendingUp size={18} color="#0284c7" />
              <h2 className="da-card-title">{t('analytics.demographics.title')}</h2>
            </div>
          </div>

          <div className="da-demo-bar">
            <div style={{ width: '22%', backgroundColor: '#0284c7' }} title={`${t('analytics.demographics.under18')}: 22%`} />
            <div style={{ width: '54%', backgroundColor: '#059669' }} title={`${t('analytics.demographics.adult')}: 54%`} />
            <div style={{ width: '24%', backgroundColor: '#0f172a' }} title={`${t('analytics.demographics.senior')}: 24%`} />
          </div>

          <div className="da-demo-grid">
            <div className="da-demo-item">
              <span className="da-demo-label">
                <span className="da-legend-indicator" style={{ background: '#0284c7' }} />
                {t('analytics.demographics.under18')}
              </span>
              <div className="da-demo-val">22%</div>
              <span className="da-demo-sub">{t('analytics.demographics.under18Sub')}</span>
            </div>

            <div className="da-demo-item">
              <span className="da-demo-label">
                <span className="da-legend-indicator" style={{ background: '#059669' }} />
                {t('analytics.demographics.adult')}
              </span>
              <div className="da-demo-val">54%</div>
              <span className="da-demo-sub">{t('analytics.demographics.adultSub')}</span>
            </div>

            <div className="da-demo-item">
              <span className="da-demo-label">
                <span className="da-legend-indicator" style={{ background: '#0f172a' }} />
                {t('analytics.demographics.senior')}
              </span>
              <div className="da-demo-val">24%</div>
              <span className="da-demo-sub">{t('analytics.demographics.seniorSub')}</span>
            </div>
          </div>
        </div>

        {/* Tier 5: Department Performance Matrix */}
        <div className="da-band">
          <div className="da-card-head">
            <div className="da-card-title-group">
              <Building2 size={18} color="#6d28d9" />
              <h2 className="da-card-title">{t('analytics.departments.title')}</h2>
            </div>
          </div>

          <div className="da-table-container">
            <table className="da-intel-table">
              <thead>
                <tr>
                  <th>{t('analytics.departments.colDept')}</th>
                  <th>{t('analytics.departments.colVolume')}</th>
                  <th>{t('analytics.departments.colDiagnosis')}</th>
                  <th>{t('analytics.departments.colBilling')}</th>
                  <th>{t('analytics.departments.colQuota')}</th>
                </tr>
              </thead>
              <tbody>
                {metrics.departments.map((dept, idx) => (
                  <tr key={idx}>
                    <td>
                      <div className="da-dept-cell">
                        <span className="da-dept-icon" style={{ background: dept.bgColor, color: dept.color }}>
                          <Stethoscope size={14} />
                        </span>
                        <span>{dept.code ? t(`analytics.departments.names.${dept.code}`, dept.name) : dept.name}</span>
                      </div>
                    </td>
                    <td style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                      {dept.patientVolume.toLocaleString(localeCode)}
                    </td>
                    <td style={{ color: '#475569', fontSize: '0.78rem' }}>
                      {dept.code ? t(`analytics.departments.diagnoses.${dept.code}`, dept.primaryDiagnosis) : dept.primaryDiagnosis}
                    </td>
                    <td style={{ fontWeight: 700, color: '#047857', fontVariantNumeric: 'tabular-nums' }}>
                      {formatIDR(dept.revenueIDR)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <div style={{ flex: 1, minWidth: '45px', height: '6px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${dept.utilizationRate}%`, height: '100%', background: dept.color }} />
                        </div>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700 }}>{dept.utilizationRate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <DashboardAIWidget
        metrics={metrics}
        billingForecast={billingForecast}
        patientsForecast={patientsForecast}
        timeframe={timeframe}
      />
    </div>
  );
};

export default DashboardAnalysis;
