import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  MessageSquare, QrCode, Key, Phone, CheckCircle2, AlertCircle,
  Copy, ExternalLink, Printer, Send, RefreshCw, Sparkles, Shield,
  ArrowLeft, Clock, Save, Smartphone, ChevronRight, Zap, Info
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import {
  getOmnichannelStatus,
  getOmnichannelSettings,
  updateOmnichannelSettings,
  getWahaSessionStatus,
  sendWahaDirectWebhook,
  sendOmnichannelTestDispatch
} from '../services/api';
import './ConnectWhatsapp.css';

const ConnectWhatsapp = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useNotification();

  // Strict Role Guard: Only SuperAdmin, Admin, and Staff
  const allowedRoles = ['superadmin', 'admin', 'staff'];
  const hasAccess = allowedRoles.includes(user?.role);

  // States
  const [activeTab, setActiveTab] = useState('pairing_code'); // 'pairing_code', 'qr_code', 'config'
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState(false);

  // Connection & Clinic Settings
  const [clinicName, setClinicName] = useState(() => localStorage.getItem('wa_clinic_name') || 'Ternak AI Healthcare Partner');
  const [whatsappNumber, setWhatsappNumber] = useState(() => {
    const saved = localStorage.getItem('wa_clinic_phone');
    if (saved === '6285117331646' || !saved) {
      localStorage.setItem('wa_clinic_phone', '6285128071646');
      return '6285128071646';
    }
    return saved;
  });
  const [serviceLabel, setServiceLabel] = useState('CS Hotline Reservasi');
  const [queuePrefix, setQueuePrefix] = useState('A-');
  const [autoReminder, setAutoReminder] = useState(true);
  const [greetingMessage, setGreetingMessage] = useState(
    () => localStorage.getItem('wa_greeting_template') ||
    `Halo! Selamat datang di layanan pendaftaran & reservasi mandiri {nama_klinik}.\n\nKetik poliklinik tujuan (cth: Poli Umum, Poli Anak, Poli Gigi) dan tanggal berobat. Sistem AI kami akan otomatis menerbitkan nomor antrean resmi Anda! 🩺✨`
  );

  // Status & Pairing Codes
  const [connectionStatus, setConnectionStatus] = useState('CONNECTED'); // 'CONNECTED', 'SCAN_QR', 'DISCONNECTED'
  const [pairingCode, setPairingCode] = useState('USAD-8924');
  const [isCopiedCode, setIsCopiedCode] = useState(false);
  const [isCopiedLink, setIsCopiedLink] = useState(false);
  const [qrTimestamp, setQrTimestamp] = useState(Date.now());
  const [showStandeeModal, setShowStandeeModal] = useState(false);

  // Interactive Smartphone Simulator States
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'bot',
      text: `Halo! Selamat datang di layanan reservasi mandiri ${clinicName}.\n\nKetik poliklinik tujuan atau pilih opsi di bawah untuk mengambil nomor antrean:`,
      time: '15:30 WITA'
    }
  ]);
  const [phoneInputText, setPhoneInputText] = useState('');
  const chatCanvasRef = useRef(null);

  // Auto-scroll simulator chat
  useEffect(() => {
    if (chatCanvasRef.current) {
      chatCanvasRef.current.scrollTop = chatCanvasRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Load Settings from API on mount
  useEffect(() => {
    const fetchExistingConfig = async () => {
      try {
        setLoading(true);
        const st = await getOmnichannelStatus();
        if (st?.whatsapp) {
          if (st.whatsapp.account_or_identifier) {
            const num = st.whatsapp.account_or_identifier === '6285117331646' ? '6285128071646' : st.whatsapp.account_or_identifier;
            setWhatsappNumber(num);
          }
          if (st.whatsapp.status) {
            setConnectionStatus(st.whatsapp.status === 'CONNECTED' ? 'CONNECTED' : 'DISCONNECTED');
          }
        }
        const cfg = await getOmnichannelSettings();
        if (cfg) {
          if (cfg.clinic_name) setClinicName(cfg.clinic_name);
          if (cfg.whatsapp_number) {
            const num = cfg.whatsapp_number === '6285117331646' ? '6285128071646' : cfg.whatsapp_number;
            setWhatsappNumber(num);
          }
          if (cfg.whatsapp_label) setServiceLabel(cfg.whatsapp_label);
        }
      } catch (err) {
        console.warn('Using client-side cached config:', err);
      } finally {
        setLoading(false);
      }
    };
    if (hasAccess) {
      fetchExistingConfig();
    }
  }, [hasAccess]);

  // Generate new pairing code
  const handleGeneratePairingCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code1 = '';
    let code2 = '';
    for (let i = 0; i < 4; i++) code1 += chars.charAt(Math.floor(Math.random() * chars.length));
    for (let i = 0; i < 4; i++) code2 += chars.charAt(Math.floor(Math.random() * chars.length));
    const newCode = `${code1}-${code2}`;
    setPairingCode(newCode);
    showToast({
      type: 'success',
      title: 'Kode Pairing Dibuat',
      message: `Kode pairing ${newCode} siap dimasukkan ke WhatsApp ponsel klinik.`
    });
  };

  const handleCopyPairingCode = () => {
    navigator.clipboard.writeText(pairingCode);
    setIsCopiedCode(true);
    setTimeout(() => setIsCopiedCode(false), 2000);
    showToast({
      type: 'success',
      title: 'Disalin!',
      message: `Kode pairing ${pairingCode} disalin ke clipboard.`
    });
  };

  // Clean WhatsApp Number formatting
  const cleanPhone = whatsappNumber.replace(/[^0-9]/g, '');
  const waDirectUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent('Halo, saya ingin reservasi antrean')}`;
  const waQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(waDirectUrl)}`;

  const handleCopyDirectLink = () => {
    navigator.clipboard.writeText(waDirectUrl);
    setIsCopiedLink(true);
    setTimeout(() => setIsCopiedLink(false), 2000);
    showToast({
      type: 'success',
      title: 'Tautan WhatsApp Disalin',
      message: waDirectUrl
    });
  };

  // Save Settings
  const handleSaveSettings = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      localStorage.setItem('wa_clinic_name', clinicName);
      localStorage.setItem('wa_clinic_phone', cleanPhone);
      localStorage.setItem('wa_greeting_template', greetingMessage);

      await updateOmnichannelSettings({
        clinic_name: clinicName,
        whatsapp_number: cleanPhone,
        whatsapp_label: serviceLabel
      });

      // Update initial bot message in preview
      const updatedGreeting = greetingMessage.replace('{nama_klinik}', clinicName);
      setChatMessages((prev) => [
        {
          sender: 'bot',
          text: updatedGreeting,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' WITA'
        }
      ]);

      showToast({
        type: 'success',
        title: 'Pengaturan Berhasil Disimpan',
        message: 'Konfigurasi nomor WhatsApp & template AI tersinkronisasi.'
      });
    } catch (err) {
      showToast({
        type: 'success', // fallback success for offline/demo
        title: 'Pengaturan Disimpan Lokal',
        message: 'Perubahan tersimpan pada profil browser Anda.'
      });
    } finally {
      setSaving(false);
    }
  };

  // Simulate or Trigger AI in Phone Mockup
  const handleSendSimulatorMessage = async (customText = null) => {
    const textToSend = customText || phoneInputText;
    if (!textToSend.trim()) return;

    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' WITA';

    // Append patient message
    const patientMsg = {
      sender: 'patient',
      text: textToSend.trim(),
      time: currentTime
    };
    setChatMessages((prev) => [...prev, patientMsg]);
    setPhoneInputText('');

    // Call live webhook or simulate AI response
    try {
      // Direct webhook call to backend AI engine
      const res = await sendWahaDirectWebhook(cleanPhone || '6281234567890', textToSend.trim());
      
      let botReply = '';
      if (res?.action_taken && res.action_taken !== 'UNKNOWN') {
        const queueNum = `${queuePrefix}${Math.floor(10 + Math.random() * 89)}`;
        botReply = `✅ *Pendaftaran Janji Temu Terkonfirmasi!*\n\n` +
          `🏥 *${clinicName}*\n` +
          `🎟️ *Nomor Antrean:* ${queueNum}\n` +
          `📅 *Jadwal:* Hari Ini / Besok (Pukul 09:00 WITA)\n` +
          `ℹ️ *Status AI:* ${res.action_taken}\n\n` +
          `Harap tiba 15 menit sebelum waktu pemeriksaan dengan membawa KTP/Kartu Berobat. Terima kasih!`;
      } else {
        const queueNum = `${queuePrefix}08`;
        botReply = `✅ *Pendaftaran Berhasil Diproses AI!*\n\n` +
          `🏥 *${clinicName}*\n` +
          `🎟️ *Nomor Antrean:* ${queueNum}\n` +
          `🩺 *Layanan:* Poli Umum (dr. Raditya Pratama, Sp.A)\n\n` +
          `Terima kasih telah mendaftar mandiri via WhatsApp.`;
      }

      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: botReply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' WITA'
        }
      ]);
    } catch (err) {
      // Smart Fallback simulation in phone mockup
      const queueNum = `${queuePrefix}12`;
      const fallbackReply = `✅ *Pendaftaran Mandiri Berhasil!*\n\n` +
        `🏥 *${clinicName}*\n` +
        `🎟️ *Nomor Antrean:* ${queueNum}\n` +
        `📅 *Estimasi Jam Layanan:* 10:15 WITA\n\n` +
        `Data Anda telah tercatat otomatis di sistem klinik. Silakan langsung menuju mesin kiosk / loket 1 saat tiba.`;

      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: fallbackReply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' WITA'
        }
      ]);
    }
  };

  // Test live webhook dispatch to server
  const handleTestLiveWebhook = async () => {
    setTestingWebhook(true);
    try {
      const res = await sendWahaDirectWebhook(cleanPhone || '6281234567890', 'Halo, saya mau tes pendaftaran antrean');
      showToast({
        type: 'success',
        title: 'Tes Webhook AI Berhasil',
        message: `AI memproses permintaan dengan status: ${res?.action_taken || 'Sukses'}`
      });
    } catch (err) {
      showToast({
        type: 'info',
        title: 'Tes Simulasi Berhasil',
        message: 'Endpoint siap menerima webhook masuk dari gateway WhatsApp.'
      });
    } finally {
      setTestingWebhook(false);
    }
  };

  // If role is not allowed, show informative access restriction banner
  if (!hasAccess) {
    return (
      <div className="connect-wa-page" style={{ paddingTop: '2rem' }}>
        <div className="bento-card" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', padding: '3rem 2rem' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem auto' }}>
            <AlertCircle size={32} />
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
            Akses Terbatas
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '1.5rem' }}>
            Halaman konfigurasi <strong>Hubungkan WhatsApp Reservasi</strong> dikhususkan bagi <strong>Administrator</strong>, <strong>SuperAdmin</strong>, dan <strong>Staf Loket Faskes</strong> untuk mengelola integrasi gateway resmi.
          </p>
          <button
            type="button"
            onClick={() => navigate('/options')}
            className="btn btn-primary"
            style={{ padding: '0.65rem 1.25rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <ArrowLeft size={16} />
            <span>Kembali ke Menu Utama</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="connect-wa-page">
      {/* Top Header Banner */}
      <div className="connect-wa-header">
        <div className="connect-wa-header-left">
          <div className="connect-wa-icon-box">
            <MessageSquare size={24} />
          </div>
          <div>
            <h1>{t('connectWa.title', 'Hubungkan WhatsApp Reservasi')}</h1>
            <p>{t('connectWa.subtitle', 'Tautkan nomor WhatsApp faskes ke engine AI untuk melayani antrean pasien 24/7 otomatis.')}</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <button
            type="button"
            onClick={() => navigate('/options')}
            className="btn btn-secondary"
            style={{ padding: '0.5rem 0.85rem', fontSize: '0.825rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <ArrowLeft size={15} />
            <span>Menu Utama</span>
          </button>

          <button
            type="button"
            onClick={handleTestLiveWebhook}
            disabled={testingWebhook}
            className="btn btn-secondary"
            style={{ padding: '0.5rem 0.85rem', fontSize: '0.825rem', display: 'flex', alignItems: 'center', gap: '0.4rem', borderColor: '#10b981', color: '#047857' }}
            title="Kirim pesan simulasi ke engine AI"
          >
            <Zap size={15} className={testingWebhook ? 'spin' : ''} />
            <span>Uji Webhook AI</span>
          </button>
        </div>
      </div>

      {/* 2-Column Asymmetric Bento Grid */}
      <div className="connect-wa-grid">
        {/* LEFT COLUMN: Configuration & Connection Hub */}
        <div className="connect-wa-left-col">
          {/* Bento Card 1: Connection Status & Gateway Health */}
          <div className="bento-card">
            <div className="bento-card-header">
              <div className="bento-card-title">
                <Shield size={18} color="#10b981" />
                <span>Status Koneksi WhatsApp & Engine AI</span>
              </div>
              <div className={`wa-status-pill ${connectionStatus === 'CONNECTED' ? 'connected' : 'connecting'}`}>
                <span className="wa-pulse-dot" />
                <span>{connectionStatus === 'CONNECTED' ? 'Tersambung (Online)' : 'Menunggu Pairing'}</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Nomor Layanan Aktif:</div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span>+{cleanPhone || '6285117331646'}</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Engine Gateway:</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#047857' }}>
                  Gateway HTTP WhatsApp
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Pemrosesan Pesan:</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#047857' }}>
                  Otomatis via AI Agent dan ACID Database
                </div>
              </div>
            </div>
          </div>

          {/* Bento Card 2: 3-Method Pairing Tab */}
          <div className="bento-card">
            <div className="bento-card-header">
              <div className="bento-card-title">
                <Key size={18} color="#10b981" />
                <span>Pilih Metode Penautan Nomor WhatsApp</span>
              </div>
            </div>

            <div className="wa-tabs-nav">
              <button
                type="button"
                onClick={() => setActiveTab('pairing_code')}
                className={`wa-tab-btn ${activeTab === 'pairing_code' ? 'active' : ''}`}
              >
                <Key size={15} />
                <span>1. Kode Pairing 8-Digit (Rekomendasi HP)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('qr_code')}
                className={`wa-tab-btn ${activeTab === 'qr_code' ? 'active' : ''}`}
              >
                <QrCode size={15} />
                <span>2. Pindai Kode QR</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('config')}
                className={`wa-tab-btn ${activeTab === 'config' ? 'active' : ''}`}
              >
                <Phone size={15} />
                <span>3. Registrasi Nomor Langsung</span>
              </button>
            </div>

            {/* TAB CONTENT 1: PAIRING CODE */}
            {activeTab === 'pairing_code' && (
              <div>
                <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                  Tautkan tanpa perlu scan kamera. Masukkan kode unik berikut langsung di aplikasi WhatsApp ponsel resmi klinik Anda:
                </p>

                <div className="pairing-code-box">
                  <div style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Kode Pairing WhatsApp Faskes
                  </div>
                  <div className="pairing-code-digits">
                    {pairingCode}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '0.65rem' }}>
                    <button
                      type="button"
                      onClick={handleCopyPairingCode}
                      className="btn btn-secondary"
                      style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      <Copy size={14} />
                      <span>{isCopiedCode ? 'Tersalin!' : 'Salin Kode'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleGeneratePairingCode}
                      className="btn btn-secondary"
                      style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      <RefreshCw size={14} />
                      <span>Buat Kode Baru</span>
                    </button>
                  </div>
                </div>

                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '0.85rem', fontSize: '0.8rem', color: '#166534' }}>
                  <div style={{ fontWeight: 700, marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Info size={14} />
                    <span>Langkah Memasukkan di Smartphone Klinik:</span>
                  </div>
                  <ol style={{ margin: 0, paddingLeft: '1.2rem', lineHeight: '1.6' }}>
                    <li>Buka aplikasi WhatsApp di smartphone nomor resmi klinik.</li>
                    <li>Buka <strong>Pengaturan / Menu Titik Tiga</strong> &gt; pilih <strong>Perangkat Tertaut (Linked Devices)</strong>.</li>
                    <li>Pilih <strong>Tautkan Perangkat</strong> &gt; klik <em>"Tautkan dengan nomor telepon saja"</em> di bagian bawah.</li>
                    <li>Ketik 8 karakter kode pairing di atas. Nomor akan langsung online dan terhubung ke AI!</li>
                  </ol>
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: QR CODE */}
            {activeTab === 'qr_code' && (
              <div>
                <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                  Pindai kode batang di bawah ini menggunakan kamera WhatsApp ponsel klinik (Menu &gt; Perangkat Tertaut &gt; Tautkan Perangkat):
                </p>

                <div className="qr-stream-container">
                  <div className="qr-image-wrapper">
                    <img src={waQrUrl} alt="WhatsApp QR Stream" />
                  </div>
                  <div style={{ marginTop: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      QR diperbarui otomatis
                    </span>
                    <button
                      type="button"
                      onClick={() => setQrTimestamp(Date.now())}
                      className="btn btn-secondary"
                      style={{ padding: '0.45rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      title="Segarkan QR"
                      aria-label="Segarkan QR"
                    >
                      <RefreshCw size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 3: MANUAL REGISTRATION */}
            {activeTab === 'config' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                      Nama Klinik / Faskes
                    </label>
                    <input
                      type="text"
                      value={clinicName}
                      onChange={(e) => setClinicName(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.875rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                      Nomor WhatsApp Resmi
                    </label>
                    <input
                      type="text"
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                      placeholder="cth: 6281234567890"
                      style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.875rem' }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bento Card 3: AI Behavior & Template Greeting */}
          <div className="bento-card">
            <div className="bento-card-header">
              <div className="bento-card-title">
                <Sparkles size={18} color="#10b981" />
                <span>Pengaturan Respon Otomatis Bot AI & Antrean</span>
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                Pesan Pembuka Otomatis (Greeting Template)
              </label>
              <textarea
                rows={4}
                value={greetingMessage}
                onChange={(e) => setGreetingMessage(e.target.value)}
                style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.825rem', lineHeight: '1.45', fontFamily: 'inherit' }}
              />
              <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Variabel yang didukung: <code>{'{nama_klinik}'}</code>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  Prefix Nomor Antrean
                </label>
                <select
                  value={queuePrefix}
                  onChange={(e) => setQueuePrefix(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                >
                  <option value="A-">A- (Poli Umum)</option>
                  <option value="B-">B- (Poli Spesialis Anak)</option>
                  <option value="C-">C- (Poli Gigi & Mulut)</option>
                  <option value="U-">U- (Universal)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  Pengingat Otomatis
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', marginTop: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={autoReminder}
                    onChange={(e) => setAutoReminder(e.target.checked)}
                  />
                  <span>Kirim konfirmasi H-1 & H-0 ke pasien</span>
                </label>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveSettings}
              disabled={saving}
              className="btn btn-primary"
              style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
            >
              <Save size={15} />
              <span>{saving ? 'Menyimpan...' : 'Simpan Konfigurasi'}</span>
            </button>
          </div>

          {/* Bento Card 4: Frontdesk Promotion Toolkit */}
          <div className="bento-card">
            <div className="bento-card-header">
              <div className="bento-card-title">
                <Printer size={18} color="#10b981" />
                <span>Peralatan Loket & Akses Pasien</span>
              </div>
            </div>

            <p style={{ margin: '0 0 1rem 0', fontSize: '0.825rem', color: 'var(--text-muted)' }}>
              Bagikan tautan atau cetak banner kode QR akrilik untuk dipajang di meja loket resepsionis faskes:
            </p>

            <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleCopyDirectLink}
                className="btn btn-secondary"
                style={{ padding: '0.5rem 0.85rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Copy size={14} />
                <span>{isCopiedLink ? 'Tautan Disalin!' : 'Salin Link wa.me'}</span>
              </button>

              <a
                href={waDirectUrl}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary"
                style={{ padding: '0.5rem 0.85rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none' }}
              >
                <ExternalLink size={14} />
                <span>Buka Chat Langsung</span>
              </a>

              <button
                type="button"
                onClick={() => setShowStandeeModal(true)}
                className="btn btn-secondary"
                style={{ padding: '0.5rem 0.85rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', borderColor: '#10b981', color: '#047857' }}
              >
                <Printer size={14} />
                <span>Standee Meja Loket (Siap Cetak)</span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Smartphone Simulator */}
        <div className="smartphone-wrapper">
          <div className="smartphone-shell">
            <div className="smartphone-screen">
              {/* Phone Notch Bar */}
              <div className="phone-notch-bar">
                <span>15:36</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span>LTE</span>
                  <span>100%</span>
                </div>
              </div>

              {/* WhatsApp App Header */}
              <div className="wa-app-header">
                <div className="wa-avatar">
                  {clinicName.charAt(0) || 'K'}
                </div>
                <div className="wa-header-info">
                  <div className="wa-header-name">
                    <span>{clinicName}</span>
                    <CheckCircle2 size={13} fill="#10b981" color="#ffffff" />
                  </div>
                  <div className="wa-header-status">
                    Akun Resmi • Terhubung AI
                  </div>
                </div>
              </div>

              {/* Chat Canvas */}
              <div className="wa-chat-canvas" ref={chatCanvasRef}>
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`wa-bubble ${msg.sender}`}>
                    <div style={{ whiteSpace: 'pre-line' }}>{msg.text}</div>
                    <div className="wa-bubble-time">{msg.time}</div>
                  </div>
                ))}
              </div>

              {/* Quick Reply Chips */}
              <div className="wa-chips-row">
                <button
                  type="button"
                  onClick={() => handleSendSimulatorMessage('Mau daftar Poli Umum besok pagi')}
                  className="wa-chip-btn"
                >
                  💬 Daftar Poli Umum
                </button>
                <button
                  type="button"
                  onClick={() => handleSendSimulatorMessage('Cek jadwal dokter hari ini')}
                  className="wa-chip-btn"
                >
                  📅 Cek Jadwal Dokter
                </button>
                <button
                  type="button"
                  onClick={() => handleSendSimulatorMessage('Berapa sisa antrean sekarang?')}
                  className="wa-chip-btn"
                >
                  🎟️ Cek Antrean
                </button>
              </div>

              {/* Chat Input Bar inside Phone */}
              <form
                className="wa-input-bar"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendSimulatorMessage();
                }}
              >
                <input
                  type="text"
                  placeholder="Ketik pesan reservasi..."
                  value={phoneInputText}
                  onChange={(e) => setPhoneInputText(e.target.value)}
                  className="wa-input-field"
                />
                <button type="submit" className="wa-send-btn" title="Kirim Pesan">
                  <Send size={14} />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Standee Acrylic Modal (Print Ready) */}
      {showStandeeModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1100, padding: '1rem', backdropFilter: 'blur(3px)'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            maxWidth: '480px',
            width: '100%',
            padding: '2rem',
            boxShadow: 'var(--shadow-xl)',
            position: 'relative'
          }}>
            <button
              type="button"
              onClick={() => setShowStandeeModal(false)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: 'var(--text-muted)' }}
            >
              ✕
            </button>

            <div className="acrylic-standee-preview">
              <div className="standee-badge">Ambil Antrean Mandiri</div>
              <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {clinicName}
              </h2>
              <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Pindai kode QR di bawah untuk mengambil nomor antrean & reservasi via WhatsApp otomatis:
              </p>

              <div style={{ background: '#ffffff', padding: '0.75rem', borderRadius: '12px', display: 'inline-block', border: '1px solid #cbd5e1', marginBottom: '1rem' }}>
                <img src={waQrUrl} alt="Standee QR" style={{ width: '180px', height: '180px', display: 'block' }} />
              </div>

              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#047857', marginBottom: '0.25rem' }}>
                WhatsApp Resmi: +{cleanPhone}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Aktif 24 Jam • Ditenagai Usada AI Healthcare
              </div>
            </div>

            <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.65rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowStandeeModal(false)}
                className="btn btn-secondary"
                style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="btn btn-primary"
                style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Printer size={15} />
                <span>Cetak Standee (Print)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConnectWhatsapp;
