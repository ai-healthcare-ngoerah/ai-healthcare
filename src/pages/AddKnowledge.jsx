import React, { useState } from 'react';
import { BookOpen, Upload, Save, FileSpreadsheet, FileText, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { addKnowledgeReferenceText, addKnowledgeReferenceFile } from '../services/api';
import { useNotification } from '../context/NotificationContext';

const AddKnowledge = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast, confirmAction } = useNotification();
  const queryParams = new URLSearchParams(location.search);
  const initialTab = queryParams.get('tab') || 'manual';
  
  const [activeTab, setActiveTab] = useState(initialTab);
  
  // State for manual entry
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  
  // State for file upload
  const [files, setFiles] = useState([]);

  // State for UI feedback
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' }); 

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleSaveManual = async () => {
    if (!title.trim() || !content.trim()) {
      showToast({
        type: 'warning',
        message: 'Judul dan Isi referensi wajib diisi.',
      });
      return;
    }

    setIsLoading(true);

    try {
      await addKnowledgeReferenceText(title, content);
      showToast({
        type: 'success',
        title: 'Berhasil Disimpan',
        message: 'Referensi pengetahuan baru berhasil ditambahkan.',
      });
      navigate('/app/basis-pengetahuan');
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Gagal Menyimpan',
        message: error.message || 'Terjadi kesalahan saat menyimpan referensi.',
      });
      setIsLoading(false);
    }
  };

  const handleFileUpload = async () => {
    if (files.length === 0) {
      showToast({
        type: 'warning',
        message: 'Pilih minimal satu file terlebih dahulu.',
      });
      return;
    }

    setIsLoading(true);

    try {
      await Promise.all(files.map((f) => addKnowledgeReferenceFile(f)));
      showToast({
        type: 'success',
        title: 'Berhasil Diunggah',
        message: `${files.length} berkas dokumen pengetahuan berhasil diunggah.`,
      });
      navigate('/app/basis-pengetahuan');
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Gagal Mengunggah',
        message: error.message || 'Terjadi kesalahan saat mengunggah file.',
      });
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button 
        onClick={() => navigate('/app/basis-pengetahuan')} 
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginBottom: '1rem', padding: 0 }}
        className="hover-text-main"
      >
        <ArrowLeft size={18} /> Kembali ke Daftar Referensi
      </button>

      <h1 className="page-title">Tambah Referensi Baru</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
        Pilih metode untuk menambahkan aturan atau pedoman baru ke dalam sistem AI.
      </p>

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
        <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem', overflowX: 'auto' }}>
          <button
            className={`btn-secondary ${activeTab === 'manual' ? 'active' : ''}`}
            style={activeTab === 'manual' ? { backgroundColor: 'var(--primary-color)', color: 'white', borderColor: 'var(--primary-color)' } : {}}
            onClick={() => setActiveTab('manual')}
          >
            <BookOpen size={18} />
            Entri Aturan Manual
          </button>
          <button
            className={`btn-secondary ${activeTab === 'upload' ? 'active' : ''}`}
            style={activeTab === 'upload' ? { backgroundColor: 'var(--primary-color)', color: 'white', borderColor: 'var(--primary-color)' } : {}}
            onClick={() => setActiveTab('upload')}
          >
            <Upload size={18} />
            Unggah File (PDF/Excel)
          </button>
        </div>

        {activeTab === 'manual' && (
          <div className="animate-fade-in">
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Tambahkan Aturan / Referensi Baru</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>Aturan ini akan langsung dimasukkan ke dalam basis data vektor untuk pencarian AI.</p>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Judul Aturan</label>
              <input 
                type="text" 
                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }} 
                placeholder="Contoh: Pedoman Klaim Hipertensi 2026" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Isi Referensi (Teks)</label>
              <textarea
                style={{ width: '100%', minHeight: '200px', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', resize: 'vertical', fontFamily: 'inherit' }}
                placeholder="Ketik atau tempel (paste) pedoman klinis atau SOP resmi di sini..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={isLoading}
              ></textarea>
            </div>

            <button className="btn-primary" onClick={handleSaveManual} disabled={isLoading}>
              <Save size={18} />
              {isLoading ? 'Menyimpan...' : 'Simpan Referensi'}
            </button>
          </div>
        )}

        {activeTab === 'upload' && (
          <div className="animate-fade-in">
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Unggah Dokumen Referensi Resmi</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              Sistem akan secara otomatis memotong (chunk), melakukan embed, dan memperbarui basis data vektor (Supabase/ChromaDB).
            </p>

            <div
              style={{
                border: '2px dashed var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: '3rem 2rem',
                textAlign: 'center',
                backgroundColor: '#f8fafc',
                cursor: 'pointer',
                opacity: isLoading ? 0.6 : 1
              }}
              onClick={() => !isLoading && document.getElementById('file-upload-input').click()}
            >
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <FileSpreadsheet size={32} color="var(--primary-color)" />
                <FileText size={32} color="#dc2626" />
              </div>

              {files.length > 0 ? (
                <div style={{ marginBottom: '1rem' }}>
                  <p style={{ fontWeight: 700, color: 'var(--primary-color)', marginBottom: '0.35rem' }}>
                    {files.length} Berkas Dokumen Terpilih:
                  </p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 auto', maxWidth: '450px', textAlign: 'left', fontSize: '0.85rem', color: '#334155' }}>
                    {files.map((f, i) => (
                      <li key={i} style={{ padding: '0.2rem 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        📄 {f.name} ({(f.size / 1024).toFixed(1)} KB)
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p style={{ fontWeight: 500, marginBottom: '0.5rem' }}>
                  Klik atau seret satu/banyak berkas PDF & Excel ke sini (Bisa Ctrl+A / Block Select)
                </p>
              )}

              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                Format yang didukung: .pdf, .xlsx, .xls
              </p>

              <input 
                id="file-upload-input" 
                type="file" 
                multiple
                style={{ display: 'none' }} 
                accept=".pdf,.xlsx,.xls"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    setFiles(Array.from(e.target.files));
                  }
                }}
                disabled={isLoading}
              />

              <button 
                className="btn-primary" 
                style={{ margin: '0 auto' }} 
                onClick={(e) => {
                  e.stopPropagation(); 
                  if (files.length > 0) {
                    handleFileUpload();
                  } else {
                    document.getElementById('file-upload-input').click();
                  }
                }}
                disabled={isLoading}
              >
                {isLoading ? 'Mengunggah...' : (files.length > 0 ? `Unggah ${files.length} Berkas Now` : 'Pilih File (Ctrl+A)')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddKnowledge;
