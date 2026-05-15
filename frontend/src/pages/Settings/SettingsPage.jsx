import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth.js'
import { useNotifications } from '../../hooks/useNotifications.js'
import { authApi } from '../../api/auth.api.js'
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx'

function EyeIcon({ show }) {
  return show ? (
    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  ) : (
    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  )
}

export default function SettingsPage() {
  const { user } = useAuth()
  const { preferences, fetchPreferences, savePreferences } = useNotifications(user?._id)

  const [prefs, setPrefs] = useState(null)
  const [budgetThreshold, setBudgetThreshold] = useState(0)
  const [prefSaving, setPrefSaving] = useState(false)
  const [prefMsg, setPrefMsg] = useState({ type: '', text: '' })

  const [pwForm, setPwForm] = useState({ oldPassword: '', newPassword: '', confirmNewPassword: '' })
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMsg, setPwMsg] = useState({ type: '', text: '' })

  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    if (user?._id) fetchPreferences()
  }, [user?._id, fetchPreferences])

  useEffect(() => {
    if (preferences) {
      setPrefs(preferences.preferences || {})
      setBudgetThreshold(preferences.budgetThreshold || 0)
    }
  }, [preferences])

  const togglePref = (key) => {
    setPrefs((p) => ({ ...p, [key]: !p[key] }))
  }

  const handleSavePrefs = async () => {
    setPrefSaving(true)
    setPrefMsg({ type: '', text: '' })
    try {
      await savePreferences({
        email: preferences?.email || user?.email,
        budgetThreshold: Number(budgetThreshold),
        preferences: prefs,
      })
      setPrefMsg({ type: 'success', text: 'Preferences saved successfully' })
    } catch (err) {
      setPrefMsg({ type: 'error', text: err.response?.data?.message || 'Failed to save preferences' })
    } finally {
      setPrefSaving(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setPwMsg({ type: '', text: '' })
    if (pwForm.newPassword !== pwForm.confirmNewPassword) {
      setPwMsg({ type: 'error', text: 'New passwords do not match' })
      return
    }
    setPwSaving(true)
    try {
      await authApi.changePassword({ oldPassword: pwForm.oldPassword, newPassword: pwForm.newPassword })
      setPwMsg({ type: 'success', text: 'Password changed successfully' })
      setPwForm({ oldPassword: '', newPassword: '', confirmNewPassword: '' })
    } catch (err) {
      setPwMsg({ type: 'error', text: err.response?.data?.message || 'Failed to change password' })
    } finally {
      setPwSaving(false)
    }
  }

  const PREF_ITEMS = [
    { key: 'invoiceGenerated', label: 'Invoice Generated', desc: 'Notify when a new invoice is created' },
    { key: 'budgetAlert', label: 'Budget Alert', desc: 'Notify when spending exceeds threshold' },
    { key: 'storageWarning', label: 'Storage Warning', desc: 'Notify when storage usage is high' },
    { key: 'loginAlert', label: 'Login Alert', desc: 'Notify on new sign-in activity' },
    { key: 'dailyDigest', label: 'Daily Digest', desc: 'Daily summary of your activity' },
    { key: 'weeklyReport', label: 'Weekly Report', desc: 'Weekly analytics overview' },
  ]

  if (!prefs) return <LoadingSpinner />

  return (
    <div style={{ maxWidth: 680 }}>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">Settings</div>
          <div className="page-subtitle">Manage your account and notifications</div>
        </div>
      </div>

      {/* Account info */}
      <div className="card mb-8">
        <div className="card-header" style={{ marginBottom: 16 }}>
          <div className="card-title">Account Info</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <div className="form-label">Username</div>
            <div style={{ marginTop: 6, padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
              {user?.username}
            </div>
          </div>
          <div>
            <div className="form-label">Email</div>
            <div style={{ marginTop: 6, padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
              {preferences?.email || user?.email}
            </div>
          </div>
          <div>
            <div className="form-label">Role</div>
            <div style={{ marginTop: 6, padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', fontSize: 11 }}>
              {user?.role}
            </div>
          </div>
          <div>
            <div className="form-label">Storage Quota</div>
            <div style={{ marginTop: 6, padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
              {preferences?.storageQuotaGB || '5'} GB
            </div>
          </div>
        </div>
      </div>

      {/* Notification preferences */}
      <div className="card mb-8">
        <div className="card-header" style={{ marginBottom: 0 }}>
          <div className="card-title">Notification Preferences</div>
        </div>
        <div style={{ marginTop: 16 }}>
          {PREF_ITEMS.map(({ key, label, desc }) => (
            <div key={key} className="toggle-row">
              <div>
                <div className="toggle-label">{label}</div>
                <div className="toggle-desc">{desc}</div>
              </div>
              <Toggle checked={!!prefs[key]} onChange={() => togglePref(key)} />
            </div>
          ))}
        </div>
        <div style={{ marginTop: 20 }}>
          <label className="form-label">Budget Alert Threshold (USD, 0 = disabled)</label>
          <input
            type="number"
            className="form-input"
            style={{ marginTop: 8, maxWidth: 200 }}
            value={budgetThreshold}
            min={0}
            onChange={(e) => setBudgetThreshold(e.target.value)}
          />
        </div>
        {prefMsg.text && (
          <div className={prefMsg.type === 'success' ? 'success-msg' : 'error-msg'} style={{ marginTop: 16 }}>
            {prefMsg.text}
          </div>
        )}
        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" onClick={handleSavePrefs} disabled={prefSaving}>
            {prefSaving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>

      {/* Change password */}
      <div className="card">
        <div className="card-header" style={{ marginBottom: 16 }}>
          <div className="card-title">Change Password</div>
        </div>
        <form onSubmit={handleChangePassword}>
          <div className="form-group">
            <label className="form-label">Current Password</label>
            <div style={{ position: 'relative' }}>
              <input
                className="form-input"
                type={showOld ? 'text' : 'password'}
                value={pwForm.oldPassword}
                onChange={(e) => setPwForm(f => ({ ...f, oldPassword: e.target.value }))}
                placeholder="••••••••"
                style={{ paddingRight: 40 }}
                required
              />
              <button type="button" onClick={() => setShowOld(s => !s)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                <EyeIcon show={showOld} />
              </button>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">New Password</label>
            <div style={{ position: 'relative' }}>
              <input
                className="form-input"
                type={showNew ? 'text' : 'password'}
                value={pwForm.newPassword}
                onChange={(e) => setPwForm(f => ({ ...f, newPassword: e.target.value }))}
                placeholder="••••••••"
                minLength={6}
                style={{ paddingRight: 40 }}
                required
              />
              <button type="button" onClick={() => setShowNew(s => !s)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                <EyeIcon show={showNew} />
              </button>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Confirm New Password</label>
            <div style={{ position: 'relative' }}>
              <input
                className="form-input"
                type={showConfirm ? 'text' : 'password'}
                value={pwForm.confirmNewPassword}
                onChange={(e) => setPwForm(f => ({ ...f, confirmNewPassword: e.target.value }))}
                placeholder="••••••••"
                style={{ paddingRight: 40 }}
                required
              />
              <button type="button" onClick={() => setShowConfirm(s => !s)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                <EyeIcon show={showConfirm} />
              </button>
            </div>
          </div>
          {pwMsg.text && (
            <div className={pwMsg.type === 'success' ? 'success-msg' : 'error-msg'}>{pwMsg.text}</div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" disabled={pwSaving}>
              {pwSaving ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Toggle({ checked, onChange }) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={onChange} />
      <div className="toggle-track" />
      <div className="toggle-thumb" />
    </label>
  )
}