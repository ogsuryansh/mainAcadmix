import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { API_URL } from '../store/store'

export default function CBTTestRunner() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [test, setTest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)

  useEffect(() => {
    fetch(`${API_URL}/cbt/${id}`)
      .then(res => res.json())
      .then(data => {
        setTest(data)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [id])

  const handleSelect = (qNum, option) => {
    if (submitted) return
    setAnswers(prev => ({ ...prev, [qNum]: option }))
  }

  const handleSubmit = () => {
    if (!window.confirm("Are you sure you want to submit?")) return
    let calculatedScore = 0
    test.questions.forEach(q => {
      if (answers[q.questionNumber] === q.correctOption) {
        calculatedScore += 4 // Default +4 for correct
      } else if (answers[q.questionNumber]) {
        calculatedScore -= 1 // Default -1 for incorrect
      }
    })
    setScore(calculatedScore)
    setSubmitted(true)
  }

  if (loading) return <div style={{ padding: 50, textAlign: 'center' }}>Loading CBT...</div>
  if (!test || test.message) return <div style={{ padding: 50, textAlign: 'center' }}>Test not found.</div>

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', fontFamily: 'sans-serif' }}>
      
      {/* Left Side: PDF Viewer */}
      <div style={{ flex: 1, backgroundColor: '#525659', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: 15, background: '#323639', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem' }}>{test.title}</h2>
          <button onClick={() => navigate(-1)} style={{ background: 'transparent', border: '1px solid white', color: 'white', padding: '5px 10px', borderRadius: 4, cursor: 'pointer' }}>Exit</button>
        </div>
        <iframe 
          src={`${test.pdfUrl}#toolbar=0`} 
          style={{ width: '100%', height: '100%', border: 'none' }}
          title="Test PDF"
        />
      </div>

      {/* Right Side: OMR Sheet */}
      <div style={{ width: 400, background: '#f9fafb', display: 'flex', flexDirection: 'column', borderLeft: '1px solid #e5e7eb' }}>
        <div style={{ padding: 20, background: 'white', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 10px 0' }}>Digital OMR Sheet</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#6b7280' }}>
            <span>{test.questions?.length} Questions</span>
            <span>Duration: {test.durationMinutes}m</span>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {submitted && (
            <div style={{ background: '#d1fae5', padding: 15, borderRadius: 8, marginBottom: 20, textAlign: 'center', border: '1px solid #34d399' }}>
              <h2 style={{ margin: '0 0 5px 0', color: '#065f46' }}>Test Submitted</h2>
              <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold', color: '#064e3b' }}>Score: {score}</p>
            </div>
          )}

          <div style={{ display: 'grid', gap: 15 }}>
            {test.questions?.map(q => (
              <div key={q.questionNumber} style={{ display: 'flex', alignItems: 'center', gap: 15, padding: '10px 15px', background: 'white', borderRadius: 8, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                <span style={{ fontWeight: 'bold', width: 25 }}>{q.questionNumber}.</span>
                <div style={{ display: 'flex', gap: 10 }}>
                  {['A', 'B', 'C', 'D'].map(opt => {
                    const isSelected = answers[q.questionNumber] === opt
                    let bgColor = 'white'
                    let borderColor = '#d1d5db'
                    let textColor = '#374151'

                    if (isSelected) {
                      bgColor = '#3b82f6'
                      borderColor = '#3b82f6'
                      textColor = 'white'
                    }

                    if (submitted) {
                      if (q.correctOption === opt) {
                        bgColor = '#10b981' // Green for correct
                        borderColor = '#10b981'
                        textColor = 'white'
                      } else if (isSelected && q.correctOption !== opt) {
                        bgColor = '#ef4444' // Red if selected but wrong
                        borderColor = '#ef4444'
                        textColor = 'white'
                      }
                    }

                    return (
                      <button
                        key={opt}
                        disabled={submitted}
                        onClick={() => handleSelect(q.questionNumber, opt)}
                        style={{
                          width: 32, height: 32, borderRadius: '50%',
                          border: `2px solid ${borderColor}`,
                          background: bgColor,
                          color: textColor,
                          fontWeight: 'bold',
                          cursor: submitted ? 'default' : 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.2s'
                        }}
                      >
                        {opt}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {!submitted && (
          <div style={{ padding: 20, background: 'white', borderTop: '1px solid #e5e7eb' }}>
            <button 
              onClick={handleSubmit}
              style={{ width: '100%', padding: 12, background: '#4f46e5', color: 'white', border: 'none', borderRadius: 8, fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}
            >
              Submit Test
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
