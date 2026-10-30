/**
 * SafarSathi - Centralized API Service
 * Handles base URL configuration, Bearer token injection, and structured endpoints.
 */

// Determine API Base URL
export const API_BASE_URL = (function() {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== 'undefined' && window.location) {
    if (window.location.protocol.startsWith('http')) {
      // In production or subfolder deployment on Hostinger
      if (window.location.pathname.includes('/frontend/')) {
        const base = window.location.pathname.split('/frontend/')[0];
        return window.location.origin + base + '/api';
      }
      return window.location.origin + '/api';
    }
  }
  return '/api';
})();

/**
 * Core HTTP Request Wrapper
 */
async function request(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(options.headers || {})
  };

  // Inject Bearer token if available
  const token = localStorage.getItem('safarsathi_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, config);
    let data;
    try {
      data = await response.json();
    } catch (e) {
      data = { message: 'Non-JSON server response' };
    }

    if (!response.ok) {
      const errorMsg = data.message || data.error || `HTTP ${response.status} Request Failed`;
      const error = new Error(errorMsg);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    console.error(`API Error on [${options.method || 'GET'} ${endpoint}]:`, err);
    throw err;
  }
}

export const api = {
  // Auth API
  auth: {
    login: (credentials) => request('/auth/login', { method: 'POST', body: credentials }),
    register: (userData) => request('/auth/register', { method: 'POST', body: userData }),
    me: () => request('/auth/me', { method: 'GET' }),
    logout: () => request('/auth/logout', { method: 'POST' })
  },

  // Buses & Routes API
  buses: {
    search: (params = {}) => {
      const query = new URLSearchParams();
      if (params.from) query.set('from', params.from);
      if (params.to) query.set('to', params.to);
      if (params.date) query.set('date', params.date);
      if (params.busType && params.busType !== 'All') query.set('busType', params.busType);
      if (params.maxPrice) query.set('maxPrice', params.maxPrice);
      return request(`/buses?${query.toString()}`);
    },
    getById: (id) => request(`/buses/${id}`),
    getPopularRoutes: () => request('/buses/popular-routes')
  },

  // Seats & Concurrency API
  seats: {
    getBookedSeats: (busId, date, holdToken = '') => {
      return request(`/booked-seats?busId=${busId}&date=${date}${holdToken ? `&hold_token=${holdToken}` : ''}`);
    },
    holdSeats: (data) => request('/seats/hold', { method: 'POST', body: data })
  },

  // Bookings API
  bookings: {
    create: (bookingData) => request('/bookings', { method: 'POST', body: bookingData }),
    getMyBookings: (email = '') => request(`/my-bookings${email ? `?email=${encodeURIComponent(email)}` : ''}`),
    getByPnr: (pnr) => request(`/bookings/${pnr}`),
    cancel: (pnr) => request('/cancel-booking', { method: 'POST', body: { pnr } }),
    getAll: () => request('/bookings')
  },

  // Coupons API
  coupons: {
    getAll: () => request('/coupons'),
    apply: (code, totalFare) => request('/coupons/apply', { method: 'POST', body: { code, total_fare: totalFare } })
  },

  // Operators API
  operators: {
    register: (data) => request('/operators', { method: 'POST', body: data }),
    getAll: () => request('/operators'),
    delete: (id) => request(`/operators/${id}`, { method: 'DELETE' })
  },

  // Agents API
  agents: {
    register: (data) => request('/agents', { method: 'POST', body: data }),
    getAll: () => request('/agents'),
    delete: (id) => request(`/agents/${id}`, { method: 'DELETE' })
  },

  // Ratings & Reviews API
  reviews: {
    submit: (data) => request('/reviews', { method: 'POST', body: data }),
    get: (busId) => request(`/reviews${busId ? `?busId=${busId}` : ''}`)
  },

  // Admin Dashboard API
  admin: {
    getStats: () => request('/admin/stats'),
    getUsers: () => request('/admin/users'),
    deleteUser: (id) => request(`/admin/users/${id}`, { method: 'DELETE' }),
    addBus: (busData) => request('/admin/add-bus', { method: 'POST', body: busData }),
    updateBus: (id, busData) => request(`/admin/update-bus/${id}`, { method: 'POST', body: busData }),
    deleteBus: (id) => request(`/admin/delete-bus/${id}`, { method: 'DELETE' })
  },

  // Conductor Portal API
  conductor: {
    login: (credentials) => request('/conductor/login', { method: 'POST', body: credentials }),
    getBuses: () => request('/conductor/manifest'),
    getManifest: (busId, date = 'ALL') => request(`/conductor/manifest?bus_id=${busId}&date=${encodeURIComponent(date)}`),
    updateBoarding: (pnr, boardingStatus) => request('/conductor/board', { method: 'POST', body: { pnr, boarding_status: boardingStatus } })
  }
};

export default api;

