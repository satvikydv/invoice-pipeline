export function ConfidenceBar({ value }) {
  const pct = Math.round((value || 0) * 100)
  return (
    <div className="confidence-bar-wrap">
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        <span>Confidence</span>
        <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{pct}%</span>
      </div>
      <div className="confidence-bar-track">
        <div className="confidence-bar-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
