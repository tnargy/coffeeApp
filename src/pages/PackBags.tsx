import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ErrorBanner, Field, SuccessBanner } from '../components/Field.tsx'
import { packBatch } from '../data/repository.ts'
import { batchPools, batchClassificationLabel, offeredForBagging, withDerivedStatus } from '../domain/rules.ts'
import { useAppState } from '../hooks/useAppState.ts'
import type { Classification } from '../types.ts'
import { statusLabel } from '../labels.ts'
import { formatGrams, gramsToOz } from '../units.ts'

export function PackBags() {
  const state = useAppState()
  const [batchId, setBatchId] = useState('')
  const [classification, setClassification] = useState<Classification>('for-sale')
  const [bagCount, setBagCount] = useState('1')
  const [bagSizeDraft, setBagSizeDraft] = useState<string | null>(null)
  const [weightPerBag, setWeightPerBag] = useState('')
  const [weightTouched, setWeightTouched] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const bagSizeOz = bagSizeDraft ?? (state ? String(state.settings.defaultBagSizeOz) : '')
  const offered = state ? offeredForBagging(state) : []
  const selected = offered.find((batch) => String(batch.id) === batchId) ?? state?.batches.find((batch) => String(batch.id) === batchId)
  const derived = selected ? withDerivedStatus(selected) : undefined
  const defaultWeight = bagSizeOz ? String(Math.round(Number(bagSizeOz) * 28.349523125)) : ''

  async function onPack(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSuccess(null)
    const result = await packBatch({
      batchId: Number(batchId),
      bagCount: Number(bagCount),
      weightPerBag: Number(weightTouched ? weightPerBag : weightPerBag || defaultWeight),
      classification,
      bagSizeOz: Number(bagSizeOz),
      now: Date.now(),
    })
    if (!result.ok) {
      setError(result.error.message)
      return
    }
    setSuccess(result.info ?? 'Bags packed.')
  }

  if (!state) return <p className="muted">Loading inventory…</p>

  return (
    <div className="stack">
      <div className="page-head">
        <h1>Pack bags</h1>
        <p>Roasts with remaining weight can be packed immediately. Default bag size is {state.settings.defaultBagSizeOz} oz.</p>
      </div>
      <ErrorBanner message={error} />
      <SuccessBanner message={success} />
      {state.batches.length === 0 ? (
        <p className="muted">
          No batches yet. <Link to="/roast">Log a roast</Link> first.
        </p>
      ) : null}
      <section className="card">
        <h2>Batches</h2>
        <ul className="plain">
          {state.batches.map((batch) => {
            const view = withDerivedStatus(batch)
            return (
              <li key={batch.id}>
                <button type="button" className="linkish" onClick={() => setBatchId(String(batch.id))}>
                  Batch #{batch.id}
                </button>
                {' · '}
                {batchClassificationLabel(batch)} · {statusLabel(view.status)} · {formatGrams(batchPools(batch).personalRemaining)} personal ·{' '}
                {formatGrams(batchPools(batch).forSaleRemaining)} for sale
                {view.roastedWeightRemaining <= 0 ? ' · not offered for further bagging' : ''}
              </li>
            )
          })}
        </ul>
      </section>
      <form className="stack form" onSubmit={onPack}>
        <div className="form-grid">
          <Field label="Batch">
            <select value={batchId} onChange={(event) => setBatchId(event.target.value)} required>
              <option value="">Select batch</option>
              {state.batches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  #{batch.id} · {formatGrams(batchPools(batch).personalRemaining)} personal · {formatGrams(batchPools(batch).forSaleRemaining)} for sale
                </option>
              ))}
            </select>
          </Field>
          <Field label="Purpose for these bags">
            <select value={classification} onChange={(event) => setClassification(event.target.value as Classification)}>
              <option value="for-sale">For sale</option>
              <option value="internal">Personal use</option>
            </select>
          </Field>
          <Field label="Bag size (oz)" hint="Defaults to the configured size. Change it here for this pack only.">
            <input value={bagSizeOz} onChange={(event) => setBagSizeDraft(event.target.value)} inputMode="decimal" />
          </Field>
          <Field label="Number of bags">
            <input value={bagCount} onChange={(event) => setBagCount(event.target.value)} inputMode="numeric" required />
          </Field>
          <Field label="Weight per bag (g)" hint={defaultWeight ? `Default for ${bagSizeOz} oz is about ${defaultWeight} g (${gramsToOz(Number(defaultWeight)).toFixed(1)} oz)` : undefined}>
            <input
              value={weightTouched ? weightPerBag : weightPerBag || defaultWeight}
              onChange={(event) => {
                setWeightTouched(true)
                setWeightPerBag(event.target.value)
              }}
              inputMode="decimal"
              required
            />
          </Field>
        </div>
        {derived?.roastedWeightRemaining ? <p className="confirm">Ready to bag.</p> : null}
        <div className="form-actions">
          <button type="submit" disabled={!derived || derived.roastedWeightRemaining <= 0}>
            Pack bags
          </button>
          <Link to="/">Back to dashboard</Link>
        </div>
      </form>
    </div>
  )
}
