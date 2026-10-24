import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ErrorBanner, Field, SuccessBanner } from '../components/Field.tsx'
import { editRecord, voidRecord } from '../data/repository.ts'
import {
  bagClassification,
  bagSources,
  batchKey,
  baggingKey,
  batchClassificationLabel,
  batchPools,
  isCombinedBag,
  isVoided,
  saleKey,
  voidMarker,
} from '../domain/rules.ts'
import type { RecordChanges, RecordTarget } from '../domain/rules.ts'
import { useAppState } from '../hooks/useAppState.ts'
import type { AuditEntry, BaggedUnit } from '../types.ts'
import { formatDate, formatGrams, formatMoney, formatWhen, roundGrams } from '../units.ts'

type Mode = { action: 'edit' | 'void'; key: string; label: string; combined?: boolean }

export function Records() {
  const state = useAppState()
  const [mode, setMode] = useState<Mode | null>(null)
  const [note, setNote] = useState('')
  const [draft, setDraft] = useState<RecordChanges>({})
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  if (!state) return <p className="muted">Loading inventory…</p>

  const bagGroups = groupBaggings(state.bags)

  function startEdit(target: RecordTarget, label: string, changes: RecordChanges, combined = false) {
    setMode({ action: 'edit', key: keyOf(target), label, combined })
    setDraft(changes)
    setNote('')
    setError(null)
    setSuccess(null)
  }

  function startVoid(target: RecordTarget, label: string) {
    setMode({ action: 'void', key: keyOf(target), label })
    setDraft({})
    setNote('')
    setError(null)
    setSuccess(null)
  }

  function cancel() {
    setMode(null)
    setNote('')
    setDraft({})
  }

  async function submit() {
    if (!mode) return
    const target = targetFromKey(mode.key)
    if (!target) {
      setError('That record could not be found.')
      return
    }
    setError(null)
    setSuccess(null)
    const result =
      mode.action === 'edit'
        ? await editRecord(target, draft, note)
        : await voidRecord(target, note)
    if (!result.ok) {
      setError(result.error.message)
      return
    }
    setSuccess(
      mode.action === 'edit'
        ? `${mode.label} updated. The change is in the change log.`
        : `${mode.label} voided. The record is kept and is out of the current figures.`,
    )
    cancel()
  }

  return (
    <div className="stack">
      <div className="page-head">
        <h1>Records</h1>
        <p>Correct a roast, a bagging, or a sale. Every change needs a note and is kept in the change log.</p>
      </div>
      <ErrorBanner message={error} />
      <SuccessBanner message={success} />

      {mode ? (
        <section className="card">
          <h2>{mode.action === 'edit' ? `Edit ${mode.label}` : `Void ${mode.label}`}</h2>
          {mode.action === 'edit' ? (
            <div className="form-grid">
              {mode.key.startsWith('batch:') ? (
                <>
                  <Field label="Green weight charged (g)">
                    <input
                      value={String(draft.greenWeightCharged ?? '')}
                      onChange={(event) => setDraft({ ...draft, greenWeightCharged: Number(event.target.value) })}
                      inputMode="decimal"
                    />
                  </Field>
                  <Field label="Roasted yield (g)">
                    <input
                      value={String(draft.roastedYield ?? '')}
                      onChange={(event) => setDraft({ ...draft, roastedYield: Number(event.target.value) })}
                      inputMode="decimal"
                    />
                  </Field>
                  <Field label="Personal unbagged weight (g)">
                    <input
                      value={String(draft.personalRemaining ?? '')}
                      onChange={(event) => setDraft({ ...draft, personalRemaining: Number(event.target.value) })}
                      inputMode="decimal"
                    />
                  </Field>
                  <Field label="Roast date">
                    <input
                      type="datetime-local"
                      value={draft.roastDate ?? ''}
                      onChange={(event) => setDraft({ ...draft, roastDate: event.target.value })}
                    />
                  </Field>
                </>
              ) : null}
              {mode.key.startsWith('bagging:') ? (
                <>
                  {mode.combined ? (
                    <p className="muted">
                      This bagging drew from more than one roast, so its weight per bag cannot be edited. Void the bagging and
                      pack again to change it. Bag size can still be changed.
                    </p>
                  ) : (
                    <Field label="Weight per bag (g)">
                      <input
                        value={String(draft.weightPerBag ?? '')}
                        onChange={(event) => setDraft({ ...draft, weightPerBag: Number(event.target.value) })}
                        inputMode="decimal"
                      />
                    </Field>
                  )}
                  <Field label="Bag size (oz)">
                    <input
                      value={String(draft.bagSizeOz ?? '')}
                      onChange={(event) => setDraft({ ...draft, bagSizeOz: Number(event.target.value) })}
                      inputMode="decimal"
                    />
                  </Field>
                </>
              ) : null}
              {mode.key.startsWith('sale:') ? (
                <>
                  <Field label="Sale amount">
                    <input
                      value={String(draft.saleAmount ?? '')}
                      onChange={(event) => setDraft({ ...draft, saleAmount: Number(event.target.value) })}
                      inputMode="decimal"
                    />
                  </Field>
                  <Field label="Tax amount">
                    <input
                      value={String(draft.taxAmount ?? '')}
                      onChange={(event) => setDraft({ ...draft, taxAmount: Number(event.target.value) })}
                      inputMode="decimal"
                    />
                  </Field>
                  <Field label="Sale date">
                    <input
                      type="datetime-local"
                      value={draft.saleDate ?? ''}
                      onChange={(event) => setDraft({ ...draft, saleDate: event.target.value })}
                    />
                  </Field>
                  <Field label="Paid">
                    <select
                      value={draft.paid == null ? '' : draft.paid ? 'yes' : 'no'}
                      onChange={(event) =>
                        setDraft({ ...draft, paid: event.target.value === '' ? undefined : event.target.value === 'yes' })
                      }
                    >
                      <option value="">Unchanged</option>
                      <option value="yes">Paid</option>
                      <option value="no">Unpaid</option>
                    </select>
                  </Field>
                  <Field label="Notes">
                    <textarea
                      value={draft.notes ?? ''}
                      onChange={(event) => setDraft({ ...draft, notes: event.target.value })}
                      rows={3}
                    />
                  </Field>
                </>
              ) : null}
            </div>
          ) : (
            <p className="muted">
              Voiding keeps the record and takes it out of the current figures. Void a sale before its bagging, and a
              bagging before its roast.
            </p>
          )}
          <Field label="Note" hint="Required. Say why this change is being made.">
            <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={2} />
          </Field>
          <div className="form-actions">
            <button type="button" onClick={submit}>
              {mode.action === 'edit' ? 'Save change' : 'Confirm void'}
            </button>
            <button type="button" className="secondary" onClick={cancel}>
              Cancel
            </button>
          </div>
        </section>
      ) : null}

      <section className="card">
        <h2>Roasts</h2>
        {state.batches.length === 0 ? <p className="muted">No roasts yet.</p> : null}
        <ul className="plain">
          {state.batches.map((batch) => (
            <li key={batch.id} className="card">
              <strong>
                <Link to={`/history?batch=${batch.id}`}>Batch #{batch.id}</Link>
              </strong>
              <p>
                {formatGrams(batch.greenWeightCharged)} charged · yield {formatGrams(batch.roastedYield)} ·{' '}
                {batchClassificationLabel(batch)} · {formatGrams(batchPools(batch).personalRemaining)} personal left ·{' '}
                {formatGrams(batchPools(batch).forSaleRemaining)} for sale left · {formatWhen(batch.roastDate)}
              </p>
              {isVoided(batch) ? <p className="muted">{voidMarker(batch).trim()}</p> : null}
              <RecordActions
                label={`Batch #${batch.id}`}
                voided={isVoided(batch)}
                onEdit={() =>
                  startEdit(
                    { entity: 'batch', id: batch.id },
                    `Batch #${batch.id}`,
                    {
                      greenWeightCharged: batch.greenWeightCharged,
                      roastedYield: batch.roastedYield,
                      personalRemaining: batchPools(batch).personalRemaining,
                      roastDate: toLocalInput(batch.roastDate),
                    },
                  )
                }
                onVoid={() => startVoid({ entity: 'batch', id: batch.id }, `Batch #${batch.id}`)}
              />
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2>Baggings</h2>
        {bagGroups.length === 0 ? <p className="muted">No baggings yet.</p> : null}
        <ul className="plain">
          {bagGroups.map(({ batchId, createdAt, bags }) => {
            const total = bags.reduce((sum, bag) => sum + bag.weight, 0)
            const batch = state.batches.find((item) => item.id === batchId)
            const shares = sourceShares(bags)
            const combined = bags.some(isCombinedBag)
            const label = combined ? `Bagging from ${shares.map((share) => `Batch #${share.batchId}`).join(', ')}` : `Bagging from Batch #${batchId}`
            return (
              <li key={`${batchId}-${createdAt}`} className="card">
                <strong>{label}</strong>
                <p>
                  {bags.length} bag{bags.length === 1 ? '' : 's'} · {formatGrams(total)} · {bags[0].bagSizeOz} oz ·{' '}
                  {bagClassification(state, bags[0]) === 'internal' ? 'personal use · ' : 'for sale · '}{formatWhen(createdAt)}
                </p>
                {combined ? (
                  <p className="muted">Combined pack: {shares.map((share) => `Batch #${share.batchId} ${formatGrams(share.weight)}`).join(', ')}</p>
                ) : null}
                {isVoided(bags[0]) ? <p className="muted">{voidMarker(bags[0]).trim()}</p> : null}
                <RecordActions
                  label={label}
                  voided={isVoided(bags[0])}
                  onEdit={() =>
                    startEdit(
                      { entity: 'bagging', batchId, createdAt },
                      label,
                      combined ? { bagSizeOz: bags[0].bagSizeOz } : { weightPerBag: bags[0].weight, bagSizeOz: bags[0].bagSizeOz },
                      combined,
                    )
                  }
                  onVoid={() => startVoid({ entity: 'bagging', batchId, createdAt }, label)}
                />
                {batch ? null : <p className="muted">Its roast is missing.</p>}
              </li>
            )
          })}
        </ul>
      </section>

      <section className="card">
        <h2>Sales</h2>
        {state.sales.length === 0 ? <p className="muted">No sales yet.</p> : null}
        <ul className="plain">
          {state.sales.map((sale) => {
            const label = `Sale #${sale.id}`
            return (
              <li key={sale.id} className="card">
                <strong>{label}</strong>
                <p>
                  {formatMoney(sale.saleAmount)} · {sale.baggedUnitIds.length} bag
                  {sale.baggedUnitIds.length === 1 ? '' : 's'} · {formatDate(sale.date)}
                  {sale.paid === false ? ' · unpaid' : ''}
                </p>
                {isVoided(sale) ? <p className="muted">{voidMarker(sale).trim()}</p> : null}
                <RecordActions
                  label={label}
                  voided={isVoided(sale)}
                  onEdit={() =>
                    startEdit(
                      { entity: 'sale', id: sale.id },
                      label,
                      {
                        saleAmount: sale.saleAmount,
                        taxAmount: sale.taxAmount,
                        saleDate: toLocalInput(sale.date),
                        paid: sale.paid !== false,
                        notes: sale.notes ?? '',
                      },
                    )
                  }
                  onVoid={() => startVoid({ entity: 'sale', id: sale.id }, label)}
                />
              </li>
            )
          })}
        </ul>
      </section>

      <section className="card">
        <h2>Change log</h2>
        {state.audit.length === 0 ? <p className="muted">No edits or voids yet.</p> : null}
        <ul className="plain">
          {[...state.audit]
            .sort((a, b) => b.at.localeCompare(a.at) || b.id - a.id)
            .map((entry) => (
              <li key={entry.id}>
                <strong>
                  {entry.action === 'void' ? 'Voided' : 'Edited'} {auditLabel(entry)}
                </strong>
                <p>{entry.note}</p>
                {entry.changes.length ? (
                  <small>
                    {entry.changes.map((change) => `${change.field}: ${change.from} → ${change.to}`).join(' · ')}
                  </small>
                ) : null}
                <time>{formatWhen(entry.at)}</time>
              </li>
            ))}
        </ul>
      </section>
    </div>
  )
}

function RecordActions({
  label,
  voided,
  onEdit,
  onVoid,
}: {
  label: string
  voided: boolean
  onEdit: () => void
  onVoid: () => void
}) {
  if (voided) {
    return <p className="muted">This record is void. Record the right one instead.</p>
  }
  return (
    <div className="form-actions">
      <button type="button" className="secondary" onClick={onEdit}>
        Edit {label}
      </button>
      <button type="button" className="secondary" onClick={onVoid}>
        Void {label}
      </button>
      <span />
    </div>
  )
}

function groupBaggings(bags: BaggedUnit[]) {
  const groups = new Map<string, BaggedUnit[]>()
  for (const bag of bags) {
    const key = `${bag.batchId}:${bag.createdAt}`
    const group = groups.get(key) ?? []
    group.push(bag)
    groups.set(key, group)
  }
  return [...groups.entries()].map(([key, group]) => {
    const [batchId, ...rest] = key.split(':')
    return { batchId: Number(batchId), createdAt: rest.join(':'), bags: group }
  })
}

function sourceShares(bags: BaggedUnit[]): { batchId: number; weight: number }[] {
  const shares = new Map<number, number>()
  for (const bag of bags) {
    for (const source of bagSources(bag)) shares.set(source.batchId, (shares.get(source.batchId) ?? 0) + source.weight)
  }
  return [...shares.entries()].map(([batchId, weight]) => ({ batchId, weight: roundGrams(weight) })).sort((a, b) => a.batchId - b.batchId)
}

function keyOf(target: RecordTarget): string {
  if (target.entity === 'batch') return batchKey(target.id)
  if (target.entity === 'sale') return saleKey(target.id)
  return baggingKey(target.batchId, target.createdAt)
}

function targetFromKey(key: string): RecordTarget | null {
  const [entity, ...rest] = key.split(':')
  if (entity === 'batch') return { entity: 'batch', id: Number(rest[0]) }
  if (entity === 'sale') return { entity: 'sale', id: Number(rest[0]) }
  if (entity === 'bagging') return { entity: 'bagging', batchId: Number(rest[0]), createdAt: rest.slice(1).join(':') }
  return null
}

function auditLabel(entry: AuditEntry): string {
  if (entry.entity === 'batch') return `Batch #${entry.entityKey.split(':')[1]}`
  if (entry.entity === 'sale') return `Sale #${entry.entityKey.split(':')[1]}`
  const [, batchId] = entry.entityKey.split(':')
  return `Bagging from Batch #${batchId}`
}

function toLocalInput(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}
