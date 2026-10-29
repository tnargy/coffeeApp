import { Link } from 'react-router-dom'
import { useAppState } from '../hooks/useAppState.ts'
import { formatGrams, formatPounds } from '../units.ts'

export function Inventory() {
  const state = useAppState()
  if (!state) return <p className="muted">Loading inventory…</p>
  return (
    <div className="stack">
      <div className="page-head">
        <h1>Inventory</h1>
        <p>Every green lot, including lots with nothing left to roast.</p>
      </div>
      {state.lots.length === 0 ? <p className="muted">No lots yet.</p> : null}
      <ul className="plain">
        {state.lots.map((lot) => (
          <li key={lot.id} className="card">
            <strong>
              <Link to={`/history?lot=${lot.id}`}>{lot.name}</Link>
            </strong>
            <p>
              {lot.origin} · received {formatPounds(lot.weightReceived)} · remaining {formatGrams(lot.weightRemaining)}
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}
