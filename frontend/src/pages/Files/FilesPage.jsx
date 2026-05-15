import { useEffect, useState, useCallback } from 'react'
import { useFiles } from '../../hooks/useFiles.js'
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'
import Badge from '../../components/common/Badge.jsx'
import UploadModal from '../../components/modals/UploadModal.jsx'
import { formatBytes } from '../../utils/formatBytes.js'
import { formatDate } from '../../utils/formatDate.js'

const MIME_OPTIONS = [
  { label: 'All Types', value: '' },
  { label: 'Images', value: 'image/' },
  { label: 'Documents', value: 'application/pdf' },
  { label: 'Videos', value: 'video/' },
  { label: 'Audio', value: 'audio/' },
  { label: 'Text', value: 'text/' },
]

const SORT_OPTIONS = [
  { label: 'Newest First', value: 'createdAt:desc' },
  { label: 'Oldest First', value: 'createdAt:asc' },
  { label: 'Name A–Z', value: 'fileName:asc' },
  { label: 'Name Z–A', value: 'fileName:desc' },
  { label: 'Largest First', value: 'size:desc' },
]

export default function FilesPage() {
  const { files, loading, error, pagination, fetchFiles, deleteFile, restoreFile, getDownloadUrl } = useFiles()
  const [search, setSearch] = useState('')
  const [mimeType, setMimeType] = useState('')
  const [sortBy, setSortBy] = useState('createdAt:desc')
  const [page, setPage] = useState(1)
  const [showUpload, setShowUpload] = useState(false)
  const [showDeleted, setShowDeleted] = useState(false)
  const [actionLoading, setActionLoading] = useState({})
  const [localError, setLocalError] = useState('')

  const load = useCallback((p = page) => {
    fetchFiles({
      page: p,
      limit: 20,
      search: search || undefined,
      mimeType: mimeType || undefined,
      sortBy,
      includeDeleted: showDeleted ? 'true' : undefined,
    })
  }, [page, search, mimeType, sortBy, fetchFiles, showDeleted])

  useEffect(() => { load(1); setPage(1) }, [search, mimeType, sortBy, showDeleted])
  useEffect(() => { load(page) }, [page])

  const handleSearch = (e) => setSearch(e.target.value)

  const handleDownload = async (fileId) => {
    setActionLoading((a) => ({ ...a, [fileId + '_dl']: true }))
    try {
      const url = await getDownloadUrl(fileId)
      window.open(url, '_blank')
    } catch (err) {
      setLocalError(err.response?.data?.message || 'Download failed')
    } finally {
      setActionLoading((a) => ({ ...a, [fileId + '_dl']: false }))
    }
  }

  const handleDelete = async (fileId, name) => {
    if (!window.confirm(`Delete "${name}"? This can be restored later.`)) return
    setActionLoading((a) => ({ ...a, [fileId + '_del']: true }))
    try {
      await deleteFile(fileId)
      load(page)
    } catch (err) {
      setLocalError(err.response?.data?.message || 'Delete failed')
    } finally {
      setActionLoading((a) => ({ ...a, [fileId + '_del']: false }))
    }
  }

  const handleRestore = async (fileId) => {
    setActionLoading((a) => ({ ...a, [fileId + '_res']: true }))
    try {
      await restoreFile(fileId)
      load(page)
    } catch (err) {
      setLocalError(err.response?.data?.message || 'Restore failed')
    } finally {
      setActionLoading((a) => ({ ...a, [fileId + '_res']: false }))
    }
  }

  const totalPages = Math.ceil(pagination.total / 20) || 1

  const getStatusBadge = (file) => {
    if (file.deleted || file.isDeleted) return <Badge variant="danger">Deleted</Badge>
    return <Badge variant="success">Active</Badge>
  }

  const getFileMimeBadge = (ct) => {
    if (!ct) return <Badge variant="muted">—</Badge>
    if (ct.startsWith('image/')) return <Badge variant="info">Image</Badge>
    if (ct.startsWith('video/')) return <Badge variant="warning">Video</Badge>
    if (ct.startsWith('audio/')) return <Badge variant="accent">Audio</Badge>
    if (ct.includes('pdf')) return <Badge variant="danger">PDF</Badge>
    if (ct.startsWith('text/')) return <Badge variant="muted">Text</Badge>
    return <Badge variant="muted">{ct.split('/')[1]?.slice(0, 8) || 'File'}</Badge>
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">File Manager</div>
          <div className="page-subtitle">{pagination.total} files total</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className={`btn btn-sm ${showDeleted ? 'btn-danger' : 'btn-secondary'}`}
            onClick={() => setShowDeleted(d => !d)}
          >
            🗑 {showDeleted ? 'Hide Deleted' : 'Show Deleted'}
          </button>
          <button className="btn btn-primary" onClick={() => setShowUpload(true)}>
            <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Upload
          </button>
        </div>
      </div>

      {localError && <ErrorMessage message={localError} />}

      {showDeleted && (
        <div style={{ padding: '8px 12px', marginBottom: 12, background: 'var(--color-background-danger)', border: '1px solid var(--color-border-danger)', borderRadius: 8, fontSize: 13, color: 'var(--color-text-danger)' }}>
          Showing deleted files — click Restore to recover them
        </div>
      )}

      <div className="toolbar">
        <div className="search-bar">
          <svg className="search-bar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search files..."
            value={search}
            onChange={handleSearch}
          />
        </div>
        <select className="form-select" style={{ width: 140 }} value={mimeType} onChange={(e) => setMimeType(e.target.value)}>
          {MIME_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select className="form-select" style={{ width: 160 }} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorMessage message={error} onRetry={() => load(page)} />
      ) : files.length === 0 ? (
        <div className="empty-state">
          <svg className="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <div className="empty-state-title">{showDeleted ? 'No deleted files' : 'No files found'}</div>
          <div className="empty-state-desc">{showDeleted ? 'No files in trash' : 'Upload your first file to get started'}</div>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Size</th>
                <th>Type</th>
                <th>Status</th>
                <th>Uploaded</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {files.map((file) => {
                const id = file._id || file.id
                const name = file.fileName || file.name
                const isDeleted = file.deleted || file.isDeleted
                return (
                  <tr key={id}>
                    <td style={{ maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
                      {name}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
                      {formatBytes(file.size || file.fileSize)}
                    </td>
                    <td>{getFileMimeBadge(file.contentType || file.mimeType)}</td>
                    <td>{getStatusBadge(file)}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                      {formatDate(file.createdAt || file.uploadedAt)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {!isDeleted && (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleDownload(id)}
                            disabled={actionLoading[id + '_dl']}
                          >
                            {actionLoading[id + '_dl'] ? '...' : 'Download'}
                          </button>
                        )}
                        {isDeleted ? (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleRestore(id)}
                            disabled={actionLoading[id + '_res']}
                            style={{ color: 'var(--color-text-success)' }}
                          >
                            {actionLoading[id + '_res'] ? '...' : 'Restore'}
                          </button>
                        ) : (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDelete(id, name)}
                            disabled={actionLoading[id + '_del']}
                          >
                            {actionLoading[id + '_del'] ? '...' : 'Delete'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {!loading && totalPages > 1 && (
        <div className="pagination">
          <span className="pagination-info">Page {page} of {totalPages} — {pagination.total} files</span>
          <button className="btn btn-secondary btn-sm" onClick={() => setPage(1)} disabled={page === 1}>«</button>
          <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>‹</button>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)', padding: '0 8px' }}>{page}</span>
          <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}>›</button>
          <button className="btn btn-secondary btn-sm" onClick={() => setPage(totalPages)} disabled={page >= totalPages}>»</button>
        </div>
      )}

      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onSuccess={() => { setShowUpload(false); load(page) }}
        />
      )}
    </div>
  )
}