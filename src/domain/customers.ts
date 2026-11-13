import type { AppState, Customer, CustomerStatus, GrindPreference, Sale } from '../types.ts'
import { roundMoney } from '../units.ts'
import type { DomainResult } from './rules.ts'

/**
 * Trailing grind annotations, longest first. Equal lengths keep this order.
 * Matching is case-insensitive. The outermost suffix sets the grind; stripping repeats
 * so "Riley Whole whole" becomes Riley, and "Casey - Ground" matches the longer
 * " - Ground" form before the shorter " ground" form.
 */
const GRIND_SUFFIXES: { suffix: string; grind: GrindPreference }[] = [
  { suffix: ' - ground', grind: 'ground' },
  { suffix: ' - whole', grind: 'whole' },
  { suffix: ' ground', grind: 'ground' },
  { suffix: ' whole', grind: 'whole' },
]

export const CUSTOMER_IMPORT_FORMAT = 'coffeeApp customers import v1'

export interface CustomerInput {
  name: string
  grindPreference: GrindPreference
  notes?: string
  now?: string
}

export interface CustomerPatch {
  name: string
  grindPreference: GrindPreference
  notes?: string
}

export interface CustomerStanding {
  status: CustomerStatus
  bagsBought: number
  totalSpent: number
  lastPurchaseDate: string | null
}

export interface LinkResult {
  state: AppState
  linked: number
  created: string[]
}

export function isGrindPreference(value: unknown): value is GrindPreference {
  return value === 'ground' || value === 'whole' || value === 'unknown'
}

export function grindLabel(grind: GrindPreference): string {
  if (grind === 'ground') return 'Ground'
  if (grind === 'whole') return 'Whole bean'
  return 'Unknown'
}

export function customerStatusLabel(status: CustomerStatus): string {
  if (status === 'interested') return 'Interested'
  if (status === 'bought') return 'Bought'
  return 'Repeat'
}

export function customerOptionLabel(customer: Customer): string {
  return `${customer.name} · ${grindLabel(customer.grindPreference)}`
}

export function normalizePersonName(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

export function customerNameKey(value: string): string {
  return normalizePersonName(value).toLowerCase()
}

export function findCustomerByName(customers: Customer[], name: string): Customer | undefined {
  const key = customerNameKey(name)
  if (!key) return undefined
  return customers.find((customer) => customerNameKey(customer.name) === key)
}

/** Trim, collapse whitespace, and strip trailing grind suffixes. Does not change the stored sale note. */
export function normalizeBuyerNote(notes: string): { name: string; grind: GrindPreference } {
  let text = normalizePersonName(notes)
  let grind: GrindPreference = 'unknown'
  while (text.length > 0) {
    const lower = text.toLowerCase()
    const match = GRIND_SUFFIXES.find((candidate) => lower.endsWith(candidate.suffix))
    if (!match || match.suffix.length >= text.length) break
    if (grind === 'unknown') grind = match.grind
    text = text.slice(0, text.length - match.suffix.length).trim()
  }
  return { name: text, grind }
}

export function liveCustomerSales(state: AppState, customerId: number): Sale[] {
  return state.sales.filter((sale) => sale.customerId === customerId && sale.voidedAt == null)
}

export function customerStanding(state: AppState, customer: Customer): CustomerStanding {
  const sales = liveCustomerSales(state, customer.id)
  const bagsBought = sales.reduce((sum, sale) => sum + sale.baggedUnitIds.length, 0)
  const totalSpent = roundMoney(sales.reduce((sum, sale) => sum + sale.saleAmount, 0))
  const lastPurchaseDate = sales.reduce<string | null>((latest, sale) => {
    if (latest == null || sale.date > latest) return sale.date
    return latest
  }, null)
  const status: CustomerStatus = sales.length >= 2 ? 'repeat' : sales.length === 1 ? 'bought' : 'interested'
  return { status, bagsBought, totalSpent, lastPurchaseDate }
}

export function customerDirectorySummary(state: AppState): string {
  const customers = state.customers
  const ground = customers.filter((customer) => customer.grindPreference === 'ground').length
  const whole = customers.filter((customer) => customer.grindPreference === 'whole').length
  const unknown = customers.filter((customer) => customer.grindPreference === 'unknown').length
  const interested = customers.filter((customer) => customerStanding(state, customer).status === 'interested').length
  const noun = customers.length === 1 ? 'customer' : 'customers'
  return `${customers.length} ${noun} · ${ground} ground · ${whole} whole · ${unknown} unknown · ${interested} interested`
}

export function linkUnlinkedSales(
  state: AppState,
  options?: { now?: string; skipSaleIds?: readonly number[] },
): LinkResult {
  const next = structuredClone(state)
  const skip = new Set(options?.skipSaleIds ?? [])
  const createdAt = options?.now ?? new Date().toISOString()
  const created: string[] = []
  let linked = 0
  const ordered = [...next.sales].sort((a, b) => a.id - b.id)
  for (const sale of ordered) {
    if (skip.has(sale.id)) continue
    if (typeof sale.customerId === 'number' && sale.customerId > 0) continue
    const { name, grind } = normalizeBuyerNote(sale.notes ?? '')
    if (!name) continue
    let customer = findCustomerByName(next.customers, name)
    if (!customer) {
      customer = {
        id: nextId(next.customers),
        name,
        grindPreference: grind,
        createdAt,
      }
      next.customers.push(customer)
      created.push(name)
    }
    sale.customerId = customer.id
    linked += 1
  }
  return { state: next, linked, created }
}

export function resolveSaleCustomer(
  state: AppState,
  input: { customerId?: number; newCustomer?: { name: string; grindPreference: GrindPreference }; now?: string },
): { ok: true; state: AppState; customerId?: number } | { ok: false; message: string } {
  const next = structuredClone(state)
  if (input.newCustomer) {
    const name = normalizePersonName(input.newCustomer.name)
    if (!name) return { ok: false, message: 'Customer name is required.' }
    if (!isGrindPreference(input.newCustomer.grindPreference)) {
      return { ok: false, message: 'Grind preference must be ground, whole, or unknown.' }
    }
    const existing = findCustomerByName(next.customers, name)
    if (existing) return { ok: true, state: next, customerId: existing.id }
    const customer: Customer = {
      id: nextId(next.customers),
      name,
      grindPreference: input.newCustomer.grindPreference,
      createdAt: input.now ?? new Date().toISOString(),
    }
    next.customers.push(customer)
    return { ok: true, state: next, customerId: customer.id }
  }
  if (input.customerId != null) {
    const existing = next.customers.find((customer) => customer.id === input.customerId)
    if (!existing) return { ok: false, message: 'Customer not found.' }
    return { ok: true, state: next, customerId: existing.id }
  }
  return { ok: true, state: next }
}

export function addCustomer(state: AppState, input: CustomerInput): DomainResult {
  const name = normalizePersonName(input.name)
  if (!name) return fail(state, 'Customer name is required.')
  if (!isGrindPreference(input.grindPreference)) return fail(state, 'Grind preference must be ground, whole, or unknown.')
  if (findCustomerByName(state.customers, name)) return fail(state, 'A customer with that name already exists.')
  const next = structuredClone(state)
  const notes = optionalNote(input.notes)
  const customer: Customer = {
    id: nextId(next.customers),
    name,
    grindPreference: input.grindPreference,
    createdAt: input.now ?? new Date().toISOString(),
  }
  if (notes) customer.notes = notes
  next.customers.push(customer)
  return { ok: true, state: next, info: 'Customer added.' }
}

export function updateCustomer(state: AppState, id: number, patch: CustomerPatch): DomainResult {
  const current = state.customers.find((customer) => customer.id === id)
  if (!current) return fail(state, 'Customer not found.')
  const name = normalizePersonName(patch.name)
  if (!name) return fail(state, 'Customer name is required.')
  if (!isGrindPreference(patch.grindPreference)) return fail(state, 'Grind preference must be ground, whole, or unknown.')
  const conflict = findCustomerByName(state.customers, name)
  if (conflict && conflict.id !== id) return fail(state, 'A customer with that name already exists.')
  const next = structuredClone(state)
  const target = next.customers.find((customer) => customer.id === id)
  if (!target) return fail(state, 'Customer not found.')
  target.name = name
  target.grindPreference = patch.grindPreference
  const notes = optionalNote(patch.notes)
  if (notes) target.notes = notes
  else delete target.notes
  return { ok: true, state: next, info: 'Customer saved.' }
}

export function importCustomerList(state: AppState, text: string, now = new Date().toISOString()): DomainResult {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return fail(state, 'That file is not valid JSON.')
  }
  if (!isRecord(raw) || raw.format !== CUSTOMER_IMPORT_FORMAT) {
    return fail(state, 'That file is not a customer import.')
  }
  if (!Array.isArray(raw.customers)) {
    return fail(state, 'That customer import is missing the customers collection.')
  }

  const rows: { name: string; grind: GrindPreference }[] = []
  for (const entry of raw.customers) {
    if (!isRecord(entry) || typeof entry.name !== 'string') {
      return fail(state, 'That customer import has a customer with no name.')
    }
    const name = normalizePersonName(entry.name)
    if (!name) return fail(state, 'That customer import has a customer with no name.')
    const grind = entry.grindPreference
    if (grind == null || grind === '') {
      rows.push({ name, grind: 'unknown' })
      continue
    }
    if (!isGrindPreference(grind)) return fail(state, 'That customer import has an invalid grind preference.')
    rows.push({ name, grind })
  }

  const next = structuredClone(state)
  const created: string[] = []
  const skipped: string[] = []
  for (const row of rows) {
    if (findCustomerByName(next.customers, row.name)) {
      skipped.push(row.name)
      continue
    }
    next.customers.push({
      id: nextId(next.customers),
      name: row.name,
      grindPreference: row.grind,
      createdAt: now,
    })
    created.push(row.name)
  }
  const createdNoun = created.length === 1 ? 'customer' : 'customers'
  const skippedNoun = skipped.length === 1 ? 'duplicate' : 'duplicates'
  const createdNames = created.length ? `: ${created.join(', ')}` : ''
  const skippedNames = skipped.length ? `: ${skipped.join(', ')}` : ''
  const info = `Created ${created.length} ${createdNoun}${createdNames}. Skipped ${skipped.length} ${skippedNoun}${skippedNames}.`
  return { ok: true, state: next, info }
}

function optionalNote(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function nextId(items: { id: number }[]): number {
  return items.reduce((max, item) => Math.max(max, item.id), 0) + 1
}

function fail(state: AppState, message: string): DomainResult {
  return { ok: false, state, error: { type: 'validation', message } }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}
