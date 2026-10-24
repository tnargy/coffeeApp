import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ErrorBanner, Field, SuccessBanner } from '../components/Field.tsx'
import { crud } from '../data/repository.ts'
import { profileLabel } from '../domain/rules.ts'
import { useAppState } from '../hooks/useAppState.ts'
import { formatWhen } from '../units.ts'

export function Profiles() {
  const state = useAppState()
  const [editing, setEditing] = useState<number | null>(null)
  const [name, setName] = useState('')
  const [notes, setNotes] = useState('')
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
    setPendingDelete(null)
    setError(null)
    setSuccess(null)
  }

  async function saveEdit(id: number) {
    setError(null)
    setSuccess(null)
    const result = await crud.updateProfile(id, { name, notes })
    if (!result.ok) {
      setError(result.error.message)
      return
    }
    setEditing(null)
    setSuccess('Profile name and notes saved. Past batches keep the values recorded at roast time.')
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

  return (
    <div className="stack">
      <div className="page-head">
        <h1>Roast profiles</h1>
        <p>Save a profile from Log Roast, then reuse it. Editing a name or notes does not rewrite batch history.</p>
      </div>
      <ErrorBanner message={error} />
      <SuccessBanner message={success} />
      {state.profiles.length === 0 ? (
        <p className="muted">
          No saved profiles yet. <Link to="/roast">Log a roast</Link> and save the profile to start the library.
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
              {profile.notes ? <p>{profile.notes}</p> : null}
              {profile.updatedAt ? <time>{formatWhen(profile.updatedAt)}</time> : null}
              {editing === profile.id ? (
                <div className="form-grid">
                  <Field label="Name">
                    <input value={name} onChange={(event) => setName(event.target.value)} />
                  </Field>
                  <Field label="Notes">
                    <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} />
                  </Field>
                  <div className="form-actions">
                    <button type="button" onClick={() => saveEdit(profile.id)}>
                      Save name and notes
                    </button>
                    <button type="button" className="secondary" onClick={() => setEditing(null)}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="form-actions">
                  <button type="button" className="secondary" onClick={() => startEdit(profile.id)}>
                    Edit name or notes
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
