import { useState, useEffect, useMemo } from 'react'
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
  
  // Pagination State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)

  useEffect(() => {
    fetch(`${API_URL}/cbt/${id}`)
      .then(res => res.json())
      .then(data => {
        // Limit to 10 questions as requested
        if (data.questions && data.questions.length > 10) {
          data.questions = data.questions.slice(0, 10)
        }
        setTest(data)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [id])

  // Fix PDF URL (handle localhost refused to connect if backend is not on localhost:5000)
  const resolvedPdfUrl = useMemo(() => {
    if (!test?.pdfUrl) return ''
    if (test.pdfUrl.startsWith('http://localhost:5000')) {
      const baseUrl = API_URL.replace('/api', '')
      return test.pdfUrl.replace('http://localhost:5000', baseUrl)
    }
    return test.pdfUrl
  }, [test?.pdfUrl])

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

  const currentQuestion = test.questions[currentQuestionIndex]

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', fontFamily: 'sans-serif' }}>
      
      {/* Left Side: PDF Viewer */}
      <div style={{ flex: 1, backgroundColor: '#525659', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: 15, background: '#323639', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem' }}>{test.title}</h2>
          <button onClick={() => navigate(-1)} style={{ background: 'transparent', border: '1px solid white', color: 'white', padding: '5px 10px', borderRadius: 4, cursor: 'pointer' }}>Exit</button>
        </div>
        <iframe 
          src={`${resolvedPdfUrl}#toolbar=0`} 
          style={{ width: '100%', height: '100%', border: 'none' }}
          title="Test PDF"
        />
      </div>

      {/* Right Side: OMR Sheet & Palette */}
      <div style={{ width: 400, background: '#f9fafb', display: 'flex', flexDirection: 'column', borderLeft: '1px solid #e5e7eb' }}>
        <div style={{ padding: 20, background: 'white', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 10px 0' }}>Digital OMR Sheet</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#6b7280' }}>
            <span>{test.questions?.length} Questions</span>
            <span>Duration: {test.durationMinutes}m</span>
          </div>
        </div>

        {/* Score Banner */}
        {submitted && (
          <div style={{ margin: '20px 20px 0 20px', background: '#d1fae5', padding: 15, borderRadius: 8, textAlign: 'center', border: '1px solid #34d399' }}>
            <h2 style={{ margin: '0 0 5px 0', color: '#065f46' }}>Test Submitted</h2>
            <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold', color: '#064e3b' }}>Score: {score}</p>
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 30 }}>
          
          {/* Active Question View */}
          <div style={{ background: 'white', padding: 20, borderRadius: 12, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#111827' }}>Question {currentQuestion.questionNumber}</h4>
              <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                {currentQuestionIndex + 1} of {test.questions.length}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '0 10px' }}>
              {['A', 'B', 'C', 'D'].map(opt => {
                const isSelected = answers[currentQuestion.questionNumber] === opt
                let bgColor = 'white'
                let borderColor = '#d1d5db'
                let textColor = '#374151'

                if (isSelected) {
                  bgColor = '#3b82f6'
                  borderColor = '#3b82f6'
                  textColor = 'white'
                }

                if (submitted) {
                  if (currentQuestion.correctOption === opt) {
                    bgColor = '#10b981' // Green for correct
                    borderColor = '#10b981'
                    textColor = 'white'
                  } else if (isSelected && currentQuestion.correctOption !== opt) {
                    bgColor = '#ef4444' // Red if selected but wrong
                    borderColor = '#ef4444'
                    textColor = 'white'
                  }
                }

                return (
                  <button
                    key={opt}
                    disabled={submitted}
                    onClick={() => handleSelect(currentQuestion.questionNumber, opt)}
                    style={{
                      width: 50, height: 50, borderRadius: '50%',
                      border: `2px solid ${borderColor}`,
                      background: bgColor,
                      color: textColor,
                      fontWeight: 'bold',
                      fontSize: '1.2rem',
                      cursor: submitted ? 'default' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.2s',
                      boxShadow: isSelected ? '0 4px 6px -1px rgba(59, 130, 246, 0.3)' : 'none'
                    }}
                  >
                    {opt}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Pagination Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 15 }}>
            <button
              onClick={() => setCurrentQuestionIndex(i => Math.max(0, i - 1))}
              disabled={currentQuestionIndex === 0}
              style={{ flex: 1, padding: 12, background: currentQuestionIndex === 0 ? '#e5e7eb' : '#4b5563', color: currentQuestionIndex === 0 ? '#9ca3af' : 'white', border: 'none', borderRadius: 8, fontWeight: 'bold', cursor: currentQuestionIndex === 0 ? 'not-allowed' : 'pointer' }}
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentQuestionIndex(i => Math.min(test.questions.length - 1, i + 1))}
              disabled={currentQuestionIndex === test.questions.length - 1}
              style={{ flex: 1, padding: 12, background: currentQuestionIndex === test.questions.length - 1 ? '#e5e7eb' : '#4b5563', color: currentQuestionIndex === test.questions.length - 1 ? '#9ca3af' : 'white', border: 'none', borderRadius: 8, fontWeight: 'bold', cursor: currentQuestionIndex === test.questions.length - 1 ? 'not-allowed' : 'pointer' }}
            >
              Next
            </button>
          </div>

          {/* Question Palette */}
          <div>
            <h4 style={{ margin: '0 0 15px 0', fontSize: '1rem', color: '#374151', textAlign: 'center' }}>Question Palette</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
              {test.questions.map((q, idx) => {
                const isAttempted = !!answers[q.questionNumber]
                const isActive = idx === currentQuestionIndex
                
                let bgColor = isAttempted ? '#dbeafe' : 'white'
                let borderColor = isAttempted ? '#bfdbfe' : '#e5e7eb'
                let textColor = isAttempted ? '#1d4ed8' : '#4b5563'

                if (submitted) {
                  if (answers[q.questionNumber] === q.correctOption) {
                    bgColor = '#d1fae5'; borderColor = '#a7f3d0'; textColor = '#065f46';
                  } else if (answers[q.questionNumber]) {
                    bgColor = '#fee2e2'; borderColor = '#fecaca'; textColor = '#b91c1c';
                  } else {
                    bgColor = '#f3f4f6'; borderColor = '#e5e7eb'; textColor = '#9ca3af';
                  }
                }

                if (isActive) {
                  borderColor = '#3b82f6' // Highlight active question
                }

                return (
                  <button
                    key={q.questionNumber}
                    onClick={() => setCurrentQuestionIndex(idx)}
                    style={{
                      padding: '8px 0',
                      background: bgColor,
                      border: `2px solid ${borderColor}`,
                      borderRadius: 8,
                      color: textColor,
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: isActive ? '0 0 0 2px rgba(59,130,246,0.3)' : 'none'
                    }}
                  >
                    {q.questionNumber}
                  </button>
                )
              })}
            </div>
          </div>

        </div>

        {!submitted && (
          <div style={{ padding: 20, background: 'white', borderTop: '1px solid #e5e7eb' }}>
            <button 
              onClick={handleSubmit}
              style={{ width: '100%', padding: 14, background: '#4f46e5', color: 'white', border: 'none', borderRadius: 8, fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.3)' }}
            >
              Submit Test
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
