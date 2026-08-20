const API_BASE = '/api';

function getHeaders(isMultipart = false) {
  const token = localStorage.getItem('alshafay_token');
  const headers = {};
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function request(endpoint, options = {}, isMultipart = false) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    ...options,
    headers: {
      ...getHeaders(isMultipart),
      ...(options.headers || {})
    }
  };

  try {
    const res = await fetch(url, config);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || `Request failed with status ${res.status}`);
    }
    return data;
  } catch (err) {
    console.error(`API error on ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  // Auth & Staff Management
  login: (username, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  demoLogin: (role, doctorId) => request('/auth/demo-login', { method: 'POST', body: JSON.stringify({ role, doctorId }) }),
  getMe: () => request('/auth/me'),
  getUsers: () => request('/auth/users'),
  addUser: (userData) => request('/auth/users', { method: 'POST', body: JSON.stringify(userData) }),
  updateUser: (id, userData) => request(`/auth/users/${id}`, { method: 'PUT', body: JSON.stringify(userData) }),
  updateUserStatus: (id, active) => request(`/auth/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ active }) }),
  deleteUser: (id) => request(`/auth/users/${id}`, { method: 'DELETE' }),

  // Meta & Doctors Management
  getHospitalInfo: () => request('/meta/hospital-info'),
  getDepartments: () => request('/meta/departments'),
  getDoctors: (deptId, onlyAvailable = false) => {
    const params = new URLSearchParams();
    if (deptId) params.append('departmentId', deptId);
    if (onlyAvailable) params.append('onlyAvailable', 'true');
    const qs = params.toString();
    return request(`/meta/doctors${qs ? `?${qs}` : ''}`);
  },
  addDoctor: (doc) => request('/meta/doctors', { method: 'POST', body: JSON.stringify(doc) }),
  updateDoctor: (id, doc) => request(`/meta/doctors/${id}`, { method: 'PUT', body: JSON.stringify(doc) }),
  updateDoctorStatus: (id, status) => request(`/meta/doctors/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  deleteDoctor: (id) => request(`/meta/doctors/${id}`, { method: 'DELETE' }),
  updateDoctorProfile: (profileData) => request('/meta/doctor-profile', { method: 'PUT', body: JSON.stringify(profileData) }),

  // Patients
  searchPatients: (q) => request(`/patients/search${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  getPatientEmr: (id) => request(`/patients/${id}/emr`),
  registerPatient: (patient) => request('/patients/register', { method: 'POST', body: JSON.stringify(patient) }),

  // Queue
  getQueue: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/queue${qs ? `?${qs}` : ''}`);
  },
  generateToken: (data) => request('/queue/generate', { method: 'POST', body: JSON.stringify(data) }),
  updateTokenStatus: (id, status, doctorId) => request(`/queue/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, doctorId }) }),
  referPatient: (id, toDoctorId, notes) => request(`/queue/${id}/refer`, { method: 'POST', body: JSON.stringify({ toDoctorId, notes }) }),
  forwardReferredPatient: (id, priority) => request(`/queue/${id}/reception-forward`, { method: 'POST', body: JSON.stringify({ priority }) }),
  getLiveDisplay: () => request('/queue/live-display'),

  // Appointments
  bookAppointment: (data) => request('/appointments/book', { method: 'POST', body: JSON.stringify(data) }),
  trackAppointment: (q) => request(`/appointments/track?q=${encodeURIComponent(q)}`),
  getAppointments: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/appointments${qs ? `?${qs}` : ''}`);
  },

  // Prescriptions
  createPrescription: (data) => request('/prescriptions', { method: 'POST', body: JSON.stringify(data) }),
  getPrescriptions: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/prescriptions${qs ? `?${qs}` : ''}`);
  },
  getPrescriptionById: (id) => request(`/prescriptions/${id}`),

  // Laboratory & Radiology
  getLabCatalog: () => request('/lab/catalog'),
  getLabOrders: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/lab/orders${qs ? `?${qs}` : ''}`);
  },
  uploadScan: async (formDataOrBase64) => {
    if (formDataOrBase64 instanceof FormData) {
      return request('/lab/upload-scan', { method: 'POST', body: formDataOrBase64 }, true);
    }
    return request('/lab/upload-scan', { method: 'POST', body: JSON.stringify({ base64Data: formDataOrBase64 }) });
  },
  updateLabOrderStatus: (id, status, specimenBarcode) => request(`/lab/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, specimenBarcode }) }),
  submitLabResults: (id, results) => request(`/lab/orders/${id}/results`, { method: 'POST', body: JSON.stringify(results) }),
  getLabOrderById: (id) => request(`/lab/orders/${id}`),

  // Pharmacy
  getInventory: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/pharmacy/inventory${qs ? `?${qs}` : ''}`);
  },
  addMedicine: (med) => request('/pharmacy/medicines', { method: 'POST', body: JSON.stringify(med) }),
  updateMedicineStock: (id, delta) => request(`/pharmacy/medicines/${id}/stock`, { method: 'PATCH', body: JSON.stringify({ delta }) }),
  dispensePrescription: (data) => request('/pharmacy/dispense', { method: 'POST', body: JSON.stringify(data) }),
  getPendingPrescriptions: () => request('/pharmacy/pending-prescriptions'),
  getInvoices: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/pharmacy/invoices${qs ? `?${qs}` : ''}`);
  },

  // Analytics
  getAnalyticsOverview: () => request('/analytics/overview')
};
