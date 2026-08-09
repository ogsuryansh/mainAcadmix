import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Sidebar, Navbar } from './components/Layout'
import Home from './pages/Home'
import MyPurchases from './pages/MyPurchases'
import Login from './pages/Login'
import Signup from './pages/Signup'
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminProducts from './pages/admin/AdminProducts'
import AdminUsers from './pages/admin/AdminUsers'
import AdminOrders from './pages/admin/AdminOrders'
import AdminUpload from './pages/admin/AdminUpload'
import AdminMyUploads from './pages/admin/AdminMyUploads'
import AdminCBT from './pages/admin/AdminCBT'
import AdminGuard from './components/AdminGuard'
import ProductListPage from './pages/ProductListPage'
import CBTTestRunner from './pages/CBTTestRunner'
import './App.css'

function PlaceholderPage({ title }) {
  return (
    <div style={{ padding:'60px 24px', textAlign:'center', color:'#6B7280' }}>
      <div style={{ fontSize:'2.5rem', marginBottom:12 }}>🚧</div>
      <h2 style={{ fontSize:'1.3rem', fontWeight:700, color:'#111827', marginBottom:8 }}>{title}</h2>
      <p style={{ fontSize:'.9rem' }}>This page is coming soon.</p>
    </div>
  )
}

/* ── Main app with sidebar + navbar ── */
function MainLayout() {
  const [collapsed, setCollapsed]   = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled]     = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => {
    const fn = () => { if (window.innerWidth > 768) setMobileOpen(false) }
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible') }),
      { threshold: 0.08 }
    )
    const timer = setTimeout(() => {
      document.querySelectorAll('.reveal').forEach(el => obs.observe(el))
    }, 100)
    return () => { clearTimeout(timer); obs.disconnect() }
  })

  return (
    <div className="layout">
      <Sidebar
        collapsed={collapsed}
        toggle={() => setCollapsed(c => !c)}
        mobileOpen={mobileOpen}
        onOverlayClick={() => setMobileOpen(false)}
      />
      <div className={`main-area${collapsed ? ' sb-collapsed' : ''}`}>
        <Navbar
          scrolled={scrolled}
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          onHamburger={() => setMobileOpen(o => !o)}
        />
        <main className="page-body">
          <Routes>
            <Route path="/"            element={<Home />} />
            <Route path="/purchases"   element={<MyPurchases />} />
            <Route path="/notes"       element={<ProductListPage filterType="notes" />} />
            <Route path="/test-series" element={<ProductListPage filterType="test_series" />} />
            <Route path="/cbt-tests"   element={<ProductListPage filterType="test_series" defaultTab="cbt" />} />
            <Route path="/books"       element={<ProductListPage filterType="book" />} />
            <Route path="/neet"        element={<ProductListPage filterExam="NEET" />} />
            <Route path="/jee"         element={<ProductListPage filterExam="JEE" />} />
            <Route path="/boards"      element={<ProductListPage filterExam="Boards" />} />
            <Route path="/saved"       element={<PlaceholderPage title="Saved Items" />} />
            <Route path="*"            element={<PlaceholderPage title="Page Not Found" />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

/* ── Root router — auth pages render standalone, no layout ── */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Admin pages — standalone layout, guarded */}
        <Route path="/admin"            element={<AdminGuard><AdminLayout><AdminDashboard /></AdminLayout></AdminGuard>} />
        <Route path="/admin/upload"     element={<AdminGuard><AdminLayout><AdminUpload /></AdminLayout></AdminGuard>} />
        <Route path="/admin/products"   element={<AdminGuard><AdminLayout><AdminProducts /></AdminLayout></AdminGuard>} />
        <Route path="/admin/my-uploads" element={<AdminGuard><AdminLayout><AdminMyUploads /></AdminLayout></AdminGuard>} />
        <Route path="/admin/orders"     element={<AdminGuard><AdminLayout><AdminOrders /></AdminLayout></AdminGuard>} />
        <Route path="/admin/users"      element={<AdminGuard><AdminLayout><AdminUsers /></AdminLayout></AdminGuard>} />
        <Route path="/admin/cbt"        element={<AdminGuard><AdminLayout><AdminCBT /></AdminLayout></AdminGuard>} />
        <Route path="/admin/settings"   element={<AdminGuard><AdminLayout><PlaceholderPage title="Settings" /></AdminLayout></AdminGuard>} />

        <Route path="/cbt/:id"          element={<CBTTestRunner />} />

        {/* Standalone auth pages — NO sidebar/navbar */}
        <Route path="/login"  element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Everything else gets the full layout */}
        <Route path="/*" element={<MainLayout />} />
      </Routes>
    </BrowserRouter>
  )
}
