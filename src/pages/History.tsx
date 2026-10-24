import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { chipFor, iconFor } from '../activityIcons.ts'
import { Icon } from '../components/Icon.tsx'
import { batchClassificationLabel, batchTrail, lotTrail } from '../domain/rules.ts'
import { useAppState } from '../hooks/useAppState.ts'
import { formatDate, formatWhen } from '../units.ts'

export function History() {
  const state = useAppState()
  const [params, setParams] = useSearchParams()
  const batchId = params.get('batch')
  const lotId = params.get('lot')

  useEffect(() => {
    if (!state || batchId || lotId) return
    const latestBatch = [...state.batches].sort((a, b) => b.roastDate.localeCompare(a.roastDate) || b.id - a.id)[0]
    if (latestBatch) {
      setParams({ batch: String(latestBatch.id) }, { replace: true })
      return
    }
    const latestLot = [...state.lots].sort((a, b) => b.dateReceived.localeCompare(a.dateReceived) || b.id - a.id)[0]
    if (latestLot) setParams({ lot: String(latestLot.id) }, { replace: true })
  }, [state, batchId, lotId, setParams])

  if (!state) return <p className="muted">Loading inventory…</p>
  const events = batchId ? batchTrail(state, Number(batchId)) : lotId ? lotTrail(state, Number(lotId)) : []
  const selectedBatch = batchId ? state.batches.find((batch) => batch.id === Number(batchId)) : undefined
  const selectedLot = !batchId && lotId ? state.lots.find((lot) => lot.id === Number(lotId)) : undefined
  const subject = selectedBatch ? `Batch #${selectedBatch.id}` : selectedLot ? selectedLot.name : 'Select a lot or batch'
  const empty = state.lots.length === 0 && state.batches.length === 0

  return (
    <div className="stack">
      <div className="page-head">
        <h1>History trail</h1>
        <p>Green receipt, roast with profile, bagging, then sale.</p>
      </div>
      <div className="split">
        <section className="card">
          <h2>Lots</h2>
          <ul className="plain">
            {state.lots.map((lot) => (
              <li key={lot.id} className={selectedLot?.id === lot.id ? 'is-selected' : undefined}>
                <button type="button" className="linkish" onClick={() => setParams({ lot: String(lot.id) })}>
                  {lot.origin}
                </button>
                {' · '}
                {lot.name}
              </li>
            ))}
          </ul>
          <h2>Batches</h2>
          <ul className="plain">
            {state.batches.map((batch) => (
              <li key={batch.id} className={selectedBatch?.id === batch.id ? 'is-selected' : undefined}>
                <button type="button" className="linkish" onClick={() => setParams({ batch: String(batch.id) })}>
                  Batch #{batch.id}
                </button>
                {' · '}
                {batchClassificationLabel(batch)} · loss {batch.weightLossPercent}%
              </li>
            ))}
          </ul>
        </section>
        <section className="card">
          <h2>{subject}</h2>
          <p className="stage-legend">receipt → roast → rest → bag → sale</p>
          {empty ? <p className="muted">Choose a lot or batch to see its trail.</p> : null}
          <ol className="timeline">
            {events.map((event, index) => (
              <li key={`${event.kind}-${event.at}-${event.batchId ?? 'lot'}-${index}`}>
                <span className={`icon-chip ${chipFor(event.kind)}`} aria-hidden="true">
                  <Icon name={iconFor(event.kind)} />
                </span>
                <div>
                  <span className="kind">{event.title}</span>
                  {event.batchLabel ? <small>{event.batchLabel}</small> : null}
                  <time>{event.kind === 'received' ? formatDate(event.at) : formatWhen(event.at)}</time>
                  <p>{event.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  )
}
