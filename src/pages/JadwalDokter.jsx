import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CalendarCheck, ArrowLeft, RefreshCw, Search, Stethoscope, 
  Clock, Calendar, CheckCircle2, AlertTriangle, Users, 
  ChevronRight, Sparkles, Building2 
} from 'lucide-react';
import { getDoctorSchedules } from '../services/api';

const JadwalDokter = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    date: '',
    total_doctors: 0,
    available_doctors: 0,
    items: []
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getDoctorSchedules();
      setData(res || {
        date: '',
        total_doctors: 0,
        available_doctors: 0,
        items: []
      });
    } catch (err) {
      console.error('Error fetching doctor schedules:', err);
      setError(err.message || 'Gagal memuat jadwal praktek dokter.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Unique Specialties
  const specialtyOptions = useMemo(() => {
    const list = new Set();
    data.items.forEach(doc => {
      if (doc.specialty) list.add(doc.specialty);
    });
    return Array.from(list);
  }, [data.items]);

  // Filtered doctors
  const filteredDoctors = useMemo(() => {
    return data.items.filter(doc => {
      const matchSpec = selectedSpecialty === 'ALL' || doc.specialty === selectedSpecialty;
      const matchStatus = selectedStatus === 'ALL' ||
        (selectedStatus === 'AVAILABLE' && doc.is_available) ||
        (selectedStatus === 'FULL' && !doc.is_available);
      
      const q = searchQuery.toLowerCase().trim();
      const matchQuery = !q ||
        (doc.name && doc.name.toLowerCase().includes(q)) ||
        (doc.specialty && doc.specialty.toLowerCase().includes(q)) ||
        (doc.hari && doc.hari.toLowerCase().includes(q)) ||
        (doc.jam && doc.jam.toLowerCase().includes(q));

      return matchSpec && matchStatus && matchQuery;
    });
  }, [data.items, selectedSpecialty, selectedStatus, searchQuery]);

  const getStatusBadge = (status, isAvailable) => {
    if (status === 'TERSEDIA' || isAvailable) {
      return (
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
          padding: '0.25rem 0.65rem', borderRadius: '9999px',
          backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0',
          fontWeight: 600, fontSize: '0.75rem'
        }}>
          <CheckCircle2 size={12} /> Kuota Tersedia
        </span>
      );
    } else if (status === 'HAMPIR PENUH') {
      return (
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
          padding: '0.25rem 0.65rem', borderRadius: '9999px',
          backgroundColor: '#fffbeb', color: '#b45309', border: '1px solid #fde68a',
          fontWeight: 600, fontSize: '0.75rem'
        }}>
          <AlertTriangle size={12} /> Hampir Penuh
        </span>
      );
    } else {
      return (
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
          padding: '0.25rem 0.65rem', borderRadius: '9999px',
          backgroundColor: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca',
          fontWeight: 600, fontSize: '0.75rem'
        }}>
          Kuota Penuh
        </span>
      );
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg-main, #f8fafc)',
      color: 'var(--text-main, #0f172a)',
      padding: '1.5rem',
      fontFamily: "'DM Sans', 'Plus Jakarta Sans', system-ui, sans-serif"
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        {/* Top Navigation Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <button
            onClick={() => navigate('/options')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 0.85rem',
              background: '#ffffff',
              border: '1px solid var(--border-color, #e2e8f0)',
              borderRadius: '8px',
              color: 'var(--text-muted, #64748b)',
              fontWeight: 500,
              fontSize: '0.875rem',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.05))',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => { e.currentTarget.style.color = '#0f172a'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
            onMouseOut={(e) => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
          >
            <ArrowLeft size={16} /> Kembali ke Menu
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={() => navigate('/reservasi')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.48rem 0.85rem',
                backgroundColor: '#ffffff',
                color: '#059669',
                border: '1px solid #059669',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.825rem',
                cursor: 'pointer'
              }}
            >
              <Calendar size={14} /> Buat Reservasi Pasien
            </button>

            <button
              onClick={fetchData}
              disabled={loading}
              title="Perbarui jadwal dokter"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.5rem 0.85rem',
                backgroundColor: '#059669',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.825rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1
              }}
            >
              <RefreshCw size={14} className={loading ? 'spin-icon' : ''} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
              Segarkan
            </button>
          </div>
        </div>

        {/* Page Header Banner (Commented Out) */}
        {/*
        <div style={{
          background: 'linear-gradient(135deg, #064e3b 0%, #047857 50%, #059669 100%)',
          borderRadius: '16px',
          padding: '1.75rem 2rem',
          color: '#ffffff',
          marginBottom: '1.5rem',
          boxShadow: '0 10px 25px -5px rgba(4, 120, 87, 0.25)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.25rem'
        }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0.25rem 0.75rem', background: 'rgba(255,255,255,0.18)', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
              <CalendarCheck size={13} /> Dokter Penanggung Jawab Pelayanan (DPJP)
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0 0 0.35rem', color: '#ffffff' }}>
              Jadwal Praktek Dokter Poliklinik
            </h1>
            <p style={{ margin: 0, fontSize: '0.925rem', opacity: 0.9, maxWidth: '640px' }}>
              Informasi hari pelayanan, jam konsultasi poliklinik, dan ketersediaan kuota antrean pasien DPJP rumah sakit.
            </p>
          </div>
          <div style={{
            background: 'rgba(255, 255, 255, 0.12)',
            backdropFilter: 'blur(8px)',
            borderRadius: '12px',
            padding: '0.85rem 1.25rem',
            textAlign: 'right',
            border: '1px solid rgba(255,255,255,0.2)'
          }}>
            <div style={{ fontSize: '0.75rem', opacity: 0.85 }}>Dokter Aktif Praktek</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>
              {data.available_doctors} dari {data.total_doctors} Dokter
            </div>
          </div>
        </div>
        */}

        {/* Live Metrics Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '1.25rem',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.825rem', fontWeight: 600, color: '#64748b' }}>TOTAL DOKTER DPJP</span>
              <span style={{ padding: '0.35rem', borderRadius: '8px', background: '#eff6ff', color: '#2563eb' }}><Stethoscope size={16} /></span>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a' }}>{data.total_doctors}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>Spesialis & dokter umum</div>
          </div>

          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '1.25rem',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.825rem', fontWeight: 600, color: '#047857' }}>DOKTER TERSEDIA</span>
              <span style={{ padding: '0.35rem', borderRadius: '8px', background: '#ecfdf5', color: '#059669' }}><CheckCircle2 size={16} /></span>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#047857' }}>{data.available_doctors}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>Menerima reservasi pasien</div>
          </div>

          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '1.25rem',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.825rem', fontWeight: 600, color: '#0284c7' }}>POLIKLINIK SPESIALIS</span>
              <span style={{ padding: '0.35rem', borderRadius: '8px', background: '#f0f9ff', color: '#0284c7' }}><Building2 size={16} /></span>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0284c7' }}>{specialtyOptions.length}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>Departemen pelayanan klinis</div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '1rem 1.25rem',
          border: '1px solid #e2e8f0',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          {/* Search Input */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            padding: '0.5rem 0.85rem',
            flex: '1 1 260px'
          }}>
            <Search size={16} color="#64748b" />
            <input
              type="text"
              placeholder="Cari dokter, spesialisasi, hari praktek..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: 'none',
                outline: 'none',
                background: 'transparent',
                width: '100%',
                fontSize: '0.875rem',
                color: '#0f172a'
              }}
            />
          </div>

          {/* Specialty Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.825rem', color: '#64748b', fontWeight: 500 }}>Spesialisasi:</span>
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              style={{
                padding: '0.45rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.85rem',
                background: '#ffffff',
                fontWeight: 500,
                color: '#0f172a',
                cursor: 'pointer'
              }}
            >
              <option value="ALL">Semua Spesialisasi</option>
              {specialtyOptions.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.825rem', color: '#64748b', fontWeight: 500 }}>Status Kuota:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{
                padding: '0.45rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.85rem',
                background: '#ffffff',
                fontWeight: 500,
                color: '#0f172a',
                cursor: 'pointer'
              }}
            >
              <option value="ALL">Semua Status</option>
              <option value="AVAILABLE">Kuota Tersedia</option>
              <option value="FULL">Kuota Penuh</option>
            </select>
          </div>
        </div>

        {/* Doctor Schedules Card Grid */}
        {loading && data.items.length === 0 ? (
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            padding: '3.5rem',
            textAlign: 'center',
            color: '#64748b'
          }}>
            <RefreshCw size={28} className="spin-icon" style={{ animation: 'spin 1s linear infinite', marginBottom: '0.75rem', color: '#059669' }} />
            <p style={{ margin: 0, fontWeight: 500 }}>Memuat jadwal praktek dokter dari database...</p>
          </div>
        ) : filteredDoctors.length === 0 ? (
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            padding: '3.5rem 1.5rem',
            textAlign: 'center',
            color: '#64748b'
          }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              background: '#ecfdf5', display: 'inline-flex', alignItems: 'center',
              justifyContent: 'center', marginBottom: '1rem', color: '#059669'
            }}>
              <Stethoscope size={28} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#334155', margin: '0 0 0.4rem' }}>
              Tidak Ada Jadwal Dokter Ditemukan
            </h3>
            <p style={{ margin: 0, fontSize: '0.875rem', maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto' }}>
              Tidak ada data dokter praktek yang cocok dengan filter atau kata kunci pencarian Anda.
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '1.25rem'
          }}>
            {filteredDoctors.map((doc, idx) => {
              const bookedPct = Math.min(100, Math.round((doc.booked_count / (doc.capacity || 1)) * 100));
              const progressColor = bookedPct >= 100 ? '#ef4444' : (bookedPct >= 75 ? '#f59e0b' : '#10b981');

              return (
                <div
                  key={doc.name || idx}
                  style={{
                    background: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid rgba(226, 232, 240, 0.95)',
                    padding: '1.5rem',
                    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04), 0 0 0 1px rgba(15, 23, 42, 0.02)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = '0 12px 28px -6px rgba(15, 23, 42, 0.09), 0 0 0 1px rgba(5, 150, 105, 0.2)';
                    e.currentTarget.style.borderColor = 'rgba(5, 150, 105, 0.45)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 1px 2px rgba(15, 23, 42, 0.04), 0 0 0 1px rgba(15, 23, 42, 0.02)';
                    e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.95)';
                  }}
                >
                  <div>
                    {/* Top row: Specialty tag and Status badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <span style={{
                        padding: '0.25rem 0.65rem',
                        background: '#f0fdf4',
                        color: '#047857',
                        border: '1px solid #bbf7d0',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 600
                      }}>
                        {doc.specialty}
                      </span>
                      {getStatusBadge(doc.status, doc.is_available)}
                    </div>

                    {/* Doctor Name & Avatar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1rem' }}>
                      <div style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '1rem',
                        flexShrink: 0
                      }}>
                        {doc.name.replace('dr. ', '').charAt(0)}
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                          {doc.name}
                        </h3>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                          Dokter Spesialis DPJP
                        </p>
                      </div>
                    </div>

                    {/* Schedule Details */}
                    <div style={{
                      background: '#f8fafc',
                      borderRadius: '10px',
                      padding: '0.85rem 1rem',
                      marginBottom: '1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.825rem', color: '#334155' }}>
                        <Calendar size={14} color="#059669" />
                        <span style={{ fontWeight: 600 }}>Hari:</span> {doc.hari}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.825rem', color: '#334155' }}>
                        <Clock size={14} color="#059669" />
                        <span style={{ fontWeight: 600 }}>Jam:</span> {doc.jam} WITA
                      </div>
                    </div>

                    {/* Quota Progress */}
                    <div style={{ marginBottom: '1.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.35rem' }}>
                        <span style={{ color: '#64748b' }}>
                          Terisi: <strong>{doc.booked_count}</strong> / {doc.capacity} Pasien
                        </span>
                        <span style={{ fontWeight: 600, color: progressColor }}>
                          Sisa {doc.remaining} Kuota
                        </span>
                      </div>
                      <div style={{
                        width: '100%',
                        height: '7px',
                        borderRadius: '9999px',
                        background: '#e2e8f0',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${bookedPct}%`,
                          backgroundColor: progressColor,
                          borderRadius: '9999px',
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.65rem' }}>
                    <button
                      onClick={() => navigate(`/reservasi?doctor=${encodeURIComponent(doc.name)}`)}
                      disabled={!doc.is_available}
                      style={{
                        flex: 1,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem',
                        padding: '0.6rem 0.85rem',
                        backgroundColor: doc.is_available ? '#059669' : '#e2e8f0',
                        color: doc.is_available ? '#ffffff' : '#94a3b8',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 600,
                        fontSize: '0.825rem',
                        cursor: doc.is_available ? 'pointer' : 'not-allowed',
                        transition: 'background-color 0.2s'
                      }}
                    >
                      Daftar Reservasi <ChevronRight size={14} />
                    </button>

                    <button
                      onClick={() => navigate('/app/antrean/rawat-jalan')}
                      title="Lihat antrean poliklinik hari ini"
                      style={{
                        padding: '0.6rem 0.75rem',
                        backgroundColor: '#f1f5f9',
                        color: '#475569',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Users size={15} />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}

        {/* Footer info note */}
        <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.8rem', color: '#94a3b8' }}>
          Jadwal praktek dokter terintegrasi dengan SIMRS RS Sejahtera Bali &bull; &copy; 2026 Ternak AI Healthcare
        </div>

      </div>
    </div>
  );
};

export default JadwalDokter;
