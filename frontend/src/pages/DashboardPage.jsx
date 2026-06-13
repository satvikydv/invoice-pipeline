import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { listInvoices, getStats } from '../api'
import { StatusBadge } from '../components/StatusBadge'

function fmt(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
}

function fmtAmount(v) {
  if (v == null) return '—'
  return `$${Number(v).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
}

export default function DashboardPage() {
  const [invoices, setInvoices] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortKey, setSortKey] = useState('created_at')
  const [sortDir, setSortDir] = useState('desc')

  const load = useCallback(async () => {
    try {
      const [listRes, statsRes] = await Promise.all([
        listInvoices({ limit: 200 }),
        getStats(),
      ])
      setInvoices(listRes.data.items)
      setStats(statsRes.data)
    } catch {
      // silently handle
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, 5000)
    return () => clearInterval(interval)
  }, [load])

  const filtered = invoices.filter(inv => {
    const q = search.toLowerCase()
    const matchSearch = !q || (
      (inv.invoice_number || '').toLowerCase().includes(q) ||
      (inv.vendor_name || '').toLowerCase().includes(q) ||
      (inv.filename || '').toLowerCase().includes(q)
    )
    const matchStatus = !statusFilter || inv.status === statusFilter
    return matchSearch && matchStatus
  })

  const sorted = [...filtered].sort((a, b) => {
    let av = a[sortKey], bv = b[sortKey]
    if (av == null) av = ''
    if (bv == null) bv = ''
    if (typeof av === 'string') av = av.toLowerCase()
    if (typeof bv === 'string') bv = bv.toLowerCase()
    if (sortDir === 'asc') return av < bv ? -1 : av > bv ? 1 : 0
    return av > bv ? -1 : av < bv ? 1 : 0
  })

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const sortIcon = (key) => sortKey === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''

  return (
    <div>
      <div className="page-hero">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="page-hero-title">Dashboard</h1>
            <p className="page-hero-sub">Monitor invoice processing activity and audit decisions</p>
          </div>
          <Link to="/" className="btn btn-primary" id="dashboard-upload-btn">
            <span>+</span> Upload Invoice
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Processed</div>
          <div className="stat-value">{stats?.total ?? '—'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Approved</div>
          <div className="stat-value approved">{stats?.approved ?? '—'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Under Review</div>
          <div className="stat-value review">{stats?.review_required ?? '—'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Rejected</div>
          <div className="stat-value rejected">{stats?.rejected ?? '—'}</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="search-wrap" style={{ flex: 1, minWidth: '200px' }}>
          <span className="search-icon">🔍</span>
          <input
            id="dashboard-search"
            className="search-input"
            type="text"
            placeholder="Search by invoice #, vendor, or filename…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          id="dashboard-status-filter"
          className="filter-select"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="APPROVED">Approved</option>
          <option value="REVIEW_REQUIRED">Review Required</option>
          <option value="REJECTED">Rejected</option>
          <option value="PROCESSING">Processing</option>
        </select>
        <button id="dashboard-refresh-btn" className="btn btn-ghost" onClick={load}>
          ↻ Refresh
        </button>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <span className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
          </div>
        ) : sorted.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>No invoices found</div>
            <p style={{ fontSize: '0.875rem' }}>Upload an invoice to get started</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('invoice_number')}>Invoice #{sortIcon('invoice_number')}</th>
                <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('vendor_name')}>Vendor{sortIcon('vendor_name')}</th>
                <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('total_amount')}>Amount{sortIcon('total_amount')}</th>
                <th>Status</th>
                <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('confidence')}>Confidence{sortIcon('confidence')}</th>
                <th>Risk</th>
                <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('created_at')}>Date{sortIcon('created_at')}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(inv => (
                <tr key={inv.job_id}>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                      {inv.invoice_number || <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </span>
                  </td>
                  <td>{inv.vendor_name || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{fmtAmount(inv.total_amount)}</td>
                  <td><StatusBadge status={inv.status} /></td>
                  <td>
                    {inv.confidence != null ? (
                      <span style={{ fontSize: '0.82rem', color: inv.confidence > 0.8 ? 'var(--status-approved)' : inv.confidence > 0.5 ? 'var(--status-review)' : 'var(--status-rejected)', fontWeight: 600 }}>
                        {Math.round(inv.confidence * 100)}%
                      </span>
                    ) : '—'}
                  </td>
                  <td>
                    {inv.risk_level ? (
                      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: inv.risk_level === 'LOW' ? 'var(--risk-low)' : inv.risk_level === 'MEDIUM' ? 'var(--risk-medium)' : 'var(--risk-high)' }}>
                        {inv.risk_level}
                      </span>
                    ) : '—'}
                  </td>
                  <td style={{ whiteSpace: 'nowrap', fontSize: '0.8rem' }}>{fmt(inv.created_at)}</td>
                  <td>
                    <Link to={`/invoice/${inv.job_id}`} className="btn btn-ghost" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {sorted.length > 0 && (
        <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'right' }}>
          Showing {sorted.length} of {invoices.length} invoices
        </div>
      )}
    </div>
  )
}
