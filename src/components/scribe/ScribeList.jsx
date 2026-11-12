import React, { useState, useEffect } from 'react';
import {
  Trash2, Edit3, Download, Search, RefreshCw, AlertCircle,
  CheckSquare, Square, FileText, X, Save, Eye, Check, MoreVertical
} from 'lucide-react';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  getScribeNotes,
  updateScribeNote,
  deleteScribeNote,
  deleteBatchScribeNotes,
  deleteAllScribeNotes
} from '../../services/scribeService';
import { useNotification } from '../../context/NotificationContext';

const ScribeList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showToast, confirmAction } = useNotification();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);

  // Edit modal state
  const [editingNote, setEditingNote] = useState(null);
  const [editPatientName, setEditPatientName] = useState('');
  const [editRawText, setEditRawText] = useState('');
  const [editTranscription, setEditTranscription] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [viewingNotes, setViewingNotes] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);

  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const fetchNotes = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getScribeNotes();
      const noteList = Array.isArray(data) ? data : (data.notes || []);
      setNotes(noteList);
      setSelectedIds([]);
    } catch (err) {
      console.error('Error fetching scribe notes:', err);
      setError(err.message || t('scribe.list.loadError', 'Gagal memuat daftar catatan SOAP'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  // Filter notes by search query
  const filteredNotes = notes.filter((n) => {
    const q = searchQuery.toLowerCase();
    const nameMatch = (n.patient_name || '').toLowerCase().includes(q);
    const textMatch = (n.raw_text || `${n.subjective || ''} ${n.assessment || ''}`).toLowerCase().includes(q);
    return nameMatch || textMatch;
  });

  // Checkbox Select All logic
  const isAllSelected = filteredNotes.length > 0 && selectedIds.length === filteredNotes.length;
  const isSomeSelected = selectedIds.length > 0 && selectedIds.length < filteredNotes.length;

  // Checkbox Select All
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filteredNotes.map((n) => n.id));
    } else {
      setSelectedIds([]);
    }
  };

  // Checkbox Select Single (Toggle)
  const handleToggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };
  const handleSelectOne = handleToggleSelect;

  // Delete single note
  const handleDeleteSingle = (id) => {
    confirmAction({
      title: t('scribe.list.confirmDeleteSingleTitle', 'Hapus Catatan Medis'),
      message: t('scribe.list.confirmDeleteSingleMsg', 'Apakah Anda yakin ingin menghapus catatan medis ini? Tindakan ini tidak dapat dibatalkan.'),
      type: 'danger',
      confirmText: t('scribe.list.confirmDeleteSingleBtn', 'Ya, Hapus'),
      cancelText: t('common.cancelBtn', 'Batal'),
      onConfirm: async () => {
        try {
          await deleteScribeNote(id);
          setNotes((prev) => prev.filter((n) => n.id !== id));
          setSelectedIds((prev) => prev.filter((item) => item !== id));
          showToast({
            type: 'success',
            title: t('scribe.list.deleteSingleSuccess', 'Catatan medis berhasil dihapus.'),
            message: t('scribe.list.deleteSingleSuccess', 'Catatan medis berhasil dihapus.'),
          });
        } catch (err) {
          showToast({
            type: 'error',
            title: t('scribe.list.deleteErrorTitle', 'Gagal Menghapus'),
            message: err.message || t('scribe.list.deleteErrorTitle', 'Gagal menghapus catatan medis.'),
          });
        }
      },
    });
  };

  // Delete batch notes
  const handleDeleteBatch = () => {
    if (selectedIds.length === 0) return;
    confirmAction({
      title: t('scribe.list.confirmDeleteBatchTitle', { count: selectedIds.length, defaultValue: `Hapus ${selectedIds.length} Catatan Terpilih` }),
      message: t('scribe.list.confirmDeleteBatchMsg', { count: selectedIds.length, defaultValue: `Apakah Anda yakin ingin menghapus ${selectedIds.length} catatan medis yang terpilih?` }),
      type: 'danger',
      confirmText: t('scribe.list.confirmDeleteBatchBtn', 'Ya, Hapus Terpilih'),
      cancelText: t('common.cancelBtn', 'Batal'),
      onConfirm: async () => {
        try {
          await deleteBatchScribeNotes(selectedIds);
          setNotes((prev) => prev.filter((n) => !selectedIds.includes(n.id)));
          const count = selectedIds.length;
          setSelectedIds([]);
          showToast({
            type: 'success',
            title: t('scribe.list.deleteBatchSuccess', { count, defaultValue: `${count} catatan medis berhasil dihapus.` }),
            message: t('scribe.list.deleteBatchSuccess', { count, defaultValue: `${count} catatan medis berhasil dihapus.` }),
          });
        } catch (err) {
          showToast({
            type: 'error',
            title: t('scribe.list.deleteErrorTitle', 'Gagal Menghapus'),
            message: err.message || t('scribe.list.deleteErrorTitle', 'Gagal menghapus catatan terpilih.'),
          });
        }
      },
    });
  };

  // Delete all notes
  const handleDeleteAll = () => {
    if (notes.length === 0) return;
    confirmAction({
      title: t('scribe.list.confirmDeleteAllTitle', 'Hapus SELURUH Catatan SOAP'),
      message: t('scribe.list.confirmDeleteAllMsg', 'PERINGATAN KONTEN: Apakah Anda yakin ingin menghapus SELURUH catatan SOAP? Tindakan ini tidak dapat dibatalkan.'),
      type: 'danger',
      confirmText: t('scribe.list.confirmDeleteAllBtn', 'Ya, Hapus Semua'),
      cancelText: t('common.cancelBtn', 'Batal'),
      onConfirm: async () => {
        try {
          await deleteAllScribeNotes();
          setNotes([]);
          setSelectedIds([]);
          showToast({
            type: 'success',
            title: t('scribe.list.deleteAllSuccess', 'Seluruh catatan SOAP berhasil dihapus.'),
            message: t('scribe.list.deleteAllSuccess', 'Seluruh catatan SOAP berhasil dihapus.'),
          });
        } catch (err) {
          showToast({
            type: 'error',
            title: t('scribe.list.deleteErrorTitle', 'Gagal Menghapus'),
            message: err.message || t('scribe.list.deleteErrorTitle', 'Gagal menghapus seluruh catatan.'),
          });
        }
      },
    });
  };

  // Open Edit Modal
  const handleOpenEdit = (note) => {
    setEditingNote(note);
    setEditPatientName(note.patient_name || 'Pasien Umum');
    const defaultRaw = note.raw_text || (note.subjective ? `S (Subjective):\n${note.subjective}\n\nO (Objective):\n${note.objective || '-'}\n\nA (Assessment):\n${note.assessment || '-'}\n\nP (Plan):\n${note.plan || '-'}` : '');
    setEditRawText(defaultRaw);
    setEditTranscription(note.transcription || '');
  };

  // Save Edit Modal
  const handleSaveEdit = async () => {
    if (!editingNote) return;
    setIsSavingEdit(true);
    try {
      const updated = await updateScribeNote(editingNote.id, {
        patient_name: editPatientName,
        raw_text: editRawText,
        transcription: editTranscription,
      });
      setNotes(notes.map((n) => (n.id === editingNote.id ? updated.note : n)));
      setEditingNote(null);
      showToast({
        type: 'success',
        title: 'Perubahan Disimpan',
        message: 'Catatan medis berhasil diperbarui.',
      });
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Gagal Menyimpan',
        message: err.message || 'Gagal menyimpan perubahan.',
      });
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Export DOCX
  const handleExportDocx = async (note) => {
    try {
      const textToExport = note.raw_text || (note.subjective ? `S (Subjective):\n${note.subjective}\n\nO (Objective):\n${note.objective || '-'}\n\nA (Assessment):\n${note.assessment || '-'}\n\nP (Plan):\n${note.plan || '-'}` : '');
      const lines = textToExport.split('\n');
      const paragraphs = [
        new Paragraph({
          text: `REKAM MEDIS - CPPT / SOAP NOTE`,
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `Nama Pasien: `, bold: true }),
            new TextRun({ text: note.patient_name || 'Pasien Umum' }),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `Tanggal: `, bold: true }),
            new TextRun({ text: new Date(note.created_at).toLocaleString('id-ID') }),
          ],
          spacing: { after: 300 },
        }),
      ];

      lines.forEach((line) => {
        const trimmed = line.trim();
        if (trimmed) {
          paragraphs.push(
            new Paragraph({
              children: [new TextRun({ text: trimmed })],
              spacing: { after: 120 },
            })
          );
        }
      });

      const doc = new Document({
        sections: [
          {
            properties: {},
            children: paragraphs,
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `SOAP_${(note.patient_name || 'pasien').replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.docx`);
    } catch (err) {
      console.error('Export docx error:', err);
      alert('Gagal mengekspor dokumen Word.');
    }
  };

  // Export Batch DOCX (Group Action)
  const handleExportBatchDocx = async () => {
    if (selectedIds.length === 0) return;
    try {
      const selectedNotes = notes.filter((n) => selectedIds.includes(n.id));
      const paragraphs = [
        new Paragraph({
          text: `LAPORAN REKAM MEDIS - CPPT / SOAP NOTE (MASSAL)`,
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 300 },
        }),
      ];

      selectedNotes.forEach((note, index) => {
        paragraphs.push(
          new Paragraph({
            text: `${index + 1}. Pasien: ${note.patient_name || 'Pasien Umum'}`,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 240, after: 120 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Tanggal: `, bold: true }),
              new TextRun({ text: new Date(note.created_at).toLocaleString('id-ID') }),
            ],
            spacing: { after: 200 },
          })
        );

        const lines = (note.raw_text || '').split('\n');
        lines.forEach((line) => {
          const trimmed = line.trim();
          if (trimmed) {
            paragraphs.push(
              new Paragraph({
                children: [new TextRun({ text: trimmed })],
                spacing: { after: 120 },
              })
            );
          }
        });

        if (index < selectedNotes.length - 1) {
          paragraphs.push(
            new Paragraph({
              text: `-------------------------------------------------------------------------`,
              spacing: { before: 200, after: 200 },
            })
          );
        }
      });

      const doc = new Document({
        sections: [
          {
            properties: {},
            children: paragraphs,
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `Laporan_SOAP_Massal_${new Date().toISOString().slice(0, 10)}.docx`);
    } catch (err) {
      console.error('Export batch docx error:', err);
      alert('Gagal mengekspor dokumen Word massal.');
    }
  };

  // View Batch (Group Action)
  const handleViewBatch = () => {
    if (selectedIds.length === 0) return;
    const selected = notes.filter((n) => selectedIds.includes(n.id));
    setViewingNotes(selected);
  };

  // Edit Batch (Group Action)
  const handleEditBatch = () => {
    if (selectedIds.length === 0) return;
    const firstSelected = notes.find((n) => selectedIds.includes(n.id));
    if (firstSelected) {
      handleOpenEdit(firstSelected);
    }
  };

  return (
    <div className="card" style={{ padding: '2rem' }}>
      {/* Header & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)' }}>
            {t('scribe.list.title')}
          </h2>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {t('scribe.list.desc')}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={fetchNotes}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.55rem 1rem',
              border: '1px solid #cbd5e1',
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#ffffff',
              cursor: 'pointer',
              color: '#475569',
              fontWeight: 600,
            }}
            title={t('scribe.list.refreshBtn')}
          >
            <RefreshCw size={16} />
            <span>{t('scribe.list.refreshBtn')}</span>
          </button>

          {notes.length > 0 && (
            <button
              onClick={handleDeleteAll}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.55rem 1rem',
                border: '1px solid #f87171',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#fef2f2',
                color: '#dc2626',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              <Trash2 size={16} />
              <span>{t('scribe.list.deleteAllBtn')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: '1.5rem', position: 'relative', maxWidth: '400px' }}>
        <Search
          size={18}
          style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
        />
        <input
          type="text"
          placeholder={t('scribe.list.searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '0.6rem 1rem 0.6rem 2.5rem',
            border: '1px solid #cbd5e1',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.9rem',
          }}
        />
      </div>

      {/* Error state */}
      {error && (
        <div style={{ padding: '1rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-md)', color: '#dc2626', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Memuat daftar catatan SOAP...
        </div>
      ) : filteredNotes.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '3rem 1.5rem',
            border: '1px dashed #cbd5e1',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: '#f8fafc',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.65rem',
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              backgroundColor: '#ecfdf5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary-color)',
            }}
          >
            <FileText size={22} />
          </div>
          <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.925rem' }}>
            {searchQuery ? t('scribe.list.emptySearch') : t('scribe.list.emptyState')}
          </div>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.825rem', maxWidth: '380px', lineHeight: 1.5 }}>
            {searchQuery
              ? t('scribe.list.emptySearchDesc', 'Coba kata kunci pencarian lain atau bersihkan filter pencarian.')
              : t('scribe.list.emptyStateDesc', 'Belum ada rekam medis yang disimpan. Mulai konsultasi baru untuk membuat catatan SOAP.')}
          </p>
          {!searchQuery && (
            <button
              type="button"
              onClick={() => navigate('/app/asisten-medis')}
              className="btn-primary"
              style={{
                marginTop: '0.4rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.85rem',
                padding: '0.5rem 1.25rem',
                borderRadius: 'var(--radius-md)'
              }}
            >
              <span>{t('scribe.list.startNewScribe', 'Mulai Sesi Scribe')}</span>
            </button>
          )}
        </div>
      ) : (
        <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 'var(--radius-md)' }}>
          {/* Group Action Toolbar Integrated in Table "List Medical Scribe" */}
          {selectedIds.length > 0 && (
            <div
              style={{
                backgroundColor: '#f8fafc',
                borderBottom: '1px solid #cbd5e1',
                padding: '0.75rem 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{
                  backgroundColor: '#0284c7',
                  color: 'white',
                  padding: '0.2rem 0.65rem',
                  borderRadius: 'var(--radius-full)',
                  fontWeight: 700,
                  fontSize: '0.82rem'
                }}>
                  {selectedIds.length}
                </span>
                <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#1e293b' }}>
                  {t('scribe.list.selectedCount')}
                </span>
              </div>

              {/* Action buttons grouped closely on the right */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                {/* 2. Export */}
                <button
                  onClick={handleExportBatchDocx}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.45rem 0.85rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: '#ffffff',
                    color: '#16a34a',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.82rem'
                  }}
                  title={t('scribe.list.exportBatch').replace('{{count}}', selectedIds.length)}
                >
                  <Download size={15} />
                  <span>{t('scribe.list.exportBatch').replace('{{count}}', selectedIds.length)}</span>
                </button>

                {/* 3. Delete */}
                <button
                  onClick={handleDeleteBatch}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.45rem 0.85rem',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: '#ef4444',
                    color: '#ffffff',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.82rem'
                  }}
                  title={t('scribe.list.deleteBatch').replace('{{count}}', selectedIds.length)}
                >
                  <Trash2 size={15} />
                  <span>{t('scribe.list.deleteBatch').replace('{{count}}', selectedIds.length)}</span>
                </button>

                {/* Deselect All */}
                <button
                  onClick={() => setSelectedIds([])}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.45rem 0.7rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'transparent',
                    color: '#64748b',
                    cursor: 'pointer',
                    fontWeight: 500,
                    fontSize: '0.82rem'
                  }}
                  title={t('scribe.list.deselectAll')}
                >
                  <X size={15} />
                  <span>{t('scribe.list.deselectAll')}</span>
                </button>
              </div>
            </div>
          )}
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
                <th style={{ padding: '0.85rem 1rem', width: '45px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isSomeSelected;
                    }}
                    onChange={handleSelectAll}
                    style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                    title="Select All"
                  />
                </th>
                <th style={{ padding: '0.85rem 1rem' }}>{t('scribe.list.headerDate')}</th>
                <th style={{ padding: '0.85rem 1rem' }}>{t('scribe.list.headerPatient')}</th>
                <th style={{ padding: '0.85rem 1rem' }}>{t('scribe.list.headerSoap')}</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>{t('scribe.list.headerAction')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredNotes.map((note) => {
                const isChecked = selectedIds.includes(note.id);
                return (
                  <tr
                    key={note.id}
                    style={{
                      borderBottom: '1px solid #e2e8f0',
                      backgroundColor: isChecked ? '#eff6ff' : '#ffffff',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    <td
                      style={{ padding: '0.85rem 1rem', textAlign: 'center', cursor: 'pointer' }}
                      onClick={(e) => {
                        if (e.target.tagName !== 'INPUT') {
                          handleToggleSelect(note.id);
                        }
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleSelect(note.id)}
                        style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                      />
                    </td>
                    <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap', color: '#64748b' }}>
                      {new Date(note.created_at).toLocaleString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#1e293b' }}>
                      {note.patient_name || t('scribe.list.generalPatient', 'Pasien Umum')}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: '#334155', maxWidth: '350px' }}>
                      <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {(note.raw_text || (note.subjective ? `S: ${note.subjective} | A: ${note.assessment || ''}` : '') || '-').replace(/\s+/g, ' ')}
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right', whiteSpace: 'nowrap', position: 'relative' }}>
                      <div style={{ display: 'inline-flex', position: 'relative' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(openMenuId === note.id ? null : note.id);
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '32px',
                            height: '32px',
                            border: '1px solid #cbd5e1',
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: openMenuId === note.id ? '#f1f5f9' : '#ffffff',
                            color: '#475569',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                          }}
                          title={t('scribe.list.moreActions', 'Aksi Lainnya')}
                        >
                          <MoreVertical size={16} />
                        </button>

                        {/* 3-Dot Dropdown Menu */}
                        {openMenuId === note.id && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              position: 'absolute',
                              right: 0,
                              top: '100%',
                              marginTop: '0.35rem',
                              backgroundColor: '#ffffff',
                              border: '1px solid #e2e8f0',
                              borderRadius: 'var(--radius-md)',
                              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.15), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                              minWidth: '160px',
                              zIndex: 50,
                              display: 'flex',
                              flexDirection: 'column',
                              padding: '0.4rem 0',
                              textAlign: 'left'
                            }}
                          >
                            <button
                              onClick={() => {
                                setOpenMenuId(null);
                                setViewingNotes([note]);
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.65rem',
                                width: '100%',
                                padding: '0.6rem 1rem',
                                border: 'none',
                                background: 'none',
                                color: '#334155',
                                cursor: 'pointer',
                                fontSize: '0.86rem',
                                fontWeight: 500,
                                textAlign: 'left'
                              }}
                            >
                              <Eye size={15} color="#0284c7" />
                              <span>{t('scribe.list.viewBtn')}</span>
                            </button>

                            <button
                              onClick={() => {
                                setOpenMenuId(null);
                                handleOpenEdit(note);
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.65rem',
                                width: '100%',
                                padding: '0.6rem 1rem',
                                border: 'none',
                                background: 'none',
                                color: '#334155',
                                cursor: 'pointer',
                                fontSize: '0.86rem',
                                fontWeight: 500,
                                textAlign: 'left'
                              }}
                            >
                              <Edit3 size={15} color="#0284c7" />
                              <span>{t('scribe.list.editBtn')}</span>
                            </button>

                            <button
                              onClick={() => {
                                setOpenMenuId(null);
                                handleExportDocx(note);
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.65rem',
                                width: '100%',
                                padding: '0.6rem 1rem',
                                border: 'none',
                                background: 'none',
                                color: '#334155',
                                cursor: 'pointer',
                                fontSize: '0.86rem',
                                fontWeight: 500,
                                textAlign: 'left'
                              }}
                            >
                              <Download size={15} color="#16a34a" />
                              <span>{t('scribe.list.exportWordBtn')}</span>
                            </button>

                            <div style={{ height: '1px', backgroundColor: '#e2e8f0', margin: '0.25rem 0' }} />

                            <button
                              onClick={() => {
                                setOpenMenuId(null);
                                handleDeleteSingle(note.id);
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.65rem',
                                width: '100%',
                                padding: '0.6rem 1rem',
                                border: 'none',
                                background: 'none',
                                color: '#ef4444',
                                cursor: 'pointer',
                                fontSize: '0.86rem',
                                fontWeight: 500,
                                textAlign: 'left'
                              }}
                            >
                              <Trash2 size={15} color="#ef4444" />
                              <span>{t('scribe.list.deleteBtn')}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Edit */}
      {editingNote && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              width: '100%',
              maxWidth: '720px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '2rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>
                {t('scribe.list.modalEditTitle')}
              </h3>
              <button
                onClick={() => setEditingNote(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#475569' }}>
                {t('scribe.list.patientNameLabel')}
              </label>
              <input
                type="text"
                value={editPatientName}
                onChange={(e) => setEditPatientName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.85rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.95rem',
                }}
              />
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#475569' }}>
                {t('scribe.list.rawTextLabel')}
              </label>
              <textarea
                value={editRawText}
                onChange={(e) => setEditRawText(e.target.value)}
                style={{
                  width: '100%',
                  minHeight: '220px',
                  padding: '0.85rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: 'var(--radius-md)',
                  fontFamily: 'monospace',
                  fontSize: '0.9rem',
                  lineHeight: '1.5',
                  resize: 'vertical',
                }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#475569' }}>
                {t('scribe.list.transcriptionLabel')}
              </label>
              <textarea
                value={editTranscription}
                onChange={(e) => setEditTranscription(e.target.value)}
                style={{
                  width: '100%',
                  minHeight: '120px',
                  padding: '0.85rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.9rem',
                  lineHeight: '1.5',
                  resize: 'vertical',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => {
                  setEditingNote(null);
                  showToast({ type: 'info', message: 'Pengeditan catatan medis dibatalkan.' });
                }}
                style={{
                  padding: '0.65rem 1.25rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#ffffff',
                  color: '#475569',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {t('scribe.list.cancelBtn')}
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={isSavingEdit}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.65rem 1.4rem',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#0284c7',
                  color: '#ffffff',
                  fontWeight: 600,
                  cursor: isSavingEdit ? 'not-allowed' : 'pointer',
                }}
              >
                <Save size={18} />
                <span>{isSavingEdit ? 'Menyimpan...' : t('scribe.list.saveChangesBtn')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Batch Modal (Group Action View) */}
      {viewingNotes && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              width: '100%',
              maxWidth: '750px',
              maxHeight: '85vh',
              overflowY: 'auto',
              padding: '2rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700, color: '#1e293b' }}>
                  Pratinjau Catatan SOAP Terpilih
                </h3>
                <p style={{ margin: '0.2rem 0 0', color: '#64748b', fontSize: '0.85rem' }}>
                  Menampilkan {viewingNotes.length} catatan medis terpilih.
                </p>
              </div>
              <button
                onClick={() => setViewingNotes(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={22} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {viewingNotes.map((n, idx) => (
                <div
                  key={n.id}
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.25rem',
                    backgroundColor: '#f8fafc'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontWeight: 700, color: '#0284c7', fontSize: '1rem' }}>
                      #{idx + 1} - {n.patient_name || 'Pasien Tanpa Nama'}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: '#64748b', backgroundColor: '#e2e8f0', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                      {n.created_at ? new Date(n.created_at).toLocaleString('id-ID') : '-'}
                    </span>
                  </div>

                  <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.88rem', color: '#334155', backgroundColor: '#ffffff', padding: '1rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                    {n.raw_text || (n.subjective ? `S (Subjective):\n${n.subjective}\n\nO (Objective):\n${n.objective || '-'}\n\nA (Assessment):\n${n.assessment || '-'}\n\nP (Plan):\n${n.plan || '-'}` : '-')}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
              <button
                type="button"
                onClick={() => setViewingNotes(null)}
                style={{
                  padding: '0.6rem 1.4rem',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#0284c7',
                  color: '#ffffff',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Tutup Pratinjau
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScribeList;
