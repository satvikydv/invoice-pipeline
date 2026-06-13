export function StatusBadge({ status }) {
  const map = {
    APPROVED: { cls: 'badge-approved', icon: '✓', label: 'Approved' },
    REVIEW_REQUIRED: { cls: 'badge-review', icon: '⚠', label: 'Review Required' },
    REJECTED: { cls: 'badge-rejected', icon: '✕', label: 'Rejected' },
    PROCESSING: { cls: 'badge-processing', icon: '◌', label: 'Processing' },
    FAILED: { cls: 'badge-failed', icon: '!', label: 'Failed' },
  }
  const cfg = map[status] || map.FAILED
  return (
    <span className={`badge ${cfg.cls}`}>
      <span>{cfg.icon}</span>
      {cfg.label}
    </span>
  )
}
