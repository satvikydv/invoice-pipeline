const STEPS = [
  { key: 'upload', label: 'JOB CREATED', desc: 'FILE INGESTED INTO PIPELINE' },
  { key: 'extraction', label: 'EXTRACTION', desc: 'VISION MODEL PARSING FIELDS' },
  { key: 'validation', label: 'VALIDATION', desc: 'STRUCTURAL INTEGRITY CHECK' },
  { key: 'vendor', label: 'VENDOR VERIFY', desc: 'MERCHANT STATUS CONFIRMED' },
  { key: 'po', label: 'PO MATCH', desc: 'PURCHASE ORDER RESOLUTION' },
  { key: 'reconciliation', label: 'RECONCILIATION', desc: 'AMOUNT VS PO BALANCE' },
  { key: 'duplicate', label: 'DUP SCAN', desc: 'LEDGER HISTORY CROSSED' },
  { key: 'decision', label: 'DECISION', desc: 'FINAL RULESET EVALUATION' },
]

function getStepState(invoice, stepKey) {
  if (!invoice) return 'pending'

  // If failed, only completed steps are 'done', the failed step is 'error', rest are 'pending'
  // But we don't know exactly which step failed easily unless we check presence.
  // Actually, we just check presence.
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

  if (doneMap[stepKey]) return 'done'

  const keys = STEPS.map(s => s.key)
  const thisIndex = keys.indexOf(stepKey)
  const prevDone = thisIndex === 0 || doneMap[keys[thisIndex - 1]]

  if (invoice.status === 'FAILED') {
    if (prevDone) return 'error'
    return 'pending'
  }
  
  if (invoice.status === 'PROCESSING') {
    if (prevDone) return 'active'
  }
  
  return 'pending'
}

function stepIcon(state) {
  if (state === 'done') return '[OK]'
  if (state === 'active') return '[..]'
  if (state === 'error') return '[XX]'
  return '[  ]'
}

export function ProcessingTimeline({ invoice }) {
  return (
    <div className="timeline">
      {STEPS.map((step, i) => {
        const state = getStepState(invoice, step.key)
        return (
          <div key={step.key} className={`timeline-step step-${state}`}>
            <div className={`step-dot ${state}`} style={{ fontFamily: 'var(--font-display)', fontSize: '0.8rem', fontWeight: 700 }}>
              {stepIcon(state)}
            </div>
            <div className="step-content">
              <div className="step-name" style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{step.label}</div>
              <div className="step-desc" style={{ textTransform: 'uppercase', fontSize: '0.75rem' }}>{step.desc}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
