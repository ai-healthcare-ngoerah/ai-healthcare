import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, X, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const PatientSearchDropdown = ({
  queue = [],
  selectedQueueId = '',
  onSelectQueue,
  placeholder = null
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const listRef = useRef(null);

  // Find currently selected patient object
  const selectedPatient = useMemo(() => {
    if (!selectedQueueId) return null;
    return queue.find(
      (q) => String(q.id) === String(selectedQueueId) || String(q.appointment_id) === String(selectedQueueId)
    );
  }, [queue, selectedQueueId]);

  // Computed display text for trigger button: NO ANTRIAN - NAME
  const triggerLabel = useMemo(() => {
    if (selectedPatient) {
      const idx = queue.findIndex(
        (q) => String(q.id) === String(selectedQueueId) || String(q.appointment_id) === String(selectedQueueId)
      );
      const queueNo = selectedPatient.queue_number || `A-${String(idx + 1).padStart(2, '0')}`;
      const pName = selectedPatient.name || selectedPatient.patient_name || t('scribe.patientInfo.defaultPatient', 'Pasien Umum');
      return `${queueNo} - ${pName}`;
    }
    const defaultPlaceholder = placeholder || t('scribe.patientInfo.queuePlaceholder', 'Pilih Antrean Hari Ini');
    return `${defaultPlaceholder} (${queue.length})`;
  }, [selectedPatient, queue, selectedQueueId, placeholder, t]);

  // Filter patients based on search term
  const filteredQueue = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return queue;

    return queue.filter((q, idx) => {
      const queueNo = (q.queue_number || `A-${String(idx + 1).padStart(2, '0')}`).toLowerCase();
      const pName = (q.name || q.patient_name || '').toLowerCase();
      const rmNo = (q.medical_record_no || '').toLowerCase();
      return queueNo.includes(term) || pName.includes(term) || rmNo.includes(term);
    });
  }, [queue, searchTerm]);

  const handleSelect = (id) => {
    if (onSelectQueue) {
      onSelectQueue(id);
    }
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    if (onSelectQueue) {
      onSelectQueue('');
    }
    setIsOpen(false);
  };

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation listeners (ArrowDown, ArrowUp, Enter, Escape)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex((prev) => Math.min(prev + 1, filteredQueue.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex((prev) => Math.max(prev - 1, -1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (highlightedIndex === -1) {
          handleSelect('');
        } else if (highlightedIndex >= 0 && highlightedIndex < filteredQueue.length) {
          const item = filteredQueue[highlightedIndex];
          handleSelect(item.id || item.appointment_id);
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, highlightedIndex, filteredQueue]);

  // Reset highlight index when search changes or dropdown toggles
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [searchTerm, isOpen]);

  // Auto-scroll highlighted option into view
  useEffect(() => {
    if (isOpen && listRef.current) {
      const activeEl = listRef.current.querySelector('[data-highlighted="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  // Auto-focus search input when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    } else if (!isOpen) {
      setSearchTerm('');
    }
  }, [isOpen]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        flex: 1,
        minWidth: '240px',
        maxWidth: '100%'
      }}
    >
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.65rem',
          padding: '0.55rem 0.85rem',
          borderRadius: '8px',
          border: `1px solid ${isOpen ? 'var(--primary-color)' : 'var(--border-color)'}`,
          background: selectedPatient ? '#ffffff' : '#f8fafc',
          color: selectedPatient ? 'var(--text-main)' : 'var(--text-muted)',
          fontSize: '0.875rem',
          fontWeight: 600,
          cursor: 'pointer',
          textAlign: 'left',
          boxSizing: 'border-box',
          transition: 'all 0.15s ease',
          outline: 'none',
          boxShadow: isOpen ? '0 0 0 2px rgba(5, 150, 105, 0.15)' : 'none'
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <Search size={15} color={selectedPatient ? 'var(--primary-color)' : 'var(--text-muted)'} style={{ flexShrink: 0 }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {triggerLabel}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
          {selectedPatient && (
            <span
              onClick={handleClear}
              title={t('scribe.patientInfo.resetTitle', 'Reset Pilihan')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.15rem',
                borderRadius: '50%',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'background 0.15s ease'
              }}
              onMouseOver={(e) => { e.currentTarget.style.color = '#ef4444'; }}
              onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              <X size={14} />
            </span>
          )}
          <ChevronDown
            size={16}
            color="var(--text-muted)"
            style={{
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease'
            }}
          />
        </div>
      </button>

      {/* Popover Dropdown Panel */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            zIndex: 100,
            backgroundColor: '#ffffff',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.06)',
            overflow: 'hidden'
          }}
        >
          {/* Search Input Filter */}
          <div
            style={{
              padding: '0.65rem 0.75rem',
              borderBottom: '1px solid var(--border-color)',
              background: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Search size={15} color="var(--primary-color)" style={{ flexShrink: 0 }} />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('scribe.patientInfo.searchPlaceholder', 'Cari nama, no. antrean, atau RM...')}
              style={{
                width: '100%',
                border: 'none',
                background: 'transparent',
                fontSize: '0.85rem',
                fontWeight: 500,
                color: 'var(--text-main)',
                outline: 'none'
              }}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                style={{
                  border: 'none',
                  background: 'transparent',
                  padding: '0.1rem',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  display: 'flex'
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* List Options */}
          <div
            ref={listRef}
            role="listbox"
            style={{
              maxHeight: '260px',
              overflowY: 'auto',
              padding: '0.35rem 0'
            }}
          >
            {/* Reset / Manual Option */}
            <div
              data-highlighted={highlightedIndex === -1 ? 'true' : 'false'}
              onClick={() => handleSelect('')}
              onMouseEnter={() => setHighlightedIndex(-1)}
              style={{
                padding: '0.55rem 0.85rem',
                fontSize: '0.825rem',
                color: !selectedQueueId ? 'var(--primary-color)' : 'var(--text-muted)',
                fontWeight: !selectedQueueId ? 600 : 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: !selectedQueueId ? '#ecfdf5' : (highlightedIndex === -1 ? '#f1f5f9' : 'transparent'),
                transition: 'background 0.12s ease'
              }}
            >
              <span>{t('scribe.patientInfo.manualOption', 'Kosongkan / Input Pasien Manual')}</span>
              {!selectedQueueId && <Check size={14} color="var(--primary-color)" />}
            </div>

            {/* Filtered Patient Items */}
            {filteredQueue.length > 0 ? (
              filteredQueue.map((q, idx) => {
                const qId = q.id || q.appointment_id;
                const isSelected = String(qId) === String(selectedQueueId);
                const isHighlighted = highlightedIndex === idx;
                const queueNo = q.queue_number || `A-${String(idx + 1).padStart(2, '0')}`;
                const pName = q.name || q.patient_name || 'Pasien Umum';
                const rmNo = q.medical_record_no;
                const timeStr = q.appointment_time;

                return (
                  <div
                    key={qId}
                    role="option"
                    aria-selected={isSelected}
                    data-highlighted={isHighlighted ? 'true' : 'false'}
                    onClick={() => handleSelect(qId)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    style={{
                      padding: '0.65rem 0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.75rem',
                      cursor: 'pointer',
                      borderBottom: '1px solid #f1f5f9',
                      backgroundColor: isSelected ? '#ecfdf5' : (isHighlighted ? '#f1f5f9' : 'transparent'),
                      transition: 'background 0.12s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', overflow: 'hidden' }}>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.5rem',
                          borderRadius: '6px',
                          background: isSelected ? '#059669' : '#e2e8f0',
                          color: isSelected ? '#ffffff' : '#334155',
                          flexShrink: 0
                        }}
                      >
                        {queueNo}
                      </span>
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {pName}
                        </div>
                        {(rmNo || timeStr) && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '0.5rem' }}>
                            {rmNo && <span>RM: {rmNo}</span>}
                            {rmNo && timeStr && <span>•</span>}
                            {timeStr && <span>{timeStr}</span>}
                          </div>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <Check size={16} color="var(--primary-color)" style={{ flexShrink: 0 }} />
                    )}
                  </div>
                );
              })
            ) : (
              <div
                style={{
                  padding: '1.25rem 0.85rem',
                  textAlign: 'center',
                  fontSize: '0.825rem',
                  color: 'var(--text-muted)'
                }}
              >
                {t('scribe.patientInfo.notFound', 'Pasien tidak ditemukan dalam antrean')}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientSearchDropdown;
