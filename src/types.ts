export type Classification = 'internal' | 'for-sale'
export type Theme = 'light' | 'mocha'
export type BatchStatus = 'ready-to-bag' | 'bagged'
export type BagStatus = 'available' | 'sold'

export interface GreenLot {
  id: number
  name: string
  origin: string
  process?: string
  grade?: string
  weightReceived: number
  weightRemaining: number
  costPerKg: number
  totalCost: number
  dateReceived: string
  notes?: string
  personalReserveGrams?: number
}

export interface ProfileSnapshot {
  name?: string
  beansName: string
  chargeTemp: number
  batchSize: number
  dtr: number
  weightLossPercent: number
  notes?: string
  totalTimeSeconds?: number
  firstCrackSeconds?: number
  dropTemp?: number
}

export interface RoastProfile extends ProfileSnapshot {
  id: number
  createdAt?: string
  updatedAt?: string
}

export interface RoastBatch {
  id: number
  greenLotId: number
  profileId: number
  profileSnapshot?: ProfileSnapshot
  greenWeightCharged: number
  roastedYield: number
  weightLossPercent: number
  classification: Classification
  roastDate: string
  roastedWeightRemaining: number
  personalYield?: number
  forSaleYield?: number
  personalRemaining?: number
  forSaleRemaining?: number
  status: BatchStatus
  voidedAt?: string
  voidReason?: string
}

export interface BagSource {
  batchId: number
  weight: number
}

export interface BaggedUnit {
  id: number
  /**
   * The bagging's anchor: the first batch that supplied weight to the pack. Together with
   * `createdAt` it identifies the bagging. For a pack drawn from several batches it is NOT the
   * only source of this bag; use `sources` (via `bagSources`) to ask which batches supplied it.
   */
  batchId: number
  /** Grams taken from each batch. Absent on single-batch bags, which came wholly from `batchId`. */
  sources?: BagSource[]
  bagSizeOz: number
  weight: number
  classification?: Classification
  status: BagStatus
  createdAt: string
  voidedAt?: string
  voidReason?: string
}

export interface Sale {
  id: number
  baggedUnitIds: number[]
  saleAmount: number
  taxAmount?: number
  date: string
  notes?: string
  paid?: boolean
  voidedAt?: string
  voidReason?: string
}

export type AuditEntity = 'batch' | 'bagging' | 'sale'

export interface AuditChange {
  field: string
  from: string
  to: string
}

export interface AuditEntry {
  id: number
  at: string
  entity: AuditEntity
  entityKey: string
  action: 'edit' | 'void'
  note: string
  changes: AuditChange[]
}

export interface Settings {
  id: number
  personalUseReserveTargetGrams: number
  defaultBagSizeOz: number
  theme?: Theme
}

export interface AppState {
  lots: GreenLot[]
  profiles: RoastProfile[]
  batches: RoastBatch[]
  bags: BaggedUnit[]
  sales: Sale[]
  audit: AuditEntry[]
  settings: Settings
}
