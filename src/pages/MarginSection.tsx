import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  costTrend,
  displayBags,
  displayPercent,
  greenCostConsumed,
  lotBreakEvens,
  lotForward,
  monthlySales,
  personalStockCost,
  whatIfProfit,
  type LotBreakEven,
} from '../domain/margin.ts'
import { currentStandardPrice } from '../domain/pricing.ts'
import type { AppState, GreenLot } from '../types.ts'
import { GRAMS_PER_LB, formatMoney, toGrams } from '../units.ts'

export function PnlExtras({ state }: { state: AppState }) {
  const personal = personalStockCost(state)
  const consumed = greenCostConsumed(state)
  const months = monthlySales(state)
  return (
    <div className="pnl-extra">
      <p>
        Personal stock {formatMoney(personal)} is the green cost of coffee still kept for personal use. It is shown
        apart from cost of goods, not added to it. Sold beans and that stock together are {formatMoney(consumed)} of
        green cost.
      </p>
      {months.length === 0 ? null : (
        <div className="table-wrap">
          <table className="data-table">
            <caption>Sales by month</caption>
            <thead>
              <tr>
                <th>Month</th>
                <th>Bags</th>
                <th>Revenue</th>
                <th>Standard</th>
                <th>Overpay</th>
                <th>Shortfall</th>
              </tr>
            </thead>
            <tbody>
              {months.map((month) => (
                <tr key={month.month}>
                  <td>{monthLabel(month.month)}</td>
                  <td>{displayBags(month.bags)}</td>
                  <td>{formatMoney(month.actualRevenue)}</td>
                  <td>{formatMoney(month.standardRevenue)}</td>
                  <td>{formatMoney(month.overpay)}</td>
                  <td>{formatMoney(month.shortfall)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export function LotMarginSection({ state }: { state: AppState }) {
  const standard = currentStandardPrice(state.settings)
  const [priceDraft, setPriceDraft] = useState<string | null>(null)
  const draft = priceDraft ?? String(standard)
  const price = Number(draft)
  const priceOk = Number.isFinite(price) && price > 0
  // An invalid what-if price is ignored: the section falls back to the
  // current standard price instead of showing a broken what-if.
  const effectivePrice = priceOk ? price : standard
  const shownPrice = priceOk ? draft : String(standard)
  const rows = lotBreakEvens(state)
  const trend = new Map(costTrend(state).map((row) => [row.lotId, row]))
  const lots = new Map(state.lots.map((lot) => [lot.id, lot]))
  return (
    <section className="card" id="lot-margin">
      <div className="card-head">
        <h2>Lot margin</h2>
        <span className="muted">Every lot, including finished ones</span>
      </div>
      <p className="muted">
        Break-even uses the standard price of {formatMoney(standard)} a bag. Forward margin is what is left to sell
        after the lot reserve, at that same price. Bean cost only.
      </p>
      <label className="field what-if-price">
        <span>What-if bag price</span>
        <input
          value={shownPrice}
          onChange={(event) => setPriceDraft(event.target.value)}
          inputMode="decimal"
          aria-describedby="what-if-hint"
        />
        <small id="what-if-hint">
          Changes forward profit per bag and per lot only. Recorded sales, standard revenue, and break-even stay put.
          An invalid price falls back to the standard price.
        </small>
      </label>
      {rows.length === 0 ? <p className="muted">No lots yet.</p> : null}
      {rows.length > 0 ? (
        <div className="table-wrap">
          <table className="data-table lot-margin">
            <thead>
              <tr>
                <th>Lot</th>
                <th>$/kg</th>
                <th>Cost</th>
                <th>Bags sold</th>
                <th>Revenue</th>
                <th>Standard</th>
                <th>Personal</th>
                <th>Profit left</th>
                <th>Break-even</th>
                <th>Still to go</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const lot = lots.get(row.lotId)
                if (!lot) return null
                const flag = trend.get(row.lotId)
                const compared = flag?.comparatorLotId == null ? undefined : lots.get(flag.comparatorLotId)
                return (
                  <LotRows
                    key={lot.id}
                    state={state}
                    lot={lot}
                    row={row}
                    flagged={flag?.flagged === true}
                    jump={flag?.jumpFraction ?? null}
                    compared={compared}
                    whatIfPrice={effectivePrice}
                  />
                )
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  )
}

function LotRows({
  state,
  lot,
  row,
  flagged,
  jump,
  compared,
  whatIfPrice,
}: {
  state: AppState
  lot: GreenLot
  row: LotBreakEven
  flagged: boolean
  jump: number | null
  compared: GreenLot | undefined
  whatIfPrice: number
}) {
  const stored = lot.personalReserveGrams ?? 0
  const [reserveDraft, setReserveDraft] = useState<string | null>(null)
  const shown = reserveDraft ?? String(Math.round((stored / GRAMS_PER_LB) * 100) / 100)
  const reserveGrams = toGrams(Number(shown), 'lb')
  const reserveOk = shown.trim() !== '' && Number.isFinite(reserveGrams) && reserveGrams >= 0
  const forward = lotForward(state, lot, reserveOk ? reserveGrams : undefined)
  const hypothetical = whatIfProfit(forward, whatIfPrice, row.actualRevenue, row.totalCost)
  const noCost = row.totalCost === 0
  return (
    <>
      <tr>
        <td>
          <Link to={`/history?lot=${lot.id}`}>{lot.name}</Link>
          <small className="block">
            {lot.origin}
            {flagged && jump != null ? (
              <span className="flag">
                {' '}
                · up {displayPercent(jump)}
                {compared ? ` vs ${compared.name}` : ''}
              </span>
            ) : null}
          </small>
        </td>
        <td>{formatMoney(lot.costPerKg)}</td>
        <td>{formatMoney(row.totalCost)}</td>
        <td>{displayBags(row.bags)}</td>
        <td>{formatMoney(row.actualRevenue)}</td>
        <td>{formatMoney(row.standardRevenue)}</td>
        <td>{formatMoney(row.personalCost)}</td>
        <td className={row.profitLeft < 0 ? 'loss' : 'gain'}>{formatMoney(row.profitLeft)}</td>
        <td>{noCost ? '—' : row.breakEvenBags}</td>
        <td>{noCost ? '—' : row.bagsToBreakEven}</td>
        <td className={statusClass(row.status)}>{row.status}</td>
      </tr>
      <tr className="forward-row">
        <td colSpan={11}>
          <span>
            Overpay {formatMoney(row.overpay)} · shortfall {formatMoney(row.shortfall)}
            {row.standardMargin == null ? null : ` · standard margin ${displayPercent(row.standardMargin)}`}
            {' · '}
            Forward {displayBags(forward.forwardBags)} bags · {formatMoney(forward.forwardRevenue)} · profit left{' '}
            {formatMoney(forward.forwardProfit)}
            {forward.costPerBag == null ? null : ` · ${formatMoney(forward.costPerBag)} a bag`}
          </span>
          {hypothetical?.perBag == null ? null : (
            <span>
              {' '}
              · what-if {formatMoney(hypothetical.perBag)} a bag, {formatMoney(hypothetical.perLot)} on the lot
            </span>
          )}
          <span className="reserve-what-if">
            <label>
              Reserve what-if (lb)
              <input
                aria-label={`Reserve what-if for ${lot.name}`}
                value={shown}
                onChange={(event) => setReserveDraft(event.target.value)}
                inputMode="decimal"
              />
            </label>
            {reserveOk ? (
              <small>
                Selling the reserve adds {displayBags(forward.reserveSoldExtraBags)} bags,{' '}
                {formatMoney(forward.reserveSoldExtraRevenue)} revenue,{' '}
                {formatMoney(forward.reserveSoldExtraRevenue)} more profit left — the beans are already paid for.
              </small>
            ) : (
              <small className="error">Reserve cannot be negative.</small>
            )}
          </span>
        </td>
      </tr>
    </>
  )
}

function statusClass(status: LotBreakEven['status']): string {
  if (status === 'covered') return 'gain'
  if (status === 'not covered') return 'loss'
  return 'muted'
}

function monthLabel(month: string): string {
  const [year, raw] = month.split('-')
  const index = Number(raw) - 1
  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const name = names[index]
  if (!year || !name) return month
  return `${name} ${year}`
}
