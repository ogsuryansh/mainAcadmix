import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { load } from '@cashfreepayments/cashfree-js'
import { getProducts, API_URL } from '../store/store'
import { useReveal } from '../hooks'

let cashfree
const initCashfree = async () => {
  cashfree = await load({ mode: import.meta.env.VITE_CASHFREE_MODE || 'sandbox' })
}
initCashfree()

/* ── Mini product card (reused from Home) ── */
export function ProductCard({ product, purchased = false, onAlreadyPurchased }) {
  const ref = useRef(null)
  const visible = useReveal(ref)
  const isFree  = product.price === 0 || product.isFree
  const emoji   = product.type === 'notes' ? '📝' : product.type === 'book' ? '📚' : '🎯'
  const cover   = product.thumbnail || product.coverImage

  return (
    <div ref={ref} className={`product-card reveal${visible ? ' visible' : ''}`}>
      <div className="pc-thumb">
        {cover
          ? <img src={cover} alt={product.title} style={{ width:'100%', height:'100%', objectFit:'cover', position:'absolute', top:0, left:0 }} />
          : <span>{emoji}</span>}
        {product.badge && <span className="pc-badge">{product.badge}</span>}
        {purchased && (
          <span style={{
            position:'absolute', top:8, left:8, background:'#059669', color:'#fff',
            fontSize:'.6rem', fontWeight:800, padding:'3px 8px', borderRadius:20, zIndex:2,
          }}>✓ OWNED</span>
        )}
      </div>
      <div className="pc-body">
        <div className="pc-tag">{product.exam} · {product.subject}</div>
        <div className="pc-title">{product.title}</div>
        <div className="pc-desc" style={{ display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
          {product.description}
        </div>
        <div className="pc-rating">
          <span className="pc-stars">★★★★★</span>
          <span className="pc-rating-num">{product.rating || '5.0'}</span>
          <span>({product.ratingCount || 1} ratings)</span>
        </div>
        <div className="pc-footer">
          <div>
            <span className="pc-price">{isFree ? 'FREE' : `₹${product.price}`}</span>
            {!isFree && product.originalPrice && <span className="pc-price-orig">₹{product.originalPrice}</span>}
          </div>
          {purchased ? (
            <button className="pc-buy" onClick={onAlreadyPurchased} style={{ background:'linear-gradient(135deg,#059669,#047857)', boxShadow:'0 4px 12px rgba(5,150,105,.3)' }}>
              ✓ Purchased
            </button>
          ) : (
            <button className="pc-buy" onClick={async () => {
              if (isFree) {
                if (product.driveLink) window.open(product.driveLink, '_blank')
                else if (product.fileUrl) window.open(product.fileUrl, '_blank')
              } else {
                const u = localStorage.getItem('acadmix_user')
                if (!u) return alert('Please login to purchase items.')
                const user = JSON.parse(u)
                try {
                  const res = await fetch(`${API_URL}/orders/create-cashfree`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
                    body: JSON.stringify({ productId: product._id })
                  })
                  const data = await res.json()
                  if (!res.ok) throw new Error(data.message || 'Payment failed')
                  cashfree.checkout({ paymentSessionId: data.payment_session_id, redirectTarget: '_self' })
                } catch (err) { alert(err.message) }
              }
            }}>
              {isFree ? 'Get Now' : 'Buy Now'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── CBT Test Card ── */
function CBTCard({ test }) {
  const navigate = useNavigate()
  const ref = useRef(null)
  const visible = useReveal(ref)

  return (
    <div
      ref={ref}
      className={`product-card reveal${visible ? ' visible' : ''}`}
      style={{ cursor: 'default' }}
    >
      <div className="pc-thumb" style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)' }}>
        <span style={{ fontSize: '2.5rem' }}>📝</span>
        <span className="pc-badge" style={{ background: '#10B981' }}>CBT LIVE</span>
      </div>
      <div className="pc-body">
        <div className="pc-tag">{test.exam} · {test.subject}</div>
        <div className="pc-title">{test.title}</div>
        <div className="pc-desc" style={{ display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
          {test.description}
        </div>
        <div className="pc-rating">
          <span style={{ fontSize: '.78rem', color: '#6B7280' }}>
            ⏱ {test.durationMinutes} min &nbsp;·&nbsp; {test.questions?.length} Questions
          </span>
        </div>
        <div className="pc-footer">
          <div>
            <span className="pc-price" style={{ color: '#10B981' }}>FREE</span>
          </div>
          <button
            className="pc-buy"
            style={{ background: 'linear-gradient(135deg,#4F46E5,#7C3AED)', boxShadow: '0 4px 12px rgba(79,70,229,.35)' }}
            onClick={() => navigate(`/cbt/${test._id}`)}
          >
            Start Test →
          </button>
        </div>
      </div>
    </div>
  )
}

const TYPE_META = {
  notes:       { label: 'Notes',       tag: 'NOTES',       emoji: '📝', desc: 'Chapter-wise, exam-focused notes by subject experts' },
  book:        { label: 'Books',       tag: 'BOOKS',       emoji: '📚', desc: 'PYQ books, reference books and eBooks — instant digital access' },
  test_series: { label: 'Test Series', tag: 'TEST SERIES', emoji: '🎯', desc: 'NTA-pattern tests with detailed analysis and rank prediction' },
}

const EXAM_META = {
  NEET:   { label: 'NEET Resources',        desc: 'Complete NEET preparation material — Physics, Chemistry & Biology' },
  JEE:    { label: 'JEE Resources',         desc: 'Complete JEE preparation material — Physics, Chemistry & Maths' },
  Boards: { label: 'Board Exam Resources',  desc: 'Class 11 & 12 board exam notes, books and practice papers' },
}

const EXAMS    = ['All', 'NEET', 'JEE', 'Boards']
const SUBJECTS = ['All', 'Physics', 'Chemistry', 'Biology', 'Maths', 'English', 'Others']
const SORTS    = [
  { value: 'default',  label: 'Default' },
  { value: 'price-lo', label: 'Price: Low → High' },
  { value: 'price-hi', label: 'Price: High → Low' },
  { value: 'rating',   label: 'Top Rated' },
  { value: 'newest',   label: 'Newest' },
]

/**
 * Generic product listing page.
 * filterType: 'notes' | 'book' | 'test_series'
 * filterExam:  'NEET'  | 'JEE' | 'Boards'
 */
export default function ProductListPage({ filterType, filterExam, defaultTab = 'products' }) {
  const [all, setAll]                   = useState([])
  const [cbtTests, setCbtTests]         = useState([])
  const [purchasedIds, setPurchasedIds] = useState(new Set())
  const [exam, setExam]                 = useState('All')
  const [subject, setSubject]           = useState('All')
  const [sort, setSort]                 = useState('default')
  const [searchParams, setSearchParams] = useSearchParams()
  const search = searchParams.get('search') || ''
  const setSearch = (val) => {
    const params = new URLSearchParams(searchParams)
    if (val) {
      params.set('search', val)
    } else {
      params.delete('search')
    }
    setSearchParams(params, { replace: true })
  }
  const [toast, setToast]         = useState(false)
  const [activeTab, setActiveTab] = useState(defaultTab)

  const meta = filterType ? TYPE_META[filterType] : EXAM_META[filterExam]
  const isTestSeriesPage = filterType === 'test_series'

  useEffect(() => {
    getProducts().then(setAll)
    const u = localStorage.getItem('acadmix_user')
    if (!u) return
    const user = JSON.parse(u)
    fetch(`${API_URL}/orders/my`, { headers: { Authorization: `Bearer ${user.token}` } })
      .then(r => r.json())
      .then(orders => {
        if (!Array.isArray(orders)) return
        setPurchasedIds(new Set(orders.filter(o => o.status === 'completed' && o.product?._id).map(o => o.product._id)))
      })
      .catch(() => {})
  }, [])

  // Fetch CBT tests only when on the Test Series page
  useEffect(() => {
    if (!isTestSeriesPage) return
    fetch(`${API_URL}/cbt`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setCbtTests(data) })
      .catch(() => {})
  }, [isTestSeriesPage])

  const showToast = () => { setToast(true); setTimeout(() => setToast(false), 3500) }

  let items = all

  // Primary filter
  if (filterType) items = items.filter(p => p.type === filterType)
  if (filterExam) items = items.filter(p => p.exam === filterExam)

  // Secondary filters
  if (exam    !== 'All') items = items.filter(p => p.exam    === exam)
  if (subject !== 'All') items = items.filter(p => p.subject === subject)
  if (search.trim())     items = items.filter(p =>
    p.title?.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase())
  )

  // Sort
  if (sort === 'price-lo') items = [...items].sort((a, b) => (a.price || 0) - (b.price || 0))
  if (sort === 'price-hi') items = [...items].sort((a, b) => (b.price || 0) - (a.price || 0))
  if (sort === 'rating')   items = [...items].sort((a, b) => (b.rating || 0) - (a.rating || 0))
  if (sort === 'newest')   items = [...items].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  return (
    <>
      {/* Already-purchased toast */}
      {toast && (
        <div style={{
          position:'fixed', bottom:28, left:'50%', transform:'translateX(-50%)',
          background:'#1E293B', color:'#fff', padding:'13px 24px', borderRadius:12,
          zIndex:9999, display:'flex', alignItems:'center', gap:12,
          boxShadow:'0 8px 30px rgba(0,0,0,.35)', fontSize:'.88rem', fontWeight:600,
          animation:'fadeInUp .25s ease', whiteSpace:'nowrap',
        }}>
          <span>✅</span> You already own this!
          <a href="/purchases" style={{ color:'#A78BFA', textDecoration:'none', fontWeight:700, borderBottom:'1px solid rgba(167,139,250,.4)' }}>
            Go to My Purchases →
          </a>
        </div>
      )}

      {/* Page header */}
      <div style={{ padding:'32px 24px 0', background:'#fff', borderBottom:'1px solid #E5E7EB' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
          <span style={{ fontSize:'1.6rem' }}>{meta?.emoji || '📦'}</span>
          <div>
            <h1 style={{ fontSize:'1.5rem', fontWeight:800, color:'#111827', margin:0, letterSpacing:'-.02em' }}>
              {meta?.label || 'Resources'}
            </h1>
            <p style={{ color:'#6B7280', fontSize:'.85rem', margin:'3px 0 0' }}>{meta?.desc}</p>
          </div>
        </div>

        {/* Tab Switcher — only for Test Series */}
        {isTestSeriesPage && (
          <div style={{ display: 'flex', gap: 4, marginTop: 16 }}>
            <button
              onClick={() => setActiveTab('products')}
              style={{
                padding: '9px 20px', border: 'none', cursor: 'pointer',
                fontWeight: 700, fontSize: '.85rem', transition: 'all .2s',
                background: activeTab === 'products' ? '#fff' : 'transparent',
                color: activeTab === 'products' ? '#4F46E5' : '#6B7280',
                borderBottom: activeTab === 'products' ? '2px solid #4F46E5' : '2px solid transparent',
              }}
            >
              📦 Test Series Packs
            </button>
            <button
              onClick={() => setActiveTab('cbt')}
              style={{
                padding: '9px 20px', border: 'none', cursor: 'pointer',
                fontWeight: 700, fontSize: '.85rem', transition: 'all .2s',
                background: activeTab === 'cbt' ? '#fff' : 'transparent',
                color: activeTab === 'cbt' ? '#4F46E5' : '#6B7280',
                borderBottom: activeTab === 'cbt' ? '2px solid #4F46E5' : '2px solid transparent',
                position: 'relative',
              }}
            >
              📝 CBT Tests
              {cbtTests.length > 0 && (
                <span style={{
                  marginLeft: 6, background: '#4F46E5', color: '#fff',
                  borderRadius: 12, padding: '1px 7px', fontSize: '.65rem', fontWeight: 800,
                }}>
                  {cbtTests.length}
                </span>
              )}
            </button>
          </div>
        )}

        {/* Filters row — only for products tab */}
        {(!isTestSeriesPage || activeTab === 'products') && (
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', paddingTop:16, paddingBottom:14 }}>
            <div style={{ display:'flex', alignItems:'center', gap:7, background:'#F9FAFB', border:'1px solid #E5E7EB', borderRadius:8, padding:'7px 12px', flex:1, minWidth:180 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input
                placeholder="Search..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ border:'none', background:'none', outline:'none', fontSize:'.83rem', color:'#111827', width:'100%', fontFamily:'Inter,sans-serif' }}
              />
            </div>
            {!filterExam && (
              <select value={exam} onChange={e => setExam(e.target.value)} style={selStyle}>
                {EXAMS.map(e => <option key={e}>{e}</option>)}
              </select>
            )}
            <select value={subject} onChange={e => setSubject(e.target.value)} style={selStyle}>
              {SUBJECTS.map(s => <option key={s}>{s}</option>)}
            </select>
            <select value={sort} onChange={e => setSort(e.target.value)} style={selStyle}>
              {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        )}

        {isTestSeriesPage && activeTab === 'cbt' && <div style={{ height: 14 }} />}
      </div>

      {/* Results */}
      <div style={{ padding:'20px 24px 48px' }}>

        {/* CBT Tab Content */}
        {isTestSeriesPage && activeTab === 'cbt' && (
          <>
            <div style={{ fontSize:'.78rem', color:'#6B7280', marginBottom:14 }}>
              {cbtTests.length} Computer Based Test{cbtTests.length !== 1 ? 's' : ''} available
            </div>
            {cbtTests.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📝</div>
                <h3>No CBT Tests yet</h3>
                <p>CBT tests will appear here once published by the admin.</p>
              </div>
            ) : (
              <div className="cards-grid">
                {cbtTests.map(t => <CBTCard key={t._id} test={t} />)}
              </div>
            )}
          </>
        )}

        {/* Products Tab Content */}
        {(!isTestSeriesPage || activeTab === 'products') && (
          <>
            <div style={{ fontSize:'.78rem', color:'#6B7280', marginBottom:14 }}>
              {items.length} result{items.length !== 1 ? 's' : ''}
            </div>
            {items.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🔍</div>
                <h3>No results found</h3>
                <p>Try adjusting your filters or search term.</p>
              </div>
            ) : (
              <div className="cards-grid">
                {items.map(p => (
                  <ProductCard
                    key={p._id}
                    product={p}
                    purchased={purchasedIds.has(p._id)}
                    onAlreadyPurchased={showToast}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}

const selStyle = {
  background:'#F9FAFB', border:'1px solid #E5E7EB', borderRadius:8,
  padding:'7px 10px', fontSize:'.8rem', color:'#374151',
  outline:'none', cursor:'pointer', fontFamily:'Inter,sans-serif',
}
