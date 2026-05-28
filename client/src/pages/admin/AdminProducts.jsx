import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getProducts, deleteProduct as delProduct } from '../../store/store'
import PDFReader from '../PDFReader'

const TYPE_LABELS = { notes: 'Notes', book: 'Book', test_series: 'Test Series' }
const ALL_FILTERS = ['all', 'notes', 'book', 'test_series', 'NEET', 'JEE', 'Boards']

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [reader, setReader] = useState(null) // { title, driveLink }

  const load = async () => setProducts(await getProducts())
  useEffect(() => { load() }, [])

  const handleDelete = async (id) => {
    if (!confirm('Delete this product? This cannot be undone.')) return
    try {
      await delProduct(id)
      load()
    } catch (err) { alert('Failed to delete product') }
  }

  const filtered = products.filter(p => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) || p.subject?.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || p.type === filter || p.exam === filter
    return matchSearch && matchFilter
  })

  const examColor = { NEET: 'tag-neet', JEE: 'tag-jee', Boards: 'tag-boards' }
  const typeColor = { notes: 'tag-notes', book: 'tag-book', test_series: 'tag-test' }

  return (
    <>
      {reader && <PDFReader title={reader.title} driveLink={reader.driveLink} onClose={() => setReader(null)} />}

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div className="adm-search-bar" style={{ minWidth: 250 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
          <input placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Link to="/admin/upload" className="adm-btn adm-btn-primary">+ Upload New</Link>
      </div>

      {/* Filters */}
      <div className="adm-filters">
        {ALL_FILTERS.map(f => (
          <button key={f} className={`adm-filter-btn${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>
            {f === 'all' ? 'All' : f === 'notes' ? 'Notes' : f === 'book' ? 'Books' : f === 'test_series' ? 'Test Series' : f}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: '.78rem', color: '#6B7280' }}>{filtered.length} products</span>
      </div>

      {filtered.length === 0 ? (
        <div className="adm-empty">
          <div className="adm-empty-icon">📦</div>
          <h3>{products.length === 0 ? 'No products yet' : 'No results found'}</h3>
          <p style={{ marginBottom: 16 }}>{products.length === 0 ? 'Start by uploading your first piece of content.' : 'Try a different search or filter.'}</p>
          {products.length === 0 && (
            <Link to="/admin/upload" className="adm-btn adm-btn-primary adm-btn-lg">Upload Content</Link>
          )}
        </div>
      ) : (
        <div className="adm-products-grid">
          {filtered.map(p => (
            <div key={p._id || p.id} className="adm-product-card">
              <div className="adm-pc-thumb">
                {p.thumbnail || p.coverImage
                  ? <img src={p.thumbnail || p.coverImage} alt={p.title} />
                  : <span>{p.type === 'notes' ? '📝' : p.type === 'book' ? '📚' : '🎯'}</span>
                }
                {p.badge && <span className="adm-pc-badge" style={{ background: '#FEF3C7', color: '#92400E' }}>{p.badge}</span>}
              </div>

              <div className="adm-pc-body">
                <div className="adm-pc-tags">
                  <span className={`adm-pc-tag ${examColor[p.exam]}`}>{p.exam}</span>
                  <span className={`adm-pc-tag ${typeColor[p.type]}`}>{TYPE_LABELS[p.type]}</span>
                  {p.isFree
                    ? <span className="adm-pc-tag tag-free">FREE</span>
                    : <span className="adm-pc-tag tag-paid">₹{p.price}</span>
                  }
                </div>
                <div className="adm-pc-title">{p.title}</div>
                <div className="adm-pc-desc">{p.description || '—'}</div>

                {/* Tags */}
                {p.tags?.length > 0 && (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
                    {p.tags.slice(0, 3).map(t => (
                      <span key={t} style={{ fontSize: '.62rem', background: '#F3F4F6', color: '#374151', padding: '1px 6px', borderRadius: 20 }}>#{t}</span>
                    ))}
                  </div>
                )}

                <div className="adm-pc-footer">
                  <span style={{ fontSize: '.7rem', color: '#9CA3AF' }}>
                    {new Date(p.createdAt || new Date()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  <div className="adm-pc-actions">
                    {p.isFree && p.driveLink && (
                      <button className="adm-btn adm-btn-success adm-btn-sm" onClick={() => setReader({ title: p.title, driveLink: p.driveLink })}>
                        👁 View
                      </button>
                    )}
                    <Link to={`/admin/upload?edit=${p._id || p.id}`} className="adm-btn adm-btn-outline adm-btn-sm">Edit</Link>
                    <button className="adm-btn adm-btn-danger adm-btn-sm" onClick={() => handleDelete(p._id || p.id)}>Del</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
