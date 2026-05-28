import { useState, useEffect } from 'react'
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom'

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/neet', label: 'NEET' },
  { to: '/jee', label: 'JEE' },
  { to: '/boards', label: 'Boards' },
  { to: '/notes', label: 'Notes' },
  { to: '/test-series', label: 'Test Series' },
  { to: '/books', label: 'Books' },
]

const SIDEBAR_ITEMS = [
  { icon: '⊞', label: 'Home', to: '/' },
  { icon: '📚', label: 'Notes', to: '/notes' },
  { icon: '🎯', label: 'Test Series', to: '/test-series' },
  { icon: '📖', label: 'Books', to: '/books' },
  { icon: '🛍', label: 'My Purchases', to: '/purchases', badge: '3' },
  { icon: '🔖', label: 'Saved', to: '/saved' },
  { group: 'Exams' },
  { icon: '🩺', label: 'NEET', to: '/neet' },
  { icon: '⚡', label: 'JEE', to: '/jee' },
  { icon: '📋', label: 'Boards', to: '/boards' },
  { divider: true },
  { icon: '⚙', label: 'Settings', to: '/settings' },
]

export function Sidebar({ collapsed, toggle, mobileOpen, onOverlayClick }) {
  const location = useLocation()

  const [user, setUser] = useState(null)

  useEffect(() => {
    try {
      const u = localStorage.getItem('acadmix_user')
      if (u) setUser(JSON.parse(u))
    } catch {}
  }, [])

  // Close sidebar on route change on mobile
  useEffect(() => {
    if (mobileOpen) onOverlayClick()
  }, [location.pathname])

  return (
    <>
      {/* Overlay backdrop for mobile */}
      <div
        className={`sidebar-overlay${mobileOpen ? ' active' : ''}`}
        onClick={onOverlayClick}
        aria-hidden="true"
      />

      <aside className={`sidebar${collapsed ? ' collapsed' : ''}${mobileOpen ? ' mobile-open' : ''}`}>
        <div className="sb-head">
          <div className="sb-brand">
            <div className="sb-icon-logo">🎓</div>
            <span className="sb-brand-text">Acadmix</span>
          </div>
          <button className="sb-toggle" onClick={toggle} aria-label="Toggle sidebar">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d={collapsed ? 'M9 18l6-6-6-6' : 'M15 18l-6-6 6-6'} />
            </svg>
          </button>
        </div>

        <nav className="sb-nav">
          {SIDEBAR_ITEMS.map((item, i) => {
            if (item.group) return <div key={i} className="sb-group-label">{item.group}</div>
            if (item.divider) return <div key={i} className="sb-divider" />
            const active = location.pathname === item.to ||
              (item.to !== '/' && location.pathname.startsWith(item.to))
            return (
              <NavLink key={i} to={item.to} className={`sb-item${active ? ' active' : ''}`}>
                <span className="sb-item-icon">{item.icon}</span>
                <span className="sb-label">{item.label}</span>
                {item.badge && <span className="sb-badge">{item.badge}</span>}
              </NavLink>
            )
          })}
        </nav>

        <div className="sb-footer">
          {user ? (
            <div className="sb-user">
              <div className="sb-avatar">{user.name?.charAt(0).toUpperCase()}</div>
              <div className="sb-user-info">
                <span className="sb-user-name">{user.name}</span>
                <span className="sb-user-plan">{user.role === 'admin' ? 'Admin' : 'Student'}</span>
              </div>
            </div>
          ) : (
            <div className="sb-user">
              <div className="sb-avatar">?</div>
              <div className="sb-user-info">
                <span className="sb-user-name">Guest</span>
                <Link to="/login" style={{ fontSize:'.8rem', color:'#3B82F6', textDecoration:'none' }}>Sign in to continue</Link>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}

export function Navbar({ scrolled, collapsed, onHamburger, mobileOpen }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)

  useEffect(() => {
    try {
      const u = localStorage.getItem('acadmix_user')
      if (u) setUser(JSON.parse(u))
    } catch {}
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('acadmix_user')
    setUser(null)
    navigate('/')
    window.location.reload()
  }
  return (
    <nav className={`navbar${scrolled ? ' scrolled' : ''}${collapsed ? ' sb-collapsed' : ''}`}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Hamburger — mobile only */}
        <button
          className={`hamburger${mobileOpen ? ' open' : ''}`}
          onClick={onHamburger}
          aria-label="Open menu"
        >
          <span /><span /><span />
        </button>

        <NavLink to="/" className="nav-brand">
          <div className="nav-logo-icon">🎓</div>
          <span>Acadmix</span>
        </NavLink>
      </div>

      <ul className="nav-links">
        {NAV_LINKS.map((l, i) => {
          const active = location.pathname === l.to ||
            (l.to !== '/' && location.pathname.startsWith(l.to))
          return (
            <li key={i}>
              <NavLink to={l.to} className={`nav-link${active ? ' active' : ''}`}>{l.label}</NavLink>
            </li>
          )
        })}
      </ul>

      <div className="nav-right">
        <div className="nav-search">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input placeholder="Search notes, tests, books..." />
        </div>
        {user ? (
          <>
            {user.role === 'admin' && <Link to="/admin" className="btn-login" style={{ background:'transparent', border:'none', color:'#4F46E5', fontWeight:600 }}>Admin Panel</Link>}
            <div className="nav-avatar">{user.name?.charAt(0).toUpperCase()}</div>
            <button className="btn-login" onClick={handleLogout} style={{ background:'transparent', border:'none', color:'#EF4444', fontWeight:600, cursor:'pointer' }}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn-login">Login</Link>
            <Link to="/signup" className="btn-signup">Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  )
}
