import React, { useState, useEffect } from 'react';
import { BookOpen, Upload, Eye, Edit2, Trash2, X, CheckCircle, AlertCircle, Save, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getKnowledgeReferences, updateKnowledgeReferenceText, deleteKnowledgeReference } from '../services/api';
import { useNotification } from '../context/NotificationContext';

const KnowledgeBase = () => {
  const navigate = useNavigate();
  const { showToast, confirmAction } = useNotification();

  // State for Display Rules
  const [rules, setRules] = useState([]);
  const [isLoadingRules, setIsLoadingRules] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  // State for View Modal
  const [viewModal, setViewModal] = useState({ isOpen: false, title: '', content: '' });

  // State for Edit Modal
  const [editModal, setEditModal] = useState({ isOpen: false, id: null, title: '', content: '' });
  const [isSaving, setIsSaving] = useState(false);

  // State for UI feedback
  const [message, setMessage] = useState({ type: '', text: '' });

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const [activeDropdownId, setActiveDropdownId] = useState(null);

  useEffect(() => {
    const handleClickOutside = () => setActiveDropdownId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const loadRules = async () => {
    setIsLoadingRules(true);
    try {
      const data = await getKnowledgeReferences();
      setRules(data);
    } catch (error) {
      console.error('Failed to load rules:', error);
    } finally {
      setIsLoadingRules(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  // Checkbox Select All logic
  const isAllSelected = rules.length > 0 && selectedIds.length === rules.length;
  const isSomeSelected = selectedIds.length > 0 && selectedIds.length < rules.length;

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(rules.map((r) => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleDeleteBatch = () => {
    confirmAction({
      title: 'Hapus Referensi Terpilih',
      message: `Apakah Anda yakin ingin menghapus ${selectedIds.length} referensi pengetahuan terpilih?`,
      type: 'danger',
      confirmText: 'Ya, Hapus Semua',
      onConfirm: async () => {
        try {
          await Promise.all(selectedIds.map((id) => deleteKnowledgeReference(id)));
          showToast({
            type: 'success',
            title: 'Berhasil Dihapus',
            message: `${selectedIds.length} referensi pengetahuan berhasil dihapus.`,
          });
          setSelectedIds([]);
          loadRules();
        } catch (error) {
          showToast({
            type: 'error',
            title: 'Gagal Menghapus',
            message: error.message || 'Gagal menghapus beberapa referensi.',
          });
        }
      },
    });
  };

  const handleDelete = (id) => {
    confirmAction({
      title: 'Hapus Referensi Pengetahuan',
      message: 'Apakah Anda yakin ingin menghapus referensi ini dari basis pengetahuan RAG?',
      type: 'danger',
      confirmText: 'Ya, Hapus',
      onConfirm: async () => {
        try {
          await deleteKnowledgeReference(id);
          showToast({
            type: 'success',
            title: 'Berhasil Dihapus',
            message: 'Referensi pengetahuan berhasil dihapus.',
          });
          loadRules();
        } catch (error) {
          showToast({
            type: 'error',
            title: 'Gagal Menghapus',
            message: error.message || 'Gagal menghapus referensi.',
          });
        }
      },
    });
  };

  const handleView = (rule) => {
    setViewModal({ isOpen: true, title: rule.title, content: rule.content || 'Konten tidak tersedia untuk file dokumen.' });
  };

  const handleEditOpen = (rule) => {
    setEditModal({ isOpen: true, id: rule.id, title: rule.title || '', content: rule.content || '' });
  };

  const handleSaveEdit = async () => {
    if (!editModal.title.trim() || !editModal.content.trim()) {
      showToast({
        type: 'warning',
        message: 'Judul dan Isi referensi wajib diisi.',
      });
      return;
    }

    setIsSaving(true);
    try {
      await updateKnowledgeReferenceText(editModal.id, editModal.title, editModal.content);
      showToast({
        type: 'success',
        title: 'Berhasil Disimpan',
        message: 'Referensi pengetahuan berhasil diperbarui.',
      });
      setEditModal({ isOpen: false, id: null, title: '', content: '' });
      loadRules();
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Gagal Memperbarui',
        message: error.message || 'Gagal memperbarui referensi.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: '0.5rem' }}>Manajemen Basis Pengetahuan RAG</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>
            Kelola pedoman klinis dan SOP medis yang digunakan oleh AI dalam verifikasi rekam medis.
          </p>
        </div>
        <div>
          <button
            className="btn-primary"
            style={{ padding: '0.75rem 1.5rem', fontWeight: 500 }}
            onClick={() => navigate('/app/basis-pengetahuan/tambah')}
          >
            Tambah Pengetahuan
          </button>
        </div>
      </div>

      {message.text && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '1rem', marginBottom: '1.5rem', borderRadius: 'var(--radius-md)',
          backgroundColor: message.type === 'success' ? '#ecfdf5' : '#fef2f2',
          color: message.type === 'success' ? '#065f46' : '#991b1b',
          border: `1px solid ${message.type === 'success' ? '#a7f3d0' : '#fecaca'}`
        }}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span style={{ fontWeight: 500 }}>{message.text}</span>
        </div>
      )}

      <div className="card">
        <div className="animate-fade-in">
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>Daftar Referensi Aktif</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
              Berikut adalah dokumen dan aturan manual yang tersimpan.
            </p>
          </div>

          {isLoadingRules ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              Memuat daftar referensi...
            </div>
          ) : rules.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', backgroundColor: '#f8fafc', borderRadius: 'var(--radius-md)' }}>
              Belum ada referensi yang ditambahkan.
            </div>
          ) : (
            <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
              {selectedIds.length > 0 && (
                <div
                  style={{
                    backgroundColor: '#f8fafc',
                    borderBottom: '1px solid var(--border-color)',
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
                      borderRadius: '9999px',
                      fontWeight: 700,
                      fontSize: '0.82rem'
                    }}>
                      {selectedIds.length}
                    </span>
                    <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#1e293b' }}>
                      Referensi Terpilih
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
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
                      title="Hapus Referensi Terpilih"
                    >
                      <Trash2 size={15} />
                      <span>Delete ({selectedIds.length})</span>
                    </button>

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
                      title="Batalkan Pilihan"
                    >
                      <X size={15} />
                      <span>Batal</span>
                    </button>
                  </div>
                </div>
              )}
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '0.75rem 1rem', width: '45px', textAlign: 'center' }}>
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
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--text-main)' }}>Judul / Nama File</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--text-main)' }}>Tipe</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--text-main)' }}>Tanggal Ditambahkan</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--text-main)', textAlign: 'center' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map((rule) => {
                    const isChecked = selectedIds.includes(rule.id);
                    return (
                      <tr
                        key={rule.id}
                        style={{
                          borderBottom: '1px solid var(--border-color)',
                          backgroundColor: isChecked ? '#eff6ff' : 'transparent',
                          transition: 'background-color 0.15s ease',
                        }}
                      >
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleSelect(rule.id)}
                            style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                          />
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: 'var(--text-main)', fontWeight: 500 }}>{rule.title}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span style={{
                            padding: '0.25rem 0.5rem',
                            backgroundColor: rule.type === 'Dokumen' ? '#eff6ff' : '#ecfdf5',
                            color: rule.type === 'Dokumen' ? '#1d4ed8' : '#047857',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: 500
                          }}>
                            {rule.type}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>{rule.date}</td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center', position: 'relative' }}>
                          <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <button
                              style={{ padding: '0.4rem', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', borderRadius: 'var(--radius-sm)' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveDropdownId(activeDropdownId === rule.id ? null : rule.id);
                              }}
                              title="Aksi"
                              className="hover-bg-gray"
                            >
                              <MoreVertical size={18} />
                            </button>
                          </div>

                          {activeDropdownId === rule.id && (
                            <div
                              style={{
                                position: 'absolute', right: '3rem', top: '2.5rem',
                                backgroundColor: 'white', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', zIndex: 10, minWidth: '150px', padding: '0.25rem'
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                style={{ width: '100%', textAlign: 'left', padding: '0.6rem 1rem', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem', color: 'var(--text-main)', borderRadius: 'var(--radius-sm)' }}
                                onClick={() => { setActiveDropdownId(null); handleView(rule); }}
                                className="hover-bg-gray"
                              >
                                <Eye size={16} color="var(--primary-color)" /> Lihat Detail
                              </button>
                              {rule.type === 'Teks Manual' && (
                                <button
                                  style={{ width: '100%', textAlign: 'left', padding: '0.6rem 1rem', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem', color: 'var(--text-main)', borderRadius: 'var(--radius-sm)' }}
                                  onClick={() => { setActiveDropdownId(null); handleEditOpen(rule); }}
                                  className="hover-bg-gray"
                                >
                                  <Edit2 size={16} color="#d97706" /> Edit Aturan
                                </button>
                              )}
                              <button
                                style={{ width: '100%', textAlign: 'left', padding: '0.6rem 1rem', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem', color: '#ef4444', borderRadius: 'var(--radius-sm)' }}
                                onClick={() => { setActiveDropdownId(null); handleDelete(rule.id); }}
                                className="hover-bg-gray"
                              >
                                <Trash2 size={16} /> Hapus
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* View Modal */}
      {viewModal.isOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: 'white', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '600px',
            maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>{viewModal.title}</h2>
              <button
                onClick={() => setViewModal({ isOpen: false, title: '', content: '' })}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem' }}
              >
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: '1.5rem', overflowY: 'auto', whiteSpace: 'pre-wrap', fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--text-main)' }}>
              {viewModal.content}
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal.isOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: 'white', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '700px',
            maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>Edit Aturan Manual</h2>
              <button
                onClick={() => setEditModal({ isOpen: false, id: null, title: '', content: '' })}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem' }}
                disabled={isSaving}
              >
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: '1.5rem', overflowY: 'auto' }}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Judul Aturan</label>
                <input
                  type="text"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}
                  value={editModal.title}
                  onChange={(e) => setEditModal({ ...editModal, title: e.target.value })}
                  disabled={isSaving}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Isi Referensi (Teks)</label>
                <textarea
                  style={{ width: '100%', minHeight: '250px', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', resize: 'vertical', fontFamily: 'inherit' }}
                  value={editModal.content}
                  onChange={(e) => setEditModal({ ...editModal, content: e.target.value })}
                  disabled={isSaving}
                ></textarea>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  className="btn-secondary"
                  onClick={() => setEditModal({ isOpen: false, id: null, title: '', content: '' })}
                  disabled={isSaving}
                >
                  Batal
                </button>
                <button
                  className="btn-primary"
                  onClick={handleSaveEdit}
                  disabled={isSaving}
                >
                  <Save size={18} />
                  {isSaving ? 'Menyimpan...' : 'Perbarui Aturan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeBase;
