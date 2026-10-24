import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ErrorBanner, Field, SuccessBanner } from '../components/Field.tsx'
import { packBatch } from '../data/repository.ts'
import {
  batchPools,
  batchClassificationLabel,
  drawFromBatches,
  isVoided,
  offeredForBagging,
  withDerivedStatus,
} from '../domain/rules.ts'
import { useAppState } from '../hooks/useAppState.ts'
import type { Classification } from '../types.ts'
import { statusLabel } from '../labels.ts'
import { formatGrams, gramsToOz, roundGrams } from '../units.ts'

export function PackBags() {
  const state = useAppState()
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [classification, setClassification] = useState<Classification>('for-sale')
  const [bagCount, setBagCount] = useState('1')
  const [bagSizeDraft, setBagSizeDraft] = useState<string | null>(null)
  const [weightPerBag, setWeightPerBag] = useState('')
  const [weightTouched, setWeightTouched] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const bagSizeOz = bagSizeDraft ?? (state ? String(state.settings.defaultBagSizeOz) : '')
  const offered = state ? offeredForBagging(state).filter((batch) => !isVoided(batch)) : []
  const offeredIds = new Set(offered.map((batch) => batch.id))
  const chosen = offered
    .filter((batch) => selectedIds.includes(batch.id))
    .sort((a, b) => selectedIds.indexOf(a.id) - selectedIds.indexOf(b.id))
  const defaultWeight = bagSizeOz ? String(Math.round(Number(bagSizeOz) * 28.349523125)) : ''
  const eachWeight = Number(weightTouched ? weightPerBag : weightPerBag || defaultWeight)
  const bags = Number(bagCount)
  const needed = Number.isFinite(eachWeight) && Number.isInteger(bags) && bags > 0 && eachWeight > 0 ? roundGrams(eachWeight * bags) : 0
  const available = roundGrams(chosen.reduce((sum, batch) => sum + batch.roastedWeightRemaining, 0))
  const draws = drawFromBatches(chosen, needed)
  const short = needed > 0 && needed > available
  const canPack = chosen.length > 0 && needed > 0 && !short

  function add(id: number) {
    setSelectedIds((ids) => (ids.includes(id) ? ids : [...ids, id]))
  }

  function remove(id: number) {
    setSelectedIds((ids) => ids.filter((item) => item !== id))
  }

  function move(id: number, offset: number) {
    setSelectedIds((ids) => {
      const from = ids.indexOf(id)
      const to = from + offset
      if (from < 0 || to < 0 || to >= ids.length) return ids
      const next = [...ids]
      next.splice(from, 1)
      next.splice(to, 0, id)
      return next
    })
  }

  async function onPack(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSuccess(null)
    const result = await packBatch({
      batchIds: chosen.map((batch) => batch.id),
      bagCount: Number(bagCount),
      weightPerBag: eachWeight,
      classification,
      bagSizeOz: Number(bagSizeOz),
    })
    if (!result.ok) {
      setError(result.error.message)
      return
    }
    setSuccess(result.info ?? 'Bags packed.')
    setSelectedIds([])
  }

  if (!state) return <p className="muted">Loading inventory…</p>

  return (
    <div className="stack">
      <div className="page-head">
        <h1>Pack bags</h1>
        <p>
          Roasts with remaining weight can be packed immediately. Choose more than one batch to combine them; they are used in the order chosen.
          Default bag size is {state.settings.defaultBagSizeOz} oz.
        </p>
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
            const picked = selectedIds.includes(batch.id)
            return (
              <li key={batch.id} className={picked ? 'is-selected' : undefined}>
                {offeredIds.has(batch.id) ? (
                  <button type="button" className="linkish" onClick={() => (picked ? remove(batch.id) : add(batch.id))}>
                    {picked ? `Remove batch #${batch.id}` : `Add batch #${batch.id}`}
                  </button>
                ) : (
                  <span>Batch #{batch.id}</span>
                )}
                {' · '}
                {batchClassificationLabel(batch)} · {statusLabel(view.status)} · {formatGrams(batchPools(batch).personalRemaining)} personal ·{' '}
                {formatGrams(batchPools(batch).forSaleRemaining)} for sale
                {isVoided(batch) ? ' · void' : view.roastedWeightRemaining <= 0 ? ' · not offered for further bagging' : ''}
              </li>
            )
          })}
        </ul>
      </section>
      <section className="card">
        <h2>Batches in this pack</h2>
        {chosen.length === 0 ? (
          <p className="muted">Add one or more batches above. Their beans are used in the order listed here.</p>
        ) : (
          <ol className="plain">
            {chosen.map((batch, index) => {
              const take = draws.find((draw) => draw.batch.id === batch.id)?.take ?? 0
              return (
                <li key={batch.id}>
                  {index + 1}. Batch #{batch.id} · {formatGrams(batch.roastedWeightRemaining)} remaining · uses {formatGrams(take)}{' '}
                  <button type="button" className="linkish" onClick={() => move(batch.id, -1)} disabled={index === 0} aria-label={`Move batch #${batch.id} up`}>
                    Up
                  </button>{' '}
                  <button
                    type="button"
                    className="linkish"
                    onClick={() => move(batch.id, 1)}
                    disabled={index === chosen.length - 1}
                    aria-label={`Move batch #${batch.id} down`}
                  >
                    Down
                  </button>{' '}
                  <button type="button" className="linkish" onClick={() => remove(batch.id)} aria-label={`Remove batch #${batch.id} from this pack`}>
                    Remove
                  </button>
                </li>
              )
            })}
          </ol>
        )}
        {chosen.length > 0 && needed > 0 ? (
          <p className={short ? 'warning' : 'confirm'}>
            {short
              ? `Short by ${formatGrams(roundGrams(needed - available))}: this pack needs ${formatGrams(needed)} but the chosen batches hold ${formatGrams(available)}. Add another batch or pack fewer bags.`
              : `Needs ${formatGrams(needed)} of ${formatGrams(available)} available in the chosen batches.`}
          </p>
        ) : null}
      </section>
      <form className="stack form" onSubmit={onPack}>
        <div className="form-grid">
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
        <div className="form-actions">
          <button type="submit" disabled={!canPack}>
            Pack bags
          </button>
          <Link to="/">Back to dashboard</Link>
        </div>
      </form>
    </div>
  )
}
