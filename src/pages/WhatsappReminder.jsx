import React, { useEffect, useState } from 'react';
import { 
  MessageSquare, Send, Mail, Globe, RefreshCw, Sparkles, QrCode, 
  ExternalLink, Search, CheckCircle2, AlertCircle, Bot, Layers,
  ArrowUpRight, ArrowDownLeft, Settings, ShieldCheck
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { 
  getOmnichannelStatus, 
  getOmnichannelLogs, 
  sendOmnichannelTestDispatch 
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import OmnichannelSettingsModal from '../components/chatbot/OmnichannelSettingsModal';

const WhatsappReminder = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useNotification();
  const isSuperOrAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  // Gateway & Omnichannel States
  const [statusData, setStatusData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState('all'); // 'all', 'whatsapp', 'telegram', 'gmail', 'web'
  const [searchLog, setSearchLog] = useState('');
  const [qrTimestamp, setQrTimestamp] = useState(Date.now());
  const [activeQrModal, setActiveQrModal] = useState(null); // 'wa_patient', 'waha_bot', 'telegram_bot'

  // Modals
  const [editingSettings, setEditingSettings] = useState(false);

  const fetchOmnichannelData = async () => {
    setLoading(true);
    try {
      const st = await getOmnichannelStatus();
      setStatusData(st);
    } catch (err) {
      console.error('Error fetching omnichannel status:', err);
    } finally {
      setLoading(false);
    }

    fetchLogs(selectedChannel);
  };

  const fetchLogs = async (channel = selectedChannel) => {
    setLoadingLogs(true);
    try {
      const logList = await getOmnichannelLogs(channel, 60);
      setLogs(Array.isArray(logList) ? logList : []);
    } catch (err) {
      console.error('Error fetching omnichannel logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchOmnichannelData();
  }, []);

  const handleChannelFilterChange = (ch) => {
    setSelectedChannel(ch);
    fetchLogs(ch);
  };

  const apiHost = import.meta.env.VITE_API_BASE_URL || `http://${window.location.hostname}:8001`;
  const wahaQrUrl = `${apiHost}/api/connectors/whatsapp/qr?t=${qrTimestamp}`;
  const tgBotUsername = statusData?.telegram?.account_or_identifier?.replace(/^@/, '') || 'TernakHealthBot';
  const tgBotUrl = `https://t.me/${tgBotUsername}`;
  const tgQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(tgBotUrl)}`;
  const rawWaPhone = statusData?.whatsapp?.account_or_identifier;
  const waPhone = (rawWaPhone === '6285117331646' ? '6285128071646' : rawWaPhone) || '6285128071646';
  const waDirectUrl = `https://wa.me/${waPhone}`;
  const waQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(waDirectUrl)}`;

  const filteredLogs = logs.filter((l) => {
    if (!searchLog.trim()) return true;
    const q = searchLog.toLowerCase();
    return (
      (l.phone && l.phone.toLowerCase().includes(q)) ||
      (l.message_text && l.message_text.toLowerCase().includes(q)) ||
      (l.channel && l.channel.toLowerCase().includes(q)) ||
      (l.stage_or_intent && l.stage_or_intent.toLowerCase().includes(q))
    );
  });

  return (
    <div style={{ maxWidth: '1360px', margin: '0 auto', paddingBottom: '3.5rem' }}>
      {/* Top Header */}
      <div style={{
        marginBottom: '1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        backgroundColor: '#ffffff',
        padding: '1.25rem 1.5rem',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.25rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: '#f0fdf4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary-color)'
            }}>
              <Layers size={22} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                {t('whatsapp.gatewayTitle', 'Gateway Chatbot & Reservasi AI')}
              </h1>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.825rem' }}>
                {t('whatsapp.gatewaySubtitle', 'Pusat orkestrasi 4 kanal komunikasi pasien: WhatsApp, Telegram, Gmail, dan Web Widget.')}
              </p>
            </div>
          </div>
        </div>

        {/* Header Action Buttons (Zero Redundancy) */}
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => navigate('/app/ai-agent/chatbot-reservasi/ringkasan')}
            className="btn btn-secondary"
            style={{
              padding: '0.5rem 0.85rem',
              fontSize: '0.825rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              borderColor: 'var(--primary-color)',
              color: 'var(--primary-color)',
              fontWeight: 600
            }}
          >
            <Sparkles size={15} />
            <span>{t('layout.nav.chatbotSummary', 'Ringkasan Chatbot AI')}</span>
          </button>

          {['admin', 'superadmin', 'staff'].includes(user?.role) && (
            <button
              type="button"
              onClick={() => navigate('/app/connect-whatsapp')}
              className="btn btn-secondary"
              style={{
                padding: '0.5rem 0.95rem',
                fontSize: '0.825rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                borderColor: '#10b981',
                color: '#047857',
                fontWeight: 600
              }}
            >
              <MessageSquare size={15} />
              <span>Hubungkan Nomor WhatsApp</span>
            </button>
          )}

          {isSuperOrAdmin && (
            <button
              type="button"
              onClick={() => setEditingSettings(true)}
              className="btn btn-primary"
              style={{
                padding: '0.5rem 0.95rem',
                fontSize: '0.825rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem'
              }}
            >
              <Settings size={15} />
              <span>Pengaturan Kanal</span>
            </button>
          )}

          <button
            type="button"
            onClick={fetchOmnichannelData}
            className="btn btn-secondary"
            style={{ padding: '0.55rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Refresh Data Status"
            aria-label="Refresh Data Status"
          >
            <RefreshCw size={15} className={loading || loadingLogs ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* 4-Channel Omnichannel Bento Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
        gap: '1.15rem',
        marginBottom: '1.75rem'
      }}>
        {/* CARD 1: WHATSAPP */}
        <div className="card" style={{
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid #bbf7d0',
          padding: '1.25rem',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
                  <img src="/icons/WA.webp" alt="WhatsApp" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>WhatsApp Hotline</h2>
                  <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Gateway WhatsApp API</span>
                </div>
              </div>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '0.2rem 0.55rem',
                borderRadius: '12px',
                backgroundColor: statusData?.whatsapp?.status === 'CONNECTED' ? '#dcfce7' : '#fef3c7',
                color: statusData?.whatsapp?.status === 'CONNECTED' ? '#15803d' : '#b45309'
              }}>
                {statusData?.whatsapp?.status || 'CONNECTED'}
              </span>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '8px', marginBottom: '0.85rem' }}>
              <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Nomor Layanan Pasien:</div>
              <div style={{ fontSize: '0.925rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>+{waPhone}</span>
                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--primary-color)', backgroundColor: '#e6f4ea', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                  {statusData?.whatsapp?.details?.service_label || 'CS Hotline'}
                </span>
              </div>
            </div>

            <p style={{ margin: '0 0 1rem 0', fontSize: '0.775rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              Melayani pendaftaran janji temu, pengingat kontrol H-1 otomatis, dan konfirmasi kehadiran pasien.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setActiveQrModal('wa_patient')}
              className="btn btn-secondary"
              style={{ flex: 1, padding: '0.45rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
            >
              <QrCode size={14} />
              <span>QR Pasien</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveQrModal('waha_bot')}
              className="btn btn-secondary"
              style={{ flex: 1, padding: '0.45rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
            >
              <RefreshCw size={13} />
              <span>Sesi Bot WhatsApp</span>
            </button>
          </div>
        </div>

        {/* CARD 2: TELEGRAM */}
        <div className="card" style={{
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid #bae6fd',
          padding: '1.25rem',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7' }}>
                  <img src="/icons/Telegram.webp" alt="Telegram" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>Telegram Bot API</h2>
                  <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Notifikasi & Triase</span>
                </div>
              </div>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '0.2rem 0.55rem',
                borderRadius: '12px',
                backgroundColor: statusData?.telegram?.status === 'CONNECTED' ? '#e0f2fe' : '#f1f5f9',
                color: statusData?.telegram?.status === 'CONNECTED' ? '#0369a1' : '#64748b'
              }}>
                {statusData?.telegram?.status || 'CONNECTED'}
              </span>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '8px', marginBottom: '0.85rem' }}>
              <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Handle Bot Resmi:</div>
              <div style={{ fontSize: '0.925rem', fontWeight: 700, color: '#0284c7', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>@{tgBotUsername}</span>
                <a
                  href={tgBotUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: '#0284c7', display: 'inline-flex', alignItems: 'center' }}
                  title="Buka di Telegram"
                >
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>

            <p style={{ margin: '0 0 1rem 0', fontSize: '0.775rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              Mengirim tiket pendaftaran rawat jalan dan peringatan darurat UGD (*red-flag triage*) secara instan ke grup medis.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setActiveQrModal('telegram_bot')}
              className="btn btn-secondary"
              style={{ flex: 1, padding: '0.45rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
            >
              <QrCode size={14} />
              <span>QR Bot Telegram</span>
            </button>
            <a
              href={tgBotUrl}
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary"
              style={{ flex: 1, padding: '0.45rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', textDecoration: 'none' }}
            >
              <ExternalLink size={13} />
              <span>Buka Bot</span>
            </a>
          </div>
        </div>

        {/* CARD 3: GMAIL / SMTP */}
        <div className="card" style={{
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid #fed7aa',
          padding: '1.25rem',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#ffedd5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ea580c' }}>
                  <img src="/icons/Gmail.webp" alt="Gmail" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>Gmail / Email SMTP</h2>
                  <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>E-Tiket & Resume Medis</span>
                </div>
              </div>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '0.2rem 0.55rem',
                borderRadius: '12px',
                backgroundColor: statusData?.gmail?.status === 'CONFIGURED' ? '#ffedd5' : '#f1f5f9',
                color: statusData?.gmail?.status === 'CONFIGURED' ? '#c2410c' : '#64748b'
              }}>
                {statusData?.gmail?.status || 'CONFIGURED'}
              </span>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '8px', marginBottom: '0.85rem' }}>
              <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Alamat Pengirim Resmi:</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {statusData?.gmail?.account_or_identifier || 'notifikasi@rs.com'}
              </div>
            </div>

            <p style={{ margin: '0 0 1rem 0', fontSize: '0.775rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              Mengirimkan konfirmasi reservasi formal berformat HTML dan ringkasan pemeriksaan pasien langsung ke kotak masuk email.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={async () => {
                const target = prompt('Masukkan alamat email tujuan untuk uji kirim:', 'pasien@example.com');
                if (target) {
                  try {
                    await sendOmnichannelTestDispatch('gmail', target, 'Halo! Ini adalah pesan uji coba pengiriman email dari Sistem Omnichannel Rumah Sakit.');
                    showToast({ type: 'success', title: 'Email Terkirim', message: `Uji kirim ke ${target} berhasil diproses.` });
                    fetchLogs();
                  } catch (err) {
                    showToast({ type: 'error', title: 'Gagal Kirim Email', message: err.message });
                  }
                }
              }}
              className="btn btn-secondary"
              style={{ width: '100%', padding: '0.45rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
            >
              <Mail size={13} />
              <span>Uji Kirim Email</span>
            </button>
          </div>
        </div>

        {/* CARD 4: WEBSITE WIDGET */}
        <div className="card" style={{
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid #e9d5ff',
          padding: '1.25rem',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed' }}>
                  <img src="/icons/Website.svg" alt="Website" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>Website Live Chat</h2>
                  <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Portal Pasien & Web</span>
                </div>
              </div>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '0.2rem 0.55rem',
                borderRadius: '12px',
                backgroundColor: statusData?.web?.status === 'ACTIVE' ? '#f3e8ff' : '#f1f5f9',
                color: statusData?.web?.status === 'ACTIVE' ? '#6b21a8' : '#64748b'
              }}>
                {statusData?.web?.status || 'ACTIVE'}
              </span>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '8px', marginBottom: '0.85rem' }}>
              <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Widget Header Title:</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#7c3aed', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Bot size={14} />
                <span>{statusData?.web?.details?.widget_title || 'Asisten Virtual RS'}</span>
              </div>
            </div>

            <p style={{ margin: '0 0 1rem 0', fontSize: '0.775rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              Terintegrasi langsung pada Formulir Reservasi Online dan Portal Pasien Digital untuk tanya jawab klinis & jadwal poli.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => navigate('/reservasi')}
              className="btn btn-secondary"
              style={{ width: '100%', padding: '0.45rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
            >
              <ExternalLink size={13} />
              <span>Buka Portal Web</span>
            </button>
          </div>
        </div>
      </div>

      {/* Omnichannel Audit Message Logs Section */}
      <div className="card" style={{
        backgroundColor: '#ffffff',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-sm)',
        overflow: 'hidden'
      }}>
        {/* Logs Header & Filter Toolbar */}
        <div style={{
          padding: '1.15rem 1.5rem',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          backgroundColor: '#f8fafc'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Layers size={17} color="var(--primary-color)" />
              <span>Jejak Audit Pesan Omnichannel</span>
            </h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Menampilkan {filteredLogs.length} riwayat pesan masuk dan keluar dari ke-4 kanal.
            </span>
          </div>

          {/* Controls: Search + Channel Filter Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Search Input */}
            <div style={{ position: 'relative' }}>
              <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '0.7rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                value={searchLog}
                onChange={(e) => setSearchLog(e.target.value)}
                placeholder="Cari kontak atau teks pesan..."
                style={{
                  padding: '0.45rem 0.75rem 0.45rem 2.2rem',
                  fontSize: '0.8rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: '#ffffff',
                  outline: 'none',
                  width: '210px'
                }}
              />
            </div>

            {/* Channel Filter Pills */}
            <div style={{ display: 'flex', backgroundColor: '#ffffff', padding: '0.2rem', borderRadius: '8px', border: '1px solid var(--border-color)', gap: '0.2rem' }}>
              {[
                { id: 'all', label: 'Semua' },
                { id: 'whatsapp', label: 'WhatsApp', color: '#16a34a' },
                { id: 'telegram', label: 'Telegram', color: '#0284c7' },
                { id: 'gmail', label: 'Gmail', color: '#ea580c' },
                { id: 'web', label: 'Website', color: '#7c3aed' },
              ].map((pill) => {
                const isSelected = selectedChannel === pill.id;
                return (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => handleChannelFilterChange(pill.id)}
                    style={{
                      padding: '0.35rem 0.65rem',
                      fontSize: '0.75rem',
                      fontWeight: isSelected ? 700 : 500,
                      border: 'none',
                      borderRadius: '6px',
                      backgroundColor: isSelected ? 'var(--primary-color)' : 'transparent',
                      color: isSelected ? '#ffffff' : 'var(--text-main)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {pill.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.825rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.65rem 1rem', width: '140px' }}>Waktu</th>
                <th style={{ padding: '0.65rem 0.75rem', width: '110px' }}>Kanal</th>
                <th style={{ padding: '0.65rem 0.75rem', width: '90px' }}>Arah</th>
                <th style={{ padding: '0.65rem 0.75rem', width: '160px' }}>Kontak / Penerima</th>
                <th style={{ padding: '0.65rem 0.75rem' }}>Isi Pesan Aktual</th>
                <th style={{ padding: '0.65rem 1rem', width: '120px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {loadingLogs ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    <RefreshCw size={20} className="spin" style={{ margin: '0 auto 0.4rem auto' }} />
                    <div>Memuat log pesan omnichannel...</div>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    Belum ada riwayat pesan pada kanal yang dipilih.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const chUpper = (log.channel || 'WHATSAPP').toUpperCase();
                  let chBadge = { label: chUpper, bg: '#dcfce7', text: '#15803d', icon: MessageSquare };
                  if (chUpper === 'TELEGRAM') chBadge = { label: 'TELEGRAM', bg: '#e0f2fe', text: '#0369a1', icon: Send };
                  if (chUpper === 'GMAIL' || chUpper === 'EMAIL') chBadge = { label: 'GMAIL', bg: '#ffedd5', text: '#c2410c', icon: Mail };
                  if (chUpper === 'WEB') chBadge = { label: 'WEBSITE', bg: '#f3e8ff', text: '#6b21a8', icon: Globe };

                  const Icon = chBadge.icon;
                  return (
                    <tr key={log.log_id || Math.random()} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                        {log.created_at ? new Date(log.created_at).toLocaleString('id-ID', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>
                      <td style={{ padding: '0.75rem 0.75rem' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '12px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          backgroundColor: chBadge.bg,
                          color: chBadge.text
                        }}>
                          <Icon size={11} />
                          <span>{chBadge.label}</span>
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 0.75rem' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          padding: '0.15rem 0.45rem',
                          borderRadius: '4px',
                          fontSize: '0.675rem',
                          fontWeight: 700,
                          backgroundColor: log.direction === 'INBOUND' ? '#dbeafe' : '#f0fdf4',
                          color: log.direction === 'INBOUND' ? '#1e40af' : '#166534'
                        }}>
                          {log.direction === 'INBOUND' ? <ArrowDownLeft size={11} /> : <ArrowUpRight size={11} />}
                          <span>{log.direction}</span>
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 0.75rem', fontWeight: 600, color: 'var(--text-main)', fontSize: '0.775rem' }}>
                        {log.phone || '-'}
                      </td>
                      <td style={{ padding: '0.75rem 0.75rem', maxWidth: '440px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.message_text || '-'}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                        <span style={{
                          padding: '0.1rem 0.4rem',
                          borderRadius: '4px',
                          backgroundColor: '#f1f5f9',
                          fontWeight: 600
                        }}>
                          {log.waha_status || 'DELIVERED'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* QR Code Inspection Modal */}
      {activeQrModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1050,
          padding: '1rem',
          backdropFilter: 'blur(3px)'
        }}>
          <div className="card animate-fade-in" style={{
            width: '100%',
            maxWidth: '380px',
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem',
            textAlign: 'center',
            position: 'relative',
            boxShadow: 'var(--shadow-xl)'
          }}>
            <button
              type="button"
              onClick={() => setActiveQrModal(null)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            {activeQrModal === 'wa_patient' && (
              <div>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.05rem', fontWeight: 700 }}>QR WhatsApp Pasien</h3>
                <p style={{ margin: '0 0 1rem 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Arahkan kamera ponsel pasien untuk langsung memulai chat dengan nomor hotline rumah sakit.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                  <img src={waQrUrl} alt="QR WhatsApp Pasien" style={{ width: '200px', height: '200px', borderRadius: '6px' }} />
                </div>
                <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary-color)' }}>
                  +{waPhone}
                </div>
              </div>
            )}

            {activeQrModal === 'waha_bot' && (
              <div>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.05rem', fontWeight: 700 }}>Sesi Gateway WhatsApp</h3>
                <p style={{ margin: '0 0 1rem 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Pindai QR ini dari menu WhatsApp &gt; Perangkat Tertaut pada ponsel klinik untuk mengaktifkan bot.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                  <img
                    src={wahaQrUrl}
                    alt="Sesi Gateway QR"
                    style={{ width: '200px', height: '200px', borderRadius: '6px', objectFit: 'contain' }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  />
                  <div style={{ display: 'none', color: '#15803d', fontSize: '0.85rem', padding: '2rem 1rem' }}>
                    <CheckCircle2 size={36} style={{ margin: '0 auto 0.5rem auto' }} />
                    <div>Sesi Bot WhatsApp Aktif / Terhubung</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setQrTimestamp(Date.now())}
                  className="btn btn-secondary"
                  style={{ marginTop: '0.75rem', width: '100%', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                >
                  <RefreshCw size={13} />
                  <span>Muat Ulang QR Sesi</span>
                </button>
              </div>
            )}

            {activeQrModal === 'telegram_bot' && (
              <div>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.05rem', fontWeight: 700 }}>QR Bot Telegram</h3>
                <p style={{ margin: '0 0 1rem 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Pindai QR ini untuk membuka percakapan dengan bot Telegram resmi @{tgBotUsername}.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                  <img src={tgQrUrl} alt="QR Bot Telegram" style={{ width: '200px', height: '200px', borderRadius: '6px' }} />
                </div>
                <a
                  href={tgBotUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.75rem', fontSize: '0.825rem', fontWeight: 600, color: '#0284c7', textDecoration: 'none' }}
                >
                  <span>Buka di Telegram</span>
                  <ExternalLink size={13} />
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Omnichannel Settings Modal (Consolidated 4 Channels) */}
      {editingSettings && (
        <OmnichannelSettingsModal
          initialData={statusData}
          onClose={() => setEditingSettings(false)}
          onSuccess={() => {
            fetchOmnichannelData();
            setEditingSettings(false);
          }}
        />
      )}


    </div>
  );
};

export default WhatsappReminder;
