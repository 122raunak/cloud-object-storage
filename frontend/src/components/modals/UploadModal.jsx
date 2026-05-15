import { useState, useRef, useCallback } from 'react'
import { storageApi } from '../../api/storage.api.js'
import { formatBytes } from '../../utils/formatBytes.js'

const STEP = { SELECT: 'select', UPLOADING: 'uploading', DONE: 'done', ERROR: 'error' }

function generateIdempotencyKey() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export default function UploadModal({ onClose, onSuccess }) {
  const [step, setStep] = useState(STEP.SELECT)
  const [file, setFile] = useState(null)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef()

  const handleFile = (f) => {
    if (!f) return
    setFile(f)
    setError('')
  }

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [])

  const handleUpload = async () => {
    if (!file) return
    setStep(STEP.UPLOADING)
    setProgress(0)
    setError('')

    try {
      // Step 1: Get presigned URL
      const urlRes = await storageApi.getUploadUrl({
        fileName: file.name,
        contentType: file.type || 'application/octet-stream',
        size: file.size,
        idempotencyKey: generateIdempotencyKey(),
      })
      const { uploadUrl, objectKey } = urlRes.data.data || urlRes.data

      // Step 2: Upload directly to MinIO
      await storageApi.uploadToPresignedUrl(uploadUrl, file, setProgress)

      // Step 3: Confirm upload
      await storageApi.confirmUpload({
        objectKey,
        fileName: file.name,
        contentType: file.type || 'application/octet-stream',
        size: file.size,
      })

      setStep(STEP.DONE)
      setTimeout(() => { onSuccess?.(); onClose() }, 1200)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Upload failed')
      setStep(STEP.ERROR)
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">Upload File</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {/* SELECT */}
        {(step === STEP.SELECT || step === STEP.ERROR) && (
          <>
            <div
              className={`dropzone${dragOver ? ' drag-over' : ''}`}
              onClick={() => inputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
            >
              <svg className="dropzone-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <div className="dropzone-text">
                {file ? file.name : 'Drop a file here or click to browse'}
              </div>
              <div className="dropzone-hint">
                {file ? formatBytes(file.size) : 'Any file type supported'}
              </div>
              <input
                ref={inputRef}
                type="file"
                style={{ display: 'none' }}
                onChange={(e) => handleFile(e.target.files[0])}
              />
            </div>

            {file && (
              <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{file.name}</span>
                  <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>{formatBytes(file.size)}</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>{file.type || 'unknown type'}</div>
              </div>
            )}

            {error && <div className="error-msg" style={{ marginTop: 12 }}>⚠ {error}</div>}

            <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" onClick={handleUpload} disabled={!file}>
                Upload
              </button>
            </div>
          </>
        )}

        {step === STEP.UPLOADING && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ marginBottom: 12, color: 'var(--text-secondary)', fontSize: 14 }}>
              Uploading <strong style={{ color: 'var(--text-primary)' }}>{file?.name}</strong>
            </div>
            <div className="upload-progress-bar" style={{ marginBottom: 8 }}>
              <div className="upload-progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--accent)' }}>{progress}%</div>
          </div>
        )}

        {step === STEP.DONE && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>✓</div>
            <div style={{ color: 'var(--success)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18 }}>Upload Complete</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>Refreshing file list...</div>
          </div>
        )}
      </div>
    </div>
  )
}