import api from './axios.js'

export const meteringApi = {
  getUsage: (userId) => api.get(`/api/metering/usage/${userId}`, { params: { _t: Date.now() } }),
  getDailyUsage: (userId, params) => api.get(`/api/metering/usage/${userId}/daily`, { params: { ...params, _t: Date.now() } }),
  getMonthlyUsage: (userId, params) => api.get(`/api/metering/usage/${userId}/monthly`, { params: { ...params, _t: Date.now() } }),
  getEvents: (userId, params) => api.get(`/api/metering/events/${userId}`, { params }),
}