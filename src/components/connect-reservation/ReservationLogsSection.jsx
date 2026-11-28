import { useTranslation } from 'react-i18next';
import { RefreshCw, Search, MessageSquare, Filter } from 'lucide-react';

const ReservationLogsSection = ({
  loadingLogs,
  filteredLogs,
  logChannelFilter,
  setLogChannelFilter,
  logVerdictFilter = 'all',
  setLogVerdictFilter,
  searchLogText,
  setSearchLogText,
  fetchMessageLogs,
}) => {
  const { t } = useTranslation();
  const renderVerdictBadge = (verdict) => {
    const v = (verdict || 'REPLIED_BY_AI').toUpperCase();
    if (v === 'REPLIED_BY_AI') {
      return <span className="cr-verdict-badge verdict-ai">🟢 Dijawab AI</span>;
    }
    if (v === 'REPLIED_FALLBACK') {
      return <span className="cr-verdict-badge verdict-fallback">🔵 Respon Panduan</span>;
    }
    if (v === 'ESCALATED_HUMAN') {
      return <span className="cr-verdict-badge verdict-human">🟡 Alih Staf</span>;
    }
    if (v === 'SUPPRESSED_IGNORED') {
      return <span className="cr-verdict-badge verdict-ignored">⚪ Diredam</span>;
    }
    return <span className="cr-verdict-badge verdict-ai">🟢 {v}</span>;
  };

  const renderUrgencyBadge = (score) => {
    const val = Number(score) || 1;
    if (val >= 4) {
      return <span className="cr-urgency-badge urgency-critical">🚨 Darurat Skor {val}</span>;
    }
    if (val >= 3) {
      return <span className="cr-urgency-badge urgency-warn">⚠️ Urgen Skor {val}</span>;
    }
    return <span className="cr-urgency-badge urgency-normal">Rutin Skor {val}</span>;
  };

  return (
    <div className="cr-tab-content-card">
      <div className="cr-logs-header-row">
        <div>
          <h3>{t('whatsapp.chatFilter.logsTitle')}</h3>
          <p>{t('whatsapp.chatFilter.logsSubtitle')}</p>
        </div>
        <button
          className="cr-btn-outline"
          onClick={() => fetchMessageLogs(logChannelFilter, logVerdictFilter)}
          disabled={loadingLogs}
          title="Segarkan Log"
          aria-label="Segarkan Log"
        >
          <RefreshCw size={15} className={loadingLogs ? 'cr-spin' : ''} />
        </button>
      </div>

      {/* Filters Bar: Channel and Filter Verdict */}
      <div className="cr-logs-filter-bar">
        <div className="cr-channel-pills-filter">
          {['all', 'whatsapp', 'web', 'telegram', 'gmail'].map((ch) => (
            <button
              key={ch}
              className={`cr-filter-pill ${logChannelFilter === ch ? 'active' : ''}`}
              onClick={() => {
                setLogChannelFilter(ch);
                if (fetchMessageLogs) fetchMessageLogs(ch, logVerdictFilter);
              }}
            >
              {ch === 'all' && 'Semua Saluran'}
              {ch === 'whatsapp' && '📱 WhatsApp'}
              {ch === 'web' && '🌐 Website'}
              {ch === 'telegram' && '✈️ Telegram'}
              {ch === 'gmail' && '✉️ Gmail'}
            </button>
          ))}
        </div>

        <div className="cr-search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Cari nomor HP, pesan, atau intent..."
            value={searchLogText}
            onChange={(e) => setSearchLogText(e.target.value)}
          />
        </div>
      </div>

      {/* Verdict Filter Bar */}
      <div className="cr-verdict-filter-row">
        <div className="cr-verdict-label">
          <Filter size={14} />
          <span>{t('whatsapp.chatFilter.logsFilterLabel')}</span>
        </div>
        <div className="cr-verdict-pills">
          {[
            { key: 'all', label: 'Semua Status' },
            { key: 'REPLIED_BY_AI', label: '🟢 Dijawab AI' },
            { key: 'REPLIED_FALLBACK', label: '🔵 Respon Panduan' },
            { key: 'ESCALATED_HUMAN', label: '🟡 Alih Staf' },
            { key: 'SUPPRESSED_IGNORED', label: '⚪ Diredam' },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              className={`cr-verdict-pill ${logVerdictFilter === item.key ? 'active' : ''}`}
              onClick={() => {
                if (setLogVerdictFilter) setLogVerdictFilter(item.key);
                if (fetchMessageLogs) fetchMessageLogs(logChannelFilter, item.key);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table */}
      <div className="cr-table-container">
        {loadingLogs ? (
          <div className="cr-loading-state">
            <RefreshCw size={24} className="cr-spin" />
            <p>Memuat riwayat pesan dan evaluasi filter...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="cr-empty-state">
            <MessageSquare size={36} color="#94a3b8" />
            <h4>Belum Ada Log Pesan</h4>
            <p>Belum ada pesan masuk pada saluran dan kriteria filter yang dipilih.</p>
          </div>
        ) : (
          <table className="cr-logs-table">
            <thead>
              <tr>
                <th>Saluran</th>
                <th>Waktu</th>
                <th>Pengirim</th>
                <th>Pesan Pasien</th>
                <th>{t('whatsapp.chatFilter.logsColVerdict')}</th>
                <th>Kategori &amp; Urgensi</th>
                <th>Respons Sistem</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log, i) => (
                <tr key={log.log_id || log.id || i}>
                  <td>
                    <span className={`cr-channel-badge badge-${(log.channel || 'wa').toLowerCase()}`}>
                      {log.channel === 'TELEGRAM' || log.channel === 'telegram'
                        ? 'Telegram'
                        : log.channel === 'GMAIL' || log.channel === 'gmail'
                        ? 'Gmail'
                        : log.channel === 'WEB' || log.channel === 'web'
                        ? 'Website'
                        : 'WhatsApp'}
                    </span>
                  </td>
                  <td className="cr-time-col">
                    {log.created_at || log.timestamp
                      ? new Date(log.created_at || log.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '-'}
                  </td>
                  <td className="cr-contact-col">
                    <strong>{log.phone || log.sender_name || 'Pasien Mandiri'}</strong>
                  </td>
                  <td className="cr-message-col">
                    <p>{log.message_text || log.content || '-'}</p>
                  </td>
                  <td>
                    {renderVerdictBadge(log.filter_verdict)}
                  </td>
                  <td>
                    <div className="cr-intent-urgency-cell">
                      <span className="cr-intent-badge">
                        {log.intent_category || log.stage_or_intent || 'RESERVATION'}
                      </span>
                      {renderUrgencyBadge(log.urgency_score)}
                    </div>
                  </td>
                  <td className="cr-reply-col">
                    <p>{log.message_text && log.direction === 'OUTBOUND' ? log.message_text : log.response_text || log.bot_reply || (log.filter_verdict === 'SUPPRESSED_IGNORED' ? '— Hening / Diredam —' : log.waha_status || 'Diproses')}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ReservationLogsSection;