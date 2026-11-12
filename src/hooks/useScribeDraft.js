import { useState, useEffect, useCallback, useRef } from 'react';

const DRAFT_STORAGE_KEY = 'health_ai_scribe_active_draft_v1';

/**
 * useScribeDraft - Ergonomic custom hook for auto-saving and recovering active SOAP notes
 * Prevents accidental data loss during network blips, tab switches, or accidental page refreshes.
 */
export const useScribeDraft = ({
  soapNote = '',
  transcription = '',
  patientInfo = {},
  enabled = true,
  debounceMs = 600
} = {}) => {
  const [hasSavedDraft, setHasSavedDraft] = useState(() => {
    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return Boolean(parsed && (parsed.soapNote || parsed.transcription));
      }
    } catch (err) {
      console.warn('[useScribeDraft] Error inspecting localStorage:', err);
    }
    return false;
  });
  const debounceTimerRef = useRef(null);

  // Debounced auto-save whenever active note content changes
  useEffect(() => {
    if (!enabled) return;

    // Only save if there is actually content
    const hasContent = Boolean(
      (soapNote && soapNote.trim().length > 0) ||
      (transcription && transcription.trim().length > 0)
    );

    if (!hasContent) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      try {
        const payload = {
          soapNote,
          transcription,
          patientInfo: {
            patientId: patientInfo.patientId || '',
            patientName: patientInfo.patientName || '',
            patientPhone: patientInfo.patientPhone || '',
            medicalRecordNo: patientInfo.medicalRecordNo || '',
            selectedQueueId: patientInfo.selectedQueueId || ''
          },
          savedAt: new Date().toISOString()
        };
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload));
        setHasSavedDraft(true);
      } catch (err) {
        console.warn('[useScribeDraft] Error saving draft to localStorage:', err);
      }
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [soapNote, transcription, patientInfo, enabled, debounceMs]);

  // Read draft data
  const getDraft = useCallback(() => {
    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      console.warn('[useScribeDraft] Error reading draft:', err);
      return null;
    }
  }, []);

  // Explicitly purge active draft from storage (on successful submit/reset)
  const clearDraft = useCallback(() => {
    try {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      setHasSavedDraft(false);
    } catch (err) {
      console.warn('[useScribeDraft] Error clearing draft:', err);
    }
  }, []);

  return {
    hasSavedDraft,
    getDraft,
    clearDraft
  };
};

export default useScribeDraft;
