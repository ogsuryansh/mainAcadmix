import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import '../Auth.css'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}

function UserIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  )
}

function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  )
}

function EyeIcon({ open }) {
  return open ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )
}

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm]       = useState({ email: '', password: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [errors, setErrors]   = useState({})
  const [loading, setLoading] = useState(false)

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }))
    if (errors[k]) setErrors(e => ({ ...e, [k]: '' }))
  }

  const validate = () => {
    const e = {}
    if (!form.email) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email'
    if (!form.password) e.password = 'Password is required'
    return e
  }

  const handleSubmit = async (ev) => {
    ev.preventDefault()
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setLoading(true)
    await new Promise(r => setTimeout(r, 1200))
    setLoading(false)
    navigate('/')
  }

  return (
    <div className="auth-page">
      <div className="auth-card">

        {/* ── Left: Form ── */}
        <div className="auth-form-side">
          <h1 className="auth-title">Login</h1>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div className="form-group">
              <div className={`field-wrap${errors.email ? ' err' : ''}`}>
                <input
                  className="form-input"
                  type="email"
                  placeholder="Username / Email"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                />
                <span className="field-icon"><UserIcon /></span>
              </div>
              {errors.email && <span className="form-error">{errors.email}</span>}
            </div>

            {/* Password */}
            <div className="form-group">
              <div className={`field-wrap${errors.password ? ' err' : ''}`}>
                <input
                  className="form-input"
                  type={showPwd ? 'text' : 'password'}
                  placeholder="Password"
                  value={form.password}
                  onChange={e => set('password', e.target.value)}
                />
                <span className="field-icon">
                  <button type="button" onClick={() => setShowPwd(s => !s)} tabIndex={-1}>
                    <EyeIcon open={showPwd} />
                  </button>
                </span>
              </div>
              {errors.password && <span className="form-error">{errors.password}</span>}
            </div>

            <Link to="/forgot-password" className="forgot-link">Forgot password?</Link>

            <button className="btn-auth" type="submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Login'}
            </button>

            <div className="auth-divider">
              <div className="auth-divider-line" />
              <span className="auth-divider-text">or</span>
              <div className="auth-divider-line" />
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
              <GoogleLogin
                onSuccess={async (credentialResponse) => {
                  try {
                    const res = await fetch('http://localhost:5000/api/auth/google', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ token: credentialResponse.credential }),
                    })
                    const data = await res.json()
                    if (res.ok) {
                      localStorage.setItem('acadmix_user', JSON.stringify(data))
                      navigate('/')
                    } else {
                      alert(data.message || 'Login failed')
                    }
                  } catch (err) {
                    alert('Error connecting to server')
                  }
                }}
                onError={() => console.log('Login Failed')}
                theme="outline"
                size="large"
                text="continue_with"
                width="100%"
              />
            </div>

            <p className="auth-sub">
              Don't have an account? <Link to="/signup">Sign Up</Link>
            </p>
          </form>
        </div>

        {/* ── Right: Welcome panel ── */}
        <div className="auth-welcome-side">
          <div className="auth-welcome-content">
            <h2 className="auth-welcome-title">Welcome<br />Back!</h2>
            <p className="auth-welcome-sub">
              Access your notes, test series and books — all in one place.
            </p>
            <div className="auth-welcome-stats">
              {[
                { icon: '📚', text: '900+ Notes for NEET, JEE & Boards' },
                { icon: '🎯', text: '100+ Mock Tests with analytics' },
                { icon: '📖', text: '80+ Books & PYQs — instant access' },
              ].map((s, i) => (
                <div key={i} className="auth-welcome-stat">
                  <span className="auth-welcome-stat-icon">{s.icon}</span>
                  <span className="auth-welcome-stat-text">{s.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
