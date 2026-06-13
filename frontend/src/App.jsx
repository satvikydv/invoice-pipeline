import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import UploadPage from './pages/UploadPage'
import DashboardPage from './pages/DashboardPage'
import InvoiceDetailPage from './pages/InvoiceDetailPage'

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <NavLink to="/" className="navbar-brand">
          <span className="brand-icon">⚡</span>
          InvoiceIQ
        </NavLink>
        <ul className="navbar-nav">
          <li>
            <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Upload
            </NavLink>
          </li>
          <li>
            <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Dashboard
            </NavLink>
          </li>
        </ul>
      </div>
    </nav>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <Navbar />
        <main className="page-content">
          <div className="page-container">
            <Routes>
              <Route path="/" element={<UploadPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/invoice/:jobId" element={<InvoiceDetailPage />} />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  )
}
