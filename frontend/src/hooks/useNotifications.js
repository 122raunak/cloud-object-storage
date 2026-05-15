import { useState, useCallback } from 'react'
import { notificationsApi } from '../api/notifications.api.js'

export function useNotifications(userId) {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [preferences, setPreferences] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({ page: 1, total: 0 })

  const fetchNotifications = useCallback(async (params = {}) => {
    if (!userId) return
    setLoading(true)
    setError(null)
    try {
      const res = await notificationsApi.getNotifications(userId, params)
      const d = res.data.data || res.data
      setNotifications(d.notifications || d || [])
      setPagination({ page: params.page || 1, total: d.total || 0 })
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }, [userId])

  const fetchUnreadCount = useCallback(async () => {
    if (!userId) return
    try {
      const res = await notificationsApi.getUnreadCount(userId)
      const d = res.data.data || res.data
      setUnreadCount(d.count ?? d.unreadCount ?? d ?? 0)
    } catch { /* silent */ }
  }, [userId])

  const fetchPreferences = useCallback(async () => {
    if (!userId) return
    const res = await notificationsApi.getPreferences(userId)
    setPreferences(res.data.data || res.data)
  }, [userId])

  const savePreferences = useCallback(async (data) => {
    if (!userId) return
    const res = await notificationsApi.updatePreferences(userId, data)
    setPreferences(res.data.data || res.data)
  }, [userId])

  return {
    notifications, unreadCount, preferences, loading, error, pagination,
    fetchNotifications, fetchUnreadCount, fetchPreferences, savePreferences,
  }
}