import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BedDouble, ArrowLeft, RefreshCw, Search, Calendar, 
  Clock, Stethoscope, AlertCircle, CheckCircle2, Building2 
} from 'lucide-react';
import { getRawatInapQueue } from '../services/api';

const DaftarRawatInap = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    stats: { total_inpatient: 0, active_beds: 0, waiting_bed: 0, ready_discharge: 0 },
    items: []
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedWard, setSelectedWard] = useState('ALL');
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getRawatInapQueue();
      setData(res || {
        stats: { total_inpatient: 0, active_beds: 0, waiting_bed: 0, ready_discharge: 0 },
        items: []
      });
    } catch (err) {
      console.error('Error fetching rawat inap queue:', err);
      setError(err.message || 'Gagal memuat data antrean rawat inap.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchData();
    }, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Unique Wards
  const wardOptions = useMemo(() => {
    const list = new Set();
    data.items.forEach(item => {
      if (item.ward_name) list.add(item.ward_name);
    });
    return Array.from(list);
  }, [data.items]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return data.items.filter(item => {
      const matchStatus = selectedStatus === 'ALL' || item.status === selectedStatus;
      const matchWard = selectedWard === 'ALL' || item.ward_name === selectedWard;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery = !q ||
        (item.patient_name && item.patient_name.toLowerCase().includes(q)) ||
        (item.medical_record_no && item.medical_record_no.toLowerCase().includes(q)) ||
        (item.queue_number && item.queue_number.toLowerCase().includes(q)) ||
        (item.doctor_name && item.doctor_name.toLowerCase().includes(q)) ||
        (item.ward_name && item.ward_name.toLowerCase().includes(q)) ||
        (item.notes && item.notes.toLowerCase().includes(q));

      return matchStatus && matchWard && matchQuery;
    });
  }, [data.items, selectedStatus, selectedWard, searchQuery]);

  const getStatusBadge = (status) => {
    const s = (status || '').toUpperCase();
    if (s === 'DIRAWAT' || s === 'ADMITTED') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.25rem 0.65rem', borderRadius: '9999px', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', fontSize: '0.75rem', fontWeight: 600 }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#059669', display: 'inline-block' }} /> Aktif Dirawat
        </span>
      );
    } else if (s === 'MENUNGGU_BED') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.25rem 0.65rem', borderRadius: '9999px', background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', fontSize: '0.75rem', fontWeight: 600 }}>
          <Clock size={12} /> Menunggu Bed
        </span>
      );
    } else if (s === 'SIAP_PULANG') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.25rem 0.65rem', borderRadius: '9999px', background: '#f5f3ff', color: '#6d28d9', border: '1px solid #ddd6fe', fontSize: '0.75rem', fontWeight: 600 }}>
          <CheckCircle2 size={12} /> Rencana Pulang
        </span>
      );
    } else {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.25rem 0.65rem', borderRadius: '9999px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', fontSize: '0.75rem', fontWeight: 600 }}>
          {status}
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

        {/* Top Navigation */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <button
            onClick={() => navigate('/app/antrean/rawat-inap')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 0.85rem',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              color: '#64748b',
              fontWeight: 500,
              fontSize: '0.875rem',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            <ArrowLeft size={16} /> Kembali ke Cari Antrean
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Auto refresh switch */}
            <label style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.825rem',
              fontWeight: 500,
              color: '#475569',
              cursor: 'pointer',
              background: '#ffffff',
              padding: '0.45rem 0.75rem',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                style={{ cursor: 'pointer', accentColor: '#7c3aed' }}
              />
              Auto-sync (15s)
            </label>

            {/* Refresh Button */}
            <button
              onClick={fetchData}
              disabled={loading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.45rem 0.85rem',
                backgroundColor: '#7c3aed',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.825rem',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
              Segarkan
            </button>
          </div>
        </div>

        {/* Minimal Title */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0 0 0.25rem', color: '#0f172a' }}>
            Sensus & Alokasi Bed Bangsal Rawat Inap
          </h1>
        </div>

        {/* Live Metrics Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '1.15rem', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>TOTAL PASIEN INAP</span>
              <span style={{ padding: '0.3rem', borderRadius: '6px', background: '#f5f3ff', color: '#7c3aed' }}><Building2 size={15} /></span>
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 700, color: '#0f172a' }}>{data.stats.total_inpatient}</div>
          </div>

          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '1.15rem', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#047857' }}>AKTIF DIRAWAT</span>
              <span style={{ padding: '0.3rem', borderRadius: '6px', background: '#ecfdf5', color: '#059669' }}><BedDouble size={15} /></span>
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 700, color: '#047857' }}>{data.stats.active_beds}</div>
          </div>

          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '1.15rem', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#b45309' }}>MENUNGGU BED</span>
              <span style={{ padding: '0.3rem', borderRadius: '6px', background: '#fef3c7', color: '#d97706' }}><Clock size={15} /></span>
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 700, color: '#b45309' }}>{data.stats.waiting_bed}</div>
          </div>

          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '1.15rem', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#6d28d9' }}>RENCANA PULANG</span>
              <span style={{ padding: '0.3rem', borderRadius: '6px', background: '#ede9fe', color: '#7c3aed' }}><CheckCircle2 size={15} /></span>
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 700, color: '#6d28d9' }}>{data.stats.ready_discharge}</div>
          </div>
        </div>

        {/* Filter Bar */}
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '0.85rem 1rem',
          border: '1px solid #e2e8f0',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            padding: '0.45rem 0.75rem',
            flex: '1 1 240px'
          }}>
            <Search size={15} color="#64748b" />
            <input
              type="text"
              placeholder="Cari pasien, no admisi, RM, bangsal, dokter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', fontSize: '0.85rem' }}
            />
          </div>

          <select
            value={selectedWard}
            onChange={(e) => setSelectedWard(e.target.value)}
            style={{
              padding: '0.45rem 0.75rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.825rem',
              fontWeight: 500
            }}
          >
            <option value="ALL">Semua Bangsal</option>
            {wardOptions.map(w => (
              <option key={w} value={w}>{w}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={{
              padding: '0.45rem 0.75rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.825rem',
              fontWeight: 500
            }}
          >
            <option value="ALL">Semua Status</option>
            <option value="DIRAWAT">Aktif Dirawat</option>
            <option value="MENUNGGU_BED">Menunggu Bed</option>
            <option value="SIAP_PULANG">Rencana Pulang</option>
          </select>
        </div>

        {/* Table Content */}
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          overflow: 'hidden'
        }}>
          {error && (
            <div style={{ padding: '1rem', background: '#fef2f2', color: '#991b1b', borderBottom: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {loading && data.items.length === 0 ? (
            <div style={{ padding: '3.5rem', textAlign: 'center', color: '#64748b' }}>
              <RefreshCw size={26} style={{ animation: 'spin 1s linear infinite', marginBottom: '0.5rem', color: '#7c3aed' }} />
              <div>Memuat data sensus rawat inap...</div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
              <BedDouble size={32} style={{ marginBottom: '0.5rem', color: '#94a3b8' }} />
              <div style={{ fontWeight: 600, color: '#334155' }}>Tidak ada data rawat inap ditemukan</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    <th style={{ padding: '0.85rem 1.25rem', width: '110px' }}>No Admisi</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Pasien & No. RM</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Ruang / Bangsal & Bed</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Dokter DPJP</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Tanggal Masuk</th>
                    <th style={{ padding: '0.85rem 1.25rem', textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item, idx) => (
                    <tr
                      key={item.appointment_id || idx}
                      style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.15s ease' }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '0.95rem 1.25rem' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '0.35rem 0.65rem',
                          background: '#f5f3ff',
                          border: '1px solid #ddd6fe',
                          borderRadius: '8px',
                          fontWeight: 700,
                          fontSize: '0.95rem',
                          color: '#6d28d9'
                        }}>
                          {item.queue_number || `RI-${idx + 1}`}
                        </span>
                      </td>

                      <td style={{ padding: '0.95rem 1.25rem' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{item.patient_name}</div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{item.medical_record_no}</div>
                      </td>

                      <td style={{ padding: '0.95rem 1.25rem' }}>
                        <div style={{ fontWeight: 600, color: '#7c3aed' }}>{item.ward_name}</div>
                        {item.notes && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{item.notes}</div>}
                      </td>

                      <td style={{ padding: '0.95rem 1.25rem' }}>
                        <div style={{ color: '#1e293b', fontWeight: 500 }}>{item.doctor_name}</div>
                      </td>

                      <td style={{ padding: '0.95rem 1.25rem' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#334155' }}>
                          <Calendar size={13} color="#64748b" /> {item.admission_date}
                        </div>
                      </td>

                      <td style={{ padding: '0.95rem 1.25rem', textAlign: 'center' }}>
                        {getStatusBadge(item.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default DaftarRawatInap;
