import React, { useState } from 'react';
import { X, Send, Bot, User, MessageSquare, Mail, Globe, RefreshCw, Sparkles } from 'lucide-react';
import { chatWithAiAgent } from '../../services/api';

const OmnichannelChatSimulatorModal = ({ onClose }) => {
  const [selectedChannel, setSelectedChannel] = useState('web'); // 'web', 'whatsapp', 'telegram', 'gmail'
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: 'Halo! Saya Asisten AI Layanan Pasien Rumah Sakit. Ada yang bisa saya bantu terkait jadwal dokter, konsultasi poli, atau informasi rawat jalan?',
      channel: 'web',
      time: 'Baru saja'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const channelIcons = {
    whatsapp: { iconImg: '/icons/WA.webp', icon: MessageSquare, label: 'WhatsApp', color: '#16a34a', bg: '#f0fdf4' },
    telegram: { iconImg: '/icons/Telegram.webp', icon: Send, label: 'Telegram', color: '#0284c7', bg: '#f0f9ff' },
    gmail: { iconImg: '/icons/Gmail.webp', icon: Mail, label: 'Gmail', color: '#ea580c', bg: '#fff7ed' },
    web: { iconImg: '/icons/Website.svg', icon: Globe, label: 'Website Widget', color: '#7c3aed', bg: '#faf5ff' },
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isSending) return;

    const userMessage = {
      sender: 'user',
      text: inputText.trim(),
      channel: selectedChannel,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsSending(true);

    try {
      const response = await chatWithAiAgent(userMessage.text, selectedChannel, '6281234567890');
      const aiReply = {
        sender: 'ai',
        text: response.reply || 'Maaf, sistem tidak dapat memproses jawaban saat ini.',
        channel: selectedChannel,
        intent: response.intent,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, aiReply]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: `⚠️ Terjadi kendala respon AI: ${err.message || 'Gagal menghubungi server.'}`,
          channel: selectedChannel,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleQuickPrompt = (promptText) => {
    setInputText(promptText);
  };

  const currentCh = channelIcons[selectedChannel];

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
        maxWidth: '560px',
        height: '620px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#ffffff',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-xl)',
        border: '1px solid var(--border-color)',
        overflow: 'hidden'
      }}>
        {/* Simulator Header */}
        <div style={{
          padding: '1rem 1.25rem',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#f8fafc'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Sparkles size={17} color="var(--primary-color)" />
              <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Simulator AI Chat Omnichannel
              </h2>
            </div>
            <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Uji respon agen AI secara langsung di kanal pilihan tanpa memerlukan ponsel fisik.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}
            title="Tutup"
          >
            <X size={18} />
          </button>
        </div>

        {/* Channel Selector Pills */}
        <div style={{
          display: 'flex',
          gap: '0.4rem',
          padding: '0.65rem 1rem',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid var(--border-color)',
          overflowX: 'auto'
        }}>
          {Object.entries(channelIcons).map(([chKey, chInfo]) => {
            const Icon = chInfo.icon;
            const isSelected = selectedChannel === chKey;
            return (
              <button
                key={chKey}
                type="button"
                onClick={() => setSelectedChannel(chKey)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.35rem 0.65rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  borderRadius: '20px',
                  border: isSelected ? `1.5px solid ${chInfo.color}` : '1px solid #e2e8f0',
                  backgroundColor: isSelected ? chInfo.bg : '#ffffff',
                  color: isSelected ? chInfo.color : 'var(--text-main)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {chInfo.iconImg ? (
                  <img src={chInfo.iconImg} alt={chInfo.label} style={{ width: '14px', height: '14px', objectFit: 'contain' }} />
                ) : (
                  <Icon size={13} color={chInfo.color} />
                )}
                <span>{chInfo.label}</span>
              </button>
            );
          })}
        </div>

        {/* Message Log Transcript View */}
        <div style={{
          flex: 1,
          padding: '1rem',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem',
          backgroundColor: '#f8fafc'
        }}>
          {messages.map((m, idx) => {
            const isUser = m.sender === 'user';
            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  gap: '0.5rem',
                  justifyContent: isUser ? 'flex-end' : 'flex-start',
                  alignItems: 'flex-start'
                }}
              >
                {!isUser && (
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    flexShrink: 0
                  }}>
                    <Bot size={15} />
                  </div>
                )}
                <div style={{
                  maxWidth: '78%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: isUser ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                  backgroundColor: isUser ? 'var(--primary-color)' : '#ffffff',
                  color: isUser ? '#ffffff' : 'var(--text-main)',
                  boxShadow: 'var(--shadow-sm)',
                  border: isUser ? 'none' : '1px solid var(--border-color)',
                  fontSize: '0.85rem',
                  lineHeight: '1.4'
                }}>
                  <div style={{ whiteSpace: 'pre-wrap' }}>{m.text}</div>
                  <div style={{
                    marginTop: '0.35rem',
                    fontSize: '0.65rem',
                    color: isUser ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)',
                    textAlign: 'right'
                  }}>
                    {m.time} • via {m.channel?.toUpperCase()}
                  </div>
                </div>
                {isUser && (
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    flexShrink: 0
                  }}>
                    <User size={15} />
                  </div>
                )}
              </div>
            );
          })}
          {isSending && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              <RefreshCw size={14} className="spin" />
              <span>AI sedang merumuskan jawaban ({currentCh.label})...</span>
            </div>
          )}
        </div>

        {/* Quick Prompts */}
        <div style={{
          padding: '0.4rem 1rem',
          backgroundColor: '#ffffff',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          gap: '0.35rem',
          overflowX: 'auto',
          whiteSpace: 'nowrap'
        }}>
          {[
            'Jadwal dr. Budi besok?',
            'Bisa buat janji temu poli penyakit dalam?',
            '1 (Konfirmasi Hadir)',
            '2 (Minta Reschedule)',
          ].map((prompt, pIdx) => (
            <button
              key={pIdx}
              type="button"
              onClick={() => handleQuickPrompt(prompt)}
              style={{
                fontSize: '0.7rem',
                padding: '0.2rem 0.5rem',
                borderRadius: '12px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#f1f5f9',
                color: '#334155',
                cursor: 'pointer'
              }}
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Area */}
        <form onSubmit={handleSendMessage} style={{
          padding: '0.75rem 1rem',
          backgroundColor: '#ffffff',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          gap: '0.5rem',
          alignItems: 'center'
        }}>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Ketik pesan uji (${currentCh.label})...`}
            disabled={isSending}
            style={{
              flex: 1,
              padding: '0.65rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              fontSize: '0.85rem',
              outline: 'none'
            }}
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!inputText.trim() || isSending}
            style={{ padding: '0.65rem 1rem', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem' }}
          >
            <Send size={15} />
            <span>Kirim</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default OmnichannelChatSimulatorModal;
