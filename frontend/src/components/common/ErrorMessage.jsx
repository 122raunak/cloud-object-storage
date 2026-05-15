export default function ErrorMessage({ message, onRetry }) {
  if (!message) return null
  return (
    <div className="error-msg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span>⚠ {message}</span>
      {onRetry && (
        <button onClick={onRetry} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: 12, textDecoration: 'underline' }}>
          Retry
        </button>
      )}
    </div>
  )
}