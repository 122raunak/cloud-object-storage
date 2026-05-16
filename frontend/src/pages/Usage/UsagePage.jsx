import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth.js'
import { meteringApi } from '../../api/metering.api.js'
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'
import ProgressBar from '../../components/common/ProgressBar.jsx'
import { formatBytes } from '../../utils/formatBytes.js'
import { formatDate } from '../../utils/formatDate.js'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts'

// ── Custom tooltip ────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label, formatter }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--bg-elevated)', border: '1px solid var(--border)',
      borderRadius: 8, padding: '10px 14px', fontSize: 12
    }}>
      <div style={{ fontWeight: 600, marginBottom: 6, color: 'var(--text)' }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: {formatter ? formatter(p.value) : p.value}
        </div>
      ))}
    </div>
  )
}

export default function UsagePage() {
  const { user } = useAuth()
  const [usage, setUsage] = useState(null)
  const [daily, setDaily] = useState([])
  const [monthly, setMonthly] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeChart, setActiveChart] = useState('storage')

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
  }, [user?._id])

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} />

  const usedBytes = Number(usage?.monthly?.storage_used) || 0
  const quotaBytes = 5 * 1024 * 1024 * 1024

  // ── Chart data ────────────────────────────────────────────────────────────
  const dailyChartData = [...daily].reverse().map(row => ({
    date: new Date(row.period_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    uploaded:   Number(row.bytes_uploaded) || 0,
    downloaded: Number(row.bytes_downloaded) || 0,
    storage:    Number(row.storage_used) || 0,
    apiCalls:   Number(row.api_calls) || 0,
  }))

  const monthlyChartData = [...monthly].reverse().map(row => ({
    date: new Date(row.period_start).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    uploaded:   Number(row.bytes_uploaded) || 0,
    downloaded: Number(row.bytes_downloaded) || 0,
    storage:    Number(row.storage_used) || 0,
    apiCalls:   Number(row.api_calls) || 0,
  }))

  const chartTabs = [
    { key: 'storage',  label: 'Storage Used' },
    { key: 'transfer', label: 'Data Transfer' },
    { key: 'api',      label: 'API Calls' },
  ]

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

      {/* Charts */}
      <div className="card mb-8">
        <div className="card-header" style={{ marginBottom: 16 }}>
          <div className="card-title">Daily Activity — Last 30 Days</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {chartTabs.map(tab => (
              <button
                key={tab.key}
                className={`btn btn-sm ${activeChart === tab.key ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveChart(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {dailyChartData.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            No daily data available yet — upload some files to see activity
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            {activeChart === 'storage' ? (
              <AreaChart data={dailyChartData}>
                <defs>
                  <linearGradient id="storageGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <YAxis tickFormatter={v => formatBytes(v)} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} width={80} />
                <Tooltip content={<CustomTooltip formatter={formatBytes} />} />
                <Area
                  type="monotone"
                  dataKey="storage"
                  name="Storage Used"
                  stroke="var(--accent)"
                  fill="url(#storageGrad)"
                  strokeWidth={2}
                />
              </AreaChart>
            ) : activeChart === 'transfer' ? (
              <BarChart data={dailyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <YAxis tickFormatter={v => formatBytes(v)} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} width={80} />
                <Tooltip content={<CustomTooltip formatter={formatBytes} />} />
                <Legend />
                <Bar dataKey="uploaded" name="Uploaded" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="downloaded" name="Downloaded" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : (
              <BarChart data={dailyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="apiCalls" name="API Calls" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </div>

      {/* Monthly chart */}
      <div className="card mb-8">
        <div className="card-header" style={{ marginBottom: 16 }}>
          <div className="card-title">Monthly Overview — Last 12 Months</div>
        </div>
        {monthlyChartData.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            No monthly data available yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlyChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <YAxis tickFormatter={v => formatBytes(v)} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} width={80} />
              <Tooltip content={<CustomTooltip formatter={formatBytes} />} />
              <Legend />
              <Bar dataKey="uploaded" name="Uploaded" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="downloaded" name="Downloaded" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="storage" name="Storage" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Daily breakdown table */}
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

      {/* Monthly breakdown table */}
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
                  <th>Storage</th>
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