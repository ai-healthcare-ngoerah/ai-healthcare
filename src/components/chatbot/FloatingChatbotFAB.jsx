import React, { useState, useEffect } from 'react';
import { MessageSquare, X, Bot, Send, Calendar, Clock, User, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const FloatingChatbotFAB = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([]);

  // Initialize or reset welcome message when language changes
  useEffect(() => {
    setMessages([
      {
        id: 1,
        sender: 'bot',
        text: t('reservation.fabChatbot.welcomeMessage')
      }
    ]);
  }, [t]);

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userText = inputMessage.trim();
    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: userText
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const apiUrl = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8001') + '/api/agent/chat';
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText })
      });

      if (response.ok) {
        const data = await response.json();
        const replyText = data.reply || data.response || 'Terima kasih atas pesan Anda.';
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'bot',
            text: replyText
          }
        ]);
      } else {
        throw new Error('Gagal menghubungi asisten');
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: t('reservation.fabChatbot.fallbackError')
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        title={t('reservation.fabChatbot.headerTitle')}
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          backgroundColor: 'var(--primary-color, #059669)',
          color: '#ffffff',
          border: 'none',
          boxShadow: '0 8px 24px rgba(5, 150, 105, 0.4)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          transition: 'all 0.25s ease',
          transform: isOpen ? 'scale(0.95)' : 'scale(1)'
        }}
      >
        {isOpen ? <X size={26} /> : <Bot size={28} />}
      </button>

      {/* Chatbot Drawer / Modal */}
      {isOpen && (
        <div
          className="animate-fade-in"
          style={{
            position: 'fixed',
            bottom: '6.5rem',
            right: '2rem',
            width: '380px',
            maxWidth: 'calc(100vw - 2.5rem)',
            height: '520px',
            maxHeight: 'calc(100vh - 8rem)',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.15)',
            border: '1px solid var(--border-color, #e2e8f0)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 9999,
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '1rem 1.25rem',
              backgroundColor: 'var(--primary-color, #059669)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Bot size={20} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>{t('reservation.fabChatbot.headerTitle')}</h4>
                <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>{t('reservation.fabChatbot.headerSubtitle')}</span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', padding: '4px' }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages Body */}
          <div
            style={{
              flex: 1,
              padding: '1rem',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              backgroundColor: '#f8fafc'
            }}
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  padding: '0.75rem 1rem',
                  borderRadius: msg.sender === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                  backgroundColor: msg.sender === 'user' ? 'var(--primary-color, #059669)' : '#ffffff',
                  color: msg.sender === 'user' ? '#ffffff' : 'var(--text-main, #1e293b)',
                  fontSize: '0.875rem',
                  lineHeight: '1.4',
                  boxShadow: msg.sender === 'user' ? 'none' : '0 2px 8px rgba(0, 0, 0, 0.04)',
                  border: msg.sender === 'user' ? 'none' : '1px solid #e2e8f0'
                }}
              >
                {msg.text}
              </div>
            ))}
            {isLoading && (
              <div
                style={{
                  alignSelf: 'flex-start',
                  padding: '0.6rem 1rem',
                  borderRadius: '14px 14px 14px 2px',
                  backgroundColor: '#ffffff',
                  color: 'var(--text-muted, #64748b)',
                  fontSize: '0.8rem',
                  border: '1px solid #e2e8f0'
                }}
              >
                {t('reservation.fabChatbot.typing')}
              </div>
            )}
          </div>

          {/* Input Footer */}
          <form
            onSubmit={handleSendMessage}
            style={{
              padding: '0.75rem',
              backgroundColor: '#ffffff',
              borderTop: '1px solid var(--border-color, #e2e8f0)',
              display: 'flex',
              gap: '0.5rem'
            }}
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={t('reservation.fabChatbot.inputPlaceholder')}
              style={{
                flex: 1,
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color, #cbd5e1)',
                fontSize: '0.875rem',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              style={{
                backgroundColor: 'var(--primary-color, #059669)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '0 0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: isLoading || !inputMessage.trim() ? 0.6 : 1
              }}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default FloatingChatbotFAB;
