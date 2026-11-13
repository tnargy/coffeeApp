import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ErrorBanner, Field, SuccessBanner } from '../components/Field.tsx'
import { createCustomer, importCustomerDirectory, saveCustomer } from '../data/repository.ts'
import {
  customerDirectorySummary,
  customerStanding,
  customerStatusLabel,
  grindLabel,
} from '../domain/customers.ts'
import { useAppState } from '../hooks/useAppState.ts'
import type { Customer, GrindPreference } from '../types.ts'
import { formatDate, formatMoney } from '../units.ts'

const grindOptions: { value: GrindPreference; label: string }[] = [
  { value: 'unknown', label: 'Unknown' },
  { value: 'ground', label: 'Ground' },
  { value: 'whole', label: 'Whole bean' },
]

export function Customers() {
  const state = useAppState()
  const [name, setName] = useState('')
  const [grind, setGrind] = useState<GrindPreference>('unknown')
  const [notes, setNotes] = useState('')
  const [editing, setEditing] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [editGrind, setEditGrind] = useState<GrindPreference>('unknown')
  const [editNotes, setEditNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  if (!state) return <p className="muted">Loading customers…</p>

  const listed = [...state.customers].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))

  function startEdit(customer: Customer) {
    setEditing(customer.id)
    setEditName(customer.name)
    setEditGrind(customer.grindPreference)
    setEditNotes(customer.notes ?? '')
    setError(null)
    setSuccess(null)
  }

  async function onCreate(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSuccess(null)
    const result = await createCustomer({ name, grindPreference: grind, notes })
    if (!result.ok) {
      setError(result.error.message)
      return
    }
    setName('')
    setGrind('unknown')
    setNotes('')
    setSuccess('Customer added.')
  }

  async function onSave(id: number) {
    setError(null)
    setSuccess(null)
    const result = await saveCustomer(id, { name: editName, grindPreference: editGrind, notes: editNotes })
    if (!result.ok) {
      setError(result.error.message)
      return
    }
    setEditing(null)
    setSuccess('Customer saved.')
  }

  async function onImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setError(null)
    setSuccess(null)
    const result = await importCustomerDirectory(await file.text())
    if (!result.ok) {
      setError(result.error.message)
      return
    }
    setSuccess(result.info ?? 'Customer import finished.')
  }

  return (
    <div className="stack">
      <div className="page-head">
        <h1>Customers</h1>
        <p>Buyers live here, with the grind they usually want. Sales can be linked to a customer. Nothing here is a storefront.</p>
        <p className="customer-summary">{customerDirectorySummary(state)}</p>
      </div>
      <ErrorBanner message={error} />
      <SuccessBanner message={success} />

      <form className="card stack" onSubmit={onCreate}>
        <h2>Add a customer</h2>
        <div className="form-grid">
          <Field label="Name">
            <input value={name} onChange={(event) => setName(event.target.value)} required />
          </Field>
          <Field label="Grind preference">
            <select value={grind} onChange={(event) => setGrind(event.target.value as GrindPreference)}>
              {grindOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Notes" hint="Optional. Only you see this.">
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={2} />
          </Field>
        </div>
        <div className="form-actions">
          <button type="submit">Add customer</button>
          <Link to="/sale">Record a sale</Link>
        </div>
      </form>

      <section className="card">
        <h2>Directory</h2>
        {listed.length === 0 ? <p className="muted">No customers yet. Add one, or import a JSON file.</p> : null}
        <ul className="plain">
          {listed.map((customer) => {
            const standing = customerStanding(state, customer)
            return (
              <li key={customer.id} className="card">
                <strong>{customer.name}</strong>
                <p>
                  {customerStatusLabel(standing.status)} · {grindLabel(customer.grindPreference)} · {standing.bagsBought}{' '}
                  {standing.bagsBought === 1 ? 'bag' : 'bags'} · {formatMoney(standing.totalSpent)}
                  {standing.lastPurchaseDate ? ` · last purchase ${formatDate(standing.lastPurchaseDate)}` : ''}
                </p>
                {customer.notes ? <p>{customer.notes}</p> : null}
                {editing === customer.id ? (
                  <div className="form-grid">
                    <Field label="Name">
                      <input value={editName} onChange={(event) => setEditName(event.target.value)} />
                    </Field>
                    <Field label="Grind preference">
                      <select value={editGrind} onChange={(event) => setEditGrind(event.target.value as GrindPreference)}>
                        {grindOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Notes">
                      <textarea value={editNotes} onChange={(event) => setEditNotes(event.target.value)} rows={2} />
                    </Field>
                    <div className="form-actions">
                      <button type="button" onClick={() => onSave(customer.id)}>
                        Save customer
                      </button>
                      <button type="button" className="secondary" onClick={() => setEditing(null)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="form-actions">
                    <button type="button" className="secondary" onClick={() => startEdit(customer)}>
                      Edit {customer.name}
                    </button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </section>

      <section className="card">
        <h2>Import customers</h2>
        <p className="muted">
          Adds customers from a JSON file and skips names that already exist. It does not replace sales, delete anyone, or run on its own.
        </p>
        <Field
          label="Customer import file"
          hint='Use { "format": "coffeeApp customers import v1", "customers": [{ "name": "...", "grindPreference": "ground" }] }. A missing grind preference is stored as unknown.'
        >
          <input type="file" accept="application/json,.json" onChange={onImport} />
        </Field>
      </section>
    </div>
  )
}
