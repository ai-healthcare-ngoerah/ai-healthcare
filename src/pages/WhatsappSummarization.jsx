import React, { useState, useEffect } from 'react';
import { 
  Sparkles, RefreshCw, Calendar, MessageSquare, ArrowUpRight, ArrowDownLeft,
  CheckCircle2, Clock, AlertTriangle, ListChecks, Copy, Check, Search, ShieldCheck,
  ChevronRight, Activity, Users, Send, ExternalLink, Bot, ChevronDown
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { getWhatsappAiSummary } from '../services/api';
import { useNotification } from '../context/NotificationContext';

const WhatsappSummarization = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { showToast } = useNotification();

  const [timeframe, setTimeframe] = useState('week'); // 'day', 'week', 'month', 'year'
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [searchLog, setSearchLog] = useState('');

  const fetchSummary = async (selectedTimeframe = timeframe) => {
    setLoading(true);
    try {
      const res = await getWhatsappAiSummary(selectedTimeframe);
      setData(res);
    } catch (err) {
      console.error(err);
      showToast({ 
        type: 'error', 
        title: 'Gagal Memuat Ringkasan AI', 
        message: err.message || 'Terjadi kesalahan saat menghubungi mesin AI.' 
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary(timeframe);
  }, [timeframe]);

  const handleCopySummary = () => {
    if (!data?.summary?.executive_overview) return;
    const textToCopy = `📋 RINGKASAN AI WHATSAPP RS (${data.start_date} s.d. ${data.end_date})
Periode: ${timeframe.toUpperCase()}
Total Pesan: ${data.metrics?.total_messages || 0}
Tingkat Konfirmasi: ${data.metrics?.confirmation_rate_percent || 0}%

RINGKASAN EKSEKUTIF:
${data.summary.executive_overview}

TREN UTAMA:
${(data.summary.key_trends || []).map(t => `- ${t}`).join('\n')}

REKOMENDASI STAF:
${(data.summary.staff_action_items || []).map(a => `- ${a}`).join('\n')}
`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    showToast({ type: 'success', title: 'Berhasil Disalin', message: 'Ringkasan eksekutif telah disalin ke clipboard.' });
    setTimeout(() => setCopied(false), 3000);
  };

  const metrics = data?.metrics || {};
  const summary = data?.summary || {};
  const rawLogs = data?.raw_logs || [];

  const filteredLogs = rawLogs.filter(log => {
    if (!searchLog) return true;
    const q = searchLog.toLowerCase();
    return (
      (log.phone || '').toLowerCase().includes(q) ||
      (log.message_text || '').toLowerCase().includes(q) ||
      (log.stage_or_intent || '').toLowerCase().includes(q)
    );
  });

  const isIndo = i18n.language === 'id';

  return (
    <div style={{ maxWidth: '1360px', margin: '0 auto', paddingBottom: '3rem' }}>
      
      {/* Top Header & Breadcrumbs */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
          <span>{isIndo ? 'Layanan Pasien & AI' : 'Patient Engagement & AI'}</span>
          <ChevronRight size={14} />
          <span>{isIndo ? 'WhatsApp Intelligence' : 'WhatsApp Intelligence'}</span>
          <ChevronRight size={14} />
          <span style={{ color: 'var(--primary-color)', fontWeight: 600 }}>
            {isIndo ? 'Ringkasan AI & Analitik' : 'AI Summary & Analytics'}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="page-title" style={{ margin: 0, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ 
                background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.12), rgba(16, 185, 129, 0.12))', 
                borderRadius: '8px', 
                padding: '6px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <Sparkles size={24} color="var(--primary-color)" />
              </div>
              <span>{isIndo ? 'Ringkasan Interaksi AI & Reservasi' : 'AI Chatbot & Reservation Summarizer'}</span>
            </h1>
            <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              {isIndo 
                ? 'Analisis kecerdasan buatan dari data obrolan langsung pasien, pola konfirmasi kontrol, dan rekomendasi operasional RS lintas kanal.' 
                : 'AI-driven synthesis of patient omnichannel interactions, appointment confirmations, and clinical follow-up recommendations.'}
            </p>
          </div>

          {/* [COMMENTED OUT PER REQUEST] Header Action Buttons (Gateway, Copy, Refresh)
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={() => navigate('/app/ai-agent/chatbot-reservasi')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.5rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                backgroundColor: '#ffffff',
                color: 'var(--text-main)',
                fontSize: '0.82rem',
                cursor: 'pointer',
                fontWeight: 500,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
            >
              <Bot size={16} color="var(--text-muted)" />
              <span>{isIndo ? 'Gateway Chatbot & Reservasi' : 'Chatbot & Reservation Gateway'}</span>
            </button>

            <button
              onClick={handleCopySummary}
              disabled={loading || !summary.executive_overview}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.5rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                backgroundColor: '#ffffff',
                color: 'var(--text-main)',
                fontSize: '0.82rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: 500
              }}
            >
              {copied ? <Check size={16} color="#10b981" /> : <Copy size={16} color="var(--text-muted)" />}
              <span>{copied ? (isIndo ? 'Tersalin!' : 'Copied!') : (isIndo ? 'Salin Ringkasan' : 'Copy Summary')}</span>
            </button>

            <button
              onClick={() => fetchSummary(timeframe)}
              disabled={loading}
              className="btn btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.5rem 0.95rem',
                fontSize: '0.82rem',
                fontWeight: 600,
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              <span>{loading ? (isIndo ? 'Menganalisis...' : 'Analyzing...') : (isIndo ? 'Perbarui Analisis' : 'Refresh AI Analysis')}</span>
            </button>
          </div>
          */}
        </div>
      </div>

      {/* Temporal Filter Bar (Day, Week, Month, Year) */}
      <div style={{
        background: '#ffffff',
        border: '1px solid var(--border-color)',
        borderRadius: '10px',
        padding: '0.75rem 1rem',
        marginBottom: '1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        boxShadow: 'var(--shadow-sm)'
      }}>
        {/* Timeframe Dropdown Option */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <label 
            htmlFor="timeframe-select" 
            style={{ 
              fontSize: '0.825rem', 
              fontWeight: 600, 
              color: 'var(--text-muted)', 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.35rem' 
            }}
          >
            <Clock size={15} color="var(--primary-color)" />
            <span>{isIndo ? 'Rentang Waktu:' : 'Timeframe:'}</span>
          </label>
          <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
            <select
              id="timeframe-select"
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              disabled={loading}
              style={{
                padding: '0.45rem 2.2rem 0.45rem 0.85rem',
                fontSize: '0.825rem',
                fontWeight: 600,
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                backgroundColor: '#ffffff',
                color: 'var(--text-main)',
                cursor: loading ? 'not-allowed' : 'pointer',
                outline: 'none',
                appearance: 'none',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                transition: 'all 0.15s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
            >
              <option value="day">{isIndo ? 'Hari Ini (24 Jam Terakhir)' : 'Today (Last 24 Hours)'}</option>
              <option value="week">{isIndo ? 'Minggu Ini (7 Hari Terakhir)' : 'This Week (Last 7 Days)'}</option>
              <option value="month">{isIndo ? 'Bulan Ini (30 Hari Terakhir)' : 'This Month (Last 30 Days)'}</option>
              <option value="year">{isIndo ? 'Tahun Ini (365 Hari Terakhir)' : 'This Year (Last 365 Days)'}</option>
            </select>
            <ChevronDown 
              size={14} 
              color="var(--text-muted)" 
              style={{ position: 'absolute', right: '0.75rem', pointerEvents: 'none' }} 
            />
          </div>
        </div>

        {/* Info Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: '#f1f5f9', padding: '0.3rem 0.6rem', borderRadius: '6px' }}>
            <Calendar size={14} color="var(--primary-color)" />
            <span>{data?.start_date || '...'} s.d. {data?.end_date || '...'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: '#ecfdf5', color: '#065f46', padding: '0.3rem 0.6rem', borderRadius: '6px', fontWeight: 600 }}>
            <ShieldCheck size={14} color="#10b981" />
            <span>AI Model: {data?.active_model || 'gemini-3.8-flash'}</span>
          </div>
        </div>
      </div>

      {/* KPI Metric Strip */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '0.85rem',
        marginBottom: '1.25rem'
      }}>
        <div style={{ background: '#ffffff', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '1rem', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              {isIndo ? 'Total Pesan' : 'Total Messages'}
            </span>
            <MessageSquare size={18} color="var(--primary-color)" />
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.2 }}>
            {metrics.total_messages || 0}
          </div>
          <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.45rem', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
            <span style={{ color: '#0284c7', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              <ArrowDownLeft size={13} /> {metrics.inbound_count || 0} {isIndo ? 'Masuk' : 'Inbound'}
            </span>
            <span>•</span>
            <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              <ArrowUpRight size={13} /> {metrics.outbound_count || 0} {isIndo ? 'Keluar' : 'Outbound'}
            </span>
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '1rem', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              {isIndo ? 'Tingkat Konfirmasi' : 'Confirmation Rate'}
            </span>
            <CheckCircle2 size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 700, color: '#047857', lineHeight: 1.2 }}>
            {metrics.confirmation_rate_percent || 0}%
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '0.45rem' }}>
            {metrics.confirmed_count || 0} {isIndo ? 'pasien siap hadir tepat waktu' : 'patients confirmed attendance'}
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '1rem', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              {isIndo ? 'Minta Reschedule' : 'Reschedule Requests'}
            </span>
            <Clock size={18} color="#d97706" />
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 700, color: '#b45309', lineHeight: 1.2 }}>
            {metrics.rescheduled_count || 0}
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '0.45rem' }}>
            {isIndo ? 'Memerlukan alokasi slot dokter baru' : 'Needs slot reallocation'}
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '1rem', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              {isIndo ? 'Pembatalan (Cancel)' : 'Cancellations'}
            </span>
            <AlertTriangle size={18} color="#ef4444" />
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 700, color: '#b91c1c', lineHeight: 1.2 }}>
            {metrics.cancelled_count || 0}
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '0.45rem' }}>
            {isIndo ? 'Slot kembali tersedia untuk pasien lain' : 'Slots freed for waitlisted patients'}
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '1rem', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              {isIndo ? 'Pasien Terlibat' : 'Engaged Patients'}
            </span>
            <Users size={18} color="#6366f1" />
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 700, color: '#4338ca', lineHeight: 1.2 }}>
            {metrics.unique_patients || 0}
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '0.45rem' }}>
            {isIndo ? 'Nomor WhatsApp unik terdata' : 'Unique WhatsApp numbers logged'}
          </div>
        </div>
      </div>

      {/* Main Asymmetric Bento Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1.2fr)',
        gap: '1.25rem',
        alignItems: 'start'
      }}>
        {/* Left Column (Wide): AI Synthesis & Scraped Logs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Hero Bento Card: AI Executive Overview */}
          <div style={{
            background: 'linear-gradient(180deg, #ffffff 0%, #fafafa 100%)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '1.35rem',
            boxShadow: 'var(--shadow-sm)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Subtle top accent bar */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, var(--primary-color), #10b981)' }} />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ background: 'rgba(14, 165, 233, 0.1)', padding: '5px', borderRadius: '6px' }}>
                  <Sparkles size={18} color="var(--primary-color)" />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  {isIndo ? 'Sintesis Eksekutif Kecerdasan AI' : 'Executive AI Synthesis'}
                </h3>
              </div>
              <span style={{ fontSize: '0.75rem', background: '#f1f5f9', padding: '0.25rem 0.5rem', borderRadius: '4px', color: 'var(--text-muted)' }}>
                {isIndo ? 'Otomatis diperbarui' : 'Auto-generated'}
              </span>
            </div>

            {loading ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 0.75rem auto', color: 'var(--primary-color)' }} />
                <p style={{ margin: 0, fontSize: '0.85rem' }}>
                  {isIndo ? 'AI sedang mengekstrak dan menganalisis percakapan WhatsApp...' : 'AI is extracting and analyzing conversation logs...'}
                </p>
              </div>
            ) : (
              <>
                <p style={{ 
                  margin: '0 0 1rem 0', 
                  fontSize: '0.92rem', 
                  lineHeight: 1.6, 
                  color: '#1e293b', 
                  background: 'rgba(248, 250, 252, 0.8)', 
                  padding: '0.85rem 1rem', 
                  borderRadius: '8px',
                  borderLeft: '3px solid var(--primary-color)'
                }}>
                  {summary.executive_overview || (isIndo ? 'Belum ada ringkasan yang tersedia.' : 'No summary available.')}
                </p>

                {/* Key Trends */}
                <div>
                  <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
                    {isIndo ? 'Pola & Tren Utama' : 'Key Patterns & Trends'}
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                    {(summary.key_trends && summary.key_trends.length > 0) ? (
                      summary.key_trends.map((trend, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-main)' }}>
                          <span style={{ color: 'var(--primary-color)', fontWeight: 700, marginTop: '-1px' }}>•</span>
                          <span style={{ lineHeight: 1.45 }}>{trend}</span>
                        </div>
                      ))
                    ) : (
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        {isIndo ? 'Belum ada pola tren spesifik yang terdeteksi.' : 'No specific patterns detected.'}
                      </span>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Scraped Conversation Audit Trail Explorer */}
          <div style={{
            background: '#ffffff',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '1.25rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Activity size={18} color="var(--primary-color)" />
                  <span>{isIndo ? 'Jejak Audit Log Percakapan Pasien' : 'Patient Conversation Audit Trail'}</span>
                </h3>
                <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                  {isIndo ? `Menampilkan ${filteredLogs.length} data chat yang dianalisis oleh AI` : `Showing ${filteredLogs.length} chats analyzed by AI`}
                </span>
              </div>

              {/* Search Log Filter */}
              <div style={{ position: 'relative', minWidth: '220px' }}>
                <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder={isIndo ? 'Cari nomor / pesan...' : 'Search phone / text...'}
                  value={searchLog}
                  onChange={(e) => setSearchLog(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.4rem 0.6rem 0.4rem 2rem',
                    fontSize: '0.8rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Log Table / List */}
            <div style={{ maxHeight: '340px', overflowY: 'auto', border: '1px solid #f1f5f9', borderRadius: '8px' }}>
              {filteredLogs.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  {isIndo ? 'Tidak ada data percakapan yang cocok dengan filter pencarian.' : 'No conversations match the search query.'}
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                  <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 1 }}>
                    <tr>
                      <th style={{ padding: '0.5rem 0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>{isIndo ? 'Arah' : 'Direction'}</th>
                      <th style={{ padding: '0.5rem 0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>{isIndo ? 'Nomor Pasien' : 'Patient Phone'}</th>
                      <th style={{ padding: '0.5rem 0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>{isIndo ? 'Intent / Tahap' : 'Intent / Stage'}</th>
                      <th style={{ padding: '0.5rem 0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>{isIndo ? 'Isi Pesan WhatsApp' : 'Message Text'}</th>
                      <th style={{ padding: '0.5rem 0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>{isIndo ? 'Waktu' : 'Time'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((log, idx) => {
                      const isInbound = (log.direction || '').toUpperCase() === 'INBOUND';
                      return (
                        <tr key={log.log_id || idx} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                          <td style={{ padding: '0.5rem 0.75rem', whiteSpace: 'nowrap' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              padding: '0.2rem 0.45rem',
                              borderRadius: '4px',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              background: isInbound ? '#e0f2fe' : '#ecfdf5',
                              color: isInbound ? '#0369a1' : '#047857'
                            }}>
                              {isInbound ? <ArrowDownLeft size={11} /> : <ArrowUpRight size={11} />}
                              {isInbound ? (isIndo ? 'PASIEN' : 'INBOUND') : (isIndo ? 'BOT RS' : 'OUTBOUND')}
                            </span>
                          </td>
                          <td style={{ padding: '0.5rem 0.75rem', fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
                            {log.phone ? `${log.phone.slice(0, 5)}***${log.phone.slice(-3)}` : '-'}
                          </td>
                          <td style={{ padding: '0.5rem 0.75rem', whiteSpace: 'nowrap' }}>
                            <span style={{ background: '#f1f5f9', padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.72rem', color: '#475569' }}>
                              {log.stage_or_intent || '-'}
                            </span>
                          </td>
                          <td style={{ padding: '0.5rem 0.75rem', color: 'var(--text-main)', maxWidth: '300px' }}>
                            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.message_text}>
                              {log.message_text || '-'}
                            </div>
                          </td>
                          <td style={{ padding: '0.5rem 0.75rem', color: 'var(--text-muted)', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                            {log.timestamp ? new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Inquiries, Sentiments, Escalations, Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Card: Frequent Inquiries */}
          <div style={{
            background: '#ffffff',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '1.25rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Users size={17} color="#0284c7" />
              <span>{isIndo ? 'Topik Keluhan & Pertanyaan Terbanyak' : 'Frequent Inquiries & Symptoms'}</span>
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {(summary.frequent_patient_inquiries && summary.frequent_patient_inquiries.length > 0) ? (
                summary.frequent_patient_inquiries.map((inq, idx) => (
                  <div key={idx} style={{ 
                    background: '#f8fafc', 
                    padding: '0.55rem 0.75rem', 
                    borderRadius: '6px', 
                    borderLeft: '3px solid #0284c7', 
                    fontSize: '0.83rem',
                    color: 'var(--text-main)'
                  }}>
                    {inq}
                  </div>
                ))
              ) : (
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  {isIndo ? 'Belum ada keluhan khusus yang tercatat.' : 'No specific inquiries recorded.'}
                </span>
              )}
            </div>
          </div>

          {/* Card: Sentiment & Responsiveness */}
          <div style={{
            background: '#ffffff',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '1.25rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Activity size={17} color="#10b981" />
              <span>{isIndo ? 'Sentimen & Respon Pasien' : 'Sentiment & Responsiveness'}</span>
            </h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#334155', lineHeight: 1.5 }}>
              {summary.sentiment_and_responsiveness || (isIndo ? 'Data sentimen belum tersedia.' : 'No sentiment data.')}
            </p>
          </div>

          {/* Card: Urgent Escalations */}
          <div style={{
            background: (summary.urgent_escalations && summary.urgent_escalations.length > 0) ? '#fff1f2' : '#ffffff',
            border: (summary.urgent_escalations && summary.urgent_escalations.length > 0) ? '1px solid #fecdd3' : '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '1.25rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <h3 style={{ 
              margin: '0 0 0.6rem 0', 
              fontSize: '0.95rem', 
              fontWeight: 600, 
              color: (summary.urgent_escalations && summary.urgent_escalations.length > 0) ? '#be123c' : 'var(--text-main)', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.45rem' 
            }}>
              <AlertTriangle size={17} color={(summary.urgent_escalations && summary.urgent_escalations.length > 0) ? '#e11d48' : '#64748b'} />
              <span>{isIndo ? 'Peringatan Kasus Mendesak' : 'Urgent Escalations'}</span>
            </h3>

            {(summary.urgent_escalations && summary.urgent_escalations.length > 0) ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                {summary.urgent_escalations.map((esc, idx) => (
                  <div key={idx} style={{ 
                    background: '#ffffff', 
                    border: '1px solid #fda4af', 
                    padding: '0.5rem 0.75rem', 
                    borderRadius: '6px', 
                    fontSize: '0.82rem', 
                    color: '#9f1239',
                    fontWeight: 500
                  }}>
                    {esc}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <CheckCircle2 size={15} color="#16a34a" />
                <span>{isIndo ? 'Tidak ada kasus kritis yang memerlukan eskalasi darurat.' : 'No urgent red-flag cases identified.'}</span>
              </p>
            )}
          </div>

          {/* Card: Action Items for Staff */}
          <div style={{
            background: '#ffffff',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '1.25rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <h3 style={{ margin: '0 0 0.65rem 0', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <ListChecks size={17} color="var(--primary-color)" />
              <span>{isIndo ? 'Daftar Tugas Tindak Lanjut Staf' : 'Staff Action Checklist'}</span>
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {(summary.staff_action_items && summary.staff_action_items.length > 0) ? (
                summary.staff_action_items.map((item, idx) => (
                  <label key={idx} style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    gap: '0.5rem', 
                    fontSize: '0.83rem', 
                    color: '#1e293b',
                    cursor: 'pointer',
                    padding: '0.35rem 0'
                  }}>
                    <input type="checkbox" style={{ marginTop: '0.2rem', accentColor: 'var(--primary-color)' }} />
                    <span style={{ lineHeight: 1.4 }}>{item}</span>
                  </label>
                ))
              ) : (
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  {isIndo ? 'Belum ada tindakan staf yang diperlukan.' : 'No pending action items.'}
                </span>
              )}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};

export default WhatsappSummarization;
