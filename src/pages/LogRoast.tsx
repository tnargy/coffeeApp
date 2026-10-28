import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ErrorBanner, Field, SuccessBanner } from '../components/Field.tsx'
import { logRoast } from '../data/repository.ts'
import { useAppState } from '../hooks/useAppState.ts'
import { currentLocalInput, formatGrams, formatTime, fromLocalInput, parseTime, toGrams } from '../units.ts'
import { roastFormPrefill } from './roastPrefill.ts'

export function LogRoast() {
  const state = useAppState()
  const [searchParams] = useSearchParams()
  const [prefill] = useState(() => roastFormPrefill(searchParams))
  const [lotId, setLotId] = useState('')
  const [green, setGreen] = useState(prefill.green ?? '')
  const [yieldAmount, setYieldAmount] = useState('')
  const [personalYield, setPersonalYield] = useState('0')
  const [roastDate, setRoastDate] = useState(currentLocalInput)
  const [profileId, setProfileId] = useState('')
  const [name, setName] = useState('')
  const [beansName, setBeansName] = useState(prefill.beansName ?? '')
  const [chargeTemp, setChargeTemp] = useState(prefill.chargeTemp ?? '')
  const [batchSize, setBatchSize] = useState('')
  const [dtr, setDtr] = useState(prefill.dtr ?? '')
  const [weightLoss, setWeightLoss] = useState('')
  const [lossTouched, setLossTouched] = useState(false)
  const [totalTime, setTotalTime] = useState(prefill.totalTime ?? '')
  const [firstCrack, setFirstCrack] = useState(prefill.firstCrack ?? '')
  const [dropTemp, setDropTemp] = useState(prefill.dropTemp ?? '')
  const [notes, setNotes] = useState('')
  const [saveAsNew, setSaveAsNew] = useState(true)
  const [updateExisting, setUpdateExisting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const selectedLot = state?.lots.find((lot) => String(lot.id) === lotId)
  const suggestedLoss = useMemo(() => {
    const greenGrams = Number(green)
    const yieldGrams = Number(yieldAmount)
    if (!Number.isFinite(greenGrams) || greenGrams <= 0 || !Number.isFinite(yieldGrams)) return ''
    return (((greenGrams - yieldGrams) / greenGrams) * 100).toFixed(2)
  }, [green, yieldAmount])

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSuccess(null)
    const date = fromLocalInput(roastDate)
    if (!date) {
      setError('Roast date is required. Roasts may be recorded out of chronological order.')
      return
    }
    const lossValue = lossTouched ? weightLoss : weightLoss || suggestedLoss
    const totalTimeSeconds = readTime(totalTime)
    if (totalTimeSeconds === null) {
      setError('Total time must be mm:ss.')
      return
    }
    const firstCrackSeconds = readTime(firstCrack)
    if (firstCrackSeconds === null) {
      setError('First-crack time must be mm:ss.')
      return
    }
    const drop = readDropTemp(dropTemp)
    if (drop === null) {
      setError('Drop temperature must be a positive number.')
      return
    }
    const result = await logRoast({
      greenLotId: Number(lotId),
      greenWeightCharged: toGrams(Number(green), 'g'),
      roastedYield: toGrams(Number(yieldAmount), 'g'),
      personalYield: toGrams(Number(personalYield), 'g'),
      classification: Number(yieldAmount) > 0 && Number(personalYield) >= Number(yieldAmount) ? 'internal' : 'for-sale',
      roastDate: date,
      profileId: profileId ? Number(profileId) : undefined,
      saveAsNew,
      updateExisting: Boolean(profileId) && updateExisting && !saveAsNew,
      profile: {
        name,
        beansName,
        chargeTemp: Number(chargeTemp),
        batchSize: Number(batchSize),
        dtr: Number(dtr),
        weightLossPercent: Number(lossValue),
        notes,
        totalTimeSeconds,
        firstCrackSeconds,
        dropTemp: drop,
      },
    })
    if (!result.ok) {
      setError(result.error.message)
      return
    }
    setSuccess('Roast recorded. Green stock decreased and roasted stock increased. A low reserve does not block this.')
    setGreen('')
    setYieldAmount('')
    setWeightLoss('')
    setLossTouched(false)
  }

  if (!state) return <p className="muted">Loading inventory…</p>

  return (
    <form className="stack form" onSubmit={onSubmit}>
      <div className="page-head">
        <h1>Log roast</h1>
        <p>A complete profile is required. Split the roasted yield between personal use and for sale. Dates may be out of order.</p>
      </div>
      <ErrorBanner message={error} />
      <SuccessBanner message={success} />
      {state.lots.length === 0 ? (
        <p className="warning">
          No green lots yet. <Link to="/receive">Receive green beans</Link> first.
        </p>
      ) : null}
      <div className="form-grid">
        <Field label="Green lot" hint={selectedLot ? `${formatGrams(selectedLot.weightRemaining)} remaining` : undefined}>
          <select value={lotId} onChange={(event) => setLotId(event.target.value)} required>
            <option value="">Select lot</option>
            {state.lots.map((lot) => (
              <option key={lot.id} value={lot.id}>
                {lot.name} · {formatGrams(lot.weightRemaining)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Green weight charged (g)">
          <input value={green} onChange={(event) => setGreen(event.target.value)} inputMode="decimal" required />
        </Field>
        <Field label="Roasted yield (g)">
          <input value={yieldAmount} onChange={(event) => setYieldAmount(event.target.value)} inputMode="decimal" required />
        </Field>
        <Field label="Personal use (g)" hint="Defaults to 0 g; the remaining yield is for sale.">
          <input value={personalYield} onChange={(event) => setPersonalYield(event.target.value)} inputMode="decimal" min="0" required />
        </Field>
        <p className="muted">For sale: {formatGrams(Math.max(0, Number(yieldAmount || 0) - Number(personalYield || 0)))}</p>
        <Field label="Roast date" hint="Earlier than an existing batch is allowed">
          <input type="datetime-local" value={roastDate} onChange={(event) => setRoastDate(event.target.value)} required />
        </Field>
        <Field label="Use saved profile" hint="Selecting one fills the fields. You can still change any value for this batch.">
          <select
            value={profileId}
            onChange={(event) => {
              const nextId = event.target.value
              setProfileId(nextId)
              const selected = state.profiles.find((profile) => String(profile.id) === nextId)
              if (!selected) {
                setSaveAsNew(true)
                setUpdateExisting(false)
                return
              }
              setName(selected.name ?? '')
              setBeansName(selected.beansName)
              setChargeTemp(String(selected.chargeTemp))
              setBatchSize(String(selected.batchSize))
              setDtr(String(selected.dtr))
              setWeightLoss(String(selected.weightLossPercent))
              setLossTouched(true)
              setTotalTime(selected.totalTimeSeconds == null ? '' : formatTime(selected.totalTimeSeconds))
              setFirstCrack(selected.firstCrackSeconds == null ? '' : formatTime(selected.firstCrackSeconds))
              setDropTemp(selected.dropTemp == null ? '' : String(selected.dropTemp))
              setNotes(selected.notes ?? '')
              setSaveAsNew(false)
              setUpdateExisting(false)
            }}
          >
            <option value="">Enter a new profile</option>
            {state.profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {(profile.name || profile.beansName)} · {profile.chargeTemp}° · DTR {profile.dtr}% · loss {profile.weightLossPercent}%
              </option>
            ))}
          </select>
        </Field>
        {state.profiles.length === 0 ? <p className="muted">No saved profiles yet. Enter the fields below, then save this one for next time.</p> : null}
        <Field label="Profile name" hint="Optional. Shown in activity and history when set.">
          <input value={name} onChange={(event) => setName(event.target.value)} />
        </Field>
        <Field label="Beans name">
          <input value={beansName} onChange={(event) => setBeansName(event.target.value)} required />
        </Field>
        <Field label="Charge temperature (°F)">
          <input value={chargeTemp} onChange={(event) => setChargeTemp(event.target.value)} inputMode="decimal" required />
        </Field>
        <Field label="Profile batch size (g)">
          <input value={batchSize} onChange={(event) => setBatchSize(event.target.value)} inputMode="decimal" required />
        </Field>
        <Field label="DTR (%)">
          <input value={dtr} onChange={(event) => setDtr(event.target.value)} inputMode="decimal" required />
        </Field>
        <Field label="Weight loss (%)" hint={suggestedLoss ? `Suggested from weights: ${suggestedLoss}` : undefined}>
          <input
            value={lossTouched ? weightLoss : weightLoss || suggestedLoss}
            onChange={(event) => {
              setLossTouched(true)
              setWeightLoss(event.target.value)
            }}
            inputMode="decimal"
            required
          />
        </Field>
        <Field label="Total time" hint="Optional. mm:ss">
          <input value={totalTime} onChange={(event) => setTotalTime(event.target.value)} inputMode="numeric" placeholder="14:37" />
        </Field>
        <Field label="First crack" hint="Optional. mm:ss from charge">
          <input value={firstCrack} onChange={(event) => setFirstCrack(event.target.value)} inputMode="numeric" placeholder="11:57" />
        </Field>
        <Field label="Drop temp (°C)" hint="Optional">
          <input value={dropTemp} onChange={(event) => setDropTemp(event.target.value)} inputMode="decimal" />
        </Field>
        <Field label="Profile notes">
          <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} />
        </Field>
        <label className="check-inline">
          <input type="checkbox" checked={saveAsNew} onChange={(event) => setSaveAsNew(event.target.checked)} />
          Save as new profile
        </label>
        <label className="check-inline">
          <input
            type="checkbox"
            checked={updateExisting && !saveAsNew}
            disabled={!profileId || saveAsNew}
            onChange={(event) => setUpdateExisting(event.target.checked)}
          />
          Update existing profile
        </label>
      </div>
      <div className="form-actions">
        <button type="submit">Record roast</button>
        <Link to="/">Back to dashboard</Link>
      </div>
    </form>
  )
}

function readTime(value: string): number | undefined | null {
  if (value.trim() === '') return undefined
  return parseTime(value)
}

function readDropTemp(value: string): number | undefined | null {
  if (value.trim() === '') return undefined
  const drop = Number(value)
  if (!Number.isFinite(drop) || drop <= 0) return null
  return drop
}
