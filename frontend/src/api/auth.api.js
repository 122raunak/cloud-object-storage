import api from './axios.js'

export const authApi = {
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
  logout: () => api.post('/api/auth/logout'),
  me: () => api.get('/api/auth/me'),
  refreshToken: () => api.post('/api/auth/refresh-token'),
  changePassword: (data) => api.patch('/api/auth/change-password', data),
  getAllUsers: () => api.get('/api/auth/all-users'),
  changeRole: (userId, role) => api.patch(`/api/auth/change-role/${userId}`, { role }),
  suspendUser:   (userId, reason) => api.patch(`/api/auth/suspend/${userId}`, { reason }),
  unsuspendUser: (userId)         => api.patch(`/api/auth/unsuspend/${userId}`),
  deleteUser:    (userId)         => api.delete(`/api/auth/delete-user/${userId}`),
}