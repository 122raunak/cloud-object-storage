export function formatCurrency(amount) {
  const num = Number(amount) || 0
  if (num === 0) return '$0.00'
  if (num < 0.0001) return `$${num.toFixed(8)}`
  if (num < 0.01) return `$${num.toFixed(6)}`
  if (num < 1) return `$${num.toFixed(4)}`
  return `$${num.toFixed(2)}`
}