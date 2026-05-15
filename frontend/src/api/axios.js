import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
})

let accessToken = null

export const setAccessToken = (token) => { accessToken = token }
export const getAccessToken = () => accessToken
export const clearAccessToken = () => { accessToken = null }

// Request interceptor — attach Bearer token
api.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor — handle 401 / token refresh
let isRefreshing = false
let refreshSubscribers = []

const subscribeTokenRefresh = (cb) => refreshSubscribers.push(cb)
const onRefreshed = (token) => {
  refreshSubscribers.forEach((cb) => cb(token))
  refreshSubscribers = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (
      error.response?.status === 429 ||
      error.response?.status !== 401 ||
      originalRequest._retry ||
      originalRequest.url?.includes('/refresh-token') ||
      originalRequest.url?.includes('/login')
    ) {
      return Promise.reject(error)
    }

    if (isRefreshing) {
      // Queue this request until token is refreshed
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh((token) => {
          if (token) {
            originalRequest.headers.Authorization = `Bearer ${token}`
            resolve(api(originalRequest))
          } else {
            reject(error)
          }
        })
      })
    }

    originalRequest._retry = true
    isRefreshing = true

    try {
      const res = await axios.post(
        `${BASE_URL}/api/auth/refresh-token`,
        {},
        { withCredentials: true }
      )
      const newToken = res.data.data?.accessToken
      if (!newToken) throw new Error('No token in refresh response')
      
      setAccessToken(newToken)
      onRefreshed(newToken)
      originalRequest.headers.Authorization = `Bearer ${newToken}`
      return api(originalRequest)
    } catch (refreshError) {
      // Refresh failed — clear everything and redirect to login
      clearAccessToken()
      refreshSubscribers = []
      isRefreshing = false
      onRefreshed(null) // reject all queued requests
      window.location.href = '/login'
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)

export default api