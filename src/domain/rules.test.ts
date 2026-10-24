import { describe, expect, it } from 'vitest'
import { APP_ROUTES } from '../routes.ts'
import { GRAMS_PER_LB, GRAMS_PER_OZ, formatGrams, formatPounds, roundGrams } from '../units.ts'
import {
  addProfile,
  applyEntityUpdate,
  batchTrail,
  batchClassificationLabel,
  lotTrail,
  dashboardSummary,
  editRecord,
  emptyState,
  greenRemaining,
  isReserveLow,
  lotAllotment,
  personalCharged,
  pnl,
  roastedUse,
  missingProfileFields,
  packBags,
  receiveLot,
  recordRoast,
  recordSale,
  removeProfile,
  roastedRemaining,
  saleSources,
  resolvedTheme,
  unpaidBalance,
  updateSettings,
  voidRecord,
  type ProfileInput,
  type RecordRoastInput,
} from './rules.ts'
import type { AppState } from '../types.ts'

const profile: ProfileInput = {
  beansName: 'Ethiopia',
  chargeTemp: 390,
  batchSize: 1500,
  dtr: 20,
  weightLossPercent: 15,
}

function lotState(grams: number, reserve = GRAMS_PER_LB): AppState {
  const state = emptyState()
  state.settings.personalUseReserveTargetGrams = reserve
  state.lots.push({
    id: 1,
    name: 'Test',
    origin: 'Ethiopia',
    weightReceived: grams,
    weightRemaining: grams,
    costPerKg: 12,
    totalCost: roundGrams((grams / 1000) * 12),
    dateReceived: '2026-01-01T00:00:00.000Z',
  })
  return state
}

function roastInput(overrides: Partial<RecordRoastInput> = {}): RecordRoastInput {
  return {
    greenLotId: 1,
    greenWeightCharged: 1000,
    roastedYield: 850,
    classification: 'for-sale',
    roastDate: '2026-03-01T12:00:00.000Z',
    profile,
    ...overrides,
  }
}

function forSaleRoast(roasted = 1200): AppState {
  const received = recordRoast(lotState(5500), roastInput({ greenWeightCharged: 1500, roastedYield: roasted, roastDate: '2026-03-01T00:00:00.000Z' }))
  if (!received.ok) throw new Error('setup roast failed')
  return received.state
}

describe('inventory', () => {
  it('records a new green lot and increases stock', () => {
    const start = lotState(5000)
    const result = receiveLot(start, {
      origin: 'Kenya',
      weightReceived: 2000,
      dateReceived: '2026-02-01T00:00:00.000Z',
      totalCost: 24,
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(greenRemaining(result.state)).toBe(7000)
    const lot = result.state.lots[1]
    expect(lot.origin).toBe('Kenya')
    expect(lot.weightReceived).toBe(2000)
    expect(lot.dateReceived).toBe('2026-02-01T00:00:00.000Z')
    expect(lot.totalCost).toBe(24)
  })

  it('allows an internal roast that drops stock below the reserve and warns', () => {
    const start = lotState(600, 450)
    const result = recordRoast(start, roastInput({ greenWeightCharged: 200, roastedYield: 170, classification: 'internal' }))
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(greenRemaining(result.state)).toBe(400)
    expect(isReserveLow(result.state)).toBe(true)
    expect(dashboardSummary(result.state).reserveLow).toBe(true)
  })

  it('rejects a roast larger than green stock and leaves inventory unchanged', () => {
    const start = lotState(800)
    const result = recordRoast(start, roastInput({ greenWeightCharged: 1000, roastedYield: 800 }))
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.type).toBe('shortfall')
    if (result.error.type === 'shortfall') expect(result.error.shortfall).toBe(200)
    expect(result.state).toBe(start)
    expect(greenRemaining(result.state)).toBe(800)
    expect(result.state.batches).toHaveLength(0)
  })

  it('rejects a write that would make roasted stock negative', () => {
    const start = forSaleRoast()
    const before = start.batches[0].roastedWeightRemaining
    const result = applyEntityUpdate(start, { entity: 'batch', id: start.batches[0].id, patch: { roastedWeightRemaining: -5 } })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.type).toBe('shortfall')
    expect(result.state.batches[0].roastedWeightRemaining).toBe(before)
  })

  it('stores a receipt calendar date without a time of day', () => {
    const result = receiveLot(emptyState(), {
      origin: 'Ethiopia',
      weightReceived: 1000,
      dateReceived: '2026-06-01',
      totalCost: 10,
      personalReserveGrams: 0,
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const stored = new Date(result.state.lots[0].dateReceived)
    expect(stored.getFullYear()).toBe(2026)
    expect(stored.getMonth()).toBe(5)
    expect(stored.getDate()).toBe(1)
    expect(stored.getHours()).toBe(0)
    expect(stored.getMinutes()).toBe(0)
  })

  it('formats received pounds and other weights in grams', () => {
    expect(formatGrams(300)).toMatch(/^300 g$/)
    expect(formatPounds(5 * GRAMS_PER_LB)).toMatch(/^5 lb$/)
  })

  it('leaves about 154 g reserved after roasting 300 g of a 1 lb reserve', () => {
    const reserved = applyEntityUpdate(lotState(5 * GRAMS_PER_LB), { entity: 'lot', id: 1, patch: { personalReserveGrams: GRAMS_PER_LB } })
    expect(reserved.ok).toBe(true)
    if (!reserved.ok) return
    const roasted = recordRoast(reserved.state, roastInput({ classification: 'internal', greenWeightCharged: 300, roastedYield: 250 }))
    expect(roasted.ok).toBe(true)
    if (!roasted.ok) return
    const unmet = lotAllotment(roasted.state, roasted.state.lots[0]).unmet
    expect(unmet).toBeGreaterThan(153)
    expect(unmet).toBeLessThan(155)
    expect(formatGrams(unmet)).toMatch(/g$/)
  })

  it('defaults a new lot reserve to 1 lb and stores an 8 oz override', () => {
    const start = emptyState()
    const received = receiveLot(start, {
      origin: 'Ethiopia',
      weightReceived: 5 * GRAMS_PER_LB,
      dateReceived: '2026-06-01T00:00:00.000Z',
      totalCost: 50,
    })
    expect(received.ok).toBe(true)
    if (!received.ok) return
    expect(received.state.lots[0].personalReserveGrams).toBe(roundGrams(GRAMS_PER_LB))
    const override = receiveLot(emptyState(), {
      origin: 'Kenya',
      weightReceived: 5 * GRAMS_PER_LB,
      dateReceived: '2026-06-01T00:00:00.000Z',
      totalCost: 50,
      personalReserveGrams: 8 * GRAMS_PER_OZ,
    })
    expect(override.ok).toBe(true)
    if (!override.ok) return
    expect(override.state.lots[0].personalReserveGrams).toBe(roundGrams(8 * GRAMS_PER_OZ))
  })

  it('rejects a reserve outside the lot and keeps roast classification when the reserve changes', () => {
    const start = lotState(2 * GRAMS_PER_LB)
    const tooHigh = applyEntityUpdate(start, { entity: 'lot', id: 1, patch: { personalReserveGrams: 3 * GRAMS_PER_LB } })
    expect(tooHigh.ok).toBe(false)
    expect(tooHigh.state.lots[0].personalReserveGrams).toBeUndefined()
    const negative = applyEntityUpdate(start, { entity: 'lot', id: 1, patch: { personalReserveGrams: -1 } })
    expect(negative.ok).toBe(false)
    const roasted = recordRoast(start, roastInput({ classification: 'internal', greenWeightCharged: 100, roastedYield: 80 }))
    expect(roasted.ok).toBe(true)
    if (!roasted.ok) return
    const lowered = applyEntityUpdate(roasted.state, { entity: 'lot', id: 1, patch: { personalReserveGrams: 12 * GRAMS_PER_OZ } })
    expect(lowered.ok).toBe(true)
    if (!lowered.ok) return
    expect(lowered.state.lots[0].personalReserveGrams).toBe(roundGrams(12 * GRAMS_PER_OZ))
    expect(lowered.state.batches[0].classification).toBe('internal')
  })

  it('covers a 1 lb reserve with an internal roast and keeps unmet green off the fair amount', () => {
    const bare = lotState(5 * GRAMS_PER_LB)
    expect(lotAllotment(bare, bare.lots[0]).reserve).toBe(0)
    expect(lotAllotment(bare, bare.lots[0]).fairGreen).toBe(roundGrams(5 * GRAMS_PER_LB))
    const reserved = applyEntityUpdate(bare, { entity: 'lot', id: 1, patch: { personalReserveGrams: GRAMS_PER_LB } })
    expect(reserved.ok).toBe(true)
    if (!reserved.ok) return
    const open = lotAllotment(reserved.state, reserved.state.lots[0])
    expect(open.unmet).toBe(roundGrams(GRAMS_PER_LB))
    expect(open.fairGreen).toBe(roundGrams(reserved.state.lots[0].weightRemaining - open.unmet))
    expect(Math.abs(open.fairGreen - 4 * GRAMS_PER_LB)).toBeLessThan(0.01)
    expect(open.covered).toBe(false)
    const roasted = recordRoast(reserved.state, roastInput({
      classification: 'internal',
      greenWeightCharged: GRAMS_PER_LB,
      roastedYield: 400,
    }))
    expect(roasted.ok).toBe(true)
    if (!roasted.ok) return
    expect(lotAllotment(roasted.state, roasted.state.lots[0]).covered).toBe(true)
  })

  it('splits roasted weight and marks for-sale fair only when the lot allotment is covered', () => {
    const reserved = applyEntityUpdate(lotState(5 * GRAMS_PER_LB), { entity: 'lot', id: 1, patch: { personalReserveGrams: GRAMS_PER_LB } })
    expect(reserved.ok).toBe(true)
    if (!reserved.ok) return
    const personal = recordRoast(reserved.state, roastInput({
      classification: 'internal',
      greenWeightCharged: 200,
      roastedYield: 160,
    }))
    expect(personal.ok).toBe(true)
    if (!personal.ok) return
    const sale = recordRoast(personal.state, roastInput({
      classification: 'for-sale',
      greenWeightCharged: 300,
      roastedYield: 250,
      roastDate: '2026-03-02T12:00:00.000Z',
    }))
    expect(sale.ok).toBe(true)
    if (!sale.ok) return
    const open = roastedUse(sale.state)
    expect(open.personal).toBe(160)
    expect(open.forSale).toBe(250)
    expect(open.fairToSell).toBe(0)
    const coveredLot = applyEntityUpdate(sale.state, { entity: 'lot', id: 1, patch: { personalReserveGrams: 200 } })
    expect(coveredLot.ok).toBe(true)
    if (!coveredLot.ok) return
    expect(roastedUse(coveredLot.state).fairToSell).toBe(250)
  })

  it('splits a single roast stock total into personal and for-sale pools', () => {
    const start = lotState(1000, 100)
    const split = recordRoast(start, roastInput({ greenWeightCharged: 200, roastedYield: 200, personalYield: 100 }))
    expect(split.ok).toBe(true)
    if (!split.ok) return
    expect(lotAllotment(split.state, split.state.lots[0]).covered).toBe(true)
    expect(roastedUse(split.state)).toEqual({ personal: 100, forSale: 100, fairToSell: 100 })
    expect(batchClassificationLabel(split.state.batches[0])).toBe('Personal 100 g · for sale 100 g')
  })

  it('counts packed personal weight toward a split roast allotment', () => {
    const start = lotState(2000, 600)
    start.lots[0].personalReserveGrams = 600
    const recorded = recordRoast(start, roastInput({ greenWeightCharged: 600, roastedYield: 500, personalYield: 250 }))
    expect(recorded.ok).toBe(true)
    if (!recorded.ok) return
    expect(personalCharged(recorded.state, 1)).toBe(300)
    const packed = packBags(recorded.state, {
      batchId: recorded.state.batches[0].id,
      bagCount: 1,
      weightPerBag: 250,
      classification: 'internal',
      now: new Date('2026-03-03T00:00:00.000Z').getTime(),
    })
    expect(packed.ok).toBe(true)
    if (!packed.ok) return
    expect(packed.state.batches[0].personalRemaining).toBe(250)
    expect(packed.state.batches[0].forSaleRemaining).toBe(0)
    expect(personalCharged(packed.state, 1)).toBe(600)
    expect(lotAllotment(packed.state, packed.state.lots[0]).covered).toBe(true)
  })
})

describe('roasting', () => {
  it('records all-sale, all-personal, and split roast pools and rejects invalid personal amounts', () => {
    const allForSale = recordRoast(lotState(5000), roastInput({ roastedYield: 500 }))
    expect(allForSale.ok).toBe(true)
    if (!allForSale.ok) return
    expect(allForSale.state.batches[0]).toMatchObject({
      personalYield: 0,
      forSaleYield: 500,
      personalRemaining: 0,
      forSaleRemaining: 500,
    })

    const allPersonal = recordRoast(lotState(5000), roastInput({ roastedYield: 500, personalYield: 500 }))
    expect(allPersonal.ok).toBe(true)
    if (!allPersonal.ok) return
    expect(allPersonal.state.batches[0]).toMatchObject({
      classification: 'internal',
      personalYield: 500,
      forSaleYield: 0,
      personalRemaining: 500,
      forSaleRemaining: 0,
    })

    const split = recordRoast(lotState(5000), roastInput({ roastedYield: 500, personalYield: 250 }))
    expect(split.ok).toBe(true)
    if (!split.ok) return
    expect(split.state.batches[0]).toMatchObject({
      personalYield: 250,
      forSaleYield: 250,
      personalRemaining: 250,
      forSaleRemaining: 250,
      roastedYield: 500,
      roastedWeightRemaining: 500,
    })

    const invalid = recordRoast(lotState(5000), roastInput({ roastedYield: 500, personalYield: 501 }))
    expect(invalid.ok).toBe(false)
    expect(invalid.state.batches).toHaveLength(0)
    expect(greenRemaining(invalid.state)).toBe(5000)
  })

  it('records a for-sale roast and moves weight from green to roasted', () => {
    const result = recordRoast(lotState(5500), roastInput({ greenWeightCharged: 1500, roastedYield: 1200, classification: 'for-sale' }))
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(greenRemaining(result.state)).toBe(4000)
    expect(roastedRemaining(result.state)).toBe(1200)
    expect(result.state.batches[0].classification).toBe('for-sale')
    expect(result.state.batches[0].status).toBe('ready-to-bag')
    expect(result.state.profiles[0].beansName).toBe('Ethiopia')
    expect(result.state.batches[0].weightLossPercent).toBe(15)
  })

  it('accepts an internal roast recorded earlier than an existing batch', () => {
    const first = recordRoast(lotState(5000), roastInput({ roastDate: '2026-04-02T12:00:00.000Z', greenWeightCharged: 100, roastedYield: 80 }))
    expect(first.ok).toBe(true)
    if (!first.ok) return
    const second = recordRoast(first.state, roastInput({
      roastDate: '2026-04-01T12:00:00.000Z',
      classification: 'internal',
      greenWeightCharged: 100,
      roastedYield: 85,
      profile: { ...profile, beansName: 'House' },
    }))
    expect(second.ok).toBe(true)
    if (!second.ok) return
    const recorded = second.state.batches.find((batch) => batch.roastDate === '2026-04-01T12:00:00.000Z')
    expect(recorded?.classification).toBe('internal')
    expect(recorded?.profileId).toBeTruthy()
  })

  it('marks a new roast ready for bagging immediately', () => {
    const roasted = recordRoast(lotState(2000), roastInput())
    expect(roasted.ok).toBe(true)
    if (!roasted.ok) return
    expect(roasted.state.batches[0].status).toBe('ready-to-bag')
    expect(roasted.state.batches[0]).not.toHaveProperty('restStartTime')
  })

  it('stores a profile independently of a batch', () => {
    const saved = addProfile(emptyState(), { ...profile, name: 'Washed Ethiopia', notes: 'first crack late' })
    expect(saved.ok).toBe(true)
    if (!saved.ok) return
    const stored = saved.state.profiles[0]
    expect(stored.id).toBeGreaterThan(0)
    expect(stored.beansName).toBe('Ethiopia')
    expect(stored.chargeTemp).toBe(390)
    expect(stored.batchSize).toBe(1500)
    expect(stored.dtr).toBe(20)
    expect(stored.weightLossPercent).toBe(15)
    expect(stored.name).toBe('Washed Ethiopia')
    expect(stored.notes).toBe('first crack late')
    expect(stored.createdAt).toBeTruthy()
    expect(stored.updatedAt).toBeTruthy()
    expect(saved.state.batches).toHaveLength(0)
  })

  it('snapshots the values used so a later library edit does not change history', () => {
    const saved = addProfile(lotState(2000), { ...profile, name: 'House' })
    expect(saved.ok).toBe(true)
    if (!saved.ok) return
    const roasted = recordRoast(saved.state, roastInput({
      profileId: saved.state.profiles[0].id,
      profile: { ...profile, chargeTemp: 410, beansName: 'House beans' },
      saveAsNew: false,
    }))
    expect(roasted.ok).toBe(true)
    if (!roasted.ok) return
    expect(roasted.state.profiles[0].chargeTemp).toBe(390)
    expect(roasted.state.batches[0].profileSnapshot?.chargeTemp).toBe(410)
    expect(roasted.state.batches[0].profileSnapshot?.beansName).toBe('House beans')
    const edited = applyEntityUpdate(roasted.state, {
      entity: 'profile',
      id: saved.state.profiles[0].id,
      patch: { name: 'Renamed', beansName: 'Other', chargeTemp: 300 },
    })
    expect(edited.ok).toBe(true)
    if (!edited.ok) return
    expect(edited.state.batches[0]).toEqual(roasted.state.batches[0])
    expect(batchTrail(edited.state, edited.state.batches[0].id).some((event) => event.detail.includes('Profile: House'))).toBe(true)
    expect(batchTrail(edited.state, edited.state.batches[0].id).some((event) => event.detail.includes('charge 410'))).toBe(true)
    const removed = removeProfile(edited.state, saved.state.profiles[0].id)
    expect(removed.ok).toBe(true)
    if (!removed.ok) return
    expect(removed.state.profiles).toHaveLength(0)
    expect(removed.state.batches[0]).toEqual(roasted.state.batches[0])
    expect(greenRemaining(removed.state)).toBe(greenRemaining(roasted.state))
    expect(batchTrail(removed.state, removed.state.batches[0].id).some((event) => event.detail.includes('charge 410'))).toBe(true)
  })

  it('saves a new library profile or updates the selected one without rewriting an older batch', () => {
    const first = recordRoast(lotState(4000), roastInput({ profile: { ...profile, name: 'Original' } }))
    expect(first.ok).toBe(true)
    if (!first.ok) return
    const sourceId = first.state.profiles[0].id
    const savedNew = recordRoast(first.state, roastInput({
      profileId: sourceId,
      profile: { ...profile, name: 'Copy', chargeTemp: 400 },
      saveAsNew: true,
      greenWeightCharged: 500,
      roastedYield: 420,
    }))
    expect(savedNew.ok).toBe(true)
    if (!savedNew.ok) return
    expect(savedNew.state.profiles).toHaveLength(2)
    expect(savedNew.state.profiles[0].chargeTemp).toBe(390)
    expect(savedNew.state.batches[1].profileSnapshot?.name).toBe('Copy')
    expect(batchTrail(savedNew.state, savedNew.state.batches[1].id).some((event) => event.detail.includes('Profile: Copy'))).toBe(true)
    expect(dashboardSummary(savedNew.state).activity.some((event) => event.text.includes('Copy'))).toBe(true)
    const updated = recordRoast(savedNew.state, roastInput({
      profileId: sourceId,
      profile: { ...profile, name: 'Updated', chargeTemp: 370 },
      updateExisting: true,
      saveAsNew: false,
      greenWeightCharged: 400,
      roastedYield: 340,
    }))
    expect(updated.ok).toBe(true)
    if (!updated.ok) return
    expect(updated.state.profiles.find((item) => item.id === sourceId)?.chargeTemp).toBe(370)
    expect(updated.state.batches[0].profileSnapshot?.chargeTemp).toBe(390)
    expect(updated.state.batches[2].profileSnapshot?.chargeTemp).toBe(370)
  })

  it('does not create a batch when the profile is incomplete', () => {
    const start = lotState(2000)
    const result = recordRoast(start, roastInput({ profile: undefined, profileId: undefined }))
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.type).toBe('incomplete-profile')
    expect(result.error.message).toMatch(/profile is required/i)
    expect(result.state.batches).toHaveLength(0)
    expect(greenRemaining(result.state)).toBe(2000)
    expect(missingProfileFields(undefined).length).toBeGreaterThan(0)
  })

  it('stores weight loss on the batch for history', () => {
    const result = recordRoast(lotState(2000), roastInput())
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const trail = batchTrail(result.state, result.state.batches[0].id)
    expect(trail.some((event) => event.detail.includes('weight loss 15%'))).toBe(true)
  })

  it('omits bagging and sale from a roasted-only batch trail', () => {
    const result = recordRoast(lotState(2000), roastInput())
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const trail = batchTrail(result.state, result.state.batches[0].id)
    expect(trail.map((event) => event.kind)).toEqual(['received', 'roasted'])
    expect(trail[1].detail).toMatch(/Profile: Ethiopia/)
    expect(trail.some((event) => event.kind === 'bagged' || event.kind === 'sold')).toBe(false)
  })
})

describe('packaging', () => {
  it('packs personal bags from the for-sale pool while leaving existing personal weight allocated', () => {
    const start = forSaleRoast(500)
    const result = packBags(start, {
      batchId: start.batches[0].id,
      bagCount: 1,
      weightPerBag: 250,
      classification: 'internal',
      now: new Date('2026-03-03T00:00:00.000Z').getTime(),
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.state.bags[0].classification).toBe('internal')
    expect(result.state.batches[0].personalRemaining).toBe(0)
    expect(result.state.batches[0].forSaleRemaining).toBe(250)
  })

  it('rejects packing more than total remaining roasted weight', () => {
    const start = forSaleRoast(200)
    const result = packBags(start, {
      batchId: start.batches[0].id,
      bagCount: 1,
      weightPerBag: 201,
      classification: 'internal',
      now: new Date('2026-03-03T00:00:00.000Z').getTime(),
    })
    expect(result.ok).toBe(false)
    expect(result.state.bags).toHaveLength(0)
    expect(result.state.batches[0].roastedWeightRemaining).toBe(200)
  })

  it('allows bagging immediately after logging a roast', () => {
    const start = forSaleRoast(1200)
    const now = new Date('2026-03-01T00:00:00.000Z').getTime()
    const result = packBags(start, { batchId: start.batches[0].id, bagCount: 2, weightPerBag: 200, now })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.state.bags).toHaveLength(2)
    expect(result.state.batches[0].roastedWeightRemaining).toBe(800)
  })

  it('bags 400 g into two bags and reduces roasted weight', () => {
    const start = forSaleRoast(1200)
    const result = packBags(start, {
      batchId: start.batches[0].id,
      bagCount: 2,
      weightPerBag: 200,
      now: new Date('2026-03-03T00:00:00.000Z').getTime(),
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.state.batches[0].roastedWeightRemaining).toBe(800)
    expect(result.state.bags).toHaveLength(2)
    expect(result.state.bags.every((bag) => bag.status === 'available')).toBe(true)
  })

  it('stops offering a batch after its roasted weight is fully bagged', () => {
    const start = forSaleRoast(450)
    const packed = packBags(start, {
      batchId: start.batches[0].id,
      bagCount: 1,
      weightPerBag: 450,
      now: new Date('2026-03-03T00:00:00.000Z').getTime(),
    })
    expect(packed.ok).toBe(true)
    if (!packed.ok) return
    expect(packed.state.batches[0].roastedWeightRemaining).toBe(0)
    expect(packed.state.batches[0].status).toBe('bagged')
    const again = packBags(packed.state, {
      batchId: start.batches[0].id,
      bagCount: 1,
      weightPerBag: 10,
      now: new Date('2026-03-04T00:00:00.000Z').getTime(),
    })
    expect(again.ok).toBe(false)
    expect(again.state.bags).toHaveLength(1)
  })

  it('uses the updated default bag size on the next pack', () => {
    const start = forSaleRoast()
    const updated = updateSettings(start, { defaultBagSizeOz: 12 })
    expect(updated.ok).toBe(true)
    if (!updated.ok) return
    const packed = packBags(updated.state, {
      batchId: start.batches[0].id,
      bagCount: 1,
      weightPerBag: 200,
      now: new Date('2026-03-03T00:00:00.000Z').getTime(),
    })
    expect(packed.ok).toBe(true)
    if (!packed.ok) return
    expect(packed.state.bags[0].bagSizeOz).toBe(12)
    expect(packed.state.settings.defaultBagSizeOz).toBe(12)
  })
})

describe('sales', () => {
  it('sells one bag, records the amount and optional tax, and keeps the trail', () => {
    const start = forSaleRoast(400)
    const packed = packBags(start, {
      batchId: start.batches[0].id,
      bagCount: 1,
      weightPerBag: 200,
      now: new Date('2026-03-03T00:00:00.000Z').getTime(),
    })
    expect(packed.ok).toBe(true)
    if (!packed.ok) return
    const sold = recordSale(packed.state, {
      baggedUnitIds: [packed.state.bags[0].id],
      saleAmount: 18,
      taxAmount: 1.25,
      date: '2026-03-04T00:00:00.000Z',
    })
    expect(sold.ok).toBe(true)
    if (!sold.ok) return
    expect(sold.state.bags[0].status).toBe('sold')
    expect(sold.state.sales[0].saleAmount).toBe(18)
    expect(sold.state.sales[0].taxAmount).toBe(1.25)
    expect(sold.state.sales[0].paid).toBe(true)
    expect(unpaidBalance(sold.state).count).toBe(0)
    const sources = saleSources(sold.state, sold.state.sales[0])
    expect(sources[0].batch?.id).toBe(start.batches[0].id)
    expect(sources[0].lot?.id).toBe(1)
    const kinds = batchTrail(sold.state, start.batches[0].id).map((event) => event.kind)
    expect(kinds).toEqual(['received', 'roasted', 'bagged', 'sold'])
  })

  it('refuses a personal bag sale and counts only available for-sale bags as ready', () => {
    const start = forSaleRoast(500)
    const personal = packBags(start, {
      batchId: start.batches[0].id,
      bagCount: 1,
      weightPerBag: 100,
      classification: 'internal',
      now: new Date('2026-03-03T00:00:00.000Z').getTime(),
    })
    expect(personal.ok).toBe(true)
    if (!personal.ok) return
    const saleBag = packBags(personal.state, {
      batchId: start.batches[0].id,
      bagCount: 1,
      weightPerBag: 100,
      classification: 'for-sale',
      now: new Date('2026-03-03T01:00:00.000Z').getTime(),
    })
    expect(saleBag.ok).toBe(true)
    if (!saleBag.ok) return
    expect(dashboardSummary(saleBag.state).bagsReady).toBe(1)
    const refused = recordSale(saleBag.state, {
      baggedUnitIds: [personal.state.bags[0].id],
      saleAmount: 10,
      date: '2026-03-04T00:00:00.000Z',
    })
    expect(refused.ok).toBe(false)
    expect(refused.state.sales).toHaveLength(0)
    expect(refused.state.bags.map((bag) => bag.status)).toEqual(['available', 'available'])
  })

  it('shows one receipt, then each batch in roast order with its own stage order', () => {
    const later = recordRoast(lotState(4000), roastInput({ roastDate: '2026-03-10T00:00:00.000Z', greenWeightCharged: 500, roastedYield: 400 }))
    expect(later.ok).toBe(true)
    if (!later.ok) return
    const earlier = recordRoast(
      later.state,
      roastInput({ roastDate: '2026-03-01T00:00:00.000Z', greenWeightCharged: 800, roastedYield: 680 }),
    )
    expect(earlier.ok).toBe(true)
    if (!earlier.ok) return
    const packed = packBags(earlier.state, {
      batchId: earlier.state.batches.find((batch) => batch.roastDate.startsWith('2026-03-01'))?.id ?? 0,
      bagCount: 1,
      weightPerBag: 200,
      now: new Date('2026-03-03T00:00:00.000Z').getTime(),
    })
    expect(packed.ok).toBe(true)
    if (!packed.ok) return
    const sold = recordSale(packed.state, {
      baggedUnitIds: [packed.state.bags[0].id],
      saleAmount: 12,
      date: '2026-03-04T00:00:00.000Z',
    })
    expect(sold.ok).toBe(true)
    if (!sold.ok) return
    const trail = lotTrail(sold.state, 1)
    expect(trail.filter((event) => event.kind === 'received')).toHaveLength(1)
    expect(trail[0].batchId).toBeUndefined()
    expect(trail[0].batchLabel).toBeUndefined()
    const early = sold.state.batches.find((batch) => batch.roastDate.startsWith('2026-03-01'))
    const late = sold.state.batches.find((batch) => batch.roastDate.startsWith('2026-03-10'))
    expect(early).toBeTruthy()
    expect(late).toBeTruthy()
    if (!early || !late) return
    const labeled = trail.filter((event) => event.kind !== 'received')
    expect(labeled.every((event) => event.batchLabel === `Batch #${event.batchId}`)).toBe(true)
    const earlyEvents = labeled.filter((event) => event.batchId === early.id)
    const lateEvents = labeled.filter((event) => event.batchId === late.id)
    expect(earlyEvents.map((event) => event.kind)).toEqual(['roasted', 'bagged', 'sold'])
    expect(lateEvents.map((event) => event.kind)).toEqual(['roasted'])
    expect(labeled.indexOf(earlyEvents[0])).toBeLessThan(labeled.indexOf(lateEvents[0]))
  })

  it('records an unpaid sale and exposes the outstanding balance', () => {
    const start = forSaleRoast(400)
    const packed = packBags(start, {
      batchId: start.batches[0].id,
      bagCount: 1,
      weightPerBag: 200,
      now: new Date('2026-03-03T00:00:00.000Z').getTime(),
    })
    expect(packed.ok).toBe(true)
    if (!packed.ok) return
    const sold = recordSale(packed.state, {
      baggedUnitIds: [packed.state.bags[0].id],
      saleAmount: 18,
      date: '2026-03-04T00:00:00.000Z',
      notes: 'to collect',
      paid: false,
    })
    expect(sold.ok).toBe(true)
    if (!sold.ok) return
    expect(sold.state.sales[0].paid).toBe(false)
    expect(sold.state.sales[0].notes).toBe('to collect')
    expect(unpaidBalance(sold.state)).toEqual({ count: 1, total: 18 })
    expect(dashboardSummary(sold.state).activity.some((event) => event.kind === 'sold' && event.text.includes('unpaid'))).toBe(true)
  })

  it('exposes only internal routes', () => {
    const paths = APP_ROUTES.map((route) => route.path)
    expect(paths).not.toEqual(expect.arrayContaining(['/shop', '/store', '/checkout', '/catalog']))
  })
})

describe('corrections', () => {
  function correctedState() {
    const start = forSaleRoast(400)
    const packed = packBags(start, {
      batchId: start.batches[0].id,
      bagCount: 1,
      weightPerBag: 200,
      now: new Date('2026-03-03T00:00:00.000Z').getTime(),
    })
    if (!packed.ok) throw new Error('setup pack failed')
    const sold = recordSale(packed.state, {
      baggedUnitIds: [packed.state.bags[0].id],
      saleAmount: 18,
      taxAmount: 1.25,
      date: '2026-03-04T00:00:00.000Z',
    })
    if (!sold.ok) throw new Error('setup sale failed')
    return sold.state
  }

  it('edits a sale amount and refuses an edit with no note', () => {
    const start = correctedState()
    const edited = editRecord(start, { entity: 'sale', id: start.sales[0].id }, { saleAmount: 15 }, 'Wrong amount')
    expect(edited.ok).toBe(true)
    if (!edited.ok) return
    expect(edited.state.sales[0].saleAmount).toBe(15)
    const refused = editRecord(start, { entity: 'sale', id: start.sales[0].id }, { saleAmount: 15 }, '   ')
    expect(refused.ok).toBe(false)
    if (refused.ok) return
    expect(refused.error.message).toMatch(/note is required/i)
    expect(refused.state.sales[0].saleAmount).toBe(18)
  })

  it('keeps an audit entry for every edit and never drops an earlier one', () => {
    const start = correctedState()
    const first = editRecord(start, { entity: 'sale', id: start.sales[0].id }, { saleAmount: 15 }, 'Wrong amount')
    expect(first.ok).toBe(true)
    if (!first.ok) return
    const second = editRecord(first.state, { entity: 'sale', id: start.sales[0].id }, { saleAmount: 12 }, 'Still wrong')
    expect(second.ok).toBe(true)
    if (!second.ok) return
    expect(second.state.audit).toHaveLength(2)
    expect(second.state.audit[0].note).toBe('Wrong amount')
    expect(second.state.audit[0].action).toBe('edit')
    expect(second.state.audit[0].changes[0].field).toBe('Sale amount')
    expect(second.state.audit[0].changes[0].from).toMatch(/18/)
    expect(second.state.audit[0].changes[0].to).toMatch(/15/)
    expect(second.state.audit[1].note).toBe('Still wrong')
    expect(second.state.audit[1].entityKey).toBe(`sale:${start.sales[0].id}`)
  })

  it('moves lot green when a roast edit changes the green charged and refuses a yield below packed', () => {
    const start = correctedState()
    const batchId = start.batches[0].id
    const lot = start.lots[0]
    const before = lot.weightRemaining
    const edited = editRecord(start, { entity: 'batch', id: batchId }, { greenWeightCharged: 1600 }, 'Charged the wrong amount')
    expect(edited.ok).toBe(true)
    if (!edited.ok) return
    expect(edited.state.lots[0].weightRemaining).toBe(roundGrams(before - 100))
    const refused = editRecord(start, { entity: 'batch', id: batchId }, { roastedYield: 100 }, 'Too low')
    expect(refused.ok).toBe(false)
    if (refused.ok) return
    expect(refused.error.message).toMatch(/already packed/i)
  })

  it('edits only the unbagged purpose split and requires an audit note', () => {
    const start = correctedState()
    const batchId = start.batches[0].id
    const bagClassificationBefore = start.bags[0].classification
    const edited = editRecord(start, { entity: 'batch', id: batchId }, { personalRemaining: 100 }, 'Kept some for home')
    expect(edited.ok).toBe(true)
    if (!edited.ok) return
    expect(edited.state.batches[0].personalRemaining).toBe(100)
    expect(edited.state.batches[0].forSaleRemaining).toBe(100)
    expect(edited.state.bags[0].classification).toBe(bagClassificationBefore)
    expect(edited.state.audit[0].note).toBe('Kept some for home')

    const noNote = editRecord(start, { entity: 'batch', id: batchId }, { personalRemaining: 100 }, '')
    expect(noNote.ok).toBe(false)
    expect(noNote.state.batches[0].personalRemaining).toBe(0)
  })

  it('returns voided bagging weight to its bag purpose pool', () => {
    const start = forSaleRoast(500)
    const packed = packBags(start, {
      batchId: start.batches[0].id,
      bagCount: 1,
      weightPerBag: 100,
      classification: 'internal',
      now: new Date('2026-03-03T00:00:00.000Z').getTime(),
    })
    expect(packed.ok).toBe(true)
    if (!packed.ok) return
    const voided = voidRecord(packed.state, {
      entity: 'bagging',
      batchId: start.batches[0].id,
      createdAt: packed.state.bags[0].createdAt,
    }, 'Wrong purpose')
    expect(voided.ok).toBe(true)
    if (!voided.ok) return
    expect(voided.state.batches[0].personalRemaining).toBe(100)
    expect(voided.state.batches[0].forSaleRemaining).toBe(400)
  })

  it('voids a record, keeps it, and refuses a second void', () => {
    const start = correctedState()
    const saleId = start.sales[0].id
    const voided = voidRecord(start, { entity: 'sale', id: saleId }, 'Booked twice')
    expect(voided.ok).toBe(true)
    if (!voided.ok) return
    expect(voided.state.sales).toHaveLength(1)
    expect(voided.state.sales[0].voidedAt).toBeTruthy()
    expect(voided.state.sales[0].voidReason).toBe('Booked twice')
    const again = voidRecord(voided.state, { entity: 'sale', id: saleId }, 'Again')
    expect(again.ok).toBe(false)
    if (again.ok) return
    expect(again.error.message).toMatch(/already void/i)
  })

  it('restores inventory when a sale, a bagging, and a roast are voided', () => {
    const start = correctedState()
    const saleId = start.sales[0].id
    const bag = start.bags[0]
    const batchId = start.batches[0].id
    const createdAt = bag.createdAt

    const saleVoid = voidRecord(start, { entity: 'sale', id: saleId }, 'Wrong sale')
    expect(saleVoid.ok).toBe(true)
    if (!saleVoid.ok) return
    expect(saleVoid.state.bags[0].status).toBe('available')

    const bagVoid = voidRecord(saleVoid.state, { entity: 'bagging', batchId, createdAt }, 'Wrong pack')
    expect(bagVoid.ok).toBe(true)
    if (!bagVoid.ok) return
    expect(bagVoid.state.bags[0].voidedAt).toBeTruthy()
    expect(bagVoid.state.batches[0].roastedWeightRemaining).toBe(400)

    const lotBefore = start.lots[0].weightRemaining
    const roastVoid = voidRecord(bagVoid.state, { entity: 'batch', id: batchId }, 'Wrong lot')
    expect(roastVoid.ok).toBe(true)
    if (!roastVoid.ok) return
    expect(roastVoid.state.lots[0].weightRemaining).toBe(roundGrams(lotBefore + 1500))
  })

  it('refuses to void a roast with a live bagging and a bagging with a sold bag', () => {
    const start = correctedState()
    const batchId = start.batches[0].id
    const bag = start.bags[0]
    const roastVoid = voidRecord(start, { entity: 'batch', id: batchId }, 'Wrong roast')
    expect(roastVoid.ok).toBe(false)
    if (roastVoid.ok) return
    expect(roastVoid.error.message).toMatch(/bagging/i)
    const bagVoid = voidRecord(start, { entity: 'bagging', batchId, createdAt: bag.createdAt }, 'Wrong pack')
    expect(bagVoid.ok).toBe(false)
    if (bagVoid.ok) return
    expect(bagVoid.error.message).toMatch(/sale/i)
  })

  it('writes an audit entry for a void and keeps earlier edits', () => {
    const start = correctedState()
    const saleId = start.sales[0].id
    const edited = editRecord(start, { entity: 'sale', id: saleId }, { saleAmount: 15 }, 'Wrong amount')
    expect(edited.ok).toBe(true)
    if (!edited.ok) return
    const voided = voidRecord(edited.state, { entity: 'sale', id: saleId }, 'Booked twice')
    expect(voided.ok).toBe(true)
    if (!voided.ok) return
    expect(voided.state.audit).toHaveLength(2)
    expect(voided.state.audit[0].action).toBe('edit')
    expect(voided.state.audit[1].action).toBe('void')
    expect(voided.state.audit[1].note).toBe('Booked twice')
  })

  it('keeps a voided sale out of the sales total and P&L', () => {
    const start = correctedState()
    const before = pnl(start)
    expect(before.revenue).toBe(18)
    const voided = voidRecord(start, { entity: 'sale', id: start.sales[0].id }, 'Booked twice')
    expect(voided.ok).toBe(true)
    if (!voided.ok) return
    const after = pnl(voided.state)
    expect(after.revenue).toBe(0)
    expect(after.cogs).toBe(0)
    expect(dashboardSummary(voided.state).salesTotal).toBe(0)
    expect(voided.state.sales).toHaveLength(1)
  })

  it('marks a voided roast in the trail with its reason', () => {
    const roasted = recordRoast(lotState(2000), roastInput())
    expect(roasted.ok).toBe(true)
    if (!roasted.ok) return
    const voided = voidRecord(roasted.state, { entity: 'batch', id: roasted.state.batches[0].id }, 'Wrong lot')
    expect(voided.ok).toBe(true)
    if (!voided.ok) return
    const trail = batchTrail(voided.state, voided.state.batches[0].id)
    const roastEvent = trail.find((event) => event.kind === 'roasted')
    expect(roastEvent?.detail).toMatch(/Voided: Wrong lot/)
    expect(dashboardSummary(voided.state).activity.some((event) => event.text.includes('voided'))).toBe(true)
  })

  it('keeps a voided roast out of roasted stock and the personal allotment', () => {
    const roasted = recordRoast(lotState(2000), roastInput({ classification: 'internal', greenWeightCharged: 500, roastedYield: 400 }))
    expect(roasted.ok).toBe(true)
    if (!roasted.ok) return
    const batchId = roasted.state.batches[0].id
    const reserved = applyEntityUpdate(roasted.state, { entity: 'lot', id: 1, patch: { personalReserveGrams: 500 } })
    expect(reserved.ok).toBe(true)
    if (!reserved.ok) return
    expect(reserved.state.batches[0].roastedWeightRemaining).toBe(400)
    const voided = voidRecord(reserved.state, { entity: 'batch', id: batchId }, 'Wrong roast')
    expect(voided.ok).toBe(true)
    if (!voided.ok) return
    expect(roastedRemaining(voided.state)).toBe(0)
    expect(lotAllotment(voided.state, voided.state.lots[0]).charged).toBe(0)
    expect(lotAllotment(voided.state, voided.state.lots[0]).unmet).toBe(500)
  })
})

describe('appearance', () => {
  it('saves mocha or light, treats a missing theme as light, and rejects anything else', () => {
    const mocha = updateSettings(emptyState(), { theme: 'mocha' })
    expect(mocha.ok).toBe(true)
    if (!mocha.ok) return
    expect(mocha.state.settings.theme).toBe('mocha')
    expect(resolvedTheme(mocha.state.settings)).toBe('mocha')

    const light = updateSettings(mocha.state, { theme: 'light' })
    expect(light.ok).toBe(true)
    if (!light.ok) return
    expect(light.state.settings.theme).toBe('light')

    const stored = emptyState()
    delete stored.settings.theme
    expect(resolvedTheme(stored.settings)).toBe('light')

    const rejected = updateSettings(emptyState(), { theme: 'sepia' as 'light' })
    expect(rejected.ok).toBe(false)
    if (rejected.ok) return
    expect(rejected.error.message).toBe('Theme must be light or mocha.')
    expect(rejected.state.settings.theme).toBe('light')
  })
})

describe('dashboard', () => {
  it('summarizes green, roasted, reserve, profiles, and activity', () => {
    const roasted = recordRoast(lotState(5500), roastInput())
    expect(roasted.ok).toBe(true)
    if (!roasted.ok) return
    const summary = dashboardSummary(roasted.state)
    expect(summary.greenRemaining).toBe(4500)
    expect(summary.roastedRemaining).toBe(850)
    expect(summary.reserveTarget).toBe(GRAMS_PER_LB)
    expect(summary.recentProfiles[0].profile?.beansName).toBe('Ethiopia')
    expect(summary.activity.some((event) => event.kind === 'roasted' && event.text.includes('Ethiopia'))).toBe(true)
    expect(summary.activity.some((event) => event.text.includes('Roasted'))).toBe(true)
  })
})
