import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getProducts, deleteProduct as delProduct } from '../../store/store'
import PDFReader from '../PDFReader'

const TYPE_LABELS = { notes: 'Notes', book: 'Book', test_series: 'Test Series' }

export default function AdminMyUploads() {
  const [products, setProducts] = useState([])
  const [reader, setReader] = useState(null)

  const load = async () => setProducts(await getProducts())
  useEffect(() => { load() }, [])

  const handleDelete = async (id) => {
    if (!confirm('Delete this upload?')) return
    try {
      await delProduct(id)
      load()
    } catch (err) { alert('Failed to delete') }
  }

  const typeColor = { notes: 'tag-notes', book: 'tag-book', test_series: 'tag-test' }
  const examColor = { NEET: 'tag-neet', JEE: 'tag-jee', Boards: 'tag-boards' }

  const u = localStorage.getItem('acadmix_user')
  const user = u ? JSON.parse(u) : null
  const token = user?.token || ''

  return (
    <>
      {reader && <PDFReader title={reader.title} driveLink={reader.driveLink} onClose={() => setReader(null)} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: .95 + 'rem', fontWeight: 700, color: '#111827' }}>My Uploads</div>
          <div style={{ fontSize: .78 + 'rem', color: '#6B7280', marginTop: 3 }}>{products.length} items uploaded</div>
        </div>
        <Link to="/admin/upload" className="adm-btn adm-btn-primary">+ New Upload</Link>
      </div>

      {products.length === 0 ? (
        <div className="adm-empty">
          <div className="adm-empty-icon">🗂</div>
          <h3>No uploads yet</h3>
          <p>Upload your first note, book or test series.</p>
          <Link to="/admin/upload" className="adm-btn adm-btn-primary" style={{ marginTop: 14 }}>Upload Now</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {products.map(p => (
            <div key={p._id || p.id} style={{
              background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12,
              padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16,
              boxShadow: '0 1px 4px rgba(0,0,0,.06)', transition: 'box-shadow .2s',
            }}>
              {/* Thumb */}
              <div style={{
                width: 52, height: 52, borderRadius: 10, flexShrink: 0,
                background: 'linear-gradient(135deg,#EDE9FE,#DDD6FE)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', fontSize: '1.4rem',
              }}>
                {p.thumbnail || p.coverImage ? <img src={p.thumbnail || p.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (p.type === 'notes' ? '📝' : p.type === 'book' ? '📚' : '🎯')}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '.88rem', color: '#111827', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</div>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  <span className={`adm-pc-tag ${examColor[p.exam]}`}>{p.exam}</span>
                  <span className={`adm-pc-tag ${typeColor[p.type]}`}>{TYPE_LABELS[p.type]}</span>
                  {p.isFree ? <span className="adm-pc-tag tag-free">FREE</span> : <span className="adm-pc-tag tag-paid">₹{p.price}</span>}
                  {p.badge && <span style={{ fontSize: '.62rem', background: '#FEF3C7', color: '#92400E', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>{p.badge}</span>}
                </div>
              </div>

              {/* Date */}
              <div style={{ fontSize: '.75rem', color: '#9CA3AF', flexShrink: 0, textAlign: 'right' }}>
                <div>{new Date(p.createdAt || new Date()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                <div style={{ marginTop: 2 }}>{p.subject}</div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                {p.type !== 'test_series' && (p.isFree ? p.driveLink : p.fileUrl) && (
                  <button className="adm-btn adm-btn-success adm-btn-sm" onClick={() => {
                    const url = p.isFree 
                      ? p.driveLink 
                      : `http://localhost:5000/api/products/${p._id || p.id}/view?token=${token}`
                    setReader({ title: p.title, driveLink: url })
                  }}>
                    👁 Preview
                  </button>
                )}
                <Link to={`/admin/upload?edit=${p._id || p.id}`} className="adm-btn adm-btn-outline adm-btn-sm">Edit</Link>
                <button className="adm-btn adm-btn-danger adm-btn-sm" onClick={() => handleDelete(p._id || p.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
