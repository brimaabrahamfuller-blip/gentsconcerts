const API_BASE = "https://gentsconcerts-backend.onrender.com/api"; // Points to live Render backend
const api = {
  // Auth
  register: (data) => fetch(`${API_BASE}/auth/register`, {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(data)}),
  login: (data) => fetch(`${API_BASE}/auth/login`, {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(data)}),

  // Events
  getEvents: () => fetch(`${API_BASE}/events`),
  getEvent: (id) => fetch(`${API_BASE}/events/${id}`),
  createEvent: (data, token) => fetch(`${API_BASE}/events`, {method:"POST", headers:{"Authorization":`Bearer ${token}`}, body:data}),

  // Tickets
  // purchaseTicket and confirmPayment are now handled directly by payment.html and backend/routes/payments.js
  verifyTicket: (qrCode) => fetch(`${API_BASE}/tickets/verify/${qrCode}`),

  // User
  getMyTickets: (token) => fetch(`${API_BASE}/users/my-tickets`, {headers:{"Authorization":`Bearer ${token}`}}),
  getProfile: (token) => fetch(`${API_BASE}/users/profile`, {headers:{"Authorization":`Bearer ${token}`}}),
}

// Add to window for global access
window.gentsApi = api;
