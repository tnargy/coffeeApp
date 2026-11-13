import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ErrorBanner, Field, SuccessBanner } from '../components/Field.tsx'
import { sellBags } from '../data/repository.ts'
import {
  customerOptionLabel,
  customerStanding,
  findCustomerByName,
  grindLabel,
} from '../domain/customers.ts'
import { bagClassification, bagSources } from '../domain/rules.ts'
import { useAppState } from '../hooks/useAppState.ts'
import { classificationLabel } from '../labels.ts'
import type { GrindPreference } from '../types.ts'
import { currentLocalInput, formatGrams, fromLocalInput } from '../units.ts'

export function RecordSale() {
  const state = useAppState()
  const [selected, setSelected] = useState<number[]>([])
  const [amount, setAmount] = useState('')
  const [tax, setTax] = useState('')
  const [date, setDate] = useState(currentLocalInput)
  const [notes, setNotes] = useState('')
  const [paid, setPaid] = useState(true)
  const [customerChoice, setCustomerChoice] = useState('none')
  const [newName, setNewName] = useState('')
  const [newGrind, setNewGrind] = useState<GrindPreference>('unknown')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const available = state?.bags.filter((bag) => bag.status === 'available' && bagClassification(state, bag) === 'for-sale') ?? []

  function toggle(id: number) {
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSuccess(null)
    const iso = fromLocalInput(date)
    if (!iso) {
      setError('Sale date is required.')
      return
    }
    const result = await sellBags({
      baggedUnitIds: selected,
      saleAmount: Number(amount),
      taxAmount: tax === '' ? undefined : Number(tax),
      date: iso,
      notes,
      paid,
      ...(customerChoice === 'new'
        ? { newCustomer: { name: newName, grindPreference: newGrind } }
        : customerChoice !== 'none'
          ? { customerId: Number(customerChoice) }
          : {}),
    })
    if (!result.ok) {
      setError(result.error.message)
      return
    }
    setSuccess('Sale recorded. Bagged inventory decreased. Tax, if entered, was stored and not calculated.')
    setSelected([])
    setAmount('')
    setTax('')
    setNotes('')
    setPaid(true)
    setCustomerChoice('none')
    setNewName('')
    setNewGrind('unknown')
  }

  if (!state) return <p className="muted">Loading inventory…</p>

  const customers = [...state.customers].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
  const picked = customerChoice !== 'none' && customerChoice !== 'new'
    ? state.customers.find((customer) => customer.id === Number(customerChoice))
    : undefined
  const matched = customerChoice === 'new' ? findCustomerByName(state.customers, newName) : undefined
  const preview = picked ?? matched

  return (
    <form className="stack form" onSubmit={onSubmit}>
      <div className="page-head">
        <h1>Record sale</h1>
        <p>Internal record only. No catalog, checkout, or tax calculation. Each sale stays linked to its batch and green lot.</p>
      </div>
      <ErrorBanner message={error} />
      <SuccessBanner message={success} />
      {available.length === 0 ? (
        <p className="muted">
          No bags are available. <Link to="/pack">Pack a batch with remaining roasted weight</Link> first.
        </p>
      ) : (
        <fieldset className="card">
          <legend>Available bags</legend>
          <ul className="checks">
            {available.map((bag) => {
              const sources = bagSources(bag)
              const batchLabel = sources.length > 1 ? `batches ${sources.map((source) => `#${source.batchId}`).join(' + ')}` : `batch #${sources[0].batchId}`
              const origins = [
                ...new Set(
                  sources.flatMap((source) => {
                    const batch = state.batches.find((item) => item.id === source.batchId)
                    const lot = batch ? state.lots.find((item) => item.id === batch.greenLotId) : undefined
                    return lot ? [lot.origin] : []
                  }),
                ),
              ]
              return (
                <li key={bag.id}>
                  <label>
                    <input type="checkbox" checked={selected.includes(bag.id)} onChange={() => toggle(bag.id)} />
                    <span>
                      Bag #{bag.id} · {formatGrams(bag.weight)} · {bag.bagSizeOz} oz · {batchLabel}
                      {` · ${classificationLabel(bagClassification(state, bag))}`}
                      {origins.length ? ` · ${origins.join(' + ')}` : ''}
                    </span>
                  </label>
                </li>
              )
            })}
          </ul>
        </fieldset>
      )}
      <div className="form-grid">
        <Field label="Customer" hint="Optional. Leave this as no customer to keep the sale unlinked.">
          <select value={customerChoice} onChange={(event) => setCustomerChoice(event.target.value)}>
            <option value="none">No customer</option>
            {customers.map((customer) => (
              <option key={customer.id} value={String(customer.id)}>
                {customerOptionLabel(customer)}
              </option>
            ))}
            <option value="new">New customer</option>
          </select>
        </Field>
        {customerChoice === 'new' ? (
          <Field label="New customer name">
            <input value={newName} onChange={(event) => setNewName(event.target.value)} required />
          </Field>
        ) : null}
        {customerChoice === 'new' && !matched ? (
          <Field label="Grind preference">
            <select value={newGrind} onChange={(event) => setNewGrind(event.target.value as GrindPreference)}>
              <option value="unknown">Unknown</option>
              <option value="ground">Ground</option>
              <option value="whole">Whole bean</option>
            </select>
          </Field>
        ) : null}
        {preview ? (
          <p className="muted">
            Grind: {grindLabel(preview.grindPreference)}. Bags bought: {customerStanding(state, preview).bagsBought}.
            {matched ? ` This name matches ${matched.name}, so the sale uses that customer.` : ''}
          </p>
        ) : customerChoice === 'new' && newName.trim() ? (
          <p className="muted">Grind: {grindLabel(newGrind)}. Bags bought: 0.</p>
        ) : null}
        <Field label="Sale amount">
          <input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" required />
        </Field>
        <Field label="Tax amount" hint="Optional. Recorded only — not calculated or filed.">
          <input value={tax} onChange={(event) => setTax(event.target.value)} inputMode="decimal" />
        </Field>
        <Field label="Date">
          <input type="datetime-local" value={date} onChange={(event) => setDate(event.target.value)} required />
        </Field>
        <Field label="Notes" hint="Optional. Use this for who owes the balance or other sale notes.">
          <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} />
        </Field>
        <Field label="Payment" hint="Uncheck if the amount is still to collect. Unpaid sales show on the dashboard.">
          <span className="check-inline">
            <input type="checkbox" checked={paid} onChange={(event) => setPaid(event.target.checked)} />
            Paid
          </span>
        </Field>
      </div>
      <div className="form-actions">
        <button type="submit">Record sale</button>
        <Link to="/">Back to dashboard</Link>
      </div>
    </form>
  )
}
