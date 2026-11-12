import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  BookOpen, Plus, Search, MoreVertical, Eye, Edit3, Trash2,
  FileText, Check, Shield, RefreshCw
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  getScribeKnowledge,
  getScribeKnowledgeDetail,
  createScribeKnowledge,
  updateScribeKnowledge,
  deleteScribeKnowledge
} from '../services/scribeService';
import { useNotification } from '../context/NotificationContext';
import KnowledgeDetailModal from '../components/knowledge/KnowledgeDetailModal';
import KnowledgeEditModal from '../components/knowledge/KnowledgeEditModal';
import KnowledgeAddModal from '../components/knowledge/KnowledgeAddModal';

export default function AIKnowledge() {
  const { t } = useTranslation();
  const { showToast, confirmAction } = useNotification();

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Floating portal dropdown state (Floats cleanly on top of the table)
  const [activeMenuDoc, setActiveMenuDoc] = useState(null);
  const [menuCoords, setMenuCoords] = useState({ top: 0, left: 0, openAbove: false });
  const menuRef = useRef(null);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewingDoc, setViewingDoc] = useState(null);
  const [editingDoc, setEditingDoc] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add form fields
  const [addMode, setAddMode] = useState('file'); // 'file' or 'manual'
  const [formTitle, setFormTitle] = useState('');
  const [formSource, setFormSource] = useState('Kemenkes RI');
  const [formType, setFormType] = useState('Dokumen Klinis');
  const [formContent, setFormContent] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleCloseMenu = () => {
    setActiveMenuDoc(null);
  };

  const handleToggleMenu = (e, doc) => {
    e.stopPropagation();
    if (activeMenuDoc?.id === doc.id) {
      handleCloseMenu();
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const menuWidth = 175;
    const menuHeight = 135;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openAbove = spaceBelow < menuHeight && rect.top > menuHeight;

    let left = rect.right - menuWidth;
    if (left < 10) left = 10;
    if (left + menuWidth > window.innerWidth - 10) {
      left = window.innerWidth - menuWidth - 10;
    }

    const top = openAbove
      ? Math.max(10, rect.top - menuHeight - 4)
      : Math.min(window.innerHeight - menuHeight - 10, rect.bottom + 4);

    setMenuCoords({ top, left, openAbove });
    setActiveMenuDoc(doc);
  };

  // Close floating dropdown on outside click, window resize, or scroll
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        handleCloseMenu();
      }
    };
    const handleScrollOrResize = () => {
      handleCloseMenu();
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, []);

  const loadDocuments = async () => {
    try {
      const data = await getScribeKnowledge();
      setDocuments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching knowledge documents:', err);
      showToast({
        type: 'error',
        title: 'Gagal Memuat Data',
        message: err.message || 'Gagal memuat dokumen pedoman klinis AI.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    const fetchDocs = async () => {
      try {
        const data = await getScribeKnowledge();
        if (!ignore) {
          setDocuments(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (!ignore) {
          console.error('Error fetching knowledge documents:', err);
          showToast({
            type: 'error',
            title: 'Gagal Memuat Data',
            message: err.message || 'Gagal memuat dokumen pedoman klinis AI.'
          });
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    fetchDocs();
    return () => {
      ignore = true;
    };
  }, [t, showToast]);

  const handleRefresh = () => {
    setLoading(true);
    loadDocuments();
  };

  // Filtered documents by search query only
  const filteredDocuments = documents.filter((doc) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (doc.title && doc.title.toLowerCase().includes(q)) ||
      (doc.source && doc.source.toLowerCase().includes(q)) ||
      (doc.file_name && doc.file_name.toLowerCase().includes(q)) ||
      (doc.content_preview && doc.content_preview.toLowerCase().includes(q))
    );
  });

  // Handle View
  const handleOpenView = async (doc) => {
    try {
      const detail = await getScribeKnowledgeDetail(doc.id);
      setViewingDoc(detail || doc);
    } catch (err) {
      console.error('Error fetching detail:', err);
      setViewingDoc(doc);
    }
  };

  // Handle Open Edit
  const handleOpenEdit = async (doc) => {
    if (doc.is_builtin) {
      showToast({
        type: 'warning',
        title: 'Dokumen Terproteksi',
        message: 'Dokumen standar nasional PNPK bersifat read-only dan tidak dapat disunting.'
      });
      return;
    }
    try {
      const detail = await getScribeKnowledgeDetail(doc.id);
      setEditingDoc(detail || doc);
    } catch {
      setEditingDoc(doc);
    }
  };

  // Handle Submit Edit
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingDoc) return;

    setIsSubmitting(true);
    try {
      await updateScribeKnowledge(editingDoc.id, {
        title: editingDoc.title,
        content: editingDoc.content
      });
      showToast({
        type: 'success',
        title: 'Berhasil',
        message: t('scribe.aiKnowledge.toastUpdated')
      });
      setEditingDoc(null);
      loadDocuments();
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Gagal',
        message: err.message || t('scribe.aiKnowledge.toastError')
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete
  const handleDelete = (doc) => {
    if (doc.is_builtin) {
      showToast({
        type: 'warning',
        title: 'Dokumen Terproteksi',
        message: 'Dokumen standar nasional PNPK bersifat read-only dan tidak dapat dihapus.'
      });
      return;
    }

    confirmAction({
      title: t('scribe.aiKnowledge.confirmDeleteTitle'),
      message: `${t('scribe.aiKnowledge.confirmDeleteMsg')} (${doc.title})`,
      confirmLabel: t('scribe.aiKnowledge.confirmDeleteBtn'),
      variant: 'danger',
      onConfirm: async () => {
        try {
          await deleteScribeKnowledge(doc.id);
          showToast({
            type: 'success',
            title: 'Berhasil',
            message: t('scribe.aiKnowledge.toastDeleted')
          });
          loadDocuments();
        } catch (err) {
          showToast({
            type: 'error',
            title: 'Gagal',
            message: err.message || t('scribe.aiKnowledge.toastError')
          });
        }
      }
    });
  };

  // Handle Submit Create
  const handleSaveAdd = async (e) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      showToast({
        type: 'warning',
        title: 'Perhatian',
        message: 'Judul dokumen wajib diisi.'
      });
      return;
    }

    if (addMode === 'file' && !selectedFile) {
      showToast({
        type: 'warning',
        title: 'Perhatian',
        message: 'Silakan pilih berkas dokumen yang ingin diunggah.'
      });
      return;
    }

    if (addMode === 'manual' && !formContent.trim()) {
      showToast({
        type: 'warning',
        title: 'Perhatian',
        message: 'Isi teks pedoman klinis wajib diisi.'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', formTitle.trim());
      formData.append('source', formSource.trim() || 'Faskes Internal');
      formData.append('type', formType);
      formData.append('content', formContent.trim());
      if (addMode === 'file' && selectedFile) {
        formData.append('file', selectedFile);
      }

      await createScribeKnowledge(formData);
      showToast({
        type: 'success',
        title: 'Berhasil',
        message: t('scribe.aiKnowledge.toastAdded')
      });
      setIsAddModalOpen(false);
      resetAddForm();
      loadDocuments();
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Gagal',
        message: err.message || t('scribe.aiKnowledge.toastError')
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAddForm = () => {
    setFormTitle('');
    setFormSource('Faskes Internal');
    setFormType('Dokumen Klinis');
    setFormContent('');
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: '#ecfdf5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary-color)'
              }}
            >
              <BookOpen size={20} />
            </div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
              {t('scribe.aiKnowledge.title', 'AI Knowledge')}
            </h1>
          </div>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            {t('scribe.aiKnowledge.subtitle', 'Kelola pedoman klinis (PNPK/PPK), SOP medis, dan basis pengetahuan RAG untuk Medical Scribe.')}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            resetAddForm();
            setIsAddModalOpen(true);
          }}
          className="btn-primary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.6rem 1.25rem',
            fontSize: '0.875rem',
            borderRadius: 'var(--radius-md)',
            fontWeight: 600,
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <Plus size={16} />
          <span>{t('scribe.aiKnowledge.addBtn', 'Unggah / Tambah Dokumen')}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '1rem 1.25rem',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        {/* Search Input */}
        <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: '480px' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '0.85rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)'
            }}
          />
          <input
            type="text"
            placeholder={t('scribe.aiKnowledge.searchPlaceholder', 'Cari pedoman klinis, diagnosis, atau SOP...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.55rem 0.85rem 0.55rem 2.4rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-input)',
              fontSize: '0.875rem',
              outline: 'none',
              backgroundColor: '#f8fafc'
            }}
          />
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={handleRefresh}
            title="Muat Ulang Data"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              color: '#64748b',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Main Table Content */}
      {loading ? (
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '3rem',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: '0.9rem'
          }}
        >
          <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 0.75rem', display: 'block', color: 'var(--primary-color)' }} />
          Memuat daftar dokumen AI Knowledge...
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '3.5rem 1.5rem',
            border: '1px dashed #cbd5e1',
            borderRadius: 'var(--radius-md)',
            backgroundColor: '#f8fafc',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem'
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              backgroundColor: '#ecfdf5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary-color)'
            }}
          >
            <BookOpen size={22} />
          </div>
          <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.95rem' }}>
            {searchQuery ? 'Tidak ada dokumen yang cocok dengan pencarian.' : t('scribe.aiKnowledge.emptyState')}
          </div>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.825rem', maxWidth: '400px', lineHeight: 1.5 }}>
            {searchQuery
              ? 'Silakan coba kata kunci lain atau bersihkan filter pencarian.'
              : 'Basis RAG saat ini siap menerima berkas pedoman klinis (PDF, Markdown, TXT) atau pedoman SOP internal.'}
          </p>
        </div>
      ) : (
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            overflow: 'visible',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-md)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-color)', color: '#475569', fontSize: '0.785rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600 }}>
                    {t('scribe.aiKnowledge.table.title', 'Judul & Topik')}
                  </th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>
                    {t('scribe.aiKnowledge.table.type', 'Format')}
                  </th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>
                    {t('scribe.aiKnowledge.table.source', 'Sumber')}
                  </th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>
                    {t('scribe.aiKnowledge.table.preview', 'Ringkasan Konten')}
                  </th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>
                    Status
                  </th>
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600, textAlign: 'right' }}>
                    {t('scribe.aiKnowledge.table.actions', 'Aksi')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredDocuments.map((doc) => {
                  const isBuiltin = Boolean(doc.is_builtin);

                  return (
                    <tr
                      key={doc.id}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        transition: 'background-color 0.15s ease'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                    >
                      {/* Title & Topic */}
                      <td style={{ padding: '0.9rem 1.25rem', color: 'var(--text-main)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '6px',
                              backgroundColor: isBuiltin ? '#ecfdf5' : '#f1f5f9',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: isBuiltin ? '#059669' : '#475569',
                              flexShrink: 0
                            }}
                          >
                            {isBuiltin ? <Shield size={16} /> : <FileText size={16} />}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#0f172a', lineHeight: 1.3 }}>
                              {doc.title}
                            </div>
                            {doc.file_name && (
                              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                                📄 {doc.file_name}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Format Badge */}
                      <td style={{ padding: '0.9rem 1rem', whiteSpace: 'nowrap' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '0.2rem 0.55rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            backgroundColor: isBuiltin
                              ? '#ecfdf5'
                              : doc.type?.includes('PDF')
                              ? '#fef2f2'
                              : '#f0f9ff',
                            color: isBuiltin
                              ? '#047857'
                              : doc.type?.includes('PDF')
                              ? '#b91c1c'
                              : '#0369a1',
                            border: `1px solid ${
                              isBuiltin
                                ? '#a7f3d0'
                                : doc.type?.includes('PDF')
                                ? '#fecaca'
                                : '#bae6fd'
                            }`
                          }}
                        >
                          {doc.type || 'Dokumen'}
                        </span>
                      </td>

                      {/* Source */}
                      <td style={{ padding: '0.9rem 1rem', color: '#475569', whiteSpace: 'nowrap', fontWeight: 500 }}>
                        {doc.source || 'Faskes Internal'}
                      </td>

                      {/* Content Preview */}
                      <td style={{ padding: '0.9rem 1rem', color: '#64748b', maxWidth: '320px' }}>
                        <div
                          style={{
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            fontSize: '0.8rem'
                          }}
                        >
                          {doc.content_preview || '-'}
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '0.9rem 1rem', whiteSpace: 'nowrap' }}>
                        {isBuiltin ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              color: '#059669',
                              fontSize: '0.75rem',
                              fontWeight: 600
                            }}
                          >
                            <Check size={13} /> {t('scribe.aiKnowledge.badgePnpk', 'Standar Nasional')}
                          </span>
                        ) : (
                          <span
                            style={{
                              color: '#6366f1',
                              fontSize: '0.75rem',
                              fontWeight: 600
                            }}
                          >
                            {t('scribe.aiKnowledge.badgeCustom', 'Kustom Faskes')}
                          </span>
                        )}
                      </td>

                      {/* Actions: 3-dot Button */}
                      <td style={{ padding: '0.9rem 1.25rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button
                          type="button"
                          onClick={(e) => handleToggleMenu(e, doc)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '32px',
                            height: '32px',
                            border: '1px solid #cbd5e1',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: activeMenuDoc?.id === doc.id ? '#f1f5f9' : '#ffffff',
                            color: activeMenuDoc?.id === doc.id ? 'var(--primary-color)' : '#475569',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                          title="Aksi Dokumen"
                        >
                          <MoreVertical size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. Modal: View Document Detail                                            */}
      {/* ========================================================================= */}
      <KnowledgeDetailModal
        doc={viewingDoc}
        onClose={() => setViewingDoc(null)}
      />

      {/* ========================================================================= */}
      {/* 2. Modal: Edit Knowledge Document                                         */}
      {/* ========================================================================= */}
      <KnowledgeEditModal
        editingDoc={editingDoc}
        setEditingDoc={setEditingDoc}
        onSubmit={handleSaveEdit}
        onClose={() => setEditingDoc(null)}
        isSubmitting={isSubmitting}
      />

      {/* ========================================================================= */}
      {/* 3. Modal: Upload / Add Document                                           */}
      {/* ========================================================================= */}
      <KnowledgeAddModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleSaveAdd}
        isSubmitting={isSubmitting}
        addMode={addMode}
        setAddMode={setAddMode}
        formTitle={formTitle}
        setFormTitle={setFormTitle}
        formSource={formSource}
        setFormSource={setFormSource}
        formType={formType}
        setFormType={setFormType}
        formContent={formContent}
        setFormContent={setFormContent}
        selectedFile={selectedFile}
        setSelectedFile={setSelectedFile}
        fileInputRef={fileInputRef}
      />

      {/* FLOATING ACTION DROPDOWN PORTAL (Floats cleanly on top of the table) */}
      {activeMenuDoc && createPortal(
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            top: `${menuCoords.top}px`,
            left: `${menuCoords.left}px`,
            width: '175px',
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            zIndex: 9999,
            padding: '4px',
            textAlign: 'left'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* View Action */}
          <button
            type="button"
            onClick={() => {
              const target = activeMenuDoc;
              handleCloseMenu();
              handleOpenView(target);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              width: '100%',
              padding: '0.5rem 0.75rem',
              fontSize: '0.825rem',
              color: '#1e293b',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'background-color 0.1s ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <Eye size={14} color="#059669" />
            <span>{t('scribe.aiKnowledge.actions.view', 'Lihat Detail')}</span>
          </button>

          {/* Edit Action */}
          <button
            type="button"
            onClick={() => {
              const target = activeMenuDoc;
              handleCloseMenu();
              handleOpenEdit(target);
            }}
            disabled={Boolean(activeMenuDoc.is_builtin)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              width: '100%',
              padding: '0.5rem 0.75rem',
              fontSize: '0.825rem',
              color: activeMenuDoc.is_builtin ? '#94a3b8' : '#1e293b',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '4px',
              cursor: activeMenuDoc.is_builtin ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.1s ease'
            }}
            onMouseEnter={(e) => {
              if (!activeMenuDoc.is_builtin) e.currentTarget.style.backgroundColor = '#f1f5f9';
            }}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <Edit3 size={14} color={activeMenuDoc.is_builtin ? '#94a3b8' : '#3b82f6'} />
            <span>{t('scribe.aiKnowledge.actions.edit', 'Edit Dokumen')}</span>
          </button>

          {/* Divider */}
          <div style={{ height: '1px', backgroundColor: '#e2e8f0', margin: '3px 0' }} />

          {/* Delete Action */}
          <button
            type="button"
            onClick={() => {
              const target = activeMenuDoc;
              handleCloseMenu();
              handleDelete(target);
            }}
            disabled={Boolean(activeMenuDoc.is_builtin)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              width: '100%',
              padding: '0.5rem 0.75rem',
              fontSize: '0.825rem',
              color: activeMenuDoc.is_builtin ? '#94a3b8' : '#ef4444',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '4px',
              cursor: activeMenuDoc.is_builtin ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.1s ease'
            }}
            onMouseEnter={(e) => {
              if (!activeMenuDoc.is_builtin) e.currentTarget.style.backgroundColor = '#fef2f2';
            }}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <Trash2 size={14} color={activeMenuDoc.is_builtin ? '#94a3b8' : '#ef4444'} />
            <span>{t('scribe.aiKnowledge.actions.delete', 'Hapus Dokumen')}</span>
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}
