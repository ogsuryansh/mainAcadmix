import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getProducts, API_URL, getToken } from '../../store/store'

export default function AdminDashboard() {
  const [products, setProducts] = useState([])
  const [stats, setStats]       = useState(null)
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    getProducts().then(setProducts)
  }, [])

  useEffect(() => {
    const fetchStats = async () => {
      setLoadingStats(true)
      try {
        const res = await fetch(`${API_URL}/orders/stats`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        })
        if (res.ok) {
          const data = await res.json()
          setStats(data)
        }
      } catch (err) {
        console.error('Failed to fetch stats:', err)
      }
      setLoadingStats(false)
    }
    fetchStats()
  }, [])

  const notes  = products.filter(p => p.type === 'notes').length
  const books  = products.filter(p => p.type === 'book').length
  const tests  = products.filter(p => p.type === 'test_series').length
  const free   = products.filter(p => p.isFree).length

  const STATS = [
    { icon: '💰', label: 'Total Revenue',     val: loadingStats ? '…' : `₹${(stats?.revenue || 0).toLocaleString('en-IN')}`, bg: '#D1FAE5' },
    { icon: '🧾', label: 'Total Orders',       val: loadingStats ? '…' : (stats?.orders ?? '…'),   bg: '#FEE2E2' },
    { icon: '👥', label: 'Registered Users',   val: loadingStats ? '…' : (stats?.users ?? '…'),    bg: '#DBEAFE' },
    { icon: '📦', label: 'Active Products',    val: loadingStats ? '…' : (stats?.products ?? '…'), bg: '#FEF3C7' },
    { icon: '📝', label: 'Notes',              val: notes,  bg: '#EDE9FE' },
    { icon: '📚', label: 'Books',              val: books,  bg: '#D1FAE5' },
    { icon: '🎯', label: 'Test Series',        val: tests,  bg: '#FEE2E2' },
    { icon: '✅', label: 'Free Resources',     val: free,   bg: '#DBEAFE' },
  ]

  const recent    = [...products].sort((a, b) => new Date(b.uploadDate || b.createdAt) - new Date(a.uploadDate || a.createdAt)).slice(0, 5)
  const typeColor  = { notes: 'tag-notes', book: 'tag-book', test_series: 'tag-test' }
  const examColor  = { NEET: 'tag-neet', JEE: 'tag-jee', Boards: 'tag-boards' }
  const TYPE_LABEL = { notes: 'Notes', book: 'Book', test_series: 'Test Series' }

  return (
    <>
      {/* Stats */}
      <div className="adm-stats" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
        {STATS.map((s, i) => (
          <div key={i} className="adm-stat-card">
            <div className="adm-stat-icon" style={{ background: s.bg }}>{s.icon}</div>
            <div>
              <div className="adm-stat-val">{s.val}</div>
              <div className="adm-stat-lbl">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
        <Link to="/admin/upload"   className="adm-btn adm-btn-primary adm-btn-lg">⬆ Upload New Content</Link>
        <Link to="/admin/products" className="adm-btn adm-btn-outline adm-btn-lg">📦 View All Products</Link>
        <Link to="/admin/orders"   className="adm-btn adm-btn-outline adm-btn-lg">🧾 View Orders</Link>
        <Link to="/admin/users"    className="adm-btn adm-btn-outline adm-btn-lg">👥 Manage Users</Link>
      </div>

      {/* Recent Uploads */}
      <div className="adm-table-wrap">
        <div className="adm-table-head">
          <div>
            <div style={{ fontWeight: 700, color: '#111827', fontSize: '.9rem' }}>Recent Uploads</div>
            <div style={{ fontSize: '.75rem', color: '#6B7280', marginTop: 2 }}>Latest content added to the platform</div>
          </div>
          <Link to="/admin/products" className="adm-btn adm-btn-outline adm-btn-sm">View All →</Link>
        </div>

        {recent.length === 0 ? (
          <div className="adm-empty">
            <div className="adm-empty-icon">📭</div>
            <h3>No uploads yet</h3>
            <p>Start by uploading your first piece of content.</p>
            <Link to="/admin/upload" className="adm-btn adm-btn-primary" style={{ marginTop: 14 }}>Upload Content</Link>
          </div>
        ) : (
          <table className="adm-table">
            <thead><tr>
              <th>Title</th><th>Type</th><th>Exam</th><th>Access</th><th>Date</th>
            </tr></thead>
            <tbody>
              {recent.map(p => (
                <tr key={p._id || p.id}>
                  <td style={{ fontWeight: 600 }}>{p.title}</td>
                  <td><span className={`adm-pc-tag ${typeColor[p.type]}`}>{TYPE_LABEL[p.type]}</span></td>
                  <td><span className={`adm-pc-tag ${examColor[p.exam]}`}>{p.exam}</span></td>
                  <td>
                    {p.isFree
                      ? <span className="adm-pc-tag tag-free">FREE</span>
                      : <span className="adm-pc-tag tag-paid">₹{p.price}</span>
                    }
                  </td>
                  <td style={{ color: '#6B7280', fontSize: '.78rem' }}>
                    {new Date(p.uploadDate || p.createdAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
