import { useState } from 'react'

function AccordionItem({ title, icon, badge, badgeClass, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="accordion-item">
      <div className="accordion-header" onClick={() => setOpen(!open)} role="button" tabIndex={0}>
        <span className="accordion-title">
          <span>{icon}</span>
          {title}
          {badge && <span className={`badge ${badgeClass || ''}`} style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}>{badge}</span>}
        </span>
        <span className={`accordion-chevron ${open ? 'open' : ''}`}>▼</span>
      </div>
      {open && <div className="accordion-body">{children}</div>}
    </div>
  )
}

function JsonDisplay({ data }) {
  return (
    <div className="json-display">
      {JSON.stringify(data, null, 2)}
    </div>
  )
}

function Field({ label, value, mono }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--border)', gap: '1rem' }}>
      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 500, fontFamily: mono ? 'monospace' : 'inherit', textAlign: 'right' }}>
        {value !== null && value !== undefined ? String(value) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
      </span>
    </div>
  )
}

export function AuditAccordion({ invoice }) {
  if (!invoice) return null

  const extraction = invoice.extraction_result || {}
  const fields = extraction.fields || {}
  const validation = invoice.validation_result || {}
  const vendorCheck = invoice.vendor_check_result || {}
  const poMatch = invoice.po_match_result || {}
  const recon = invoice.reconciliation_result || {}
  const dup = invoice.duplicate_result || {}
  const risk = invoice.risk_result || {}
  const decision = invoice.decision_result || {}

  const statusBadge = (s) => {
    if (s === 'PASS' || s === 'success') return { text: 'PASS', cls: 'badge-approved' }
    if (s === 'FAIL' || s === 'REJECTED') return { text: 'FAIL', cls: 'badge-rejected' }
    if (s === 'REVIEW') return { text: 'REVIEW', cls: 'badge-review' }
    if (s === 'SKIP') return { text: 'SKIPPED', cls: 'badge-failed' }
    return { text: s || '?', cls: 'badge-failed' }
  }

  const exBadge = statusBadge(extraction.status)
  const valBadge = statusBadge(validation.status)
  const vendBadge = statusBadge(vendorCheck.status)
  const poBadge = statusBadge(poMatch.status)
  const reconBadge = statusBadge(recon.status)
  const dupBadge = statusBadge(dup.status)

  return (
    <div>
      <AccordionItem title="Document Extraction" icon="🔍" badge={exBadge.text} badgeClass={exBadge.cls}>
        <Field label="Method" value={extraction.method} />
        <Field label="Invoice Number" value={fields.invoice_number} />
        <Field label="Invoice Date" value={fields.invoice_date} />
        <Field label="Vendor Name" value={fields.vendor_name} />
        <Field label="PO Number" value={fields.po_number} />
        <Field label="Subtotal" value={fields.subtotal != null ? `$${fields.subtotal}` : null} />
        <Field label="Tax" value={fields.tax != null ? `$${fields.tax}` : null} />
        <Field label="Total Amount" value={fields.total_amount != null ? `$${fields.total_amount}` : null} />
        <Field label="OCR Confidence" value={fields.ocr_confidence != null ? `${Math.round(fields.ocr_confidence * 100)}%` : null} />
        {extraction.error && (
          <div style={{ marginTop: '0.75rem', padding: '0.5rem', background: 'var(--status-rejected-bg)', border: '1px solid var(--status-rejected-border)', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', color: 'var(--status-rejected)' }}>
            ⚠️ {extraction.error}
          </div>
        )}
      </AccordionItem>

      <AccordionItem title="Field Validation" icon="✅" badge={valBadge.text} badgeClass={valBadge.cls}>
        {validation.required_fields && Object.entries(validation.required_fields).map(([k, v]) => (
          <Field key={k} label={k.replace(/_/g, ' ')} value={v.present ? `✓ ${v.value}` : '✗ Missing'} />
        ))}
        {validation.failed_fields?.length > 0 && (
          <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--status-rejected)' }}>
            Missing: {validation.failed_fields.join(', ')}
          </div>
        )}
      </AccordionItem>

      <AccordionItem title="Vendor Verification" icon="🏢" badge={vendBadge.text} badgeClass={vendBadge.cls}>
        <Field label="Result" value={vendorCheck.result} />
        <Field label="Reason" value={vendorCheck.reason} />
        <Field label="Match Score" value={vendorCheck.match_score != null ? `${vendorCheck.match_score}%` : null} />
        {vendorCheck.matched_vendor && (
          <>
            <Field label="Matched Name" value={vendorCheck.matched_vendor.name} />
            <Field label="Vendor ID" value={vendorCheck.matched_vendor.id} mono />
            <Field label="Status" value={vendorCheck.matched_vendor.status} />
          </>
        )}
      </AccordionItem>

      <AccordionItem title="PO Matching" icon="📄" badge={poBadge.text} badgeClass={poBadge.cls}>
        <Field label="Method" value={poMatch.method} />
        <Field label="Confidence" value={poMatch.confidence != null ? `${Math.round(poMatch.confidence * 100)}%` : null} />
        <Field label="Reason" value={poMatch.reason} />
        {poMatch.matched_po && (
          <>
            <Field label="PO Number" value={poMatch.matched_po.po_number} mono />
            <Field label="Vendor" value={poMatch.matched_po.vendor_name} />
            <Field label="PO Amount" value={`$${poMatch.matched_po.po_amount}`} />
            <Field label="Remaining Balance" value={`$${poMatch.matched_po.remaining_balance}`} />
          </>
        )}
      </AccordionItem>

      <AccordionItem title="Amount Reconciliation" icon="💰" badge={reconBadge.text} badgeClass={reconBadge.cls}>
        <Field label="Invoice Amount" value={recon.invoice_amount != null ? `$${recon.invoice_amount}` : null} />
        <Field label="PO Balance" value={recon.po_balance != null ? `$${recon.po_balance}` : null} />
        <Field label="Difference" value={recon.difference != null ? `$${recon.difference}` : null} />
        <Field label="Variance %" value={recon.difference_pct != null ? `${recon.difference_pct}%` : null} />
        <Field label="Reason" value={recon.reason} />
      </AccordionItem>

      <AccordionItem title="Duplicate Detection" icon="🔁" badge={dupBadge.text} badgeClass={dupBadge.cls}>
        <Field label="Result" value={dup.result} />
        <Field label="Reason" value={dup.reason} />
        {dup.matching_records?.length > 0 && (
          <div style={{ marginTop: '0.75rem' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Matching records:</div>
            <JsonDisplay data={dup.matching_records} />
          </div>
        )}
      </AccordionItem>

      <AccordionItem title="Risk Assessment" icon="⚠️">
        <Field label="Risk Level" value={risk.level} />
        <Field label="Score" value={risk.score} />
        {risk.flags?.length > 0 && (
          <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {risk.flags.map((f, i) => (
              <div key={i} style={{ fontSize: '0.8rem', color: 'var(--status-review)', display: 'flex', gap: '0.5rem' }}>
                <span>▸</span>{f}
              </div>
            ))}
          </div>
        )}
      </AccordionItem>

      <AccordionItem title="Decision Engine" icon="🧠" defaultOpen>
        <Field label="Decision" value={decision.decision} />
        <Field label="Confidence" value={decision.confidence != null ? `${Math.round(decision.confidence * 100)}%` : null} />
        {decision.reasoning?.length > 0 && (
          <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {decision.reasoning.map((r, i) => (
              <div key={i} style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', padding: '0.35rem 0.5rem', background: 'var(--bg-base)', borderRadius: 'var(--radius-sm)' }}>{r}</div>
            ))}
          </div>
        )}
      </AccordionItem>
    </div>
  )
}
