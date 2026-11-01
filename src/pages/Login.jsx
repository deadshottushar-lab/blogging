import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useStore } from '../store/StoreContext.jsx'

/** Sign-in form. Supports username or email as the identifier. */
export default function Login() {
  const { login } = useStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ identifier: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const from = location.state?.from || '/'

  const update = (field) => (event) =>
    setForm((prev) => ({ ...prev, [field]: event.target.value }))

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    if (!form.identifier.trim() || !form.password) {
      setError('Please fill in both fields.')
      return
    }
    setBusy(true)
    try {
      await login(form)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message || 'Unable to sign in.')
    } finally {
      setBusy(false)
    }
  }

  const useDemo = () => {
    setForm({ identifier: 'ada', password: 'demo1234' })
    setError('')
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-card__title">Welcome back</h1>
        <p className="auth-card__subtitle">Sign in to keep writing and responding.</p>

        {error && (
          <p className="alert alert--error" role="alert">
            {error}
          </p>
        )}

        <form onSubmit={submit} noValidate>
          <label className="field">
            <span>Username or email</span>
            <input
              type="text"
              autoComplete="username"
              value={form.identifier}
              onChange={update('identifier')}
              placeholder="ada"
              autoFocus
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={update('password')}
              placeholder="••••••••"
            />
          </label>

          <button className="btn btn--primary btn--block" type="submit" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <button type="button" className="demo-hint" onClick={useDemo}>
          Use the demo account (ada / demo1234)
        </button>

        <p className="auth-card__switch">
          New to Inkwell? <Link to="/register">Create an account</Link>
        </p>
      </div>
    </div>
  )
}
