export function RiskMeter({ level }) {
  const labels = { LOW: 'Low Risk', MEDIUM: 'Medium Risk', HIGH: 'High Risk' }
  const colors = { LOW: 'var(--risk-low)', MEDIUM: 'var(--risk-medium)', HIGH: 'var(--risk-high)' }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
        <span style={{ color: 'var(--text-muted)' }}>Risk Level</span>
        <span style={{ color: colors[level] || 'var(--text-muted)', fontWeight: 700 }}>{labels[level] || level}</span>
      </div>
      <div className={`risk-meter risk-${level || 'LOW'}`}>
        <div className="risk-segment" />
        <div className="risk-segment" />
        <div className="risk-segment" />
      </div>
    </div>
  )
}
