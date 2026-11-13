import type {
  AppState,
  AuditEntry,
  BaggedUnit,
  Customer,
  GreenLot,
  GrindPreference,
  RoastBatch,
  RoastProfile,
  Sale,
  Settings,
} from './types.ts'
import { SETTINGS_ID } from './units.ts'
import { isGrindPreference, normalizePersonName } from './domain/customers.ts'
import { batchPools } from './domain/rules.ts'

export const BACKUP_FORMAT_VERSION = 3

export interface BackupDocument {
  formatVersion: number
  exportedAt: string
  lots: GreenLot[]
  profiles: RoastProfile[]
  batches: RoastBatch[]
  bags: BaggedUnit[]
  sales: Sale[]
  customers: Customer[]
  audit: AuditEntry[]
  settings: Settings
}

export interface BackupImportDetails {
  skippedDuplicateNames: string[]
  unlinkedSaleIds: number[]
  /** Sales that must stay unlinked when the note linker runs after this import. */
  skipNoteLinkSaleIds: number[]
}

export function formatBackupImportSummary(input: {
  customerCount: number
  skippedDuplicateNames: string[]
  unlinkedSaleIds: number[]
  linkedFromNotes: number
}): string {
  const noun = input.customerCount === 1 ? 'customer' : 'customers'
  const parts = [`${input.customerCount} ${noun} restored.`]
  if (input.skippedDuplicateNames.length) {
    parts.push(`Skipped duplicate names: ${input.skippedDuplicateNames.join(', ')}.`)
  }
  if (input.unlinkedSaleIds.length) {
    const saleNoun = input.unlinkedSaleIds.length === 1 ? 'sale' : 'sales'
    const ids = input.unlinkedSaleIds.map((id) => `#${id}`).join(', ')
    parts.push(`Unlinked ${input.unlinkedSaleIds.length} ${saleNoun} whose customer was not in the backup: ${ids}.`)
  }
  if (input.linkedFromNotes > 0) {
    const saleNoun = input.linkedFromNotes === 1 ? 'sale' : 'sales'
    parts.push(`Linked ${input.linkedFromNotes} ${saleNoun} from sale notes.`)
  }
  return parts.join(' ')
}

export function buildBackup(state: AppState, exportedAt = new Date().toISOString()): BackupDocument {
  return {
    formatVersion: BACKUP_FORMAT_VERSION,
    exportedAt,
    lots: state.lots,
    profiles: state.profiles,
    batches: state.batches.map((batch) => {
      const { restStartTime: _legacyRestStartTime, ...withoutRest } = batch as RoastBatch & { restStartTime?: unknown }
      return { ...withoutRest, status: batch.roastedWeightRemaining <= 0 ? 'bagged' : 'ready-to-bag' }
    }),
    bags: state.bags,
    sales: state.sales,
    customers: state.customers,
    audit: state.audit,
    settings: state.settings,
  }
}

export function downloadBackup(state: AppState): void {
  const exportedAt = new Date().toISOString()
  const blob = new Blob([JSON.stringify(buildBackup(state, exportedAt), null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `coffee-backup-${exportedAt.slice(0, 10)}.json`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export type BackupParseResult = { ok: true; state: AppState; details: BackupImportDetails } | { ok: false; error: string }

export function parseBackup(text: string): BackupParseResult {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return { ok: false, error: 'That file is not valid JSON.' }
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, error: 'That file is not a backup.' }
  }
  const doc = raw as Record<string, unknown>

  const version = doc.formatVersion
  if (version != null && (typeof version !== 'number' || !Number.isInteger(version) || version > BACKUP_FORMAT_VERSION)) {
    return {
      ok: false,
      error: `That backup uses format version ${String(version)}. This app reads version ${BACKUP_FORMAT_VERSION} and older.`,
    }
  }

  for (const name of ['lots', 'profiles', 'batches', 'bags', 'sales'] as const) {
    if (!Array.isArray(doc[name])) {
      return { ok: false, error: `That backup is missing the ${name} collection.` }
    }
  }
  if (!doc.settings || typeof doc.settings !== 'object' || Array.isArray(doc.settings)) {
    return { ok: false, error: 'That backup is missing its settings.' }
  }
  if (doc.audit != null && !Array.isArray(doc.audit)) {
    return { ok: false, error: 'That backup has an invalid change log.' }
  }

  const lots = doc.lots as GreenLot[]
  const profiles = doc.profiles as RoastProfile[]
  const rawBatches = doc.batches as RoastBatch[]
  const rawBags = doc.bags as BaggedUnit[]
  const sales = doc.sales as Sale[]
  const audit = (doc.audit ?? []) as AuditEntry[]

  for (const lot of lots) {
    if (!isRecord(lot)) return { ok: false, error: 'That backup has an invalid green lot.' }
    if (isNegative(lot.weightReceived) || isNegative(lot.weightRemaining)) {
      return { ok: false, error: 'That backup has a negative green weight.' }
    }
  }
  for (const batch of rawBatches) {
    if (!isRecord(batch)) return { ok: false, error: 'That backup has an invalid roast.' }
    if (
      isNegative(batch.greenWeightCharged) || isNegative(batch.roastedYield) || isNegative(batch.roastedWeightRemaining) ||
      isNegative(batch.personalYield) || isNegative(batch.forSaleYield) || isNegative(batch.personalRemaining) || isNegative(batch.forSaleRemaining)
    ) {
      return { ok: false, error: 'That backup has a negative weight on a roast.' }
    }
  }

  const batches = rawBatches.map((batch) => {
    const { restStartTime: _legacyRestStartTime, ...withoutRest } = batch as RoastBatch & { restStartTime?: unknown }
    return {
      ...withoutRest,
      ...batchPools(batch),
      status: batch.roastedWeightRemaining <= 0 ? 'bagged' as const : 'ready-to-bag' as const,
    }
  })

  const batchIds = new Set(batches.map((batch) => batch?.id))
  for (const bag of rawBags) {
    if (!isRecord(bag)) return { ok: false, error: 'That backup has an invalid bag.' }
    if (isNegative(bag.weight)) return { ok: false, error: 'That backup has a negative bag weight.' }
    if (!batchIds.has(bag.batchId)) {
      return { ok: false, error: 'That backup has a bag that points to a missing roast.' }
    }
    if (bag.sources != null) {
      const sources: unknown = bag.sources
      if (!Array.isArray(sources) || sources.length === 0) {
        return { ok: false, error: 'That backup has a bag with invalid sources.' }
      }
      let total = 0
      for (const source of sources) {
        if (!isRecord(source) || typeof source.weight !== 'number' || !Number.isFinite(source.weight)) {
          return { ok: false, error: 'That backup has a bag with invalid sources.' }
        }
        if (source.weight < 0) return { ok: false, error: 'That backup has a negative bag source weight.' }
        if (typeof source.batchId !== 'number' || !batchIds.has(source.batchId)) {
          return { ok: false, error: 'That backup has a bag source that points to a missing roast.' }
        }
        total += source.weight
      }
      if (Math.abs(total - bag.weight) > 0.01) {
        return { ok: false, error: 'That backup has a bag whose sources do not add up to its weight.' }
      }
    }
  }

  const bags = rawBags.map((bag) => ({
    ...bag,
    classification: bag.classification ?? batches.find((batch) => batch.id === bag.batchId)?.classification ?? 'for-sale',
  }))

  const bagIds = new Set(bags.map((bag) => bag?.id))
  for (const sale of sales) {
    if (!isRecord(sale)) return { ok: false, error: 'That backup has an invalid sale.' }
    if (isNegative(sale.saleAmount)) return { ok: false, error: 'That backup has a negative sale amount.' }
    const ids = Array.isArray(sale.baggedUnitIds) ? sale.baggedUnitIds : []
    for (const id of ids) {
      if (!bagIds.has(id)) {
        return { ok: false, error: 'That backup has a sale that points to a missing bag.' }
      }
    }
  }

  const formatVersion = typeof version === 'number' ? version : null
  const exportedAt = typeof doc.exportedAt === 'string' ? doc.exportedAt : new Date().toISOString()
  const readCustomers = parseCustomers(doc.customers, formatVersion === BACKUP_FORMAT_VERSION, exportedAt)
  if (!readCustomers.ok) return readCustomers

  const unlinkedSaleIds: number[] = []
  const skipNoteLinkSaleIds: number[] = []
  const restoredSales = sales.map((sale) => {
    const customerId = sale.customerId
    if (formatVersion !== BACKUP_FORMAT_VERSION) {
      if (customerId == null) return sale
      const { customerId: _dropped, ...rest } = sale
      return rest
    }
    if (typeof customerId === 'number' && readCustomers.keptIds.has(customerId)) return sale
    if (customerId == null) return sale
    if (typeof sale.id === 'number') {
      unlinkedSaleIds.push(sale.id)
      skipNoteLinkSaleIds.push(sale.id)
    }
    const { customerId: _dropped, ...rest } = sale
    return rest
  })

  const settings = { ...(doc.settings as Settings), id: SETTINGS_ID }
  if (formatVersion !== BACKUP_FORMAT_VERSION) delete settings.customersLinkedAt

  return {
    ok: true,
    details: {
      skippedDuplicateNames: readCustomers.skippedDuplicateNames,
      unlinkedSaleIds,
      skipNoteLinkSaleIds,
    },
    state: {
      lots,
      profiles,
      batches,
      bags,
      sales: restoredSales,
      customers: readCustomers.customers,
      audit,
      settings,
    },
  }
}

function parseCustomers(
  raw: unknown,
  requireCollection: boolean,
  exportedAt: string,
): { ok: true; customers: Customer[]; skippedDuplicateNames: string[]; keptIds: Set<number> } | { ok: false; error: string } {
  if (!requireCollection) {
    return { ok: true, customers: [], skippedDuplicateNames: [], keptIds: new Set() }
  }
  if (!Array.isArray(raw)) {
    return { ok: false, error: 'That backup is missing the customers collection.' }
  }

  const skippedDuplicateNames: string[] = []
  const seenNames = new Set<string>()
  const pending: { name: string; grind: GrindPreference; notes?: string; createdAt: string; explicitId: number | null }[] = []
  for (const entry of raw) {
    if (!isRecord(entry) || typeof entry.name !== 'string' || !isGrindPreference(entry.grindPreference)) {
      return { ok: false, error: 'That backup has an invalid customers collection.' }
    }
    const name = normalizePersonName(entry.name)
    if (!name) return { ok: false, error: 'That backup has an invalid customers collection.' }
    const key = name.toLowerCase()
    if (seenNames.has(key)) {
      skippedDuplicateNames.push(name)
      continue
    }
    seenNames.add(key)
    const notes = typeof entry.notes === 'string' ? entry.notes.trim() : ''
    pending.push({
      name,
      grind: entry.grindPreference,
      notes: notes || undefined,
      createdAt: customerCreatedAt(entry.createdAt, exportedAt),
      explicitId: typeof entry.id === 'number' && Number.isInteger(entry.id) && entry.id > 0 ? entry.id : null,
    })
  }

  const reserved = new Set<number>()
  for (const entry of pending) {
    if (entry.explicitId != null && !reserved.has(entry.explicitId)) reserved.add(entry.explicitId)
  }
  const keptIds = new Set<number>()
  const customers: Customer[] = []
  for (const entry of pending) {
    let id = entry.explicitId
    if (id == null || keptIds.has(id)) {
      id = 1
      while (reserved.has(id) || keptIds.has(id)) id += 1
      reserved.add(id)
    }
    keptIds.add(id)
    const customer: Customer = {
      id,
      name: entry.name,
      grindPreference: entry.grind,
      createdAt: entry.createdAt,
    }
    if (entry.notes) customer.notes = entry.notes
    customers.push(customer)
  }
  return { ok: true, customers, skippedDuplicateNames, keptIds }
}

function customerCreatedAt(value: unknown, fallback: string): string {
  if (typeof value === 'string' && value.trim() && !Number.isNaN(Date.parse(value))) return new Date(value).toISOString()
  if (fallback.trim() && !Number.isNaN(Date.parse(fallback))) return new Date(fallback).toISOString()
  return new Date().toISOString()
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function isNegative(value: unknown): boolean {
  return typeof value === 'number' && Number.isFinite(value) && value < 0
}
