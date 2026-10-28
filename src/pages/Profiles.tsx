import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ErrorBanner, Field, SuccessBanner } from '../components/Field.tsx'
import { crud } from '../data/repository.ts'
import { profileLabel, roastTimingText, type ProfileInput } from '../domain/rules.ts'
import { useAppState } from '../hooks/useAppState.ts'
import { formatTime, formatWhen, parseTime } from '../units.ts'

const emptyDraft = {
  name: '',
  beansName: '',
  chargeTemp: '',
  batchSize: '',
  dtr: '',
  weightLoss: '',
  notes: '',
  totalTime: '',
  firstCrack: '',
  dropTemp: '',
}

export function Profiles() {
  const state = useAppState()
  const [editing, setEditing] = useState<number | null>(null)
  const [name, setName] = useState('')
  const [notes, setNotes] = useState('')
  const [totalTime, setTotalTime] = useState('')
  const [firstCrack, setFirstCrack] = useState('')
  const [dropTemp, setDropTemp] = useState('')
  const [draft, setDraft] = useState(emptyDraft)
  const [pendingDelete, setPendingDelete] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  if (!state) return <p className="muted">Loading inventory…</p>

  function startEdit(id: number) {
    const profile = state?.profiles.find((item) => item.id === id)
    if (!profile) return
    setEditing(id)
    setName(profile.name ?? '')
    setNotes(profile.notes ?? '')
    setTotalTime(profile.totalTimeSeconds == null ? '' : formatTime(profile.totalTimeSeconds))
    setFirstCrack(profile.firstCrackSeconds == null ? '' : formatTime(profile.firstCrackSeconds))
    setDropTemp(profile.dropTemp == null ? '' : String(profile.dropTemp))
    setPendingDelete(null)
    setError(null)
    setSuccess(null)
  }

  async function saveEdit(id: number) {
    setError(null)
    setSuccess(null)
    const timing = readTiming(totalTime, firstCrack, dropTemp)
    if (!timing.ok) {
      setError(timing.error)
      return
    }
    const result = await crud.updateProfile(id, { name, notes, ...timing.fields })
    if (!result.ok) {
      setError(result.error.message)
      return
    }
    setEditing(null)
    setSuccess('Profile saved. Past batches keep the values recorded at roast time.')
  }

  async function createProfile(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSuccess(null)
    const timing = readTiming(draft.totalTime, draft.firstCrack, draft.dropTemp)
    if (!timing.ok) {
      setError(timing.error)
      return
    }
    const input: ProfileInput = {
      name: draft.name,
      beansName: draft.beansName,
      chargeTemp: Number(draft.chargeTemp),
      batchSize: Number(draft.batchSize),
      dtr: Number(draft.dtr),
      weightLossPercent: Number(draft.weightLoss),
      notes: draft.notes,
      ...timing.fields,
    }
    const result = await crud.createProfile(input)
    if (!result.ok) {
      setError(result.error.message)
      return
    }
    setDraft(emptyDraft)
    setSuccess('Profile saved to the library.')
  }

  async function confirmDelete(id: number) {
    setError(null)
    setSuccess(null)
    const result = await crud.removeProfile(id)
    if (!result.ok) {
      setError(result.error.message)
      return
    }
    setPendingDelete(null)
    setEditing(null)
    setSuccess('Profile removed from the library. Existing batches are unchanged.')
  }

  function setDraftField(field: keyof typeof emptyDraft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }))
  }

  return (
    <div className="stack">
      <div className="page-head">
        <h1>Roast profiles</h1>
        <p>Save a profile here or from Log Roast, then reuse it. Editing a profile does not rewrite batch history.</p>
      </div>
      <ErrorBanner message={error} />
      <SuccessBanner message={success} />
      <form className="card stack form" onSubmit={createProfile}>
        <h2>New profile</h2>
        <div className="form-grid">
          <Field label="Name" hint="Optional">
            <input value={draft.name} onChange={(event) => setDraftField('name', event.target.value)} />
          </Field>
          <Field label="Beans name">
            <input value={draft.beansName} onChange={(event) => setDraftField('beansName', event.target.value)} required />
          </Field>
          <Field label="Charge temperature (°F)">
            <input value={draft.chargeTemp} onChange={(event) => setDraftField('chargeTemp', event.target.value)} inputMode="decimal" required />
          </Field>
          <Field label="Batch size (g)">
            <input value={draft.batchSize} onChange={(event) => setDraftField('batchSize', event.target.value)} inputMode="decimal" required />
          </Field>
          <Field label="DTR (%)">
            <input value={draft.dtr} onChange={(event) => setDraftField('dtr', event.target.value)} inputMode="decimal" required />
          </Field>
          <Field label="Weight loss (%)">
            <input value={draft.weightLoss} onChange={(event) => setDraftField('weightLoss', event.target.value)} inputMode="decimal" required />
          </Field>
          <TimingInputs
            totalTime={draft.totalTime}
            firstCrack={draft.firstCrack}
            dropTemp={draft.dropTemp}
            onTotalTime={(value) => setDraftField('totalTime', value)}
            onFirstCrack={(value) => setDraftField('firstCrack', value)}
            onDropTemp={(value) => setDraftField('dropTemp', value)}
          />
          <Field label="Notes">
            <textarea value={draft.notes} onChange={(event) => setDraftField('notes', event.target.value)} rows={3} />
          </Field>
        </div>
        <div className="form-actions">
          <button type="submit">Save profile</button>
        </div>
      </form>
      {state.profiles.length === 0 ? (
        <p className="muted">
          No saved profiles yet. Save one above, or <Link to="/roast">log a roast</Link> and keep the profile.
        </p>
      ) : (
        <ul className="plain">
          {state.profiles.map((profile) => (
            <li key={profile.id} className="card">
              <strong>{profileLabel(profile)}</strong>
              <p>
                {profile.beansName} · charge {profile.chargeTemp}° · batch {profile.batchSize} g · DTR {profile.dtr}% · loss{' '}
                {profile.weightLossPercent}%
              </p>
              <p>{roastTimingText(profile)}</p>
              {profile.notes ? <p>{profile.notes}</p> : null}
              {profile.updatedAt ? <time>{formatWhen(profile.updatedAt)}</time> : null}
              {editing === profile.id ? (
                <div className="form-grid">
                  <Field label="Name">
                    <input value={name} onChange={(event) => setName(event.target.value)} />
                  </Field>
                  <TimingInputs
                    totalTime={totalTime}
                    firstCrack={firstCrack}
                    dropTemp={dropTemp}
                    onTotalTime={setTotalTime}
                    onFirstCrack={setFirstCrack}
                    onDropTemp={setDropTemp}
                  />
                  <Field label="Notes">
                    <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} />
                  </Field>
                  <div className="form-actions">
                    <button type="button" onClick={() => saveEdit(profile.id)}>
                      Save profile
                    </button>
                    <button type="button" className="secondary" onClick={() => setEditing(null)}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="form-actions">
                  <button type="button" className="secondary" onClick={() => startEdit(profile.id)}>
                    Edit
                  </button>
                  {pendingDelete === profile.id ? (
                    <>
                      <button type="button" onClick={() => confirmDelete(profile.id)}>
                        Confirm delete
                      </button>
                      <button type="button" className="secondary" onClick={() => setPendingDelete(null)}>
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button type="button" className="secondary" onClick={() => setPendingDelete(profile.id)}>
                      Delete
                    </button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function TimingInputs({
  totalTime,
  firstCrack,
  dropTemp,
  onTotalTime,
  onFirstCrack,
  onDropTemp,
}: {
  totalTime: string
  firstCrack: string
  dropTemp: string
  onTotalTime: (value: string) => void
  onFirstCrack: (value: string) => void
  onDropTemp: (value: string) => void
}) {
  return (
    <>
      <Field label="Total time" hint="Optional. mm:ss">
        <input value={totalTime} onChange={(event) => onTotalTime(event.target.value)} inputMode="numeric" placeholder="14:37" />
      </Field>
      <Field label="First crack" hint="Optional. mm:ss from charge">
        <input value={firstCrack} onChange={(event) => onFirstCrack(event.target.value)} inputMode="numeric" placeholder="11:57" />
      </Field>
      <Field label="Drop temp (°C)" hint="Optional">
        <input value={dropTemp} onChange={(event) => onDropTemp(event.target.value)} inputMode="decimal" />
      </Field>
    </>
  )
}

function readTiming(totalTime: string, firstCrack: string, dropTemp: string):
  | { ok: true; fields: Pick<ProfileInput, 'totalTimeSeconds' | 'firstCrackSeconds' | 'dropTemp'> }
  | { ok: false; error: string } {
  const totalTimeSeconds = readTime(totalTime)
  if (totalTimeSeconds === null) return { ok: false, error: 'Total time must be mm:ss.' }
  const firstCrackSeconds = readTime(firstCrack)
  if (firstCrackSeconds === null) return { ok: false, error: 'First-crack time must be mm:ss.' }
  const drop = readDropTemp(dropTemp)
  if (drop === null) return { ok: false, error: 'Drop temperature must be a positive number.' }
  return { ok: true, fields: { totalTimeSeconds, firstCrackSeconds, dropTemp: drop } }
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
