import { useState, useRef, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { saveProduct, API_URL, getToken } from '../../store/store'

const SUBJECTS = ['Physics','Chemistry','Biology','Maths','English','History','Geography','Others']
const EXAMS    = ['NEET','JEE','Boards']
const TYPES    = ['notes','book','test_series']
const TYPE_LABELS = { notes:'Notes', book:'Book / eBook', test_series:'Test Series' }

function Toast({ msg, onClose }) {
  return (
    <div className="adm-toast">
      <span>✅</span> {msg}
      <button onClick={onClose} style={{ background:'none',border:'none',cursor:'pointer',color:'#9CA3AF',marginLeft:4 }}>✕</button>
    </div>
  )
}

export default function AdminUpload({ editProduct = null }) {
  const nav = useNavigate()
  const [searchParams] = useSearchParams()
  const editId = searchParams.get('edit')
  const fileRef = useRef()

  const [form, setForm] = useState(editProduct || {
    title: '', description: '', type: 'notes', exam: 'NEET',
    subject: 'Physics', price: '', isFree: true,
    driveLink: '', tags: [], badge: '', isFeatured: false,
  })
  const [coverUrl, setCoverUrl]     = useState(editProduct?.thumbnail || editProduct?.coverImage || '')
  const [tagInput, setTagInput]     = useState('')
  const [loading, setLoading]       = useState(false)
  const [toast, setToast]           = useState('')
  const [pdfFile, setPdfFile]       = useState(null)
  const [existingFileUrl, setExistingFileUrl] = useState(editProduct?.fileUrl || '')

  useEffect(() => {
    if (!editId) return
    const fetchProduct = async () => {
      try {
        const res = await fetch(`${API_URL}/products/${editId}`)
        const data = await res.json()
        if (res.ok) {
          setForm(data)
          setCoverUrl(data.thumbnail || data.coverImage || '')
          setExistingFileUrl(data.fileUrl || '')
        }
      } catch (err) {
        console.error('Error fetching product for editing:', err)
      }
    }
    fetchProduct()
  }, [editId])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  /* Cover image → Base64 (persists in localStorage) */
  const onCover = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      alert('Image too large. Please use an image under 2MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      setCoverUrl(ev.target.result) // base64 string
    }
    reader.readAsDataURL(file)
  }

  /* Tags */
  const addTag = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault()
      const tag = tagInput.trim().toLowerCase().replace(/,/g, '')
      if (!form.tags.includes(tag)) set('tags', [...form.tags, tag])
      setTagInput('')
    }
  }
  const removeTag = (tag) => set('tags', form.tags.filter(t => t !== tag))

  /* Submit */
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return alert('Title is required')
    if (form.isFree && !form.driveLink?.trim()) return alert('Google Drive link is required for free content')
    // For paid: need a file if it's a new product OR if no existing file URL
    const isEditing = !!(editId || editProduct?._id)
    if (!form.isFree && !pdfFile && !existingFileUrl) {
      return alert('Please select a PDF file to upload')
    }

    setLoading(true)

    let fileUrl = existingFileUrl || form.fileUrl || ''

    // Upload PDF if a new file is chosen
    if (!form.isFree && pdfFile) {
      try {
        const formData = new FormData()
        formData.append('file', pdfFile)

        const res = await fetch(`${API_URL}/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${getToken()}` },
          body: formData,
        })

        const data = await res.json()
        if (res.ok) {
          fileUrl = data.fileUrl
        } else {
          alert('Upload failed: ' + data.message)
          setLoading(false)
          return
        }
      } catch (err) {
        alert('Upload error: ' + err.message)
        setLoading(false)
        return
      }
    }

    const product = {
      ...form,
      _id: form._id || editId || editProduct?._id || editProduct?.id,
      thumbnail:   coverUrl || '',
      price:       form.isFree ? 0 : Number(form.price) || 0,
      uploadDate:  form.uploadDate || editProduct?.uploadDate || new Date().toISOString(),
      isPublished: true,
      fileUrl:     form.isFree ? (form.driveLink || '') : fileUrl,
      driveLink:   form.isFree ? (form.driveLink || '') : '',
    }
    try {
      await saveProduct(product)
      setLoading(false)
      setToast(editId || editProduct ? 'Product updated successfully!' : 'Content published successfully!')
      setTimeout(() => { nav('/admin/products') }, 1500)
    } catch (err) {
      setLoading(false)
      alert(err.message || 'Failed to save product to database')
    }
  }

  /* Tag colors */
  const examColor = { NEET:'tag-neet', JEE:'tag-jee', Boards:'tag-boards' }
  const typeColor  = { notes:'tag-notes', book:'tag-book', test_series:'tag-test' }

  return (
    <>
      {toast && <Toast msg={toast} onClose={() => setToast('')} />}

      <form onSubmit={handleSubmit}>
        <div className="adm-upload-wrap">
          {/* ── Left: Form ── */}
          <div className="adm-form-card">
            <h2>📝 {editId || editProduct ? 'Edit Content' : 'Upload New Content'}</h2>

            <div className="adm-form">
              {/* Type + Exam + Subject */}
              <div className="adm-form-row-3">
                <div>
                  <label className="adm-label">Content Type <span>*</span></label>
                  <select className="adm-select" value={form.type} onChange={e => set('type', e.target.value)}>
                    {TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="adm-label">Exam Category <span>*</span></label>
                  <select className="adm-select" value={form.exam} onChange={e => set('exam', e.target.value)}>
                    {EXAMS.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
                <div>
                  <label className="adm-label">Subject <span>*</span></label>
                  <select className="adm-select" value={form.subject} onChange={e => set('subject', e.target.value)}>
                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="adm-label">Title <span>*</span></label>
                <input
                  className="adm-input" placeholder="e.g. Human Physiology — Complete Notes"
                  value={form.title} onChange={e => set('title', e.target.value)}
                />
              </div>

              {/* Description */}
              <div>
                <label className="adm-label">Short Description</label>
                <textarea
                  className="adm-textarea"
                  placeholder="Describe what this resource covers..."
                  value={form.description} onChange={e => set('description', e.target.value)}
                />
              </div>

              {/* Price + Badge + Featured */}
              <div className="adm-form-row">
                <div>
                  <label className="adm-label">Badge <span style={{fontWeight:400,color:'#9CA3AF'}}>(optional)</span></label>
                  <select className="adm-select" value={form.badge} onChange={e => set('badge', e.target.value)}>
                    <option value="">None</option>
                    <option value="Bestseller">Bestseller</option>
                    <option value="New">New</option>
                    <option value="Top Rated">Top Rated</option>
                    <option value="Popular">Popular</option>
                    <option value="Must Have">Must Have</option>
                  </select>
                </div>
                <div>
                  <label className="adm-label">Featured on Homepage</label>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:10 }}>
                    <input type="checkbox" id="featured" checked={form.isFeatured} onChange={e => set('isFeatured', e.target.checked)} style={{ width:16,height:16,accentColor:'#6D28D9' }} />
                    <label htmlFor="featured" style={{ fontSize:'.83rem', color:'#374151', cursor:'pointer' }}>Show on homepage</label>
                  </div>
                </div>
              </div>

              {/* Free / Paid toggle */}
              <div>
                <label className="adm-label">Access Type <span>*</span></label>
                <div className="adm-toggle-wrap">
                  <button type="button" className={`adm-toggle-btn${form.isFree ? ' active-free' : ''}`} onClick={() => set('isFree', true)}>
                    ✅ Free
                  </button>
                  <button type="button" className={`adm-toggle-btn${!form.isFree ? ' active-paid' : ''}`} onClick={() => set('isFree', false)}>
                    💎 Paid
                  </button>
                </div>
              </div>

              {/* Conditional: Drive Link or Paid notice */}
              {form.isFree ? (
                <div className="adm-drive-box">
                  <label className="adm-label" style={{ color:'#065F46' }}>
                    Google Drive Link <span>*</span>
                    <span style={{ fontWeight:400, color:'#6EE7B7', marginLeft:6 }}>
                      (Upload to Drive → Share → Anyone with link → Paste here)
                    </span>
                  </label>
                  <input
                    className="adm-input"
                    placeholder="https://drive.google.com/file/d/..."
                    value={form.driveLink}
                    onChange={e => set('driveLink', e.target.value)}
                  />
                </div>
              ) : (
                <>
                  <div>
                    <label className="adm-label">Price (₹) <span>*</span></label>
                    <input
                      className="adm-input" type="number" placeholder="149"
                      value={form.price} onChange={e => set('price', e.target.value)}
                    />
                  </div>
                  <div className="adm-paid-box" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: 16, borderRadius: 8, marginTop: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                      <span className="adm-paid-box-icon" style={{ fontSize: '1.5rem' }}>📁</span>
                      <h4 style={{ margin: 0, color: '#1E293B', fontSize: '.95rem' }}>Direct PDF Upload (Vercel)</h4>
                    </div>
                    <p style={{ color: '#64748B', fontSize: '.8rem', margin: '0 0 12px 0' }}>Securely host your paid files on Vercel Blob.</p>
                    <input 
                      type="file" 
                      accept="application/pdf"
                      onChange={e => setPdfFile(e.target.files[0])}
                      style={{ fontSize: '.8rem', width: '100%' }}
                    />
                    {(existingFileUrl || editProduct?.fileUrl) && !pdfFile && (
                      <div style={{ marginTop: 8, fontSize: '.75rem', color: '#059669' }}>
                        ✓ File already uploaded. Select a new file to replace it.
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Tags */}
              <div>
                <label className="adm-label">Tags <span style={{ fontWeight:400,color:'#9CA3AF' }}>(press Enter or comma to add)</span></label>
                <div className="adm-tags-input" onClick={() => document.getElementById('tag-input').focus()}>
                  {form.tags.map(t => (
                    <span key={t} className="adm-tag-pill">
                      {t}
                      <button type="button" onClick={() => removeTag(t)}>×</button>
                    </span>
                  ))}
                  <input
                    id="tag-input"
                    placeholder={form.tags.length ? '' : 'e.g. jee, physics, class12'}
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={addTag}
                  />
                </div>
              </div>

              {/* Cover image */}
              <div>
                <label className="adm-label">Cover Image <span style={{ fontWeight:400,color:'#9CA3AF' }}>(optional)</span></label>
                {coverUrl ? (
                  <div style={{ position:'relative' }}>
                    <img src={coverUrl} alt="cover" className="adm-cover-preview" />
                    <button
                      type="button"
                      onClick={() => setCoverUrl('')}
                      style={{ position:'absolute',top:8,right:8,background:'rgba(0,0,0,.5)',color:'#fff',border:'none',borderRadius:'50%',width:26,height:26,cursor:'pointer',fontSize:'.9rem' }}
                    >✕</button>
                  </div>
                ) : (
                  <div className="adm-cover-upload">
                    <input ref={fileRef} type="file" accept="image/*" onChange={onCover} />
                    <div className="adm-cover-upload-icon">🖼</div>
                    <strong>Click to upload cover image</strong>
                    <p>PNG, JPG up to 5MB</p>
                  </div>
                )}
              </div>

              {/* Submit */}
              <button className="adm-publish-btn" type="submit" disabled={loading}>
                {loading ? '⏳ Publishing...' : '🚀 Publish Content'}
              </button>
            </div>
          </div>

          {/* ── Right: Live Preview ── */}
          <div className="adm-preview-card">
            <div className="adm-preview-card-head">
              <h3>👁 Live Preview</h3>
            </div>
            <div className="adm-preview-body">
              <div className="adm-preview-thumb">
                {coverUrl ? <img src={coverUrl} alt="preview" /> : <span>📄</span>}
              </div>
              <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:8 }}>
                {form.exam && <span className={`adm-pc-tag ${examColor[form.exam]}`}>{form.exam}</span>}
                {form.type && <span className={`adm-pc-tag ${typeColor[form.type]}`}>{TYPE_LABELS[form.type]}</span>}
                {form.isFree
                  ? <span className="adm-pc-tag tag-free">FREE</span>
                  : <span className="adm-pc-tag tag-paid">₹{form.price || '—'}</span>
                }
              </div>
              <div className="adm-preview-title">{form.title || 'Your product title will appear here'}</div>
              <div className="adm-preview-desc">{form.description || 'Description will appear here...'}</div>
              {form.tags.length > 0 && (
                <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginTop:8 }}>
                  {form.tags.map(t => (
                    <span key={t} style={{ fontSize:'.68rem', background:'#F3F4F6', color:'#374151', padding:'2px 8px', borderRadius:20 }}>#{t}</span>
                  ))}
                </div>
              )}
              <div style={{ marginTop:14, paddingTop:14, borderTop:'1px solid #E5E7EB', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:'.72rem', color:'#9CA3AF' }}>{form.subject}</span>
                {form.badge && <span style={{ fontSize:'.65rem', fontWeight:700, background:'#FEF3C7', color:'#92400E', padding:'2px 8px', borderRadius:20 }}>{form.badge}</span>}
              </div>
            </div>
          </div>
        </div>
      </form>
    </>
  )
}
