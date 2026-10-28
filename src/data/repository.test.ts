import { beforeEach, describe, expect, it } from 'vitest'
import { db, resetDatabase } from '../db.ts'
import { buildBackup } from '../backup.ts'
import { SETTINGS_ID } from '../units.ts'
import type { RoastBatch } from '../types.ts'
import { crud, editRecord, ensureReady, importBackup, loadState, logRoast, packBatch, voidRecord } from './repository.ts'

beforeEach(async () => {
  await resetDatabase()
})

async function receiveTestLot() {
  const result = await crud.createLot({
    origin: 'Ethiopia',
    name: 'Test',
    weightReceived: 2000,
    dateReceived: '2026-06-01T00:00:00.000Z',
    totalCost: 24,
  })
  if (!result.ok) throw new Error('setup lot failed')
  return result.state
}

describe('persistence', () => {
  it('starts empty and does not seed inventory', async () => {
    await ensureReady()
    await ensureReady()
    const state = await loadState()
    expect(state.lots).toHaveLength(0)
    expect(state.batches).toHaveLength(0)
    expect(state.profiles).toHaveLength(0)
    expect(state.settings.defaultBagSizeOz).toBe(8)
  })

  it('clears an untouched starter lot and roast', async () => {
    await db.settings.add({ id: SETTINGS_ID, personalUseReserveTargetGrams: 453.59237, defaultBagSizeOz: 12, theme: 'mocha' })
    await db.lots.add({
      id: 1,
      name: 'Starter green',
      origin: 'Starter lot',
      weightReceived: 2617,
      weightRemaining: 2268,
      costPerKg: 10,
      totalCost: 26.17,
      dateReceived: '2026-06-01T00:00:00.000Z',
      notes: 'Initial inventory: 5 lb green on hand after the seeded personal roast.',
    })
    await db.profiles.add({
      id: 1,
      beansName: 'Starter green',
      chargeTemp: 380,
      batchSize: 353,
      dtr: 18,
      weightLossPercent: 15,
      notes: 'Seeded personal-use profile',
    })
    await db.batches.add({
      id: 1,
      greenLotId: 1,
      profileId: 1,
      greenWeightCharged: 353,
      roastedYield: 300,
      weightLossPercent: 15,
      classification: 'internal',
      roastDate: '2026-06-02T00:00:00.000Z',
      restStartTime: null,
      roastedWeightRemaining: 300,
      status: 'roasted',
    } as unknown as RoastBatch)
    await ensureReady()
    const state = await loadState()
    expect(state.lots).toHaveLength(0)
    expect(state.profiles).toHaveLength(0)
    expect(state.batches).toHaveLength(0)
    expect(state.settings.theme).toBe('mocha')
    expect(state.settings.defaultBagSizeOz).toBe(12)
  })

  it('removes legacy rest data and makes an old roast ready to bag at startup', async () => {
    await receiveTestLot()
    await db.profiles.add({
      id: 1,
      beansName: 'Ethiopia',
      chargeTemp: 380,
      batchSize: 500,
      dtr: 20,
      weightLossPercent: 20,
    })
    await db.batches.add({
      id: 1,
      greenLotId: 1,
      profileId: 1,
      greenWeightCharged: 500,
      roastedYield: 400,
      weightLossPercent: 20,
      classification: 'for-sale',
      roastDate: '2026-06-02T00:00:00.000Z',
      restStartTime: '2026-06-02T00:00:00.000Z',
      roastedWeightRemaining: 400,
      status: 'resting',
    } as unknown as RoastBatch)

    await ensureReady()

    const migrated = await db.batches.get(1)
    expect(migrated?.status).toBe('ready-to-bag')
    expect(migrated && 'restStartTime' in migrated).toBe(false)
  })

  it('persists optional roast timing and still loads records that omit it', async () => {
    await ensureReady()
    const before = await receiveTestLot()
    await db.profiles.add({
      id: 9,
      beansName: 'Legacy',
      chargeTemp: 370,
      batchSize: 400,
      dtr: 18,
      weightLossPercent: 14,
    })
    await db.batches.add({
      id: 9,
      greenLotId: before.lots[0].id,
      profileId: 9,
      greenWeightCharged: 100,
      roastedYield: 80,
      weightLossPercent: 20,
      classification: 'internal',
      roastDate: '2026-05-01T00:00:00.000Z',
      roastedWeightRemaining: 80,
      status: 'ready-to-bag',
    })

    const loaded = await loadState()
    const legacyProfile = loaded.profiles.find((profile) => profile.beansName === 'Legacy')
    const legacyBatch = loaded.batches.find((batch) => batch.id === 9)
    expect(legacyProfile?.beansName).toBe('Legacy')
    expect(legacyProfile?.totalTimeSeconds).toBeUndefined()
    expect(legacyBatch?.profileSnapshot?.beansName).toBe('Legacy')
    expect(legacyBatch?.profileSnapshot?.totalTimeSeconds).toBeUndefined()
    expect(legacyBatch?.profileSnapshot?.firstCrackSeconds).toBeUndefined()
    expect(legacyBatch?.profileSnapshot?.dropTemp).toBeUndefined()

    const roasted = await logRoast({
      greenLotId: before.lots[0].id,
      greenWeightCharged: 200,
      roastedYield: 170,
      classification: 'for-sale',
      roastDate: '2026-06-02T00:00:00.000Z',
      profile: {
        beansName: 'Ethiopia',
        chargeTemp: 390,
        batchSize: 200,
        dtr: 20,
        weightLossPercent: 15,
        totalTimeSeconds: 877,
        firstCrackSeconds: 717,
        dropTemp: 196,
      },
    })
    expect(roasted.ok).toBe(true)
    const state = await loadState()
    const saved = state.profiles.find((profile) => profile.beansName === 'Ethiopia')
    const snap = state.batches.find((batch) => batch.profileSnapshot?.beansName === 'Ethiopia')?.profileSnapshot
    expect(saved?.totalTimeSeconds).toBe(877)
    expect(saved?.firstCrackSeconds).toBe(717)
    expect(saved?.dropTemp).toBe(196)
    expect(snap?.totalTimeSeconds).toBe(877)
    expect(snap?.firstCrackSeconds).toBe(717)
    expect(snap?.dropTemp).toBe(196)
    expect(state.profiles.find((profile) => profile.beansName === 'Legacy')?.totalTimeSeconds).toBeUndefined()
    expect(state.batches.find((batch) => batch.id === 9)?.greenWeightCharged).toBe(100)
  })

  it('does not persist a roast that exceeds green stock', async () => {
    await ensureReady()
    const before = await receiveTestLot()
    const result = await logRoast({
      greenLotId: before.lots[0].id,
      greenWeightCharged: 10000,
      roastedYield: 8000,
      classification: 'for-sale',
      roastDate: '2026-06-02T00:00:00.000Z',
      profile: {
        beansName: 'Too big',
        chargeTemp: 380,
        batchSize: 10000,
        dtr: 20,
        weightLossPercent: 20,
      },
    })
    expect(result.ok).toBe(false)
    const after = await loadState()
    expect(after.lots[0].weightRemaining).toBe(before.lots[0].weightRemaining)
    expect(after.batches).toHaveLength(before.batches.length)
  })

  it('rejects a direct write that would make green stock negative', async () => {
    await ensureReady()
    const before = await receiveTestLot()
    const result = await crud.updateLot(before.lots[0].id, { weightRemaining: -20 })
    expect(result.ok).toBe(false)
    const after = await loadState()
    expect(after.lots[0].weightRemaining).toBe(before.lots[0].weightRemaining)
  })

  it('persists an edit and a void with their audit entries', async () => {
    await ensureReady()
    const before = await receiveTestLot()
    const roasted = await logRoast({
      greenLotId: before.lots[0].id,
      greenWeightCharged: 500,
      roastedYield: 400,
      classification: 'for-sale',
      roastDate: '2026-06-02T00:00:00.000Z',
      profile: {
        beansName: 'Ethiopia',
        chargeTemp: 380,
        batchSize: 500,
        dtr: 20,
        weightLossPercent: 20,
      },
    })
    expect(roasted.ok).toBe(true)
    if (!roasted.ok) return
    const batchId = roasted.state.batches[0].id
    const edited = await editRecord({ entity: 'batch', id: batchId }, { roastedYield: 450 }, 'Wrong yield')
    expect(edited.ok).toBe(true)
    if (!edited.ok) return
    const voided = await voidRecord({ entity: 'batch', id: batchId }, 'Wrong roast')
    expect(voided.ok).toBe(true)
    if (!voided.ok) return
    const state = await loadState()
    expect(state.batches[0].voidedAt).toBeTruthy()
    expect(state.batches[0].voidReason).toBe('Wrong roast')
    expect(state.audit).toHaveLength(2)
    expect(state.audit[0].action).toBe('edit')
    expect(state.audit[1].action).toBe('void')
  })

  it('persists a pack that combines two batches and restores both on void', async () => {
    await ensureReady()
    const lot = await receiveTestLot()
    const profile = { beansName: 'Ethiopia', chargeTemp: 380, batchSize: 500, dtr: 20, weightLossPercent: 20 }
    for (const [day, yieldGrams] of [['02', 300], ['03', 500]] as const) {
      const roasted = await logRoast({
        greenLotId: lot.lots[0].id,
        greenWeightCharged: 500,
        roastedYield: yieldGrams,
        classification: 'for-sale',
        roastDate: `2026-06-${day}T00:00:00.000Z`,
        profile,
      })
      expect(roasted.ok).toBe(true)
    }
    const packed = await packBatch({ batchIds: [1, 2], bagCount: 2, weightPerBag: 200, classification: 'for-sale', now: Date.now() })
    expect(packed.ok).toBe(true)
    const stored = await loadState()
    expect(stored.bags).toHaveLength(2)
    expect(stored.bags[1].sources).toEqual([
      { batchId: 1, weight: 100 },
      { batchId: 2, weight: 100 },
    ])
    expect(stored.batches.map((batch) => batch.roastedWeightRemaining)).toEqual([0, 400])

    const voided = await voidRecord({ entity: 'bagging', batchId: 1, createdAt: stored.bags[0].createdAt }, 'Miscount')
    expect(voided.ok).toBe(true)
    const after = await loadState()
    expect(after.batches.map((batch) => batch.roastedWeightRemaining)).toEqual([300, 500])
  })

  it('replaces local data with a valid backup', async () => {
    await ensureReady()
    const before = await receiveTestLot()
    const backup = buildBackup(before, '2026-06-05T00:00:00.000Z')
    const result = await importBackup(JSON.stringify(backup))
    expect(result.ok).toBe(true)
    const state = await loadState()
    expect(state.lots).toHaveLength(1)
    expect(state.lots[0].origin).toBe('Ethiopia')
    expect(state.settings.id).toBe(SETTINGS_ID)
  })

  it('leaves the database unchanged when the file is rejected', async () => {
    await ensureReady()
    const before = await receiveTestLot()
    const result = await importBackup(JSON.stringify({ formatVersion: 1, profiles: [] }))
    expect(result.ok).toBe(false)
    const state = await loadState()
    expect(state.lots).toHaveLength(1)
    expect(state.lots[0].weightRemaining).toBe(before.lots[0].weightRemaining)
  })

  it('keeps existing data and round-trips an audit entry', async () => {
    await ensureReady()
    const before = await receiveTestLot()
    await db.audit.add({
      id: 1,
      at: '2026-06-02T00:00:00.000Z',
      entity: 'sale',
      entityKey: 'sale:1',
      action: 'void',
      note: 'Booked twice',
      changes: [{ field: 'Status', from: 'live', to: 'void' }],
    })
    const state = await loadState()
    expect(state.lots).toHaveLength(1)
    expect(state.lots[0].weightRemaining).toBe(before.lots[0].weightRemaining)
    expect(state.audit).toHaveLength(1)
    expect(state.audit[0].note).toBe('Booked twice')
    expect(state.audit[0].action).toBe('void')
  })
})
