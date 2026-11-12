import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  MessageSquare, Globe, Send, Mail, QrCode, Key, Phone, CheckCircle2,
  AlertCircle, Copy, ExternalLink, Printer, RefreshCw, Sparkles, Shield,
  ArrowLeft, Clock, Save, Smartphone, ChevronRight, Zap, Info, Layers,
  Code, Bot, Check, ArrowUpRight, Search, Filter, Calendar, Activity,
  ListChecks, AlertTriangle, Users, ChevronDown, CheckCheck, X, Pencil
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import {
  getOmnichannelStatus,
  getOmnichannelSettings,
  updateOmnichannelSettings,
  sendOmnichannelTestDispatch,
  getOmnichannelLogs,
  getWhatsappAiSummary,
  chatWithAiAgent,
  relinkWahaSession
} from '../services/api';
import ReservationLogsSection from '../components/connect-reservation/ReservationLogsSection';
import WhatsappAiSummarySection from '../components/connect-reservation/WhatsappAiSummarySection';
import TestDispatchModal from '../components/connect-reservation/TestDispatchModal';
import StandeeModal from '../components/connect-reservation/StandeeModal';
import './ConnectReservation.css';

const ConnectReservation = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { showToast } = useNotification();

  // Role Guard: Restrict only patient role from internal integration settings
  const hasAccess = !user || user.role !== 'patient';

  // Top Workspace Tab: 'channels' | 'logs' | 'summary'
  const initialWorkspaceTab = searchParams.get('tab') || 'channels';
  const [workspaceTab, setWorkspaceTab] = useState(initialWorkspaceTab);

  useEffect(() => {
    const currentTab = searchParams.get('tab');
    if (currentTab && ['channels', 'logs', 'summary'].includes(currentTab)) {
      setWorkspaceTab(currentTab);
    }
  }, [searchParams]);

  // Sync tab with URL search parameter
  const handleSelectWorkspaceTab = (tabKey) => {
    setWorkspaceTab(tabKey);
    setSearchParams({ tab: tabKey });
  };

  // Channel Configuration Tabs inside 'channels' workspace
  const [activeChannelTab, setActiveChannelTab] = useState('whatsapp'); // 'whatsapp', 'website', 'telegram', 'gmail'
  const [waMethod, setWaMethod] = useState('pairing'); // 'pairing' | 'qr'

  // Loading States
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testingDispatch, setTestingDispatch] = useState(false);

  // Channel Settings
  const [clinicName, setClinicName] = useState(() => localStorage.getItem('omni_clinic_name') || 'Ternak AI Healthcare Partner');
  
  // WhatsApp States
  const [whatsappNumber, setWhatsappNumber] = useState(() => {
    const saved = localStorage.getItem('omni_wa_phone');
    if (saved === '6285117331646' || !saved) {
      localStorage.setItem('omni_wa_phone', '6285128071646');
      return '6285128071646';
    }
    return saved;
  });
  const [serviceLabel, setServiceLabel] = useState(() => localStorage.getItem('omni_wa_label') || 'Ternak Automation');
  const [wahaSessionName, setWahaSessionName] = useState(() => localStorage.getItem('omni_wa_session') || 'Ternak-Automation');
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [waViewMode, setWaViewMode] = useState('overview');
  const [connectionStatus, setConnectionStatus] = useState('CONNECTED'); // 'CONNECTED', 'SCAN_QR', 'DISCONNECTED'
  const [pairingCode, setPairingCode] = useState('USAD-8924');
  const [greetingMessage, setGreetingMessage] = useState(
    () => localStorage.getItem('omni_wa_greeting') ||
    `Halo! Selamat datang di layanan pendaftaran & reservasi mandiri {nama_klinik}.\n\nKetik poliklinik tujuan seperti Poli Umum, Poli Anak, Poli Gigi dan tanggal berobat. Sistem AI kami akan otomatis menerbitkan nomor antrean resmi Anda! 🩺✨`
  );

  // Website Widget States
  const [widgetColor, setWidgetColor] = useState('emerald'); // 'emerald', 'teal', 'blue'
  const [widgetPosition, setWidgetPosition] = useState('bottom-right');
  const [widgetTitle, setWidgetTitle] = useState('Reservasi & Antrean Online');

  // Telegram States (Simple 3 Steps)
  const [telegramToken, setTelegramToken] = useState(() => localStorage.getItem('omni_tele_token') || '789123456:AAFlk90...');
  const [telegramUsername, setTelegramUsername] = useState(() => localStorage.getItem('omni_tele_user') || 'KlinikSehatBot');

  // Gmail / Email States
  const [clinicEmail, setClinicEmail] = useState(() => localStorage.getItem('omni_clinic_email') || 'reservasi@sehatsejahtera.com');
  const [emailSubjectPrefix, setEmailSubjectPrefix] = useState('[RESERVASI KLINIK]');

  // Live Simulator States
  const [simulatorChannel, setSimulatorChannel] = useState('whatsapp'); // 'whatsapp', 'website', 'telegram', 'gmail'
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'bot',
      text: `Halo! Selamat datang di layanan reservasi mandiri ${clinicName}.\n\nKetik poliklinik tujuan atau pilih opsi di bawah untuk mengambil nomor antrean:`,
      time: '15:30 WITA'
    }
  ]);
  const [simulatorInputText, setSimulatorInputText] = useState('');
  const chatCanvasRef = useRef(null);

  // Logs Workspace States (Tab 2)
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logChannelFilter, setLogChannelFilter] = useState('all'); // 'all', 'whatsapp', 'telegram', 'gmail', 'web'
  const [logVerdictFilter, setLogVerdictFilter] = useState('all'); // 'all', 'REPLIED_BY_AI', 'REPLIED_FALLBACK', 'ESCALATED_HUMAN', 'SUPPRESSED_IGNORED'
  const [searchLogText, setSearchLogText] = useState('');

  // TypeSafe Jev Filter States
  const [aiChatFilterEnabled, setAiChatFilterEnabled] = useState(true);
  const [irrelevantReplyEnabled, setIrrelevantReplyEnabled] = useState(true);
  const [irrelevantFallbackText, setIrrelevantFallbackText] = useState(
    'Halo, terima kasih telah menghubungi kami. Nomor ini khusus melayani pendaftaran mandiri dan informasi layanan poliklinik resmi. Silakan sebutkan poliklinik dan rencana tanggal kunjungan Anda.'
  );
  const [humanHandoverCooldownHours, setHumanHandoverCooldownHours] = useState(2);
  const [typesafeApiKey, setTypesafeApiKey] = useState('');
  const [savingJev, setSavingJev] = useState(false);

  // Summary Workspace States (Tab 3)
  const [summaryTimeframe, setSummaryTimeframe] = useState('week'); // 'day', 'week', 'month'
  const [summaryData, setSummaryData] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  // UI Utilities
  const [isCopiedCode, setIsCopiedCode] = useState(false);
  const [isCopiedLink, setIsCopiedLink] = useState(false);
  const [isCopiedEmbed, setIsCopiedEmbed] = useState(false);
  const [qrTimestamp, setQrTimestamp] = useState(Date.now());
  const [qrLoadError, setQrLoadError] = useState(false);
  const [isQrLoading, setIsQrLoading] = useState(true);
  const [qrRetryCount, setQrRetryCount] = useState(0);
  const [showStandeeModal, setShowStandeeModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [testTargetPhone, setTestTargetPhone] = useState('');
  const [testMessageText, setTestMessageText] = useState('');

  // Auto-scroll simulator chat
  useEffect(() => {
    if (chatCanvasRef.current) {
      chatCanvasRef.current.scrollTop = chatCanvasRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Load configuration on mount
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
          if (st.whatsapp.status) setConnectionStatus(st.whatsapp.status === 'CONNECTED' ? 'CONNECTED' : 'DISCONNECTED');
          if (st.whatsapp.details?.service_label) setServiceLabel(st.whatsapp.details.service_label);
          if (st.whatsapp.details?.session_name) setWahaSessionName(st.whatsapp.details.session_name);
        }
        if (st?.telegram?.bot_username) {
          setTelegramUsername(st.telegram.bot_username.replace('@', ''));
        }
        if (st?.gmail?.account_or_identifier) {
          setClinicEmail(st.gmail.account_or_identifier);
        }

        const cfg = await getOmnichannelSettings();
        if (cfg) {
          if (cfg.clinic_name) setClinicName(cfg.clinic_name);
          if (cfg.whatsapp_number) {
            const num = cfg.whatsapp_number === '6285117331646' ? '6285128071646' : cfg.whatsapp_number;
            setWhatsappNumber(num);
          }
          if (cfg.whatsapp_label) setServiceLabel(cfg.whatsapp_label);
          if (cfg.waha_session_name) setWahaSessionName(cfg.waha_session_name);
          if (cfg.telegram_bot_username) setTelegramUsername(cfg.telegram_bot_username.replace('@', ''));
          if (cfg.gmail_target_email) setClinicEmail(cfg.gmail_target_email);
          if (cfg.ai_chat_filter_enabled !== undefined) setAiChatFilterEnabled(Boolean(cfg.ai_chat_filter_enabled));
          if (cfg.irrelevant_reply_enabled !== undefined) setIrrelevantReplyEnabled(Boolean(cfg.irrelevant_reply_enabled));
          if (cfg.irrelevant_fallback_text) setIrrelevantFallbackText(cfg.irrelevant_fallback_text);
          if (cfg.human_handover_cooldown_hours) setHumanHandoverCooldownHours(cfg.human_handover_cooldown_hours);
          if (cfg.typesafe_api_key_masked) setTypesafeApiKey(cfg.typesafe_api_key_masked);
        }
      } catch (err) {
        console.warn('Using local cached config:', err);
      } finally {
        setLoading(false);
      }
    };

    if (hasAccess) {
      fetchExistingConfig();
    }
  }, [hasAccess]);

  // Fetch Message Logs (Tab 2)
  const fetchMessageLogs = async (ch = logChannelFilter, vd = logVerdictFilter) => {
    setLoadingLogs(true);
    try {
      const res = await getOmnichannelLogs(ch, 60, vd);
      setLogs(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (workspaceTab === 'logs' && hasAccess) {
      fetchMessageLogs(logChannelFilter, logVerdictFilter);
    }
  }, [workspaceTab, logChannelFilter, logVerdictFilter, hasAccess]);

  // Fetch AI Summary (Tab 3)
  const fetchAISummary = async (tf = summaryTimeframe) => {
    setLoadingSummary(true);
    try {
      const res = await getWhatsappAiSummary(tf);
      setSummaryData(res);
    } catch (err) {
      console.error('Error fetching summary:', err);
    } finally {
      setLoadingSummary(false);
    }
  };

  useEffect(() => {
    if (workspaceTab === 'summary' && hasAccess) {
      fetchAISummary(summaryTimeframe);
    }
  }, [workspaceTab, summaryTimeframe, hasAccess]);

  // Clean WhatsApp Number & Endpoints
  const cleanPhone = whatsappNumber.replace(/[^0-9]/g, '');
  const apiHost = import.meta.env.VITE_API_BASE_URL || `http://${window.location.hostname}:8001`;
  const wahaQrEndpoint = `${apiHost}/api/connectors/whatsapp/qr`;
  const waDirectUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent('Halo, saya ingin reservasi antrean')}`;
  const waDirectQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(waDirectUrl)}`;

  // Auto refresh WAHA QR code every 25 seconds when in QR mode
  useEffect(() => {
    if (activeChannelTab !== 'whatsapp') return;
    const isShowingQr = (connectionStatus !== 'CONNECTED' && waMethod === 'qr') || waViewMode === 'hospital_doctor_qr';
    if (!isShowingQr) return;

    const interval = setInterval(() => {
      setIsQrLoading((prevLoading) => {
        if (!prevLoading) {
          setQrTimestamp(Date.now());
          setQrLoadError(false);
          setQrRetryCount(0);
          return true;
        }
        return prevLoading;
      });
    }, 10000);

    return () => clearInterval(interval);
  }, [activeChannelTab, waMethod, connectionStatus, waViewMode]);

  // Polling WhatsApp connection state to detect pairing success
  useEffect(() => {
    if (activeChannelTab !== 'whatsapp') return;
    const shouldPoll = connectionStatus !== 'CONNECTED' || waViewMode === 'hospital_doctor_qr';
    if (!shouldPoll) return;

    const pollStatus = async () => {
      try {
        const st = await getOmnichannelStatus();
        if (st?.whatsapp?.status === 'CONNECTED' || st?.whatsapp?.status === 'WORKING') {
          setConnectionStatus('CONNECTED');
          if (st.whatsapp.account_or_identifier) setWhatsappNumber(st.whatsapp.account_or_identifier);
          if (st.whatsapp.details?.service_label) setServiceLabel(st.whatsapp.details.service_label);
          if (st.whatsapp.details?.session_name) setWahaSessionName(st.whatsapp.details.session_name);
        }
      } catch (err) {
        // silent fallback
      }
    };

    const interval = setInterval(pollStatus, 6000);
    return () => clearInterval(interval);
  }, [activeChannelTab, connectionStatus, waViewMode, showToast]);

  // Telegram Direct Link
  const teleDirectUrl = `https://t.me/${telegramUsername.replace('@', '')}`;

  // Website Embed Code
  const embedCodeSnippet = `<!-- Widget Reservasi Mandiri ${clinicName} -->\n<script \n  src="${window.location.origin}/widget/reservation.js" \n  data-clinic="${clinicName}"\n  data-theme="${widgetColor}"\n  data-position="${widgetPosition}"\n  async>\n</script>`;

  // Pairing Code Generator
  const handleGeneratePairingCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let c1 = '';
    let c2 = '';
    for (let i = 0; i < 4; i++) c1 += chars.charAt(Math.floor(Math.random() * chars.length));
    for (let i = 0; i < 4; i++) c2 += chars.charAt(Math.floor(Math.random() * chars.length));
    const newCode = `${c1}-${c2}`;
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

  const handleCopyLink = (url, label = 'Tautan') => {
    navigator.clipboard.writeText(url);
    setIsCopiedLink(true);
    setTimeout(() => setIsCopiedLink(false), 2000);
    showToast({
      type: 'success',
      title: `${label} Disalin`,
      message: url
    });
  };

  const handleCopyEmbedCode = () => {
    navigator.clipboard.writeText(embedCodeSnippet);
    setIsCopiedEmbed(true);
    setTimeout(() => setIsCopiedEmbed(false), 2000);
    showToast({
      type: 'success',
      title: 'Kode Script Disalin',
      message: 'Tempelkan kode sebelum tag </body> pada website klinik Anda.'
    });
  };

  // Save Settings
  const handleSaveSettings = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      localStorage.setItem('omni_clinic_name', clinicName);
      localStorage.setItem('omni_wa_phone', cleanPhone);
      localStorage.setItem('omni_wa_label', serviceLabel);
      localStorage.setItem('omni_wa_session', wahaSessionName);
      localStorage.setItem('omni_wa_greeting', greetingMessage);
      localStorage.setItem('omni_tele_token', telegramToken);
      localStorage.setItem('omni_tele_user', telegramUsername);
      localStorage.setItem('omni_clinic_email', clinicEmail);

      await updateOmnichannelSettings({
        clinic_name: clinicName,
        whatsapp_number: cleanPhone,
        whatsapp_label: serviceLabel,
        waha_session_name: wahaSessionName,
        telegram_bot_token: telegramToken,
        telegram_bot_username: telegramUsername,
        gmail_target_email: clinicEmail,
        ai_chat_filter_enabled: aiChatFilterEnabled,
        irrelevant_reply_enabled: irrelevantReplyEnabled,
        irrelevant_fallback_text: irrelevantFallbackText,
        human_handover_cooldown_hours: parseInt(humanHandoverCooldownHours, 10) || 2,
        typesafe_api_key: typesafeApiKey && typesafeApiKey !== '••••••••' ? typesafeApiKey : undefined
      });

      showToast({
        type: 'success',
        title: 'Pengaturan Tersimpan',
        message: t('whatsapp.wahaControlQr.saveSuccess', 'Pengaturan saluran WhatsApp dan sesi gateway berhasil disimpan.')
      });
      setIsEditingSettings(false);
    } catch (err) {
      showToast({
        type: 'success',
        title: 'Pengaturan Disimpan Lokal',
        message: 'Perubahan tersimpan pada profil kerja klinik Anda.'
      });
      setIsEditingSettings(false);
    } finally {
      setSaving(false);
    }
  };

  // Save TypeSafe Jev Relevance Filter Settings
  const handleSaveJevSettings = async () => {
    setSavingJev(true);
    try {
      await updateOmnichannelSettings({
        ai_chat_filter_enabled: aiChatFilterEnabled,
        irrelevant_reply_enabled: irrelevantReplyEnabled,
        irrelevant_fallback_text: irrelevantFallbackText,
        human_handover_cooldown_hours: parseInt(humanHandoverCooldownHours, 10) || 2,
        typesafe_api_key: typesafeApiKey && typesafeApiKey !== '••••••••' ? typesafeApiKey : undefined
      });
      showToast({
        type: 'success',
        title: 'Filter Jev Disimpan',
        message: 'Pengaturan filter relevansi TypeSafe Jev berhasil diperbarui.'
      });
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Gagal Menyimpan',
        message: err?.message || 'Terjadi kesalahan saat menyimpan pengaturan filter Jev.'
      });
    } finally {
      setSavingJev(false);
    }
  };

  const [relinking, setRelinking] = useState(false);

  // Relink WAHA session by resetting old login and displaying fresh QR
  const handleRelinkDevice = async () => {
    setRelinking(true);
    try {
      await relinkWahaSession(wahaSessionName);
      showToast({
        type: 'info',
        title: 'Sesi Gateway Disetel Ulang',
        message: `Sesi lama berhasil diputuskan. Silakan pindai QR code baru menggunakan ponsel nomor ${cleanPhone || '6285128071646'}.`
      });
    } catch (err) {
      // Fallback in case of timeout or already disconnected
    } finally {
      setRelinking(false);
      setWaViewMode('hospital_doctor_qr');
      setIsQrLoading(true);
      setQrLoadError(false);
      setQrRetryCount(0);
      setQrTimestamp(Date.now());
    }
  };

  // Test Dispatch
  const handleTestDispatch = async (channel) => {
    if (channel === 'whatsapp') {
      setTestTargetPhone('');
      setTestMessageText(`Halo dari ${clinicName}! Ini adalah pesan uji verifikasi saluran WhatsApp Reservasi Mandiri.`);
      setShowTestModal(true);
      return;
    }

    setTestingDispatch(true);
    try {
      let target = cleanPhone;
      let msg = `Tes pesan verifikasi saluran ${channel.toUpperCase()} dari ${clinicName}`;
      if (channel === 'telegram') target = telegramUsername;
      if (channel === 'gmail') target = clinicEmail;

      await sendOmnichannelTestDispatch(channel, target, msg);
      showToast({
        type: 'success',
        title: `Uji Coba ${channel.toUpperCase()} Terkirim`,
        message: `Pesan uji verifikasi telah dikirim ke target: ${target}`
      });
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Pengujian Gagal',
        message: err?.response?.data?.detail || err?.message || 'Terjadi kesalahan saat memproses pengujian saluran.'
      });
    } finally {
      setTestingDispatch(false);
    }
  };

  // Execute Real WhatsApp Test Dispatch from Modal
  const handleExecuteTestDispatch = async () => {
    if (!testTargetPhone.trim()) {
      showToast({
        type: 'error',
        title: 'Nomor Tujuan Kosong',
        message: 'Silakan masukkan nomor WhatsApp tujuan pengujian.'
      });
      return;
    }

    setTestingDispatch(true);
    try {
      const cleanTarget = testTargetPhone.replace(/[^0-9]/g, '');
      const defaultMsg = `Tes pesan verifikasi WhatsApp dari ${clinicName}`;
      const msgToSend = testMessageText.trim() || defaultMsg;

      const res = await sendOmnichannelTestDispatch('whatsapp', cleanTarget, msgToSend);
      if (res && res.status === 'SUCCESS') {
        showToast({
          type: 'success',
          title: 'Pesan Terkirim Nyata',
          message: `Pesan uji coba berhasil dikirim ke nomor +${cleanTarget}. ID Pengiriman: ${res.delivery_id || 'OK'}`
        });
        setShowTestModal(false);
      } else {
        showToast({
          type: 'error',
          title: 'Gagal Mengirim',
          message: res?.message || 'Gateway WhatsApp gagal memproses pengiriman ke nomor tujuan.'
        });
      }
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Pengiriman Gagal',
        message: err?.response?.data?.detail || err?.message || 'Terjadi gangguan koneksi pada gateway WhatsApp.'
      });
    } finally {
      setTestingDispatch(false);
    }
  };

  // Simulator Message Sending
  const handleSendSimulatorMessage = async (customText = null) => {
    const textToSend = customText || simulatorInputText;
    if (!textToSend.trim()) return;

    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' WITA';

    const patientMsg = {
      sender: 'patient',
      text: textToSend.trim(),
      time: currentTime
    };

    setChatMessages((prev) => [...prev, patientMsg]);
    if (!customText) setSimulatorInputText('');

    const lower = textToSend.toLowerCase();

    // Check specific intent locally or hit AI backend
    setTimeout(async () => {
      let botReply = '';
      if (lower.includes('umum') || lower.includes('daftar') || lower.includes('poli')) {
        const ticketNum = 'A-' + Math.floor(10 + Math.random() * 89);
        botReply = `✅ *Pendaftaran Berhasil Terverifikasi!*\n\n🏥 *Klinik*: ${clinicName}\n👤 *Poliklinik*: Poli Umum\n📅 *Jadwal*: Besok Pagi, 09:00 WITA\n🎫 *Nomor Antrean*: *${ticketNum}*\n\nSilakan datang 15 menit sebelum waktu periksa. Tunjukkan bukti ini ke loket penerimaan.`;
      } else if (lower.includes('dokter') || lower.includes('jadwal')) {
        botReply = `🩺 *Jadwal Praktek Dokter Spesialis Hari Ini:*\n\n1. dr. I Wayan Pratama, Sp.PD - Poli Penyakit Dalam: 08:30 - 14:00 WITA\n2. dr. Ni Made Dewi, Sp.A - Poli Anak: 09:00 - 15:30 WITA\n3. dr. Putu Arya, Sp.B - Poli Bedah: 13:00 - 18:00 WITA\n\nKetik nama dokter atau poli tujuan untuk mendaftar langsung.`;
      } else if (lower.includes('kuota') || lower.includes('sisa')) {
        botReply = `📊 *Status Kuota Antrean Saat Ini:*\n• Poli Umum: Sisa 12 kuota\n• Poli Anak: Sisa 5 kuota\n• Poli Gigi: Sisa 8 kuota\n\nLayanan reservasi mandiri masih dibuka.`;
      } else {
        try {
          const res = await chatWithAiAgent(textToSend.trim(), simulatorChannel, cleanPhone);
          botReply = res?.response || `Terima kasih! Pesan Anda telah diterima oleh sistem pendaftaran mandiri ${clinicName}.`;
        } catch {
          botReply = `Halo! Pesan Anda telah diterima oleh asisten reservasi ${clinicName}. Silakan sebutkan poliklinik dan tanggal untuk reservasi nomor antrean.`;
        }
      }

      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: botReply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' WITA'
        }
      ]);
    }, 600);
  };

  // Filtered Message Logs
  const filteredLogs = logs.filter((l) => {
    if (logVerdictFilter !== 'all' && l.filter_verdict && l.filter_verdict.toUpperCase() !== logVerdictFilter.toUpperCase()) {
      return false;
    }
    if (!searchLogText.trim()) return true;
    const q = searchLogText.toLowerCase();
    return (
      (l.phone && l.phone.toLowerCase().includes(q)) ||
      (l.message_text && l.message_text.toLowerCase().includes(q)) ||
      (l.channel && l.channel.toLowerCase().includes(q)) ||
      (l.stage_or_intent && l.stage_or_intent.toLowerCase().includes(q)) ||
      (l.filter_verdict && l.filter_verdict.toLowerCase().includes(q)) ||
      (l.intent_category && l.intent_category.toLowerCase().includes(q))
    );
  });

  // Role Protection
  if (!hasAccess) {
    return (
      <div className="cr-denied-container">
        <Shield size={48} className="cr-denied-icon" />
        <h2>Akses Terbatas</h2>
        <p>Halaman Connect &amp; AI Reservation hanya dapat dikonfigurasi oleh SuperAdmin, Administrator, dan Staf Loket faskes.</p>
        <button className="cr-btn-primary" onClick={() => navigate('/options')}>
          Kembali ke Menu Utama
        </button>
      </div>
    );
  }

  return (
    <div className="cr-page-wrapper">

      {/* ========================================================================= */}
      {/* WORKSPACE TAB 1: CONNECT CHANNELS & SIMULATOR                             */}
      {/* ========================================================================= */}
      {workspaceTab === 'channels' && (
        <div className="cr-bento-grid">
          {/* Left Column: Channels Configuration Hub */}
          <div className="cr-left-column">
            
            {/* Channel Tabs Bar (Underline Style) */}
            <div className="cr-channel-tabs-bar" role="tablist" aria-label="Reservation Channels">
              <button
                type="button"
                role="tab"
                aria-selected={activeChannelTab === 'whatsapp'}
                title="WhatsApp"
                aria-label="WhatsApp Channel"
                className={`cr-channel-tab ${activeChannelTab === 'whatsapp' ? 'active tab-wa' : ''}`}
                onClick={() => { setActiveChannelTab('whatsapp'); setSimulatorChannel('whatsapp'); }}
              >
                <img src="/icons/WA.webp" alt="WhatsApp" className="cr-channel-tab-icon" />
                <span className="cr-channel-label">WhatsApp</span>
                <span className={`cr-channel-status-dot ${connectionStatus === 'CONNECTED' ? 'online' : 'warn'}`}></span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeChannelTab === 'website'}
                title="Website"
                aria-label="Website Channel"
                className={`cr-channel-tab ${activeChannelTab === 'website' ? 'active tab-web' : ''}`}
                onClick={() => { setActiveChannelTab('website'); setSimulatorChannel('website'); }}
              >
                <img src="/icons/Website.svg" alt="Website" className="cr-channel-tab-icon" />
                <span className="cr-channel-label">Website</span>
                <span className="cr-channel-status-dot online"></span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeChannelTab === 'telegram'}
                title="Telegram"
                aria-label="Telegram Channel"
                className={`cr-channel-tab ${activeChannelTab === 'telegram' ? 'active tab-tele' : ''}`}
                onClick={() => { setActiveChannelTab('telegram'); setSimulatorChannel('telegram'); }}
              >
                <img src="/icons/Telegram.webp" alt="Telegram" className="cr-channel-tab-icon" />
                <span className="cr-channel-label">Telegram</span>
                <span className="cr-channel-status-dot ready"></span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeChannelTab === 'gmail'}
                title="Gmail"
                aria-label="Gmail Channel"
                className={`cr-channel-tab ${activeChannelTab === 'gmail' ? 'active tab-gmail' : ''}`}
                onClick={() => { setActiveChannelTab('gmail'); setSimulatorChannel('gmail'); }}
              >
                <img src="/icons/Gmail.webp" alt="Gmail" className="cr-channel-tab-icon" />
                <span className="cr-channel-label">Gmail</span>
                <span className="cr-channel-status-dot online"></span>
              </button>
            </div>

            {/* TAB 1: WHATSAPP */}
            {activeChannelTab === 'whatsapp' && (
              <div className="cr-tab-content-card">
                <div className="cr-card-header">
                  <h3 className="cr-card-title">WhatsApp</h3>
                  <div className={`cr-gateway-badge ${connectionStatus === 'CONNECTED' ? 'wa-connected' : 'wa-scan'}`}>
                    <CheckCircle2 size={14} />
                    <span>{connectionStatus === 'CONNECTED' ? 'Terhubung' : 'Scan QR'}</span>
                  </div>
                </div>

                {/* Mode 1: Sesi Terhubung Aktif (Overview) */}
                {connectionStatus === 'CONNECTED' && waViewMode === 'overview' && (
                  <div className="cr-connected-gateway-card">
                    <div className="cr-connected-gateway-header">
                      <div className="cr-connected-gateway-title">
                        <CheckCircle2 size={18} color="#059669" />
                        <span>WhatsApp Gateway Aktif dan Terhubung</span>
                      </div>
                      <div className="cr-header-actions-group">
                        <span className="cr-qr-timer-pill cr-gateway-online-pill" style={{ color: '#047857', background: '#dcfce7', borderColor: '#86efac' }}>
                          Gateway Online
                        </span>
                        <button
                          type="button"
                          className="cr-header-edit-btn"
                          onClick={() => setIsEditingSettings((prev) => !prev)}
                          title={isEditingSettings ? t('whatsapp.wahaControlQr.cancelEditBtn', 'Batal') : t('whatsapp.wahaControlQr.editTooltip', 'Ubah Pengaturan Saluran WhatsApp')}
                        >
                          {isEditingSettings ? <X size={14} /> : <Pencil size={14} />}
                        </button>
                      </div>
                    </div>

                    <div className="cr-connected-meta-grid">
                      <div>
                        <div className="cr-meta-item-label">{t('whatsapp.wahaControlQr.clinicNameLabel', 'Nama Faskes')}</div>
                        {isEditingSettings ? (
                          <input
                            type="text"
                            className="cr-inline-input"
                            value={clinicName}
                            onChange={(e) => setClinicName(e.target.value)}
                            placeholder={t('whatsapp.wahaControlQr.clinicNamePlaceholder', 'Contoh: RSUP Ngoerah')}
                          />
                        ) : (
                          <div className="cr-meta-item-val">{clinicName || 'Ternak AI Healthcare Partner'}</div>
                        )}
                      </div>
                      <div>
                        <div className="cr-meta-item-label">{t('whatsapp.wahaControlQr.phoneLabel', 'Nomor Layanan Aktif')}</div>
                        {isEditingSettings ? (
                          <input
                            type="text"
                            inputMode="numeric"
                            className="cr-inline-input"
                            value={whatsappNumber}
                            onChange={(e) => setWhatsappNumber(e.target.value)}
                            placeholder={t('whatsapp.wahaControlQr.phonePlaceholder', 'Contoh: 6285128071646')}
                          />
                        ) : (
                          <div className="cr-meta-item-val">+{cleanPhone || '6285128071646'}</div>
                        )}
                      </div>
                      <div>
                        <div className="cr-meta-item-label">{t('whatsapp.wahaControlQr.accountNameLabel', 'Nama Akun WhatsApp')}</div>
                        {isEditingSettings ? (
                          <input
                            type="text"
                            className="cr-inline-input"
                            value={serviceLabel}
                            onChange={(e) => setServiceLabel(e.target.value)}
                            placeholder={t('whatsapp.wahaControlQr.accountNamePlaceholder', 'Contoh: RS Bali Royal Hotline')}
                          />
                        ) : (
                          <div className="cr-meta-item-val">{serviceLabel || 'Ternak Automation'}</div>
                        )}
                      </div>
                      <div>
                        <div className="cr-meta-item-label">{t('whatsapp.wahaControlQr.sessionNameLabel', 'Sesi Gateway Resmi')}</div>
                        {isEditingSettings ? (
                          <input
                            type="text"
                            className="cr-inline-input"
                            value={wahaSessionName}
                            onChange={(e) => setWahaSessionName(e.target.value)}
                            placeholder={t('whatsapp.wahaControlQr.sessionNamePlaceholder', 'Contoh: Ternak-Automation')}
                          />
                        ) : (
                          <div className="cr-meta-item-val">{wahaSessionName || 'Ternak-Automation'}</div>
                        )}
                      </div>
                    </div>

                    <div className="cr-connected-actions-bar">
                      {isEditingSettings ? (
                        <>
                          <button
                            type="button"
                            className="btn btn-primary"
                            onClick={handleSaveSettings}
                            disabled={saving}
                          >
                            <Save size={15} />
                            <span>{saving ? t('whatsapp.wahaControlQr.savingBtn', 'Menyimpan...') : t('whatsapp.wahaControlQr.saveBtn', 'Simpan Pengaturan')}</span>
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => handleTestDispatch('whatsapp')}
                            disabled={testingDispatch}
                          >
                            <Send size={15} />
                            <span>{t('whatsapp.wahaControlQr.testBtn', 'Uji Kirim Pesan')}</span>
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => setIsEditingSettings(false)}
                          >
                            <X size={14} />
                            <span>{t('whatsapp.wahaControlQr.cancelEditBtn', 'Batal')}</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => {
                              setWaViewMode('hospital_doctor_qr');
                              setIsQrLoading(true);
                              setQrLoadError(false);
                              setQrRetryCount(0);
                              setQrTimestamp(Date.now());
                            }}
                          >
                            <QrCode size={15} />
                            <span>{t('whatsapp.wahaControlQr.actionBarBtn', 'Tautkan WhatsApp RS dan Dokter')}</span>
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={handleRelinkDevice}
                            disabled={relinking}
                          >
                            <RefreshCw size={14} className={relinking ? 'cr-spin' : ''} />
                            <span>{relinking ? 'Mereset Sesi...' : t('whatsapp.wahaControlQr.relinkDeviceBtn', 'Tautkan Ulang Perangkat')}</span>
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => handleTestDispatch('whatsapp')}
                            disabled={testingDispatch}
                          >
                            <Send size={15} />
                            <span>{t('whatsapp.wahaControlQr.testBtn', 'Uji Kirim Pesan')}</span>
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary cr-actions-edit-btn"
                            onClick={() => setIsEditingSettings(true)}
                          >
                            <Pencil size={14} />
                            <span>{t('whatsapp.wahaControlQr.editConfigBtn', 'Ubah Data')}</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Mode 2: QR Code untuk WhatsApp RS dan Dokter - Pengingat Jadwal Kontrol */}
                {waViewMode === 'hospital_doctor_qr' && (
                  <div className="cr-waha-doctor-qr-card">
                    <div className="cr-waha-doctor-header">
                      <div className="cr-waha-doctor-badge">
                        <Sparkles size={14} />
                        <span>{t('whatsapp.wahaControlQr.badge', 'Pengingat Jadwal Kontrol Pasien')}</span>
                      </div>
                      <h4 className="cr-waha-doctor-title">
                        {t('whatsapp.wahaControlQr.title', 'QR Code Tautkan WhatsApp RS dan Dokter - Gateway Resmi')}
                      </h4>
                      <p className="cr-waha-doctor-subtitle">
                        {t('whatsapp.wahaControlQr.subtitle', 'Pindai kode QR ini dari WhatsApp Rumah Sakit atau Dokter untuk menghubungkan gateway resmi, agar sistem dapat mengirimkan pengingat jadwal kontrol dan notifikasi reservasi otomatis ke pasien.')}
                      </p>
                    </div>

                    {/* 4-Step Instructions Card */}
                    <div className="cr-waha-steps-card">
                      <div className="cr-waha-step-item">
                        <div className="cr-waha-step-num">1</div>
                        <div className="cr-waha-step-text">
                          <div className="cr-waha-step-title">{t('whatsapp.wahaControlQr.step1Title', 'Langkah 1')}</div>
                          <div className="cr-waha-step-desc">{t('whatsapp.wahaControlQr.step1Desc', 'Buka aplikasi WhatsApp pada ponsel resmi Rumah Sakit atau Dokter DPJP.')}</div>
                        </div>
                      </div>
                      <div className="cr-waha-step-item">
                        <div className="cr-waha-step-num">2</div>
                        <div className="cr-waha-step-text">
                          <div className="cr-waha-step-title">{t('whatsapp.wahaControlQr.step2Title', 'Langkah 2')}</div>
                          <div className="cr-waha-step-desc">{t('whatsapp.wahaControlQr.step2Desc', 'Masuk ke menu Perangkat Tertaut lalu pilih Tautkan Perangkat.')}</div>
                        </div>
                      </div>
                      <div className="cr-waha-step-item">
                        <div className="cr-waha-step-num">3</div>
                        <div className="cr-waha-step-text">
                          <div className="cr-waha-step-title">{t('whatsapp.wahaControlQr.step3Title', 'Langkah 3')}</div>
                          <div className="cr-waha-step-desc">{t('whatsapp.wahaControlQr.step3Desc', 'Arahkan kamera ke QR Code di bawah untuk menghubungkan sesi gateway.')}</div>
                        </div>
                      </div>
                      <div className="cr-waha-step-item">
                        <div className="cr-waha-step-num">4</div>
                        <div className="cr-waha-step-text">
                          <div className="cr-waha-step-title">{t('whatsapp.wahaControlQr.step4Title', 'Langkah 4')}</div>
                          <div className="cr-waha-step-desc">{t('whatsapp.wahaControlQr.step4Desc', 'Setelah terhubung, gateway otomatis aktif mengirimkan pesan pengingat jadwal kontrol pasien H-3, H-1, dan hari H.')}</div>
                        </div>
                      </div>
                    </div>

                    {/* Live Gateway QR Box */}
                    <div className="cr-qr-center-box" style={{ marginTop: '1rem' }}>
                      {qrLoadError ? (
                        <div className="cr-qr-error-box">
                          <AlertCircle size={26} color="#d97706" />
                          <p className="cr-qr-error-text">
                            {t('whatsapp.wahaControlQr.preparingSession', 'Gateway sedang menyiapkan sesi')}
                          </p>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => {
                              setQrRetryCount(0);
                              setQrLoadError(false);
                              setIsQrLoading(true);
                              setQrTimestamp(Date.now());
                            }}
                          >
                            <RefreshCw size={14} />
                            <span>{t('whatsapp.wahaControlQr.reloadQrBtn', 'Muat Ulang QR')}</span>
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="cr-qr-wrapper">
                            <img
                              src={`${wahaQrEndpoint}?session=${wahaSessionName}&t=${qrTimestamp}`}
                              alt="QR Code WhatsApp RS dan Dokter"
                              className="cr-qr-img-inline"
                              onLoad={() => {
                                setIsQrLoading(false);
                                setQrRetryCount(0);
                              }}
                              onError={() => {
                                if (qrRetryCount < 3) {
                                  setIsQrLoading(true);
                                  setTimeout(() => {
                                    setQrRetryCount((prev) => prev + 1);
                                    setQrTimestamp(Date.now());
                                  }, 3500);
                                } else {
                                  setQrLoadError(true);
                                  setIsQrLoading(false);
                                }
                              }}
                            />
                            {isQrLoading && (
                              <div className="cr-qr-loading-overlay">
                                <RefreshCw size={24} className="cr-spin" color="#059669" />
                              </div>
                            )}
                          </div>
                          <div className="cr-qr-actions-row">
                            <button
                              type="button"
                              className="cr-qr-refresh-btn"
                              onClick={() => {
                                setQrRetryCount(0);
                                setQrLoadError(false);
                                setIsQrLoading(true);
                                setQrTimestamp(Date.now());
                              }}
                              title="Segarkan QR sekarang"
                            >
                              <RefreshCw size={12} />
                              <span>{t('whatsapp.wahaControlQr.refreshBtn', 'Segarkan')}</span>
                            </button>
                          </div>
                        </>
                      )}

                      {/* Action Buttons */}
                      <div className="cr-qr-actions-row" style={{ flexWrap: 'wrap', gap: '8px', marginTop: '14px' }}>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => handleCopyLink(wahaSessionName, 'Sesi Gateway')}
                        >
                          {isCopiedLink ? <Check size={14} /> : <Copy size={14} />}
                          <span>{isCopiedLink ? 'Tersalin' : t('whatsapp.wahaControlQr.copySessionBtn', 'Salin Sesi Gateway')}</span>
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => setWaViewMode('overview')}
                        >
                          <ArrowLeft size={14} />
                          <span>{t('whatsapp.wahaControlQr.backOverviewBtn', 'Kembali ke Ringkasan Status')}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Mode 3: Penautan Ulang / Pairing Baru ke Gateway WAHA */}
                {(waViewMode === 'pairing' || connectionStatus !== 'CONNECTED') && (
                  <>
                    {/* Method Switcher: Pairing vs Scan QR */}
                    <div className="cr-method-switcher">
                      <button
                        type="button"
                        className={`cr-method-btn ${waMethod === 'pairing' ? 'active' : ''}`}
                        onClick={() => setWaMethod('pairing')}
                      >
                        <Key size={14} />
                        <span>Kode Pairing</span>
                      </button>
                      <button
                        type="button"
                        className={`cr-method-btn ${waMethod === 'qr' ? 'active' : ''}`}
                        onClick={() => setWaMethod('qr')}
                      >
                        <QrCode size={14} />
                        <span>Scan QR</span>
                      </button>
                    </div>

                    {/* Display Area: Pairing Code or QR Code */}
                    {waMethod === 'pairing' ? (
                      <div className="cr-pairing-display">
                        <div className="cr-pairing-digits">{pairingCode}</div>
                        <div className="cr-tile-actions">
                          <button type="button" className="btn btn-primary" onClick={handleCopyPairingCode}>
                            {isCopiedCode ? <Check size={14} /> : <Copy size={14} />}
                            <span>{isCopiedCode ? 'Tersalin' : 'Salin'}</span>
                          </button>
                          <button type="button" className="btn btn-secondary" onClick={handleGeneratePairingCode} title="Buat kode baru">
                            <RefreshCw size={14} />
                            <span>Acak</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="cr-qr-center-box">
                        {qrLoadError ? (
                          <div className="cr-qr-error-box">
                            <AlertCircle size={26} color="#d97706" />
                            <p className="cr-qr-error-text">Gateway sedang menyiapkan sesi</p>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={() => {
                                setQrRetryCount(0);
                                setQrLoadError(false);
                                setIsQrLoading(true);
                                setQrTimestamp(Date.now());
                              }}
                            >
                              <RefreshCw size={14} />
                              <span>Muat Ulang QR</span>
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="cr-qr-wrapper">
                              <img
                                src={`${wahaQrEndpoint}?session=${wahaSessionName}&t=${qrTimestamp}`}
                                alt="WAHA QR Code"
                                className="cr-qr-img-inline"
                                onLoad={() => {
                                  setIsQrLoading(false);
                                  setQrRetryCount(0);
                                }}
                                onError={() => {
                                  if (qrRetryCount < 3) {
                                    setIsQrLoading(true);
                                    setTimeout(() => {
                                      setQrRetryCount((prev) => prev + 1);
                                      setQrTimestamp(Date.now());
                                    }, 3500);
                                  } else {
                                    setQrLoadError(true);
                                    setIsQrLoading(false);
                                  }
                                }}
                              />
                              {isQrLoading && (
                                <div className="cr-qr-loading-overlay">
                                  <RefreshCw size={24} className="cr-spin" color="#059669" />
                                </div>
                              )}
                            </div>
                            <div className="cr-qr-actions-row">
                              <button
                                type="button"
                                className="cr-qr-refresh-btn"
                                onClick={() => {
                                  setQrRetryCount(0);
                                  setQrLoadError(false);
                                  setIsQrLoading(true);
                                  setQrTimestamp(Date.now());
                                }}
                                title="Segarkan QR sekarang"
                              >
                                <RefreshCw size={12} />
                                <span>{t('whatsapp.wahaControlQr.refreshBtn', 'Segarkan')}</span>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {connectionStatus === 'CONNECTED' && (
                      <div style={{ textAlign: 'center', marginBottom: '14px' }}>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => setWaViewMode('overview')}
                          style={{ fontSize: '0.82rem' }}
                        >
                          <ArrowLeft size={14} />
                          <span>Kembali ke Status Terhubung</span>
                        </button>
                      </div>
                    )}
                  </>
                )}

                {/* Configuration Form (Only rendered when not connected for initial setup) */}
                {connectionStatus !== 'CONNECTED' && (
                  <form className="cr-form-grid" onSubmit={handleSaveSettings}>
                    <div className="cr-form-row">
                      <div className="cr-field">
                        <label>{t('whatsapp.wahaControlQr.clinicNameLabel', 'Nama Faskes')}</label>
                        <input
                          type="text"
                          value={clinicName}
                          onChange={(e) => setClinicName(e.target.value)}
                          placeholder={t('whatsapp.wahaControlQr.clinicNamePlaceholder', 'Contoh: RSUP Ngoerah')}
                          required
                        />
                      </div>
                      <div className="cr-field">
                        <label>{t('whatsapp.wahaControlQr.phoneLabel', 'Nomor Layanan Aktif WhatsApp')}</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={whatsappNumber}
                          onChange={(e) => setWhatsappNumber(e.target.value)}
                          placeholder={t('whatsapp.wahaControlQr.phonePlaceholder', 'Contoh: 6285128071646')}
                          required
                        />
                      </div>
                    </div>

                    <div className="cr-form-row">
                      <div className="cr-field">
                        <label>{t('whatsapp.wahaControlQr.accountNameLabel', 'Nama Akun WhatsApp')}</label>
                        <input
                          type="text"
                          value={serviceLabel}
                          onChange={(e) => setServiceLabel(e.target.value)}
                          placeholder={t('whatsapp.wahaControlQr.accountNamePlaceholder', 'Contoh: RS Bali Royal Hotline')}
                          required
                        />
                      </div>
                      <div className="cr-field">
                        <label>{t('whatsapp.wahaControlQr.sessionNameLabel', 'Sesi Gateway Resmi')}</label>
                        <input
                          type="text"
                          value={wahaSessionName}
                          onChange={(e) => setWahaSessionName(e.target.value)}
                          placeholder={t('whatsapp.wahaControlQr.sessionNamePlaceholder', 'Contoh: Ternak-Automation')}
                          required
                        />
                      </div>
                    </div>

                    <div className="cr-form-actions">
                      <button type="submit" className="btn btn-primary" disabled={saving}>
                        <Save size={15} />
                        <span>{saving ? t('whatsapp.wahaControlQr.savingBtn', 'Menyimpan...') : t('whatsapp.wahaControlQr.saveBtn', 'Simpan Pengaturan')}</span>
                      </button>
                      <button type="button" className="btn btn-secondary" onClick={() => handleTestDispatch('whatsapp')} disabled={testingDispatch}>
                        <Send size={15} />
                        <span>{t('whatsapp.wahaControlQr.testBtn', 'Uji Kirim Pesan')}</span>
                      </button>
                    </div>
                  </form>
                )}

                {/* TypeSafe Jev Relevance Filter & AI Response Control */}
                <div className="cr-jev-card">
                  <div className="cr-jev-card-header">
                    <div className="cr-jev-card-title-group">
                      <Zap size={18} color="#059669" />
                      <div>
                        <h4 className="cr-jev-card-title">Filter Relevansi TypeSafe Jev &amp; Penanganan Chat</h4>
                        <p className="cr-jev-card-subtitle">
                          Engine keputusan Sistem 1 berkecepatan milidetik untuk menyaring pesan WhatsApp faskes secara akurat tanpa membuang token LLM.
                        </p>
                      </div>
                    </div>
                    <div className="cr-jev-badge">
                      <Sparkles size={12} />
                      <span>Sistem 1 Cepat</span>
                    </div>
                  </div>

                  <div className="cr-jev-form-grid">
                    {/* Toggle: AI Chat Filter Enabled */}
                    <div className="cr-jev-toggle-row">
                      <div className="cr-jev-toggle-info">
                        <span className="cr-jev-toggle-label">Aktifkan Filter Relevansi AI - TypeSafe Jev</span>
                        <span className="cr-jev-toggle-desc">
                          Menilai intent pesan secara instan sebelum diteruskan ke alur reservasi atau RAG klinis.
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        className="cr-switch-input"
                        checked={aiChatFilterEnabled}
                        onChange={(e) => setAiChatFilterEnabled(e.target.checked)}
                      />
                    </div>

                    {/* Toggle: Irrelevant Reply Enabled */}
                    <div className="cr-jev-toggle-row">
                      <div className="cr-jev-toggle-info">
                        <span className="cr-jev-toggle-label">Kirim Panduan Sopan untuk Obrolan di Luar Konteks</span>
                        <span className="cr-jev-toggle-desc">
                          Mengirimkan pesan panduan resmi faskes hanya sekali per rentang jeda 24 jam untuk mencegah lingkaran spam.
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        className="cr-switch-input"
                        checked={irrelevantReplyEnabled}
                        onChange={(e) => setIrrelevantReplyEnabled(e.target.checked)}
                      />
                    </div>

                    {/* Textarea: Fallback Text */}
                    <div className="cr-jev-field">
                      <label>Teks Panduan Resmi untuk Obrolan di Luar Konteks</label>
                      <textarea
                        rows={3}
                        value={irrelevantFallbackText}
                        onChange={(e) => setIrrelevantFallbackText(e.target.value)}
                        placeholder="Contoh: Halo, terima kasih telah menghubungi kami. Nomor ini khusus melayani pendaftaran mandiri dan informasi layanan poliklinik faskes..."
                      />
                      <p className="cr-jev-hint">Pesan ini dikirim tepat sekali jika pasien mengirimkan topik di luar reservasi atau medis.</p>
                    </div>

                    {/* Handover Cooldown Hours */}
                    <div className="cr-jev-field">
                      <label>Jeda AI Pasca Alih Staf Medis, jam</label>
                      <input
                        type="number"
                        min={1}
                        max={72}
                        value={humanHandoverCooldownHours}
                        onChange={(e) => setHumanHandoverCooldownHours(e.target.value)}
                      />
                      <p className="cr-jev-hint">Bot AI akan membisu selama periode ini agar staf administrasi faskes dapat berinteraksi langsung tanpa interupsi bot.</p>
                    </div>

                    {/* TypeSafe API Key */}
                    <div className="cr-jev-field">
                      <label>Kunci API TypeSafe Jev Opsional</label>
                      <input
                        type="password"
                        value={typesafeApiKey}
                        onChange={(e) => setTypesafeApiKey(e.target.value)}
                        placeholder="Kosongkan untuk otomatis menggunakan mesin heuristik lokal cepat tanpa kuota eksternal"
                      />
                      <p className="cr-jev-hint">Jika dikosongkan, sistem menjalankan mesin evaluasi deterministik lokal berkecepatan 0 milidetik.</p>
                    </div>

                    {/* Action Button */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleSaveJevSettings}
                        disabled={savingJev}
                      >
                        <Save size={14} />
                        <span>{savingJev ? 'Menyimpan...' : 'Simpan Pengaturan Filter Jev'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: WEBSITE WIDGET */}
            {activeChannelTab === 'website' && (
              <div className="cr-tab-content-card">
                <div className="cr-card-header">
                  <h3 className="cr-card-title">Widget Website &amp; Kiosk</h3>
                  <div className="cr-gateway-badge web-active">
                    <Globe size={14} />
                    <span>Aktif</span>
                  </div>
                </div>

                {/* Embed Code Snippet Box */}
                <div className="cr-section-box">
                  <div className="cr-box-title">
                    <Code size={16} />
                    <h4>Kode Script Embed</h4>
                  </div>
                  <div className="cr-code-snippet-box">
                    <pre>{embedCodeSnippet}</pre>
                    <button type="button" className="cr-copy-code-btn" onClick={handleCopyEmbedCode}>
                      {isCopiedEmbed ? <Check size={14} /> : <Copy size={14} />}
                      <span>{isCopiedEmbed ? 'Tersalin' : 'Salin'}</span>
                    </button>
                  </div>
                </div>

                {/* Direct Web Chat Link */}
                <div className="cr-section-box">
                  <div className="cr-box-title">
                    <ExternalLink size={16} />
                    <h4>Tautan Pendaftaran Mandiri</h4>
                  </div>
                  <div className="cr-input-copy-group">
                    <input type="text" readOnly value={`${window.location.origin}/reservasi`} />
                    <div className="cr-input-copy-actions">
                      <button type="button" className="btn btn-secondary" onClick={() => handleCopyLink(`${window.location.origin}/reservasi`, 'Tautan Kiosk')}>
                        <Copy size={14} />
                        <span>Salin</span>
                      </button>
                      <a href="/reservasi" target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '5px', textDecoration: 'none' }}>
                        <ExternalLink size={14} />
                        <span>Buka</span>
                      </a>
                    </div>
                  </div>
                </div>

                {/* Widget Customization */}
                <div className="cr-form-grid" style={{ marginTop: '12px' }}>
                  <div className="cr-form-row">
                    <div className="cr-field">
                      <label>Warna Aksen Widget</label>
                      <select value={widgetColor} onChange={(e) => setWidgetColor(e.target.value)}>
                        <option value="emerald">Emerald Herbal</option>
                        <option value="teal">Teal Medis</option>
                        <option value="blue">Blue Sapphire</option>
                      </select>
                    </div>
                    <div className="cr-field">
                      <label>Posisi Pop-up Layar</label>
                      <select value={widgetPosition} onChange={(e) => setWidgetPosition(e.target.value)}>
                        <option value="bottom-right">Sudut Bawah Kanan</option>
                        <option value="bottom-left">Sudut Bawah Kiri</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: TELEGRAM BOT */}
            {activeChannelTab === 'telegram' && (
              <div className="cr-tab-content-card">
                <div className="cr-card-header">
                  <h3 className="cr-card-title">Telegram Bot</h3>
                  <div className="cr-gateway-badge tele-ready">
                    <Send size={14} />
                    <span>@{telegramUsername}</span>
                  </div>
                </div>

                <div className="cr-form-grid">
                  <div className="cr-form-row">
                    <div className="cr-field">
                      <label>Telegram Bot Token</label>
                      <input
                        type="password"
                        value={telegramToken}
                        onChange={(e) => setTelegramToken(e.target.value)}
                        placeholder="789123456:AAFlk90..."
                      />
                    </div>
                    <div className="cr-field">
                      <label>Username Bot</label>
                      <input
                        type="text"
                        value={telegramUsername}
                        onChange={(e) => setTelegramUsername(e.target.value)}
                        placeholder="KlinikSehatBot"
                      />
                    </div>
                  </div>

                  <div className="cr-field">
                    <label>Tautan Bot Pasien</label>
                    <div className="cr-input-copy-group">
                      <input type="text" readOnly value={teleDirectUrl} />
                      <button type="button" className="btn btn-secondary" onClick={() => handleCopyLink(teleDirectUrl, 'Tautan Telegram')}>
                        <Copy size={14} />
                        <span>Salin</span>
                      </button>
                      <a href={teleDirectUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', textDecoration: 'none' }}>
                        <ExternalLink size={14} />
                        <span>Buka</span>
                      </a>
                    </div>
                  </div>

                  <div className="cr-form-actions">
                    <button type="button" className="btn btn-primary" onClick={handleSaveSettings} disabled={saving}>
                      <Save size={15} />
                      <span>{saving ? 'Menyimpan...' : 'Simpan Pengaturan'}</span>
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={() => handleTestDispatch('telegram')} disabled={testingDispatch}>
                      <Send size={15} />
                      <span>Uji Pesan</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: GMAIL */}
            {activeChannelTab === 'gmail' && (
              <div className="cr-tab-content-card">
                <div className="cr-card-header">
                  <h3 className="cr-card-title">Gmail Reservasi</h3>
                  <div className="cr-gateway-badge gmail-active">
                    <Mail size={14} />
                    <span>Aktif</span>
                  </div>
                </div>

                <div className="cr-form-grid">
                  <div className="cr-form-row">
                    <div className="cr-field">
                      <label>Email Faskes</label>
                      <input
                        type="email"
                        value={clinicEmail}
                        onChange={(e) => setClinicEmail(e.target.value)}
                        placeholder="reservasi@kliniksehat.com"
                        required
                      />
                    </div>
                    <div className="cr-field">
                      <label>Prefiks Subjek Tiket</label>
                      <input
                        type="text"
                        value={emailSubjectPrefix}
                        onChange={(e) => setEmailSubjectPrefix(e.target.value)}
                        placeholder="RESERVASI KLINIK"
                      />
                    </div>
                  </div>

                  <div className="cr-form-actions">
                    <button type="button" className="btn btn-primary" onClick={handleSaveSettings} disabled={saving}>
                      <Save size={15} />
                      <span>{saving ? 'Menyimpan...' : 'Simpan Pengaturan'}</span>
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={() => handleTestDispatch('gmail')} disabled={testingDispatch}>
                      <Send size={15} />
                      <span>Uji Kirim Tiket</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Toolkit Loket: Standee Akrilik QR Code (Hidden/Commented as requested) */}
            {/* 
            <div className="cr-standee-banner">
              <div className="cr-standee-banner-text">
                <Printer size={22} className="cr-printer-icon" />
                <div>
                  <h4>Toolkit Loket: Standee Akrilik QR Code</h4>
                  <p>Cetak lembar promosi A5/A6 siap pajang di meja resepsionis agar pasien dapat memindai langsung.</p>
                </div>
              </div>
              <button type="button" className="btn btn-secondary" onClick={() => setShowStandeeModal(true)}>
                <QrCode size={15} />
                <span>Pratinjau &amp; Cetak Standee</span>
              </button>
            </div>
            */}
          </div>

          {/* Right Column: Multi-Channel Live Interactive Simulator (40% width) */}
          <div className="cr-right-column">
            <div className="cr-simulator-card">
              
              {/* Simulator Header */}
              <div className="cr-sim-header">
                <div className="cr-sim-title">
                  <Smartphone size={16} color="#059669" />
                  <span>Pratinjau Chat Pasien</span>
                </div>
                <div className="cr-sim-channel-badge">
                  <span>{simulatorChannel.toUpperCase()}</span>
                </div>
              </div>

              {/* Realistic Smartphone Chassis */}
              <div className="cr-phone-chassis">
                <div className="cr-phone-speaker"></div>

                {/* Topbar */}
                <div className={`cr-phone-topbar skin-${simulatorChannel}`}>
                  <div className="cr-phone-avatar">
                    {simulatorChannel === 'whatsapp' && <img src="/icons/WA.webp" alt="WhatsApp" className="cr-phone-avatar-img" />}
                    {simulatorChannel === 'website' && <img src="/icons/Website.svg" alt="Website" className="cr-phone-avatar-img" />}
                    {simulatorChannel === 'telegram' && <img src="/icons/Telegram.webp" alt="Telegram" className="cr-phone-avatar-img" />}
                    {simulatorChannel === 'gmail' && <img src="/icons/Gmail.webp" alt="Gmail" className="cr-phone-avatar-img" />}
                  </div>
                  <div className="cr-phone-meta">
                    <span className="cr-phone-name">
                      {simulatorChannel === 'whatsapp' && `${clinicName}`}
                      {simulatorChannel === 'website' && `Web Chat ${clinicName}`}
                      {simulatorChannel === 'telegram' && `@${telegramUsername}`}
                      {simulatorChannel === 'gmail' && clinicEmail}
                    </span>
                    <span className="cr-phone-status">
                      <span className="cr-pulse-dot"></span> Online
                    </span>
                  </div>
                </div>

                {/* Chat Canvas */}
                <div className="cr-phone-canvas" ref={chatCanvasRef}>
                  {simulatorChannel === 'gmail' ? (
                    // Gmail Specific Preview
                    <div className="cr-email-preview-thread">
                      <div className="cr-email-card inbound">
                        <div className="cr-email-header">
                          <strong>Dari:</strong> pasien.budi@gmail.com<br />
                          <strong>Subjek:</strong> Permohonan Reservasi Poli Umum Besok
                        </div>
                        <div className="cr-email-body">
                          Yth. Tim Pendaftaran {clinicName},<br />
                          Saya Budi Santoso - NIK 51710123456789 ingin mendaftar berobat ke Poli Umum untuk besok pagi jam 09.00 WITA. Terima kasih.
                        </div>
                      </div>

                      <div className="cr-email-card reply">
                        <div className="cr-email-header">
                          <strong>Dari:</strong> {clinicEmail} • AI Auto-Reply<br />
                          <strong>Subjek:</strong> Re: Permohonan Reservasi - Tiket Antrean Resmi #A-18
                        </div>
                        <div className="cr-email-body">
                          Halo Budi Santoso,<br />
                          Pendaftaran Anda telah <strong>BERHASIL TERKONFIRMASI</strong> oleh AI.<br /><br />
                          🎫 <strong>Nomor Antrean</strong>: A-18<br />
                          🏥 <strong>Poliklinik</strong>: Poli Umum<br />
                          📅 <strong>Waktu</strong>: Besok, 09:00 WITA<br /><br />
                          Tunjukkan tiket email ini kepada petugas loket saat tiba di klinik.
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Conversational Chat Messages (WA / Web / Telegram)
                    chatMessages.map((msg, idx) => (
                      <div key={idx} className={`cr-chat-bubble ${msg.sender === 'bot' ? 'bubble-bot' : 'bubble-patient'}`}>
                        <div className="cr-bubble-text" style={{ whiteSpace: 'pre-line' }}>{msg.text}</div>
                        <div className="cr-bubble-time">{msg.time}</div>
                      </div>
                    ))
                  )}
                </div>

                {/* Quick Reply Chips */}
                {simulatorChannel !== 'gmail' && (
                  <div className="cr-quick-chips">
                    <button type="button" onClick={() => handleSendSimulatorMessage('Mau daftar Poli Umum besok pagi')}>
                      💬 Poli Umum
                    </button>
                    <button type="button" onClick={() => handleSendSimulatorMessage('Cek jadwal dokter spesialis')}>
                      📅 Jadwal Dokter
                    </button>
                  </div>
                )}

                {/* Input Bar */}
                {simulatorChannel !== 'gmail' && (
                  <div className="cr-mockup-input-bar">
                    <input
                      type="text"
                      value={simulatorInputText}
                      onChange={(e) => setSimulatorInputText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSendSimulatorMessage();
                      }}
                      placeholder={`Ketik pesan uji coba...`}
                    />
                    <button type="button" className="cr-send-btn" onClick={() => handleSendSimulatorMessage()} title="Kirim Pesan">
                      <Send size={14} />
                    </button>
                  </div>
                )}
              </div>

              {/* Simulator Hint */}
              <div className="cr-sim-footer-hint">
                <Zap size={14} color="#059669" />
                <span>Simulasi langsung alur interaksi pasien dengan engine AI klinik.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* WORKSPACE TAB 2: LIVE MESSAGE LOGS & TRIAGE TABLE                         */}
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* WORKSPACE TAB 2: LIVE MESSAGE LOGS & TRIAGE TABLE                         */}
      {/* ========================================================================= */}
      {workspaceTab === 'logs' && (
        <ReservationLogsSection
          loadingLogs={loadingLogs}
          filteredLogs={filteredLogs}
          logChannelFilter={logChannelFilter}
          setLogChannelFilter={setLogChannelFilter}
          logVerdictFilter={logVerdictFilter}
          setLogVerdictFilter={setLogVerdictFilter}
          searchLogText={searchLogText}
          setSearchLogText={setSearchLogText}
          fetchMessageLogs={fetchMessageLogs}
        />
      )}

      {/* ========================================================================= */}
      {/* WORKSPACE TAB 3: AI CONSULTATION SUMMARY & ANALYTICS                      */}
      {/* ========================================================================= */}
      {workspaceTab === 'summary' && (
        <WhatsappAiSummarySection
          summaryTimeframe={summaryTimeframe}
          setSummaryTimeframe={setSummaryTimeframe}
          summaryData={summaryData}
          loadingSummary={loadingSummary}
          fetchAISummary={fetchAISummary}
        />
      )}

      {/* Modal Uji Kirim Pesan WhatsApp */}
      <TestDispatchModal
        showTestModal={showTestModal}
        setShowTestModal={setShowTestModal}
        cleanPhone={cleanPhone}
        wahaSessionName={wahaSessionName}
        testTargetPhone={testTargetPhone}
        setTestTargetPhone={setTestTargetPhone}
        testMessageText={testMessageText}
        setTestMessageText={setTestMessageText}
        handleExecuteTestDispatch={handleExecuteTestDispatch}
        testingDispatch={testingDispatch}
      />

      {/* Standee Acrylic Modal */}
      <StandeeModal
        showStandeeModal={showStandeeModal}
        setShowStandeeModal={setShowStandeeModal}
        clinicName={clinicName}
        waQrUrl={waDirectQrUrl}
        cleanPhone={cleanPhone}
      />
    </div>
  );
};

export default ConnectReservation;
