import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import PDFReader from './PDFReader'
import { API_URL } from '../store/store'

const TABS = ['All','Notes','Test Series','Books']

function PurchaseCard({ item, userToken, onView }) {
  const typeClass = item.type === 'notes' ? 'pur-type-notes' : item.type === 'test_series' ? 'pur-type-test' : 'pur-type-book'
  const btnLabel  = item.type === 'test_series' ? 'View Test' : 'Read Content'
  const emoji     = item.type === 'notes' ? '📝' : item.type === 'book' ? '📚' : '🎯'
  const typeLbl   = item.type === 'notes' ? 'Notes' : item.type === 'book' ? 'Book' : 'Test Series'

  const cover = item.thumbnail || item.coverImage

  // If the resource is not a test series, use the secure backend streaming route
  const viewUrl = item.type === 'test_series' 
    ? item.fileUrl 
    : `${API_URL}/products/${item._id}/view?token=${userToken}`

  const downloadUrl = `${API_URL}/products/${item._id}/view?token=${userToken}&download=true`

  return (
    <div className="pur-card">
      <div className="pur-thumb" style={{ background: '#F3F4F6', position: 'relative' }}>
        {cover ? (
          <img src={cover} alt={item.title} style={{ width:'100%', height:'100%', objectFit:'cover', position:'absolute', top:0, left:0 }} />
        ) : (
          <span style={{ fontSize:'2.2rem' }}>{emoji}</span>
        )}
        <span className={`pur-type-badge ${typeClass}`} style={{ zIndex: 1 }}>{typeLbl}</span>
      </div>
      <div className="pur-body">
        <div className="pur-title">{item.title}</div>
        <div className="pur-date">Available forever</div>
        <div className="pur-actions">
          <button className="pur-btn primary" onClick={() => {
            if (item.type === 'test_series') {
              window.open(viewUrl, '_blank')
            } else {
              onView(item)
            }
          }}>{btnLabel}</button>
          {item.isFree && item.type !== 'test_series' && <button className="pur-btn" onClick={() => window.open(downloadUrl, '_blank')}>Download</button>}
        </div>
      </div>
    </div>
  )
}



export default function MyPurchases() {
  const [tab, setTab] = useState('All')
  const [params, setParams] = useSearchParams()
  const [purchases, setPurchases] = useState([])
  const [loading, setLoading] = useState(true)
  const [reader, setReader] = useState(null)

  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        const u = localStorage.getItem('acadmix_user')
        if (!u) return setLoading(false)
        const user = JSON.parse(u)

        // Check if there's a payment callback to verify
        const orderId = params.get('order_id')
        if (orderId) {
          await fetch(`${API_URL}/orders/verify-cashfree`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
            body: JSON.stringify({ order_id: orderId })
          })
          params.delete('order_id')
          setParams(params)
        }

        const res = await fetch(`${API_URL}/orders/my`, {
          headers: { Authorization: `Bearer ${user.token}` }
        })
        const data = await res.json()
        if (res.ok) {
          // data is an array of orders. order.product is the populated product.
          const validProducts = data.filter(o => o.product && o.status === 'completed').map(o => o.product)
          setPurchases(validProducts)
        }
      } catch (err) {}
      setLoading(false)
    }
    fetchPurchases()
  }, [])

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading your content...</div>

  const filtered = tab === 'All' ? purchases
    : tab === 'Notes'       ? purchases.filter(p => p.type === 'notes')
    : tab === 'Test Series' ? purchases.filter(p => p.type === 'test_series')
    : purchases.filter(p => p.type === 'book')

  const u = localStorage.getItem('acadmix_user')
  const user = u ? JSON.parse(u) : null
  const token = user?.token || ''

  return (
    <>
      {reader && (
        <PDFReader 
          title={reader.title} 
          driveLink={reader.isFree && reader.driveLink ? reader.driveLink : `${API_URL}/products/${reader._id || reader.id}/view?token=${token}`}
          onClose={() => setReader(null)} 
        />
      )}

      <div className="purchases-hero">
        <h1>My Purchases</h1>
        <p>All your purchased notes, test series and books in one place.</p>
        <div className="purchases-tabs">
          {TABS.map(t => (
            <button key={t} className={`ptab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>{t}</button>
          ))}
        </div>
      </div>

      <div className="purchases-body">
        {/* Recent Purchases */}
        <div className="section-head" style={{ marginBottom:20 }}>
          <h2 className="section-title" style={{ fontSize:'1.2rem' }}>
            {tab === 'All' ? 'Recent Purchases' : tab}
            <span style={{ fontSize:'.85rem', fontWeight:400, color:'#6B7280', marginLeft:8 }}>
              {filtered.length} item{filtered.length !== 1 ? 's' : ''}
            </span>
          </h2>
        </div>

        {filtered.length > 0 ? (
          <div className="purchases-grid">
            {filtered.map((item, i) => (
              <PurchaseCard 
                key={i} 
                item={item} 
                userToken={token} 
                onView={setReader} 
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">📦</div>
            <h3>No {tab} purchased yet</h3>
            <p>Browse our collection and make your first purchase.</p>
          </div>
        )}

      </div>
    </>
  )
}
