import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import { storageApi } from '../../api/storage.api.js'
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'
import { formatBytes } from '../../utils/formatBytes.js'
import { formatDate } from '../../utils/formatDate.js'

export default function BucketsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [buckets, setBuckets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [nameError, setNameError] = useState('')
  const [msg, setMsg] = useState('')
  const [deletingId, setDeletingId] = useState(null)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await storageApi.listBuckets()
      const d = res.data.data || res.data
      setBuckets(Array.isArray(d) ? d : [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load buckets')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const showMsg = (text) => {
    setMsg(text)
    setTimeout(() => setMsg(''), 3000)
  }

  const validateName = (name) => {
    if (!name) return 'Bucket name is required'
    if (name.length < 3) return 'Minimum 3 characters'
    if (name.length > 63) return 'Maximum 63 characters'
    if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(name)) return 'Lowercase letters, numbers, and hyphens only. Must start and end with letter or number.'
    return ''
  }

  const handleCreate = async () => {
    const err = validateName(newName)
    if (err) { setNameError(err); return }
    setCreating(true)
    try {
      await storageApi.createBucket({ name: newName, description: newDesc })
      setNewName('')
      setNewDesc('')
      setShowCreate(false)
      showMsg('Bucket created successfully')
      load()
    } catch (err) {
      setNameError(err.response?.data?.message || 'Failed to create bucket')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (bucket) => {
    if (!window.confirm(`Delete bucket "${bucket.name}"? It must be empty.`)) return
    setDeletingId(bucket._id)
    try {
      await storageApi.deleteBucket(bucket._id)
      showMsg('Bucket deleted')
      load()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete bucket')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">Buckets</div>
          <div className="page-subtitle">{buckets.length} bucket{buckets.length !== 1 ? 's' : ''}</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          + Create Bucket
        </button>
      </div>

      {error && <ErrorMessage message={error} />}
      {msg && <div className="success-msg" style={{ marginBottom: 16 }}>{msg}</div>}

      {/* Create bucket modal */}
      {showCreate && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ width: 440, padding: 24 }}>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 16 }}>Create Bucket</div>
            <div className="form-group">
              <label className="form-label">Bucket Name *</label>
              <input
                className="form-input"
                placeholder="e.g. my-photos"
                value={newName}
                onChange={(e) => { setNewName(e.target.value.toLowerCase()); setNameError('') }}
              />
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                Lowercase letters, numbers, and hyphens only. 3-63 characters.
              </div>
              {nameError && <div style={{ fontSize: 12, color: 'var(--danger)', marginTop: 4 }}>{nameError}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Description (optional)</label>
              <input
                className="form-input"
                placeholder="What will you store here?"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
              <button className="btn btn-secondary" onClick={() => { setShowCreate(false); setNewName(''); setNewDesc(''); setNameError('') }}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={creating}>
                {creating ? 'Creating...' : 'Create Bucket'}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <LoadingSpinner />
      ) : buckets.length === 0 ? (
        <div className="empty-state">
          <svg className="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <div className="empty-state-title">No buckets yet</div>
          <div className="empty-state-desc">Create a bucket to organize your files</div>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowCreate(true)}>
            Create your first bucket
          </button>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Bucket Name</th>
                <th>Description</th>
                <th>Files</th>
                <th>Size</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {buckets.map((b) => (
                <tr
                  key={b._id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/buckets/${b._id}`)}
                >
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      <span style={{ fontWeight: 600, color: 'var(--accent)' }}>{b.name}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                    {b.description || '—'}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                    {b.fileCount || 0}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                    {formatBytes(b.totalSize || 0)}
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {formatDate(b.createdAt)}
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <button
                      className="btn btn-danger btn-sm"
                      disabled={deletingId === b._id}
                      onClick={() => handleDelete(b)}
                    >
                      {deletingId === b._id ? '...' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}