import { useState, useEffect } from 'react'
import { API_URL, getToken } from '../../store/store'

const STATUS_COLORS = { completed: '#059669', pending: '#D97706', refunded: '#DC2626', failed: '#6B7280' }

export default function AdminOrders() {
  const [orders, setOrders]   = useState([])
  const [total, setTotal]     = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [filter, setFilter]   = useState('all')
  const [page, setPage]       = useState(1)
  const LIMIT = 20

  const typeLabel = { notes: 'Notes', book: 'Book', test_series: 'Test Series' }

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/orders?page=${page}&limit=${LIMIT}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      const data = await res.json()
      if (res.ok) {
        setOrders(data.orders || [])
        setTotal(data.total || 0)
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err)
    }
    setLoading(false)
  }

  useEffect(() => { fetchOrders() }, [page])

  const filtered = orders.filter(o => {
    const userName    = o.user?.name || ''
    const userEmail   = o.user?.email || ''
    const productTitle = o.product?.title || ''
    const matchSearch = userName.toLowerCase().includes(search.toLowerCase())
      || userEmail.toLowerCase().includes(search.toLowerCase())
      || o.paymentId?.toLowerCase().includes(search.toLowerCase())
      || productTitle.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || o.status === filter
    return matchSearch && matchFilter
  })

  const totalRevenue  = orders.filter(o => o.status === 'completed').reduce((s, o) => s + (o.amount || 0), 0)
  const completedCount = orders.filter(o => o.status === 'completed').length
  const pendingCount   = orders.filter(o => o.status === 'pending').length
  const refundedCount  = orders.filter(o => o.status === 'refunded').length
  const totalPages     = Math.ceil(total / LIMIT)

  return (
    <>
      {/* Summary row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 22 }}>
        {[
          { label: 'Total Revenue',  val: `₹${totalRevenue.toLocaleString('en-IN')}`, color: '#059669' },
          { label: 'Completed',      val: completedCount,  color: '#059669' },
          { label: 'Pending',        val: pendingCount,    color: '#D97706' },
          { label: 'Refunded',       val: refundedCount,   color: '#DC2626' },
        ].map((s, i) => (
          <div key={i} className="admin-stat-card" style={{ padding: '14px 18px' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: '.72rem', color: '#6B7280', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        <div className="admin-search">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input placeholder="Search by user, product or order ID..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="admin-select" style={{ width: 'auto' }} value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">All Status</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="refunded">Refunded</option>
          <option value="failed">Failed</option>
        </select>
        <button className="adm-btn adm-btn-outline adm-btn-sm" onClick={fetchOrders} style={{ marginLeft: 'auto' }}>
          🔄 Refresh
        </button>
      </div>

      <div className="admin-table-wrap">
        <div className="admin-table-head">
          <h3>Orders <span style={{ color: '#6B7280', fontWeight: 400 }}>({loading ? '…' : filtered.length})</span></h3>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#6B7280' }}>Loading orders…</div>
        ) : (
          <table className="admin-table">
            <thead><tr>
              <th>Order ID</th><th>User</th><th>Product</th><th>Type</th><th>Amount</th><th>Status</th><th>Date</th>
            </tr></thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="7"><div className="admin-empty"><div className="admin-empty-icon">🧾</div><h3>No orders found</h3></div></td></tr>
              ) : filtered.map(o => (
                <tr key={o._id}>
                  <td style={{ fontWeight: 700, color: '#6D28D9', fontSize: '.75rem', fontFamily: 'monospace' }}>
                    {o.paymentId?.slice(-12) || o._id?.slice(-8)}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{o.user?.name || '—'}</div>
                    <div style={{ fontSize: '.72rem', color: '#6B7280' }}>{o.user?.email || ''}</div>
                  </td>
                  <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {o.product?.title || '—'}
                  </td>
                  <td>
                    {o.product?.type && (
                      <span className={`status-badge type-${o.product.type === 'test_series' ? 'test' : o.product.type}`}>
                        {typeLabel[o.product.type] || o.product.type}
                      </span>
                    )}
                  </td>
                  <td style={{ fontWeight: 700 }}>₹{o.amount}</td>
                  <td>
                    <span style={{
                      display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontSize: '.7rem', fontWeight: 700,
                      background: STATUS_COLORS[o.status] + '20', color: STATUS_COLORS[o.status],
                    }}>
                      {o.status}
                    </span>
                  </td>
                  <td style={{ color: '#6B7280', fontSize: '.78rem' }}>
                    {new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
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
