import { useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { API_URL } from '../store/store'
import '../Auth.css'

/* ─── Google Icon ─── */
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

/* ─── Eye Icon ─── */
function EyeIcon({ open }) {
  return open ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )
}

/* ─── Math CAPTCHA ─── */
function genCaptcha() {
  const ops = ['+', '-', '×']
  const op  = ops[Math.floor(Math.random() * ops.length)]
  let a, b, answer
  if (op === '+') { a = Math.floor(Math.random()*20)+1; b = Math.floor(Math.random()*20)+1; answer = a+b }
  else if (op === '-') { a = Math.floor(Math.random()*20)+10; b = Math.floor(Math.random()*10)+1; answer = a-b }
  else { a = Math.floor(Math.random()*9)+2; b = Math.floor(Math.random()*9)+2; answer = a*b }
  return { question: `${a} ${op} ${b}`, answer }
}

function MathCaptcha({ onVerified }) {
  const [captcha, setCaptcha]   = useState(genCaptcha)
  const [answer, setAnswer]     = useState('')
  const [status, setStatus]     = useState('idle') // idle | correct | wrong

  const refresh = () => {
    setCaptcha(genCaptcha())
    setAnswer('')
    setStatus('idle')
    onVerified(false)
  }

  const handleChange = (val) => {
    setAnswer(val)
    if (val === '') { setStatus('idle'); onVerified(false); return }
    const num = parseInt(val, 10)
    if (!isNaN(num)) {
      if (num === captcha.answer) { setStatus('correct'); onVerified(true) }
      else { setStatus('wrong'); onVerified(false) }
    }
  }

  return (
    <div className={`captcha-box${status === 'correct' ? ' verified' : ''}`}>
      <div className="captcha-question">{captcha.question} = ?</div>
      <span className="captcha-equals"></span>
      <div className="captcha-input">
        <input
          className={`form-input${status === 'wrong' ? ' error' : ''}`}
          type="number"
          placeholder="Answer"
          value={answer}
          onChange={e => handleChange(e.target.value)}
          style={{ width:'100%' }}
        />
      </div>
      <span className="captcha-status">
        {status === 'correct' ? '✅' : status === 'wrong' ? '❌' : ''}
      </span>
      <button type="button" className="captcha-refresh" onClick={refresh} title="New question">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/>
          <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
        </svg>
      </button>
    </div>
  )
}

/* ─── SIGNUP ─── */
export default function Signup() {
  const navigate = useNavigate()
  const [form, setForm]         = useState({ firstName:'', lastName:'', email:'', password:'', confirm:'' })
  const [showPwd, setShowPwd]   = useState(false)
  const [showCfm, setShowCfm]   = useState(false)
  const [errors, setErrors]     = useState({})
  const [agreed, setAgreed]     = useState(false)
  const [captchaOk, setCaptcha] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [success, setSuccess]   = useState(false)

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }))
    if (errors[k]) setErrors(e => ({ ...e, [k]: '' }))
  }

  const validate = () => {
    const e = {}
    if (!form.firstName.trim()) e.firstName = 'First name required'
    if (!form.lastName.trim())  e.lastName  = 'Last name required'
    if (!form.email) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email'
    if (!form.password) e.password = 'Password is required'
    else if (form.password.length < 6) e.password = 'Minimum 6 characters'
    if (form.confirm !== form.password) e.confirm = 'Passwords do not match'
    if (!agreed) e.terms = 'You must agree to the terms'
    if (!captchaOk) e.captcha = 'Please solve the math question correctly'
    return e
  }

  const handleSubmit = async (ev) => {
    ev.preventDefault()
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setLoading(true)
    await new Promise(r => setTimeout(r, 1400))
    setLoading(false)
    setSuccess(true)
    setTimeout(() => navigate('/'), 1800)
  }

  /* Password strength */
  const strength = (() => {
    const p = form.password
    if (!p) return 0
    let s = 0
    if (p.length >= 8) s++
    if (/[A-Z]/.test(p)) s++
    if (/[0-9]/.test(p)) s++
    if (/[^A-Za-z0-9]/.test(p)) s++
    return s
  })()
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength]
  const strengthColor = ['', '#EF4444', '#F59E0B', '#3B82F6', '#10B981'][strength]

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 900 }}>

        {/* ── Left: Form ── */}
        <div className="auth-form-side" style={{ overflowY: 'auto', maxHeight: '90vh' }}>
          <h1 className="auth-title">Create Account</h1>

          {success && (
            <div className="auth-success">✅ Account created! Redirecting…</div>
          )}

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <GoogleLogin
                onSuccess={async (credentialResponse) => {
                  try {
                    const res = await fetch(`${API_URL}/auth/google`, {
                      method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token: credentialResponse.credential }),
                  })
                  const data = await res.json()
                  if (res.ok) {
                    localStorage.setItem('acadmix_user', JSON.stringify(data))
                    navigate('/')
                  } else {
                    alert(data.message || 'Signup failed')
                  }
                } catch (err) {
                  alert('Error connecting to server')
                }
              }}
                onError={() => console.log('Login Failed')}
                theme="outline"
                size="large"
                text="continue_with"
              />
            </div>

          <div className="auth-divider" style={{ marginBottom: 16 }}>
            <div className="auth-divider-line" />
            <span className="auth-divider-text">or with email</span>
            <div className="auth-divider-line" />
          </div>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="form-row">
              <div className="form-group">
                <div className={`field-wrap${errors.firstName ? ' err' : ''}`}>
                  <input className="form-input" type="text" placeholder="First name" value={form.firstName} onChange={e => set('firstName', e.target.value)} />
                </div>
                {errors.firstName && <span className="form-error">{errors.firstName}</span>}
              </div>
              <div className="form-group">
                <div className={`field-wrap${errors.lastName ? ' err' : ''}`}>
                  <input className="form-input" type="text" placeholder="Last name" value={form.lastName} onChange={e => set('lastName', e.target.value)} />
                </div>
                {errors.lastName && <span className="form-error">{errors.lastName}</span>}
              </div>
            </div>

            <div className="form-group">
              <div className={`field-wrap${errors.email ? ' err' : ''}`}>
                <input className="form-input" type="email" placeholder="Email address" value={form.email} onChange={e => set('email', e.target.value)} />
              </div>
              {errors.email && <span className="form-error">{errors.email}</span>}
            </div>

            <div className="form-group">
              <div className={`field-wrap${errors.password ? ' err' : ''}`}>
                <input className="form-input" type={showPwd ? 'text' : 'password'} placeholder="Password (min. 6 chars)" value={form.password} onChange={e => set('password', e.target.value)} />
                <span className="field-icon">
                  <button type="button" onClick={() => setShowPwd(s => !s)} tabIndex={-1}><EyeIcon open={showPwd} /></button>
                </span>
              </div>
              {form.password && (
                <div>
                  <div className="strength-bars">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="strength-bar" style={{ background: i <= strength ? strengthColor : '#222' }} />
                    ))}
                  </div>
                  <span style={{ fontSize:'.7rem', color: strengthColor, fontWeight:600 }}>{strengthLabel}</span>
                </div>
              )}
              {errors.password && <span className="form-error">{errors.password}</span>}
            </div>

            <div className="form-group">
              <div className={`field-wrap${errors.confirm ? ' err' : ''}`}>
                <input className="form-input" type={showCfm ? 'text' : 'password'} placeholder="Confirm password" value={form.confirm} onChange={e => set('confirm', e.target.value)} />
                <span className="field-icon">
                  <button type="button" onClick={() => setShowCfm(s => !s)} tabIndex={-1}><EyeIcon open={showCfm} /></button>
                </span>
              </div>
              {errors.confirm && <span className="form-error">{errors.confirm}</span>}
            </div>

            <div className="form-group">
              <div style={{ fontSize:'.75rem', color:'#6B7280', marginBottom:6 }}>Verify — solve the math question</div>
              <MathCaptcha onVerified={ok => { setCaptcha(ok); if (ok && errors.captcha) setErrors(e => ({ ...e, captcha:'' })) }} />
              {errors.captcha && <span className="form-error">{errors.captcha}</span>}
            </div>

            <label className="terms-row">
              <input type="checkbox" checked={agreed} onChange={e => { setAgreed(e.target.checked); if (errors.terms) setErrors(ev => ({ ...ev, terms:'' })) }} />
              <span>I agree to the <a href="#">Terms</a> and <a href="#">Privacy Policy</a></span>
            </label>
            {errors.terms && <span className="form-error">{errors.terms}</span>}

            <button className="btn-auth" type="submit" disabled={loading || success}>
              {loading ? 'Creating account…' : success ? '✓ Done!' : 'Create Account'}
            </button>

            <p className="auth-sub">Already have an account? <Link to="/login">Sign in</Link></p>
          </form>
        </div>

        {/* ── Right: Welcome panel ── */}
        <div className="auth-welcome-side">
          <div className="auth-welcome-content">
            <h2 className="auth-welcome-title">Join<br />Acadmix!</h2>
            <p className="auth-welcome-sub">
              Premium study resources for NEET, JEE and Boards at student-friendly prices.
            </p>
            <div className="auth-welcome-stats">
              {[
                { icon:'✓', text:'Purchase notes & books digitally' },
                { icon:'✓', text:'Lifetime access to all purchases' },
                { icon:'✓', text:'Track progress and predict rank' },
                { icon:'✓', text:'100% exam-focused content' },
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
