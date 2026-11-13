import { describe, expect, it } from 'vitest'
import fixtureDoc from '../../fixtures/nov10-export-fixture.json'
import { parseBackup } from '../backup.ts'
import type { AppState, GreenLot } from '../types.ts'
import { applyEntityUpdate, editRecord, emptyState, packBags, pnl, receiveLot, recordRoast, recordSale, updateSettings, type ProfileInput } from './rules.ts'
import {
  ceilBags,
  costTrend,
  displayBags,
  displayPercent,
  greenCostConsumed,
  lotBreakEvens,
  lotForward,
  lotMoney,
  monthlySales,
  personalStockCost,
  personalYieldCost,
  whatIfProfit,
} from './margin.ts'
import { currentStandardPrice, saleStandardPrice } from './pricing.ts'
import { roundGrams } from '../units.ts'

const fixtureJson = JSON.stringify(fixtureDoc)
const fixture = fixtureDoc as AppState & {
  syntheticCases: Record<string, AppState>
  formatVersion: number
}

function exportState(): AppState {
  const { lots, profiles, batches, bags, sales, audit, settings } = fixture
  return { lots, profiles, batches, bags, sales, audit, settings }
}

const profile: ProfileInput = {
  beansName: 'Test',
  chargeTemp: 390,
  batchSize: 1000,
  dtr: 20,
  weightLossPercent: 14,
}

describe('nov 10 export margins', () => {
  const state = exportState()

  it('imports as a version 2 backup and keeps sales that omit the standard price', () => {
    expect(fixture.formatVersion).toBe(2)
    const parsed = parseBackup(fixtureJson)
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.state.sales.every((sale) => sale.standardPriceAtSale == null)).toBe(true)
    expect(parsed.state.settings.standardBagPrice).toBeUndefined()
    expect(currentStandardPrice(parsed.state.settings)).toBe(12)
    expect(saleStandardPrice(parsed.state.sales[0])).toBe(12)
    expect(pnl(parsed.state)).toEqual(pnl(state))
  })

  it('matches the all-time P&L and separates personal stock from cost of goods', () => {
    const books = pnl(state)
    expect(books).toEqual({ revenue: 186, cogs: 64.39, grossProfit: 121.61 })
    expect(books.grossProfit / books.revenue).toBeCloseTo(0.654, 3)
    expect(personalStockCost(state)).toBe(18.13)
    expect(personalYieldCost(state)).toBe(10.13)
    expect(personalStockCost(state)).not.toBe(personalYieldCost(state))
    expect(greenCostConsumed(state)).toBe(82.51)
    expect(Math.abs(books.cogs + personalStockCost(state) - 82.51)).toBeLessThanOrEqual(0.02)
  })

  it('breaks even the first Guatemala lot and the new $50 lots on the standard price', () => {
    const rows = lotBreakEvens(state)
    expect(rows.map((row) => row.lotId)).toEqual([1, 2, 3, 4, 5])
    const guatemala = rows[0]
    expect(guatemala.totalCost).toBe(39.35)
    expect(displayBags(guatemala.bags)).toBe('6.0')
    expect(guatemala.actualRevenue).toBe(72)
    expect(guatemala.standardRevenue).toBe(72)
    expect(guatemala.profitLeft).toBe(32.65)
    expect(guatemala.breakEvenBags).toBe(4)
    expect(guatemala.bagsToBreakEven).toBe(0)
    expect(guatemala.status).toBe('covered')
    expect(state.lots[0].weightRemaining).toBe(0)
    expect(lotForward(state, state.lots[0]).forwardProfit).toBe(32.65)
    expect(lotForward(state, state.lots[0]).forwardBags).toBe(0)

    for (const row of rows.filter((item) => item.lotId === 4 || item.lotId === 5)) {
      expect(row.totalCost).toBe(50)
      expect(row.breakEvenBags).toBe(5)
      expect(row.status).toBe('not covered')
    }
    expect(rows.every((row) => row.standardRevenue + row.overpay - row.shortfall === row.actualRevenue)).toBe(true)
  })

  it('splits PNG overpay from standard revenue and reports a 61.6% standard margin', () => {
    const png = lotBreakEvens(state).find((row) => row.lotId === 2)
    if (!png) throw new Error('missing PNG')
    expect(png.standardRevenue).toBe(48)
    expect(png.overpay).toBe(18)
    expect(png.shortfall).toBe(0)
    expect(png.actualRevenue).toBe(66)
    expect(displayBags(png.bags)).toBe('4.0')
    expect(png.cogs).toBe(18.44)
    expect(displayPercent(png.standardMargin ?? 0)).toBe('61.6%')
    expect(displayPercent(png.actualMargin ?? 0)).toBe('72.1%')
    const cogs = lotBreakEvens(state).map((row) => row.cogs)
    expect(cogs).toEqual([27.24, 18.44, 18.7, 0, 0])
  })

  it('flags the Nov 9 lots against the Oct 26 price, not against each other', () => {
    const trend = costTrend(state)
    expect(trend.find((row) => row.lotId === 1)?.flagged).toBe(false)
    expect(trend.find((row) => row.lotId === 1)?.comparatorLotId).toBeNull()
    const nov9 = trend.filter((row) => row.lotId === 4 || row.lotId === 5)
    expect(nov9.every((row) => row.flagged)).toBe(true)
    expect(nov9.every((row) => row.comparatorLotId === 3)).toBe(true)
    expect(nov9.every((row) => row.costPerKg === 22.05)).toBe(true)
    expect(displayPercent(nov9[0].jumpFraction ?? 0)).toBe('25.7%')
    expect(state.lots.find((lot) => lot.id === 3)?.costPerKg).toBe(17.54)
    expect(state.lots.find((lot) => lot.id === 3)?.dateReceived.startsWith('2026-10-26')).toBe(true)
  })

  it('projects forward margin for a new 5 lb lot, including reserve what-if and what-if prices', () => {
    const huehue = state.lots.find((lot) => lot.name === 'Guatemala Huehue')
    if (!huehue) throw new Error('missing new lot')
    const forward = lotForward(state, huehue)
    expect(forward.usesOverallLoss).toBe(true)
    expect((forward.loss * 100).toFixed(3)).toBe('13.707')
    expect(displayBags(forward.forwardBags)).toBe('6.9')
    expect(forward.forwardRevenue).toBe(82.77)
    expect(forward.forwardProfit).toBe(32.77)
    expect(displayBags(forward.reserveSoldExtraBags)).toBe('1.7')
    expect(forward.reserveSoldExtraRevenue).toBe(20.69)
    expect(roundGrams(forward.costPerBag ?? 0)).toBe(5.8)

    const open = lotForward(state, huehue, 0)
    expect(displayBags(open.forwardBags)).toBe('8.6')
    expect(open.forwardRevenue).toBe(103.46)
    expect(open.forwardProfit).toBe(53.46)

    const at13 = whatIfProfit(forward, 13, 0, huehue.totalCost)
    const at14 = whatIfProfit(forward, 14, 0, huehue.totalCost)
    expect(at13).toEqual({ perBag: 7.2, perLot: 39.66 })
    expect(at14).toEqual({ perBag: 8.2, perLot: 46.56 })
    expect(lotBreakEvens(state).find((row) => row.lotId === huehue.id)?.breakEvenBags).toBe(5)
  })

  it('groups live sales by UTC month and leaves empty months out', () => {
    expect(monthlySales(state)).toEqual([
      { month: '2026-10', bags: 6, actualRevenue: 72, standardRevenue: 72, overpay: 0, shortfall: 0 },
      { month: '2026-11', bags: 8, actualRevenue: 114, standardRevenue: 96, overpay: 18, shortfall: 0 },
    ])
  })

  it('keeps past standard revenue when the current standard price changes', () => {
    const raised = updateSettings(state, { standardBagPrice: 15 })
    expect(raised.ok).toBe(true)
    if (!raised.ok) return
    const before = lotBreakEvens(state).find((row) => row.lotId === 1)
    const after = lotBreakEvens(raised.state).find((row) => row.lotId === 1)
    if (!before || !after) throw new Error('missing Guatemala')
    expect(after.standardRevenue).toBe(72)
    expect(after.actualRevenue).toBe(before.actualRevenue)
    expect(monthlySales(raised.state)).toEqual(monthlySales(state))
    expect(after.bags + after.bagsToBreakEven).not.toBe(after.breakEvenBags)
    expect(raised.state.sales.every((sale) => sale.standardPriceAtSale == null)).toBe(true)
  })
})

describe('synthetic margin cases', () => {
  it('leaves a voided sale out of revenue and counts its bag as still for sale', () => {
    const state = fixture.syntheticCases.voidedSale
    expect(pnl(state).revenue).toBe(0)
    expect(monthlySales(state)).toEqual([])
    expect(lotBreakEvens(state)[0].bags).toBe(0)
    expect(displayBags(lotForward(state, state.lots[0]).forwardBags)).toBe('1.0')
  })

  it('records a below-standard sale as shortfall, not overpay', () => {
    const state = fixture.syntheticCases.belowStandardSale
    const row = lotBreakEvens(state)[0]
    expect(row.standardRevenue).toBe(12)
    expect(row.shortfall).toBe(2)
    expect(row.overpay).toBe(0)
    expect(row.actualRevenue).toBe(10)
    expect(row.standardMargin).not.toBe(row.actualMargin)
  })

  it('counts an available for-sale bag in forward margin and not in cost of goods', () => {
    const state = fixture.syntheticCases.availableForSaleBag
    expect(pnl(state).cogs).toBe(0)
    expect(lotBreakEvens(state)[0].bags).toBe(0)
    expect(displayBags(lotForward(state, state.lots[0]).forwardBags)).toBe('1.0')
  })

  it('costs unpacked personal coffee apart from the personal-yield split', () => {
    const state = fixture.syntheticCases.unpackedPersonalRemaining
    expect(personalStockCost(state)).toBeGreaterThan(personalYieldCost(state))
    expect(lotForward(state, state.lots[0]).forwardRoasted).toBe(0)
  })

  it('splits a combined bag across lots in proportion to its sources', () => {
    const state = fixture.syntheticCases.crossLotCombinedBag
    const [left, right] = lotMoney(state)
    expect(left.bags).toBeGreaterThan(right.bags)
    expect(left.standardRevenue + right.standardRevenue).toBe(12)
    expect(left.overpay + right.overpay).toBe(3)
    expect(left.shortfall + right.shortfall).toBe(0)
    expect(left.actualRevenue + right.actualRevenue).toBe(15)
    expect(left.actualRevenue).toBe(roundCents(left.standardRevenue + left.overpay - left.shortfall))
    expect(right.actualRevenue).toBe(roundCents(right.standardRevenue + right.overpay - right.shortfall))
    expect(left.cogs).toBeGreaterThan(0)
    expect(right.cogs).toBeGreaterThan(0)
    expect(Math.abs(left.cogs + right.cogs - pnl(state).cogs)).toBeLessThanOrEqual(0.01)
  })
})

describe('standard price bookkeeping', () => {
  it('stores the current standard price on a new sale and refuses to rewrite it', () => {
    const start = sellOne(emptyState(), 18)
    expect(start.sales[0].standardPriceAtSale).toBe(12)
    const priced = updateSettings(start, { standardBagPrice: 15 })
    expect(priced.ok).toBe(true)
    if (!priced.ok) return
    const second = sellOne(priced.state, 15)
    expect(second.sales[0].standardPriceAtSale).toBe(12)
    expect(second.sales[1].standardPriceAtSale).toBe(15)
    const edited = editRecord(second, { entity: 'sale', id: second.sales[0].id }, { saleAmount: 16 }, 'Price check')
    expect(edited.ok).toBe(true)
    if (!edited.ok) return
    expect(edited.state.sales[0].standardPriceAtSale).toBe(12)
    const forced = applyEntityUpdate(edited.state, {
      entity: 'sale',
      id: second.sales[0].id,
      patch: { standardPriceAtSale: 99 },
    })
    expect(forced.ok).toBe(true)
    if (!forced.ok) return
    expect(forced.state.sales[0].standardPriceAtSale).toBe(12)
  })

  it('rejects a standard price that is not above zero', () => {
    for (const standardBagPrice of [0, -1]) {
      const rejected = updateSettings(emptyState(), { standardBagPrice })
      expect(rejected.ok).toBe(false)
      if (rejected.ok) return
      expect(rejected.error.message).toBe('Standard bag price must be greater than zero.')
    }
  })

  it('flags a jump of at least 10% against the latest earlier paid lot on an earlier UTC day', () => {
    const flagged = costTrend(trendState([
      { id: 1, day: '2026-01-01', perKg: 10 },
      { id: 2, day: '2026-01-02', perKg: 11 },
    ]))
    expect(flagged[1].flagged).toBe(true)
    expect(flagged[1].jumpFraction).toBeCloseTo(0.1, 8)

    const under = costTrend(trendState([
      { id: 1, day: '2026-01-01', perKg: 10 },
      { id: 2, day: '2026-01-02', perKg: 10.99 },
    ]))
    expect(under[1].flagged).toBe(false)

    const sameDay = costTrend(trendState([
      { id: 1, day: '2026-01-01', perKg: 10 },
      { id: 2, day: '2026-01-02', perKg: 10, hour: '08:00:00' },
      { id: 3, day: '2026-01-02', perKg: 20, hour: '20:00:00' },
    ]))
    expect(sameDay[1].comparatorLotId).toBe(1)
    expect(sameDay[2].comparatorLotId).toBe(1)
    expect(sameDay[2].flagged).toBe(true)
    expect(sameDay[1].flagged).toBe(false)

    const unpaid = costTrend(trendState([
      { id: 1, day: '2026-01-01', perKg: 10 },
      { id: 2, day: '2026-01-02', perKg: 0, cost: 0 },
      { id: 3, day: '2026-01-03', perKg: 12 },
    ]))
    expect(unpaid[2].comparatorLotId).toBe(1)
    expect(unpaid[1].flagged).toBe(false)
    const books = lotBreakEvens(trendState([{ id: 1, day: '2026-01-01', perKg: 0, cost: 0 }]))
    expect(books[0].status).toBe('no cost')
    expect(ceilBags(0, 12)).toBe(0)
  })
})

function roundCents(value: number): number {
  return Math.round(value * 100) / 100
}

function trendState(rows: { id: number; day: string; perKg: number; cost?: number; hour?: string }[]): AppState {
  const state = emptyState()
  state.lots = rows.map((row) => lot(row.id, row.perKg, row.day, row.cost, row.hour))
  return state
}

function lot(id: number, perKg: number, day: string, cost = perKg, hour = '12:00:00'): GreenLot {
  return {
    id,
    name: `Lot ${id}`,
    origin: 'Test',
    weightReceived: 1000,
    weightRemaining: 1000,
    costPerKg: perKg,
    totalCost: cost,
    dateReceived: `${day}T${hour}.000Z`,
  }
}

function sellOne(state: AppState, amount: number): AppState {
  const received = state.lots.length
    ? { ok: true as const, state }
    : receiveLot(state, {
        origin: 'Ethiopia',
        weightReceived: 2000,
        dateReceived: '2026-03-01',
        totalCost: 20,
        personalReserveGrams: 0,
      })
  if (!received.ok) throw new Error('lot')
  const roasted = received.state.batches.length
    ? received
    : recordRoast(received.state, {
        greenLotId: received.state.lots[0].id,
        greenWeightCharged: 1000,
        roastedYield: 800,
        classification: 'for-sale',
        roastDate: '2026-03-02T00:00:00.000Z',
        profile,
      })
  if (!roasted.ok) throw new Error('roast')
  const open = roasted.state.bags.filter((bag) => bag.status === 'available').length
  const packed = open > 0
    ? roasted
    : packBags(roasted.state, {
        batchId: roasted.state.batches[0].id,
        bagCount: 2,
        weightPerBag: 200,
        now: Date.parse('2026-03-03T00:00:00.000Z'),
      })
  if (!packed.ok) throw new Error('pack')
  const bag = packed.state.bags.find((item) => item.status === 'available')
  if (!bag) throw new Error('bag')
  const sold = recordSale(packed.state, {
    baggedUnitIds: [bag.id],
    saleAmount: amount,
    date: '2026-03-04T00:00:00.000Z',
  })
  if (!sold.ok) throw new Error(sold.error.message)
  return sold.state
}
