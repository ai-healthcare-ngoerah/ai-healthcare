import { Plus, X, Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function KnowledgeAddModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  addMode,
  setAddMode,
  formTitle,
  setFormTitle,
  formSource,
  setFormSource,
  formType,
  setFormType,
  formContent,
  setFormContent,
  selectedFile,
  setSelectedFile,
  fileInputRef
}) {
  const { t } = useTranslation();

  if (!isOpen) return null;

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
          maxHeight: '92vh',
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
            <Plus size={20} color="var(--primary-color)" />
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {t('scribe.aiKnowledge.modalAddTitle', 'Tambah Dokumen AI Knowledge')}
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

        {/* Mode Switcher */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-color)',
            backgroundColor: '#f8fafc',
            padding: '0.4rem 1.5rem',
            gap: '0.5rem'
          }}
        >
          <button
            type="button"
            onClick={() => setAddMode('file')}
            style={{
              padding: '0.45rem 1rem',
              fontSize: '0.825rem',
              fontWeight: 600,
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              backgroundColor: addMode === 'file' ? '#ffffff' : 'transparent',
              color: addMode === 'file' ? 'var(--primary-color)' : 'var(--text-muted)',
              boxShadow: addMode === 'file' ? 'var(--shadow-sm)' : 'none',
              cursor: 'pointer'
            }}
          >
            📁 Unggah Berkas (PDF, MD, TXT)
          </button>
          <button
            type="button"
            onClick={() => setAddMode('manual')}
            style={{
              padding: '0.45rem 1rem',
              fontSize: '0.825rem',
              fontWeight: 600,
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              backgroundColor: addMode === 'manual' ? '#ffffff' : 'transparent',
              color: addMode === 'manual' ? 'var(--primary-color)' : 'var(--text-muted)',
              boxShadow: addMode === 'manual' ? 'var(--shadow-sm)' : 'none',
              cursor: 'pointer'
            }}
          >
            ✍️ Input Teks Manual / SOP
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
              placeholder={t('scribe.aiKnowledge.form.titlePlaceholder', 'Contoh: Pedoman Tata Laksana Hipertensi Dewasa')}
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              style={{
                width: '100%',
                padding: '0.6rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-input)',
                fontSize: '0.875rem'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                {t('scribe.aiKnowledge.form.sourceLabel', 'Sumber / Penerbit')}
              </label>
              <input
                type="text"
                placeholder={t('scribe.aiKnowledge.form.sourcePlaceholder', 'Contoh: Komite Medik RS / Kemenkes RI')}
                value={formSource}
                onChange={(e) => setFormSource(e.target.value)}
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
                {t('scribe.aiKnowledge.form.typeLabel', 'Tipe Dokumen')}
              </label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-input)',
                  fontSize: '0.875rem',
                  backgroundColor: '#ffffff'
                }}
              >
                <option value="Dokumen Klinis">Dokumen Klinis</option>
                <option value="PNPK / PPK">PNPK / PPK</option>
                <option value="SOP Medis">SOP Medis</option>
                <option value="Formularium Obat">Formularium Obat</option>
              </select>
            </div>
          </div>

          {addMode === 'file' ? (
            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                {t('scribe.aiKnowledge.form.fileLabel', 'Unggah Berkas (PDF, MD, TXT)')} *
              </label>
              <div
                style={{
                  border: '2px dashed #cbd5e1',
                  borderRadius: 'var(--radius-sm)',
                  padding: '1.5rem',
                  textAlign: 'center',
                  backgroundColor: '#f8fafc',
                  cursor: 'pointer'
                }}
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
              >
                <Upload size={28} color="var(--primary-color)" style={{ margin: '0 auto 0.5rem', display: 'block' }} />
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}>
                  {selectedFile ? selectedFile.name : 'Klik untuk memilih berkas dokumen'}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                  Mendukung PDF, Markdown (.md), atau Plain Text (.txt)
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.md,.txt"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files && e.target.files[0];
                    if (file) {
                      setSelectedFile(file);
                      if (!formTitle) {
                        setFormTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
                      }
                    }
                  }}
                />
              </div>
            </div>
          ) : (
            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                {t('scribe.aiKnowledge.form.contentLabel', 'Konten / Teks Pedoman Klinis')} *
              </label>
              <textarea
                required
                rows={8}
                placeholder={t(
                  'scribe.aiKnowledge.form.contentPlaceholder',
                  'Ketik atau tempel teks pedoman klinis, kriteria diagnosis, atau protokol terapi di sini...'
                )}
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
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
          )}
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
            {isSubmitting ? t('scribe.aiKnowledge.form.savingBtn', 'Menyimpan...') : t('scribe.aiKnowledge.form.saveBtn', 'Simpan ke AI Knowledge')}
          </button>
        </div>
      </form>
    </div>
  );
}
