import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth.js'
import { useNotifications } from '../../hooks/useNotifications.js'
import { notificationsApi } from '../../api/notifications.api.js'
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'
import Badge from '../../components/common/Badge.jsx'
import { formatDateTime } from '../../utils/formatDate.js'

const TYPE_OPTIONS = [
  { label: 'All Types', value: '' },
  { label: 'Invoice', value: 'invoice_generated' },
  { label: 'Budget Alert', value: 'budget_alert' },
  { label: 'Storage Warning', value: 'storage_warning' },
  { label: 'Login Alert', value: 'login_alert' },
  { label: 'Daily Digest', value: 'daily_digest' },
  { label: 'Weekly Report', value: 'weekly_report' },
]

const STATUS_OPTIONS = [
  { label: 'All Status', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'Sent', value: 'sent' },
  { label: 'Failed', value: 'failed' },
]

const TYPE_VARIANT = {
  invoice_generated: 'info',
  budget_alert: 'danger',
  storage_warning: 'warning',
  login_alert: 'warning',
  daily_digest: 'muted',
  weekly_report: 'muted',
}

export default function NotificationsPage() {
  const { user, fetchUnreadCount } = useAuth()
  const { notifications, loading, error, pagination, fetchNotifications } = useNotifications(user?._id)
  const [type, setType] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [localNotifs, setLocalNotifs] = useState([])
  const [markingAll, setMarkingAll] = useState(false)

  useEffect(() => {
    fetchNotifications({ page, limit: 20, type: type || undefined, status: status || undefined })
  }, [page, type, status])

  useEffect(() => {
    setLocalNotifs(notifications)
  }, [notifications])

  const handleMarkRead = async (notifId) => {
    try {
      await notificationsApi.markRead(user._id, notifId)
      setLocalNotifs(prev => prev.map(n =>
        (n._id || n.id) === notifId ? { ...n, read: true } : n
      ))
      fetchUnreadCount(user._id)
    } catch { }
  }

  const handleMarkAllRead = async () => {
    setMarkingAll(true)
    try {
      await notificationsApi.markAllRead(user._id)
      setLocalNotifs(prev => prev.map(n => ({ ...n, read: true })))
      fetchUnreadCount(user._id)
    } catch { } finally {
      setMarkingAll(false)
    }
  }

  const unreadCount = localNotifs.filter(n => !n.read).length
  const totalPages = Math.ceil(pagination.total / 20) || 1

  const getStatusColor = (s) => {
    if (s === 'sent') return 'success'
    if (s === 'failed') return 'danger'
    return 'warning'
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">Notifications</div>
          <div className="page-subtitle">{pagination.total} total · {unreadCount} unread</div>
        </div>
        {unreadCount > 0 && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleMarkAllRead}
            disabled={markingAll}
          >
            {markingAll ? '...' : `✓ Mark all ${unreadCount} as read`}
          </button>
        )}
      </div>

      <div className="toolbar">
        <select className="form-select" style={{ width: 160 }} value={type} onChange={(e) => { setType(e.target.value); setPage(1) }}>
          {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select className="form-select" style={{ width: 140 }} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
          {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : localNotifs.length === 0 ? (
        <div className="empty-state">
          <svg className="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <div className="empty-state-title">No notifications</div>
          <div className="empty-state-desc">You're all caught up!</div>
        </div>
      ) : (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          {localNotifs.map((n) => {
            const id = n._id || n.id
            const isUnread = !n.read
            return (
              <div
                key={id}
                onClick={() => isUnread && handleMarkRead(id)}
                style={{
                  borderBottom: '1px solid var(--border)',
                  padding: '14px 16px',
                  display: 'flex', gap: 10, alignItems: 'flex-start',
                  background: isUnread ? 'var(--bg-elevated)' : 'transparent',
                  cursor: isUnread ? 'pointer' : 'default',
                  transition: 'background 0.2s',
                }}
              >
                <div style={{
                  marginTop: 6, width: 8, height: 8, borderRadius: '50%',
                  background: isUnread ? 'var(--accent)' : 'transparent',
                  border: isUnread ? 'none' : '1px solid var(--border)',
                  flexShrink: 0
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <div style={{ fontWeight: isUnread ? 600 : 400, fontSize: 14, color: isUnread ? 'var(--text)' : 'var(--text-muted)' }}>
                      {n.subject || n.title || 'Notification'}
                    </div>
                    {isUnread && (
                      <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700, background: 'var(--bg-elevated)', padding: '2px 8px', borderRadius: 20, border: '1px solid var(--accent)' }}>
                        NEW
                      </span>
                    )}
                  </div>
                  {n.body && (
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>{n.body}</div>
                  )}
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Badge variant={TYPE_VARIANT[n.type] || 'muted'}>
                      {(n.type || '').replace(/_/g, ' ')}
                    </Badge>
                    <Badge variant={getStatusColor(n.status)}>
                      {n.status || 'pending'}
                    </Badge>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {formatDateTime(n.createdAt || n.sentAt)}
                    </span>
                    {isUnread && (
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        Click to mark as read
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {!loading && totalPages > 1 && (
        <div className="pagination">
          <span className="pagination-info">Page {page} of {totalPages}</span>
          <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>‹</button>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)', padding: '0 8px' }}>{page}</span>
          <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}>›</button>
        </div>
      )}
    </div>
  )
}