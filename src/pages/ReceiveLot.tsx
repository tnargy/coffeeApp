import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ErrorBanner, Field, SuccessBanner } from '../components/Field.tsx'
import { receiveGreenLot } from '../data/repository.ts'
import { useAppState } from '../hooks/useAppState.ts'
import { GRAMS_PER_LB, currentLocalDate, toGrams } from '../units.ts'

export function ReceiveLot() {
  const state = useAppState()
  const [name, setName] = useState('')
  const [origin, setOrigin] = useState('')
  const [process, setProcess] = useState('')
  const [grade, setGrade] = useState('')
  const [weight, setWeight] = useState('')
  const [date, setDate] = useState(currentLocalDate)
  const [costMode, setCostMode] = useState<'total' | 'perKg'>('total')
  const [cost, setCost] = useState('')
  const [notes, setNotes] = useState('')
  const [reserve, setReserve] = useState('')
  const [reserveTouched, setReserveTouched] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSuccess(null)
    if (!date) {
      setError('Receipt date is required.')
      return
    }
    const weightReceived = toGrams(Number(weight), 'lb')
    const reserveLb = reserveTouched ? Number(reserve) : defaultReserveLb(state?.settings.personalUseReserveTargetGrams ?? GRAMS_PER_LB, weightReceived)
    const amount = Number(cost)
    const result = await receiveGreenLot({
      name,
      origin,
      process,
      grade,
      weightReceived,
      dateReceived: date,
      totalCost: costMode === 'total' ? amount : undefined,
      costPerKg: costMode === 'perKg' ? amount : undefined,
      notes,
      personalReserveGrams: toGrams(reserveLb, 'lb'),
    })
    if (!result.ok) {
      setError(result.error.message)
      return
    }
    setSuccess(`Recorded ${origin.trim() || 'lot'}. Green inventory increased.`)
    setName('')
    setOrigin('')
    setProcess('')
    setGrade('')
    setWeight('')
    setCost('')
    setNotes('')
    setReserve('')
    setReserveTouched(false)
  }

  if (!state) return <p className="muted">Loading inventory…</p>
  const reserveShown = reserveTouched ? reserve : String(defaultReserveLb(state.settings.personalUseReserveTargetGrams, toGrams(Number(weight), 'lb')))

  return (
    <form className="stack form" onSubmit={onSubmit}>
      <div className="page-head">
        <h1>Receive green beans</h1>
        <p>Origin, weight, date, and cost are recorded on the lot. Stock increases by the weight received.</p>
      </div>
      <ErrorBanner message={error} />
      <SuccessBanner message={success} />
      <div className="form-grid">
        <Field label="Origin">
          <input value={origin} onChange={(event) => setOrigin(event.target.value)} required />
        </Field>
        <Field label="Name" hint="Defaults to origin">
          <input value={name} onChange={(event) => setName(event.target.value)} />
        </Field>
        <Field label="Process">
          <input value={process} onChange={(event) => setProcess(event.target.value)} />
        </Field>
        <Field label="Grade">
          <input value={grade} onChange={(event) => setGrade(event.target.value)} />
        </Field>
        <Field label="Weight (lb)">
          <input value={weight} onChange={(event) => setWeight(event.target.value)} inputMode="decimal" required />
        </Field>
        <Field label="Date received">
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
        </Field>
        <Field label="Cost">
          <span className="inline">
            <input value={cost} onChange={(event) => setCost(event.target.value)} inputMode="decimal" required />
            <select value={costMode} onChange={(event) => setCostMode(event.target.value as 'total' | 'perKg')}>
              <option value="total">total</option>
              <option value="perKg">per kg</option>
            </select>
          </span>
        </Field>
        <Field label="Personal reserve (lb)" hint="Defaults to about 1 lb, capped at the weight received. Use 0 if none of this lot is reserved.">
          <input
            value={reserveShown}
            onChange={(event) => {
              setReserveTouched(true)
              setReserve(event.target.value)
            }}
            inputMode="decimal"
            required
          />
        </Field>
        <Field label="Notes">
          <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} />
        </Field>
      </div>
      <div className="form-actions">
        <button type="submit">Record lot</button>
        <Link to="/">Back to dashboard</Link>
      </div>
    </form>
  )
}

function defaultReserveLb(targetGrams: number, weightGrams: number): number {
  const cap = Number.isFinite(weightGrams) && weightGrams > 0 ? Math.min(targetGrams, weightGrams) : targetGrams
  return Math.round((cap / GRAMS_PER_LB) * 100) / 100
}
