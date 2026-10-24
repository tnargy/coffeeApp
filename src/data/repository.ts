import { db } from '../db.ts'
import { parseBackup, type BackupParseResult } from '../backup.ts'
import {
  addProfile,
  applyEntityUpdate,
  editRecord as editRecordInState,
  emptyState,
  ensureProfileSnapshots,
  packBags,
  receiveLot,
  recordRoast,
  recordSale,
  removeLot,
  removeProfile,
  updateSettings,
  voidRecord as voidRecordInState,
  type DomainResult,
  type EntityUpdate,
  type PackBagsInput,
  type ProfileInput,
  type ReceiveLotInput,
  type RecordChanges,
  type RecordRoastInput,
  type RecordSaleInput,
  type RecordTarget,
} from '../domain/rules.ts'
import type { AppState, BaggedUnit, GreenLot, RoastBatch, RoastProfile, Sale } from '../types.ts'
import { SETTINGS_ID } from '../units.ts'

let queue: Promise<unknown> = Promise.resolve()

function enqueue<T>(work: () => Promise<T>): Promise<T> {
  const run = queue.then(work, work)
  queue = run.then(
    () => undefined,
    () => undefined,
  )
  return run
}

export async function loadState(): Promise<AppState> {
  const [lots, profiles, batches, bags, sales, audit, settings] = await Promise.all([
    db.lots.toArray(),
    db.profiles.toArray(),
    db.batches.toArray(),
    db.bags.toArray(),
    db.sales.toArray(),
    db.audit.toArray(),
    db.settings.get(SETTINGS_ID),
  ])
  return ensureProfileSnapshots({
    lots,
    profiles,
    batches,
    bags,
    sales,
    audit,
    settings: settings ?? emptyState().settings,
  })
}

export async function saveState(state: AppState): Promise<void> {
    await db.transaction('rw', [db.lots, db.profiles, db.batches, db.bags, db.sales, db.audit, db.settings], async () => {
    await db.lots.clear()
    await db.profiles.clear()
    await db.batches.clear()
    await db.bags.clear()
    await db.sales.clear()
    await db.audit.clear()
    await db.lots.bulkAdd(state.lots)
    await db.profiles.bulkAdd(state.profiles)
    await db.batches.bulkAdd(state.batches)
    await db.bags.bulkAdd(state.bags)
    await db.sales.bulkAdd(state.sales)
    await db.audit.bulkAdd(state.audit)
    await db.settings.put(state.settings)
  })
}

async function commit(result: DomainResult): Promise<DomainResult> {
  if (!result.ok) return result
  await saveState(result.state)
  return result
}

async function mutate(change: (state: AppState) => DomainResult): Promise<DomainResult> {
  return enqueue(async () => commit(change(await loadState())))
}

function isUntouchedStarter(state: AppState): boolean {
  if (state.bags.length > 0 || state.sales.length > 0) return false
  if (state.lots.length !== 1 || state.profiles.length !== 1 || state.batches.length !== 1) return false
  const lot = state.lots[0]
  const profile = state.profiles[0]
  return lot.name === 'Starter green' && lot.origin === 'Starter lot' && profile.notes === 'Seeded personal-use profile'
}

export async function ensureReady(): Promise<void> {
  await enqueue(async () => {
    const settings = await db.settings.get(SETTINGS_ID)
    if (!settings) await db.settings.add(emptyState().settings)
    const storedBatches = await db.batches.toArray()
    const hasLegacyRestData = storedBatches.some((batch) => {
      const legacy = batch as unknown as { status: string }
      return Object.prototype.hasOwnProperty.call(batch, 'restStartTime') || legacy.status === 'resting' || legacy.status === 'roasted'
    })
    if (hasLegacyRestData) {
      const state = await loadState()
      const batches = state.batches.map((batch) => {
        const { restStartTime: _legacyRestStartTime, ...withoutRest } = batch as RoastBatch & { restStartTime?: unknown }
        return {
          ...withoutRest,
          status: batch.roastedWeightRemaining <= 0 ? 'bagged' as const : 'ready-to-bag' as const,
        }
      })
      await saveState({ ...state, batches })
    }
    const state = await loadState()
    if (!isUntouchedStarter(state)) return
    const kept = state.settings
    await saveState({
      ...emptyState(),
      settings: {
        ...emptyState().settings,
        personalUseReserveTargetGrams: kept.personalUseReserveTargetGrams,
        defaultBagSizeOz: kept.defaultBagSizeOz,
        theme: kept.theme,
      },
    })
  })
}

export function receiveGreenLot(input: ReceiveLotInput): Promise<DomainResult> {
  return mutate((state) => receiveLot(state, input))
}

export function logRoast(input: RecordRoastInput): Promise<DomainResult> {
  return mutate((state) => recordRoast(state, input))
}

export function packBatch(input: PackBagsInput): Promise<DomainResult> {
  return mutate((state) => packBags(state, input))
}

export function sellBags(input: RecordSaleInput): Promise<DomainResult> {
  return mutate((state) => recordSale(state, input))
}

export function saveSettings(patch: Partial<Pick<AppState['settings'], 'personalUseReserveTargetGrams' | 'defaultBagSizeOz' | 'theme'>>): Promise<DomainResult> {
  return mutate((state) => updateSettings(state, patch))
}

export function editRecord(target: RecordTarget, changes: RecordChanges, note: string): Promise<DomainResult> {
  return mutate((state) => editRecordInState(state, target, changes, note))
}

export function voidRecord(target: RecordTarget, note: string): Promise<DomainResult> {
  return mutate((state) => voidRecordInState(state, target, note))
}

export async function importBackup(text: string): Promise<BackupParseResult> {
  const parsed = parseBackup(text)
  if (!parsed.ok) return parsed
  await enqueue(() => saveState(parsed.state))
  return parsed
}

export const crud = {
  listLots: () => db.lots.toArray(),
  getLot: (id: number) => db.lots.get(id),
  createLot: (input: ReceiveLotInput) => receiveGreenLot(input),
  updateLot: (id: number, patch: Partial<GreenLot>) => mutate((state) => applyEntityUpdate(state, { entity: 'lot', id, patch })),
  removeLot: (id: number) => mutate((state) => removeLot(state, id)),

  listProfiles: () => db.profiles.toArray(),
  getProfile: (id: number) => db.profiles.get(id),
  createProfile: (input: ProfileInput) => mutate((state) => addProfile(state, input)),
  updateProfile: (id: number, patch: Partial<RoastProfile>) => mutate((state) => applyEntityUpdate(state, { entity: 'profile', id, patch })),
  removeProfile: (id: number) => mutate((state) => removeProfile(state, id)),

  listBatches: () => db.batches.toArray(),
  getBatch: (id: number) => db.batches.get(id),
  createBatch: (input: RecordRoastInput) => logRoast(input),
  updateBatch: (id: number, patch: Partial<RoastBatch>) => mutate((state) => applyEntityUpdate(state, { entity: 'batch', id, patch })),

  listBags: () => db.bags.toArray(),
  getBag: (id: number) => db.bags.get(id),
  createBags: (input: PackBagsInput) => packBatch(input),
  updateBag: (id: number, patch: Partial<BaggedUnit>) => mutate((state) => applyEntityUpdate(state, { entity: 'bag', id, patch })),

  listSales: () => db.sales.toArray(),
  getSale: (id: number) => db.sales.get(id),
  createSale: (input: RecordSaleInput) => sellBags(input),
  updateSale: (id: number, patch: Partial<Sale>) => mutate((state) => applyEntityUpdate(state, { entity: 'sale', id, patch })),

  getSettings: () => db.settings.get(SETTINGS_ID),
  updateSettings: (patch: EntityUpdate & { entity: 'settings' }) => mutate((state) => applyEntityUpdate(state, patch)),
}
