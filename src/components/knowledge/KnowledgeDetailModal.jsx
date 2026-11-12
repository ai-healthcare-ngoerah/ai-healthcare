import { BookOpen, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function KnowledgeDetailModal({ doc, onClose }) {
  const { t } = useTranslation();

  if (!doc) return null;

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
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-md)',
          width: '100%',
          maxWidth: '750px',
          maxHeight: '85vh',
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
            <BookOpen size={20} color="var(--primary-color)" />
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {doc.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
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

        {/* Badges / Metadata */}
        <div
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#f8fafc',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            gap: '1.5rem',
            fontSize: '0.8rem',
            color: '#64748b',
            flexWrap: 'wrap'
          }}
        >
          <div>
            <strong>Sumber:</strong> {doc.source || 'Faskes Internal'}
          </div>
          <div>
            <strong>Format:</strong> {doc.type || 'Dokumen'}
          </div>
          {doc.file_name && (
            <div>
              <strong>Berkas:</strong> {doc.file_name}
            </div>
          )}
          {doc.is_builtin && (
            <div style={{ color: '#059669', fontWeight: 600 }}>
              🛡️ Pedoman Resmi Standar Nasional PNPK Kemenkes RI
            </div>
          )}
        </div>

        {/* Content Body */}
        <div
          style={{
            padding: '1.5rem',
            overflowY: 'auto',
            flex: 1,
            fontSize: '0.875rem',
            lineHeight: 1.65,
            color: '#1e293b',
            backgroundColor: '#ffffff'
          }}
        >
          <pre
            style={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontFamily: 'inherit',
              margin: 0,
              fontSize: '0.85rem'
            }}
          >
            {doc.content || doc.content_preview || 'Konten tidak tersedia.'}
          </pre>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'flex-end',
            backgroundColor: '#f8fafc'
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
            style={{
              padding: '0.5rem 1.25rem',
              fontSize: '0.85rem',
              borderRadius: 'var(--radius-sm)'
            }}
          >
            {t('scribe.aiKnowledge.form.closeBtn', 'Tutup')}
          </button>
        </div>
      </div>
    </div>
  );
}
