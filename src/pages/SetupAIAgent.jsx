import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Bot, Stethoscope, Save, Send, AlertCircle, FileText, User, Sparkles, Edit2
} from 'lucide-react';
import { getScribeNotes } from '../services/scribeService';
import { useNotification } from '../context/NotificationContext';
import { getToken } from '../services/api';

const SetupAIAgent = () => {
  const { t } = useTranslation();
  const { showToast } = useNotification();
  
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState([]);
  const [selectedNoteId, setSelectedNoteId] = useState('');
  const [selectedNote, setSelectedNote] = useState(null);
  
  // Modes: 'manual' or 'integration'
  const [mode, setMode] = useState('integration');
  
  // Manual Form states
  const [diagnosis, setDiagnosis] = useState('');
  const [actionPlan, setActionPlan] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // AI Chat states
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const data = await getScribeNotes();
        setNotes(data.notes || []);
      } catch (err) {
        showToast({
          type: 'error',
          title: 'Error',
          message: t('agent.toastLoadPatientsFailed')
        });
      } finally {
        setLoading(false);
      }
    };
    fetchNotes();
  }, []);

  useEffect(() => {
    if (selectedNoteId) {
      const note = notes.find(n => n.id === selectedNoteId);
      setSelectedNote(note);
    } else {
      setSelectedNote(null);
    }
  }, [selectedNoteId, notes]);

  // Trigger AI initial analysis when switching to integration mode with a patient selected
  useEffect(() => {
    if (selectedNote && mode === 'integration' && chatHistory.length === 0 && !isAiLoading) {
      handleAiAnalyze(selectedNote.raw_text, null, []);
    }
  }, [selectedNote, mode]);

  const handleAiAnalyze = async (raw_soap, user_msg = null, current_history = []) => {
    setIsAiLoading(true);
    try {
      const historyToSend = [...current_history];
      if (user_msg) {
        historyToSend.push({ role: 'user', content: user_msg });
        setChatHistory(historyToSend);
      }

      const payload = {
        raw_soap: raw_soap,
        chat_history: user_msg ? current_history : null,
        user_message: user_msg
      };

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8001'}/api/ai-agent/diagnosis/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Gagal menghubungi AI Agent');
      }

      const data = await response.json();
      if (data.success) {
        setChatHistory([...historyToSend, { role: 'assistant', content: data.ai_message }]);
      }
    } catch (err) {
      showToast({ type: 'error', title: 'Error', message: err.message });
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || isAiLoading) return;
    
    const msg = chatInput;
    setChatInput('');
    handleAiAnalyze(selectedNote.raw_text, msg, chatHistory);
  };

  const handleSubmitManual = async (e) => {
    e.preventDefault();
    await saveToSheets(diagnosis, actionPlan);
  };

  const handleSaveAiChat = async () => {
    // Collect all assistant messages as action plan
    const aiMessages = chatHistory.filter(c => c.role === 'assistant').map(c => c.content).join('\n\n--- Revisi ---\n\n');
    await saveToSheets("Diagnosis AI Agent", aiMessages);
  };

  const saveToSheets = async (diagText, planText) => {
    if (!selectedNote) {
      showToast({ type: 'error', title: 'Error', message: t('agent.toastSelectPatientFirst') });
      return;
    }
    if (!diagText) {
      showToast({ type: 'error', title: 'Error', message: t('agent.toastDiagnosisRequired') });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        note_id: selectedNote.id,
        patient_name: selectedNote.patient_name || 'Pasien Umum',
        medical_record_no: selectedNote.medical_record_no || '-',
        raw_soap: selectedNote.raw_text,
        diagnosis: diagText,
        action_plan: planText
      };

      // Ensure the export endpoint matches ai-agent in backend
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8001'}/api/ai-agent/diagnosis/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || t('agent.toastSheetsFailed'));
      }

      showToast({
        type: 'success',
        title: 'Berhasil',
        message: t('agent.toastSheetsSuccess')
      });
      
      if (mode === 'manual') {
        setDiagnosis('');
        setActionPlan('');
      } else {
        setChatHistory([]);
      }
      setSelectedNoteId('');
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Gagal',
        message: err.message
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '3rem' }}>
      <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
          <Bot size={28} color="var(--primary-color)" />
          <span>{t('agent.title')}</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '700px', margin: '0 auto', marginTop: '0.5rem' }}>
          {t('agent.subtitle')}
        </p>
      </div>

      {/* Mode Toggle */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', backgroundColor: '#e2e8f0', borderRadius: '2rem', padding: '0.25rem' }}>
          <button 
            onClick={() => setMode('manual')}
            style={{
              padding: '0.75rem 1.5rem', borderRadius: '2rem', border: 'none', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem',
              backgroundColor: mode === 'manual' ? '#fff' : 'transparent',
              color: mode === 'manual' ? '#0f172a' : '#64748b',
              boxShadow: mode === 'manual' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            <Edit2 size={18} />
            {t('agent.modeManual')}
          </button>
          <button 
            onClick={() => setMode('integration')}
            style={{
              padding: '0.75rem 1.5rem', borderRadius: '2rem', border: 'none', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem',
              backgroundColor: mode === 'integration' ? 'var(--primary-color)' : 'transparent',
              color: mode === 'integration' ? '#fff' : '#64748b',
              boxShadow: mode === 'integration' ? '0 4px 6px -1px rgba(5, 150, 105, 0.3)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            <Sparkles size={18} />
            {t('agent.modeAi')}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Atas: Riwayat Pasien */}
        <div className="card" style={{ padding: '2rem', borderRadius: '1rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '1rem' }}>
            <div style={{ padding: '0.5rem', backgroundColor: '#d1fae5', borderRadius: '0.5rem' }}>
              <FileText size={24} color="var(--primary-color)" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>{t('agent.historySectionTitle')}</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>{t('agent.historySectionSubtitle')}</p>
            </div>
          </div>
          
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <p>{t('agent.loadingPatients')}</p>
            </div>
          ) : (
            <div style={{ marginBottom: selectedNote ? '1.5rem' : 0 }}>
              <label className="form-label" style={{ fontWeight: 500, color: 'var(--text-main)' }}>{t('agent.selectSessionLabel')}</label>
              <select 
                className="form-input" 
                value={selectedNoteId} 
                onChange={(e) => {
                  setSelectedNoteId(e.target.value);
                  setChatHistory([]); // reset chat if patient changes
                }}
                style={{ cursor: 'pointer', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', width: '100%' }}
              >
                <option value="">{t('agent.selectSessionPlaceholder')}</option>
                {notes.map(note => (
                  <option key={note.id} value={note.id}>
                    {new Date(note.created_at).toLocaleString(undefined)} - {note.patient_name || t('agent.patientDefault')}
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedNote && mode === 'manual' && (
            <div style={{ backgroundColor: '#f1f5f9', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', maxHeight: '300px', overflowY: 'auto' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={18} />
                {t('agent.fullSoapTitle')}
              </h3>
              <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'system-ui, -apple-system, sans-serif', fontSize: '0.9rem', color: '#334155', lineHeight: '1.6', margin: 0 }}>
                {selectedNote.raw_text || t('agent.noSoapContent')}
              </pre>
            </div>
          )}
        </div>

        {/* Bawah: Dynamic Area based on Mode */}
        {mode === 'manual' ? (
          /* ================= MANUAL MODE ================= */
          <div className="card animate-fade-in" style={{ padding: '2rem', borderRadius: '1rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', borderTop: '4px solid #94a3b8' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '1rem' }}>
              <div style={{ padding: '0.5rem', backgroundColor: '#f1f5f9', borderRadius: '0.5rem' }}>
                <Edit2 size={24} color="#64748b" />
              </div>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>{t('agent.manualCardTitle')}</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>{t('agent.manualCardSubtitle')}</p>
              </div>
            </div>
            
            <form onSubmit={handleSubmitManual}>
              <div style={{ marginBottom: '1.5rem', backgroundColor: '#fff', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
                <label className="form-label" style={{ fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  {t('agent.icd10Label')} <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input type="text" className="form-input" placeholder={t('agent.icd10Placeholder')} value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} required style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontFamily: 'inherit', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '2rem', backgroundColor: '#fff', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
                <label className="form-label" style={{ fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  {t('agent.actionPlanLabel')}
                </label>
                <textarea className="form-input" placeholder={t('agent.actionPlanPlaceholder')} rows={4} value={actionPlan} onChange={(e) => setActionPlan(e.target.value)} style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}></textarea>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn-primary" disabled={isSubmitting || !selectedNoteId} style={{ padding: '0.75rem 2rem', fontSize: '1rem', fontWeight: 600, borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {isSubmitting ? t('agent.saving') : t('agent.saveToSheetsBtn')} <Save size={18} />
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* ================= AI INTEGRATION MODE ================= */
          <div className="card animate-fade-in" style={{ padding: '2rem', borderRadius: '1rem', boxShadow: '0 4px 6px -1px rgba(5, 150, 105, 0.15)', borderTop: '4px solid var(--primary-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '1rem' }}>
              <div style={{ padding: '0.5rem', backgroundColor: '#d1fae5', borderRadius: '0.5rem' }}>
                <Bot size={24} color="var(--primary-color)" />
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>{t('agent.aiCardTitle')}</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>{t('agent.aiCardSubtitle')}</p>
              </div>
              {chatHistory.length > 0 && (
                <button onClick={handleSaveAiChat} disabled={isSubmitting || isAiLoading} className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {isSubmitting ? t('agent.finalizing') : t('agent.finalizeToSheetsBtn')} <Save size={16} />
                </button>
              )}
            </div>

            {!selectedNoteId ? (
              <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
                <Bot size={48} color="#cbd5e1" style={{ margin: '0 auto 1rem' }} />
                <p>{t('agent.emptySelectPatientNotice')}</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', height: '400px', backgroundColor: '#f8fafc', borderRadius: '0.75rem', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                
                {/* Chat History Area */}
                <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {chatHistory.length === 0 && !isAiLoading && (
                    <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                      <button onClick={() => handleAiAnalyze(selectedNote.raw_text)} className="btn-primary" style={{ padding: '0.75rem 1.5rem', borderRadius: '2rem' }}>
                        {t('agent.startSoapAnalysisBtn')}
                      </button>
                    </div>
                  )}

                  {chatHistory.map((msg, idx) => (
                    <div key={idx} style={{ 
                      display: 'flex', 
                      gap: '0.75rem', 
                      alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                      maxWidth: '85%'
                    }}>
                      {msg.role === 'assistant' && (
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '0.25rem' }}>
                          <Bot size={18} color="#fff" />
                        </div>
                      )}
                      
                      <div style={{ 
                        padding: '1rem', 
                        borderRadius: '1rem', 
                        backgroundColor: msg.role === 'user' ? 'var(--primary-color)' : '#fff',
                        color: msg.role === 'user' ? '#fff' : '#1e293b',
                        border: msg.role === 'assistant' ? '1px solid #e2e8f0' : 'none',
                        borderTopLeftRadius: msg.role === 'assistant' ? 0 : '1rem',
                        borderTopRightRadius: msg.role === 'user' ? 0 : '1rem',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                      }}>
                        <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0, fontSize: '0.95rem', lineHeight: '1.5' }}>
                          {msg.content}
                        </pre>
                      </div>

                      {msg.role === 'user' && (
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '0.25rem' }}>
                          <User size={18} color="#475569" />
                        </div>
                      )}
                    </div>
                  ))}

                  {isAiLoading && (
                    <div style={{ display: 'flex', gap: '0.75rem', alignSelf: 'flex-start' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Bot size={18} color="#fff" />
                      </div>
                      <div style={{ padding: '1rem', borderRadius: '1rem', backgroundColor: '#fff', border: '1px solid #e2e8f0', color: '#64748b' }}>
                        {t('agent.aiTyping')}
                      </div>
                    </div>
                  )}
                </div>

                {/* Chat Input Area */}
                <form onSubmit={handleSendChat} style={{ padding: '1rem', backgroundColor: '#fff', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '0.5rem' }}>
                  <input 
                    type="text" 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder={t('agent.chatInputPlaceholder')}
                    style={{ flex: 1, padding: '0.75rem 1rem', borderRadius: '2rem', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.95rem' }}
                    disabled={isAiLoading || chatHistory.length === 0}
                  />
                  <button 
                    type="submit"
                    disabled={isAiLoading || chatHistory.length === 0 || !chatInput.trim()}
                    style={{ 
                      width: '45px', height: '45px', borderRadius: '50%', border: 'none', 
                      backgroundColor: (isAiLoading || !chatInput.trim()) ? '#cbd5e1' : 'var(--primary-color)', 
                      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: (isAiLoading || !chatInput.trim()) ? 'not-allowed' : 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                  >
                    <Send size={18} style={{ marginLeft: '-2px' }} />
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SetupAIAgent;
