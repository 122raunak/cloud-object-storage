import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth.js'
import { authApi } from '../../api/auth.api.js'
import { meteringApi } from '../../api/metering.api.js'
import { billingApi } from '../../api/billing.api.js'
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'
import Badge from '../../components/common/Badge.jsx'
import { formatDate } from '../../utils/formatDate.js'
import { formatBytes } from '../../utils/formatBytes.js'
import { formatCurrency } from '../../utils/formatCurrency.js'
import { useNavigate } from 'react-router-dom'

export default function AdminPage() {
  const { isAdmin, user: currentUser } = useAuth()
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [roleLoading, setRoleLoading] = useState({})
  const [actionLoading, setActionLoading] = useState({})
  const [msg, setMsg] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [userStats, setUserStats] = useState(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [planLoading, setPlanLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [showSuspendModal, setShowSuspendModal] = useState(null)
  const [suspendReason, setSuspendReason] = useState('')
  const [invoiceMonth, setInvoiceMonth] = useState('')
  const [invoiceLoading, setInvoiceLoading] = useState(false)

  const handleGenerateInvoice = async (userId) => {
    if (!invoiceMonth) return
    const [year, month] = invoiceMonth.split('-').map(Number)
    setInvoiceLoading(true)
    try {
      await billingApi.generateInvoice(userId, year, month)
      showMsg(`Invoice generated for ${invoiceMonth}`)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate invoice')
    } finally {
      setInvoiceLoading(false)
    }
  }

  useEffect(() => {
    if (!isAdmin) { navigate('/dashboard'); return }
    load()
  }, [isAdmin])

  async function load() {
    setLoading(true)
    setError('')
    try {
      const [usersRes, plansRes] = await Promise.allSettled([
        authApi.getAllUsers(),
        billingApi.getPlans(),
      ])
      if (usersRes.status === 'fulfilled') {
        const d = usersRes.value.data.data || usersRes.value.data
        setUsers(d.users || d || [])
      }
      if (plansRes.status === 'fulfilled') {
        const d = plansRes.value.data.data || plansRes.value.data
        const allPlans = Array.isArray(d) ? d : []
        const seen = new Set()
        setPlans(allPlans.filter(p => {
          if (seen.has(p.name)) return false
          seen.add(p.name)
          return true
        }))
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const showMsg = (text) => {
    setMsg(text)
    setTimeout(() => setMsg(''), 3000)
  }

  const handleRoleChange = async (userId, newRole) => {
    setRoleLoading((r) => ({ ...r, [userId]: true }))
    try {
      await authApi.changeRole(userId, newRole)
      setUsers((us) => us.map((u) => u._id === userId ? { ...u, role: newRole } : u))
      showMsg('Role updated successfully')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change role')
    } finally {
      setRoleLoading((r) => ({ ...r, [userId]: false }))
    }
  }

  const handleSuspend = async () => {
    const userId = showSuspendModal
    setActionLoading((a) => ({ ...a, [userId + '_suspend']: true }))
    try {
      await authApi.suspendUser(userId, suspendReason)
      setUsers((us) => us.map((u) => u._id === userId ? { ...u, isSuspended: true, suspendReason } : u))
      showMsg('User suspended successfully')
      setShowSuspendModal(null)
      setSuspendReason('')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to suspend user')
    } finally {
      setActionLoading((a) => ({ ...a, [userId + '_suspend']: false }))
    }
  }

  const handleUnsuspend = async (userId) => {
    setActionLoading((a) => ({ ...a, [userId + '_unsuspend']: true }))
    try {
      await authApi.unsuspendUser(userId)
      setUsers((us) => us.map((u) => u._id === userId ? { ...u, isSuspended: false, suspendReason: null } : u))
      showMsg('User unsuspended successfully')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to unsuspend user')
    } finally {
      setActionLoading((a) => ({ ...a, [userId + '_unsuspend']: false }))
    }
  }

  const handleDelete = async (userId, username) => {
    if (!window.confirm(`Permanently delete user "${username}"? This cannot be undone.`)) return
    setActionLoading((a) => ({ ...a, [userId + '_delete']: true }))
    try {
      await authApi.deleteUser(userId)
      setUsers((us) => us.filter((u) => u._id !== userId))
      if (selectedUser?._id === userId) { setSelectedUser(null); setUserStats(null) }
      showMsg('User deleted successfully')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user')
    } finally {
      setActionLoading((a) => ({ ...a, [userId + '_delete']: false }))
    }
  }

  const handleViewUser = async (user) => {
    setSelectedUser(user)
    setStatsLoading(true)
    setUserStats(null)
    try {
      const [uRes, eRes] = await Promise.allSettled([
        meteringApi.getUsage(user._id),
        billingApi.getCurrentEstimate(user._id),
      ])
      setUserStats({
        usage: uRes.status === 'fulfilled' ? (uRes.value.data.data || uRes.value.data) : null,
        estimate: eRes.status === 'fulfilled' ? (eRes.value.data.data || eRes.value.data) : null,
      })
    } catch (err) {
      console.error('Failed to load user stats', err)
    } finally {
      setStatsLoading(false)
    }
  }

  const handleAssignPlan = async (userId, tierId) => {
    setPlanLoading(true)
    try {
      await billingApi.assignPlan(userId, tierId)
      showMsg('Plan assigned successfully')
      if (selectedUser) handleViewUser(selectedUser)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign plan')
    } finally {
      setPlanLoading(false)
    }
  }

  const totalUsers = users.length
  const adminCount = users.filter(u => u.role === 'ADMIN').length
  const userCount = users.filter(u => u.role === 'USER').length
  const suspendedCount = users.filter(u => u.isSuspended).length
  const newestUser = users.length > 0
    ? users.reduce((a, b) => new Date(a.createdAt) > new Date(b.createdAt) ? a : b)
    : null

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">User Management</div>
          <div className="page-subtitle">{totalUsers} registered users</div>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={load}>↻ Refresh</button>
      </div>

      {error && <ErrorMessage message={error} onRetry={load} />}
      {msg && <div className="success-msg" style={{ marginBottom: 16 }}>{msg}</div>}

      {/* System stats */}
      <div className="grid-4 mb-8">
        <div className="stat-card">
          <div className="stat-label">Total Users</div>
          <div className="stat-value">{totalUsers}</div>
          <div className="stat-sub">Registered accounts</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Admins</div>
          <div className="stat-value" style={{ color: 'var(--accent)' }}>{adminCount}</div>
          <div className="stat-sub">Admin accounts</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Suspended</div>
          <div className="stat-value" style={{ color: suspendedCount > 0 ? 'var(--danger, #e24b4a)' : undefined }}>
            {suspendedCount}
          </div>
          <div className="stat-sub">Suspended accounts</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Newest User</div>
          <div className="stat-value" style={{ fontSize: 14 }}>{newestUser?.username || '—'}</div>
          <div className="stat-sub">{newestUser ? formatDate(newestUser.createdAt) : '—'}</div>
        </div>
      </div>

      {/* Search */}
      <div className="toolbar" style={{ marginBottom: 16 }}>
        <div className="search-bar">
          <svg className="search-bar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by username or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {search && (
          <span style={{ fontSize: 13, color: 'var(--text-muted)', alignSelf: 'center' }}>
            {filteredUsers.length} of {totalUsers} users
          </span>
        )}
      </div>

      {/* Suspend reason modal */}
      {showSuspendModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ width: 400, padding: 24 }}>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 16 }}>Suspend User</div>
            <div className="form-group">
              <label className="form-label">Reason (optional)</label>
              <input
                className="form-input"
                placeholder="e.g. Violation of terms of service"
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
              <button className="btn btn-secondary" onClick={() => { setShowSuspendModal(null); setSuspendReason('') }}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleSuspend}>
                Suspend User
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created</th>
                <th>Change Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>
                    No users match your search
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const id = u._id || u.id
                  const isCurrentUser = currentUser?._id === id
                  return (
                    <tr key={id} style={{
                      background: selectedUser?._id === id ? 'var(--bg-elevated)' : undefined,
                      opacity: u.isSuspended ? 0.7 : 1
                    }}>
                      <td style={{ fontWeight: 600 }}>
                        {u.username}
                        {isCurrentUser && (
                          <span style={{ fontSize: 10, color: 'var(--accent)', marginLeft: 6 }}>YOU</span>
                        )}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
                        {u.email}
                      </td>
                      <td>
                        <Badge variant={u.role === 'ADMIN' ? 'accent' : 'muted'}>{u.role}</Badge>
                      </td>
                      <td>
                        {u.isSuspended
                          ? <Badge variant="danger">Suspended</Badge>
                          : <Badge variant="success">Active</Badge>
                        }
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{formatDate(u.createdAt)}</td>
                      <td>
                        <select
                          className="form-select"
                          style={{ width: 120, padding: '4px 10px', fontSize: 12 }}
                          value={u.role}
                          disabled={roleLoading[id] || isCurrentUser}
                          onChange={(e) => handleRoleChange(id, e.target.value)}
                        >
                          <option value="USER">USER</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleViewUser(u)}
                          >
                            View
                          </button>
                          {!isCurrentUser && u.role !== 'ADMIN' && (
                            <>
                              {u.isSuspended ? (
                                <button
                                  className="btn btn-secondary btn-sm"
                                  style={{ color: 'var(--color-text-success)' }}
                                  disabled={actionLoading[id + '_unsuspend']}
                                  onClick={() => handleUnsuspend(id)}
                                >
                                  {actionLoading[id + '_unsuspend'] ? '...' : 'Unsuspend'}
                                </button>
                              ) : (
                                <button
                                  className="btn btn-secondary btn-sm"
                                  style={{ color: 'var(--color-text-warning)' }}
                                  onClick={() => setShowSuspendModal(id)}
                                >
                                  Suspend
                                </button>
                              )}
                              <button
                                className="btn btn-danger btn-sm"
                                disabled={actionLoading[id + '_delete']}
                                onClick={() => handleDelete(id, u.username)}
                              >
                                {actionLoading[id + '_delete'] ? '...' : 'Delete'}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* User data panel */}
      {selectedUser && (
        <div className="card" style={{ marginTop: 24 }}>
          <div className="card-header" style={{ marginBottom: 16 }}>
            <div className="card-title">
              Data for {selectedUser.username}
              <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 8 }}>
                {selectedUser.email}
              </span>
              {selectedUser.isSuspended && (
                <Badge variant="danger" style={{ marginLeft: 8 }}>Suspended</Badge>
              )}
            </div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => { setSelectedUser(null); setUserStats(null) }}
            >
              Close
            </button>
          </div>

          {selectedUser.isSuspended && selectedUser.suspendReason && (
            <div style={{
              padding: '8px 12px', marginBottom: 16,
              background: 'var(--color-background-danger)',
              border: '1px solid var(--color-border-danger)',
              borderRadius: 8, fontSize: 13,
              color: 'var(--color-text-danger)'
            }}>
              Suspension reason: {selectedUser.suspendReason}
            </div>
          )}

          {statsLoading ? (
            <LoadingSpinner />
          ) : userStats ? (
            <>
              <div className="grid-4" style={{ marginBottom: 20 }}>
                <div className="stat-card">
                  <div className="stat-label">Storage Used</div>
                  <div className="stat-value">
                    {formatBytes(Number(userStats.usage?.monthly?.storage_used) || 0)}
                  </div>
                  <div className="stat-sub">This month</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Bytes Uploaded</div>
                  <div className="stat-value">
                    {formatBytes(Number(userStats.usage?.monthly?.bytes_uploaded) || 0)}
                  </div>
                  <div className="stat-sub">This month</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">API Calls</div>
                  <div className="stat-value">
                    {Number(userStats.usage?.monthly?.api_calls || 0).toLocaleString()}
                  </div>
                  <div className="stat-sub">This month</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Month Estimate</div>
                  <div className="stat-value">
                    {formatCurrency(userStats.estimate?.charges?.total_amount || 0)}
                  </div>
                  <div className="stat-sub">{userStats.estimate?.tier?.name || '—'} plan</div>
                </div>
              </div>

              {plans.length > 0 && (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                  <div style={{ fontWeight: 500, marginBottom: 12 }}>
                    Assign Billing Plan
                    <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 8 }}>
                      Current: {userStats.estimate?.tier?.name || 'None'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {plans.map(plan => (
                      <button
                        key={plan.id}
                        className={`btn btn-sm ${userStats.estimate?.tier?.name === plan.name ? 'btn-primary' : 'btn-secondary'}`}
                        disabled={planLoading || userStats.estimate?.tier?.name === plan.name}
                        onClick={() => handleAssignPlan(selectedUser._id, plan.id)}
                      >
                        {plan.name}{userStats.estimate?.tier?.name === plan.name && ' ✓'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Generate Invoice */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 16 }}>
                <div style={{ fontWeight: 500, marginBottom: 12 }}>
                  Generate Invoice
                  <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 8 }}>
                    Generate invoice for a past month
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <input
                    type="month"
                    className="form-input"
                    style={{ width: 160 }}
                    max={new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 7)}
                    value={invoiceMonth}
                    onChange={(e) => setInvoiceMonth(e.target.value)}
                  />
                  <button
                    className="btn btn-secondary btn-sm"
                    disabled={!invoiceMonth || invoiceLoading}
                    onClick={() => handleGenerateInvoice(selectedUser._id)}
                  >
                    {invoiceLoading ? '...' : 'Generate Invoice'}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>
              No usage data available for this user yet.
            </div>
          )}
</div>
)}
    </div>
  )
}