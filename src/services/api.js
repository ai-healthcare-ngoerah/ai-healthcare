const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8005') + '/api';

const TOKEN_KEY = 'auth_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

// Core fetch helper: attaches Bearer token, parses JSON, surfaces backend error detail.
const apiFetch = async (path, { method = 'GET', body, isForm = false, auth = true } = {}) => {
  const headers = {};
  if (auth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  if (body && !isForm) headers['Content-Type'] = 'application/json';

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: isForm ? body : body ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401) {
    clearToken();
  }

  if (!response.ok) {
    let detail = 'Terjadi kesalahan pada server.';
    try {
      const data = await response.json();
      detail = data.detail || detail;
    } catch {
      /* non-JSON error */
    }
    throw new Error(detail);
  }

  if (response.status === 204) return null;
  return response.json();
};

// ---- Auth ----
export const authLogin = (email, password) =>
  apiFetch('/auth/login', { method: 'POST', body: { email, password }, auth: false });

export const authRegister = (name, email, password) =>
  apiFetch('/auth/register', { method: 'POST', body: { name, email, password }, auth: false });

export const authMe = () => apiFetch('/auth/me');

// ---- Dashboard ----
export const getDashboardStats = () => apiFetch('/dashboard/stats');

// BPJS Claims and pre-submission document checking
export const getKnowledgeReferences = () => apiFetch('/bpjs/references');

export const getKnowledgeReference = (id) => apiFetch(`/bpjs/references/${id}`);

export const addKnowledgeReferenceText = (title, content, source = 'Teks Manual') =>
  apiFetch('/bpjs/references/text', {
    method: 'POST',
    body: { title, content, source }
  });

export const addKnowledgeReferenceFile = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return apiFetch('/bpjs/references/file', {
    method: 'POST',
    body: formData,
    isForm: true
  });
};

export const updateKnowledgeReferenceText = (id, title, content) =>
  apiFetch(`/bpjs/references/${id}`, {
    method: 'PUT',
    body: { title, content }
  });

export const deleteKnowledgeReference = (id) =>
  apiFetch(`/bpjs/references/${id}`, { method: 'DELETE' });

// Quota
export const getQuota = () => apiFetch('/quota/me');

export const checkDocumentClaim = async (file, claimType = 'umum') => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('claim_type', claimType);
  return apiFetch('/bpjs/check-document-claim', {
    method: 'POST',
    body: formData,
    isForm: true
  });
};

export const checkClaimText = (claimText, claimType = 'umum', simrsPayload = null) =>
  apiFetch('/bpjs/check-claim', {
    method: 'POST',
    body: simrsPayload || { claim_text: claimText, claim_type: claimType }
  });

export const evaluateDisputeRisk = (payload) =>
  apiFetch('/bpjs/claims/dispute-risk', { method: 'POST', body: payload });

export const getDocumentHistory = () => apiFetch('/bpjs/history');

export const getDocumentHistoryById = (checkId) => apiFetch(`/bpjs/history/${checkId}`);

export const verifyClaim = (payload) =>
  apiFetch('/claims/verify', { method: 'POST', body: payload });

// ---- Settings (WhatsApp promo) ----
export const getWhatsappSettings = () => apiFetch('/settings/whatsapp');

export const updateWhatsappSettings = (payload) =>
  apiFetch('/settings/whatsapp', { method: 'PUT', body: payload });

export const getMessageLogs = (limit = 50) => apiFetch(`/ai-agent/logs?limit=${limit}`);

// ---- Omnichannel Gateway & AI Hub (WhatsApp, Telegram, Gmail, Web) ----
export const getOmnichannelStatus = () => apiFetch('/omnichannel/status');

export const getOmnichannelSettings = () => apiFetch('/omnichannel/settings');

export const updateOmnichannelSettings = (payload) =>
  apiFetch('/omnichannel/settings', { method: 'PUT', body: payload });

export const sendOmnichannelTestDispatch = (channel, target, message) =>
  apiFetch('/omnichannel/test-dispatch', { method: 'POST', body: { channel, target, message } });

export const getOmnichannelLogs = (channel = 'all', limit = 50, verdict = 'all') => {
  let url = `/omnichannel/logs?channel=${encodeURIComponent(channel)}&limit=${limit}`;
  if (verdict && verdict !== 'all') {
    url += `&verdict=${encodeURIComponent(verdict)}`;
  }
  return apiFetch(url);
};

export const getWahaSessionStatus = () => apiFetch('/connectors/whatsapp/status');

export const relinkWahaSession = (session = null) =>
  apiFetch(`/connectors/whatsapp/relink${session ? `?session=${encodeURIComponent(session)}` : ''}`, { method: 'POST' });

export const sendWahaDirectWebhook = (phone, text) =>
  apiFetch('/connectors/whatsapp/webhook', {
    method: 'POST',
    body: {
      event: 'message',
      payload: {
        from: phone.includes('@') ? phone : `${phone}@c.us`,
        body: text
      }
    }
  });

export const chatWithAiAgent = (message, channel = 'web', phone = null) =>
  apiFetch('/agent/chat', { method: 'POST', body: { message, channel, phone } });

export const getWhatsappAiSummary = (timeframe = 'day', startDate = null, endDate = null) => {
  let url = `/ai-agent/summary?timeframe=${encodeURIComponent(timeframe)}`;
  if (startDate && endDate) {
    url += `&start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}`;
  }
  return apiFetch(url);
};

// ---- Booking, Queue, Control & Patient Directory ----
export const getLocalTodayISO = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getTodayQueue = (targetDate = '') => {
  const dateParam = targetDate || getLocalTodayISO();
  return apiFetch(`/booking/queue/today?target_date=${encodeURIComponent(dateParam)}`);
};

export const getAppointments = (params = {}) => {
  const queryParts = [];
  if (params.status && params.status !== 'ALL') queryParts.push(`status=${encodeURIComponent(params.status)}`);
  if (params.doctor_name && params.doctor_name !== 'ALL') queryParts.push(`doctor_name=${encodeURIComponent(params.doctor_name)}`);
  if (params.date_filter) queryParts.push(`date_filter=${encodeURIComponent(params.date_filter)}`);
  if (params.is_control !== undefined && params.is_control !== null) queryParts.push(`is_control=${params.is_control}`);
  const clientDate = params.client_date || getLocalTodayISO();
  queryParts.push(`client_date=${encodeURIComponent(clientDate)}`);
  const qs = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
  return apiFetch(`/booking/appointments${qs}`);
};

export const updateAppointmentStatus = (appointmentId, status, notes = '') =>
  apiFetch(`/booking/appointments/${appointmentId}/status`, {
    method: 'PATCH',
    body: { status, notes }
  });

export const updateAppointmentDetails = (appointmentId, payload) =>
  apiFetch(`/booking/appointments/${appointmentId}`, {
    method: 'PUT',
    body: payload
  });

export const deleteAppointment = (appointmentId) =>
  apiFetch(`/booking/appointments/${appointmentId}`, {
    method: 'DELETE'
  });

export const getPatientsDirectory = (query = '', limit = 100) => {
  const q = query ? `?q=${encodeURIComponent(query)}&limit=${limit}` : `?limit=${limit}`;
  return apiFetch(`/booking/patients${q}`);
};

export const checkInKiosk = (portalToken) =>
  apiFetch('/booking/checkin', {
    method: 'POST',
    body: { portal_token: portalToken }
  });

// ---- Queue & Practice Schedule APIs ----
export const getRawatJalanQueue = (targetDate = '') => {
  const qs = targetDate ? `?target_date=${encodeURIComponent(targetDate)}` : '';
  return apiFetch(`/booking/queue/rawat-jalan${qs}`, { auth: false });
};

export const getRawatInapQueue = () =>
  apiFetch('/booking/queue/rawat-inap', { auth: false });

export const getDoctorSchedules = () =>
  apiFetch('/booking/schedules/doctors', { auth: false });

export const lookupQueueByRM = (medicalRecordNo, queueType = 'all') => {
  const qs = `?rm=${encodeURIComponent(medicalRecordNo)}&type=${encodeURIComponent(queueType)}`;
  return apiFetch(`/booking/queue/lookup${qs}`, { auth: false });
};

// ---- Model Management & Token Tracker ----
export const getActiveModelSettings = () => apiFetch('/models/active');

export const switchActiveModel = (provider, model) =>
  apiFetch('/models/switch', { method: 'POST', body: { provider, model } });

export const getModelTokenUsage = ({ client_type = '', model = '', search = '', limit = 100 } = {}) => {
  const params = new URLSearchParams();
  if (client_type && client_type !== 'all') params.append('client_type', client_type);
  if (model && model !== 'all') params.append('model', model);
  if (search) params.append('search', search);
  if (limit) params.append('limit', limit);
  const qs = params.toString();
  return apiFetch(`/models/token-usage${qs ? `?${qs}` : ''}`);
};

// ---- Healthcare Data Science Analytics ----
export const getAnalyticsSummary = (timeframe = 'today', startDate, endDate) => {
  const params = new URLSearchParams({ timeframe });
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);
  return apiFetch(`/analytics/summary?${params.toString()}`);
};

export const getDiseaseSurveillance = (timeframe = 'today', startDate, endDate) => {
  const params = new URLSearchParams({ timeframe });
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);
  return apiFetch(`/analytics/disease-surveillance?${params.toString()}`);
};

export const getPayerMix = (timeframe = 'today', startDate, endDate) => {
  const params = new URLSearchParams({ timeframe });
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);
  return apiFetch(`/analytics/payer-mix?${params.toString()}`);
};

export const getDepartmentMetrics = (timeframe = 'today', startDate, endDate) => {
  const params = new URLSearchParams({ timeframe });
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);
  return apiFetch(`/analytics/departments?${params.toString()}`);
};

export const getFullAnalytics = (timeframe = 'today', startDate, endDate) => {
  const params = new URLSearchParams({ timeframe });
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);
  return apiFetch(`/analytics/full?${params.toString()}`);
};

// Finance health, reconciliation, and margin intelligence
export const getFinanceOverview = () => apiFetch('/finance/overview');

export const reconcileEncounter = (payload) =>
  apiFetch('/finance/reconcile', { method: 'POST', body: payload });

export const getDepartmentalMargins = () => apiFetch('/finance/margins/departments');

export const detectFinanceLeakages = () =>
  apiFetch('/finance/leakage/detect', { method: 'POST' });

export const getCashflowForecast = () => apiFetch('/finance/forecast');

// Healthcare research copilot and literature synthesis
export const submitResearchTask = (payload) =>
  apiFetch('/research/tasks', { method: 'POST', body: payload });

export const getResearchTaskStatus = (taskId) =>
  apiFetch(`/research/tasks/${taskId}`);

export const analyzeMedicalVision = (payload) =>
  apiFetch('/research/vision/analyze', { method: 'POST', body: payload });

export const searchPubMedLiterature = (query, maxResults = 5) =>
  apiFetch('/research/literature/search', {
    method: 'POST',
    body: { query, max_results: maxResults }
  });

export const correlateMultimodalFindings = (payload) =>
  apiFetch('/research/multimodal/correlate', { method: 'POST', body: payload });

export const draftCareCaseReport = (payload) =>
  apiFetch('/research/case-report/draft', { method: 'POST', body: payload });

// Helpdesk ticket escalation and chatbot feedback
export const escalateToHuman = (payload) =>
  apiFetch('/helpdesk/escalate', { method: 'POST', body: payload });

export const listEscalationTickets = (status = null) => {
  const qs = status ? `?status=${encodeURIComponent(status)}` : '';
  return apiFetch(`/helpdesk/tickets${qs}`);
};

export const assignEscalationTicket = (ticketId, staffId, staffName) =>
  apiFetch(`/helpdesk/tickets/${ticketId}/assign`, {
    method: 'PATCH',
    body: { staff_id: staffId, staff_name: staffName }
  });

export const resolveEscalationTicket = (ticketId, resolutionNotes) =>
  apiFetch(`/helpdesk/tickets/${ticketId}/resolve`, {
    method: 'POST',
    body: { resolution_notes: resolutionNotes }
  });

export const sendChatbotFeedback = (payload) =>
  apiFetch('/chatbot/feedback', { method: 'POST', body: payload });





