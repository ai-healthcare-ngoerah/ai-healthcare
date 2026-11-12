const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8001') + '/api/scribe';

const TOKEN_KEY = 'auth_token';
const getToken = () => localStorage.getItem(TOKEN_KEY);

const getAuthHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Uploads an audio file (.wav, .mp3, .m4a) or recorded audio Blob to be transcribed
 * and summarized into a SOAP CPPT note.
 */
export const uploadAudioScribe = async (fileBlob, filename = 'recording.wav', language = null) => {
  const formData = new FormData();
  formData.append('file', fileBlob, filename);
  if (language && language !== 'auto') {
    formData.append('language', language);
  }

  const response = await fetch(`${API_BASE}/upload-audio`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
    },
    body: formData,
  });

  if (!response.ok) {
    let detail = 'Gagal memproses rekaman suara.';
    try {
      const data = await response.json();
      detail = data.detail || detail;
    } catch {
      // fallback
    }
    throw new Error(detail);
  }

  return response.json();
};

/**
 * Sends manual clinical notes/text to be structured into a standard SOAP CPPT note.
 */
export const generateSoapFromText = async (text) => {
  const response = await fetch(`${API_BASE}/soap`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    let detail = 'Gagal menghasilkan SOAP dari teks.';
    try {
      const data = await response.json();
      detail = data.detail || detail;
    } catch {
      // fallback
    }
    throw new Error(detail);
  }

  return response.json();
};

/**
 * Saves a new SOAP note to MySQL database.
 */
export const saveScribeNote = async (noteData) => {
  const response = await fetch(`${API_BASE}/notes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(noteData),
  });

  if (!response.ok) {
    let detail = 'Gagal menyimpan catatan SOAP ke database.';
    try {
      const data = await response.json();
      detail = data.detail || detail;
    } catch {
      // fallback
    }
    throw new Error(detail);
  }

  return response.json();
};

/**
 * Retrieves all saved SOAP notes from MySQL database.
 */
export const getScribeNotes = async () => {
  const response = await fetch(`${API_BASE}/notes`, {
    method: 'GET',
    headers: {
      ...getAuthHeaders(),
    },
  });

  if (!response.ok) {
    throw new Error('Gagal mengambil daftar catatan SOAP dari database.');
  }

  return response.json();
};

/**
 * Updates an existing SOAP note in MySQL database.
 */
export const updateScribeNote = async (id, noteData) => {
  const response = await fetch(`${API_BASE}/notes/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(noteData),
  });

  if (!response.ok) {
    throw new Error('Gagal memperbarui catatan SOAP.');
  }

  return response.json();
};

/**
 * Deletes a single SOAP note by ID from MySQL database.
 */
export const deleteScribeNote = async (id) => {
  const response = await fetch(`${API_BASE}/notes/${id}`, {
    method: 'DELETE',
    headers: {
      ...getAuthHeaders(),
    },
  });

  if (!response.ok) {
    throw new Error('Gagal menghapus catatan SOAP.');
  }

  return response.json();
};

/**
 * Batch deletes multiple SOAP notes by array of IDs.
 */
export const deleteBatchScribeNotes = async (ids) => {
  const response = await fetch(`${API_BASE}/notes/batch`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ ids }),
  });

  if (!response.ok) {
    throw new Error('Gagal menghapus catatan yang dipilih.');
  }

  return response.json();
};

/**
 * Deletes ALL SOAP notes in MySQL database.
 */
export const deleteAllScribeNotes = async () => {
  const response = await fetch(`${API_BASE}/notes`, {
    method: 'DELETE',
    headers: {
      ...getAuthHeaders(),
    },
  });

  if (!response.ok) {
    throw new Error('Gagal menghapus seluruh catatan SOAP.');
  }

  return response.json();
};

/**
 * Analyzes SOAP note to extract ICD 10/9 and evaluate RAG follow-up control necessity.
 */
export const analyzeIcdScribe = async (soapData, patientId = null) => {
  const response = await fetch(`${API_BASE}/analyze-icd`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ soap: soapData, patient_id: patientId }),
  });

  if (!response.ok) {
    throw new Error('Gagal menganalisis kode klinis & rekomendasi kontrol.');
  }

  return response.json();
};

export const analyzeClinicalScribe = analyzeIcdScribe;

/**
 * Finalizes medical consultation: saves SOAP, updates Patient, schedules follow-up in DB & Sheets.
 */
export const finalizeConsultation = async (payload) => {
  const response = await fetch(`${API_BASE}/finalize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || 'Gagal memfinalisasi konsultasi medis.');
  }

  return response.json();
};

/**
 * Retrieves today's scheduled patient queue for the doctor to select in Medical Scribe.
 */
export const getTodayQueue = async (targetDate = null) => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8001';
  const d = new Date();
  const defaultDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const dateParam = targetDate || defaultDate;
  const url = `${baseUrl}/api/booking/queue/today?target_date=${encodeURIComponent(dateParam)}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      ...getAuthHeaders(),
    },
  });

  if (!response.ok) {
    throw new Error('Gagal mengambil antrean pasien hari ini.');
  }

  return response.json();
};

/**
 * RAG Clinical Knowledge Base & Guidelines API
 */
export const getScribeKnowledge = async () => {
  const response = await fetch(`${API_BASE}/knowledge`, {
    headers: { ...getAuthHeaders() },
  });
  if (!response.ok) throw new Error('Gagal memuat basis pengetahuan klinis.');
  const json = await response.json();
  return json.data || [];
};

export const getScribeKnowledgeDetail = async (id) => {
  const response = await fetch(`${API_BASE}/knowledge/${encodeURIComponent(id)}`, {
    headers: { ...getAuthHeaders() },
  });
  if (!response.ok) throw new Error('Gagal memuat detail dokumen pengetahuan.');
  const json = await response.json();
  return json.data;
};

export const createScribeKnowledge = async (formDataOrObj) => {
  let body;
  const headers = { ...getAuthHeaders() };

  if (formDataOrObj instanceof FormData) {
    body = formDataOrObj;
  } else {
    const fd = new FormData();
    Object.entries(formDataOrObj).forEach(([k, v]) => {
      if (v !== undefined && v !== null) {
        fd.append(k, v);
      }
    });
    body = fd;
  }

  const response = await fetch(`${API_BASE}/knowledge`, {
    method: 'POST',
    headers,
    body,
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || 'Gagal menambahkan dokumen pengetahuan.');
  }
  return response.json();
};

export const updateScribeKnowledge = async (id, payload) => {
  const response = await fetch(`${API_BASE}/knowledge/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || 'Gagal memperbarui dokumen pengetahuan.');
  }
  return response.json();
};

export const deleteScribeKnowledge = async (id) => {
  const response = await fetch(`${API_BASE}/knowledge/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { ...getAuthHeaders() },
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || 'Gagal menghapus dokumen pengetahuan.');
  }
  return response.json();
};

export const searchIcdCodes = async (query, type = 'icd10', limit = 15) => {
  if (!query || !query.trim()) return [];
  const response = await fetch(`${API_BASE}/icd?q=${encodeURIComponent(query)}&type=${encodeURIComponent(type)}&limit=${limit}`, {
    headers: { ...getAuthHeaders() },
  });
  if (!response.ok) return [];
  const json = await response.json();
  return json.data || [];
};

