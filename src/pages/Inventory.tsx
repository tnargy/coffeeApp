import { Link } from 'react-router-dom'
import { costTrend, displayBags, displayPercent, lotBreakEvens, lotForward } from '../domain/margin.ts'
import type { LotBreakEven } from '../domain/margin.ts'
import { useAppState } from '../hooks/useAppState.ts'
import { formatGrams, formatMoney, formatPounds } from '../units.ts'

export function Inventory() {
  const state = useAppState()
  if (!state) return <p className="muted">Loading inventory…</p>
  const rows = new Map(lotBreakEvens(state).map((row) => [row.lotId, row]))
  const trend = new Map(costTrend(state).map((row) => [row.lotId, row]))
  const lots = new Map(state.lots.map((lot) => [lot.id, lot]))
  return (
    <div className="stack">
      <div className="page-head">
        <h1>Inventory</h1>
        <p>Every green lot, including lots with nothing left to roast.</p>
      </div>
      {state.lots.length === 0 ? <p className="muted">No lots yet.</p> : null}
      <ul className="plain">
        {state.lots.map((lot) => {
          const row = rows.get(lot.id)
          const flag = trend.get(lot.id)
          const compared = flag?.comparatorLotId == null ? undefined : lots.get(flag.comparatorLotId)
          const forward = row ? lotForward(state, lot) : null
          return (
            <li key={lot.id} className="card">
              <strong>
                <Link to={`/history?lot=${lot.id}`}>{lot.name}</Link>
              </strong>
              <p>
                {lot.origin} · received {formatPounds(lot.weightReceived)} · remaining {formatGrams(lot.weightRemaining)}
              </p>
              <p>
                {formatMoney(lot.costPerKg)}/kg · cost {formatMoney(lot.totalCost)}
                {flag?.flagged && flag.jumpFraction != null ? (
                  <span className="flag">
                    {' '}
                    · up {displayPercent(flag.jumpFraction)}
                    {compared ? ` vs ${compared.name}` : ''}
                  </span>
                ) : null}
              </p>
              {row && forward ? <LotMarginLine row={row} forward={forward} /> : null}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function LotMarginLine({ row, forward }: { row: LotBreakEven; forward: ReturnType<typeof lotForward> }) {
  const noCost = row.totalCost === 0
  return (
    <p>
      <span className={row.status === 'covered' ? 'gain' : row.status === 'not covered' ? 'loss' : 'muted'}>
        {row.status}
      </span>
      {' · '}
      {noCost ? 'no break-even' : `${row.bagsToBreakEven} bags to break even`}
      {' · '}forward {displayBags(forward.forwardBags)} bags · {formatMoney(forward.forwardRevenue)} · profit left{' '}
      {formatMoney(forward.forwardProfit)}
    </p>
  )
}
