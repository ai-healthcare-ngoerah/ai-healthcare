import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Cpu, Activity, CheckCircle, RefreshCw, Search, Filter,
  Building2, Server, Download, ShieldCheck, Zap, Layers,
  Clock, ArrowUpRight, Check
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import {
  getActiveModelSettings,
  switchActiveModel,
  getModelTokenUsage
} from '../services/api';
import './ModelManagement.css';

const AI_OPTIONS = [
  {
    provider: 'azure',
    model: 'gpt-5.4',
    label: 'Azure OpenAI: gpt-5.4',
    badge: 'Azure Enterprise',
    latency: '420ms'
  },
  {
    provider: 'gemini',
    model: 'gemini-3.8-flash',
    label: 'Google Gemini: gemini-3.8-flash',
    badge: 'Google Cloud',
    latency: '350ms'
  },
  {
    provider: 'groq',
    model: 'llama-3.3-70b-versatile',
    label: 'Groq Cloud: Llama 3.3 70B',
    badge: 'Ultra-Fast LPUs',
    latency: '190ms'
  }
];

const ModelManagement = () => {
  const { t, i18n } = useTranslation();
  const { showToast } = useNotification();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Active AI Engine Switcher States
  const [selectedProvider, setSelectedProvider] = useState('azure');
  const [selectedModel, setSelectedModel] = useState('gpt-5.4');
  const [isUpdatingAI, setIsUpdatingAI] = useState(false);

  // Token Tracker States
  const [trackerData, setTrackerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [clientTypeFilter, setClientTypeFilter] = useState('all');
  const [modelFilter, setModelFilter] = useState('all');

  // Load Data
  const fetchData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [activeConfig, usage] = await Promise.all([
        getActiveModelSettings().catch(() => null),
        getModelTokenUsage({
          client_type: clientTypeFilter,
          model: modelFilter,
          search: searchTerm,
          limit: 100
        }).catch(() => null)
      ]);

      if (activeConfig) {
        if (activeConfig.active_provider) setSelectedProvider(activeConfig.active_provider);
        if (activeConfig.active_model) setSelectedModel(activeConfig.active_model);
      } else if (usage?.active_engine) {
        setSelectedProvider(usage.active_engine.provider);
        setSelectedModel(usage.active_engine.model);
      }

      if (usage) {
        setTrackerData(usage);
      }
    } catch (err) {
      showToast({
        type: 'error',
        title: t('modelManagement.toasts.loadErrorTitle', 'Gagal Memuat Data'),
        message: t('modelManagement.toasts.loadErrorMsg', 'Koneksi ke backend model management terputus.')
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [clientTypeFilter, modelFilter]);

  // Handle Switch AI Engine
  const handleSwitchEngine = async (provider, model) => {
    setIsUpdatingAI(true);
    try {
      const res = await switchActiveModel(provider, model);
      setSelectedProvider(res.active_ai_provider || res.provider || provider);
      setSelectedModel(res.active_ai_model || res.model || model);
      showToast({
        type: 'success',
        title: t('modelManagement.toasts.switchSuccessTitle', 'Mesin AI Berhasil Diperbarui'),
        message: t('modelManagement.toasts.switchSuccessMsg', {
          provider: provider.toUpperCase(),
          model,
          defaultValue: `Beralih ke ${provider.toUpperCase()}: ${model}`
        })
      });
      fetchData(true);
    } catch (err) {
      showToast({
        type: 'error',
        title: t('modelManagement.toasts.switchErrorTitle', 'Gagal Mengubah Engine'),
        message: err.message || t('modelManagement.toasts.switchErrorMsg', 'Terjadi kesalahan sistem saat memperbarui model.')
      });
    } finally {
      setIsUpdatingAI(false);
    }
  };

  // Filter logs locally if user types in search box
  const logs = trackerData?.logs || [];
  const filteredLogs = logs.filter((item) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      item.client_name?.toLowerCase().includes(q) ||
      item.ip_address?.toLowerCase().includes(q) ||
      item.model?.toLowerCase().includes(q) ||
      item.service_feature?.toLowerCase().includes(q) ||
      item.provider?.toLowerCase().includes(q)
    );
  });

  const kpi = trackerData?.kpi || {
    total_tokens: 0,
    prompt_tokens: 0,
    completion_tokens: 0,
    total_clients: 0,
    total_hospitals: 0,
    total_clinics: 0,
    dominant_model: 'gpt-5.4',
    avg_latency_ms: 0
  };

  const modelBreakdown = trackerData?.modelBreakdown || trackerData?.model_breakdown || [];
  const clientLeaderboard = trackerData?.clientLeaderboard || trackerData?.client_leaderboard || [];
  const clientSummary = trackerData?.client_summary || trackerData?.clientSummary || [];

  // Export CSV
  const handleExportCSV = () => {
    if (!filteredLogs.length) return;
    const headers = ['Waktu UTC', 'Client Faskes', 'Tipe Client', 'IP Address', 'Provider', 'Model', 'Prompt Tokens', 'Completion Tokens', 'Total Tokens', 'Latency ms', 'Status'];
    const rows = filteredLogs.map((l) => [
      l.created_at || '',
      `"${l.client_name || ''}"`,
      l.client_type || '',
      l.ip_address || '',
      l.provider || '',
      l.model || '',
      l.prompt_tokens || 0,
      l.completion_tokens || 0,
      l.total_tokens || 0,
      l.latency_ms || 0,
      l.status || ''
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `audit_token_tracker_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast({
      type: 'success',
      title: t('modelManagement.toasts.exportSuccessTitle', 'Data Diekspor'),
      message: t('modelManagement.toasts.exportSuccessMsg', 'Log audit token berhasil diunduh dalam format CSV.')
    });
  };

  // Format Helper for WITA Time
  const formatWitaTime = (isoString) => {
    if (!isoString) return '-';
    try {
      const d = new Date(isoString);
      const isEn = i18n?.language?.startsWith('en');
      return d.toLocaleTimeString(isEn ? 'en-US' : 'id-ID', {
        timeZone: 'Asia/Makassar',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }) + ' WITA';
    } catch {
      return isoString;
    }
  };

  // Role Access Guard: Strictly SuperAdmin Only
  if (user && user.role !== 'superadmin') {
    return (
      <div className="mm-denied-container">
        <ShieldCheck size={48} className="mm-denied-icon" />
        <h2>{t('modelManagement.restricted.title', 'Akses Terbatas')}</h2>
        <p>{t('modelManagement.restricted.desc', 'Fitur Model Management hanya dapat dikonfigurasi oleh SuperAdmin penyedia platform SaaS AI.')}</p>
        <button className="btn-primary" onClick={() => navigate('/options')}>
          {t('modelManagement.restricted.backBtn', 'Kembali ke Menu Utama')}
        </button>
      </div>
    );
  }

  return (
    <div className="mm-page-wrapper">
      {/* Page Header */}
      <div className="mm-header-row">
        <div className="mm-header-title-box">
          <div className="mm-header-icon-box">
            <Cpu size={24} />
          </div>
          <div>
            <h1 className="mm-page-title">{t('modelManagement.header.title', 'Model Management dan Client Token Tracker')}</h1>
            <p className="mm-page-subtitle">
              {t('modelManagement.header.subtitle', 'Pusat kendali mesin LLM utama serta pelacakan konsumsi token per client IP, Rumah Sakit, dan Klinik.')}
            </p>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-secondary mm-refresh-btn"
          onClick={() => fetchData(true)}
          disabled={loading || refreshing}
        >
          <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
          <span>{refreshing ? t('modelManagement.header.refreshing', 'Menyegarkan...') : t('modelManagement.header.refreshBtn', 'Segarkan Data')}</span>
        </button>
      </div>

      {/* SECTION 1: DYNAMIC AI ENGINE SWITCHER */}
      <div className="mm-card mm-engine-switcher-card">
        <div className="mm-card-header">
          <div className="mm-card-icon-title">
            <Cpu size={20} color="var(--primary-color)" />
            <div>
              <h3 className="mm-card-title">{t('modelManagement.engineSwitcher.title', 'Dynamic AI Engine Switcher')}</h3>
              <p className="mm-card-subtitle">{t('modelManagement.engineSwitcher.subtitle', 'Pilih mesin LLM utama faskes untuk seluruh pemrosesan otomatis.')}</p>
            </div>
          </div>
        </div>

        <div className="mm-engine-grid">
          {AI_OPTIONS.map((opt) => {
            const isActive = selectedProvider.toLowerCase() === opt.provider && selectedModel === opt.model;
            return (
              <div
                key={opt.provider}
                className={`mm-engine-box ${isActive ? 'active' : ''}`}
              >
                <div>
                  <div className="mm-engine-box-top">
                    <div className="mm-engine-badge-wrap">
                      <span className={`mm-engine-badge ${isActive ? 'badge-active' : ''}`}>
                        {opt.badge}
                      </span>
                      <span className="mm-engine-latency">
                        ⚡ {opt.latency}
                      </span>
                    </div>
                    {isActive && (
                      <span className="mm-active-indicator">
                        <CheckCircle size={14} /> {t('modelManagement.engineSwitcher.active', 'AKTIF')}
                      </span>
                    )}
                  </div>

                  <h4 className="mm-engine-name">{opt.label}</h4>
                  <div className="mm-engine-meta">
                    provider: {opt.provider} | model: {opt.model}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleSwitchEngine(opt.provider, opt.model)}
                  disabled={isUpdatingAI || isActive}
                  className={isActive ? 'btn-secondary mm-engine-btn active' : 'btn-primary mm-engine-btn'}
                >
                  {isActive ? (
                    <>
                      <Check size={14} />
                      <span>{t('modelManagement.engineSwitcher.inUse', 'Sedang Digunakan')}</span>
                    </>
                  ) : (
                    <span>{isUpdatingAI ? t('modelManagement.engineSwitcher.switching', 'Beralih Mesin...') : t('modelManagement.engineSwitcher.selectBtn', 'Pilih Engine Ini')}</span>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: KPI RINGKASAN PENGGUNAAN TOKEN */}
      <div className="mm-kpi-grid">
        <div className="mm-kpi-card">
          <span className="mm-kpi-label">{t('modelManagement.kpi.totalTokens', 'Total Token Diproses')}</span>
          <div className="mm-kpi-val text-emerald">
            {kpi.total_tokens ? kpi.total_tokens.toLocaleString('id-ID') : '0'}
          </div>
          <span className="mm-kpi-sub">
            {t('modelManagement.kpi.prompt', 'Masukan')}: {kpi.prompt_tokens?.toLocaleString('id-ID') || '0'} | {t('modelManagement.kpi.completion', 'Luaran')}: {kpi.completion_tokens?.toLocaleString('id-ID') || '0'}
          </span>
        </div>

        <div className="mm-kpi-card">
          <span className="mm-kpi-label">{t('modelManagement.kpi.registeredClients', 'Client Faskes Terdaftar')}</span>
          <div className="mm-kpi-val text-blue">
            {kpi.total_clients || '0'} {t('modelManagement.kpi.facilitiesUnit', 'Faskes')}
          </div>
          <span className="mm-kpi-sub">
            {t('modelManagement.kpi.hospitalsAndClinics', {
              hospitals: kpi.total_hospitals || 0,
              clinics: kpi.total_clinics || 0,
              defaultValue: `${kpi.total_hospitals || 0} Rumah Sakit dan ${kpi.total_clinics || 0} Klinik`
            })}
          </span>
        </div>

        <div className="mm-kpi-card">
          <span className="mm-kpi-label">{t('modelManagement.kpi.dominantModel', 'Model Paling Dominan')}</span>
          <div className="mm-kpi-val text-purple">
            {kpi.dominant_model}
          </div>
          <span className="mm-kpi-sub">
            {t('modelManagement.kpi.dominantModelSub', 'Volume Terbesar dari Seluruh Pemanggilan')}
          </span>
        </div>

        <div className="mm-kpi-card">
          <span className="mm-kpi-label">{t('modelManagement.kpi.avgLatency', 'Rata-rata Waktu Respons')}</span>
          <div className="mm-kpi-val text-amber">
            {kpi.avg_latency_ms}ms
          </div>
          <span className="mm-kpi-sub">
            {t('modelManagement.kpi.avgLatencySub', 'Waktu Tanggap Inferensi Gateway')}
          </span>
        </div>
      </div>

      {/* SECTION 2B: TABEL RINGKASAN PENGGUNAAN TOKEN PER CLIENT FASKES */}
      <div className="mm-card mm-table-card mm-summary-table-card">
        <div className="mm-table-toolbar">
          <div className="mm-toolbar-title-wrap">
            <Building2 size={18} color="var(--primary-color)" />
            <div>
              <h3 className="mm-table-title">{t('modelManagement.summaryTable.title', 'Tabel Ringkasan Konsumsi Token per Client Faskes')}</h3>
              <p className="mm-table-subtitle">{t('modelManagement.summaryTable.subtitle', 'Akumulasi kuota token per entitas Rumah Sakit dan Klinik, IP utama, serta model favorit.')}</p>
            </div>
          </div>
          <div className="mm-summary-count-badge">
            {t('modelManagement.summaryTable.recordedBadge', {
              count: clientSummary.length,
              defaultValue: `${clientSummary.length} Faskes Terdata`
            })}
          </div>
        </div>

        <div className="mm-table-responsive">
          <table className="mm-table">
            <thead>
              <tr>
                <th style={{ width: '45px' }}>{t('modelManagement.summaryTable.columns.rank', '#')}</th>
                <th>{t('modelManagement.summaryTable.columns.client', 'Client Faskes')}</th>
                <th>{t('modelManagement.summaryTable.columns.ip', 'Alamat IP Utama')}</th>
                <th>{t('modelManagement.summaryTable.columns.totalTokens', 'Total Token')}</th>
                <th>{t('modelManagement.summaryTable.columns.promptCompletion', 'Masukan / Luaran')}</th>
                <th>{t('modelManagement.summaryTable.columns.dominantModel', 'Model AI Dominan')}</th>
                <th>{t('modelManagement.summaryTable.columns.calls', 'Panggilan')}</th>
                <th>{t('modelManagement.summaryTable.columns.volumeShare', 'Pangsa Volume')}</th>
                <th>{t('modelManagement.summaryTable.columns.avgLatency', 'Rata-rata Latensi')}</th>
              </tr>
            </thead>
            <tbody>
              {clientSummary.length > 0 ? (
                clientSummary.map((cs, idx) => (
                  <tr key={cs.client_name}>
                    <td className="mm-td-rank">
                      <span className="mm-rank-circle">{idx + 1}</span>
                    </td>
                    <td>
                      <div className="mm-client-cell">
                        <span className="mm-client-name">{cs.client_name}</span>
                        <span className={`mm-client-type-badge ${cs.client_type === 'HOSPITAL' ? 'type-rs' : 'type-klinik'}`}>
                          {cs.client_type === 'HOSPITAL' ? t('modelManagement.summaryTable.types.hospital', 'Rumah Sakit') : t('modelManagement.summaryTable.types.clinic', 'Klinik Pratama')}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="mm-ip-tag">
                        <span className="mm-ip-dot" />
                        {cs.ip_address || '127.0.0.1'}
                      </span>
                    </td>
                    <td>
                      <span className="mm-tokens-bold">
                        {cs.total_tokens.toLocaleString('id-ID')}
                      </span>
                    </td>
                    <td className="mm-td-muted">
                      <span className="text-emerald">{cs.prompt_tokens.toLocaleString('id-ID')}</span>
                      <span className="mm-sep"> / </span>
                      <span className="text-blue">{cs.completion_tokens.toLocaleString('id-ID')}</span>
                    </td>
                    <td>
                      <span className="mm-model-badge">
                        {cs.top_model}
                      </span>
                    </td>
                    <td className="mm-td-calls">
                      <span className="mm-calls-val">{cs.calls}</span>
                      <span className="mm-calls-unit"> {t('modelManagement.summaryTable.columns.callsUnit', 'req')}</span>
                    </td>
                    <td>
                      <div className="mm-share-cell">
                        <div className="mm-share-bar-bg">
                          <div
                            className="mm-share-bar-fill"
                            style={{ width: `${Math.min(100, Math.max(10, cs.percentage))}%` }}
                          />
                        </div>
                        <span className="mm-share-text">{cs.percentage}%</span>
                      </div>
                    </td>
                    <td>
                      <span className="mm-latency-badge">
                        {cs.avg_latency_ms}ms OK
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="mm-empty-td">
                    {t('modelManagement.summaryTable.empty', 'Belum ada data konsumsi token per client faskes.')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 3: BENTO ANALITIK DISTRIBUSI TOKEN */}
      <div className="mm-bento-grid">
        {/* Model Breakdown */}
        <div className="mm-card mm-bento-card">
          <div className="mm-card-header-simple">
            <Layers size={18} color="#059669" />
            <h4>{t('modelManagement.bento.modelBreakdownTitle', 'Distribusi Token Berdasarkan Model AI')}</h4>
          </div>
          <div className="mm-breakdown-list">
            {modelBreakdown.length > 0 ? (
              modelBreakdown.map((mb) => (
                <div key={mb.model} className="mm-breakdown-item">
                  <div className="mm-breakdown-meta">
                    <span className="mm-breakdown-name">
                      {mb.provider.toUpperCase()}: {mb.model}
                    </span>
                    <span className="mm-breakdown-val">
                      {mb.total_tokens.toLocaleString('id-ID')} {t('modelManagement.bento.tokensUnit', 'token')} - {mb.percentage}%
                    </span>
                  </div>
                  <div className="mm-progress-bar-bg">
                    <div
                      className="mm-progress-bar-fill"
                      style={{ width: `${Math.min(100, Math.max(8, mb.percentage))}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="mm-empty-note">{t('modelManagement.bento.emptyBreakdown', 'Belum ada data distribusi model.')}</p>
            )}
          </div>
        </div>

        {/* Gateway Health & Performance Overview */}
        <div className="mm-card mm-bento-card">
          <div className="mm-card-header-simple">
            <Server size={18} color="#0284c7" />
            <h4>{t('modelManagement.bento.gatewayMetricsTitle', 'Metrik Gateway dan Kesiapan LLM')}</h4>
          </div>
          <div className="mm-gateway-metrics">
            <div className="mm-gw-metric-row">
              <span className="mm-gw-metric-label">{t('modelManagement.bento.gatewayStatusLabel', 'Status Gateway Medis')}</span>
              <span className="mm-gw-status-badge">
                <CheckCircle size={13} /> {t('modelManagement.bento.gatewayStatusOperational', '100% Operasional')}
              </span>
            </div>
            <div className="mm-gw-metric-row">
              <span className="mm-gw-metric-label">{t('modelManagement.bento.activeProviderLabel', 'Provider Aktif Saat Ini')}</span>
              <span className="mm-gw-metric-val text-emerald">
                {selectedProvider.toUpperCase()}: {selectedModel}
              </span>
            </div>
            <div className="mm-gw-metric-row">
              <span className="mm-gw-metric-label">{t('modelManagement.bento.connectedFacilitiesLabel', 'Fasilitas Terhubung')}</span>
              <span className="mm-gw-metric-val">
                {kpi.total_clients} {t('modelManagement.bento.facilitiesEntityUnit', 'Entitas Faskes')}
              </span>
            </div>
            <div className="mm-gw-metric-row">
              <span className="mm-gw-metric-label">{t('modelManagement.bento.dataCenterLabel', 'Pusat Data Gateway')}</span>
              <span className="mm-gw-metric-val">
                {t('modelManagement.bento.dataCenterValue', 'Denpasar, Bali - Waktu WITA')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: TABEL AUDIT PELACAK TOKEN CLIENT */}
      <div className="mm-card mm-table-card">
        <div className="mm-table-toolbar">
          <div className="mm-toolbar-title-wrap">
            <Activity size={18} color="var(--primary-color)" />
            <div>
              <h3 className="mm-table-title">{t('modelManagement.auditTable.title', 'Tabel Pelacak Token Client Faskes')}</h3>
              <p className="mm-table-subtitle">{t('modelManagement.auditTable.subtitle', 'Audit log rinci per alamat IP, model AI, dan kuota token yang dikonsumsi.')}</p>
            </div>
          </div>

          <div className="mm-toolbar-controls">
            {/* Search Input */}
            <div className="mm-search-wrap">
              <Search size={15} className="mm-search-icon" />
              <input
                type="text"
                placeholder={t('modelManagement.auditTable.searchPlaceholder', 'Cari faskes, alamat IP, model...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mm-search-input"
              />
            </div>

            {/* Filter Client Type */}
            <select
              className="mm-filter-select"
              value={clientTypeFilter}
              onChange={(e) => setClientTypeFilter(e.target.value)}
            >
              <option value="all">{t('modelManagement.auditTable.filterTypeAll', 'Semua Tipe Klien')}</option>
              <option value="hospital">{t('modelManagement.auditTable.filterTypeHospital', 'Rumah Sakit')}</option>
              <option value="clinic">{t('modelManagement.auditTable.filterTypeClinic', 'Klinik Pratama')}</option>
            </select>

            {/* Filter Model */}
            <select
              className="mm-filter-select"
              value={modelFilter}
              onChange={(e) => setModelFilter(e.target.value)}
            >
              <option value="all">{t('modelManagement.auditTable.filterModelAll', 'Semua Model AI')}</option>
              <option value="gpt-5.4">Azure: gpt-5.4</option>
              <option value="gemini-3.8-flash">Gemini: gemini-3.8-flash</option>
              <option value="llama-3.3-70b-versatile">Groq: llama-3.3-70b</option>
            </select>

            {/* Export CSV Button */}
            <button
              type="button"
              className="btn btn-secondary mm-export-btn"
              onClick={handleExportCSV}
              title={t('modelManagement.auditTable.exportCsvTitle', 'Unduh log dalam format CSV')}
            >
              <Download size={14} />
              <span>{t('modelManagement.auditTable.exportCsvBtn', 'Ekspor CSV')}</span>
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="mm-table-responsive">
          <table className="mm-table">
            <thead>
              <tr>
                <th>{t('modelManagement.auditTable.columns.time', 'Waktu - WITA')}</th>
                <th>{t('modelManagement.auditTable.columns.client', 'Client Faskes')}</th>
                <th>{t('modelManagement.auditTable.columns.ip', 'Alamat IP Client')}</th>
                <th>{t('modelManagement.auditTable.columns.model', 'Model AI Digunakan')}</th>
                <th className="text-right">{t('modelManagement.auditTable.columns.prompt', 'Masukan')}</th>
                <th className="text-right">{t('modelManagement.auditTable.columns.completion', 'Luaran')}</th>
                <th className="text-right">{t('modelManagement.auditTable.columns.totalTokens', 'Total Token')}</th>
                <th>{t('modelManagement.auditTable.columns.latency', 'Latency')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="mm-cell-time">
                      {formatWitaTime(log.created_at)}
                    </td>
                    <td>
                      <div className="mm-client-cell">
                        <span className="mm-client-name">{log.client_name}</span>
                        <span className={`mm-client-type-badge ${log.client_type === 'HOSPITAL' ? 'type-rs' : 'type-klinik'}`}>
                          {log.client_type === 'HOSPITAL' ? t('modelManagement.summaryTable.types.hospital', 'Rumah Sakit') : t('modelManagement.summaryTable.types.clinic', 'Klinik Pratama')}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="mm-ip-cell">
                        <span className="mm-pulse-dot" />
                        <span className="mm-ip-text">{log.ip_address}</span>
                      </div>
                    </td>
                    <td>
                      <div className="mm-model-cell">
                        <span className="mm-model-name">{log.model}</span>
                        <span className="mm-provider-name">{log.provider}</span>
                      </div>
                    </td>
                    <td className="text-right mm-cell-num">
                      {log.prompt_tokens?.toLocaleString('id-ID') || 0}
                    </td>
                    <td className="text-right mm-cell-num">
                      {log.completion_tokens?.toLocaleString('id-ID') || 0}
                    </td>
                    <td className="text-right mm-cell-total">
                      {log.total_tokens?.toLocaleString('id-ID') || 0}
                    </td>
                    <td>
                      <span className="mm-latency-badge">
                        {log.latency_ms}ms OK
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="mm-empty-td">
                    {loading ? t('modelManagement.auditTable.loadingLogs', 'Memuat log penggunaan token...') : t('modelManagement.auditTable.emptyLogs', 'Tidak ada catatan token yang sesuai kriteria pencarian.')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ModelManagement;
