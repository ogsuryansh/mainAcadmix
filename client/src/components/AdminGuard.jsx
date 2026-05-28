import { Navigate } from 'react-router-dom'
import { getCurrentUser } from '../store/store'

/**
 * Wraps admin routes — redirects unauthenticated or non-admin users.
 */
export default function AdminGuard({ children }) {
  const user = getCurrentUser()

  if (!user || !user.token) {
    return <Navigate to="/login" replace />
  }

  if (user.role !== 'admin') {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: '#F9FAFB', gap: 12, textAlign: 'center', padding: 24,
      }}>
        <div style={{ fontSize: '3rem' }}>🚫</div>
        <h2 style={{ fontWeight: 700, color: '#111827', margin: 0 }}>Access Denied</h2>
        <p style={{ color: '#6B7280', margin: '4px 0 20px' }}>
          You need admin privileges to view this page.
        </p>
        <a href="/" style={{
          background: '#6D28D9', color: '#fff', padding: '10px 24px',
          borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: '.9rem',
        }}>
          Go Home
        </a>
      </div>
    )
  }

  return children
}
