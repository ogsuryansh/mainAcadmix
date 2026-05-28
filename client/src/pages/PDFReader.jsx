import { useState, useEffect, useRef } from 'react'

export default function PDFReader({ title, driveLink, onClose }) {
  const [pdfDoc, setPdfDoc] = useState(null)
  const [numPages, setNumPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [scale, setScale] = useState(1.2)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [downloadProgress, setDownloadProgress] = useState(0)

  // Get user details for watermark
  const u = localStorage.getItem('acadmix_user')
  const user = u ? JSON.parse(u) : null
  const userEmail = user?.email || user?.username || 'Protected Content'
  const watermarkText = `Acadmix • ${userEmail} • Protected`
  
  // Touch and Pinch-to-zoom gesture refs
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)
  const initialPinchDist = useRef(0)
  const initialScale = useRef(1.2)

  const isGoogleDrive = driveLink && driveLink.includes('drive.google.com')

  // Load PDF.js from CDN dynamically if needed
  useEffect(() => {
    if (isGoogleDrive || !driveLink) {
      setLoading(false)
      return
    }

    let isMounted = true
    setLoading(true)
    setError(null)

    const initPdfJS = async () => {
      try {
        // Check if window.pdfjsLib is already loaded
        if (!window.pdfjsLib) {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script')
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js'
            script.onload = resolve
            script.onerror = () => reject(new Error('Failed to load PDF viewer library.'))
            document.head.appendChild(script)
          })
        }

        const pdfjsLib = window.pdfjsLib
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js'

        const loadingTask = pdfjsLib.getDocument({
          url: driveLink,
          withCredentials: true,
          disableAutoFetch: true,
          disableStream: false
        })

        loadingTask.onProgress = (progress) => {
          if (isMounted && progress.total > 0) {
            const percent = Math.round((progress.loaded / progress.total) * 100)
            setDownloadProgress(percent)
          }
        }

        const pdf = await loadingTask.promise
        if (!isMounted) return

        setPdfDoc(pdf)
        setNumPages(pdf.numPages)
        setLoading(false)
      } catch (err) {
        console.error('PDF.js loading error:', err)
        if (isMounted) {
          setError('Error loading PDF document. The file might be corrupted or inaccessible.')
          setLoading(false)
        }
      }
    }

    initPdfJS()

    return () => {
      isMounted = false
    }
  }, [driveLink, isGoogleDrive])

  // Navigation handlers
  const prevPage = () => setCurrentPage(p => Math.max(p - 1, 1))
  const nextPage = () => setCurrentPage(p => Math.min(p + 1, numPages))

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        prevPage()
      } else if (e.key === 'ArrowRight') {
        nextPage()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [numPages])

  // Mobile Swipe and Pinch Gestures handler
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      touchStartX.current = e.touches[0].clientX
    } else if (e.touches.length === 2) {
      // Pinch to Zoom start
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      )
      initialPinchDist.current = dist
      initialScale.current = scale
    }
  }

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && initialPinchDist.current > 0) {
      // Prevent browser zoom default behavior
      e.preventDefault()
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      )
      const factor = dist / initialPinchDist.current
      const newScale = Math.min(Math.max(initialScale.current * factor, 0.6), 3.0)
      setScale(Number(newScale.toFixed(2)))
    }
  }

  const handleTouchEnd = (e) => {
    if (e.changedTouches.length === 1 && touchStartX.current > 0) {
      touchEndX.current = e.changedTouches[0].clientX
      const diffX = touchStartX.current - touchEndX.current
      if (Math.abs(diffX) > 60) {
        if (diffX > 0) {
          nextPage()
        } else {
          prevPage()
        }
      }
    }
    touchStartX.current = 0
    touchEndX.current = 0
    initialPinchDist.current = 0
  }

  // Intercept hotkeys (Ctrl+P, Ctrl+S, Ctrl+C)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault()
        alert('Printing and downloading is disabled to protect paid content.')
        return false
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        alert('Saving is disabled to protect paid content.')
        return false
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault()
        alert('Text extraction and copying is disabled.')
        return false
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Component to render individual page to canvas
  function PDFPage({ pageNum, pdf, scale }) {
    const canvasRef = useRef(null)
    const [renderState, setRenderState] = useState('loading')

    useEffect(() => {
      let isMounted = true
      let renderTask = null

      const renderPage = async () => {
        try {
          setRenderState('loading')
          const page = await pdf.getPage(pageNum)
          if (!isMounted) return

          // Adjust baseline viewport scale based on page scale
          const viewport = page.getViewport({ scale })
          const canvas = canvasRef.current
          if (!canvas) return

          const context = canvas.getContext('2d')
          canvas.height = viewport.height
          canvas.width = viewport.width

          const renderContext = {
            canvasContext: context,
            viewport: viewport
          }

          renderTask = page.render(renderContext)
          await renderTask.promise
          if (isMounted) setRenderState('success')
        } catch (err) {
          console.error(`Page ${pageNum} render error:`, err)
          if (isMounted) setRenderState('error')
        }
      }

      renderPage()

      return () => {
        isMounted = false
        if (renderTask) {
          try { renderTask.cancel() } catch (e) {}
        }
      }
    }, [pdf, pageNum, scale])

    return (
      <div style={{
        position: 'relative',
        boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
        background: '#fff',
        borderRadius: 8,
        overflow: 'hidden',
        maxWidth: '100%',
        width: 'fit-content',
        transition: 'transform 0.1s ease-out'
      }}>
        {renderState === 'loading' && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: '#131127', color: '#8B5CF6', fontSize: '.85rem'
          }}>
            Loading page {pageNum}...
          </div>
        )}
        <canvas ref={canvasRef} style={{ display: 'block', maxWidth: '100%', height: 'auto' }} />
        
        {/* 3-position watermarks: top-left, center, bottom-right */}
        {/* Top-left */}
        <div style={{
          position: 'absolute', top: 10, left: 10,
          pointerEvents: 'none', zIndex: 5,
          color: 'rgba(109, 40, 217, 0.13)',
          fontSize: '.72rem', fontWeight: 700,
          userSelect: 'none', letterSpacing: 1,
          fontFamily: 'monospace',
        }}>
          {userEmail}
        </div>

        {/* Center — rotated diagonal */}
        <div style={{
          position: 'absolute', inset: 0,
          pointerEvents: 'none', zIndex: 5,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
        }}>
          <div style={{
            color: 'rgba(139, 92, 246, 0.09)',
            fontSize: window.innerWidth < 768 ? '1rem' : '1.8rem',
            fontWeight: 800,
            transform: 'rotate(-30deg)',
            textTransform: 'uppercase',
            letterSpacing: 4,
            whiteSpace: 'nowrap',
            userSelect: 'none',
            textAlign: 'center',
            width: '100%',
          }}>
            {watermarkText}
          </div>
        </div>

        {/* Bottom-right — small */}
        <div style={{
          position: 'absolute', bottom: 8, right: 10,
          pointerEvents: 'none', zIndex: 5,
          color: 'rgba(109, 40, 217, 0.12)',
          fontSize: '.6rem', fontWeight: 700,
          userSelect: 'none', letterSpacing: .5,
          fontFamily: 'monospace',
        }}>
          {userEmail}
        </div>
      </div>
    )
  }

  // Interactive UI styles
  const btnStyle = {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#fff',
    padding: '7px 14px',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: '.8rem',
    fontWeight: 600,
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6
  }

  const hoverStyle = (e, active) => {
    e.target.style.background = active ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)'
    e.target.style.borderColor = active ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)'
  }

  return (
    <div 
      onContextMenu={(e) => e.preventDefault()}
      style={{
        position:'fixed', inset:0, zIndex:2000,
        background:'rgba(8,7,16,.98)',
        display:'flex', flexDirection:'column',
        backdropFilter:'blur(10px)',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none'
      }}
    >
      {/* ── Top Bar ── */}
      <div style={{
        height:56, background:'#090812',
        borderBottom:'1px solid rgba(255,255,255,.06)',
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'0 20px', flexShrink:0,
      }}>
        {/* Left: Book info */}
        <div style={{ display:'flex', alignItems:'center', gap:12, minWidth:0 }}>
          <div style={{
            width:32, height:40, background:'linear-gradient(135deg,#6D28D9,#8B5CF6)',
            borderRadius:4, display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:'.9rem', flexShrink:0, boxShadow:'0 4px 12px rgba(109,40,217,.3)',
          }}>📚</div>
          <div style={{ minWidth:0 }}>
            <div style={{ fontSize:'.85rem', fontWeight:600, color:'#fff', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:250 }}>{title}</div>
            <div style={{ fontSize:'.68rem', color:'rgba(255,255,255,.4)', marginTop:1 }}>Acadmix Secure Reader</div>
          </div>
        </div>

        {/* Center: Desktop Zoom & Nav Controls */}
        {!loading && !error && !isGoogleDrive && (
          <div className="desktop-controls" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* Zoom Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.03)', padding: '3px 8px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.04)' }}>
              <button 
                onClick={() => setScale(s => Math.max(s - 0.1, 0.6))} 
                title="Zoom Out"
                style={{ ...btnStyle, padding: '4px 8px', background: 'transparent', border: 'none' }}
              >➖</button>
              <span style={{ fontSize: '.75rem', color: 'rgba(255,255,255,0.8)', minWidth: 42, textAlign: 'center', fontWeight: 600 }}>{Math.round(scale * 100)}%</span>
              <button 
                onClick={() => setScale(s => Math.min(s + 0.1, 3.0))} 
                title="Zoom In"
                style={{ ...btnStyle, padding: '4px 8px', background: 'transparent', border: 'none' }}
              >➕</button>
              <button 
                onClick={() => setScale(1.2)} 
                title="Reset Zoom"
                style={{ ...btnStyle, padding: '4px 6px', background: 'transparent', border: 'none', fontSize: '.7rem' }}
              >🔄</button>
            </div>

            {/* Page Navigation */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button 
                disabled={currentPage === 1} 
                onClick={prevPage} 
                style={btnStyle}
                onMouseEnter={(e) => hoverStyle(e, true)}
                onMouseLeave={(e) => hoverStyle(e, false)}
              >
                ◀ Prev
              </button>
              {/* Page jump input */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '.8rem', color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>
                <span style={{ opacity: .6, fontSize: '.75rem' }}>Page</span>
                <input
                  type="number"
                  min={1}
                  max={numPages}
                  value={currentPage}
                  onChange={e => {
                    const v = Number(e.target.value)
                    if (v >= 1 && v <= numPages) setCurrentPage(v)
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      const v = Number(e.target.value)
                      if (v >= 1 && v <= numPages) setCurrentPage(v)
                    }
                  }}
                  style={{
                    width: 50, textAlign: 'center',
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 6, color: '#fff',
                    padding: '4px 6px', fontSize: '.8rem', fontWeight: 700,
                    outline: 'none', fontFamily: 'Inter, sans-serif',
                    MozAppearance: 'textfield',
                  }}
                />
                <span style={{ opacity: .6, fontSize: '.75rem' }}>of {numPages}</span>
              </div>
              <button 
                disabled={currentPage === numPages} 
                onClick={nextPage} 
                style={btnStyle}
                onMouseEnter={(e) => hoverStyle(e, true)}
                onMouseLeave={(e) => hoverStyle(e, false)}
              >
                Next ▶
              </button>
            </div>
          </div>
        )}

        {/* Right: Close */}
        <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
          <button
            onClick={onClose}
            style={{
              background:'rgba(239,68,68,.15)', border:'1px solid rgba(239,68,68,.25)',
              color:'#FCA5A5', padding:'6px 14px', borderRadius:8,
              fontSize:'.75rem', fontWeight:600, cursor:'pointer',
              transition:'all 0.15s',
            }}
          >✕ Close</button>
        </div>
      </div>

      {/* ── eBook reading area ── */}
      <div 
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          flex:1, 
          overflow: 'auto',
          padding:'20px 10px', 
          background:'#0A0A10',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          position: 'relative'
        }}
      >
        {/* Floating Side Nav Arrows (Desktop only, hidden on small screens) */}
        {!loading && !error && !isGoogleDrive && (
          <>
            <button 
              disabled={currentPage === 1}
              onClick={prevPage}
              style={{
                position: 'fixed', left: 24, zIndex: 10,
                width: 48, height: 48, borderRadius: '50%',
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                color: '#fff', fontSize: '1.2rem', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s', opacity: currentPage === 1 ? 0 : 0.7,
                backdropFilter: 'blur(5px)'
              }}
              onMouseEnter={(e) => { e.target.style.background = 'rgba(255,255,255,0.1)'; e.target.style.opacity = 1 }}
              onMouseLeave={(e) => { e.target.style.background = 'rgba(255,255,255,0.03)'; e.target.style.opacity = 0.7 }}
            >
              ◀
            </button>
            <button 
              disabled={currentPage === numPages}
              onClick={nextPage}
              style={{
                position: 'fixed', right: 24, zIndex: 10,
                width: 48, height: 48, borderRadius: '50%',
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                color: '#fff', fontSize: '1.2rem', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s', opacity: currentPage === numPages ? 0 : 0.7,
                backdropFilter: 'blur(5px)'
              }}
              onMouseEnter={(e) => { e.target.style.background = 'rgba(255,255,255,0.1)'; e.target.style.opacity = 1 }}
              onMouseLeave={(e) => { e.target.style.background = 'rgba(255,255,255,0.03)'; e.target.style.opacity = 0.7 }}
            >
              ▶
            </button>
          </>
        )}

        {loading && (
          <div style={{ color: '#fff', textAlign: 'center' }}>
            <div className="spinner" style={{ border: '3px solid rgba(255,255,255,0.1)', borderTop: '3px solid #8B5CF6', borderRadius: '50%', width: 44, height: 44, animation: 'spin 1s linear infinite', margin: '0 auto 16px auto' }} />
            <div style={{ fontWeight: 600, fontSize: '.95rem' }}>Decrypting and loading book...</div>
            <div style={{ fontSize: '.78rem', opacity: 0.5, marginTop: 4 }}>
              {downloadProgress > 0 ? `Loading: ${downloadProgress}%` : 'Opening secure sandbox...'}
            </div>
            <div style={{
              marginTop: 18, padding: '10px 20px', borderRadius: 10,
              background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)',
              fontSize: '.75rem', color: 'rgba(255,255,255,0.5)',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ fontSize: '1rem' }}>⏳</span>
              <span>
                <strong style={{ color: 'rgba(255,255,255,0.75)' }}>Please wait</strong> — large PDF files may take a moment to load.
              </span>
            </div>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        )}

        {error && (
          <div style={{ color: '#FCA5A5', textAlign: 'center', maxWidth: 450, padding: 20 }}>
            <span style={{ fontSize: '2.5rem' }}>⚠️</span>
            <div style={{ fontWeight: 600, marginTop: 12 }}>Unable to open document</div>
            <div style={{ fontSize: '.82rem', opacity: 0.8, marginTop: 6 }}>{error}</div>
            <button onClick={onClose} style={{ marginTop: 20, padding: '8px 16px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', borderRadius: 6, cursor: 'pointer' }}>Close Reader</button>
          </div>
        )}

        {!loading && !error && (
          isGoogleDrive ? (
            /* Google Drive legacy fallback iframe */
            <div style={{ width: '100%', maxWidth: 860, height: '90%', position: 'relative', filter: 'drop-shadow(0 24px 60px rgba(0,0,0,.8))' }}>
              <iframe
                src={driveLink}
                style={{ width: '100%', height: '100%', border: 'none', borderRadius: 4, display: 'block', background: '#fff' }}
                title={title}
                allow="autoplay"
              />
            </div>
          ) : (
            /* Secure HTML5 Canvas Render (Only renders active page) */
            <div style={{ padding: '0 10px', transition: 'transform 0.15s ease-out' }}>
              <PDFPage pageNum={currentPage} pdf={pdfDoc} scale={scale} />
            </div>
          )
        )}
      </div>

      {/* ── Bottom Bar / Mobile Nav Bar ── */}
      <div style={{
        height:48, background:'#090812',
        borderTop:'1px solid rgba(255,255,255,.05)',
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding: '0 20px', flexShrink:0,
      }}>
        {/* Left: Mobile Zoom display */}
        <span style={{ fontSize:'.7rem', color:'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: 6 }}>
          🔒 Protected eBook mode
        </span>

        {/* Center: Mobile Page Indicator */}
        {!loading && !error && !isGoogleDrive && (
          <span style={{ fontSize: '.75rem', color: '#fff', fontWeight: 600, display: 'none', '@media (max-width: 768px)': { display: 'block' } }} className="mobile-page-num">
            Page {currentPage} of {numPages} (Swipe to turn)
          </span>
        )}

        {/* Right: Mobile Info */}
        <span style={{ fontSize:'.68rem', color:'rgba(255,255,255,0.2)' }}>
          Pinch to Zoom • Swipe to Turn
        </span>
      </div>

      {/* Inject Media Queries for Mobile styling of controls */}
      <style>{`
        @media (max-width: 768px) {
          .desktop-controls {
            display: none !important;
          }
          .mobile-page-num {
            display: block !important;
          }
        }
      `}</style>
    </div>
  )
}
