import { useRef, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useReveal, useCounter, useCountdown } from '../hooks'
import { load } from '@cashfreepayments/cashfree-js'
import { getProducts, API_URL } from '../store/store'

let cashfree;
const initCashfree = async () => {
  cashfree = await load({ mode: import.meta.env.VITE_CASHFREE_MODE || 'sandbox' })
}
initCashfree()


const WHY = [
  { icon: '✓', title: 'High Quality Content', desc: 'Notes and books written by subject matter experts and IIT/AIIMS toppers.' },
  { icon: '🎯', title: 'Exam-Focused', desc: 'Every resource is aligned to the exact exam pattern — no fluff, pure value.' },
  { icon: '⚡', title: 'Instant Digital Access', desc: 'Purchase once and access instantly from any device, anytime.' },
  { icon: '💰', title: 'Affordable Pricing', desc: 'Premium quality at student-friendly prices. One-time purchase, lifetime access.' },
]

/* ─── PRODUCT CARD ─── */
function ProductCard({ product, delay = '0s', purchased = false, onAlreadyPurchased }) {
  const ref = useRef(null)
  const visible = useReveal(ref)
  const isFree = product.price === 0 || product.isFree
  const emoji = product.type === 'notes' ? '📝' : product.type === 'book' ? '📚' : '🎯'
  const cover = product.thumbnail || product.coverImage

  return (
    <div ref={ref} className={`product-card reveal${visible ? ' visible' : ''}`} style={{ transitionDelay: delay }}>
      <div className="pc-thumb">
        {cover ? <img src={cover} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }} /> : <span>{emoji}</span>}
        {product.badge && <span className="pc-badge">{product.badge}</span>}
        {purchased && (
          <span style={{
            position: 'absolute', top: 8, left: 8, background: '#059669', color: '#fff',
            fontSize: '.6rem', fontWeight: 800, padding: '3px 8px', borderRadius: 20,
            letterSpacing: .5, zIndex: 2, boxShadow: '0 2px 8px rgba(5,150,105,.4)'
          }}>✓ OWNED</span>
        )}
      </div>
      <div className="pc-body">
        <div className="pc-tag">{product.exam}</div>
        <div className="pc-title">{product.title}</div>
        <div className="pc-desc" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
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
            /* Already purchased — non-clickable green badge button */
            <button
              className="pc-buy"
              onClick={onAlreadyPurchased}
              style={{
                background: 'linear-gradient(135deg,#059669,#047857)',
                cursor: 'pointer', opacity: 1,
                boxShadow: '0 4px 12px rgba(5,150,105,.3)'
              }}
            >
              ✓ Purchased
            </button>
          ) : (
            <button
              className="pc-buy"
              onClick={async () => {
                if (isFree) {
                  if (product.fileUrl) window.open(product.fileUrl, '_blank')
                  else if (product.driveLink) window.open(product.driveLink, '_blank')
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
                    cashfree.checkout({
                      paymentSessionId: data.payment_session_id,
                      redirectTarget: '_self'
                    })
                  } catch (err) {
                    alert(err.message)
                  }
                }
              }}
            >
              {isFree ? 'Get Now' : 'Buy Now'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── COUNTDOWN CARD ─── */
function CdCard({ exam, date, cls }) {
  const { d, h, m, s } = useCountdown(date)
  const p = n => String(n).padStart(2, '0')
  return (
    <div className="cd-card">
      <div className="cd-left">
        <div className={`cd-exam-tag ${cls}`}><span className={`cd-dot ${cls}`} />Live</div>
        <div className="cd-exam-name">{exam}</div>
        <div className="cd-exam-sub">Stay consistent. Every day counts.</div>
      </div>
      <div className="cd-timer">
        {[{ n: String(d).padStart(3, '0'), l: 'Days' }, { n: p(h), l: 'Hours' }, { n: p(m), l: 'Mins' }, { n: p(s), l: 'Secs' }].map((t, i, arr) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div className="cd-block">
              <span className="cd-num">{t.n}</span>
              <span className="cd-lbl">{t.l}</span>
            </div>
            {i < arr.length - 1 && <span className="cd-sep">:</span>}
          </span>
        ))}
      </div>
    </div>
  )
}

/* ─── HERO ─── */
function Hero() {
  const ref = useRef(null)
  const visible = useReveal(ref)

  return (
    <section className="hero" ref={ref}>
      <div className={`hero-left reveal${visible ? ' visible' : ''}`}>
        <div className="hero-tag"><span className="hero-tag-dot" />Trusted by 10,000+ students</div>
        <h1 className="hero-title">
          Everything You Need to Crack<br className="mobile-br" />
          {' '}<span>NEET</span>, <span>JEE</span> &amp; <span>Boards</span>
        </h1>
        <p className="hero-sub">
          Premium notes, digital books and test series — organized in one place. Purchase once, access forever.
        </p>
        <div className="hero-actions">
          <Link to="/notes" className="btn-primary">Explore Resources</Link>
          <Link to="/test-series" className="btn-outline">Browse Test Series</Link>
        </div>
      </div>

      <div className={`hero-right reveal${visible ? ' visible' : ''}`} style={{ transitionDelay: '.15s' }}>
        <div className="hero-cards-cluster">
          {[
            { emoji: '📗', tag: 'NEET', title: 'Human Physiology Notes', price: '₹149', rating: '4.8', color: '#EDE9FE' },
            { emoji: '🎯', tag: 'JEE', title: 'JEE Mock Test Series', price: '₹349', rating: '4.9', color: '#FEE2E2' },
            { emoji: '📚', tag: 'NEET', title: 'NEET PYQ 20 Years Book', price: '₹199', rating: '4.9', color: '#D1FAE5' },
            { emoji: '📘', tag: 'Boards', title: 'Organic Chemistry Notes', price: '₹99', rating: '4.7', color: '#DBEAFE' },
            { emoji: '📊', tag: 'JEE', title: 'Chapter-wise Test Series', price: '₹249', rating: '4.8', color: '#FEF3C7' },
            { emoji: '📒', tag: 'Boards', title: 'Class 12 Science eBook', price: '₹179', rating: '4.7', color: '#FCE7F3' },
          ].map((c, i) => (
            <div key={i} className="hc-card" style={{ animationDelay: `${i * 0.08}s` }}>
              <div className="hc-thumb" style={{ background: c.color }}>
                <span>{c.emoji}</span>
              </div>
              <div className="hc-body">
                <span className="hc-tag">{c.tag}</span>
                <div className="hc-title">{c.title}</div>
                <div className="hc-footer">
                  <span className="hc-price">{c.price}</span>
                  <span className="hc-rating">★ {c.rating}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </section>
  )
}

/* ─── HOME PAGE ─── */
export default function Home() {
  const [products, setProducts] = useState([])
  const [purchasedIds, setPurchasedIds] = useState(new Set())
  const [toast, setToast] = useState(false)

  const statsRef = useRef(null)
  const visible = useReveal(statsRef)
  const students = useCounter(10000, visible)
  const items = useCounter(500, visible)
  const tests = useCounter(100, visible)

  useEffect(() => { getProducts().then(setProducts) }, [])

  // Fetch user's purchased product IDs so cards can show purchased state
  useEffect(() => {
    const u = localStorage.getItem('acadmix_user')
    if (!u) return
    const user = JSON.parse(u)
    fetch(`${API_URL}/orders/my`, { headers: { Authorization: `Bearer ${user.token}` } })
      .then(r => r.json())
      .then(orders => {
        if (!Array.isArray(orders)) return
        const ids = new Set(
          orders
            .filter(o => o.status === 'completed' && o.product?._id)
            .map(o => o.product._id)
        )
        setPurchasedIds(ids)
      })
      .catch(() => { })
  }, [])

  const showAlreadyPurchasedToast = () => {
    setToast(true)
    setTimeout(() => setToast(false), 3500)
  }

  return (
    <>
      {/* Already-purchased toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
          background: '#1E293B', color: '#fff', padding: '13px 24px',
          borderRadius: 12, zIndex: 9999, display: 'flex', alignItems: 'center', gap: 12,
          boxShadow: '0 8px 30px rgba(0,0,0,.35)', fontSize: '.88rem', fontWeight: 600,
          animation: 'fadeInUp .25s ease', whiteSpace: 'nowrap',
        }}>
          <span style={{ fontSize: '1.1rem' }}>✅</span>
          You already own this!
          <a href="/purchases" style={{
            color: '#A78BFA', textDecoration: 'none', fontWeight: 700,
            borderBottom: '1px solid rgba(167,139,250,.4)',
          }}>Go to My Purchases →</a>
        </div>
      )}

      <Hero />

      {/* Stats Counter Section (On next page scroll/fold) */}
      <section className="section-sm" id="stats-fold" ref={statsRef} style={{ background: '#fff', paddingTop: '56px', borderBottom: '1px solid var(--border)' }}>
        <div className="section-head centered reveal">
          <div className="section-tag">Impact</div>
          <h2 className="section-title">Trusted by Thousands of Aspirants</h2>
          <p className="section-sub">Real-time stats of students cracking exams with Acadmix resources</p>
        </div>
        <div className="hero-stats stats-fold-stats">
          <div className="hero-stat">
            <span className="hero-stat-num">{students.toLocaleString()}+</span>
            <span className="hero-stat-lbl">Active Students</span>
          </div>
          <div className="hero-stat-div" />
          <div className="hero-stat">
            <span className="hero-stat-num">{items.toLocaleString()}+</span>
            <span className="hero-stat-lbl">Curated Resources</span>
          </div>
          <div className="hero-stat-div" />
          <div className="hero-stat">
            <span className="hero-stat-num">{tests.toLocaleString()}+</span>
            <span className="hero-stat-lbl">Pattern Mock Tests</span>
          </div>
        </div>
      </section>

      {/* Recent Resources (Dynamic Live Products) */}
      {products.length > 0 && (
        <section className="section" style={{ background: '#F9FAFB', borderBottom: '1px solid var(--border)' }}>
          <div className="section-head centered reveal">
            <div className="section-tag">New Arrivals</div>
            <h2 className="section-title">Latest Resources</h2>
            <p className="section-sub">Freshly uploaded study material for your preparation</p>
          </div>
          <div className="cards-grid" style={{ padding: '0 24px', maxWidth: 1200, margin: '0 auto' }}>
            {products.slice(0, 3).map(p => (
              <ProductCard
                key={p._id}
                product={p}
                purchased={purchasedIds.has(p._id)}
                onAlreadyPurchased={showAlreadyPurchasedToast}
              />
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <Link to="/notes" className="btn-outline">View All Resources</Link>
          </div>
        </section>
      )}

      {/* Countdowns */}
      <section className="section-sm" id="countdown" style={{ paddingTop: '56px' }}>
        <div className="section-head reveal">
          <div className="section-tag">Countdown</div>
          <h2 className="section-title">Exam Countdowns</h2>
        </div>
        <div className="countdown-grid">
          <CdCard exam="RE NEET" date="2026-06-21T00:00:00" cls="neet" />
          <CdCard exam="JEE Main 2027 — Session 1" date="2027-01-15T00:00:00" cls="jee" />
        </div>
      </section>

      {/* Why Acadmix */}
      <section className="section">
        <div className="section-head centered reveal">
          <div className="section-tag">Why Acadmix</div>
          <h2 className="section-title">Why Students Choose Acadmix</h2>
          <p className="section-sub">Simple, affordable, and built entirely for exam success</p>
        </div>
        <div className="why-grid">
          {WHY.map((w, i) => (
            <div key={i} className="why-card reveal" style={{ transitionDelay: `${i * .08}s` }}>
              <div className="why-icon">{w.icon}</div>
              <div className="why-title">{w.title}</div>
              <div className="why-desc">{w.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="section-sm">
        <div className="cta-wrap reveal">
          <h2>Start Your Preparation Today</h2>
          <p>Join 10,000+ students who trust Acadmix for NEET, JEE and Boards preparation.</p>
          <div className="cta-btns">
            <Link to="/notes" className="btn-white">Browse Resources</Link>
            <Link to="/test-series" className="btn-outline-white">View Test Series</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <div className="footer-brand-logo">
              <div className="nav-logo-icon" style={{ width: 24, height: 24, borderRadius: 6, background: '#6D28D9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '.8rem', fontWeight: 800 }}>🎓</div>
              <span>Acadmix</span>
            </div>
            <p>Premium study resources for NEET, JEE and Board exam aspirants. Trusted by 10,000+ students.</p>
          </div>
          <div className="footer-col">
            <h4>Resources</h4>
            <Link to="/notes">Notes</Link>
            <Link to="/test-series">Test Series</Link>
            <Link to="/books">Books</Link>
            <Link to="/saved">Saved Items</Link>
          </div>
          <div className="footer-col">
            <h4>Exams</h4>
            <Link to="/neet">NEET Resources</Link>
            <Link to="/jee">JEE Resources</Link>
            <Link to="/boards">Boards Resources</Link>
          </div>
          <div className="footer-col">
            <h4>Company</h4>
            <a href="#">About</a>
            <a href="#">Blog</a>
            <a href="#">Contact</a>
            <a href="#">Refund Policy</a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2025 Acadmix. All rights reserved.</span>
          <span>Made for serious students 🎯</span>
        </div>
      </footer>
    </>
  )
}
