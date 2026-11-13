import type { AppState, BaggedUnit, GreenLot, RoastBatch, Sale } from '../types.ts'
import { GRAMS_PER_OZ, roundGrams, roundMoney } from '../units.ts'
import { COST_JUMP_FRACTION, currentStandardPrice, saleStandardPrice } from './pricing.ts'
import {
  bagClassification,
  bagSources,
  batchPools,
  costOfBag,
  isVoided,
  lotAllotment,
  personalCharged,
} from './rules.ts'

export type LotCoverage = 'covered' | 'not covered' | 'no cost'

export interface LotMoney {
  lotId: number
  bags: number
  standardRevenue: number
  overpay: number
  shortfall: number
  actualRevenue: number
  cogs: number
}

export interface LotBreakEven extends LotMoney {
  totalCost: number
  profitLeft: number
  breakEvenBags: number
  bagsToBreakEven: number
  status: LotCoverage
  standardMargin: number | null
  actualMargin: number | null
}

export interface CostTrend {
  lotId: number
  costPerKg: number
  comparatorLotId: number | null
  jumpFraction: number | null
  flagged: boolean
}

export interface ForwardMargin {
  loss: number
  usesOverallLoss: boolean
  forwardRoasted: number
  forwardBags: number
  forwardRevenue: number
  forwardProfit: number
  costPerBag: number | null
  reserveSoldExtraBags: number
  reserveSoldExtraRevenue: number
}

export interface MonthHistory {
  month: string
  bags: number
  actualRevenue: number
  standardRevenue: number
  overpay: number
  shortfall: number
}

export interface WhatIfProfit {
  perBag: number | null
  perLot: number
}

interface WeightShare {
  key: number
  weight: number
}

export function standardBagWeightGrams(bagSizeOz: number): number {
  if (!Number.isFinite(bagSizeOz) || bagSizeOz <= 0) return 0
  return Math.round(bagSizeOz * GRAMS_PER_OZ)
}

export function displayBags(bags: number): string {
  return (Math.round(bags * 10) / 10).toFixed(1)
}

export function displayPercent(fraction: number, digits = 1): string {
  return `${(fraction * 100).toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}%`
}

/** Bags needed to cover `amount` at `price`, rounding up. Zero when the amount is already covered. */
export function ceilBags(amount: number, price: number): number {
  if (!(price > 0)) return 0
  const amountCents = Math.round(Math.max(0, amount) * 100)
  const priceCents = Math.round(price * 100)
  if (amountCents <= 0 || priceCents <= 0) return 0
  return Math.ceil(amountCents / priceCents)
}

export function liveSales(state: AppState): Sale[] {
  return state.sales.filter((sale) => !isVoided(sale))
}

export function utcMonth(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso.slice(0, 7)
  return date.toISOString().slice(0, 7)
}

export function utcDay(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso.slice(0, 10)
  return date.toISOString().slice(0, 10)
}

function roastedCost(state: AppState, batch: RoastBatch, weight: number): number {
  if (weight === 0 || batch.roastedYield <= 0) return 0
  const lot = state.lots.find((item) => item.id === batch.greenLotId)
  if (!lot || lot.weightReceived <= 0) return 0
  return weight * (batch.greenWeightCharged / batch.roastedYield) * (lot.totalCost / lot.weightReceived)
}

function soldBags(state: AppState): BaggedUnit[] {
  return state.bags.filter((bag) => bag.status === 'sold' && !isVoided(bag))
}

export function soldCogsExact(state: AppState): number {
  return soldBags(state).reduce((sum, bag) => sum + costOfBag(state, bag), 0)
}

export function personalStockExact(state: AppState): number {
  let sum = 0
  for (const batch of state.batches) {
    if (isVoided(batch)) continue
    sum += roastedCost(state, batch, batchPools(batch).personalRemaining)
  }
  for (const bag of state.bags) {
    if (isVoided(bag) || bag.status !== 'available' || bagClassification(state, bag) !== 'internal') continue
    sum += costOfBag(state, bag)
  }
  return sum
}

export function personalYieldExact(state: AppState): number {
  return state.batches.reduce((sum, batch) => {
    if (isVoided(batch)) return sum
    return sum + roastedCost(state, batch, batchPools(batch).personalYield)
  }, 0)
}

/** Green-equivalent cost of live personal roasted stock. Not added to COGS. */
export function personalStockCost(state: AppState): number {
  return roundMoney(personalStockExact(state))
}

/** Cost of the personal yield split alone. Live personal bags can make stock cost differ. */
export function personalYieldCost(state: AppState): number {
  return roundMoney(personalYieldExact(state))
}

/**
 * Sold COGS plus personal stock, rounded once.
 * Per-lot COGS and the P&L total are rounded separately, so they can differ by a cent.
 */
export function greenCostConsumed(state: AppState): number {
  return roundMoney(soldCogsExact(state) + personalStockExact(state))
}

function splitMoney(total: number, weights: WeightShare[]): Map<number, number> {
  const cents = Math.round(total * 100)
  const out = new Map<number, number>()
  if (weights.length === 0 || cents === 0) {
    for (const weight of weights) out.set(weight.key, 0)
    return out
  }
  const weightSum = weights.reduce((sum, weight) => sum + weight.weight, 0)
  if (weightSum <= 0) {
    for (const weight of weights) out.set(weight.key, 0)
    return out
  }
  const rows = weights.map((weight) => {
    const exact = (cents * weight.weight) / weightSum
    const floor = Math.floor(exact)
    return { key: weight.key, cents: floor, frac: exact - floor }
  })
  let left = cents - rows.reduce((sum, row) => sum + row.cents, 0)
  const ranked = [...rows].sort((a, b) => b.frac - a.frac || a.key - b.key)
  for (const row of ranked) {
    if (left <= 0) break
    row.cents += 1
    left -= 1
  }
  for (const row of rows) out.set(row.key, row.cents / 100)
  return out
}

interface SaleSlice {
  lotId: number
  bags: number
  standardRevenue: number
  overpay: number
  shortfall: number
  actualRevenue: number
}

function saleSlices(state: AppState, sale: Sale): SaleSlice[] {
  const price = saleStandardPrice(sale)
  const bagsByLot = new Map<number, number>()
  let counted = 0
  for (const id of sale.baggedUnitIds) {
    const bag = state.bags.find((item) => item.id === id)
    if (!bag || isVoided(bag)) continue
    counted += 1
    const sources = bagSources(bag)
    const denom = bag.weight > 0 ? bag.weight : sources.reduce((sum, source) => sum + source.weight, 0)
    if (denom <= 0) continue
    for (const source of sources) {
      const batch = state.batches.find((item) => item.id === source.batchId)
      if (!batch) continue
      const share = source.weight / denom
      bagsByLot.set(batch.greenLotId, (bagsByLot.get(batch.greenLotId) ?? 0) + share)
    }
  }
  const weights = [...bagsByLot.entries()].map(([key, weight]) => ({ key, weight }))
  const standardTotal = roundMoney(counted * price)
  const actual = roundMoney(sale.saleAmount)
  const overpayTotal = roundMoney(Math.max(0, actual - standardTotal))
  const shortfallTotal = roundMoney(Math.max(0, standardTotal - actual))
  const standard = splitMoney(standardTotal, weights)
  const overpay = splitMoney(overpayTotal, weights)
  const shortfall = splitMoney(shortfallTotal, weights)
  return weights.map(({ key }) => {
    const standardRevenue = standard.get(key) ?? 0
    const lotOverpay = overpay.get(key) ?? 0
    const lotShortfall = shortfall.get(key) ?? 0
    return {
      lotId: key,
      bags: bagsByLot.get(key) ?? 0,
      standardRevenue,
      overpay: lotOverpay,
      shortfall: lotShortfall,
      actualRevenue: roundMoney(standardRevenue + lotOverpay - lotShortfall),
    }
  })
}

export function lotMoney(state: AppState): LotMoney[] {
  const byLot = new Map<number, LotMoney>()
  for (const lot of state.lots) {
    byLot.set(lot.id, {
      lotId: lot.id,
      bags: 0,
      standardRevenue: 0,
      overpay: 0,
      shortfall: 0,
      actualRevenue: 0,
      cogs: 0,
    })
  }
  for (const sale of liveSales(state)) {
    for (const slice of saleSlices(state, sale)) {
      const row = byLot.get(slice.lotId)
      if (!row) continue
      row.bags += slice.bags
      row.standardRevenue = roundMoney(row.standardRevenue + slice.standardRevenue)
      row.overpay = roundMoney(row.overpay + slice.overpay)
      row.shortfall = roundMoney(row.shortfall + slice.shortfall)
      row.actualRevenue = roundMoney(row.actualRevenue + slice.actualRevenue)
    }
  }
  const cogsExact = new Map<number, number>()
  for (const bag of soldBags(state)) {
    for (const source of bagSources(bag)) {
      const batch = state.batches.find((item) => item.id === source.batchId)
      if (!batch) continue
      cogsExact.set(batch.greenLotId, (cogsExact.get(batch.greenLotId) ?? 0) + roastedCost(state, batch, source.weight))
    }
  }
  for (const [lotId, exact] of cogsExact) {
    const row = byLot.get(lotId)
    if (row) row.cogs = roundMoney(exact)
  }
  return [...byLot.values()]
}

function coverage(totalCost: number, standardRevenue: number): LotCoverage {
  const costCents = Math.round(totalCost * 100)
  if (costCents === 0) return 'no cost'
  return Math.round(standardRevenue * 100) >= costCents ? 'covered' : 'not covered'
}

export function lotBreakEvens(state: AppState, price = currentStandardPrice(state.settings)): LotBreakEven[] {
  const money = new Map(lotMoney(state).map((row) => [row.lotId, row]))
  return receiptOrder(state.lots).map((lot) => {
    const row = money.get(lot.id) ?? {
      lotId: lot.id,
      bags: 0,
      standardRevenue: 0,
      overpay: 0,
      shortfall: 0,
      actualRevenue: 0,
      cogs: 0,
    }
    const standardMargin = row.standardRevenue > 0 ? (row.standardRevenue - row.cogs) / row.standardRevenue : null
    const actualMargin = row.actualRevenue > 0 ? (row.actualRevenue - row.cogs) / row.actualRevenue : null
    return {
      ...row,
      totalCost: lot.totalCost,
      profitLeft: roundMoney(row.actualRevenue - lot.totalCost),
      breakEvenBags: ceilBags(lot.totalCost, price),
      bagsToBreakEven: ceilBags(lot.totalCost - row.standardRevenue, price),
      status: coverage(lot.totalCost, row.standardRevenue),
      standardMargin,
      actualMargin,
    }
  })
}

export function monthlySales(state: AppState): MonthHistory[] {
  const byMonth = new Map<string, MonthHistory>()
  for (const sale of liveSales(state)) {
    const month = utcMonth(sale.date)
    const row = byMonth.get(month) ?? {
      month,
      bags: 0,
      actualRevenue: 0,
      standardRevenue: 0,
      overpay: 0,
      shortfall: 0,
    }
    const slices = saleSlices(state, sale)
    const counted = sale.baggedUnitIds.filter((id) => {
      const bag = state.bags.find((item) => item.id === id)
      return bag != null && !isVoided(bag)
    }).length
    row.bags += counted
    if (slices.length === 0) {
      const price = saleStandardPrice(sale)
      const standard = roundMoney(counted * price)
      const actual = roundMoney(sale.saleAmount)
      row.actualRevenue = roundMoney(row.actualRevenue + actual)
      row.standardRevenue = roundMoney(row.standardRevenue + standard)
      row.overpay = roundMoney(row.overpay + Math.max(0, actual - standard))
      row.shortfall = roundMoney(row.shortfall + Math.max(0, standard - actual))
    } else {
      for (const slice of slices) {
        row.actualRevenue = roundMoney(row.actualRevenue + slice.actualRevenue)
        row.standardRevenue = roundMoney(row.standardRevenue + slice.standardRevenue)
        row.overpay = roundMoney(row.overpay + slice.overpay)
        row.shortfall = roundMoney(row.shortfall + slice.shortfall)
      }
    }
    byMonth.set(month, row)
  }
  return [...byMonth.values()].sort((a, b) => a.month.localeCompare(b.month))
}

function receiptOrder(lots: GreenLot[]): GreenLot[] {
  return [...lots].sort((a, b) => a.dateReceived.localeCompare(b.dateReceived) || a.id - b.id)
}

export function overallLoss(state: AppState): number {
  let green = 0
  let yielded = 0
  for (const batch of state.batches) {
    if (isVoided(batch) || batch.greenWeightCharged <= 0) continue
    green += batch.greenWeightCharged
    yielded += batch.roastedYield
  }
  if (green <= 0) return 0
  return 1 - yielded / green
}

export function lotLoss(state: AppState, lotId: number): { loss: number; usesOverallLoss: boolean } {
  let green = 0
  let yielded = 0
  for (const batch of state.batches) {
    if (batch.greenLotId !== lotId || isVoided(batch) || batch.greenWeightCharged <= 0) continue
    green += batch.greenWeightCharged
    yielded += batch.roastedYield
  }
  if (green <= 0) return { loss: overallLoss(state), usesOverallLoss: true }
  return { loss: 1 - yielded / green, usesOverallLoss: false }
}

function unmetAt(state: AppState, lot: GreenLot, reserveGrams?: number): number {
  if (reserveGrams == null) return lotAllotment(state, lot).unmet
  return roundGrams(Math.max(0, reserveGrams - personalCharged(state, lot.id)))
}

function forwardRoastedGrams(state: AppState, lot: GreenLot, loss: number, reserveGrams?: number): number {
  const unmet = unmetAt(state, lot, reserveGrams)
  const fromGreen = Math.max(0, lot.weightRemaining - unmet) * (1 - loss)
  let forSaleRoasted = 0
  for (const batch of state.batches) {
    if (batch.greenLotId !== lot.id || isVoided(batch)) continue
    forSaleRoasted += batchPools(batch).forSaleRemaining
  }
  let bagWeight = 0
  for (const bag of state.bags) {
    if (isVoided(bag) || bag.status !== 'available' || bagClassification(state, bag) !== 'for-sale') continue
    for (const source of bagSources(bag)) {
      const batch = state.batches.find((item) => item.id === source.batchId)
      if (batch && batch.greenLotId === lot.id) bagWeight += source.weight
    }
  }
  return fromGreen + forSaleRoasted + bagWeight
}

export function lotForward(state: AppState, lot: GreenLot, reserveGrams?: number, price = currentStandardPrice(state.settings)): ForwardMargin {
  const { loss, usesOverallLoss } = lotLoss(state, lot.id)
  const money = lotMoney(state).find((row) => row.lotId === lot.id)
  const actualRevenue = money?.actualRevenue ?? 0
  const bagGrams = standardBagWeightGrams(state.settings.defaultBagSizeOz)
  const forwardRoasted = forwardRoastedGrams(state, lot, loss, reserveGrams)
  const forwardBags = bagGrams > 0 ? forwardRoasted / bagGrams : 0
  const forwardProduct = forwardBags * price
  const zeroRoasted = forwardRoastedGrams(state, lot, loss, 0)
  const extraBags = bagGrams > 0 ? Math.max(0, zeroRoasted - forwardRoasted) / bagGrams : 0
  const retention = 1 - loss
  const perKg = lot.costPerKg > 0 ? lot.costPerKg : lot.weightReceived > 0 ? (lot.totalCost / lot.weightReceived) * 1000 : 0
  const costPerBag = retention > 0 && bagGrams > 0 ? (bagGrams / retention / 1000) * perKg : null
  return {
    loss,
    usesOverallLoss,
    forwardRoasted,
    forwardBags,
    forwardRevenue: roundMoney(forwardProduct),
    forwardProfit: roundMoney(forwardProduct + actualRevenue - lot.totalCost),
    costPerBag,
    reserveSoldExtraBags: extraBags,
    reserveSoldExtraRevenue: roundMoney(extraBags * price),
  }
}

export function whatIfProfit(forward: ForwardMargin, price: number, actualRevenue: number, totalCost: number): WhatIfProfit | null {
  if (!(price > 0)) return null
  return {
    perBag: forward.costPerBag == null ? null : roundMoney(price - forward.costPerBag),
    perLot: roundMoney(forward.forwardBags * price + actualRevenue - totalCost),
  }
}

export function costTrend(state: AppState): CostTrend[] {
  const ordered = receiptOrder(state.lots)
  return ordered.map((lot) => {
    const day = utcDay(lot.dateReceived)
    const earlier = ordered.filter(
      (other) => other.totalCost > 0 && utcDay(other.dateReceived) < day,
    )
    const comparator = earlier.length
      ? earlier.reduce((best, other) => {
          if (other.dateReceived > best.dateReceived) return other
          if (other.dateReceived === best.dateReceived && other.id > best.id) return other
          return best
        })
      : null
    if (!comparator || lot.totalCost <= 0 || comparator.costPerKg <= 0) {
      return { lotId: lot.id, costPerKg: lot.costPerKg, comparatorLotId: comparator?.id ?? null, jumpFraction: null, flagged: false }
    }
    const jumpFraction = (lot.costPerKg - comparator.costPerKg) / comparator.costPerKg
    const flagged = jumpFraction + 1e-9 >= COST_JUMP_FRACTION
    return {
      lotId: lot.id,
      costPerKg: lot.costPerKg,
      comparatorLotId: comparator.id,
      jumpFraction,
      flagged,
    }
  })
}
