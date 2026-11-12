import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { validateRegister } from '../lib/auth.js'
import { useStore } from '../store/StoreContext.jsx'

/** Account creation form with live validation. */
export default function Register() {
  const { register } = useStore()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirm: '',
  })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)

  const update = (field) => (event) => {
    const value = event.target.value
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const submit = async (event) => {
    event.preventDefault()
    setFormError('')
    const found = validateRegister(form)
    setErrors(found)
    if (Object.values(found).some(Boolean)) return

    setBusy(true)
    try {
      await register(form)
      navigate('/', { replace: true })
    } catch (err) {
      setFormError(err.message || 'Unable to create your account.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-card__title">Join Lumen</h1>
        <p className="auth-card__subtitle">
          Publish your ideas and join the conversation.
        </p>

        {formError && (
          <p className="alert alert--error" role="alert">
            {formError}
          </p>
        )}

        <form onSubmit={submit} noValidate>
          <label className="field">
            <span>Display name</span>
            <input
              type="text"
              autoComplete="name"
              value={form.name}
              onChange={update('name')}
              placeholder="Ada Okafor"
              autoFocus
            />
            {errors.name && <em className="field__error">{errors.name}</em>}
          </label>

          <div className="field-row">
            <label className="field">
              <span>Username</span>
              <input
                type="text"
                autoComplete="username"
                value={form.username}
                onChange={update('username')}
                placeholder="ada"
              />
              {errors.username && <em className="field__error">{errors.username}</em>}
            </label>

            <label className="field">
              <span>Email</span>
              <input
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={update('email')}
                placeholder="ada@example.com"
              />
              {errors.email && <em className="field__error">{errors.email}</em>}
            </label>
          </div>

          <div className="field-row">
            <label className="field">
              <span>Password</span>
              <input
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={update('password')}
                placeholder="At least 6 characters"
              />
              {errors.password && <em className="field__error">{errors.password}</em>}
            </label>

            <label className="field">
              <span>Confirm password</span>
              <input
                type="password"
                autoComplete="new-password"
                value={form.confirm}
                onChange={update('confirm')}
                placeholder="Repeat it"
              />
              {errors.confirm && <em className="field__error">{errors.confirm}</em>}
            </label>
          </div>

          <button className="btn btn--primary btn--block" type="submit" disabled={busy}>
            {busy ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="auth-card__switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
