import { useState, useEffect } from 'react'
import { getProducts } from '../../store/store' // Assuming we can use store API URL
import { API_URL } from '../../store/store'

export default function AdminCBT() {
  const [tests, setTests] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    exam: 'NEET',
    subject: '',
    pdfUrl: '',
    durationMinutes: 180,
    questions: []
  })
  
  const [uploading, setUploading] = useState(false)
  const [numQuestions, setNumQuestions] = useState(1)

  useEffect(() => {
    fetchTests()
  }, [])

  const fetchTests = async () => {
    try {
      const res = await fetch(`${API_URL}/cbt`)
      const data = await res.json()
      if (Array.isArray(data)) setTests(data)
    } catch (err) {
      console.error(err)
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    
    try {
      const token = JSON.parse(localStorage.getItem('acadmix_user'))?.token
      const res = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd
      })
      const data = await res.json()
      if (data.url) {
        setFormData(prev => ({ ...prev, pdfUrl: data.url }))
      }
    } catch (err) {
      alert('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleGenerateQuestions = () => {
    const arr = []
    for (let i = 1; i <= numQuestions; i++) {
      arr.push({ questionNumber: i, correctOption: 'A' })
    }
    setFormData(prev => ({ ...prev, questions: arr }))
  }

  const handleOptionChange = (qIndex, value) => {
    const newQ = [...formData.questions]
    newQ[qIndex].correctOption = value
    setFormData(prev => ({ ...prev, questions: newQ }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const token = JSON.parse(localStorage.getItem('acadmix_user'))?.token
      const res = await fetch(`${API_URL}/cbt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        setShowForm(false)
        fetchTests()
        setFormData({ title: '', description: '', exam: 'NEET', subject: '', pdfUrl: '', durationMinutes: 180, questions: [] })
      } else {
        const d = await res.json()
        alert(d.message || 'Failed')
      }
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>CBT Tests</h1>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New CBT Test'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ background: '#fff', padding: 20, borderRadius: 8, marginBottom: 20 }}>
          <div style={{ display: 'grid', gap: 10, marginBottom: 15 }}>
            <input placeholder="Title" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} style={{ padding: 10 }} />
            <input placeholder="Description" required value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} style={{ padding: 10 }} />
            
            <div style={{ display: 'flex', gap: 10 }}>
              <select value={formData.exam} onChange={e => setFormData({ ...formData, exam: e.target.value })} style={{ padding: 10, flex: 1 }}>
                <option value="NEET">NEET</option>
                <option value="JEE">JEE</option>
                <option value="Boards">Boards</option>
                <option value="All">All</option>
              </select>
              <input placeholder="Subject" required value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} style={{ padding: 10, flex: 1 }} />
              <input type="number" placeholder="Duration (mins)" required value={formData.durationMinutes} onChange={e => setFormData({ ...formData, durationMinutes: e.target.value })} style={{ padding: 10, flex: 1 }} />
            </div>

            <div style={{ padding: 10, border: '1px dashed #ccc' }}>
              <label>Upload PDF Paper: </label>
              <input type="file" accept="application/pdf" onChange={handleFileUpload} disabled={uploading} />
              {uploading && <span>Uploading...</span>}
              {formData.pdfUrl && <span style={{ color: 'green', marginLeft: 10 }}>Uploaded!</span>}
            </div>

            <div style={{ padding: 10, border: '1px solid #eee', background: '#fafafa' }}>
              <h3>Answer Key Setup</h3>
              <div style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'center' }}>
                <input type="number" value={numQuestions} onChange={e => setNumQuestions(e.target.value)} min="1" max="200" style={{ padding: 5 }} />
                <button type="button" onClick={handleGenerateQuestions} style={{ padding: '5px 10px' }}>Generate Bubbles</button>
              </div>

              {formData.questions.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 10, maxHeight: 300, overflowY: 'auto' }}>
                  {formData.questions.map((q, idx) => (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', fontSize: 12 }}>
                      <span>Q{q.questionNumber}</span>
                      <select value={q.correctOption} onChange={(e) => handleOptionChange(idx, e.target.value)} style={{ padding: 2 }}>
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                        <option value="D">D</option>
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <button type="submit" className="btn-primary" disabled={!formData.pdfUrl || formData.questions.length === 0}>
            Save CBT Test
          </button>
        </form>
      )}

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Exam</th>
              <th>Subject</th>
              <th>Questions</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {tests.map(t => (
              <tr key={t._id}>
                <td>{t.title}</td>
                <td>{t.exam}</td>
                <td>{t.subject}</td>
                <td>{t.questions?.length}</td>
                <td>
                  <a href={`/cbt/${t._id}`} target="_blank" rel="noreferrer" style={{ color: '#4F46E5', textDecoration: 'none' }}>Preview</a>
                </td>
              </tr>
            ))}
            {tests.length === 0 && (
              <tr><td colSpan="5" style={{ textAlign: 'center' }}>No tests found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
