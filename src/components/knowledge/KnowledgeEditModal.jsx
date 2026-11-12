import { Edit3, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function KnowledgeEditModal({
  editingDoc,
  setEditingDoc,
  onSubmit,
  onClose,
  isSubmitting
}) {
  const { t } = useTranslation();

  if (!editingDoc) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '1rem'
      }}
      onClick={() => !isSubmitting && onClose()}
    >
      <form
        onSubmit={onSubmit}
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-md)',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Edit3 size={20} color="var(--primary-color)" />
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {t('scribe.aiKnowledge.modalEditTitle', 'Edit Dokumen Pengetahuan')}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              border: 'none',
              background: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Fields */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              {t('scribe.aiKnowledge.form.titleLabel', 'Judul Pedoman / SOP')} *
            </label>
            <input
              type="text"
              required
              value={editingDoc.title || ''}
              onChange={(e) => setEditingDoc({ ...editingDoc, title: e.target.value })}
              style={{
                width: '100%',
                padding: '0.6rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-input)',
                fontSize: '0.875rem'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              {t('scribe.aiKnowledge.form.contentLabel', 'Konten / Teks Pedoman Klinis')} *
            </label>
            <textarea
              required
              rows={10}
              value={editingDoc.content || ''}
              onChange={(e) => setEditingDoc({ ...editingDoc, content: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-input)',
                fontSize: '0.85rem',
                lineHeight: 1.5,
                resize: 'vertical'
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            backgroundColor: '#f8fafc'
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="btn-secondary"
            style={{
              padding: '0.5rem 1.25rem',
              fontSize: '0.85rem',
              borderRadius: 'var(--radius-sm)'
            }}
          >
            {t('scribe.aiKnowledge.form.cancelBtn', 'Batal')}
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary"
            style={{
              padding: '0.5rem 1.25rem',
              fontSize: '0.85rem',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 600
            }}
          >
            {isSubmitting ? t('scribe.aiKnowledge.form.savingBtn', 'Menyimpan...') : t('scribe.aiKnowledge.form.saveBtn', 'Simpan Perubahan')}
          </button>
        </div>
      </form>
    </div>
  );
}
