import { describe, expect, it } from 'vitest'
import {
  bagSources,
  bagsFromBatch,
  batchTrail,
  costOfBag,
  dashboardSummary,
  editRecord,
  emptyState,
  livePackedWeight,
  packBags,
  pnl,
  receiveLot,
  recordRoast,
  recordSale,
  saleSources,
  voidRecord,
  weightFromBatch,
  type ProfileInput,
} from './rules.ts'
import type { AppState } from '../types.ts'

const profile: ProfileInput = { beansName: 'Ethiopia', chargeTemp: 390, batchSize: 1500, dtr: 20, weightLossPercent: 15 }
const now = new Date('2026-03-03T00:00:00.000Z').getTime()

function must(result: { ok: boolean; state: AppState }): AppState {
  if (!result.ok) throw new Error('setup failed')
  return result.state
}

/** Two lots at different prices; one roast on each. Roast yields are given in grams. */
function twoBatches(yieldA: number, yieldB: number): AppState {
  let state = emptyState()
  state = must(receiveLot(state, { origin: 'Cheap', weightReceived: 5000, dateReceived: '2026-01-01T00:00:00.000Z', totalCost: 50 }))
  state = must(receiveLot(state, { origin: 'Dear', weightReceived: 5000, dateReceived: '2026-01-02T00:00:00.000Z', totalCost: 150 }))
  state = must(recordRoast(state, { greenLotId: 1, greenWeightCharged: 1000, roastedYield: yieldA, classification: 'for-sale', roastDate: '2026-03-01T00:00:00.000Z', profile }))
  state = must(recordRoast(state, { greenLotId: 2, greenWeightCharged: 1000, roastedYield: yieldB, classification: 'for-sale', roastDate: '2026-03-02T00:00:00.000Z', profile }))
  return state
}

function pack(state: AppState, batchIds: number[], bagCount: number, weightPerBag: number, classification: 'for-sale' | 'internal' = 'for-sale') {
  return packBags(state, { batchIds, bagCount, weightPerBag, classification, now })
}

describe('bag sources helpers', () => {
  it('treats a bag without sources as drawn wholly from its batch', () => {
    const start = twoBatches(500, 500)
    const packed = must(packBags(start, { batchId: 1, bagCount: 1, weightPerBag: 200, now }))
    const bag = packed.bags[0]
    expect(bag.sources).toBeUndefined()
    expect(bagSources(bag)).toEqual([{ batchId: 1, weight: 200 }])
    expect(weightFromBatch(bag, 1)).toBe(200)
    expect(weightFromBatch(bag, 2)).toBe(0)
  })

  it('reads a two-source bag and finds it from either batch', () => {
    const packed = must(pack(twoBatches(300, 500), [1, 2], 2, 200))
    const second = packed.bags[1]
    expect(bagSources(second)).toEqual([
      { batchId: 1, weight: 100 },
      { batchId: 2, weight: 100 },
    ])
    expect(weightFromBatch(second, 2)).toBe(100)
    expect(bagsFromBatch(packed, 1).map((bag) => bag.id)).toEqual([1, 2])
    expect(bagsFromBatch(packed, 2).map((bag) => bag.id)).toEqual([2])
    expect(livePackedWeight(packed, 1)).toBe(300)
    expect(livePackedWeight(packed, 2)).toBe(100)
  })
})

describe('a batch used only as a later source', () => {
  // Batch 1 is the anchor of both bags; batch 2 only supplies the second bag.
  const packed = () => must(pack(twoBatches(300, 500), [1, 2], 2, 200))

  it('cannot be voided while its bagging is live', () => {
    const state = packed()
    const refused = voidRecord(state, { entity: 'batch', id: 2 }, 'wrong roast')
    expect(refused.ok).toBe(false)
    if (refused.ok) return
    expect(refused.error.message).toMatch(/Void the bagging/)
    expect(refused.state.batches[1].voidedAt).toBeUndefined()
  })

  it('counts its share of packed weight against a roasted-yield edit', () => {
    const state = packed()
    const refused = editRecord(state, { entity: 'batch', id: 2 }, { roastedYield: 50 }, 'typo')
    expect(refused.ok).toBe(false)
    if (refused.ok) return
    expect(refused.error.message).toMatch(/100 g already packed/)
    const allowed = editRecord(state, { entity: 'batch', id: 2 }, { roastedYield: 100 }, 'typo')
    expect(allowed.ok).toBe(true)
  })
})

describe('packing from several batches', () => {
  it('fills the bags from A then B and leaves nothing stranded in A', () => {
    const result = pack(twoBatches(300, 500), [1, 2], 3, 200)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.state.batches[0].roastedWeightRemaining).toBe(0)
    expect(result.state.batches[0].status).toBe('bagged')
    expect(result.state.batches[1].roastedWeightRemaining).toBe(200)
    expect(result.state.bags).toHaveLength(3)
    expect(result.info).toMatch(/2 batches/)
  })

  it('leaves later batches untouched when the first covers the pack', () => {
    const result = pack(twoBatches(800, 500), [1, 2], 2, 200)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.state.batches[0].roastedWeightRemaining).toBe(400)
    expect(result.state.batches[1].roastedWeightRemaining).toBe(500)
    expect(result.state.bags.every((bag) => bag.sources === undefined && bag.batchId === 1)).toBe(true)
  })

  it('uses the selection order to decide the draw', () => {
    const result = pack(twoBatches(300, 500), [2, 1], 2, 200)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.state.batches[1].roastedWeightRemaining).toBe(100)
    expect(result.state.batches[0].roastedWeightRemaining).toBe(300)
  })

  it('records both sources on a straddling bag and sums every bag to its weight', () => {
    const result = pack(twoBatches(300, 500), [1, 2], 2, 200)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const [first, second] = result.state.bags
    expect(first.sources).toEqual([{ batchId: 1, weight: 200 }])
    expect(second.sources).toEqual([
      { batchId: 1, weight: 100 },
      { batchId: 2, weight: 100 },
    ])
    for (const bag of result.state.bags) {
      expect(bagSources(bag).reduce((sum, source) => sum + source.weight, 0)).toBe(bag.weight)
      expect(bag.batchId).toBe(1)
    }
  })

  it('keeps bag sums exact with fractional weights', () => {
    const result = pack(twoBatches(250.5, 500), [1, 2], 3, 123.45)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    for (const bag of result.state.bags) {
      const sum = Math.round(bagSources(bag).reduce((total, source) => total + source.weight, 0) * 1000) / 1000
      expect(sum).toBe(123.45)
    }
  })

  it('takes a personal pack from the for-sale pool of each for-sale batch', () => {
    const result = pack(twoBatches(300, 500), [1, 2], 2, 200, 'internal')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.state.bags.every((bag) => bag.classification === 'internal')).toBe(true)
    expect(result.state.batches[0].forSaleRemaining).toBe(0)
    expect(result.state.batches[1].forSaleRemaining).toBe(400)
    expect(result.state.batches.every((batch) => batch.personalRemaining === 0)).toBe(true)
  })
})

describe('combined pack rejections', () => {
  it('reports the shortfall and changes nothing', () => {
    const start = twoBatches(300, 100)
    const result = pack(start, [1, 2], 3, 200)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.type).toBe('shortfall')
    if (result.error.type !== 'shortfall') return
    expect(result.error.shortfall).toBe(200)
    expect(result.state).toEqual(start)
  })

  it.each([
    ['empty selection', [] as number[]],
    ['a duplicate batch', [1, 1]],
    ['a missing batch', [1, 99]],
  ])('rejects %s without changing state', (_label, ids) => {
    const start = twoBatches(300, 500)
    const result = pack(start, ids, 1, 100)
    expect(result.ok).toBe(false)
    expect(result.state).toEqual(start)
  })

  it('rejects a void batch and a batch with nothing left', () => {
    const start = twoBatches(300, 500)
    const voided = must(voidRecord(start, { entity: 'batch', id: 2 }, 'bad roast'))
    const voidResult = pack(voided, [1, 2], 1, 100)
    expect(voidResult.ok).toBe(false)
    expect(voidResult.state).toEqual(voided)

    const emptied = must(pack(start, [1], 1, 300))
    const emptyResult = pack(emptied, [1, 2], 1, 100)
    expect(emptyResult.ok).toBe(false)
    expect(emptyResult.state).toEqual(emptied)
  })
})

describe('voiding and editing a combined bagging', () => {
  const packed = () => must(pack(twoBatches(300, 500), [1, 2], 2, 200))

  it('returns each source batch share and logs one audit entry', () => {
    const state = packed()
    const result = voidRecord(state, { entity: 'bagging', batchId: 1, createdAt: state.bags[0].createdAt }, 'miscount')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.state.batches[0].roastedWeightRemaining).toBe(300)
    expect(result.state.batches[0].forSaleRemaining).toBe(300)
    expect(result.state.batches[1].roastedWeightRemaining).toBe(500)
    expect(result.state.bags.every((bag) => bag.voidedAt != null)).toBe(true)
    expect(result.state.audit).toHaveLength(1)
    expect(result.state.audit[0].entityKey).toBe(`bagging:1:${state.bags[0].createdAt}`)
    expect(voidRecord(result.state, { entity: 'batch', id: 2 }, 'bad roast').ok).toBe(true)
  })

  it('returns a personal bagging share to the personal pool of each source', () => {
    const state = must(pack(twoBatches(300, 500), [1, 2], 2, 200, 'internal'))
    const result = voidRecord(state, { entity: 'bagging', batchId: 1, createdAt: state.bags[0].createdAt }, 'miscount')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.state.batches[0].personalRemaining).toBe(300)
    expect(result.state.batches[1].personalRemaining).toBe(100)
    expect(result.state.batches[1].roastedWeightRemaining).toBe(500)
  })

  it('allows a bag size edit but refuses a weight edit on a combined bagging', () => {
    const state = packed()
    const target = { entity: 'bagging', batchId: 1, createdAt: state.bags[0].createdAt } as const
    const resized = editRecord(state, target, { bagSizeOz: 12 }, 'bigger bags')
    expect(resized.ok).toBe(true)
    if (!resized.ok) return
    expect(resized.state.bags.every((bag) => bag.bagSizeOz === 12)).toBe(true)
    expect(resized.state.batches).toEqual(state.batches)

    const unchangedWeight = editRecord(state, target, { weightPerBag: 200, bagSizeOz: 12 }, 'bigger bags')
    expect(unchangedWeight.ok).toBe(true)

    const refused = editRecord(state, target, { weightPerBag: 150 }, 'lighter')
    expect(refused.ok).toBe(false)
    if (refused.ok) return
    expect(refused.error.message).toMatch(/void the bagging and pack again/i)
    expect(refused.state).toEqual(state)
  })

  it('still edits the weight of a single-batch bagging', () => {
    const state = must(packBags(twoBatches(300, 500), { batchId: 2, bagCount: 2, weightPerBag: 100, now }))
    const result = editRecord(state, { entity: 'bagging', batchId: 2, createdAt: state.bags[0].createdAt }, { weightPerBag: 150 }, 'heavier')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.state.batches[1].roastedWeightRemaining).toBe(200)
  })
})

describe('cost of a combined bag', () => {
  it('adds the cost of each source batch using its own lot', () => {
    const state = must(pack(twoBatches(300, 500), [1, 2], 2, 200))
    // Bag 2: 100 g from batch 1 (lot 0.01/g, 3.333 g green per g) + 100 g from batch 2 (lot 0.03/g, 2 g green per g).
    expect(costOfBag(state, state.bags[1])).toBeCloseTo(100 * (1000 / 300) * 0.01 + 100 * 2 * 0.03, 6)
    expect(costOfBag(state, state.bags[0])).toBeCloseTo(200 * (1000 / 300) * 0.01, 6)
  })

  it('uses the summed cost in P&L and lists every source on the sale', () => {
    const packed = must(pack(twoBatches(300, 500), [1, 2], 2, 200))
    const sold = recordSale(packed, { baggedUnitIds: [2], saleAmount: 20, date: '2026-03-04T00:00:00.000Z' })
    expect(sold.ok).toBe(true)
    if (!sold.ok) return
    expect(pnl(sold.state).cogs).toBe(9.33)
    expect(pnl(sold.state).grossProfit).toBe(10.67)
    const sources = saleSources(sold.state, sold.state.sales[0])
    expect(sources[0].parts.map((part) => [part.batch.id, part.lot?.origin, part.weight])).toEqual([
      [1, 'Cheap', 100],
      [2, 'Dear', 100],
    ])
  })
})
describe('history for a combined bagging', () => {
  const packed = () => must(pack(twoBatches(300, 500), [1, 2], 2, 200))

  it('shows the bagging in the trail of a batch that only supplied a later bag', () => {
    const state = packed()
    const trail = batchTrail(state, 2)
    const bagging = trail.find((event) => event.kind === 'bagged')
    expect(bagging?.detail).toMatch(/Packed 1 bag\(s\), 100 g for sale/)
    expect(bagging?.detail).toMatch(/also drew from Batch #1/)
    const anchor = batchTrail(state, 1).find((event) => event.kind === 'bagged')
    expect(anchor?.detail).toMatch(/Packed 2 bag\(s\), 300 g/)
    expect(anchor?.detail).toMatch(/also drew from Batch #2/)
  })

  it('shows sales of a later-source bag in that batch trail', () => {
    const sold = recordSale(packed(), { baggedUnitIds: [2], saleAmount: 20, date: '2026-03-04T00:00:00.000Z' })
    expect(sold.ok).toBe(true)
    if (!sold.ok) return
    expect(batchTrail(sold.state, 2).map((event) => event.kind)).toEqual(['received', 'roasted', 'bagged', 'sold'])
  })

  it('counts a later-source batch in the dashboard trail', () => {
    const summary = dashboardSummary(packed())
    expect(summary.trail.map((row) => [row.batch.id, row.bagged])).toEqual([
      [1, 2],
      [2, 1],
    ])
  })

  it('lists a combined bagging once in recent activity, naming each lot', () => {
    const bagged = dashboardSummary(packed()).activity.filter((event) => event.kind === 'bagged')
    expect(bagged).toHaveLength(1)
    expect(bagged[0].text).toMatch(/Packaged 2 bags/)
    expect(bagged[0].detail).toMatch(/Cheap \+ Dear/)
  })
})