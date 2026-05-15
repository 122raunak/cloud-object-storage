const variantMap = {
  success: 'badge-success',
  danger: 'badge-danger',
  warning: 'badge-warning',
  info: 'badge-info',
  accent: 'badge-accent',
  muted: 'badge-muted',
}

export default function Badge({ children, variant = 'muted' }) {
  return (
    <span className={`badge ${variantMap[variant] || 'badge-muted'}`}>
      {children}
    </span>
  )
}