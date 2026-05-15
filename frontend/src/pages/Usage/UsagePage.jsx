import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth.js'
import { meteringApi } from '../../api/metering.api.js'
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'
import ProgressBar from '../../components/common/ProgressBar.jsx'
import { formatBytes } from '../../utils/formatBytes.js'
import { formatDate } from '../../utils/formatDate.js'

export default function UsagePage() {
  const { user } = useAuth()
  const [usage, setUsage] = useState(null)
  const [daily, setDaily] = useState([])
  const [monthly, setMonthly] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      if (!user?._id) return
      setLoading(true)
      setError('')
      try {
        const [uRes, dRes, mRes] = await Promise.allSettled([
          meteringApi.getUsage(user._id),
          meteringApi.getDailyUsage(user._id, { days: 30 }),
          meteringApi.getMonthlyUsage(user._id, { months: 12 }),
        ])
        if (uRes.status === 'fulfilled') {
          setUsage(uRes.value.data.data || uRes.value.data)
        }
        if (dRes.status === 'fulfilled') {
          const d = dRes.value.data.data || dRes.value.data
          setDaily(Array.isArray(d) ? d : [])
        }
        if (mRes.status === 'fulfilled') {
          const d = mRes.value.data.data || mRes.value.data
          setMonthly(Array.isArray(d) ? d : [])
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load usage data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} />

  const usedBytes = Number(usage?.monthly?.storage_used) || 0
  const quotaBytes = 5 * 1024 * 1024 * 1024

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">Usage Analytics</div>
          <div className="page-subtitle">Monitor your storage and API consumption</div>
        </div>
      </div>

      {/* Storage progress */}
      <div className="card mb-8">
        <div className="card-header">
          <div className="card-title">Storage Quota</div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
            {formatBytes(usedBytes)} / 5 GB
          </span>
        </div>
        <ProgressBar value={usedBytes} max={quotaBytes} />
      </div>

      {/* Summary cards */}
      <div className="grid-4 mb-8">
        <div className="stat-card">
          <div className="stat-label">Bytes Uploaded</div>
          <div className="stat-value">{formatBytes(Number(usage?.monthly?.bytes_uploaded) || 0)}</div>
          <div className="stat-sub">This month</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Bytes Downloaded</div>
          <div className="stat-value">{formatBytes(Number(usage?.monthly?.bytes_downloaded) || 0)}</div>
          <div className="stat-sub">This month</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">API Calls</div>
          <div className="stat-value">{Number(usage?.monthly?.api_calls || 0).toLocaleString()}</div>
          <div className="stat-sub">This month</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Period</div>
          <div className="stat-value" style={{ fontSize: 18 }}>{usage?.monthly?.period_start?.slice(0, 7) || '—'}</div>
          <div className="stat-sub">Current billing period</div>
        </div>
      </div>

      {/* Daily breakdown */}
      <div className="section">
        <div className="section-title">Daily Breakdown — Last 30 Days</div>
        {daily.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12 }}>
            No daily data available
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Uploaded</th>
                  <th>Downloaded</th>
                  <th>API Calls</th>
                  <th>Storage</th>
                </tr>
              </thead>
              <tbody>
                {daily.map((row, i) => (
                  <tr key={i}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                      {formatDate(row.period_start)}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
                      {formatBytes(Number(row.bytes_uploaded) || 0)}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
                      {formatBytes(Number(row.bytes_downloaded) || 0)}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
                      {Number(row.api_calls || 0).toLocaleString()}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
                      {formatBytes(Number(row.storage_used) || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Monthly breakdown */}
      <div className="section">
        <div className="section-title">Monthly Breakdown — Last 12 Months</div>
        {monthly.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12 }}>
            No monthly data available
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Uploaded</th>
                  <th>Downloaded</th>
                  <th>API Calls</th>
                  <th>Avg Storage</th>
                </tr>
              </thead>
              <tbody>
                {monthly.map((row, i) => (
                  <tr key={i}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                      {formatDate(row.period_start, { year: 'numeric', month: 'long' })}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
                      {formatBytes(Number(row.bytes_uploaded) || 0)}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
                      {formatBytes(Number(row.bytes_downloaded) || 0)}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
                      {Number(row.api_calls || 0).toLocaleString()}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
                      {formatBytes(Number(row.storage_used) || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}