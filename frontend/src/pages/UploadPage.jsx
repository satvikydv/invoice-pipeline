import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { uploadInvoice, getInvoice } from '../api'
import { StatusBadge } from '../components/StatusBadge'
import { ProcessingTimeline } from '../components/ProcessingTimeline'

const ACCEPTED = ['.pdf', '.jpg', '.jpeg', '.png', '.tiff', '.bmp', '.webp']

export default function UploadPage() {
  const [dragActive, setDragActive] = useState(false)
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadPct, setUploadPct] = useState(0)
  const [jobId, setJobId] = useState(null)
  const [invoice, setInvoice] = useState(null)
  const [error, setError] = useState(null)
  const inputRef = useRef(null)
  const pollRef = useRef(null)
  const navigate = useNavigate()

  const handleFile = useCallback((f) => {
    setError(null)
    const ext = '.' + f.name.split('.').pop().toLowerCase()
    if (!ACCEPTED.includes(ext)) {
      setError(`Unsupported file type: ${ext}. Allowed: ${ACCEPTED.join(', ')}`)
      return
    }
    if (f.size > 20 * 1024 * 1024) {
      setError('File too large. Maximum 20 MB.')
      return
    }
    setFile(f)
  }, [])

  const onDrop = useCallback((e) => {
    e.preventDefault()
    setDragActive(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [handleFile])

  const onDragOver = (e) => { e.preventDefault(); setDragActive(true) }
  const onDragLeave = () => setDragActive(false)
  const onInputChange = (e) => { if (e.target.files[0]) handleFile(e.target.files[0]) }
  const onZoneClick = () => !uploading && !jobId && inputRef.current?.click()

  const startPoll = (id) => {
    const TERMINAL = ['APPROVED', 'REVIEW_REQUIRED', 'REJECTED', 'FAILED']
    pollRef.current = setInterval(async () => {
      try {
        const { data } = await getInvoice(id)
        setInvoice(data)
        if (TERMINAL.includes(data.status)) {
          clearInterval(pollRef.current)
          // Auto-navigate after short delay
          setTimeout(() => navigate(`/invoice/${id}`), 1800)
        }
      } catch {
        // ignore
      }
    }, 1500)
  }

  const handleUpload = async () => {
    if (!file || uploading) return
    setUploading(true)
    setError(null)
    try {
      const { data } = await uploadInvoice(file, (e) => {
        if (e.total) setUploadPct(Math.round((e.loaded / e.total) * 100))
      })
      setJobId(data.job_id)
      setInvoice({ status: 'PROCESSING', job_id: data.job_id })
      startPoll(data.job_id)
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed. Please try again.')
      setUploading(false)
    }
  }

  const reset = () => {
    clearInterval(pollRef.current)
    setFile(null)
    setUploading(false)
    setUploadPct(0)
    setJobId(null)
    setInvoice(null)
    setError(null)
  }

  const isProcessing = invoice?.status === 'PROCESSING'
  const isDone = invoice && !isProcessing

  return (
    <div>
      <div className="page-hero">
        <h1 className="page-hero-title">Upload Invoice</h1>
        <p className="page-hero-sub">Upload a vendor invoice to begin AI-powered processing and approval</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: jobId ? '1fr 320px' : '1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Upload zone */}
        <div>
          {!jobId ? (
            <div
              className={`dropzone card ${dragActive ? 'drag-active' : ''}`}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onClick={onZoneClick}
            >
              <input
                ref={inputRef}
                type="file"
                id="invoice-file-input"
                accept={ACCEPTED.join(',')}
                style={{ display: 'none' }}
                onChange={onInputChange}
              />
              <span className="dropzone-icon">📑</span>
              <div className="dropzone-title">
                {file ? file.name : 'Drop your invoice here'}
              </div>
              <div className="dropzone-sub">
                {file
                  ? `${(file.size / 1024).toFixed(1)} KB · Click to change`
                  : 'or click to browse your files'}
              </div>
              <div className="dropzone-formats">
                {['PDF', 'JPG', 'PNG', 'TIFF', 'BMP', 'WebP'].map(f => (
                  <span key={f} className="format-chip">{f}</span>
                ))}
              </div>
            </div>
          ) : (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.25rem' }}>{file?.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>Job ID: {jobId}</div>
                </div>
                <StatusBadge status={invoice?.status} />
              </div>

              {isProcessing && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    <span>Processing…</span>
                    <span className="spinner" />
                  </div>
                  <div style={{ height: '4px', background: 'var(--bg-surface-3)', borderRadius: '100px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: 'var(--accent-gradient)', borderRadius: '100px', animation: 'indeterminate 1.5s infinite ease-in-out', width: '40%' }} />
                  </div>
                  <style>{`@keyframes indeterminate { 0%{transform:translateX(-100%)} 100%{transform:translateX(350%)} }`}</style>
                </div>
              )}

              {isDone && (
                <div style={{ marginBottom: '1rem', padding: '0.875rem 1rem', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', color: 'var(--status-approved)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  ✓ Processing complete — redirecting to results…
                </div>
              )}

              <button id="upload-reset-btn" className="btn btn-ghost" onClick={reset} style={{ width: '100%' }}>
                Upload Another Invoice
              </button>
            </div>
          )}

          {error && (
            <div style={{ marginTop: '1rem', padding: '0.875rem 1rem', background: 'var(--status-rejected-bg)', border: '1px solid var(--status-rejected-border)', borderRadius: 'var(--radius-md)', color: 'var(--status-rejected)', fontSize: '0.875rem' }}>
              ❌ {error}
            </div>
          )}

          {file && !jobId && (
            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem' }}>
              <button id="upload-submit-btn" className="btn btn-primary" onClick={handleUpload} disabled={uploading} style={{ flex: 1, justifyContent: 'center' }}>
                {uploading ? (
                  <><span className="spinner" /> Uploading{uploadPct > 0 ? ` ${uploadPct}%` : '…'}</>
                ) : (
                  <><span>⚡</span> Process Invoice</>
                )}
              </button>
              <button id="upload-clear-btn" className="btn btn-ghost" onClick={reset}>Clear</button>
            </div>
          )}
        </div>

        {/* Timeline sidebar */}
        {jobId && (
          <div className="card">
            <div className="section-header">
              <div className="section-title">🔄 Pipeline Progress</div>
            </div>
            <ProcessingTimeline invoice={invoice} />
          </div>
        )}
      </div>

      {/* Info section */}
      {!jobId && (
        <div style={{ marginTop: '3rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          {[
            { icon: '🤖', title: 'AI Extraction', desc: 'Gemini Vision reads all invoice fields automatically' },
            { icon: '🔍', title: 'Smart Matching', desc: 'Fuzzy PO matching even when references are missing' },
            { icon: '⚡', title: 'Fast Decisions', desc: 'Full pipeline completes in under 15 seconds' },
            { icon: '📋', title: 'Full Audit Trail', desc: 'Every stage result stored for compliance review' },
          ].map(c => (
            <div key={c.title} className="card card-glow" style={{ textAlign: 'center', padding: '1.5rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{c.icon}</div>
              <div style={{ fontWeight: 700, marginBottom: '0.4rem' }}>{c.title}</div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{c.desc}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
