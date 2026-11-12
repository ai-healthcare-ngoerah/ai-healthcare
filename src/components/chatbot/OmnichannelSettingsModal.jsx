import React, { useState, useEffect } from 'react';
import { Save, X, RefreshCw, MessageSquare, Send, Mail, Globe, Check, Copy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getOmnichannelSettings, updateOmnichannelSettings } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';

const OmnichannelSettingsModal = ({ initialData, onSuccess, onClose }) => {
  const { t } = useTranslation();
  const { showToast } = useNotification();

  const [activeTab, setActiveTab] = useState('whatsapp'); // 'whatsapp', 'telegram', 'gmail', 'web'
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  const [formData, setFormData] = useState({
    // WhatsApp
    clinic_name: initialData?.clinic_name || 'Ternak AI Healthcare Partner',
    whatsapp_number: (initialData?.whatsapp_number === '6285117331646' ? '6285128071646' : initialData?.whatsapp_number) || '6285128071646',
    whatsapp_label: initialData?.whatsapp_label || 'CS Hotline RS',
    promo_message: initialData?.promo_message || '',
    // Telegram
    telegram_bot_token: initialData?.telegram_bot_token || '',
    telegram_bot_username: initialData?.telegram_bot_username || 'TernakHealthBot',
    telegram_chat_id: initialData?.telegram_chat_id || '',
    telegram_bot_status: initialData?.telegram_bot_status || 'CONNECTED',
    // Gmail / SMTP
    smtp_host: initialData?.smtp_host || 'smtp.gmail.com',
    smtp_port: initialData?.smtp_port || 587,
    smtp_user: initialData?.smtp_user || '',
    smtp_password: initialData?.smtp_password || '',
    smtp_from_email: initialData?.smtp_from_email || 'notifikasi@rs.com',
    smtp_enabled: initialData?.smtp_enabled !== false,
    // Website Widget
    web_widget_enabled: initialData?.web_widget_enabled !== false,
    web_widget_title: initialData?.web_widget_title || 'Asisten Virtual RS',
  });

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        setLoading(true);
        const data = await getOmnichannelSettings();
        if (data) {
          setFormData((prev) => ({
            ...prev,
            ...data,
            smtp_password: '', // keep empty unless changed
          }));
        }
      } catch (err) {
        console.error('Error fetching omnichannel settings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLatest();
  }, []);

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...formData };
      if (!payload.smtp_password) {
        delete payload.smtp_password; // don't overwrite if left blank
      }
      const updated = await updateOmnichannelSettings(payload);
      showToast({
        type: 'success',
        title: 'Pengaturan Omnichannel Disimpan',
        message: 'Konfigurasi seluruh kanal berhasil disinkronisasi ke server.'
      });
      if (typeof onSuccess === 'function') onSuccess(updated);
      if (typeof onClose === 'function') onClose();
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Gagal Menyimpan',
        message: err.message || 'Terjadi kesalahan saat menyimpan pengaturan omnichannel.'
      });
    } finally {
      setSaving(false);
    }
  };

  const embedCode = `<script src="http://localhost:5173/widget/chat.js" data-hospital="${encodeURIComponent(formData.clinic_name)}" data-channel="web" async></script>`;

  const copyEmbedSnippet = () => {
    navigator.clipboard.writeText(embedCode);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  return (
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
        maxWidth: '680px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#ffffff',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-xl)',
        border: '1px solid var(--border-color)',
        overflow: 'hidden'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#f8fafc'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>Pengaturan Komunikasi Omnichannel</span>
            </h2>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Kelola integrasi WhatsApp, Telegram, Gmail, dan Web Widget dalam satu kendali terpusat.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem', borderRadius: '4px' }}
            title="Tutup"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: '#f1f5f9',
          padding: '0.25rem 0.75rem 0 0.75rem',
          gap: '0.35rem',
          overflowX: 'auto'
        }}>
          {[
            { id: 'whatsapp', label: 'WhatsApp', iconImg: '/icons/WA.webp', icon: MessageSquare, color: '#16a34a' },
            { id: 'telegram', label: 'Telegram', iconImg: '/icons/Telegram.webp', icon: Send, color: '#0284c7' },
            { id: 'gmail', label: 'Gmail / SMTP', iconImg: '/icons/Gmail.webp', icon: Mail, color: '#ea580c' },
            { id: 'web', label: 'Website Widget', iconImg: '/icons/Website.svg', icon: Globe, color: '#7c3aed' },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.55rem 0.95rem',
                  fontSize: '0.825rem',
                  fontWeight: 600,
                  border: 'none',
                  borderTopLeftRadius: '6px',
                  borderTopRightRadius: '6px',
                  borderBottom: isActive ? '2px solid var(--primary-color)' : '2px solid transparent',
                  backgroundColor: isActive ? '#ffffff' : 'transparent',
                  color: isActive ? 'var(--primary-color)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.iconImg ? (
                  <img src={tab.iconImg} alt={tab.label} style={{ width: '16px', height: '16px', objectFit: 'contain' }} />
                ) : (
                  <Icon size={15} color={isActive ? tab.color : 'currentColor'} />
                )}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Body (Scrollable) */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <RefreshCw size={22} className="spin" style={{ margin: '0 auto 0.5rem auto' }} />
              <p style={{ margin: 0, fontSize: '0.85rem' }}>Memuat konfigurasi kanal...</p>
            </div>
          ) : (
            <form id="omnichannel-form" onSubmit={handleSave}>
              {/* TAB 1: WHATSAPP */}
              {activeTab === 'whatsapp' && (
                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ padding: '0.75rem', backgroundColor: '#f0fdf4', borderRadius: '6px', border: '1px solid #bbf7d0', fontSize: '0.8rem', color: '#166534' }}>
                    Koneksi bot WhatsApp diorkestrasi via WAHA REST API. Pesan pasien masuk dan konfirmasi kehadiran akan diproses otomatis oleh AI Agent.
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                      Nama Fasilitas Kesehatan / RS
                    </label>
                    <input
                      type="text"
                      value={formData.clinic_name}
                      onChange={(e) => handleChange('clinic_name', e.target.value)}
                      style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.9rem' }}
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                        Nomor WhatsApp Hotline
                      </label>
                      <input
                        type="text"
                        value={formData.whatsapp_number}
                        onChange={(e) => handleChange('whatsapp_number', e.target.value)}
                        placeholder="Contoh: 6285117331646"
                        style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.9rem' }}
                        required
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                        Label Layanan
                      </label>
                      <input
                        type="text"
                        value={formData.whatsapp_label}
                        onChange={(e) => handleChange('whatsapp_label', e.target.value)}
                        placeholder="CS Hotline RS"
                        style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.9rem' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                      Pesan Promosi / Broadcast Template
                    </label>
                    <textarea
                      value={formData.promo_message}
                      onChange={(e) => handleChange('promo_message', e.target.value)}
                      style={{ width: '100%', minHeight: '90px', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.875rem' }}
                      placeholder="Template kalimat pengingat jadwal dan edukasi kesehatan..."
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: TELEGRAM */}
              {activeTab === 'telegram' && (
                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ padding: '0.75rem', backgroundColor: '#f0f9ff', borderRadius: '6px', border: '1px solid #bae6fd', fontSize: '0.8rem', color: '#0369a1' }}>
                    Kanal Telegram digunakan untuk pengiriman digital ticket janji temu pasien dan broadcast alarm triase gawat darurat UGD secara instan ke grup medis.
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                      Username Bot Telegram
                    </label>
                    <input
                      type="text"
                      value={formData.telegram_bot_username}
                      onChange={(e) => handleChange('telegram_bot_username', e.target.value)}
                      placeholder="TernakHealthBot"
                      style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.9rem' }}
                    />
                    <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                      Tautan akses: https://t.me/{formData.telegram_bot_username?.replace(/^@/, '')}
                    </small>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                      Telegram Bot Token (HTTP API)
                    </label>
                    <input
                      type="password"
                      value={formData.telegram_bot_token}
                      onChange={(e) => handleChange('telegram_bot_token', e.target.value)}
                      placeholder="Contoh: 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                      style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.9rem' }}
                    />
                    <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                      Dapatkan token dari @BotFather di Telegram untuk mengaktifkan bot.
                    </small>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                      Default Chat ID / Grup Triase UGD
                    </label>
                    <input
                      type="text"
                      value={formData.telegram_chat_id}
                      onChange={(e) => handleChange('telegram_chat_id', e.target.value)}
                      placeholder="Contoh: -100123456789"
                      style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.9rem' }}
                    />
                    <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                      ID chat atau channel tempat bot mengirimkan tiket reservasi dan peringatan darurat.
                    </small>
                  </div>
                </div>
              )}

              {/* TAB 3: GMAIL / SMTP */}
              {activeTab === 'gmail' && (
                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ padding: '0.75rem', backgroundColor: '#fff7ed', borderRadius: '6px', border: '1px solid #fed7aa', fontSize: '0.8rem', color: '#9a3412' }}>
                    Kanal Gmail mengirimkan e-tiket konfirmasi janji temu resmi berformat HTML, ringkasan pengkajian medis, dan rekonsiliasi harian ke pasien atau direksi.
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <input
                      type="checkbox"
                      id="smtp_enabled"
                      checked={formData.smtp_enabled}
                      onChange={(e) => handleChange('smtp_enabled', e.target.checked)}
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    <label htmlFor="smtp_enabled" style={{ fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
                      Aktifkan Pengiriman Email Otomatis
                    </label>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                        SMTP Host Server
                      </label>
                      <input
                        type="text"
                        value={formData.smtp_host}
                        onChange={(e) => handleChange('smtp_host', e.target.value)}
                        placeholder="smtp.gmail.com"
                        style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.9rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                        Port
                      </label>
                      <input
                        type="number"
                        value={formData.smtp_port}
                        onChange={(e) => handleChange('smtp_port', parseInt(e.target.value) || 587)}
                        style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.9rem' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                        Email Akun / User SMTP
                      </label>
                      <input
                        type="email"
                        value={formData.smtp_user}
                        onChange={(e) => handleChange('smtp_user', e.target.value)}
                        placeholder="notifikasi@klinik.com"
                        style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.9rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                        Password / App Password
                      </label>
                      <input
                        type="password"
                        value={formData.smtp_password}
                        onChange={(e) => handleChange('smtp_password', e.target.value)}
                        placeholder="Kosongkan jika tidak diubah"
                        style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.9rem' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                      Alamat Email Pengirim Resmi (From Header)
                    </label>
                    <input
                      type="text"
                      value={formData.smtp_from_email}
                      onChange={(e) => handleChange('smtp_from_email', e.target.value)}
                      placeholder="Ternak AI Healthcare <notifikasi@healthcare.ai>"
                      style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.9rem' }}
                    />
                  </div>
                </div>
              )}

              {/* TAB 4: WEBSITE WIDGET */}
              {activeTab === 'web' && (
                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ padding: '0.75rem', backgroundColor: '#faf5ff', borderRadius: '6px', border: '1px solid #e9d5ff', fontSize: '0.8rem', color: '#6b21a8' }}>
                    Widget Webchat memungkinkan pasien langsung berkonsultasi jadwal dan informasi poli di website resmi atau Portal Pasien (`/patient/portal/:token`).
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <input
                      type="checkbox"
                      id="web_widget_enabled"
                      checked={formData.web_widget_enabled}
                      onChange={(e) => handleChange('web_widget_enabled', e.target.checked)}
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    <label htmlFor="web_widget_enabled" style={{ fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
                      Aktifkan Live Chat Widget di Portal Web
                    </label>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                      Judul Header Chat Widget
                    </label>
                    <input
                      type="text"
                      value={formData.web_widget_title}
                      onChange={(e) => handleChange('web_widget_title', e.target.value)}
                      placeholder="Asisten Virtual RS"
                      style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.9rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                      Kode Sematan (Embed Code untuk Website RS Eksternal)
                    </label>
                    <div style={{ position: 'relative' }}>
                      <pre style={{ margin: 0, padding: '0.85rem', backgroundColor: '#0f172a', color: '#f8fafc', borderRadius: '6px', fontSize: '0.75rem', overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                        {embedCode}
                      </pre>
                      <button
                        type="button"
                        onClick={copyEmbedSnippet}
                        style={{
                          position: 'absolute',
                          top: '0.5rem',
                          right: '0.5rem',
                          padding: '0.3rem 0.55rem',
                          fontSize: '0.7rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          backgroundColor: copiedSnippet ? '#166534' : 'rgba(255,255,255,0.2)',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        {copiedSnippet ? <Check size={12} /> : <Copy size={12} />}
                        <span>{copiedSnippet ? 'Tersalin' : 'Salin'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </form>
          )}
        </div>

        {/* Modal Footer (Single Universal Save Button) */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '0.65rem',
          backgroundColor: '#f8fafc'
        }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={saving}
            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
          >
            Batal
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving || loading}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
          >
            {saving ? (
              <>
                <RefreshCw size={15} className="spin" />
                <span>Menyimpan Seluruh Kanal...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Simpan Pengaturan Omnichannel</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OmnichannelSettingsModal;
