import { useState, useEffect } from 'react'
import { API_URL, getToken } from '../../store/store'

export default function AdminUsers() {
  const [users, setUsers]     = useState([])
  const [total, setTotal]     = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [page, setPage]       = useState(1)
  const [actionLoading, setActionLoading] = useState(null) // tracks which user ID is loading
  const LIMIT = 20

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, limit: LIMIT })
      if (search) params.append('search', search)
      const res = await fetch(`${API_URL}/users?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      const data = await res.json()
      if (res.ok) {
        setUsers(data.users || [])
        setTotal(data.total || 0)
      }
    } catch (err) {
      console.error('Failed to fetch users:', err)
    }
    setLoading(false)
  }

  useEffect(() => { fetchUsers() }, [page])

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchUsers() }, 400)
    return () => clearTimeout(t)
  }, [search])

  const toggleActive = async (user) => {
    setActionLoading(user._id + '_toggle')
    try {
      const res = await fetch(`${API_URL}/users/${user._id}/toggle`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      if (res.ok) {
        const data = await res.json()
        setUsers(us => us.map(u => u._id === user._id ? { ...u, isActive: data.isActive } : u))
      }
    } catch (err) { console.error(err) }
    setActionLoading(null)
  }

  const toggleRole = async (user) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin'
    if (!confirm(`Change ${user.name}'s role to ${newRole}?`)) return
    setActionLoading(user._id + '_role')
    try {
      const res = await fetch(`${API_URL}/users/${user._id}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ role: newRole }),
      })
      if (res.ok) {
        const data = await res.json()
        setUsers(us => us.map(u => u._id === user._id ? { ...u, role: data.role } : u))
      }
    } catch (err) { console.error(err) }
    setActionLoading(null)
  }

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div className="admin-search">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input
            placeholder="Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontSize: '.83rem', color: '#6B7280' }}>{loading ? '…' : total} users</span>
          <button className="adm-btn adm-btn-outline adm-btn-sm" onClick={fetchUsers}>🔄 Refresh</button>
        </div>
      </div>

      <div className="admin-table-wrap">
        <div className="admin-table-head"><h3>All Users</h3></div>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#6B7280' }}>Loading users…</div>
        ) : (
          <table className="admin-table">
            <thead><tr>
              <th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Status</th><th>Actions</th>
            </tr></thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan="6"><div className="admin-empty"><div className="admin-empty-icon">👥</div><h3>No users found</h3></div></td></tr>
              ) : users.map(u => (
                <tr key={u._id}>
                  <td style={{ fontWeight: 600 }}>{u.name}</td>
                  <td style={{ color: '#6B7280' }}>{u.email}</td>
                  <td>
                    <span className={`status-badge ${u.role === 'admin' ? 'type-test' : 'status-active'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ color: '#6B7280', fontSize: '.78rem' }}>
                    {new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td>
                    <span className={`status-badge status-${u.isActive ? 'active' : 'inactive'}`}>
                      {u.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        className="admin-btn admin-btn-outline admin-btn-sm"
                        disabled={actionLoading === u._id + '_role'}
                        onClick={() => toggleRole(u)}
                      >
                        {actionLoading === u._id + '_role' ? '…' : (u.role === 'admin' ? 'Demote' : 'Make Admin')}
                      </button>
                      <button
                        className={`admin-btn admin-btn-sm ${u.isActive ? 'admin-btn-danger' : 'admin-btn-outline'}`}
                        disabled={actionLoading === u._id + '_toggle'}
                        onClick={() => toggleActive(u)}
                      >
                        {actionLoading === u._id + '_toggle' ? '…' : (u.isActive ? 'Disable' : 'Enable')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
          <button className="adm-btn adm-btn-outline adm-btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span style={{ padding: '6px 14px', fontSize: '.82rem', color: '#6B7280' }}>Page {page} of {totalPages}</span>
          <button className="adm-btn adm-btn-outline adm-btn-sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}
    </>
  )
}
