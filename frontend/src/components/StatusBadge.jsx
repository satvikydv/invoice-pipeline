export function StatusBadge({ status }) {
  const map = {
    APPROVED: { cls: 'badge-approved', icon: '[OK]', label: 'APPROVED' },
    REVIEW_REQUIRED: { cls: 'badge-review', icon: '[WARN]', label: 'REVIEW REQ' },
    REJECTED: { cls: 'badge-rejected', icon: '[FAIL]', label: 'REJECTED' },
    PROCESSING: { cls: 'badge-processing', icon: '[WAIT]', label: 'PROCESSING' },
    FAILED: { cls: 'badge-failed', icon: '[ERR]', label: 'FAILED' },
  }
  const cfg = map[status] || map.FAILED
  return (
    <span className={`badge ${cfg.cls}`}>
      <span style={{ marginRight: '0.25rem' }}>{cfg.icon}</span>
      {cfg.label}
    </span>
  )
}
