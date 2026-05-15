export default function LoadingSpinner({ size = 'md', text = 'Loading...' }) {
  const cls = size === 'sm' ? 'spinner spinner-sm' : 'spinner'
  return (
    <div className="loading-spinner">
      <div className={cls} />
      {size !== 'sm' && <span style={{ color: 'var(--text-muted)', fontSize: 13, fontFamily: 'var(--font-mono)' }}>{text}</span>}
    </div>
  )
}