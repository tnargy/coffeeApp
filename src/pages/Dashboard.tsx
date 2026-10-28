import { useState } from 'react'
import { Link } from 'react-router-dom'
import { chipFor, iconFor } from '../activityIcons.ts'
import { downloadBackup } from '../backup.ts'
import { Icon } from '../components/Icon.tsx'
import type { IconName } from '../components/Icon.tsx'
import { crud } from '../data/repository.ts'
import { batchClassificationLabel, dashboardSummary, isVoided, lotAllotment, pnl, profileLabel, roastTimingText, roastedUse, unpaidBalance, withDerivedStatus } from '../domain/rules.ts'
import { useAppState } from '../hooks/useAppState.ts'
import { statusLabel } from '../labels.ts'
import { QUICK_ACTIONS } from '../routes.ts'
import type { AppState, GreenLot } from '../types.ts'
import { GRAMS_PER_LB, formatGrams, formatMoney, formatPounds, formatWhen, toGrams } from '../units.ts'

export function Dashboard() {
  const state = useAppState()
  if (!state) return <p className="muted">Loading inventory…</p>
  const summary = dashboardSummary(state)
  const books = pnl(state)
  const unpaid = unpaidBalance(state)
  const roasted = roastedUse(state)
  const allotments = state.lots.map((lot) => ({ lot, ...lotAllotment(state, lot) }))
  const unmet = allotments.reduce((sum, item) => sum + item.unmet, 0)
  const covered = allotments.filter((item) => item.covered).length
  const margin =
    books.revenue > 0
      ? `${((books.grossProfit / books.revenue) * 100).toLocaleString('en-US', { maximumFractionDigits: 1 })}%`
      : '—'
  return (
    <div className="stack dash">
      <div className="page-head dash-head">
        <div>
          <h1>Post-roast summary</h1>
          <p>Green versus roasted stock, reserve, and what has been roasted, bagged, or sold.</p>
        </div>
        <button type="button" className="linkish" onClick={() => downloadBackup(state)}>
          Export JSON backup
        </button>
      </div>
      <section className="stats" aria-label="Inventory summary">
        <StatCard
          chip="leaf"
          icon="leaf"
          label="Green beans remaining"
          value={formatGrams(summary.greenRemaining)}
          note="Total green coffee on hand"
          detail={formatGrams(summary.greenRemaining)}
        />
        <StatCard
          chip="bean"
          icon="bean"
          label="Roasted stock"
          value={formatGrams(summary.roastedRemaining)}
          note={`Personal use ${formatGrams(roasted.personal)} · for sale ${formatGrams(roasted.forSale)}`}
          detail={roasted.forSale === 0 ? undefined : roasted.fairToSell === roasted.forSale ? `${formatGrams(roasted.fairToSell)} fair to sell` : roasted.fairToSell > 0 ? `${formatGrams(roasted.fairToSell)} fair to sell` : 'For sale is not fair until the allotment is covered'}
        />
        <StatCard
          chip="bag"
          icon="bag"
          label="Bags ready"
          value={`${summary.bagsReady} ${summary.bagsReady === 1 ? 'bag' : 'bags'}`}
          note={bagsReadyNote(state)}
        />
        <StatCard
          chip={unpaid.count > 0 ? 'money due' : 'money'}
          icon="dollar"
          label="Unpaid sales"
          value={formatMoney(unpaid.total)}
          note={unpaid.count > 0 ? `${unpaid.count} outstanding` : 'No balance due'}
        />
      </section>
      <div className="dash-board">
        <section className="card" id="green-inventory">
          <div className="card-head">
            <h2>
              <span className="icon-chip leaf sm" aria-hidden="true">
                <Icon name="leaf" />
              </span>
              Green bean inventory
            </h2>
            <Link to="/history">View all</Link>
          </div>
          {state.lots.length === 0 ? <p className="muted">No lots yet.</p> : null}
          <ul className="lots">
            {allotments.map(({ lot, reserve, unmet: lotUnmet, fairGreen, covered: lotCovered }) => {
              const pct = lot.weightReceived > 0 ? Math.min(100, (lot.weightRemaining / lot.weightReceived) * 100) : 0
              return (
                <li key={lot.id}>
                  <div className="lot-line">
                    <strong>
                      <Link to={`/history?lot=${lot.id}`}>{lot.name}</Link>
                    </strong>
                    <span>{formatGrams(lot.weightRemaining)}</span>
                  </div>
                  <div
                    className="bar"
                    role="meter"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(pct)}
                    aria-label={`${lot.name} remaining`}
                  >
                    <span style={{ width: `${pct}%` }} />
                  </div>
                  <small>
                    {lot.origin}
                    {lot.process ? ` · ${lot.process}` : ''}
                    {lot.grade ? ` · ${lot.grade}` : ''} · received {formatPounds(lot.weightReceived)}
                  </small>
                  <small>
                    Reserve {formatPounds(reserve)} · unmet {formatGrams(lotUnmet)} · fair green {formatGrams(fairGreen)}
                    {lotCovered ? ' · fair to sell' : ''}
                  </small>
                  <LotReserve lot={lot} reserve={reserve} />
                </li>
              )
            })}
          </ul>
          {state.lots.length > 0 ? (
            <div className="lot-total">
              <span>
                <i className="dot" aria-hidden="true" /> Total
              </span>
              <strong>{formatGrams(summary.greenRemaining)}</strong>
            </div>
          ) : null}
        </section>
        <section className="card">
          <div className="card-head">
            <h2>
              <span className="icon-chip bean sm" aria-hidden="true">
                <Icon name="clock" />
              </span>
              Recent activity
            </h2>
            <Link to="/history">View all</Link>
          </div>
          {summary.activity.length === 0 ? <p className="muted">No activity yet.</p> : null}
          <ul className="feed">
            {summary.activity.map((event) => (
              <li key={event.id} className="feed-item">
                <span className={`icon-chip ${chipFor(event.kind)}`} aria-hidden="true">
                  <Icon name={iconFor(event.kind)} />
                </span>
                <div>
                  <strong>{event.text}</strong>
                  <small>{event.detail}</small>
                  <time dateTime={event.at}>{formatWhen(event.at)}</time>
                </div>
              </li>
            ))}
          </ul>
        </section>
        <aside className="dash-rail">
          <section className={unmet > 0 ? 'card alert-card low' : 'card alert-card'} role="status">
            <h2>
              <span className={`icon-chip ${unmet > 0 ? 'warn' : 'leaf'} sm`} aria-hidden="true">
                <Icon name={unmet > 0 ? 'alert' : 'leaf'} />
              </span>
              {unmet > 0 ? 'Personal allotment open' : 'Personal allotment'}
            </h2>
            <p>
              {formatGrams(unmet)} still reserved across {state.lots.length} lot{state.lots.length === 1 ? '' : 's'}. {covered} covered.
              This does not block roasts or sales.
            </p>
            <a href="#green-inventory">View inventory</a>
          </section>
          <section className="card">
            <h2>
              <span className="icon-chip bean sm" aria-hidden="true">
                <Icon name="bolt" />
              </span>
              Quick actions
            </h2>
            <div className="quick-list">
              {QUICK_ACTIONS.map((action) => (
                <Link key={action.path} className="quick-action" to={action.path}>
                  <span className="icon-chip bean" aria-hidden="true">
                    <Icon name={actionIcon(action.path)} />
                  </span>
                  <span>
                    <strong>{action.label}</strong>
                    <small>{action.detail}</small>
                  </span>
                  <span className="chevron" aria-hidden="true">
                    ›
                  </span>
                </Link>
              ))}
            </div>
          </section>
        </aside>
        <section className="card pnl dash-pnl">
          <div className="card-head">
            <h2>
              <span className="icon-chip bean sm" aria-hidden="true">
                <Icon name="chart" />
              </span>
              P&amp;L snapshot
            </h2>
            <span className="muted">All recorded sales</span>
          </div>
          {state.sales.length === 0 ? <p className="muted">No sales yet. Totals stay at zero until a sale is recorded.</p> : null}
          <div className="pnl-grid">
            <div>
              <span>Revenue</span>
              <strong>{formatMoney(books.revenue)}</strong>
            </div>
            <div>
              <span>Cost of goods</span>
              <strong>{formatMoney(books.cogs)}</strong>
            </div>
            <div>
              <span>Gross profit</span>
              <strong className={books.grossProfit < 0 ? 'loss' : 'gain'}>{formatMoney(books.grossProfit)}</strong>
            </div>
            <div>
              <span>Gross margin</span>
              <strong className={books.grossProfit < 0 ? 'loss' : 'gain'}>{margin}</strong>
            </div>
          </div>
          <small>From recorded sales and bean cost. Tax is stored only and is not calculated or remitted.</small>
        </section>
      </div>
      <div className="dash-secondary">
        <section className="card">
          <h2>Recent profiles</h2>
          {summary.recentProfiles.length === 0 ? <p className="muted">No roasts yet.</p> : null}
          <ul className="plain">
            {summary.recentProfiles.map(({ batch, profile }) => (
              <li key={batch.id}>
                <Link to={`/history?batch=${batch.id}`}>Batch #{batch.id}</Link>
                {' · '}
                {profile ? profileLabel(profile) : 'Profile missing'}
                {isVoided(batch) ? ' · voided' : ''} · charge {profile?.chargeTemp ?? '—'} · DTR {profile?.dtr ?? '—'}% · loss{' '}
                {batch.weightLossPercent}% · {roastTimingText(profile)} · {batchClassificationLabel(batch)} · {formatWhen(batch.roastDate)}
              </li>
            ))}
          </ul>
        </section>
        <section className="card">
          <h2>Bagged and sold</h2>
          {summary.trail.length === 0 ? <p className="muted">No bagging or sales recorded yet.</p> : null}
          <ul className="plain">
            {summary.trail.map((item) => (
              <li key={item.batch.id}>
                <Link to={`/history?batch=${item.batch.id}`}>Batch #{item.batch.id}</Link>
                {' · '}
                {batchClassificationLabel(item.batch)} · {statusLabel(item.batch.status)} · {item.bagged} bagged · {item.sold} sold
                {isVoided(item.batch) ? ' · voided' : ''}
              </li>
            ))}
          </ul>
        </section>
      </div>
      <p className="muted">
        Roasted batches on hand: {state.batches.filter((batch) => withDerivedStatus(batch).roastedWeightRemaining > 0).length}
      </p>
    </div>
  )
}

function StatCard({
  chip,
  icon,
  label,
  value,
  note,
  detail,
}: {
  chip: string
  icon: IconName
  label: string
  value: string
  note: string
  detail?: string
}) {
  return (
    <article className="stat stat-card">
      <span className={`icon-chip ${chip}`} aria-hidden="true">
        <Icon name={icon} />
      </span>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{note}</small>
        {detail ? <small className="stat-detail">{detail}</small> : null}
      </div>
    </article>
  )
}

function bagsReadyNote(state: AppState): string {
  const available = state.bags.filter((bag) => bag.status === 'available')
  if (available.length === 0) return `${state.settings.defaultBagSizeOz} oz default · none packed yet`
  const sizes = [...new Set(available.map((bag) => bag.bagSizeOz))]
  if (sizes.length === 1) return `${sizes[0]} oz bags available`
  return 'Mixed bag sizes available'
}

function LotReserve({ lot, reserve }: { lot: GreenLot; reserve: number }) {
  const [draft, setDraft] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const shown = draft ?? String(Math.round((reserve / GRAMS_PER_LB) * 100) / 100)

  async function save() {
    setError(null)
    const result = await crud.updateLot(lot.id, { personalReserveGrams: toGrams(Number(shown), 'lb') })
    if (!result.ok) {
      setError(result.error.message)
      return
    }
    setDraft(null)
  }

  return (
    <span className="inline">
      <input aria-label={`Reserve for ${lot.name}`} value={shown} onChange={(event) => setDraft(event.target.value)} inputMode="decimal" />
      <button type="button" className="secondary" onClick={save}>
        Save reserve
      </button>
      {error ? <small className="error">{error}</small> : null}
    </span>
  )
}

function actionIcon(path: string): IconName {
  if (path === '/pack') return 'cup'
  if (path === '/sale') return 'bag'
  return 'bean'
}
