import { useState, useCallback } from 'react'
import { billingApi } from '../api/billing.api.js'

export function useBilling() {
  const [plans, setPlans] = useState([])
  const [invoices, setInvoices] = useState([])
  const [estimate, setEstimate] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchPlans = useCallback(async () => {
    const res = await billingApi.getPlans()
    setPlans(res.data.data || res.data.plans || res.data || [])
  }, [])

  const fetchInvoices = useCallback(async (params = {}) => {
    setLoading(true)
    setError(null)
    try {
      const res = await billingApi.getInvoices(params)
      setInvoices(res.data.data?.invoices || res.data.invoices || res.data.data || res.data || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load invoices')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchEstimate = useCallback(async () => {
    const res = await billingApi.getEstimate()
    setEstimate(res.data.data || res.data)
  }, [])

  const fetchInvoice = useCallback(async (id) => {
    const res = await billingApi.getInvoice(id)
    return res.data.data || res.data
  }, [])

  return { plans, invoices, estimate, loading, error, fetchPlans, fetchInvoices, fetchEstimate, fetchInvoice }
}