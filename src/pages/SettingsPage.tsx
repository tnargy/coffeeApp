import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { ErrorBanner, Field, SuccessBanner } from '../components/Field.tsx'
import { downloadBackup, parseBackup } from '../backup.ts'
import { importBackup, saveSettings } from '../data/repository.ts'
import { currentStandardPrice } from '../domain/pricing.ts'
import { resolvedTheme } from '../domain/rules.ts'
import { useAppState } from '../hooks/useAppState.ts'
import type { Theme } from '../types.ts'
import { GRAMS_PER_LB, toGrams } from '../units.ts'

type PendingImport = {
  text: string
  lots: number
  batches: number
  sales: number
  customers: number
  linkNotes: boolean
}

export function SettingsPage() {
  const state = useAppState()
  const [reserveDraft, setReserveDraft] = useState<string | null>(null)
  const [bagDraft, setBagDraft] = useState<string | null>(null)
  const [priceDraft, setPriceDraft] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null)
  const reserveLb = reserveDraft ?? (state ? String(Math.round((state.settings.personalUseReserveTargetGrams / GRAMS_PER_LB) * 100) / 100) : '')
  const bagSize = bagDraft ?? (state ? String(state.settings.defaultBagSizeOz) : '')
  const standardPrice = priceDraft ?? (state ? String(currentStandardPrice(state.settings)) : '')

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSuccess(null)
    const result = await saveSettings({
      personalUseReserveTargetGrams: toGrams(Number(reserveLb), 'lb'),
      defaultBagSizeOz: Number(bagSize),
      standardBagPrice: Number(standardPrice),
    })
    if (!result.ok) {
      setError(result.error.message)
      return
    }
    setPriceDraft(null)
    setSuccess('Settings saved. Later sales use this standard price, and later bagging uses this bag size.')
  }

  async function onTheme(theme: Theme) {
    setError(null)
    setSuccess(null)
    const result = await saveSettings({ theme })
    if (!result.ok) {
      setError(result.error.message)
      return
    }
    setSuccess(theme === 'mocha' ? 'Mocha theme on.' : 'Light theme on.')
  }

  async function onPickFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setError(null)
    setSuccess(null)
    const text = await file.text()
    const parsed = parseBackup(text)
    if (!parsed.ok) {
      setPendingImport(null)
      setError(parsed.error)
      return
    }
    setPendingImport({
      text,
      lots: parsed.state.lots.length,
      batches: parsed.state.batches.length,
      sales: parsed.state.sales.length,
      customers: parsed.state.customers.length,
      linkNotes: parsed.state.settings.customersLinkedAt == null,
    })
  }

  function onCancelImport() {
    setPendingImport(null)
    setError(null)
  }

  async function onConfirmImport() {
    if (!pendingImport) return
    setError(null)
    const result = await importBackup(pendingImport.text)
    if (!result.ok) {
      setPendingImport(null)
      setError(result.error)
      return
    }
    setPendingImport(null)
    setSuccess(`Backup imported. ${result.summary}`)
  }

  if (!state) return <p className="muted">Loading inventory…</p>

  return (
    <form className="stack form" onSubmit={onSubmit}>
      <div className="page-head">
        <h1>Settings</h1>
        <p>Personal-use reserve defaults to about 1 lb per month. Default bag size starts at 8 oz. Standard bag price starts at $12.</p>
      </div>
      <ErrorBanner message={error} />
      <SuccessBanner message={success} />
      <Field label="Appearance" hint="Applies immediately. Does not change reserve or bag size.">
        <select value={resolvedTheme(state.settings)} onChange={(event) => onTheme(event.target.value === 'mocha' ? 'mocha' : 'light')}>
          <option value="light">Light</option>
          <option value="mocha">Mocha</option>
        </select>
      </Field>
      <div className="form-grid">
        <Field label="Personal-use reserve (lb)">
          <input value={reserveLb} onChange={(event) => setReserveDraft(event.target.value)} inputMode="decimal" required />
        </Field>
        <Field label="Default bag size (oz)">
          <input value={bagSize} onChange={(event) => setBagDraft(event.target.value)} inputMode="decimal" required />
        </Field>
        <Field label="Standard bag price ($)" hint="Future sales, break-even, and forward margin use this. Past sales keep the price stored when they were recorded.">
          <input value={standardPrice} onChange={(event) => setPriceDraft(event.target.value)} inputMode="decimal" required />
        </Field>
      </div>
      <div className="form-actions">
        <button type="submit">Save settings</button>
      </div>
      <section className="card">
        <h2>Backup</h2>
        <p className="muted">
          Download a JSON backup of every lot, profile, roast, bag, sale, customer, and setting. Import a backup to replace the
          data in this browser, for example to move to another machine.
        </p>
        <div className="form-actions">
          <button type="button" onClick={() => downloadBackup(state)}>
            Export JSON backup
          </button>
        </div>
        <Field label="Import a backup" hint="Replaces everything in this browser. You will be asked to confirm.">
          <input type="file" accept="application/json,.json" onChange={onPickFile} />
        </Field>
        {pendingImport ? (
          <div className="form-grid">
            <p className="warning">
              Import this backup and replace the data in this browser? It has {pendingImport.lots} lot
              {pendingImport.lots === 1 ? '' : 's'}, {pendingImport.batches} roast{pendingImport.batches === 1 ? '' : 's'},{' '}
              {pendingImport.sales} sale{pendingImport.sales === 1 ? '' : 's'}, and {pendingImport.customers} customer
              {pendingImport.customers === 1 ? '' : 's'}. The current data is replaced, not merged.
              {pendingImport.linkNotes ? ' Sale notes that name a buyer will be linked once.' : ''} Export a backup first if you want to keep it.
            </p>
            <div className="form-actions">
              <button type="button" onClick={onConfirmImport}>
                Confirm import
              </button>
              <button type="button" className="secondary" onClick={onCancelImport}>
                Cancel
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </form>
  )
}
