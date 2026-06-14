import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import UploadPage from './pages/UploadPage'
import DashboardPage from './pages/DashboardPage'
import InvoiceDetailPage from './pages/InvoiceDetailPage'
import { CurrencyProvider, useCurrency, CURRENCIES } from './CurrencyContext'

function Navbar() {
  const { currencyCode, setCurrencyCode } = useCurrency();
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <NavLink to="/" className="navbar-brand">
          <span className="brand-icon">⚡</span>
          InvoiceIQ
        </NavLink>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <select 
            value={currencyCode} 
            onChange={(e) => setCurrencyCode(e.target.value)}
            style={{ padding: '0.4rem 0.6rem', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', outline: 'none', fontSize: '0.875rem' }}
          >
            {CURRENCIES.map(c => (
              <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>
            ))}
          </select>
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
      </div>
    </nav>
  )
}

export default function App() {
  return (
    <CurrencyProvider>
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
    </CurrencyProvider>
  )
}


