const STEPS = [
  { key: 'upload', label: 'Upload', desc: 'File received and job created' },
  { key: 'extraction', label: 'Extraction', desc: 'AI reads invoice fields' },
  { key: 'validation', label: 'Validation', desc: 'Required fields checked' },
  { key: 'vendor', label: 'Vendor Verification', desc: 'Vendor status confirmed' },
  { key: 'po', label: 'PO Matching', desc: 'Purchase order identified' },
  { key: 'reconciliation', label: 'Amount Reconciliation', desc: 'Amount vs PO balance' },
  { key: 'duplicate', label: 'Duplicate Check', desc: 'Invoice history scanned' },
  { key: 'decision', label: 'Decision Generated', desc: 'Final result produced' },
]

function getStepState(invoice, stepKey) {
  if (!invoice || invoice.status === 'PROCESSING') {
    // Determine active step based on what's populated
    if (!invoice) return 'pending'
    if (stepKey === 'upload') return 'done'
    return 'pending'
  }
  if (invoice.status === 'FAILED') return stepKey === 'upload' ? 'done' : 'error'

  const doneMap = {
    upload: true,
    extraction: !!invoice.extraction_result,
    validation: !!invoice.validation_result,
    vendor: !!invoice.vendor_check_result,
    po: !!invoice.po_match_result,
    reconciliation: !!invoice.reconciliation_result,
    duplicate: !!invoice.duplicate_result,
    decision: !!invoice.decision_result,
  }
  return doneMap[stepKey] ? 'done' : 'pending'
}

function stepIcon(state, key) {
  const icons = {
    upload: '⬆', extraction: '🔍', validation: '✓', vendor: '🏢',
    po: '📄', reconciliation: '💰', duplicate: '🔁', decision: '🧠',
  }
  if (state === 'done') return '✓'
  if (state === 'active') return '◌'
  if (state === 'error') return '✕'
  return icons[key] || '○'
}

export function ProcessingTimeline({ invoice }) {
  return (
    <div className="timeline">
      {STEPS.map((step, i) => {
        const state = getStepState(invoice, step.key)
        return (
          <div key={step.key} className={`timeline-step step-${state}`}>
            <div className={`step-dot ${state}`}>{stepIcon(state, step.key)}</div>
            <div className="step-content">
              <div className="step-name">{step.label}</div>
              <div className="step-desc">{step.desc}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
