const API_BASE = '/api';

export function getStoredToken() {
  return localStorage.getItem('medibridge_token');
}

export function setStoredToken(token) {
  if (token) {
    localStorage.setItem('medibridge_token', token);
  } else {
    localStorage.removeItem('medibridge_token');
  }
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem('medibridge_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user) {
  if (user) {
    localStorage.setItem('medibridge_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('medibridge_user');
  }
}

export async function apiFetch(endpoint, options = {}) {
  const token = getStoredToken();
  const headers = { ...options.headers };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // If not FormData, default to application/json
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorDetail = 'An error occurred';
    try {
      const errText = await res.text();
      try {
        const errJson = JSON.parse(errText);
        errorDetail = errJson.detail || errJson.message || JSON.stringify(errJson);
      } catch {
        errorDetail = errText;
      }
    } catch {
      // body unreadable, keep default message
    }
    throw new Error(errorDetail || `HTTP error ${res.status}`);
  }

  return res.json();
}

// 1. Auth API
export const authApi = {
  login: async (email, password) => {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setStoredToken(data.access_token);
    setStoredUser(data.user);
    return data;
  },
  register: async (payload) => {
    const data = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setStoredToken(data.access_token);
    setStoredUser(data.user);
    return data;
  },
  getMe: async () => {
    return apiFetch('/auth/me');
  },
  logout: () => {
    setStoredToken(null);
    setStoredUser(null);
  }
};

// 2. Patient API
export const patientApi = {
  getProfile: (patientId) => {
    const url = patientId ? `/patients/profile?patient_id=${patientId}` : '/patients/profile';
    return apiFetch(url);
  },
  updateProfile: (profileData) => {
    return apiFetch('/patients/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },
  getTimeline: (patientId) => {
    const url = patientId ? `/patients/timeline?patient_id=${patientId}` : '/patients/timeline';
    return apiFetch(url);
  },
  getFamilyShares: () => apiFetch('/patients/family'),
  addFamilyShare: (data) => apiFetch('/patients/family', { method: 'POST', body: JSON.stringify(data) }),
  revokeFamilyShare: (id) => apiFetch(`/patients/family/${id}`, { method: 'DELETE' }),
};

// 3. Reports & AI Explainer API
export const reportApi = {
  getReports: (patientId) => {
    const url = patientId ? `/reports/?patient_id=${patientId}` : '/reports/';
    return apiFetch(url);
  },
  getReportDetails: (id) => apiFetch(`/reports/${id}`),
  compareReports: (id1, id2) => apiFetch(`/reports/compare/${id1}/${id2}`),
  uploadReport: (formData) => {
    return apiFetch('/reports/upload', {
      method: 'POST',
      body: formData, // FormData automatically handles multipart/form-data
    });
  }
};

// 4. Appointments API
export const appointmentApi = {
  getAppointments: () => apiFetch('/appointments/'),
  bookAppointment: (data) => apiFetch('/appointments/', { method: 'POST', body: JSON.stringify(data) }),
  updateStatus: (id, status) => apiFetch(`/appointments/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
};

// 5. Doctor API
export const doctorApi = {
  getPatients: () => apiFetch('/doctors/patients'),
  getPatientRecords: (patientId) => apiFetch(`/doctors/patients/${patientId}/records`),
  createConsultation: (data) => apiFetch('/doctors/consultations', { method: 'POST', body: JSON.stringify(data) }),
  approveConsultation: (id, data) => apiFetch(`/doctors/consultations/${id}/approve`, { method: 'POST', body: JSON.stringify(data) }),
  getFollowUps: () => apiFetch('/doctors/follow-ups'),
};

// 6. Admin API
export const adminApi = {
  getPatients: () => apiFetch('/admin/patients'),
  getDoctors: () => apiFetch('/admin/doctors'),
  createDoctor: (data) => apiFetch('/admin/doctors', { method: 'POST', body: JSON.stringify(data) }),
  getQueue: () => apiFetch('/admin/queue'),
  updateQueueStatus: (id, status) => apiFetch(`/admin/queue/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  getReferrals: () => apiFetch('/admin/referrals'),
  createReferral: (data) => apiFetch('/admin/referrals', { method: 'POST', body: JSON.stringify(data) }),
  getAnalytics: () => apiFetch('/admin/analytics'),
};

