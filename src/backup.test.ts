import { describe, expect, it } from 'vitest'
import { BACKUP_FORMAT_VERSION, buildBackup, parseBackup } from './backup.ts'
import { emptyState } from './domain/rules.ts'
import type { AppState } from './types.ts'

function sampleState(): AppState {
  const state = emptyState()
  state.lots.push({
    id: 1,
    name: 'Ethiopia',
    origin: 'Ethiopia',
    weightReceived: 2000,
    weightRemaining: 1500,
    costPerKg: 12,
    totalCost: 24,
    dateReceived: '2026-06-01T00:00:00.000Z',
  })
  state.profiles.push({
    id: 1,
    beansName: 'Ethiopia',
    chargeTemp: 390,
    batchSize: 1500,
    dtr: 20,
    weightLossPercent: 15,
  })
  state.batches.push({
    id: 1,
    greenLotId: 1,
    profileId: 1,
    greenWeightCharged: 500,
    roastedYield: 400,
    weightLossPercent: 15,
    classification: 'for-sale',
    roastDate: '2026-06-02T00:00:00.000Z',
    roastedWeightRemaining: 200,
    status: 'ready-to-bag',
  })
  state.bags.push({
    id: 1,
    batchId: 1,
    bagSizeOz: 8,
    weight: 200,
    status: 'sold',
    createdAt: '2026-06-03T00:00:00.000Z',
  })
  state.sales.push({
    id: 1,
    baggedUnitIds: [1],
    saleAmount: 18,
    taxAmount: 1.25,
    date: '2026-06-04T00:00:00.000Z',
  })
  return state
}

describe('backup', () => {
  it('builds a backup with a version, an export time, and every collection', () => {
    const state = sampleState()
    const backup = buildBackup(state, '2026-06-05T00:00:00.000Z')
    expect(backup.formatVersion).toBe(BACKUP_FORMAT_VERSION)
    expect(backup.exportedAt).toBe('2026-06-05T00:00:00.000Z')
    expect(backup.lots).toHaveLength(1)
    expect(backup.profiles).toHaveLength(1)
    expect(backup.batches).toHaveLength(1)
    expect(backup.bags).toHaveLength(1)
    expect(backup.sales).toHaveLength(1)
    expect(backup.settings).toBe(state.settings)
  })

  it('rejects a file that is not JSON and one that is missing a collection', () => {
    const notJson = parseBackup('this is not json')
    expect(notJson.ok).toBe(false)
    if (notJson.ok) return
    expect(notJson.error).toMatch(/not valid JSON/i)

    const missing = parseBackup(JSON.stringify({ formatVersion: 1, profiles: [], batches: [], bags: [], sales: [] }))
    expect(missing.ok).toBe(false)
    if (missing.ok) return
    expect(missing.error).toMatch(/lots/i)
  })

  it('rejects a backup from a newer format version', () => {
    const result = parseBackup(JSON.stringify({ ...buildBackup(sampleState()), formatVersion: 99 }))
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toMatch(/format version/i)
  })

  it('accepts an older backup with no version', () => {
    const backup = buildBackup(sampleState()) as unknown as Record<string, unknown>
    delete backup.formatVersion
    const result = parseBackup(JSON.stringify(backup))
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.state.lots).toHaveLength(1)
    expect(result.state.sales).toHaveLength(1)
  })

  it('imports roasts and bags without purpose pools as their legacy single purpose', () => {
    const legacy = buildBackup(sampleState()) as unknown as {
      batches: Record<string, unknown>[]
      bags: Record<string, unknown>[]
    }
    for (const field of ['personalYield', 'forSaleYield', 'personalRemaining', 'forSaleRemaining']) {
      delete legacy.batches[0][field]
    }
    delete legacy.bags[0].classification
    const result = parseBackup(JSON.stringify(legacy))
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.state.batches[0]).toMatchObject({
      personalYield: 0,
      forSaleYield: 400,
      personalRemaining: 0,
      forSaleRemaining: 200,
    })
    expect(result.state.bags[0].classification).toBe('for-sale')

    legacy.batches[0].classification = 'internal'
    legacy.bags[0].classification = undefined
    const personal = parseBackup(JSON.stringify(legacy))
    expect(personal.ok).toBe(true)
    if (!personal.ok) return
    expect(personal.state.batches[0].personalYield).toBe(400)
    expect(personal.state.batches[0].forSaleYield).toBe(0)
    expect(personal.state.bags[0].classification).toBe('internal')
  })

  it('ignores legacy rest fields and exports batches without them', () => {
    const legacy = buildBackup(sampleState()) as unknown as { batches: Record<string, unknown>[] }
    legacy.batches[0].restStartTime = '2026-06-02T00:00:00.000Z'
    legacy.batches[0].status = 'resting'

    const imported = parseBackup(JSON.stringify(legacy))
    expect(imported.ok).toBe(true)
    if (!imported.ok) return
    expect(imported.state.batches[0].status).toBe('ready-to-bag')
    expect(imported.state.batches[0]).not.toHaveProperty('restStartTime')

    const exported = buildBackup(imported.state)
    expect(exported.batches[0]).not.toHaveProperty('restStartTime')
    expect(exported.batches[0].status).toBe('ready-to-bag')
  })

  it('rejects a sale that points at a missing bag and a negative weight', () => {
    const backup = buildBackup(sampleState()) as unknown as {
      sales: { baggedUnitIds: number[] }[]
      bags: { weight: number }[]
    }
    backup.sales[0].baggedUnitIds = [99]
    const missingBag = parseBackup(JSON.stringify(backup))
    expect(missingBag.ok).toBe(false)
    if (missingBag.ok) return
    expect(missingBag.error).toMatch(/missing bag/i)

    const negative = buildBackup(sampleState()) as unknown as { bags: { weight: number }[] }
    negative.bags[0].weight = -5
    const badWeight = parseBackup(JSON.stringify(negative))
    expect(badWeight.ok).toBe(false)
    if (badWeight.ok) return
    expect(badWeight.error).toMatch(/negative/i)
  })
})
