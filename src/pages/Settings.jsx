import { useState } from 'react'
import { clearState } from '../lib/storage.js'
import { useStore } from '../store/StoreContext.jsx'
import { useTheme } from '../store/ThemeContext.jsx'

/**
 * Account settings: password change, theme and demo data reset.
 */
export default function Settings() {
  const { user, changePassword, logout } = useStore()
  const { theme, toggle } = useTheme()

  const [pw, setPw] = useState({ current: '', next: '', confirm: '' })
  const [message, setMessage] = useState(null)
  const [busy, setBusy] = useState(false)

  const update = (field) => (event) =>
    setPw((prev) => ({ ...prev, [field]: event.target.value }))

  const submitPassword = async (event) => {
    event.preventDefault()
    setMessage(null)
    if (pw.next.length < 6) {
      setMessage({ tone: 'error', text: 'New password must be at least 6 characters.' })
      return
    }
    if (pw.next !== pw.confirm) {
      setMessage({ tone: 'error', text: 'New passwords do not match.' })
      return
    }
    setBusy(true)
    try {
      await changePassword({ current: pw.current, next: pw.next })
      setPw({ current: '', next: '', confirm: '' })
      setMessage({ tone: 'success', text: 'Password updated.' })
    } catch (err) {
      setMessage({ tone: 'error', text: err.message })
    } finally {
      setBusy(false)
    }
  }

  const resetData = () => {
    const ok = window.confirm(
      'Reset all local data? Accounts, posts, comments and likes will be restored to the demo defaults.',
    )
    if (!ok) return
    clearState()
    logout()
    window.location.assign('/')
  }

  return (
    <div className="page page--narrow">
      <h1>Settings</h1>
      <p className="muted">
        Signed in as <strong>{user?.name}</strong> (@{user?.username})
      </p>

      {message && (
        <p
          className={`alert alert--${message.tone === 'error' ? 'error' : 'success'}`}
          role="alert"
        >
          {message.text}
        </p>
      )}

      <section className="settings-card">
        <h2>Appearance</h2>
        <div className="settings-row">
          <div>
            <strong>Theme</strong>
            <p className="muted">Currently using the {theme} theme.</p>
          </div>
          <button type="button" className="btn btn--ghost" onClick={toggle}>
            Switch to {theme === 'light' ? 'dark' : 'light'}
          </button>
        </div>
      </section>

      <section className="settings-card">
        <h2>Change password</h2>
        <form onSubmit={submitPassword}>
          <label className="field">
            <span>Current password</span>
            <input
              type="password"
              autoComplete="current-password"
              value={pw.current}
              onChange={update('current')}
              required
            />
          </label>
          <div className="field-row">
            <label className="field">
              <span>New password</span>
              <input
                type="password"
                autoComplete="new-password"
                value={pw.next}
                onChange={update('next')}
                required
              />
            </label>
            <label className="field">
              <span>Confirm new password</span>
              <input
                type="password"
                autoComplete="new-password"
                value={pw.confirm}
                onChange={update('confirm')}
                required
              />
            </label>
          </div>
          <button className="btn btn--primary" type="submit" disabled={busy}>
            {busy ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </section>

      <section className="settings-card settings-card--danger">
        <h2>Danger zone</h2>
        <div className="settings-row">
          <div>
            <strong>Reset demo data</strong>
            <p className="muted">
              Restores the sample posts and removes every local account.
            </p>
          </div>
          <button type="button" className="btn btn--danger" onClick={resetData}>
            Reset data
          </button>
        </div>
      </section>
    </div>
  )
}
