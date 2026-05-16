import api from './axios.js'

export const billingApi = {
  getPlans:           ()                  => api.get('/api/billing/plans', { params: { _t: Date.now() } }),
  getInvoices:        (userId, params)    => api.get(`/api/billing/invoices/${userId}`, { params: { ...params, _t: Date.now() } }),
  getInvoice:         (userId, invoiceId) => api.get(`/api/billing/invoices/${userId}/${invoiceId}`),
  getCurrentEstimate: (userId)            => api.get(`/api/billing/current/${userId}`, { params: { _t: Date.now() } }),
  getEstimate:        (userId)            => api.get(`/api/billing/current/${userId}`, { params: { _t: Date.now() } }),
  assignPlan: (userId, tierId) => api.put(`/api/billing/plans/${userId}`, { tierId }),
  generateInvoice:    (userId, year, month) => api.post(`/api/billing/generate/${userId}`, { year, month }),
}