import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth.js'
import { billingApi } from '../../api/billing.api.js'
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'
import { formatCurrency } from '../../utils/formatCurrency.js'
import { formatDate } from '../../utils/formatDate.js'

export default function BillingPage() {
  const { user } = useAuth()
  const [plans, setPlans] = useState([])
  const [invoices, setInvoices] = useState([])
  const [estimate, setEstimate] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [payingId, setPayingId] = useState(null)

  const loadRazorpay = () => new Promise((resolve) => {
    if (window.Razorpay) return resolve(true)
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })

  const handlePayNow = async (invoice) => {
    setPayingId(invoice.id)
    try {
      const loaded = await loadRazorpay()
      if (!loaded) { alert('Failed to load payment gateway'); return }

      const res = await billingApi.createPaymentOrder(user._id, invoice.id)
      const { order } = res.data.data || res.data

      const options = {
        key: 'rzp_test_SqqZnAk2na1UkE',
        amount: order.amount,
        currency: order.currency,
        name: 'CloudStore',
        description: `Invoice #${String(invoice.id).slice(-8).toUpperCase()}`,
        order_id: order.id,
        handler: async (response) => {
          try {
            await billingApi.verifyPayment(user._id, invoice.id, {
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
            })
            setInvoices(prev => prev.map(inv =>
              inv.id === invoice.id ? { ...inv, status: 'paid' } : inv
            ))
            alert('Payment successful! Invoice marked as paid.')
          } catch (err) {
            alert('Payment verification failed: ' + (err.response?.data?.message || err.message))
          }
        },
        prefill: { email: user?.email || '' },
        theme: { color: '#2563eb' },
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (err) {
      alert('Failed to create order: ' + (err.response?.data?.message || err.message))
    } finally {
      setPayingId(null)
    }
  }

  useEffect(() => {
    async function load() {
      if (!user?._id) return
      setLoading(true)
      setError('')
      try {
        const [plansRes, invoicesRes, estimateRes] = await Promise.allSettled([
          billingApi.getPlans(),
          billingApi.getInvoices(user._id),
          billingApi.getCurrentEstimate(user._id),
        ])
        if (plansRes.status === 'fulfilled') {
          const d = plansRes.value.data.data || plansRes.value.data
          const allPlans = Array.isArray(d) ? d : d.plans || []
          const seen = new Set()
          setPlans(allPlans.filter(p => {
            if (seen.has(p.name)) return false
            seen.add(p.name)
            return true
          }))
        }
        if (invoicesRes.status === 'fulfilled') {
          const d = invoicesRes.value.data.data || invoicesRes.value.data
          setInvoices(Array.isArray(d) ? d : d.invoices || [])
        }
        if (estimateRes.status === 'fulfilled') {
          setEstimate(estimateRes.value.data.data || estimateRes.value.data)
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load billing data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} />

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">Billing</div>
          <div className="page-subtitle">Manage your plan and invoices</div>
        </div>
      </div>

      {/* Current estimate */}
      {estimate && (
        <div className="card mb-8">
          <div className="card-header">
            <div className="card-title">Current Period Estimate</div>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {estimate.period} · {estimate.tier?.name} plan
            </span>
          </div>
          <div className="grid-4" style={{ marginTop: 16 }}>
            <div className="stat-card">
              <div className="stat-label">Total Estimate</div>
              <div className="stat-value">{formatCurrency(estimate.charges?.total_amount || 0)}</div>
              <div className="stat-sub">This billing period</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Storage Cost</div>
              <div className="stat-value">{formatCurrency(estimate.charges?.storage_charge || 0)}</div>
              <div className="stat-sub">Based on usage</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Transfer Cost</div>
              <div className="stat-value">
                {formatCurrency(
                  (parseFloat(estimate.charges?.upload_charge || 0) +
                  parseFloat(estimate.charges?.download_charge || 0)).toString()
                )}
              </div>
              <div className="stat-sub">Uploads & downloads</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">API Cost</div>
              <div className="stat-value">{formatCurrency(estimate.charges?.api_charge || 0)}</div>
              <div className="stat-sub">API calls this month</div>
            </div>
          </div>
          {estimate.note && (
            <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
              {estimate.note}
            </div>
          )}
        </div>
      )}

      {/* Plans */}
      {plans.length > 0 && (
        <div className="section">
          <div className="section-title">Available Plans</div>
          <div className="grid-4">
            {plans.map((plan) => (
              <div key={plan.id} className="card" style={{ padding: 20 }}>
                <div style={{ fontWeight: 500, fontSize: 16, marginBottom: 6 }}>{plan.name}</div>
                <div style={{ fontSize: 22, fontWeight: 600, marginBottom: 12 }}>
                  {plan.free_storage_gb > 0
                    ? 'Free'
                    : `$${parseFloat(plan.storage_price).toFixed(3)}/GB`}
                  <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-muted)' }}>/mo</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                  {plan.free_storage_gb} GB free storage
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                  {plan.free_upload_gb} GB free uploads · {plan.free_download_gb} GB free downloads
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {Number(plan.free_api_calls).toLocaleString()} free API calls
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invoices */}
      <div className="section">
        <div className="section-title">Invoices</div>
        {invoices.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
            No invoices yet. Invoices are generated on the 1st of each month.
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Invoice ID</th>
                  <th>Period</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => {
                  const id = inv.id || inv._id || inv.invoiceId
                  return (
                    <tr key={id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
                        #{String(id).slice(-8).toUpperCase()}
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {formatDate(inv.period_start || inv.periodStart)} — {formatDate(inv.period_end || inv.periodEnd)}
                      </td>
                      <td style={{ fontWeight: 500 }}>
                        {formatCurrency(inv.total_amount || inv.amount || 0)}
                      </td>
                      <td>
                        <span style={{
                          fontSize: 11,
                          fontWeight: 500,
                          padding: '2px 8px',
                          borderRadius: 4,
                          background: inv.status === 'paid'
                            ? 'var(--color-background-success)'
                            : 'var(--color-background-warning)',
                          color: inv.status === 'paid'
                            ? 'var(--color-text-success)'
                            : 'var(--color-text-warning)',
                          textTransform: 'uppercase',
                        }}>
                          {inv.status || 'draft'}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {formatDate(inv.created_at || inv.createdAt || inv.issued_at)}
                      </td>
                      <td>
                        {inv.status === 'issued' && (
                          <button
                            className="btn btn-primary btn-sm"
                            disabled={payingId === id}
                            onClick={() => handlePayNow(inv)}
                          >
                            {payingId === id ? '...' : 'Pay Now'}
                          </button>
                        )}
                        {inv.status === 'paid' && (
                          <span style={{ fontSize: 12, color: 'var(--color-text-success)', fontWeight: 600 }}>
                            ✓ Paid
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}