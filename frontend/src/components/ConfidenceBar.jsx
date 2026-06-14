export function ConfidenceBar({ value }) {
  const pct = Math.round((value || 0) * 100)
  return (
    <div className="confidence-bar-wrap">
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', letterSpacing: '0.05em' }}>
        <span>CONFIDENCE</span>
        <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{pct}%</span>
      </div>
      <div className="confidence-bar-track" style={{ borderRadius: 0 }}>
        <div className="confidence-bar-fill" style={{ width: `${pct}%`, borderRadius: 0 }} />
      </div>
    </div>
  )
}
