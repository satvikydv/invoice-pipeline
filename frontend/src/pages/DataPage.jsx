import { useState, useEffect } from 'react'
import { getVendors, getPos } from '../api'
import { useCurrency } from '../CurrencyContext'

export default function DataPage() {
  const { formatAmount } = useCurrency()
  const [vendors, setVendors] = useState([])
  const [pos, setPos] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('vendors')

  useEffect(() => {
    Promise.all([getVendors(), getPos()])
      .then(([vRes, pRes]) => {
        setVendors(Array.isArray(vRes.data) ? vRes.data : vRes.data?.items || vRes.data?.value || [])
        setPos(Array.isArray(pRes.data) ? pRes.data : pRes.data?.items || pRes.data?.value || [])
      })
      .catch(err => {
        console.error('Failed to fetch system data:', err)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '6rem' }}>
        <span className="spinner" style={{ width: 40, height: 40, borderWidth: 4 }} />
        <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>LOADING MASTER DATA…</p>
      </div>
    )
  }

  return (
    <div>
      <div className="page-hero">
        <h1 className="page-hero-title">MASTER DATA</h1>
        <p className="page-hero-sub">VIEW SYSTEM VENDOR AND PURCHASE ORDER RECORDS</p>
      </div>

      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0' }}>
        {[
          { key: 'vendors', label: '[VENDORS]' },
          { key: 'pos', label: '[PURCHASE ORDERS]' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '0.6rem 1.1rem',
              background: 'none',
              border: 'none',
              borderBottom: `2px solid ${activeTab === tab.key ? 'var(--accent-primary)' : 'transparent'}`,
              color: activeTab === tab.key ? 'var(--accent-primary)' : 'var(--text-muted)',
              fontWeight: activeTab === tab.key ? 700 : 500,
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'all 150ms',
              fontFamily: 'inherit',
              marginBottom: '-1px',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {activeTab === 'vendors' && (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>VENDOR ID</th>
                  <th>NAME</th>
                  <th>TAX ID</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {vendors.map(v => (
                  <tr key={v.id}>
                    <td style={{ fontFamily: 'monospace' }}>{v.vendor_id}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{v.vendor_name}</td>
                    <td style={{ fontFamily: 'monospace' }}>{v.tax_id}</td>
                    <td>
                      <span className={`badge badge-${v.status.toLowerCase()}`}>
                        {v.status === 'Approved' ? '[OK] ' : '[BLOCK] '}
                        {v.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {vendors.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      NO VENDORS FOUND
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'pos' && (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>PO NUMBER</th>
                  <th>VENDOR</th>
                  <th>AMOUNT</th>
                  <th>BALANCE</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {pos.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontFamily: 'monospace' }}>{p.po_number}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.vendor_name}</td>
                    <td style={{ fontFamily: 'monospace' }}>{formatAmount(p.po_amount)}</td>
                    <td style={{ fontFamily: 'monospace', color: p.remaining_balance > 0 ? 'var(--status-approved)' : 'var(--text-muted)' }}>
                      {formatAmount(p.remaining_balance)}
                    </td>
                    <td>
                      <span className={`badge badge-${p.status === 'Active' ? 'approved' : 'failed'}`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {pos.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      NO PURCHASE ORDERS FOUND
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
