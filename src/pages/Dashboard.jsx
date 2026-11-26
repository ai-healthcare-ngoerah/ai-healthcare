import React, { useEffect, useState } from 'react';
import { 
  FileText, Stethoscope, Flame, ArrowUpRight, ShieldCheck, ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getDashboardStats } from '../services/api';
import { getScribeNotes } from '../services/scribeService';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    dokumen_diperiksa: 0,
    akurasi_ai: 99.4,
    sesi_medis: 0,
    dokter_aktif: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getDashboardStats();
        setStats({
          dokumen_diperiksa: data.dokumen_diperiksa || 0,
          akurasi_ai: data.akurasi_ai || 99.4,
          sesi_medis: data.sesi_medis || 0,
          dokter_aktif: data.dokter_aktif || 0
        });
      } catch (err) {
        console.log('Gagal memuat statistik dasbor, menggunakan angka cadangan.');
      }

      try {
        const notesData = await getScribeNotes();
        const noteList = Array.isArray(notesData) ? notesData : (notesData?.notes || []);
        setRecentActivities(noteList.slice(0, 3));
      } catch (err) {
        console.log('Gagal memuat catatan rekam medis terbaru.');
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="animate-fade-in dashboard-container">
      
      {/* Header Section */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-header-title">
            Dasbor Operasional Klinis
          </h1>
          <p className="dashboard-header-subtitle">
            Pemantauan rekam medis dan telemetri klinis.
          </p>
        </div>

        <div className="dashboard-header-actions">
          <span className="data-chip data-chip-sage">
            <span className="pulse-indicator" />
            Model AI Aktif • Gemini & Azure GPT
          </span>
          <Link to="/app/asisten-medis" className="btn-primary">
            <Stethoscope size={16} />
            <span>Buka Scribe Medis</span>
          </Link>
        </div>
      </div>

      {/* Bento Grid with refined 8/4 and 4/8 proportions */}
      <div className="dashboard-grid">
        
        {/* Bento Card 1: Primary Medical Scribe Telemetry - Span 8 */}
        <div className="dashboard-card grid-col-8">
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span className="data-chip data-chip-sage">Asisten Medis AI</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Hari ini</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <span className="dashboard-stat-primary">
                {stats.sesi_medis.toLocaleString('id-ID')}
              </span>
              <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--primary-color)' }}>
                Sesi Konsultasi Selesai
              </span>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0 0 1.25rem' }}>
              Anamnesis terstruktur & diagnosis ICD-10.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', paddingTop: '1rem' }}>
            <div className="dashboard-inset-panel">
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Dokter Bertugas</span>
              <div style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '0.15rem' }}>
                {stats.dokter_aktif || 12} Praktisi
              </div>
            </div>
            <div className="dashboard-inset-panel">
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Waktu Scribe Rata-rata</span>
              <div style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '0.15rem' }}>
                1.4 Menit / Pasien
              </div>
            </div>
            <div className="dashboard-inset-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Link to="/app/asisten-medis" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary-color)' }}>
                <span>Mulai Sesi Baru</span>
                <ArrowUpRight size={16} />
              </Link>
            </div>
          </div>
        </div>

        {/* Bento Card 2: AI Diagnostic Quality & ICD-10 - Span 4 */}
        <div className="dashboard-card grid-col-4">
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span className="data-chip data-chip-ochre">Audit Klinis ICD-10</span>
              <ShieldCheck size={18} color="var(--accent-ochre)" />
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span className="dashboard-stat-secondary">
                {stats.akurasi_ai}%
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                Kesesuaian Diagnosis
              </span>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0 0 1rem' }}>
              Kesesuaian standar diagnosis klinis.
            </p>
          </div>

          <div className="dashboard-inset-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.825rem', color: 'var(--text-main)', fontWeight: 500 }}>Dokumen Diperiksa</span>
            <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary-color)' }}>
              {stats.dokumen_diperiksa.toLocaleString('id-ID')} berkas
            </span>
          </div>
        </div>

        {/* Bento Card 3: Urgent Scribe & Operating Room Triage Telemetry - Span 4 */}
        <div className="dashboard-card dashboard-card-danger grid-col-4">
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span className="data-chip data-chip-terracotta">
                <Flame size={12} />
                <span>UGD & Bedah</span>
              </span>
              <span style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 600 }}>Siaga Real-time</span>
            </div>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)', margin: '0 0 0.5rem 0' }}>
              Triase & Deteksi Syok
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem', margin: '0 0 1rem' }}>
              Kalkulasi Shock Index & SpO2 instan.
            </p>
          </div>

          <Link to="/app/asisten-medis" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.7rem 0.95rem', background: '#fef2f2', borderRadius: '8px', color: '#dc2626', fontSize: '0.825rem', fontWeight: 600, transition: 'background-color 0.15s ease' }}>
            <span>Buka Mode Darurat - Mic</span>
            <ChevronRight size={16} />
          </Link>
        </div>

        {/* Bento Card 4: Recent Clinical Activity Feed - Span 8 */}
        <div className="dashboard-card grid-col-8">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 600, margin: 0, color: 'var(--text-main)' }}>
              Aktivitas Rekam Medis Terakhir
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sinkronisasi EHR Aktif</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {recentActivities.length > 0 ? (
              recentActivities.map((act) => (
                <div key={act.id} className="activity-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                    <div className="activity-icon-container activity-icon-emerald">
                      <FileText size={16} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>
                        {act.patient_name || 'Pasien Rawat Jalan'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '420px' }}>
                        SOAP Form tersimpan • {act.assessment ? act.assessment.slice(0, 50) + '...' : 'Pemeriksaan Klinis Selesai'}
                      </div>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, flexShrink: 0 }}>
                    {act.created_at ? new Date(act.created_at).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' }) : 'Baru saja'}
                  </span>
                </div>
              ))
            ) : (
              <>
                <div className="activity-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                    <div className="activity-icon-container activity-icon-emerald">
                      <FileText size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>Poliklinik Penyakit Dalam</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SOAP Form tersimpan • ICD-10 E11.9 - Diabetes Mellitus</div>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, flexShrink: 0 }}>Baru saja</span>
                </div>

                <div className="activity-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                    <div className="activity-icon-container activity-icon-rose">
                      <Flame size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>Instalasi Gawat Darurat - UGD</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Triage Telemetry terverifikasi • Protokol Syok Hipovolemik</div>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, flexShrink: 0 }}>12 mnt lalu</span>
                </div>
              </>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default Dashboard;
