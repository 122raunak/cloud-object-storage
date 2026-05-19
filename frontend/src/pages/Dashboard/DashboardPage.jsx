import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import { meteringApi } from '../../api/metering.api.js'
import { billingApi } from '../../api/billing.api.js'
import { storageApi } from '../../api/storage.api.js'
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx'
import ProgressBar from '../../components/common/ProgressBar.jsx'
import { formatBytes } from '../../utils/formatBytes.js'
import { formatCurrency } from '../../utils/formatCurrency.js'
import { formatDate } from '../../utils/formatDate.js'
import UploadModal from '../../components/modals/UploadModal.jsx'


export default function DashboardPage() {
  const { user, unreadCount } = useAuth()
  const [usage, setUsage] = useState(null)
  const [estimate, setEstimate] = useState(null)
  const [recentFiles, setRecentFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const navigate = useNavigate()
  const [folderCount, setFolderCount] = useState(0)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [uRes, eRes, fRes , foldersRes] = await Promise.allSettled([
          meteringApi.getUsage(user._id),
          billingApi.getEstimate(user._id),
          storageApi.getFiles({ limit: 5, sortBy: 'createdAt:desc', _t: Date.now() }),
          storageApi.listBuckets(),
        ])
        if (uRes.status === 'fulfilled') {
          setUsage(uRes.value.data.data || uRes.value.data)
        }
        if (eRes.status === 'fulfilled') {
          setEstimate(eRes.value.data.data || eRes.value.data)
        }
        if (fRes.status === 'fulfilled') {
          const outer = fRes.value.data.data
          setRecentFiles(Array.isArray(outer?.data) ? outer.data : [])
        }
        if (foldersRes.status === 'fulfilled') {
          const folders = foldersRes.value.data.data || foldersRes.value.data || []
          setFolderCount(Array.isArray(folders) ? folders.length : 0)
        }
      } finally {
        setLoading(false)
      }
    }
    if (user?._id) load()
  }, [user?._id])

  if (loading) return <LoadingSpinner />

  const usedBytes = Number(usage?.monthly?.storage_used) || 0
  const quotaBytes = 5 * 1024 * 1024 * 1024

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">Hey, {user?.username} 👋</div>
          <div className="page-subtitle">Here's what's happening in your storage</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowUpload(true)}>
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Upload File
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 'var(--space-4)' }} className="mb-8">
        <div className="stat-card">
          <div className="stat-label">Storage Used</div>
          <div className="stat-value">{formatBytes(usedBytes)}</div>
          <div className="stat-sub">of 5 GB quota</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Month Estimate</div>
          <div className="stat-value">{formatCurrency(estimate?.charges?.total_amount || 0)}</div>
          <div className="stat-sub">Current billing period</div>
        </div>
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/notifications')}>
          <div className="stat-label">Notifications</div>
          <div className="stat-value" style={{ color: unreadCount > 0 ? 'var(--accent)' : undefined }}>
            {unreadCount}
          </div>
          <div className="stat-sub">
            {unreadCount > 0 ? `${unreadCount} unread` : 'View all notifications →'}
          </div>
        </div>
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/buckets')}>
          <div className="stat-label">Folders</div>
          <div className="stat-value">{folderCount}</div>
          <div className="stat-sub">Manage folders →</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">API Calls</div>
          <div className="stat-value">{(Number(usage?.monthly?.api_calls) || 0).toLocaleString()}</div>
          <div className="stat-sub">This month</div>
        </div>
      </div>

      <div className="card mb-8">
        <div className="card-header">
          <div className="card-title">Storage Usage</div>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {formatBytes(usedBytes)} / {formatBytes(quotaBytes)}
          </span>
        </div>
        <ProgressBar value={usedBytes} max={quotaBytes} />
      </div>

      <div className="section">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div className="section-title" style={{ margin: 0, flex: 'none' }}>Recent Files</div>
          <Link to="/files" className="btn btn-ghost btn-sm">View all →</Link>
        </div>

        {recentFiles.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
            No files uploaded yet.
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Size</th>
                  <th>Type</th>
                  <th>Uploaded</th>
                </tr>
              </thead>
              <tbody>
                {recentFiles.slice(0, 5).map((f) => (
                  <tr key={f._id || f.id}>
                    <td style={{ fontWeight: 500, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {f.fileName || f.name}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
                      {formatBytes(f.size || f.fileSize)}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
                      {(f.contentType || f.mimeType || '—').split('/')[1] || '—'}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                      {formatDate(f.createdAt || f.uploadedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        <button className="btn btn-secondary" onClick={() => setShowUpload(true)}>
          <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Upload File
        </button>
        <button className="btn btn-secondary" onClick={() => navigate('/billing')}>
          <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          View Invoices
        </button>
      </div>

      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onSuccess={() => { setShowUpload(false); navigate('/files') }}
        />
      )}
    </div>
  )
}