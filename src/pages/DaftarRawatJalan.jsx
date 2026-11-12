import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, ArrowLeft, RefreshCw, Search, Calendar, 
  Clock, Stethoscope, AlertCircle, CheckCircle2, UserCheck, 
  Filter 
} from 'lucide-react';
import { getRawatJalanQueue, getLocalTodayISO } from '../services/api';

const DaftarRawatJalan = () => {
  const navigate = useNavigate();
  const [targetDate, setTargetDate] = useState(getLocalTodayISO());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    date: getLocalTodayISO(),
    stats: { total: 0, waiting: 0, in_consultation: 0, completed: 0 },
    items: []
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPoli, setSelectedPoli] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchData = async (dateVal = targetDate) => {
    try {
      setLoading(true);
      setError(null);
      const res = await getRawatJalanQueue(dateVal);
      setData(res || { date: dateVal, stats: { total: 0, waiting: 0, in_consultation: 0, completed: 0 }, items: [] });
    } catch (err) {
      console.error('Error fetching rawat jalan queue:', err);
      setError(err.message || 'Gagal memuat antrean rawat jalan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(targetDate);
  }, [targetDate]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchData(targetDate);
    }, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh, targetDate]);

  // Unique Poli list
  const poliOptions = useMemo(() => {
    const polis = new Set();
    data.items.forEach(item => {
      if (item.poli_name) polis.add(item.poli_name);
    });
    return Array.from(polis);
  }, [data.items]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return data.items.filter(item => {
      const matchPoli = selectedPoli === 'ALL' || item.poli_name === selectedPoli;
      const matchStatus = selectedStatus === 'ALL' || 
        (selectedStatus === 'WAITING' && ['SCHEDULED', 'PENDING', 'CHECKED_IN'].includes(item.status)) ||
        (selectedStatus === 'IN_CONSULTATION' && item.status === 'IN_CONSULTATION') ||
        (selectedStatus === 'COMPLETED' && ['COMPLETED', 'SELESAI'].includes(item.status));
      
      const q = searchQuery.toLowerCase().trim();
      const matchQuery = !q || 
        (item.patient_name && item.patient_name.toLowerCase().includes(q)) ||
        (item.queue_number && item.queue_number.toLowerCase().includes(q)) ||
        (item.medical_record_no && item.medical_record_no.toLowerCase().includes(q)) ||
        (item.doctor_name && item.doctor_name.toLowerCase().includes(q)) ||
        (item.poli_name && item.poli_name.toLowerCase().includes(q));

      return matchPoli && matchStatus && matchQuery;
    });
  }, [data.items, selectedPoli, selectedStatus, searchQuery]);

  const getStatusBadge = (status) => {
    const s = (status || '').toUpperCase();
    switch (s) {
      case 'IN_CONSULTATION':
        return (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
            padding: '0.3rem 0.75rem', borderRadius: '9999px',
            backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe',
            fontWeight: 600, fontSize: '0.78rem'
          }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#2563eb', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
            Sedang Diperiksa
          </span>
        );
      case 'CHECKED_IN':
        return (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
            padding: '0.3rem 0.75rem', borderRadius: '9999px',
            backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0',
            fontWeight: 600, fontSize: '0.78rem'
          }}>
            <UserCheck size={13} />
            Hadir / Check-in
          </span>
        );
      case 'COMPLETED':
      case 'SELESAI':
        return (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
            padding: '0.3rem 0.75rem', borderRadius: '9999px',
            backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1',
            fontWeight: 600, fontSize: '0.78rem'
          }}>
            <CheckCircle2 size={13} />
            Selesai
          </span>
        );
      default:
        return (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
            padding: '0.3rem 0.75rem', borderRadius: '9999px',
            backgroundColor: '#fffbeb', color: '#b45309', border: '1px solid #fde68a',
            fontWeight: 600, fontSize: '0.78rem'
          }}>
            <Clock size={13} />
            Menunggu
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
            onClick={() => navigate('/app/antrean/rawat-jalan')}
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
            {/* Date Picker */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: '#ffffff',
              padding: '0.4rem 0.75rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1'
            }}>
              <Calendar size={15} color="#059669" />
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                style={{
                  border: 'none',
                  outline: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: '#0f172a',
                  background: 'transparent',
                  cursor: 'pointer'
                }}
              />
            </div>

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
                style={{ cursor: 'pointer', accentColor: '#059669' }}
              />
              Auto-sync (15s)
            </label>

            {/* Refresh Button */}
            <button
              onClick={() => fetchData(targetDate)}
              disabled={loading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.45rem 0.85rem',
                backgroundColor: '#059669',
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
            Papan Seluruh Antrean Poliklinik
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
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>TOTAL ANTREAN</span>
              <span style={{ padding: '0.3rem', borderRadius: '6px', background: '#eff6ff', color: '#2563eb' }}><Users size={15} /></span>
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 700, color: '#0f172a' }}>{data.stats.total}</div>
          </div>

          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '1.15rem', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#b45309' }}>MENUNGGU</span>
              <span style={{ padding: '0.3rem', borderRadius: '6px', background: '#fef3c7', color: '#d97706' }}><Clock size={15} /></span>
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 700, color: '#b45309' }}>{data.stats.waiting}</div>
          </div>

          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '1.15rem', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1d4ed8' }}>SEDANG DIPERIKSA</span>
              <span style={{ padding: '0.3rem', borderRadius: '6px', background: '#eff6ff', color: '#1d4ed8' }}><Stethoscope size={15} /></span>
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 700, color: '#1d4ed8' }}>{data.stats.in_consultation}</div>
          </div>

          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '1.15rem', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#047857' }}>SELESAI</span>
              <span style={{ padding: '0.3rem', borderRadius: '6px', background: '#ecfdf5', color: '#059669' }}><CheckCircle2 size={15} /></span>
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 700, color: '#047857' }}>{data.stats.completed}</div>
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
              placeholder="Cari pasien, no antrean, RM, dokter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', fontSize: '0.85rem' }}
            />
          </div>

          <select
            value={selectedPoli}
            onChange={(e) => setSelectedPoli(e.target.value)}
            style={{
              padding: '0.45rem 0.75rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.825rem',
              fontWeight: 500
            }}
          >
            <option value="ALL">Semua Poliklinik</option>
            {poliOptions.map(p => (
              <option key={p} value={p}>{p}</option>
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
            <option value="WAITING">Menunggu</option>
            <option value="IN_CONSULTATION">Sedang Diperiksa</option>
            <option value="COMPLETED">Selesai</option>
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
              <RefreshCw size={26} style={{ animation: 'spin 1s linear infinite', marginBottom: '0.5rem', color: '#059669' }} />
              <div>Memuat data antrean...</div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
              <Users size={32} style={{ marginBottom: '0.5rem', color: '#94a3b8' }} />
              <div style={{ fontWeight: 600, color: '#334155' }}>Tidak ada antrean ditemukan</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    <th style={{ padding: '0.85rem 1.25rem', width: '110px' }}>No Antrean</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Pasien & No. RM</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Poliklinik & Dokter</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Waktu Konsultasi</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Penjamin</th>
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
                          background: '#ecfdf5',
                          border: '1px solid #a7f3d0',
                          borderRadius: '8px',
                          fontWeight: 700,
                          fontSize: '0.95rem',
                          color: '#047857'
                        }}>
                          {item.queue_number || `A-${idx + 1}`}
                        </span>
                      </td>

                      <td style={{ padding: '0.95rem 1.25rem' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{item.patient_name}</div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{item.medical_record_no}</div>
                      </td>

                      <td style={{ padding: '0.95rem 1.25rem' }}>
                        <div style={{ fontWeight: 600, color: '#059669' }}>{item.poli_name}</div>
                        <div style={{ fontSize: '0.78rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Stethoscope size={12} color="#64748b" /> {item.doctor_name}
                        </div>
                      </td>

                      <td style={{ padding: '0.95rem 1.25rem' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#334155', fontWeight: 500 }}>
                          <Clock size={13} color="#64748b" /> {item.appointment_time || '08:30'} WITA
                        </div>
                      </td>

                      <td style={{ padding: '0.95rem 1.25rem' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '6px',
                          background: item.service_type?.includes('BPJS') ? '#eff6ff' : '#f8fafc',
                          color: item.service_type?.includes('BPJS') ? '#1e40af' : '#475569',
                          border: `1px solid ${item.service_type?.includes('BPJS') ? '#bfdbfe' : '#e2e8f0'}`,
                          fontSize: '0.75rem',
                          fontWeight: 500
                        }}>
                          {item.service_type || 'Umum'}
                        </span>
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

export default DaftarRawatJalan;
