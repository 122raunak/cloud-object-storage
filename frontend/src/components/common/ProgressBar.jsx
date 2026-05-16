export default function ProgressBar({ value = 0, max = 100, showLabel = true }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  const displayPct = value > 0 && pct < 1 ? 1 : pct
  const displayLabel = pct < 0.01 ? pct.toFixed(4) : pct < 1 ? pct.toFixed(2) : pct.toFixed(1)
  const cls = pct >= 90 ? 'danger' : pct >= 75 ? 'warn' : ''

  return (
    <div>
      {showLabel && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
          <span>{displayLabel}% used</span>
          <span style={{ color: pct >= 90 ? 'var(--danger)' : pct >= 75 ? 'var(--warning)' : 'var(--text-muted)' }}>
            {pct >= 90 ? 'Critical' : pct >= 75 ? 'High' : 'Normal'}
          </span>
        </div>
      )}
      <div className="progress-track">
        <div className={`progress-fill ${cls}`} style={{ width: `${displayPct}%` }} />
      </div>
    </div>
  )
}