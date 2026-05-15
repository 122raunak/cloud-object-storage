import api from './axios.js'

export const notificationsApi = {
  getNotifications: (userId, params) => api.get(`/api/notifications/${userId}`, { params }),
  getUnreadCount: (userId) => api.get(`/api/notifications/${userId}/unread-count`, { params: { _t: Date.now() } }),
  getPreferences: (userId) => api.get(`/api/notifications/${userId}/preferences`),
  updatePreferences: (userId, data) => api.put(`/api/notifications/${userId}/preferences`, data),
}