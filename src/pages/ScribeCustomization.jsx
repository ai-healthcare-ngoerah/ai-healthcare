import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sliders,
  RotateCcw,
  Save,
  Stethoscope,
  Activity,
  Layers,
  ClipboardList,
  Building,
  Search,
  Check,
  Flame,
  ArrowRight,
  Lock,
  HeartPulse,
  Baby,
  ChevronDown,
  ChevronUp,
  ListFilter
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNotification } from '../context/NotificationContext';

// 13 EMR SIMRS Forms with Concise, Simple Field Customization (No long text/descriptions)
export const FORMAT_OPTION_I18N_MAP = {
  'Poin Terstruktur SOAP': 'poin_terstruktur_soap',
  'Naratif Kronologis Bebas': 'naratif_kronologis_bebas',
  'TTV Terpisah + Deskripsi Fisik': 'ttv_terpisah_deskripsi_fisik',
  'Format Generalis Singkat': 'format_generalis_singkat',
  'Kode ICD-10 + Deskripsi Standar WHO': 'kode_icd10_deskripsi_who',
  'Kode ICD-10 Utama Saja': 'kode_icd10_utama_saja',
  'Deteksi Otomatis Kode ICD-9-CM': 'deteksi_otomatis_kode_icd9',
  'Hanya Prosedur Tindakan Mayor': 'hanya_prosedur_mayor',
  'Signa Baku Lengkap (Dosis, Qty, Rute, Aturan Pakai)': 'signa_baku_lengkap',
  'Format Ringkas (Nama Obat & Dosis)': 'format_ringkas_resep',
  'Rincian Pemeriksaan + Indikasi Klinis': 'rincian_penunjang_indikasi',
  'Daftar Singkat Penunjang': 'daftar_singkat_penunjang',
  'Jadwal Rencana + Kategori Prosedur': 'jadwal_kategori_prosedur',
  'Daftar Prosedur Singkat': 'daftar_prosedur_singkat',
  'Disposisi + Tanggal Kontrol SKDP + Edukasi': 'disposisi_kontrol_edukasi',
  'Status Pulang Ringkas': 'status_pulang_ringkas',
  'Format Visitasi Harian + Instruksi PPA': 'visitasi_harian_ppa',
  'Format Ringkasan Visit Singkat': 'ringkasan_visit_singkat',
  'Resume Klinis Lengkap + Terapi Obat Pulang': 'resume_lengkap_terapi',
  'Resume Pulang Ringkas': 'resume_pulang_ringkas',
  'Level Triase + Indikasi Rawat + Terapi Sementara': 'triase_rawat_sementara',
  'SPRI Format Standar': 'spri_standar',
  'Ikhtisar Klinis + Permintaan Konsultasi': 'ikhtisar_klinis_konsul',
  'Lembar Rujukan Singkat': 'lembar_rujukan_singkat',
  'Hitung Lama Hari Istirahat Otomatis': 'hitung_istirahat_otomatis',
  'Format Keterangan Sehat': 'format_keterangan_sehat'
};

export const DEFAULT_EMR_MAPPING = [
  {
    id: 'rte_2_subyektif',
    name: 'Subyektif (Anamnesis Dokter)',
    rteCode: '2',
    component: 'Subyektif (S)',
    mandatory: false,
    systemNote: 'Standar Akreditasi KARS & Resume Medis',
    enabled: true,
    format: 'Poin Terstruktur SOAP',
    options: ['Poin Terstruktur SOAP', 'Naratif Kronologis Bebas'],
    description: 'Keluhan utama, riwayat penyakit, alergi, dan pengobatan rutin pasien.',
    fields: [
      { key: 'alasan_keluhan', name: 'Keluhan Utama', mandatory: true, enabled: true },
      { key: 'rwyt_penyakit_sekarang', name: 'Riwayat Penyakit Sekarang (RPS)', mandatory: true, enabled: true },
      { key: 'rwyt_penyakit_dahulu', name: 'Riwayat Penyakit Dahulu (RPD)', mandatory: false, enabled: true },
      { key: 'ket_rwyt_alergi_obat', name: 'Alergi Obat', mandatory: false, enabled: true },
      { key: 'ket_rwyt_alergi', name: 'Alergi Makanan & Lainnya', mandatory: false, enabled: true },
      { key: 'terapi_obat_saat_ini', name: 'Pengobatan Rutin Saat Ini', mandatory: false, enabled: true },
      { key: 'rwyt_penyakit_keluarga', name: 'Riwayat Penyakit Keluarga', mandatory: false, enabled: false },
      { key: 'ket_kecelakaan_kerja', name: 'Kecelakaan Kerja / Trauma', mandatory: false, enabled: false },
      { key: 'status_psikologi', name: 'Status Psikologis & Budaya', mandatory: false, enabled: false }
    ]
  },
  {
    id: 'rte_3_obyektif',
    name: 'Obyektif (Pemeriksaan Fisik & TTV)',
    rteCode: '3',
    component: 'Obyektif (O)',
    mandatory: false,
    systemNote: 'Standar Akreditasi KARS & Resume Medis',
    enabled: true,
    format: 'TTV Terpisah + Deskripsi Fisik',
    options: ['TTV Terpisah + Deskripsi Fisik', 'Format Generalis Singkat'],
    description: 'Tanda-tanda vital (TTV), pemeriksaan fisik organ tubuh, dan hasil penunjang.',
    fields: [
      { key: 'vital_signs', name: 'Tanda-Tanda Vital (TTV)', mandatory: true, enabled: true },
      { key: 'txt_pemeriksaan_fisik', name: 'Pemeriksaan Fisik Generalis', mandatory: true, enabled: true },
      { key: 'txt_hasil_lab', name: 'Rangkuman Hasil Lab', mandatory: false, enabled: true },
      { key: 'txt_hasil_radiologi', name: 'Hasil Radiologi / Rontgen', mandatory: false, enabled: true },
      { key: 'txt_hasil_penunjang_lain', name: 'Hasil Penunjang Lain (EKG/USG)', mandatory: false, enabled: false },
      { key: 'txt_status_khusus', name: 'Status Khusus (Saraf/Bedah)', mandatory: false, enabled: false }
    ]
  },
  {
    id: 'rte_13_diagnosa_icd10',
    name: 'Diagnosa ICD-10 Pasien',
    rteCode: '13',
    component: 'Diagnosa (A)',
    mandatory: true, // MANDATORY SYSTEM: IS_DIAG_UTAMA = 1
    systemNote: 'Wajib Sistem: Minimal 1 Diagnosa Utama (IS_DIAG_UTAMA = 1)',
    enabled: true,
    format: 'Kode ICD-10 + Deskripsi Standar WHO',
    options: ['Kode ICD-10 + Deskripsi Standar WHO', 'Kode ICD-10 Utama Saja'],
    description: 'Diagnosa utama dan sekunder berbasis ICD-10 WHO untuk keabsahan klinis dan klaim BPJS.',
    fields: [
      { key: 'diag_utama', name: 'Diagnosa Utama (Primary)', mandatory: true, enabled: true },
      { key: 'diag_sekunder', name: 'Diagnosa Sekunder & Komplikasi', mandatory: false, enabled: true },
      { key: 'kode_icd10', name: 'Resolusi Kode ICD-10 Otomatis', mandatory: true, enabled: true },
      { key: 'status_diagnosa', name: 'Status Kasus (Baru / Lama)', mandatory: false, enabled: true },
      { key: 'cat_khusus_dokter', name: 'Catatan Khusus Dokter DPJP', mandatory: false, enabled: false }
    ]
  },
  {
    id: 'rte_14_prosedur_icd9',
    name: 'Prosedur / Tindakan ICD-9-CM',
    rteCode: '14',
    component: 'Planning (P)',
    mandatory: false,
    systemNote: 'Kondisional: Jika dilakukan tindakan poliklinik',
    enabled: true,
    format: 'Deteksi Otomatis Kode ICD-9-CM',
    options: ['Deteksi Otomatis Kode ICD-9-CM', 'Narasi Tindakan Saja'],
    description: 'Pencatatan tindakan medis langsung berbasis ICD-9-CM di poliklinik.',
    fields: [
      { key: 'nama_tindakan', name: 'Nama Tindakan / Prosedur', mandatory: true, enabled: true },
      { key: 'kode_icd9', name: 'Kode ICD-9-CM Otomatis', mandatory: true, enabled: true },
      { key: 'waktu_tindakan', name: 'Waktu Pelaksanaan (Tanggal & Jam)', mandatory: false, enabled: true },
      { key: 'jenis_tindakan', name: 'Klasifikasi Tindakan (Utama/Sekunder)', mandatory: false, enabled: true },
      { key: 'deskripsi_prosedur', name: 'Rincian Teknis Tindakan', mandatory: false, enabled: false }
    ]
  },
  {
    id: 'rte_11_resep',
    name: 'Resep / E-Prescribing Farmasi',
    rteCode: '11',
    component: 'Planning (P)',
    mandatory: false,
    systemNote: 'Kondisional: Jika diresepkan terapi obat',
    enabled: true,
    format: 'Signa Baku Lengkap (Dosis, Qty, Rute, Aturan Pakai)',
    options: ['Signa Baku Lengkap (Dosis, Qty, Rute, Aturan Pakai)', 'Format Ringkas (Nama Obat & Dosis)'],
    description: 'Resep elektronik farmasi (nama obat, dosis takaran, jumlah kuantitas, signa, aturan minum).',
    fields: [
      { key: 'nama_obat', name: 'Nama Obat Farmasi', mandatory: true, enabled: true },
      { key: 'dosis_satuan', name: 'Dosis & Satuan Takaran', mandatory: true, enabled: true },
      { key: 'jumlah_qty', name: 'Jumlah Kuantitas (Qty)', mandatory: true, enabled: true },
      { key: 'signa_aturan', name: 'Signa & Aturan Minum', mandatory: true, enabled: true },
      { key: 'rute_pemberian', name: 'Rute Pemberian Obat', mandatory: false, enabled: true },
      { key: 'racikan_pulveres', name: 'Status Resep Racikan', mandatory: false, enabled: false },
      { key: 'iter_resep', name: 'Iterasi Pengulangan Resep', mandatory: false, enabled: false }
    ]
  },
  {
    id: 'rte_25_wo_penunjang',
    name: 'Order Penunjang (Lab / Radiologi / PA / Mikro)',
    rteCode: '25',
    component: 'Planning (P)',
    mandatory: false,
    systemNote: 'Kondisional: Jika membutuhkan tes penunjang diagnostik',
    enabled: true,
    format: 'Rincian Pemeriksaan + Indikasi Klinis',
    options: ['Rincian Pemeriksaan + Indikasi Klinis', 'Catatan Order di Bagian Planning'],
    description: 'Permintaan pemeriksaan penunjang ke Lab PK, Radiologi, PA, atau Mikrobiologi.',
    fields: [
      { key: 'indikasi_klinis', name: 'Indikasi Klinis / Diagnosis Kerja', mandatory: true, enabled: true },
      { key: 'unit_instalasi', name: 'Pilihan Instalasi Penunjang', mandatory: true, enabled: true },
      { key: 'daftar_pemeriksaan', name: 'Daftar Item Tes / Rontgen', mandatory: true, enabled: true },
      { key: 'is_cito', name: 'Prioritas CITO (Darurat)', mandatory: false, enabled: true },
      { key: 'tanggal_rencana_wo', name: 'Rencana Tanggal Pemeriksaan', mandatory: false, enabled: false }
    ]
  },
  {
    id: 'rte_33_rencana_tindakan',
    name: 'Rencana Tindakan Terjadwal (Operasi/HD/Kemo/Endo)',
    rteCode: '33',
    component: 'Planning (P)',
    mandatory: false,
    systemNote: 'Kondisional: Penjadwalan prosedur elektif',
    enabled: false,
    format: 'Jadwal Rencana + Kategori Prosedur',
    options: ['Jadwal Rencana + Kategori Prosedur', 'Catatan Edukasi Pasien Saja'],
    description: 'Penjadwalan tindakan elektif: Kamar Operasi (OK), Hemodialisa, Kemoterapi, Endoskopi, Cathlab.',
    fields: [
      { key: 'kategori_rencana', name: 'Kategori Tindakan Terjadwal', mandatory: true, enabled: true },
      { key: 'tanggal_jadwal', name: 'Tanggal Pelaksanaan Tindakan', mandatory: true, enabled: true },
      { key: 'nama_tindakan_rencana', name: 'Nama Tindakan Terjadwal', mandatory: false, enabled: true },
      { key: 'persiapan_khusus', name: 'Instruksi Persiapan Pra-Tindakan', mandatory: false, enabled: true },
      { key: 'dokter_pelaksana', name: 'Dokter Operator / DPJP', mandatory: false, enabled: false }
    ]
  },
  {
    id: 'rte_32_kondisi_akhir',
    name: 'Kondisi Akhir & Disposisi Pasien',
    rteCode: '32',
    component: 'Disposisi',
    mandatory: true, // MANDATORY SYSTEM: IS_REG_KELUAR = 1
    systemNote: 'Wajib Sistem: Penutupan Registrasi Pasien (IS_REG_KELUAR = 1)',
    enabled: true,
    format: 'Disposisi + Tanggal Kontrol SKDP + Edukasi',
    options: ['Disposisi + Tanggal Kontrol SKDP + Edukasi', 'Disposisi Standar Saja'],
    description: 'Keputusan kepulangan, jadwal kontrol SKDP, rujukan, atau alih rawat inap.',
    fields: [
      { key: 'cara_keluar', name: 'Keputusan Cara Keluar / Disposisi', mandatory: true, enabled: true },
      { key: 'keadaan_keluar', name: 'Kondisi Klinis Pasien Pulang', mandatory: false, enabled: true },
      { key: 'tgl_rencana_kontrol', name: 'Tanggal Rencana Kontrol (SKDP)', mandatory: false, enabled: true },
      { key: 'unit_dokter_kontrol', name: 'Poliklinik & Dokter Kontrol', mandatory: false, enabled: true },
      { key: 'pertimbangan_kontrol', name: 'Pertimbangan Medis Kontrol Ulang', mandatory: false, enabled: true },
      { key: 'is_prb', name: 'Program Rujuk Balik (PRB BPJS)', mandatory: false, enabled: false },
      { key: 'prognosis_pasien', name: 'Prognosis Penyakit', mandatory: false, enabled: false }
    ]
  },
  {
    id: 'rte_cppt_terintegrasi',
    name: 'CPPT / RPPT Terintegrasi Rawat Inap',
    rteCode: 'CPPT',
    component: 'Subyektif (S)',
    mandatory: false,
    systemNote: 'Khusus Ruang Perawatan / Visitasi Bangsal',
    enabled: false,
    format: 'Format Visitasi Harian + Instruksi PPA',
    options: ['Format Visitasi Harian + Instruksi PPA', 'Format Ringkasan Visit Singkat'],
    description: 'Catatan perkembangan SOAP harian visitasi rawat inap antartenaga kesehatan.',
    fields: [
      { key: 'cppt_subyektif', name: 'Subyektif Visitasi (S)', mandatory: true, enabled: true },
      { key: 'cppt_obyektif', name: 'Obyektif & TTV Terkini (O)', mandatory: true, enabled: true },
      { key: 'cppt_assesment', name: 'Evaluasi Masalah Klinis (A)', mandatory: true, enabled: true },
      { key: 'cppt_planning', name: 'Rencana Terapi Lanjutan (P)', mandatory: false, enabled: true },
      { key: 'cppt_instruksi', name: 'Instruksi PPA / Perawat', mandatory: false, enabled: true }
    ]
  },
  {
    id: 'rte_20_discharge_summary',
    name: 'Ringkasan Pasien Keluar (Discharge Summary)',
    rteCode: '20',
    component: 'Disposisi',
    mandatory: false,
    systemNote: 'Khusus Pasien Selesai Rawat Inap',
    enabled: false,
    format: 'Resume Klinis Lengkap + Terapi Obat Pulang',
    options: ['Resume Klinis Lengkap + Terapi Obat Pulang', 'Resume Pokok Kepulangan'],
    description: 'Resume medis kepulangan pasien selesai rawat inap dan daftar obat pulang.',
    fields: [
      { key: 'alasan_rawat', name: 'Indikasi Masuk Rawat Inap', mandatory: true, enabled: true },
      { key: 'riwayat_perjalanan', name: 'Perjalanan Penyakit Selama Rawat', mandatory: false, enabled: true },
      { key: 'evaluasi_fisik_keluar', name: 'Pemeriksaan Fisik Saat Keluar', mandatory: false, enabled: true },
      { key: 'rangkuman_penunjang', name: 'Rangkuman Hasil Tes Penunjang', mandatory: false, enabled: true },
      { key: 'daftar_obat_pulang', name: 'Daftar Terapi & Obat Pulang', mandatory: true, enabled: true },
      { key: 'anjuran_edukasi', name: 'Instruksi Edukasi & Kontrol', mandatory: false, enabled: true }
    ]
  },
  {
    id: 'rte_26_spri_ranap',
    name: 'Surat Pengantar Rawat Inap (SPRI)',
    rteCode: '26',
    component: 'Disposisi',
    mandatory: false,
    systemNote: 'Kondisional: Alih Pasien Rawat Jalan ke Rawat Inap',
    enabled: false,
    format: 'Level Triase + Indikasi Rawat + Terapi Sementara',
    options: ['Level Triase + Indikasi Rawat + Terapi Sementara', 'Indikasi Rawat Singkat'],
    description: 'Surat pengantar alih rawat dari poliklinik atau IGD menuju bangsal rawat inap.',
    fields: [
      { key: 'level_triase_perawatan', name: 'Tingkat Perawatan (Biasa/HCU/ICU)', mandatory: true, enabled: true },
      { key: 'indikasi_rawat', name: 'Alasan Masuk Rawat Inap', mandatory: true, enabled: true },
      { key: 'riwayat_positif', name: 'Temuan Kritis Gawat Darurat', mandatory: false, enabled: true },
      { key: 'terapi_sementara', name: 'Terapi Sementara / Cairan Awal', mandatory: false, enabled: true },
      { key: 'dokter_dpjp_ranap', name: 'Dokter DPJP Penerima di Rawat Inap', mandatory: false, enabled: false }
    ]
  },
  {
    id: 'rte_30_rujuk_divisi',
    name: 'Rujuk Divisi / Konsul Antar Poli Internal',
    rteCode: '30',
    component: 'Planning (P)',
    mandatory: false,
    systemNote: 'Kondisional: Lembar Konsultasi Spesialis Internal',
    enabled: false,
    format: 'Ikhtisar Klinis + Permintaan Konsultasi',
    options: ['Ikhtisar Klinis + Permintaan Konsultasi', 'Lembar Konsul Cepat'],
    description: 'Konsultasi rujukan internal antardivisi atau spesialis rumah sakit.',
    fields: [
      { key: 'divisi_tujuan', name: 'Divisi / Spesialisasi Tujuan', mandatory: true, enabled: true },
      { key: 'ikhtisar_klinis', name: 'Ikhtisar Kondisi Klinis', mandatory: true, enabled: true },
      { key: 'pertanyaan_konsul', name: 'Permintaan / Pertanyaan Konsultasi', mandatory: true, enabled: true },
      { key: 'jenis_konsultasi', name: 'Model Konsultasi (Biasa/Cito)', mandatory: false, enabled: true }
    ]
  },
  {
    id: 'rte_27_39_surat_kis',
    name: 'Surat Keterangan Istirahat Sakit / Sehat (KIS)',
    rteCode: '27/39',
    component: 'Administrasi',
    mandatory: false,
    systemNote: 'Sesuai kebutuhan administrasi pasien',
    enabled: true,
    format: 'Hitung Lama Hari Istirahat Otomatis',
    options: ['Hitung Lama Hari Istirahat Otomatis', 'Format Keterangan Sehat'],
    description: 'Penerbitan surat istirahat kerja atau surat keterangan berbadan sehat.',
    fields: [
      { key: 'lama_hari_istirahat', name: 'Jumlah Hari Istirahat', mandatory: true, enabled: true },
      { key: 'periode_tanggal', name: 'Periode Tanggal Istirahat', mandatory: true, enabled: true },
      { key: 'keterangan_diagnosa', name: 'Keterangan Diagnosa pada Surat', mandatory: false, enabled: true },
      { key: 'jenis_surat', name: 'Format Surat Sakit / Sehat', mandatory: false, enabled: false }
    ]
  }
];

// Presets by clinical specialty
export const SPECIALTY_PRESETS = [
  {
    id: 'umum',
    name: 'Poliklinik Umum & Faskes Primer',
    icon: Stethoscope,
    badge: 'Rawat Jalan Primer',
    activeCodes: ['2', '3', '13', '11', '32', '27/39'],
    description: 'Konfigurasi seimbang untuk pelayanan poliklinik umum dan faskes primer. Mengaktifkan anamnesis SOAP, pemeriksaan fisik, diagnosa ICD-10, e-resep, disposisi kontrol, dan surat sakit.'
  },
  {
    id: 'interna',
    name: 'Poliklinik Penyakit Dalam (Interna)',
    icon: Activity,
    badge: 'Kronis & Metabolik',
    activeCodes: ['2', '3', '13', '11', '25', '32', '33'],
    description: 'Dioptimalkan untuk kasus metabolik dan kronis (DM, Hipertensi, Ginjal). Mengaktifkan order penunjang laboratorium/radiologi, rencana cuci darah HD, e-resep PRB, dan jadwal kontrol SKDP.'
  },
  {
    id: 'bedah',
    name: 'Poliklinik Bedah & Orthopedi',
    icon: Flame,
    badge: 'Bedah & Prosedural',
    activeCodes: ['2', '3', '13', '14', '33', '26', '32'],
    description: 'Fokus pada tindakan dan pembedahan. Mengaktifkan kode tindakan ICD-9-CM, penjadwalan kamar operasi (OK elektif), order penunjang pra-bedah, dan surat pengantar rawat inap SPRI.'
  },
  {
    id: 'anak',
    name: 'Poliklinik Anak (Pediatri)',
    icon: Baby,
    badge: 'Tumbuh Kembang & Anak',
    activeCodes: ['2', '3', '13', '11', '32'],
    description: 'Diselaraskan untuk anamnesis orang tua/keluarga, catatan fisik pediatri, diagnosa ICD-10 anak, dan peresepan dengan aturan takaran usia/berat badan.'
  },
  {
    id: 'jantung',
    name: 'Poliklinik Jantung & Pembuluh Darah',
    icon: HeartPulse,
    badge: 'Kardiologi & Cathlab',
    activeCodes: ['2', '3', '13', '14', '25', '33', '32'],
    description: 'Mencakup rekam EKG (ICD-9 89.52), pemeriksaan biomarker penunjang troponin, rencana kateterisasi pembuluh darah (Cathlab PCI), serta e-resep kardiologi.'
  },
  {
    id: 'ranap',
    name: 'Bangsal & Rawat Inap (Ward Round)',
    icon: Layers,
    badge: 'Rawat Inap & Bangsal',
    activeCodes: ['CPPT', '20', '30', '13', '11', '32'],
    description: 'Diperuntukkan bagi visitasi dokter DPJP di ruang rawat inap: lembar CPPT Terintegrasi SOAP, konsul antar-divisi medis, serta Ringkasan Pasien Keluar (Discharge Summary).'
  }
];

const STORAGE_KEY = 'ternak_scribe_custom_mapping_v3';

const ScribeCustomization = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showToast } = useNotification();
  const [activeTab, setActiveTab] = useState('matrix'); // 'matrix' | 'presets'
  const [selectedComponentFilter, setSelectedComponentFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedForms, setExpandedForms] = useState({
    rte_2_subyektif: true,
    rte_3_obyektif: true,
    rte_13_diagnosa_icd10: true
  });

  // Mapping state
  const [mappingList, setMappingList] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure mandatory forms and fields stay enabled
        return parsed.map((item) => {
          const isMandatory = item.mandatory;
          const updatedFields = (item.fields || []).map((f) =>
            f.mandatory ? { ...f, enabled: true } : f
          );
          return {
            ...item,
            enabled: isMandatory ? true : item.enabled,
            fields: updatedFields
          };
        });
      }
    } catch (e) {
      console.error('Error loading custom mapping:', e);
    }
    return DEFAULT_EMR_MAPPING;
  });

  const [activePresetId, setActivePresetId] = useState('umum');

  // Toggle module state
  const handleToggleModule = (id) => {
    setMappingList((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          if (item.mandatory) return item; // Cannot disable mandatory system forms
          return { ...item, enabled: !item.enabled };
        }
        return item;
      })
    );
  };

  // Toggle individual field
  const handleToggleField = (formId, fieldKey) => {
    setMappingList((prev) =>
      prev.map((form) => {
        if (form.id !== formId) return form;
        const updatedFields = (form.fields || []).map((field) => {
          if (field.key !== fieldKey) return field;
          if (field.mandatory) return field; // Cannot disable mandatory field
          return { ...field, enabled: !field.enabled };
        });
        return { ...form, fields: updatedFields };
      })
    );
  };

  // Toggle all fields in a form
  const handleToggleAllFields = (formId, shouldEnable) => {
    setMappingList((prev) =>
      prev.map((form) => {
        if (form.id !== formId) return form;
        const updatedFields = (form.fields || []).map((field) => ({
          ...field,
          enabled: field.mandatory ? true : shouldEnable
        }));
        return { ...form, fields: updatedFields };
      })
    );
  };

  // Toggle accordion expand/collapse
  const handleToggleExpand = (formId) => {
    setExpandedForms((prev) => ({
      ...prev,
      [formId]: !prev[formId]
    }));
  };

  // Change format option
  const handleChangeFormat = (id, newFormat) => {
    setMappingList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, format: newFormat } : item))
    );
  };

  // Apply a Specialty Preset
  const handleApplyPreset = (preset) => {
    setActivePresetId(preset.id);
    setMappingList((prev) =>
      prev.map((item) => {
        if (item.mandatory) return { ...item, enabled: true };
        const shouldEnable = preset.activeCodes.includes(item.rteCode);
        return { ...item, enabled: shouldEnable };
      })
    );
    showToast({
      type: 'info',
      title: t('scribe.customization.toastPresetApplied'),
      message: t('scribe.customization.toastPresetAppliedDesc', {
        name: t(`scribe.customization.presetsList.${preset.id}.name`, preset.name)
      })
    });
  };

  // Save to localStorage
  const handleSave = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mappingList));
      showToast({
        type: 'success',
        title: t('scribe.customization.toastSaveSuccess'),
        message: t('scribe.customization.toastSaveSuccessDesc')
      });
    } catch (e) {
      showToast({
        type: 'error',
        title: t('scribe.customization.toastSaveError'),
        message: t('scribe.customization.toastSaveErrorDesc')
      });
    }
  };

  // Reset to Default
  const handleReset = () => {
    setMappingList(DEFAULT_EMR_MAPPING);
    setActivePresetId('umum');
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
    showToast({
      type: 'info',
      title: t('scribe.customization.toastResetSuccess'),
      message: t('scribe.customization.toastResetSuccessDesc')
    });
  };

  // Helper to get compact SOAP badge (S, O, A, P) while keeping Disposition & Administration intact
  const getComponentBadgeText = (form) => {
    const comp = form.component || '';
    if (comp.startsWith('Subyektif') || comp.startsWith('Subjective')) return 'S';
    if (comp.startsWith('Obyektif') || comp.startsWith('Objective')) return 'O';
    if (comp.startsWith('Diagnosa') || comp.startsWith('Assessment')) return 'A';
    if (comp.startsWith('Planning') || comp.startsWith('Plan')) return 'P';
    return t(`scribe.customization.forms.${form.id}.component`, { defaultValue: comp });
  };

  // Filtered mapping list
  const filteredMapping = mappingList.filter((item) => {
    const q = searchQuery.toLowerCase();
    const locName = t(`scribe.customization.forms.${item.id}.name`, { defaultValue: item.name }).toLowerCase();
    const locComp = t(`scribe.customization.forms.${item.id}.component`, { defaultValue: item.component }).toLowerCase();
    const matchesSearch =
      !searchQuery ||
      item.name.toLowerCase().includes(q) ||
      locName.includes(q) ||
      item.rteCode.toLowerCase().includes(q) ||
      item.component.toLowerCase().includes(q) ||
      locComp.includes(q) ||
      (item.fields || []).some((f) => {
        const locField = t(`scribe.customization.fieldKeys.${f.key}`, { defaultValue: f.name }).toLowerCase();
        return f.name.toLowerCase().includes(q) || locField.includes(q);
      });

    if (!matchesSearch) return false;
    if (selectedComponentFilter === 'ALL') return true;
    return item.component.toLowerCase().includes(selectedComponentFilter.toLowerCase());
  });

  const activeFormCount = mappingList.filter((m) => m.enabled).length;
  const totalFieldsCount = mappingList.reduce((acc, curr) => acc + (curr.fields ? curr.fields.length : 0), 0);
  const activeFieldsCount = mappingList.reduce(
    (acc, curr) => acc + (curr.enabled && curr.fields ? curr.fields.filter((f) => f.enabled).length : 0),
    0
  );

  return (
    <div className="container animate-fade-in" style={{ paddingBottom: '3rem' }}>
      {/* Header bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
          paddingBottom: '1.25rem',
          borderBottom: '1px solid var(--border-color)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
            <div
              style={{
                padding: '0.5rem',
                backgroundColor: '#ecfdf5',
                color: 'var(--primary-color)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Sliders size={22} />
            </div>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
              {t('scribe.customization.title')}
            </h1>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                backgroundColor: '#ecfdf5',
                color: 'var(--primary-color)',
                padding: '0.2rem 0.65rem',
                borderRadius: '9999px',
                border: '1px solid #a7f3d0'
              }}
            >
              {t('scribe.customization.activeFormsBadge', { active: activeFormCount, total: mappingList.length })}
            </span>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                backgroundColor: '#f1f5f9',
                color: '#334155',
                padding: '0.2rem 0.65rem',
                borderRadius: '9999px',
                border: '1px solid #cbd5e1'
              }}
            >
              {t('scribe.customization.activeFieldsBadge', { active: activeFieldsCount, total: totalFieldsCount })}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)', maxWidth: '820px' }}>
            {t('scribe.customization.subtitle')}
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleReset}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.55rem 1rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: '#ffffff',
              color: 'var(--text-muted)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <RotateCcw size={15} />
            <span>{t('scribe.customization.resetBtn')}</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.55rem 1.25rem',
              fontSize: '0.85rem',
              fontWeight: 600,
              borderRadius: '8px'
            }}
          >
            <Save size={16} />
            <span>{t('scribe.customization.saveBtn')}</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '1px solid var(--border-color)',
          marginBottom: '1.5rem'
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('matrix')}
          style={{
            padding: '0.75rem 1.25rem',
            border: 'none',
            borderBottom: activeTab === 'matrix' ? '2.5px solid var(--primary-color)' : '2.5px solid transparent',
            background: 'transparent',
            color: activeTab === 'matrix' ? 'var(--primary-color)' : 'var(--text-muted)',
            fontWeight: activeTab === 'matrix' ? 700 : 500,
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <ClipboardList size={18} />
          <span>{t('scribe.customization.tabMatrix')}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('presets')}
          style={{
            padding: '0.75rem 1.25rem',
            border: 'none',
            borderBottom: activeTab === 'presets' ? '2.5px solid var(--primary-color)' : '2.5px solid transparent',
            background: 'transparent',
            color: activeTab === 'presets' ? 'var(--primary-color)' : 'var(--text-muted)',
            fontWeight: activeTab === 'presets' ? 700 : 500,
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Building size={18} />
          <span>{t('scribe.customization.tabPresets')}</span>
        </button>
      </div>

      {/* TAB 1: Matriks 13 Formulir & Rincian Field */}
      {activeTab === 'matrix' && (
        <div className="animate-fade-in">
          {/* Filter Bar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.75rem',
              marginBottom: '1.25rem'
            }}
          >
            {/* Component Filter Pills */}
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
              {[
                {
                  key: 'ALL',
                  label: t('scribe.customization.filters.all', { count: mappingList.length }),
                  title: t('scribe.customization.filters.allTooltip', { count: mappingList.length })
                },
                {
                  key: 'Subyektif',
                  label: t('scribe.customization.filters.subjective'),
                  title: t('scribe.customization.filters.subjectiveTooltip')
                },
                {
                  key: 'Obyektif',
                  label: t('scribe.customization.filters.objective'),
                  title: t('scribe.customization.filters.objectiveTooltip')
                },
                {
                  key: 'Diagnosa',
                  label: t('scribe.customization.filters.assessment'),
                  title: t('scribe.customization.filters.assessmentTooltip')
                },
                {
                  key: 'Planning',
                  label: t('scribe.customization.filters.plan'),
                  title: t('scribe.customization.filters.planTooltip')
                },
                {
                  key: 'Disposisi',
                  label: t('scribe.customization.filters.disposition'),
                  title: t('scribe.customization.filters.dispositionTooltip')
                },
                {
                  key: 'Administrasi',
                  label: t('scribe.customization.filters.administration'),
                  title: t('scribe.customization.filters.administrationTooltip')
                }
              ].map((comp) => {
                const isActive = selectedComponentFilter === comp.key;
                const isSingleLetter = ['Subyektif', 'Obyektif', 'Diagnosa', 'Planning'].includes(comp.key);
                return (
                  <button
                    key={comp.key}
                    type="button"
                    title={comp.title}
                    onClick={() => setSelectedComponentFilter(comp.key)}
                    style={{
                      padding: '0.35rem 0.75rem',
                      minWidth: isSingleLetter ? '2.3rem' : 'auto',
                      textAlign: 'center',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: isActive ? '1px solid var(--primary-color)' : '1px solid #cbd5e1',
                      background: isActive ? '#ecfdf5' : '#ffffff',
                      color: isActive ? 'var(--primary-color)' : '#475569',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {comp.label}
                  </button>
                );
              })}
            </div>

            {/* Search Box */}
            <div style={{ position: 'relative', width: '270px' }}>
              <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('scribe.customization.searchPlaceholder')}
                style={{
                  width: '100%',
                  padding: '0.45rem 0.75rem 0.45rem 2.2rem',
                  fontSize: '0.85rem',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  outline: 'none',
                  backgroundColor: '#ffffff'
                }}
              />
            </div>
          </div>

          {/* Form Cards List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {filteredMapping.map((form) => {
              const isExpanded = !!expandedForms[form.id];
              const formFields = form.fields || [];
              const activeFormFieldsCount = formFields.filter((f) => f.enabled).length;

              return (
                <div
                  key={form.id}
                  className="card"
                  style={{
                    padding: '1.15rem 1.25rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: form.enabled ? '#ffffff' : '#f8fafc',
                    border: form.mandatory ? '1.5px solid #a7f3d0' : (form.enabled ? '1px solid #cbd5e1' : '1px dashed #cbd5e1'),
                    opacity: form.enabled ? 1 : 0.78,
                    transition: 'all 0.2s ease',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  {/* Form Main Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                    {/* Left Column: Form Header */}
                    <div style={{ flex: 1, minWidth: '260px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            backgroundColor: '#0f172a',
                            color: '#ffffff',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '4px'
                          }}
                        >
                          RTE {form.rteCode}
                        </span>
                        <span
                          style={{
                            fontSize: '0.725rem',
                            fontWeight: 800,
                            backgroundColor: '#f1f5f9',
                            color: '#1e293b',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '4px',
                            border: '1px solid #cbd5e1',
                            letterSpacing: '0.02em'
                          }}
                          title={t(`scribe.customization.forms.${form.id}.component`, { defaultValue: form.component })}
                        >
                          {getComponentBadgeText(form)}
                        </span>
                        <h4 style={{ margin: 0, fontSize: '0.975rem', fontWeight: 700, color: 'var(--text-main)' }}>
                          {t(`scribe.customization.forms.${form.id}.name`, { defaultValue: form.name })}
                        </h4>
                        {form.mandatory && (
                          <span
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              backgroundColor: '#ecfdf5',
                              color: 'var(--primary-color)',
                              padding: '0.15rem 0.55rem',
                              borderRadius: '9999px',
                              border: '1px solid #a7f3d0',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}
                          >
                            <Lock size={11} />
                            <span>{t('scribe.customization.mandatorySystemBadge')}</span>
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.2rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: form.enabled ? 'var(--primary-color)' : '#64748b' }}>
                          {t('scribe.customization.fieldsCount', { active: activeFormFieldsCount, total: formFields.length })}
                        </span>
                        <span style={{ color: '#cbd5e1' }}>•</span>
                        <button
                          type="button"
                          onClick={() => handleToggleExpand(form.id)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            background: 'none',
                            border: 'none',
                            color: 'var(--primary-color)',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            padding: '0.15rem 0.35rem',
                            cursor: 'pointer',
                            borderRadius: '4px'
                          }}
                          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#ecfdf5'}
                          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <span>{isExpanded ? t('scribe.customization.accordionClose') : t('scribe.customization.accordionOpen')}</span>
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      </div>
                    </div>

                    {/* Right Column: Format Dropdown & Form Enable Toggle */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                      {/* Format Selection Dropdown */}
                      <div style={{ minWidth: '230px' }}>
                        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>
                          {t('scribe.customization.formatLabel')}
                        </label>
                        <select
                          value={form.format}
                          onChange={(e) => handleChangeFormat(form.id, e.target.value)}
                          disabled={!form.enabled}
                          style={{
                            width: '100%',
                            padding: '0.45rem 0.65rem',
                            fontSize: '0.8rem',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            backgroundColor: form.enabled ? '#ffffff' : '#f1f5f9',
                            color: '#0f172a',
                            outline: 'none',
                            cursor: form.enabled ? 'pointer' : 'not-allowed'
                          }}
                        >
                          {form.options.map((opt, oIdx) => {
                            const i18nKey = FORMAT_OPTION_I18N_MAP[opt];
                            const label = i18nKey
                              ? t(`scribe.customization.formatOptions.${i18nKey}`, { defaultValue: opt })
                              : opt;
                            return (
                              <option key={oIdx} value={opt}>
                                {label}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      {/* On/Off Switch */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', minWidth: '50px' }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: 600, color: '#475569' }}>
                          {form.mandatory ? t('scribe.customization.statusLocked') : (form.enabled ? t('scribe.customization.statusActive') : t('scribe.customization.statusInactive'))}
                        </label>
                        <button
                          type="button"
                          onClick={() => handleToggleModule(form.id)}
                          disabled={form.mandatory}
                          title={
                            form.mandatory
                              ? t('scribe.customization.tooltipMandatory')
                              : (form.enabled ? t('scribe.customization.tooltipDisable') : t('scribe.customization.tooltipEnable'))
                          }
                          style={{
                            width: '44px',
                            height: '24px',
                            borderRadius: '12px',
                            background: form.enabled ? 'var(--primary-color)' : '#cbd5e1',
                            position: 'relative',
                            border: 'none',
                            cursor: form.mandatory ? 'not-allowed' : 'pointer',
                            transition: 'background 0.2s'
                          }}
                        >
                          <span
                            style={{
                              width: '18px',
                              height: '18px',
                              borderRadius: '50%',
                              background: '#ffffff',
                              position: 'absolute',
                              top: '3px',
                              left: form.enabled ? '23px' : '3px',
                              transition: 'left 0.2s',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
                            }}
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Accordion: Clean & Compact Field Checkboxes (No Long Text/Descriptions) */}
                  {isExpanded && (
                    <div
                      style={{
                        marginTop: '0.85rem',
                        paddingTop: '0.85rem',
                        borderTop: '1px solid #e2e8f0',
                        animation: 'fadeIn 0.2s ease-in-out'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <ListFilter size={14} color="var(--primary-color)" />
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a' }}>
                            {t('scribe.customization.fieldsHeader')}
                          </span>
                        </div>

                        {/* Quick Action: Select All / Essential Only */}
                        <div style={{ display: 'flex', gap: '0.35rem' }}>
                          <button
                            type="button"
                            onClick={() => handleToggleAllFields(form.id, true)}
                            disabled={!form.enabled}
                            style={{
                              padding: '0.2rem 0.5rem',
                              fontSize: '0.725rem',
                              fontWeight: 600,
                              borderRadius: '4px',
                              border: '1px solid #cbd5e1',
                              backgroundColor: '#ffffff',
                              color: '#334155',
                              cursor: form.enabled ? 'pointer' : 'not-allowed'
                            }}
                          >
                            {t('scribe.customization.selectAllBtn')}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleAllFields(form.id, false)}
                            disabled={!form.enabled}
                            style={{
                              padding: '0.2rem 0.5rem',
                              fontSize: '0.725rem',
                              fontWeight: 600,
                              borderRadius: '4px',
                              border: '1px solid #cbd5e1',
                              backgroundColor: '#ffffff',
                              color: '#64748b',
                              cursor: form.enabled ? 'pointer' : 'not-allowed'
                            }}
                          >
                            {t('scribe.customization.essentialOnlyBtn')}
                          </button>
                        </div>
                      </div>

                      {/* Compact Fields Grid */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                          gap: '0.45rem'
                        }}
                      >
                        {formFields.map((field) => {
                          const isFieldActive = form.enabled && field.enabled;
                          return (
                            <div
                              key={field.key}
                              onClick={() => {
                                if (form.enabled && !field.mandatory) {
                                  handleToggleField(form.id, field.key);
                                }
                              }}
                              style={{
                                padding: '0.45rem 0.65rem',
                                borderRadius: '6px',
                                border: field.mandatory
                                  ? '1px solid #a7f3d0'
                                  : (isFieldActive ? '1px solid #cbd5e1' : '1px dashed #e2e8f0'),
                                backgroundColor: isFieldActive ? '#ffffff' : '#f8fafc',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '0.5rem',
                                cursor: field.mandatory || !form.enabled ? 'default' : 'pointer',
                                transition: 'all 0.15s ease',
                                userSelect: 'none'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 0 }}>
                                <input
                                  type="checkbox"
                                  checked={isFieldActive}
                                  disabled={field.mandatory || !form.enabled}
                                  onChange={() => handleToggleField(form.id, field.key)}
                                  style={{
                                    width: '15px',
                                    height: '15px',
                                    accentColor: 'var(--primary-color)',
                                    cursor: field.mandatory || !form.enabled ? 'default' : 'pointer',
                                    flexShrink: 0
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <span
                                  style={{
                                    fontSize: '0.8rem',
                                    fontWeight: isFieldActive ? 600 : 500,
                                    color: isFieldActive ? '#0f172a' : '#64748b',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                  }}
                                  title={t(`scribe.customization.fieldKeys.${field.key}`, { defaultValue: field.name })}
                                >
                                  {t(`scribe.customization.fieldKeys.${field.key}`, { defaultValue: field.name })}
                                </span>
                              </div>

                              {field.mandatory && (
                                <span
                                  style={{
                                    fontSize: '0.625rem',
                                    fontWeight: 700,
                                    backgroundColor: '#ecfdf5',
                                    color: 'var(--primary-color)',
                                    padding: '0.1rem 0.35rem',
                                    borderRadius: '4px',
                                    border: '1px solid #a7f3d0',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.2rem',
                                    flexShrink: 0
                                  }}
                                >
                                  <Lock size={9} />
                                  <span>{t('scribe.customization.mandatoryBadge')}</span>
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: Preset Poliklinik & Spesialisasi */}
      {activeTab === 'presets' && (
        <div className="animate-fade-in">
          <div style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.35rem 0', color: 'var(--text-main)' }}>
              {t('scribe.customization.presetsHeaderTitle')}
            </h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {t('scribe.customization.presetsHeaderSubtitle')}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
            {SPECIALTY_PRESETS.map((preset) => {
              const IconComp = preset.icon;
              const isSelected = activePresetId === preset.id;
              return (
                <div
                  key={preset.id}
                  className="card"
                  style={{
                    padding: '1.25rem',
                    borderRadius: 'var(--radius-lg)',
                    border: isSelected ? '2px solid var(--primary-color)' : '1px solid #cbd5e1',
                    backgroundColor: isSelected ? '#f0fdf4' : '#ffffff',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div
                          style={{
                            padding: '0.45rem',
                            backgroundColor: isSelected ? 'var(--primary-color)' : '#f1f5f9',
                            color: isSelected ? '#ffffff' : '#334155',
                            borderRadius: '8px'
                          }}
                        >
                          <IconComp size={18} />
                        </div>
                        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                          {t(`scribe.customization.presetsList.${preset.id}.name`, preset.name)}
                        </h4>
                      </div>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          backgroundColor: '#e2e8f0',
                          color: '#475569',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px'
                        }}
                      >
                        {t(`scribe.customization.presetsList.${preset.id}.badge`, preset.badge)}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: '0 0 1rem 0' }}>
                      {t(`scribe.customization.presetsList.${preset.id}.description`, preset.description)}
                    </p>

                    <div style={{ marginBottom: '1rem' }}>
                      <span style={{ fontSize: '0.725rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>
                        {t('scribe.customization.activeFormsLabel')}
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                        {preset.activeCodes.map((code) => (
                          <span
                            key={code}
                            style={{
                              fontSize: '0.725rem',
                              fontWeight: 600,
                              backgroundColor: '#ffffff',
                              color: '#0f172a',
                              border: '1px solid #cbd5e1',
                              padding: '0.15rem 0.45rem',
                              borderRadius: '4px'
                            }}
                          >
                            RTE {code}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    style={{
                      width: '100%',
                      padding: '0.55rem',
                      borderRadius: '6px',
                      border: isSelected ? '1px solid var(--primary-color)' : '1px solid #cbd5e1',
                      background: isSelected ? 'var(--primary-color)' : '#ffffff',
                      color: isSelected ? '#ffffff' : 'var(--text-main)',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {isSelected ? (
                      <>
                        <Check size={16} />
                        <span>{t('scribe.customization.presetActiveBadge')}</span>
                      </>
                    ) : (
                      <>
                        <span>{t('scribe.customization.applyPresetBtn')}</span>
                        <ArrowRight size={15} />
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ScribeCustomization;
