import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import UploadPage from './pages/UploadPage'
import DashboardPage from './pages/DashboardPage'
import InvoiceDetailPage from './pages/InvoiceDetailPage'
import DataPage from './pages/DataPage'
import { CurrencyProvider, useCurrency, CURRENCIES } from './CurrencyContext'

function Navbar() {
  const { currencyCode, setCurrencyCode } = useCurrency();
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <NavLink to="/" className="navbar-brand">
          <div className="brand-icon">Z</div>
          ZAMP // OCR LEDGER
        </NavLink>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <select 
            value={currencyCode} 
            onChange={(e) => setCurrencyCode(e.target.value)}
            style={{ 
              padding: '0.4rem 0.6rem', 
              background: 'var(--bg-base)', 
              color: 'var(--text-primary)', 
              border: '1px solid var(--border)', 
              borderRadius: '0', 
              cursor: 'pointer', 
              outline: 'none', 
              fontFamily: 'var(--font-display)',
              fontSize: '0.8rem',
              textTransform: 'uppercase'
            }}
          >
            {CURRENCIES.map(c => (
              <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>
            ))}
          </select>
          <ul className="navbar-nav">
            <li>
              <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                INPUT
              </NavLink>
            </li>
            <li>
              <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                DATA
              </NavLink>
            </li>
            <li>
              <NavLink to="/master-data" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                SYSTEM
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
                <Route path="/master-data" element={<DataPage />} />
                <Route path="/invoice/:jobId" element={<InvoiceDetailPage />} />
              </Routes>
            </div>
          </main>
        </div>
      </BrowserRouter>
    </CurrencyProvider>
  )
}


