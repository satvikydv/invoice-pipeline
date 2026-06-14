import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getInvoice, getInvoiceAudit } from '../api'
import { StatusBadge } from '../components/StatusBadge'
import { ConfidenceBar } from '../components/ConfidenceBar'
import { RiskMeter } from '../components/RiskMeter'
import { ProcessingTimeline } from '../components/ProcessingTimeline'
import { AuditAccordion } from '../components/AuditAccordion'
import { useCurrency } from '../CurrencyContext'

const TERMINAL = ['APPROVED', 'REVIEW_REQUIRED', 'REJECTED', 'FAILED']

const DECISION_ICONS = {
  APPROVED: '✅',
  REVIEW_REQUIRED: '⚠️',
  REJECTED: '❌',
  PROCESSING: '⏳',
  FAILED: '💥',
}

function fmt(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'medium' })
}

export default function InvoiceDetailPage() {
  const { formatAmount } = useCurrency();
  const { jobId } = useParams()
  const [invoice, setInvoice] = useState(null)
  const [audit, setAudit] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const pollRef = useRef(null)

  const loadData = async () => {
    try {
      const [invRes, auditRes] = await Promise.all([
        getInvoice(jobId),
        getInvoiceAudit(jobId),
      ])
      setInvoice(invRes.data)
      setAudit(auditRes.data)
      if (TERMINAL.includes(invRes.data.status)) {
        clearInterval(pollRef.current)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    pollRef.current = setInterval(loadData, 2000)
    return () => clearInterval(pollRef.current)
  }, [jobId])

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '6rem' }}>
        <span className="spinner" style={{ width: 40, height: 40, borderWidth: 4 }} />
        <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading invoice…</p>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🔍</div>
        <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Invoice not found</div>
        <Link to="/dashboard" className="btn btn-primary" style={{ marginTop: '1rem' }}>← Back to Dashboard</Link>
      </div>
    )
  }

  const decisionKey = (invoice.status || '').toLowerCase().replace('_', '_')
  const isProcessing = invoice.status === 'PROCESSING'

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
        <Link to="/dashboard" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Dashboard</Link>
        <span>›</span>
        <span style={{ color: 'var(--text-primary)' }}>{invoice.invoice_number || invoice.filename}</span>
      </div>

      {/* Decision banner */}
      <div className={`decision-banner ${decisionKey}`}>
        <div className="decision-text">
          <div className="decision-icon">
            {isProcessing ? '⏳' : DECISION_ICONS[invoice.status] || '❓'}
          </div>
          <div>
            <div className="decision-title">
              {isProcessing ? 'Processing…' : (invoice.decision?.replace('_', ' ') || invoice.status)}
            </div>
            <div className="decision-meta">
              {invoice.filename} · {fmt(invoice.created_at)}
            </div>
          </div>
        </div>
        {!isProcessing && (
          <div className="decision-stats">
            <div className="decision-stat">
              <div className="decision-stat-value">
                {invoice.confidence != null ? `${Math.round(invoice.confidence * 100)}%` : '—'}
              </div>
              <div className="decision-stat-label">Confidence</div>
            </div>
            <div className="decision-stat">
              <div className="decision-stat-value">
                {invoice.processing_time != null ? `${invoice.processing_time}s` : '—'}
              </div>
              <div className="decision-stat-label">Processing Time</div>
            </div>
            <div className="decision-stat">
              <div className="decision-stat-value">{invoice.risk_level || '—'}</div>
              <div className="decision-stat-label">Risk Level</div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0' }}>
        {[
          { key: 'overview', label: '📊 Overview' },
          { key: 'timeline', label: '🔄 Timeline' },
          { key: 'audit', label: '🔎 Audit Trail' },
        ].map(tab => (
          <button
            key={tab.key}
            id={`tab-${tab.key}`}
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

      {/* Tab: Overview */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem', alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Reasoning */}
            {invoice.reasoning?.length > 0 && (
              <div className="card">
                <div className="section-header">
                  <div className="section-title">💡 Decision Reasoning</div>
                </div>
                <ol className="reasoning-list">
                  {invoice.reasoning.map((r, i) => (
                    <li key={i} className="reasoning-item">
                      <span style={{ fontWeight: 700, color: 'var(--text-muted)', minWidth: '1.5rem' }}>{i + 1}.</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Invoice details */}
            <div className="card">
              <div className="section-header">
                <div className="section-title">📄 Invoice Details</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0' }}>
                {[
                  ['Invoice Number', invoice.invoice_number, true],
                  ['Invoice Date', invoice.invoice_date],
                  ['Vendor Name', invoice.vendor_name],
                  ['PO Number', invoice.po_number, true],
                  ['Subtotal', formatAmount(invoice.subtotal)],
                  ['Tax', formatAmount(invoice.tax)],
                  ['Total Amount', formatAmount(invoice.total_amount)],
                  ['OCR Confidence', invoice.ocr_confidence != null ? `${Math.round(invoice.ocr_confidence * 100)}%` : null],
                ].map(([label, val, mono]) => (
                  <div key={label} style={{ padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>{label}</div>
                    <div style={{ fontSize: '0.9rem', color: val ? 'var(--text-primary)' : 'var(--text-muted)', fontFamily: mono ? 'monospace' : 'inherit', fontWeight: val ? 600 : 400 }}>
                      {val || '—'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <ConfidenceBar value={invoice.confidence} />
              <RiskMeter level={invoice.risk_level} />
            </div>

            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Status</div>
              <StatusBadge status={invoice.status} />
            </div>

            <div className="card">
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Job Info</div>
              <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-muted)', wordBreak: 'break-all' }}>
                {jobId}
              </div>
            </div>

            <Link to="/dashboard" className="btn btn-ghost" style={{ justifyContent: 'center', textDecoration: 'none' }}>
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      )}

      {/* Tab: Timeline */}
      {activeTab === 'timeline' && (
        <div style={{ maxWidth: '480px' }}>
          <div className="card">
            <ProcessingTimeline invoice={invoice} />
          </div>
        </div>
      )}

      {/* Tab: Audit */}
      {activeTab === 'audit' && (
        <div>
          <AuditAccordion invoice={audit} />
        </div>
      )}
    </div>
  )
}
