import { NavLink, Link, useLocation } from 'react-router-dom'
import '../../admin.css'

const NAV = [
  { group: 'Overview' },
  { to: '/admin',             icon: '⊞',  label: 'Dashboard'     },
  { group: 'Content' },
  { to: '/admin/upload',      icon: '⬆',  label: 'Upload Content' },
  { to: '/admin/products',    icon: '📦',  label: 'Products'       },
  { to: '/admin/my-uploads',  icon: '🗂',  label: 'My Uploads'     },
  { group: 'Management' },
  { to: '/admin/orders',      icon: '🧾',  label: 'Orders'         },
  { to: '/admin/users',       icon: '👥',  label: 'Users'          },
  { group: 'System' },
  { to: '/admin/settings',    icon: '⚙',  label: 'Settings'       },
]

const PAGE_TITLES = {
  '/admin':            'Dashboard',
  '/admin/upload':     'Upload Content',
  '/admin/products':   'Products',
  '/admin/my-uploads': 'My Uploads',
  '/admin/orders':     'Orders',
  '/admin/users':      'Users',
  '/admin/settings':   'Settings',
}

export function AdminSidebar() {
  return (
    <aside className="adm-sidebar">
      <div className="adm-sb-head">
        <div className="adm-sb-logo">
          <div className="adm-sb-logo-icon">A</div>
          <div className="adm-sb-logo-text">
            Acadmix
            <div><span className="adm-sb-logo-badge">ADMIN</span></div>
          </div>
        </div>
      </div>

      <nav className="adm-sb-nav">
        {NAV.map((item, i) => {
          if (item.group) return <div key={i} className="adm-sb-group">{item.group}</div>
          return (
            <NavLink
              key={i}
              to={item.to}
              end={item.to === '/admin'}
              className={({ isActive }) => `adm-sb-link${isActive ? ' active' : ''}`}
            >
              <span className="adm-sb-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          )
        })}
      </nav>

      <div className="adm-sb-foot">
        <Link to="/" className="adm-sb-back">
          <span>←</span>
          <span>Back to Site</span>
        </Link>
      </div>
    </aside>
  )
}

export function AdminTopNav() {
  const loc = useLocation()
  const title = PAGE_TITLES[loc.pathname] || 'Admin'
  return (
    <div className="adm-topnav">
      <div className="adm-topnav-left">
        <span className="adm-topnav-page">{title}</span>
      </div>
      <div className="adm-topnav-right">
        <div className="adm-search-bar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input placeholder="Search products, users..." />
        </div>
        <button className="adm-notif-btn" title="Notifications">🔔</button>
        <div className="adm-avatar" title="Admin">A</div>
      </div>
    </div>
  )
}

export default function AdminLayout({ children }) {
  return (
    <div className="adm-wrap">
      <AdminSidebar />
      <div className="adm-main">
        <AdminTopNav />
        <div className="adm-body">{children}</div>
      </div>
    </div>
  )
}
