import type {
  AppState,
  AuditChange,
  AuditEntry,
  BaggedUnit,
  BatchStatus,
  Classification,
  GreenLot,
  ProfileSnapshot,
  RoastBatch,
  RoastProfile,
  Sale,
  Settings,
  Theme,
} from '../types.ts'
import {
  DEFAULT_BAG_SIZE_OZ,
  DEFAULT_RESERVE_GRAMS,
  SETTINGS_ID,
  calendarDateToIso,
  formatDate,
  formatMoney,
  formatGrams,
  formatPounds,
  formatWhen,
  roundGrams,
  roundMoney,
} from '../units.ts'

export type StockKind = 'green' | 'roasted' | 'bagged'

export type DomainError =
  | {
      type: 'shortfall'
      kind: StockKind
      available: number
      requested: number
      shortfall: number
      message: string
    }
  | { type: 'incomplete-profile'; missing: string[]; message: string }
  | { type: 'validation'; message: string }

export type DomainResult = { ok: true; state: AppState; info?: string } | { ok: false; state: AppState; error: DomainError }

export interface ProfileInput {
  name?: string
  beansName: string
  chargeTemp: number
  batchSize: number
  dtr: number
  weightLossPercent: number
  notes?: string
}

export interface ReceiveLotInput {
  name?: string
  origin: string
  process?: string
  grade?: string
  weightReceived: number
  dateReceived: string
  totalCost?: number
  costPerKg?: number
  notes?: string
  personalReserveGrams?: number
}

export interface RecordRoastInput {
  greenLotId: number
  greenWeightCharged: number
  roastedYield: number
  personalYield?: number
  classification: Classification
  roastDate: string
  profileId?: number
  profile?: ProfileInput
  saveAsNew?: boolean
  updateExisting?: boolean
}

export interface PackBagsInput {
  batchId: number
  bagCount: number
  weightPerBag: number
  classification?: Classification
  bagSizeOz?: number
  now?: number
  createdAt?: string
}

export interface RecordSaleInput {
  baggedUnitIds: number[]
  saleAmount: number
  taxAmount?: number
  date: string
  notes?: string
  paid?: boolean
}

export type EntityUpdate =
  | { entity: 'lot'; id: number; patch: Partial<GreenLot> }
  | { entity: 'profile'; id: number; patch: Partial<RoastProfile> }
  | { entity: 'batch'; id: number; patch: Partial<RoastBatch> }
  | { entity: 'bag'; id: number; patch: Partial<BaggedUnit> }
  | { entity: 'sale'; id: number; patch: Partial<Sale> }
  | { entity: 'settings'; patch: Partial<Settings> }

export interface TrailEvent {
  at: string
  kind: 'received' | 'roasted' | 'bagged' | 'sold'
  title: string
  detail: string
  batchId?: number
  batchLabel?: string
}

export type ActivityKind = 'received' | 'roasted' | 'bagged' | 'sold'

export interface ActivityEvent {
  id: string
  at: string
  kind: ActivityKind
  text: string
  detail: string
}

export interface DashboardSummary {
  greenRemaining: number
  roastedRemaining: number
  bagsReady: number
  salesTotal: number
  reserveTarget: number
  reserveLow: boolean
  recentProfiles: { batch: RoastBatch; profile: ProfileSnapshot | undefined }[]
  activity: ActivityEvent[]
  trail: { batch: RoastBatch; bagged: number; sold: number }[]
}

const STAGE_ORDER = ['received', 'roasted', 'bagged', 'sold']

export function defaultSettings(): Settings {
  return {
    id: SETTINGS_ID,
    personalUseReserveTargetGrams: DEFAULT_RESERVE_GRAMS,
    defaultBagSizeOz: DEFAULT_BAG_SIZE_OZ,
    theme: 'light',
  }
}

export function resolvedTheme(settings: Settings): Theme {
  return settings.theme === 'mocha' ? 'mocha' : 'light'
}

export function emptyState(settings: Settings = defaultSettings()): AppState {
  return { lots: [], profiles: [], batches: [], bags: [], sales: [], audit: [], settings }
}

export function greenRemaining(state: AppState): number {
  return roundGrams(state.lots.reduce((sum, lot) => sum + lot.weightRemaining, 0))
}

export function isVoided(record: { voidedAt?: string }): boolean {
  return record.voidedAt != null
}

export function voidMarker(record: { voidedAt?: string; voidReason?: string }): string {
  if (!record.voidedAt) return ''
  return ` Voided: ${record.voidReason ?? 'no reason given'}.`
}

export function roastedRemaining(state: AppState): number {
  return roundGrams(
    state.batches
      .filter((batch) => !isVoided(batch))
      .reduce((sum, batch) => sum + batch.roastedWeightRemaining, 0),
  )
}

export interface BatchPools {
  personalYield: number
  forSaleYield: number
  personalRemaining: number
  forSaleRemaining: number
}

export function batchPools(batch: RoastBatch): BatchPools {
  const personalYield = batch.personalYield ?? (batch.classification === 'internal' ? batch.roastedYield : 0)
  const forSaleYield = batch.forSaleYield ?? roundGrams(batch.roastedYield - personalYield)
  const personalRemaining = batch.personalRemaining ?? (batch.classification === 'internal' ? batch.roastedWeightRemaining : 0)
  const forSaleRemaining = batch.forSaleRemaining ?? roundGrams(batch.roastedWeightRemaining - personalRemaining)
  return {
    personalYield: roundGrams(personalYield),
    forSaleYield: roundGrams(forSaleYield),
    personalRemaining: roundGrams(personalRemaining),
    forSaleRemaining: roundGrams(forSaleRemaining),
  }
}

export function bagClassification(state: AppState, bag: BaggedUnit): Classification {
  if (bag.classification) return bag.classification
  return state.batches.find((batch) => batch.id === bag.batchId)?.classification ?? 'for-sale'
}

export function batchClassificationLabel(batch: RoastBatch): string {
  const pools = batchPools(batch)
  if (pools.personalYield > 0 && pools.forSaleYield > 0) {
    return `Personal ${formatGrams(pools.personalYield)} · for sale ${formatGrams(pools.forSaleYield)}`
  }
  return pools.personalYield > 0 ? 'Internal / personal use' : 'For sale'
}

export function bagsReadyCount(state: AppState): number {
  return state.bags.filter((bag) => bag.status === 'available' && !isVoided(bag) && bagClassification(state, bag) === 'for-sale').length
}

export function isReserveLow(state: AppState): boolean {
  return greenRemaining(state) < state.settings.personalUseReserveTargetGrams
}

export function lotReserveGrams(lot: GreenLot): number {
  return lot.personalReserveGrams ?? 0
}

export function personalCharged(state: AppState, lotId: number): number {
  return roundGrams(
    state.batches
      .filter((batch) => batch.greenLotId === lotId && !isVoided(batch))
      .reduce((sum, batch) => {
        if (batch.roastedYield <= 0) return sum
        const pools = batchPools(batch)
        const personalBagged = state.bags
          .filter((bag) => bag.batchId === batch.id && !isVoided(bag) && bagClassification(state, bag) === 'internal')
          .reduce((bagSum, bag) => bagSum + bag.weight, 0)
        return sum + batch.greenWeightCharged * (pools.personalRemaining + personalBagged) / batch.roastedYield
      }, 0),
  )
}

export function lotAllotment(state: AppState, lot: GreenLot) {
  const reserve = lotReserveGrams(lot)
  const charged = personalCharged(state, lot.id)
  const unmet = roundGrams(Math.max(0, reserve - charged))
  const fairGreen = roundGrams(Math.max(0, lot.weightRemaining - unmet))
  return { reserve, charged, unmet, fairGreen, covered: unmet === 0 }
}

export function roastedUse(state: AppState) {
  let personal = 0
  let forSale = 0
  let fairToSell = 0
  for (const batch of state.batches) {
    if (isVoided(batch)) continue
    const pools = batchPools(batch)
    personal += pools.personalRemaining
    forSale += pools.forSaleRemaining
    const lot = state.lots.find((item) => item.id === batch.greenLotId)
    if (lot && lotAllotment(state, lot).covered) fairToSell += pools.forSaleRemaining
  }
  return {
    personal: roundGrams(personal),
    forSale: roundGrams(forSale),
    fairToSell: roundGrams(fairToSell),
  }
}

export function missingProfileFields(profile: Partial<ProfileInput> | undefined): string[] {
  if (!profile) return ['beans name', 'charge temperature', 'batch size', 'DTR', 'weight loss percent']
  const missing: string[] = []
  if (!profile.beansName || profile.beansName.trim() === '') missing.push('beans name')
  if (!isFiniteNumber(profile.chargeTemp)) missing.push('charge temperature')
  if (!isFiniteNumber(profile.batchSize) || profile.batchSize <= 0) missing.push('batch size')
  if (!isFiniteNumber(profile.dtr)) missing.push('DTR')
  if (!isFiniteNumber(profile.weightLossPercent)) missing.push('weight loss percent')
  return missing
}

export function deriveStatus(batch: RoastBatch): BatchStatus {
  return batch.roastedWeightRemaining <= 0 ? 'bagged' : 'ready-to-bag'
}

export function withDerivedStatus(batch: RoastBatch): RoastBatch {
  return { ...batch, status: deriveStatus(batch) }
}

export function offeredForBagging(state: AppState): RoastBatch[] {
  return state.batches
    .map(withDerivedStatus)
    .filter((batch) => batch.roastedWeightRemaining > 0)
}

export function receiveLot(state: AppState, input: ReceiveLotInput): DomainResult {
  const origin = input.origin.trim()
  if (!origin) return fail(state, 'Origin is required.')
  if (!isFiniteNumber(input.weightReceived) || input.weightReceived <= 0) {
    return fail(state, 'Weight received must be greater than zero.')
  }
  if (!isValidDate(input.dateReceived)) return fail(state, 'Receipt date is required.')
  const weight = roundGrams(input.weightReceived)
  const cost = resolveCost(weight, input.totalCost, input.costPerKg)
  if (!cost) return fail(state, 'Cost is required and cannot be negative.')
  const reserve = input.personalReserveGrams == null
    ? Math.min(state.settings.personalUseReserveTargetGrams, weight)
    : input.personalReserveGrams
  const reserveProblem = reserveError(weight, reserve)
  if (reserveProblem) return fail(state, reserveProblem)
  const next = structuredClone(state)
  next.lots.push({
    id: nextId(state.lots),
    name: input.name?.trim() || origin,
    origin,
    process: blankToUndefined(input.process),
    grade: blankToUndefined(input.grade),
    weightReceived: weight,
    weightRemaining: weight,
    costPerKg: cost.costPerKg,
    totalCost: cost.totalCost,
    dateReceived: calendarDateToIso(input.dateReceived) ?? new Date(input.dateReceived).toISOString(),
    notes: blankToUndefined(input.notes),
    personalReserveGrams: roundGrams(reserve),
  })
  return { ok: true, state: next }
}

export function recordRoast(state: AppState, input: RecordRoastInput): DomainResult {
  const lot = state.lots.find((item) => item.id === input.greenLotId)
  if (!lot) return fail(state, 'Select a green lot.')
  if (!isFiniteNumber(input.greenWeightCharged) || input.greenWeightCharged <= 0) {
    return fail(state, 'Green weight charged must be greater than zero.')
  }
  if (!isFiniteNumber(input.roastedYield) || input.roastedYield < 0) {
    return fail(state, 'Roasted yield cannot be negative.')
  }
  if (input.personalYield != null && (!isFiniteNumber(input.personalYield) || input.personalYield < 0 || input.personalYield > input.roastedYield)) {
    return fail(state, 'Personal-use weight must be between zero and the roasted yield.')
  }
  if (input.classification !== 'internal' && input.classification !== 'for-sale') {
    return fail(state, 'Classify the roast as internal/personal use or for sale.')
  }
  if (!isValidDate(input.roastDate)) return fail(state, 'Roast date is required.')
  const resolved = resolveProfile(state, input)
  if (!resolved.ok) return { ok: false, state, error: resolved.error }
  const requested = roundGrams(input.greenWeightCharged)
  const available = roundGrams(lot.weightRemaining)
  if (requested > available) return { ok: false, state, error: shortfall('green', available, requested) }
  const next = structuredClone(state)
  const recordedAt = new Date().toISOString()
  let profileId = resolved.sourceId ?? 0
  if (resolved.updateSource && resolved.sourceId != null) {
    next.profiles = next.profiles.map((item) =>
      item.id === resolved.sourceId
        ? { ...item, ...resolved.facts, id: item.id, createdAt: item.createdAt ?? recordedAt, updatedAt: recordedAt }
        : item,
    )
  }
  if (resolved.createLibrary) {
    profileId = nextId(state.profiles)
    next.profiles.push({
      id: profileId,
      ...resolved.facts,
      createdAt: recordedAt,
      updatedAt: recordedAt,
    })
  }
  next.lots = next.lots.map((item) =>
    item.id === lot.id ? { ...item, weightRemaining: roundGrams(item.weightRemaining - requested) } : item,
  )
  const roastDate = new Date(input.roastDate).toISOString()
  const roastedYield = roundGrams(input.roastedYield)
  const personalYield = roundGrams(input.personalYield ?? (input.classification === 'internal' ? roastedYield : 0))
  const forSaleYield = roundGrams(roastedYield - personalYield)
  next.batches.push({
    id: nextId(state.batches),
    greenLotId: lot.id,
    profileId,
    profileSnapshot: resolved.facts,
    greenWeightCharged: requested,
    roastedYield,
    weightLossPercent: resolved.facts.weightLossPercent,
    classification: forSaleYield === 0 ? 'internal' : 'for-sale',
    roastDate,
    roastedWeightRemaining: roundGrams(personalYield + forSaleYield),
    personalYield,
    forSaleYield,
    personalRemaining: personalYield,
    forSaleRemaining: forSaleYield,
    status: 'ready-to-bag',
  })
  return { ok: true, state: next }
}

export function packBags(state: AppState, input: PackBagsInput): DomainResult {
  const now = input.now ?? Date.now()
  const batch = state.batches.find((item) => item.id === input.batchId)
  if (!batch) return fail(state, 'Select a roast batch.')
  if (batch.roastedWeightRemaining <= 0) {
    return fail(state, 'This batch is no longer offered for bagging.')
  }
  if (!Number.isInteger(input.bagCount) || input.bagCount < 1) return fail(state, 'Enter at least one bag.')
  if (!isFiniteNumber(input.weightPerBag) || input.weightPerBag <= 0) {
    return fail(state, 'Weight per bag must be greater than zero.')
  }
  const bagSizeOz = input.bagSizeOz ?? state.settings.defaultBagSizeOz
  if (!isFiniteNumber(bagSizeOz) || bagSizeOz <= 0) return fail(state, 'Bag size must be greater than zero.')
  const each = roundGrams(input.weightPerBag)
  const total = roundGrams(each * input.bagCount)
  const available = roundGrams(batch.roastedWeightRemaining)
  if (total > available) return { ok: false, state, error: shortfall('roasted', available, total) }
  const classification = input.classification ?? batch.classification
  if (classification !== 'internal' && classification !== 'for-sale') {
    return fail(state, 'Choose personal use or for sale for this pack.')
  }
  const pools = batchPools(batch)
  const oppositeAvailable = classification === 'internal' ? pools.forSaleRemaining : pools.personalRemaining
  const fromOpposite = Math.min(total, oppositeAvailable)
  const fromChosen = roundGrams(total - fromOpposite)
  const personalRemaining = roundGrams(
    pools.personalRemaining - (classification === 'internal' ? fromChosen : fromOpposite),
  )
  const forSaleRemaining = roundGrams(
    pools.forSaleRemaining - (classification === 'internal' ? fromOpposite : fromChosen),
  )
  const createdAt = input.createdAt ?? new Date(now).toISOString()
  const next = structuredClone(state)
  let id = nextId(state.bags)
  const bags: BaggedUnit[] = []
  for (let i = 0; i < input.bagCount; i += 1) {
    bags.push({
      id,
      batchId: batch.id,
      bagSizeOz,
      weight: each,
      classification,
      status: 'available',
      createdAt,
    })
    id += 1
  }
  next.bags.push(...bags)
  next.batches = next.batches.map((item) => {
    if (item.id !== batch.id) return item
    const remaining = roundGrams(personalRemaining + forSaleRemaining)
    const updated = { ...item, personalRemaining, forSaleRemaining, roastedWeightRemaining: remaining }
    return { ...updated, status: deriveStatus(updated) }
  })
  return {
    ok: true,
    state: next,
    info: `Packed ${input.bagCount} bag(s), ${total} g.`,
  }
}

export function recordSale(state: AppState, input: RecordSaleInput): DomainResult {
  if (!input.baggedUnitIds.length) return fail(state, 'Select at least one bag.')
  const uniqueIds = [...new Set(input.baggedUnitIds)]
  const selected = uniqueIds.map((id) => state.bags.find((bag) => bag.id === id))
  if (selected.some((bag) => !bag)) return fail(state, 'One or more bags could not be found.')
  if (selected.some((bag) => bag && bagClassification(state, bag) !== 'for-sale')) {
    return fail(state, 'Personal-use bags cannot be sold.')
  }
  const available = selected.filter((bag) => bag?.status === 'available')
  if (available.length !== uniqueIds.length) {
    return { ok: false, state, error: shortfall('bagged', available.length, uniqueIds.length) }
  }
  if (!isFiniteNumber(input.saleAmount) || input.saleAmount < 0) return fail(state, 'Sale amount cannot be negative.')
  if (input.taxAmount != null && (!isFiniteNumber(input.taxAmount) || input.taxAmount < 0)) {
    return fail(state, 'Tax amount, if recorded, cannot be negative. Tax is not calculated.')
  }
  if (!isValidDate(input.date)) return fail(state, 'Sale date is required.')
  const next = structuredClone(state)
  const sold = new Set(uniqueIds)
  next.bags = next.bags.map((bag) => (sold.has(bag.id) ? { ...bag, status: 'sold' } : bag))
  const sale: Sale = {
    id: nextId(state.sales),
    baggedUnitIds: uniqueIds,
    saleAmount: roundMoney(input.saleAmount),
    date: new Date(input.date).toISOString(),
    notes: blankToUndefined(input.notes),
    paid: input.paid !== false,
  }
  if (input.taxAmount != null) sale.taxAmount = roundMoney(input.taxAmount)
  next.sales.push(sale)
  return { ok: true, state: next }
}

export function updateSettings(
  state: AppState,
  patch: Partial<Pick<Settings, 'personalUseReserveTargetGrams' | 'defaultBagSizeOz' | 'theme'>>,
): DomainResult {
  if (patch.personalUseReserveTargetGrams != null && (!isFiniteNumber(patch.personalUseReserveTargetGrams) || patch.personalUseReserveTargetGrams < 0)) {
    return fail(state, 'Personal-use reserve target cannot be negative.')
  }
  if (patch.defaultBagSizeOz != null && (!isFiniteNumber(patch.defaultBagSizeOz) || patch.defaultBagSizeOz <= 0)) {
    return fail(state, 'Default bag size must be greater than zero.')
  }
  if (patch.theme != null && patch.theme !== 'light' && patch.theme !== 'mocha') {
    return fail(state, 'Theme must be light or mocha.')
  }
  const next = structuredClone(state)
  next.settings = { ...next.settings, ...patch, id: SETTINGS_ID }
  return { ok: true, state: next }
}

export function applyEntityUpdate(state: AppState, update: EntityUpdate): DomainResult {
  const next = structuredClone(state)
  if (update.entity === 'settings') return updateSettings(state, update.patch)
  if (update.entity === 'lot') {
    const current = next.lots.find((item) => item.id === update.id)
    if (!current) return fail(state, 'Lot not found.')
    const merged = { ...current, ...update.patch, id: current.id }
    const negative = negativeStock('green', merged.weightRemaining) ?? negativeStock('green', merged.weightReceived)
    if (negative) return { ok: false, state, error: negative }
    if ('personalReserveGrams' in update.patch) {
      const reserveProblem = reserveError(merged.weightReceived, merged.personalReserveGrams ?? 0)
      if (reserveProblem) return fail(state, reserveProblem)
      merged.personalReserveGrams = roundGrams(merged.personalReserveGrams ?? 0)
    }
    next.lots = next.lots.map((item) => (item.id === current.id ? merged : item))
    return { ok: true, state: next }
  }
  if (update.entity === 'batch') {
    const current = next.batches.find((item) => item.id === update.id)
    if (!current) return fail(state, 'Batch not found.')
    const merged = { ...current, ...update.patch, id: current.id }
    const negative = negativeStock('roasted', merged.roastedWeightRemaining) ?? negativeStock('roasted', merged.roastedYield) ?? negativeStock('green', merged.greenWeightCharged)
    if (negative) return { ok: false, state, error: negative }
    next.batches = next.batches.map((item) => (item.id === current.id ? merged : item))
    return { ok: true, state: next }
  }
  if (update.entity === 'bag') {
    const current = next.bags.find((item) => item.id === update.id)
    if (!current) return fail(state, 'Bag not found.')
    const merged = { ...current, ...update.patch, id: current.id }
    const negative = negativeStock('bagged', merged.weight)
    if (negative) return { ok: false, state, error: negative }
    next.bags = next.bags.map((item) => (item.id === current.id ? merged : item))
    return { ok: true, state: next }
  }
  if (update.entity === 'profile') {
    const current = next.profiles.find((item) => item.id === update.id)
    if (!current) return fail(state, 'Profile not found.')
    const merged = { ...current, ...update.patch, id: current.id, updatedAt: new Date().toISOString() }
    if ('name' in update.patch) merged.name = blankToUndefined(update.patch.name)
    if ('notes' in update.patch) merged.notes = blankToUndefined(update.patch.notes)
    const missing = missingProfileFields(merged)
    if (missing.length) return { ok: false, state, error: incompleteProfile(missing) }
    next.profiles = next.profiles.map((item) => (item.id === current.id ? merged : item))
    return { ok: true, state: next }
  }
  const current = next.sales.find((item) => item.id === update.id)
  if (!current) return fail(state, 'Sale not found.')
  const merged = { ...current, ...update.patch, id: current.id }
  if (merged.saleAmount < 0) return fail(state, 'Sale amount cannot be negative.')
  next.sales = next.sales.map((item) => (item.id === current.id ? merged : item))
  return { ok: true, state: next }
}

export function removeLot(state: AppState, id: number): DomainResult {
  if (state.batches.some((batch) => batch.greenLotId === id)) {
    return fail(state, 'Cannot remove a lot that has roast batches.')
  }
  if (!state.lots.some((lot) => lot.id === id)) return fail(state, 'Lot not found.')
  const next = structuredClone(state)
  next.lots = next.lots.filter((lot) => lot.id !== id)
  return { ok: true, state: next }
}

export function removeProfile(state: AppState, id: number): DomainResult {
  if (!state.profiles.some((profile) => profile.id === id)) return fail(state, 'Profile not found.')
  const next = structuredClone(state)
  next.profiles = next.profiles.filter((profile) => profile.id !== id)
  return { ok: true, state: next }
}

export function addProfile(state: AppState, input: ProfileInput): DomainResult {
  const missing = missingProfileFields(input)
  if (missing.length) return { ok: false, state, error: incompleteProfile(missing) }
  const next = structuredClone(state)
  const recordedAt = new Date().toISOString()
  next.profiles.push({
    id: nextId(state.profiles),
    name: blankToUndefined(input.name),
    beansName: input.beansName.trim(),
    chargeTemp: input.chargeTemp,
    batchSize: input.batchSize,
    dtr: input.dtr,
    weightLossPercent: input.weightLossPercent,
    notes: blankToUndefined(input.notes),
    createdAt: recordedAt,
    updatedAt: recordedAt,
  })
  return { ok: true, state: next }
}

export function snapshotOf(profile: ProfileSnapshot): ProfileSnapshot {
  return {
    name: blankToUndefined(profile.name),
    beansName: profile.beansName,
    chargeTemp: profile.chargeTemp,
    batchSize: profile.batchSize,
    dtr: profile.dtr,
    weightLossPercent: profile.weightLossPercent,
    notes: blankToUndefined(profile.notes),
  }
}

export function ensureProfileSnapshots(state: AppState): AppState {
  let changed = false
  const batches = state.batches.map((batch) => {
    if (batch.profileSnapshot) return batch
    const live = state.profiles.find((item) => item.id === batch.profileId)
    if (!live) return batch
    changed = true
    return { ...batch, profileSnapshot: snapshotOf(live) }
  })
  return changed ? { ...state, batches } : state
}

export function profileFacts(state: AppState, batch: RoastBatch): ProfileSnapshot | undefined {
  if (batch.profileSnapshot) return batch.profileSnapshot
  const live = state.profiles.find((item) => item.id === batch.profileId)
  if (!live) return undefined
  return {
    name: live.name,
    beansName: live.beansName,
    chargeTemp: live.chargeTemp,
    batchSize: live.batchSize,
    dtr: live.dtr,
    weightLossPercent: live.weightLossPercent,
    notes: live.notes,
  }
}

export function profileLabel(facts: { name?: string; beansName?: string } | undefined): string {
  return facts?.name?.trim() || facts?.beansName?.trim() || 'unknown'
}

export type RecordTarget =
  | { entity: 'batch'; id: number }
  | { entity: 'bagging'; batchId: number; createdAt: string }
  | { entity: 'sale'; id: number }

export interface RecordChanges {
  greenWeightCharged?: number
  roastedYield?: number
  personalRemaining?: number
  classification?: Classification
  roastDate?: string
  weightPerBag?: number
  bagSizeOz?: number
  saleAmount?: number
  taxAmount?: number
  saleDate?: string
  paid?: boolean
  notes?: string
}

export function batchKey(id: number): string {
  return `batch:${id}`
}

export function saleKey(id: number): string {
  return `sale:${id}`
}

export function baggingKey(batchId: number, createdAt: string): string {
  return `bagging:${batchId}:${createdAt}`
}

export function liveBags(state: AppState, batchId: number): BaggedUnit[] {
  return state.bags.filter((bag) => bag.batchId === batchId && !isVoided(bag))
}

export function livePackedWeight(state: AppState, batchId: number): number {
  return roundGrams(liveBags(state, batchId).reduce((sum, bag) => sum + bag.weight, 0))
}

export function editRecord(state: AppState, target: RecordTarget, changes: RecordChanges, note: string): DomainResult {
  const trimmed = note?.trim() ?? ''
  if (!trimmed) return fail(state, 'A note is required to explain the change.')
  if (target.entity === 'batch') return editBatch(state, target.id, changes, trimmed)
  if (target.entity === 'bagging') return editBagging(state, target.batchId, target.createdAt, changes, trimmed)
  return editSale(state, target.id, changes, trimmed)
}

export function voidRecord(state: AppState, target: RecordTarget, note: string): DomainResult {
  const trimmed = note?.trim() ?? ''
  if (!trimmed) return fail(state, 'A note is required to explain the void.')
  if (target.entity === 'batch') return voidBatch(state, target.id, trimmed)
  if (target.entity === 'bagging') return voidBagging(state, target.batchId, target.createdAt, trimmed)
  return voidSale(state, target.id, trimmed)
}

function appendAudit(
  state: AppState,
  next: AppState,
  entity: AuditEntry['entity'],
  entityKey: string,
  action: AuditEntry['action'],
  note: string,
  changes: AuditChange[],
  at: string,
) {
  next.audit.push({ id: nextId(state.audit), at, entity, entityKey, action, note, changes })
}

function editBatch(state: AppState, id: number, changes: RecordChanges, note: string): DomainResult {
  const batch = state.batches.find((item) => item.id === id)
  if (!batch) return fail(state, 'Roast not found.')
  if (isVoided(batch)) return fail(state, 'This roast is void. Record a new roast instead.')
  const next = structuredClone(state)
  const target = next.batches.find((item) => item.id === id)
  if (!target) return fail(state, 'Roast not found.')
  const audit: AuditChange[] = []

  if (changes.greenWeightCharged != null) {
    const value = roundGrams(changes.greenWeightCharged)
    if (!isFiniteNumber(value) || value <= 0) return fail(state, 'Green weight charged must be greater than zero.')
    if (value !== target.greenWeightCharged) {
      const lot = next.lots.find((item) => item.id === target.greenLotId)
      if (!lot) return fail(state, 'Green lot not found.')
      const remaining = roundGrams(lot.weightRemaining - (value - target.greenWeightCharged))
      if (remaining < 0) return fail(state, 'That change would make green stock negative.')
      lot.weightRemaining = remaining
      audit.push({ field: 'Green weight charged', from: `${target.greenWeightCharged} g`, to: `${value} g` })
      target.greenWeightCharged = value
    }
  }

  if (changes.roastedYield != null) {
    const value = roundGrams(changes.roastedYield)
    if (!isFiniteNumber(value) || value < 0) return fail(state, 'Roasted yield cannot be negative.')
    if (value !== target.roastedYield) {
      const packed = livePackedWeight(next, id)
      if (value < packed) {
        return fail(state, `Roasted yield cannot be less than the ${packed} g already packed from this roast.`)
      }
      const current = batchPools(target)
      const delta = roundGrams(value - target.roastedYield)
      let personalYield = current.personalYield
      let forSaleYield = current.forSaleYield
      let personalRemaining = current.personalRemaining
      let forSaleRemaining = current.forSaleRemaining
      if (delta > 0) {
        forSaleYield = roundGrams(forSaleYield + delta)
        forSaleRemaining = roundGrams(forSaleRemaining + delta)
      } else if (delta < 0) {
        let yieldReduction = -delta
        const saleYieldReduction = Math.min(yieldReduction, forSaleYield)
        forSaleYield = roundGrams(forSaleYield - saleYieldReduction)
        yieldReduction = roundGrams(yieldReduction - saleYieldReduction)
        personalYield = roundGrams(personalYield - yieldReduction)
        let remainingReduction = -delta
        const saleRemainingReduction = Math.min(remainingReduction, forSaleRemaining)
        forSaleRemaining = roundGrams(forSaleRemaining - saleRemainingReduction)
        remainingReduction = roundGrams(remainingReduction - saleRemainingReduction)
        personalRemaining = roundGrams(personalRemaining - remainingReduction)
      }
      if (personalYield < 0 || personalRemaining < 0 || forSaleYield < 0 || forSaleRemaining < 0) {
        return fail(state, 'That change would make a purpose pool negative.')
      }
      const remaining = roundGrams(personalRemaining + forSaleRemaining)
      audit.push({ field: 'Roasted yield', from: `${target.roastedYield} g`, to: `${value} g` })
      target.roastedYield = value
      target.roastedWeightRemaining = remaining
      target.personalYield = personalYield
      target.forSaleYield = forSaleYield
      target.personalRemaining = personalRemaining
      target.forSaleRemaining = forSaleRemaining
    }
  }

  const currentPools = batchPools(target)
  const remainingWeight = roundGrams(target.roastedWeightRemaining)
  if (changes.personalRemaining != null) {
    const personal = roundGrams(changes.personalRemaining)
    if (!isFiniteNumber(changes.personalRemaining) || personal < 0 || personal > remainingWeight) {
      return fail(state, `Personal-use weight must be between 0 and ${remainingWeight} g of unpacked roast.`)
    }
    if (personal !== currentPools.personalRemaining) {
      target.personalRemaining = personal
      target.forSaleRemaining = roundGrams(remainingWeight - personal)
      audit.push({
        field: 'Unpacked personal weight',
        from: `${currentPools.personalRemaining} g`,
        to: `${personal} g`,
      })
    }
  } else if (changes.classification != null && changes.classification !== target.classification) {
    if (changes.classification !== 'internal' && changes.classification !== 'for-sale') {
      return fail(state, 'Classify the roast as internal/personal use or for sale.')
    }
    const personal = changes.classification === 'internal' ? remainingWeight : 0
    target.personalRemaining = personal
    target.forSaleRemaining = roundGrams(remainingWeight - personal)
    audit.push({ field: 'Unpacked classification', from: target.classification, to: changes.classification })
    target.classification = changes.classification
  }

  if (changes.roastDate != null) {
    if (!isValidDate(changes.roastDate)) return fail(state, 'Roast date is required.')
    const value = new Date(changes.roastDate).toISOString()
    if (value !== target.roastDate) {
      audit.push({ field: 'Roast date', from: formatWhen(target.roastDate), to: formatWhen(value) })
      target.roastDate = value
    }
  }

  if (!audit.length) return fail(state, 'Nothing to change.')
  const at = new Date().toISOString()
  appendAudit(state, next, 'batch', batchKey(id), 'edit', note, audit, at)
  return { ok: true, state: next }
}

function editBagging(state: AppState, batchId: number, createdAt: string, changes: RecordChanges, note: string): DomainResult {
  const group = state.bags.filter((bag) => bag.batchId === batchId && bag.createdAt === createdAt)
  if (!group.length) return fail(state, 'Bagging not found.')
  const live = group.filter((bag) => !isVoided(bag))
  if (!live.length) return fail(state, 'This bagging is void. Pack again instead.')
  const next = structuredClone(state)
  const batch = next.batches.find((item) => item.id === batchId)
  if (!batch) return fail(state, 'Roast not found.')
  if (isVoided(batch)) return fail(state, 'This roast is void.')
  const audit: AuditChange[] = []

  if (changes.weightPerBag != null) {
    const value = roundGrams(changes.weightPerBag)
    if (!isFiniteNumber(value) || value <= 0) return fail(state, 'Weight per bag must be greater than zero.')
    const oldWeight = live[0].weight
    if (value !== oldWeight) {
      const oldTotal = roundGrams(oldWeight * live.length)
      const newTotal = roundGrams(value * live.length)
      const otherPacked = roundGrams(livePackedWeight(next, batchId) - oldTotal)
      if (newTotal + otherPacked > batch.roastedYield) {
        return fail(state, `That change would exceed the ${batch.roastedYield} g roasted from this batch.`)
      }
      const remaining = roundGrams(batch.roastedWeightRemaining + oldTotal - newTotal)
      if (remaining < 0) return fail(state, 'That change would make roasted stock negative.')
      batch.roastedWeightRemaining = remaining
      const pools = batchPools(batch)
      const classification = bagClassification(next, live[0])
      if (classification === 'internal') {
        const poolRemaining = roundGrams(pools.personalRemaining + oldTotal - newTotal)
        if (poolRemaining < 0) return fail(state, 'That change would make personal roasted stock negative.')
        batch.personalRemaining = poolRemaining
      } else {
        const poolRemaining = roundGrams(pools.forSaleRemaining + oldTotal - newTotal)
        if (poolRemaining < 0) return fail(state, 'That change would make for-sale roasted stock negative.')
        batch.forSaleRemaining = poolRemaining
      }
      for (const bag of next.bags) {
        if (bag.batchId === batchId && bag.createdAt === createdAt && !isVoided(bag)) bag.weight = value
      }
      audit.push({ field: 'Weight per bag', from: `${oldWeight} g`, to: `${value} g` })
    }
  }

  if (changes.bagSizeOz != null) {
    const value = changes.bagSizeOz
    if (!isFiniteNumber(value) || value <= 0) return fail(state, 'Bag size must be greater than zero.')
    if (value !== live[0].bagSizeOz) {
      for (const bag of next.bags) {
        if (bag.batchId === batchId && bag.createdAt === createdAt && !isVoided(bag)) bag.bagSizeOz = value
      }
      audit.push({ field: 'Bag size', from: `${live[0].bagSizeOz} oz`, to: `${value} oz` })
    }
  }

  if (!audit.length) return fail(state, 'Nothing to change.')
  const at = new Date().toISOString()
  appendAudit(state, next, 'bagging', baggingKey(batchId, createdAt), 'edit', note, audit, at)
  return { ok: true, state: next }
}

function editSale(state: AppState, id: number, changes: RecordChanges, note: string): DomainResult {
  const sale = state.sales.find((item) => item.id === id)
  if (!sale) return fail(state, 'Sale not found.')
  if (isVoided(sale)) return fail(state, 'This sale is void. Record a new sale instead.')
  const next = structuredClone(state)
  const target = next.sales.find((item) => item.id === id)
  if (!target) return fail(state, 'Sale not found.')
  const audit: AuditChange[] = []

  if (changes.saleAmount != null) {
    const value = roundMoney(changes.saleAmount)
    if (!isFiniteNumber(value) || value < 0) return fail(state, 'Sale amount cannot be negative.')
    if (value !== target.saleAmount) {
      audit.push({ field: 'Sale amount', from: formatMoney(target.saleAmount), to: formatMoney(value) })
      target.saleAmount = value
    }
  }

  if (changes.taxAmount != null) {
    const value = roundMoney(changes.taxAmount)
    if (!isFiniteNumber(value) || value < 0) return fail(state, 'Tax amount cannot be negative.')
    if (value !== target.taxAmount) {
      audit.push({
        field: 'Tax amount',
        from: target.taxAmount == null ? 'none' : formatMoney(target.taxAmount),
        to: formatMoney(value),
      })
      target.taxAmount = value
    }
  }

  if (changes.saleDate != null) {
    if (!isValidDate(changes.saleDate)) return fail(state, 'Sale date is required.')
    const value = new Date(changes.saleDate).toISOString()
    if (value !== target.date) {
      audit.push({ field: 'Sale date', from: formatDate(target.date), to: formatDate(value) })
      target.date = value
    }
  }

  if (changes.paid != null && changes.paid !== (target.paid !== false)) {
    audit.push({ field: 'Paid', from: target.paid === false ? 'unpaid' : 'paid', to: changes.paid ? 'paid' : 'unpaid' })
    target.paid = changes.paid
  }

  if (changes.notes != null) {
    const value = blankToUndefined(changes.notes)
    if (value !== target.notes) {
      audit.push({ field: 'Notes', from: target.notes ?? 'none', to: value ?? 'none' })
      target.notes = value
    }
  }

  if (!audit.length) return fail(state, 'Nothing to change.')
  const at = new Date().toISOString()
  appendAudit(state, next, 'sale', saleKey(id), 'edit', note, audit, at)
  return { ok: true, state: next }
}

function voidBatch(state: AppState, id: number, note: string): DomainResult {
  const batch = state.batches.find((item) => item.id === id)
  if (!batch) return fail(state, 'Roast not found.')
  if (isVoided(batch)) return fail(state, 'This roast is already void.')
  const liveBag = state.bags.find((bag) => bag.batchId === id && !isVoided(bag))
  if (liveBag) return fail(state, `Void the bagging from ${formatWhen(liveBag.createdAt)} first.`)
  const next = structuredClone(state)
  const target = next.batches.find((item) => item.id === id)
  if (!target) return fail(state, 'Roast not found.')
  const lot = next.lots.find((item) => item.id === target.greenLotId)
  if (lot) lot.weightRemaining = roundGrams(lot.weightRemaining + target.greenWeightCharged)
  const at = new Date().toISOString()
  target.voidedAt = at
  target.voidReason = note
  appendAudit(state, next, 'batch', batchKey(id), 'void', note, [{ field: 'Status', from: 'live', to: 'void' }], at)
  return { ok: true, state: next }
}

function voidBagging(state: AppState, batchId: number, createdAt: string, note: string): DomainResult {
  const group = state.bags.filter((bag) => bag.batchId === batchId && bag.createdAt === createdAt)
  if (!group.length) return fail(state, 'Bagging not found.')
  const live = group.filter((bag) => !isVoided(bag))
  if (!live.length) return fail(state, 'This bagging is already void.')
  const liveIds = new Set(live.map((bag) => bag.id))
  const soldSale = state.sales.find(
    (sale) => !isVoided(sale) && sale.baggedUnitIds.some((bagId) => liveIds.has(bagId)),
  )
  if (soldSale) return fail(state, `Void the sale from ${formatDate(soldSale.date)} first.`)
  const next = structuredClone(state)
  const at = new Date().toISOString()
  let personalTotal = 0
  let forSaleTotal = 0
  for (const bag of next.bags) {
    if (bag.batchId === batchId && bag.createdAt === createdAt && !isVoided(bag)) {
      bag.voidedAt = at
      bag.voidReason = note
      if (bagClassification(next, bag) === 'internal') personalTotal += bag.weight
      else forSaleTotal += bag.weight
    }
  }
  const batch = next.batches.find((item) => item.id === batchId)
  if (batch) {
    const pools = batchPools(batch)
    batch.personalRemaining = roundGrams(pools.personalRemaining + personalTotal)
    batch.forSaleRemaining = roundGrams(pools.forSaleRemaining + forSaleTotal)
    batch.roastedWeightRemaining = roundGrams(batch.personalRemaining + batch.forSaleRemaining)
  }
  appendAudit(state, next, 'bagging', baggingKey(batchId, createdAt), 'void', note, [{ field: 'Status', from: 'live', to: 'void' }], at)
  return { ok: true, state: next }
}

function voidSale(state: AppState, id: number, note: string): DomainResult {
  const sale = state.sales.find((item) => item.id === id)
  if (!sale) return fail(state, 'Sale not found.')
  if (isVoided(sale)) return fail(state, 'This sale is already void.')
  const next = structuredClone(state)
  const target = next.sales.find((item) => item.id === id)
  if (!target) return fail(state, 'Sale not found.')
  const bagIds = new Set(target.baggedUnitIds)
  for (const bag of next.bags) {
    if (bagIds.has(bag.id) && !isVoided(bag)) bag.status = 'available'
  }
  const at = new Date().toISOString()
  target.voidedAt = at
  target.voidReason = note
  appendAudit(state, next, 'sale', saleKey(id), 'void', note, [{ field: 'Status', from: 'live', to: 'void' }], at)
  return { ok: true, state: next }
}

export function saleSources(state: AppState, sale: Sale) {
  return sale.baggedUnitIds.map((id) => {
    const bag = state.bags.find((item) => item.id === id)
    const batch = bag ? state.batches.find((item) => item.id === bag.batchId) : undefined
    const lot = batch ? state.lots.find((item) => item.id === batch.greenLotId) : undefined
    const profile = batch ? profileFacts(state, batch) : undefined
    return { bag, batch, lot, profile }
  })
}

export function costOfBag(state: AppState, bag: BaggedUnit): number {
  const batch = state.batches.find((item) => item.id === bag.batchId)
  if (!batch || batch.roastedYield <= 0) return 0
  const lot = state.lots.find((item) => item.id === batch.greenLotId)
  if (!lot || lot.weightReceived <= 0) return 0
  const greenEquiv = bag.weight * (batch.greenWeightCharged / batch.roastedYield)
  return greenEquiv * (lot.totalCost / lot.weightReceived)
}

export function pnl(state: AppState) {
  const revenue = roundMoney(
    state.sales.filter((sale) => !isVoided(sale)).reduce((sum, sale) => sum + sale.saleAmount, 0),
  )
  const cogs = roundMoney(
    state.bags
      .filter((bag) => bag.status === 'sold' && !isVoided(bag))
      .reduce((sum, bag) => sum + costOfBag(state, bag), 0),
  )
  return { revenue, cogs, grossProfit: roundMoney(revenue - cogs) }
}

export function unpaidBalance(state: AppState) {
  const unpaid = state.sales.filter((sale) => sale.paid === false)
  return {
    count: unpaid.length,
    total: roundMoney(unpaid.reduce((sum, sale) => sum + sale.saleAmount, 0)),
  }
}

export function batchTrail(state: AppState, batchId: number): TrailEvent[] {
  const batch = state.batches.find((item) => item.id === batchId)
  if (!batch) return []
  const lot = state.lots.find((item) => item.id === batch.greenLotId)
  const profile = profileFacts(state, batch)
  const events: TrailEvent[] = []
  if (lot) {
    events.push({
      at: lot.dateReceived,
      kind: 'received',
      title: 'Green receipt',
      detail: `Received ${formatPounds(lot.weightReceived)} of ${lot.origin}. Cost ${lot.totalCost}.`,
    })
  }
  events.push({
    at: batch.roastDate,
    kind: 'roasted',
    title: 'Roast',
      detail: `Charged ${roundGrams(batch.greenWeightCharged)} g, yield ${roundGrams(batch.roastedYield)} g. ${batchClassificationLabel(batch)}. Profile: ${profileLabel(profile)}, charge ${profile?.chargeTemp ?? 'n/a'}, batch size ${profile?.batchSize ?? 'n/a'} g, DTR ${profile?.dtr ?? 'n/a'}%, weight loss ${batch.weightLossPercent}%.${voidMarker(batch)}`,
  })
  const bags = state.bags.filter((bag) => bag.batchId === batch.id)
  const grouped = new Map<string, BaggedUnit[]>()
  for (const bag of bags) {
    const group = grouped.get(bag.createdAt) ?? []
    group.push(bag)
    grouped.set(bag.createdAt, group)
  }
  for (const [at, group] of grouped) {
    const total = roundGrams(group.reduce((sum, bag) => sum + bag.weight, 0))
    events.push({
      at,
      kind: 'bagged',
      title: 'Bagging',
      detail: `Packed ${group.length} bag(s), ${total} g for ${bagClassification(state, group[0]) === 'internal' ? 'personal use' : 'sale'}.${voidMarker(group[0])}`,
    })
  }
  const bagIds = new Set(bags.map((bag) => bag.id))
  for (const sale of state.sales) {
    const related = sale.baggedUnitIds.filter((id) => bagIds.has(id))
    if (!related.length) continue
    const tax = sale.taxAmount != null ? ` Tax recorded ${sale.taxAmount}, not calculated.` : ''
    events.push({
      at: sale.date,
      kind: 'sold',
      title: 'Sale',
      detail: `Sold ${related.length} bag(s) for ${sale.saleAmount}.${tax}${voidMarker(sale)}`,
    })
  }
  return events
    .map((event) => (event.kind === 'received' ? event : { ...event, batchId: batch.id, batchLabel: `Batch #${batch.id}` }))
    .sort((a, b) => STAGE_ORDER.indexOf(a.kind) - STAGE_ORDER.indexOf(b.kind) || a.at.localeCompare(b.at))
}

export function lotTrail(state: AppState, lotId: number): TrailEvent[] {
  const lot = state.lots.find((item) => item.id === lotId)
  if (!lot) return []
  const events: TrailEvent[] = [
    {
      at: lot.dateReceived,
      kind: 'received',
      title: 'Green receipt',
      detail: `Received ${formatPounds(lot.weightReceived)} of ${lot.origin}. Remaining ${formatGrams(lot.weightRemaining)}. Cost ${lot.totalCost}.`,
    },
  ]
  const batches = state.batches
    .filter((batch) => batch.greenLotId === lotId)
    .sort((a, b) => a.roastDate.localeCompare(b.roastDate) || a.id - b.id)
  for (const batch of batches) {
    events.push(...batchTrail(state, batch.id).filter((event) => event.kind !== 'received'))
  }
  return events
}

export function recentActivity(state: AppState, limit = 8): ActivityEvent[] {
  const events: ActivityEvent[] = []
  for (const lot of state.lots) {
    events.push({
      id: `lot-${lot.id}`,
      at: lot.dateReceived,
      kind: 'received',
      text: `Received ${formatPounds(lot.weightReceived)} of ${lot.origin}`,
      detail: lot.name,
    })
  }
  for (const batch of state.batches) {
    const profile = profileFacts(state, batch)
    const lot = state.lots.find((item) => item.id === batch.greenLotId)
    const label = profileLabel(profile)
    events.push({
      id: `batch-${batch.id}`,
      at: batch.roastDate,
      kind: 'roasted',
      text: `Roasted ${formatGrams(batch.roastedYield)} of ${label === 'unknown' ? (lot?.origin ?? 'coffee') : label}${isVoided(batch) ? ' · voided' : ''}`,
      detail: `Batch #${batch.id} · ${batchClassificationLabel(batch)} · ${formatGrams(batch.greenWeightCharged)} charged`,
    })
  }
  const bagGroups = new Map<string, BaggedUnit[]>()
  for (const bag of state.bags) {
    const key = `${bag.batchId}-${bag.createdAt}`
    const group = bagGroups.get(key) ?? []
    group.push(bag)
    bagGroups.set(key, group)
  }
  for (const [key, group] of bagGroups) {
    const total = roundGrams(group.reduce((sum, bag) => sum + bag.weight, 0))
    const batch = state.batches.find((item) => item.id === group[0].batchId)
    const lot = batch ? state.lots.find((item) => item.id === batch.greenLotId) : undefined
    events.push({
      id: `bags-${key}`,
      at: group[0].createdAt,
      kind: 'bagged',
      text: `Packaged ${group.length} bag${group.length === 1 ? '' : 's'} (${group[0].bagSizeOz} oz)${isVoided(group[0]) ? ' · voided' : ''}`,
      detail: `${lot?.origin ?? `Batch #${group[0].batchId}`} · ${formatGrams(total)} · ${bagClassification(state, group[0]) === 'internal' ? 'personal use' : 'for sale'}`,
    })
  }
  for (const sale of state.sales) {
    const origins = [
      ...new Set(
        sale.baggedUnitIds.flatMap((id) => {
          const bag = state.bags.find((item) => item.id === id)
          const batch = bag ? state.batches.find((item) => item.id === bag.batchId) : undefined
          const lot = batch ? state.lots.find((item) => item.id === batch.greenLotId) : undefined
          return lot ? [lot.origin] : []
        }),
      ),
    ]
    events.push({
      id: `sale-${sale.id}`,
      at: sale.date,
      kind: 'sold',
      text: `${sale.paid === false ? 'Sale recorded · unpaid' : 'Sale recorded'}${isVoided(sale) ? ' · voided' : ''}`,
      detail: `${sale.baggedUnitIds.length} bag(s)${origins.length ? ` · ${origins.join(', ')}` : ''} · ${formatMoney(sale.saleAmount)}`,
    })
  }
  return events.sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit)
}

export function dashboardSummary(state: AppState): DashboardSummary {
  const recent = [...state.batches]
    .sort((a, b) => b.roastDate.localeCompare(a.roastDate))
    .slice(0, 5)
    .map((batch) => ({ batch: withDerivedStatus(batch), profile: profileFacts(state, batch) }))
  const trail = state.batches
    .map(withDerivedStatus)
    .filter((batch) => {
      const bags = state.bags.filter((bag) => bag.batchId === batch.id)
      return bags.length > 0
    })
    .map((batch) => {
      const bags = state.bags.filter((bag) => bag.batchId === batch.id)
      return {
        batch,
        bagged: bags.length,
        sold: bags.filter((bag) => bag.status === 'sold').length,
      }
    })
  return {
    greenRemaining: greenRemaining(state),
    roastedRemaining: roastedRemaining(state),
    bagsReady: bagsReadyCount(state),
    salesTotal: roundMoney(
      state.sales.filter((sale) => !isVoided(sale)).reduce((sum, sale) => sum + sale.saleAmount, 0),
    ),
    reserveTarget: state.settings.personalUseReserveTargetGrams,
    reserveLow: isReserveLow(state),
    recentProfiles: recent,
    activity: recentActivity(state),
    trail,
  }
}

function resolveProfile(
  state: AppState,
  input: RecordRoastInput,
): { ok: true; facts: ProfileSnapshot; sourceId?: number; createLibrary: boolean; updateSource: boolean } | { ok: false; error: DomainError } {
  const source = input.profileId != null ? state.profiles.find((item) => item.id === input.profileId) : undefined
  if (input.profileId != null && !source) return { ok: false, error: incompleteProfile(['saved profile']) }
  const entered = input.profile
  const facts: ProfileSnapshot = {
    name: blankToUndefined(entered?.name ?? source?.name),
    beansName: (entered?.beansName ?? source?.beansName ?? '').trim(),
    chargeTemp: entered?.chargeTemp ?? source?.chargeTemp ?? Number.NaN,
    batchSize: entered?.batchSize ?? source?.batchSize ?? Number.NaN,
    dtr: entered?.dtr ?? source?.dtr ?? Number.NaN,
    weightLossPercent: entered?.weightLossPercent ?? source?.weightLossPercent ?? Number.NaN,
    notes: blankToUndefined(entered?.notes ?? source?.notes),
  }
  const missing = missingProfileFields(facts)
  if ((!entered && !source) || missing.length) return { ok: false, error: incompleteProfile(missing) }
  const createLibrary = input.saveAsNew === true || (input.profileId == null && input.saveAsNew !== false)
  return {
    ok: true,
    facts,
    sourceId: source?.id,
    createLibrary,
    updateSource: input.updateExisting === true && source != null && !createLibrary,
  }
}

function resolveCost(weightGrams: number, totalCost: number | undefined, costPerKg: number | undefined) {
  if (isFiniteNumber(totalCost) && totalCost >= 0) {
    const kg = weightGrams / 1000
    return { totalCost: roundMoney(totalCost), costPerKg: kg > 0 ? roundMoney(totalCost / kg) : 0 }
  }
  if (isFiniteNumber(costPerKg) && costPerKg >= 0) {
    return { costPerKg: roundMoney(costPerKg), totalCost: roundMoney(costPerKg * (weightGrams / 1000)) }
  }
  return null
}

function shortfall(kind: StockKind, available: number, requested: number): DomainError {
  const short = roundGrams(requested - available)
  return {
    type: 'shortfall',
    kind,
    available: roundGrams(available),
    requested: roundGrams(requested),
    shortfall: short,
    message: `Not enough ${kind} stock. Shortfall: ${short} g (available ${roundGrams(available)} g, requested ${roundGrams(requested)} g). Inventory was not changed.`,
  }
}

function negativeStock(kind: StockKind, value: number): DomainError | null {
  if (!isFiniteNumber(value) || value >= 0) return null
  return {
    type: 'shortfall',
    kind,
    available: 0,
    requested: roundGrams(Math.abs(value)),
    shortfall: roundGrams(Math.abs(value)),
    message: `This change would make ${kind} stock negative by ${roundGrams(Math.abs(value))} g. Inventory was not changed.`,
  }
}

function reserveError(weightReceived: number, reserve: number): string | null {
  if (!isFiniteNumber(reserve) || reserve < 0) return 'Personal reserve cannot be negative.'
  if (roundGrams(reserve) > roundGrams(weightReceived)) return 'Personal reserve cannot exceed the weight received.'
  return null
}

function incompleteProfile(missing: string[]): DomainError {
  return {
    type: 'incomplete-profile',
    missing,
    message: `A roast profile is required before a batch can be created. Missing: ${missing.join(', ')}.`,
  }
}

function fail(state: AppState, message: string): DomainResult {
  return { ok: false, state, error: { type: 'validation', message } }
}

function nextId(items: { id: number }[]): number {
  return items.reduce((max, item) => Math.max(max, item.id), 0) + 1
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isValidDate(value: string): boolean {
  return value !== '' && !Number.isNaN(new Date(value).getTime())
}

function blankToUndefined(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}
