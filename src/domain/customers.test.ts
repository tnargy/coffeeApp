import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { APP_ROUTES } from '../routes.ts'
import type { BaggedUnit, Customer, GrindPreference, Sale } from '../types.ts'
import { CUSTOMER_IMPORT_FORMAT, addCustomer, customerDirectorySummary, customerOptionLabel, customerStanding, importCustomerList, linkUnlinkedSales, normalizeBuyerNote, updateCustomer } from './customers.ts'
import { emptyState, recordSale } from './rules.ts'

const CREATED_AT = '2026-03-01T00:00:00.000Z'

interface FixtureExpectedCustomer {
  name: string
  grindPreference: GrindPreference
  status: 'interested' | 'bought' | 'repeat'
  bagsBought: number
  totalSpent: number
  lastPurchaseDate: string | null
}

interface Fixture {
  bags: BaggedUnit[]
  sales: Sale[]
  expected: {
    linkedSales: number
    customerCount: number
    bagCount: number
    saleCount: number
    voidedSales: number
    nonVoidedRevenue: number
    summary: string
    customers: FixtureExpectedCustomer[]
  }
}

function fixture(): Fixture {
  return JSON.parse(readFileSync(new URL('../../fixtures/customers-fixture.json', import.meta.url), 'utf8')) as Fixture
}

function sale(partial: Partial<Sale> & Pick<Sale, 'id' | 'notes'>): Sale {
  return {
    baggedUnitIds: [1],
    saleAmount: 10,
    date: '2026-01-01T00:00:00.000Z',
    ...partial,
  }
}

describe('buyer note normalisation', () => {
  it('strips a trailing grind suffix, longest form first, without touching the stored note', () => {
    expect(normalizeBuyerNote('Alex Ground')).toEqual({ name: 'Alex', grind: 'ground' })
    expect(normalizeBuyerNote('Casey - Ground')).toEqual({ name: 'Casey', grind: 'ground' })
    expect(normalizeBuyerNote('Riley Whole')).toEqual({ name: 'Riley', grind: 'whole' })
    expect(normalizeBuyerNote('Riley Whole whole')).toEqual({ name: 'Riley', grind: 'whole' })
    expect(normalizeBuyerNote('  Jamie   -   Whole  ')).toEqual({ name: 'Jamie', grind: 'whole' })
    expect(normalizeBuyerNote('Sam Ground whole')).toEqual({ name: 'Sam', grind: 'whole' })
    expect(normalizeBuyerNote('Pat')).toEqual({ name: 'Pat', grind: 'unknown' })
    expect(normalizeBuyerNote('   ')).toEqual({ name: '', grind: 'unknown' })
  })
})

describe('customer directory', () => {
  it('links the fixture sales once, keeps notes, and matches the expected totals', () => {
    const source = fixture()
    expect(source.bags).toHaveLength(source.expected.bagCount)
    expect(source.sales).toHaveLength(source.expected.saleCount)
    expect(source.sales.filter((item) => item.voidedAt).length).toBe(source.expected.voidedSales)

    const state = emptyState()
    state.bags = source.bags
    state.sales = source.sales.map((item) => ({ ...item }))
    const linked = linkUnlinkedSales(state, { now: CREATED_AT })

    expect(linked.linked).toBe(source.expected.linkedSales)
    expect(linked.state.sales.every((item) => item.customerId != null)).toBe(true)
    expect(linked.state.sales.map((item) => item.notes)).toEqual(source.sales.map((item) => item.notes))
    expect(linked.state.customers.every((customer) => customer.createdAt === CREATED_AT)).toBe(true)

    const revenue = linked.state.sales
      .filter((item) => item.voidedAt == null)
      .reduce((sum, item) => sum + item.saleAmount, 0)
    expect(revenue).toBe(source.expected.nonVoidedRevenue)
    expect(customerDirectorySummary(linked.state)).toBe(source.expected.summary)

    const actual = linked.state.customers.map((customer) => {
      const standing = customerStanding(linked.state, customer)
      return {
        name: customer.name,
        grindPreference: customer.grindPreference,
        status: standing.status,
        bagsBought: standing.bagsBought,
        totalSpent: standing.totalSpent,
        lastPurchaseDate: standing.lastPurchaseDate,
      }
    })
    expect(actual).toEqual(source.expected.customers)

    const again = linkUnlinkedSales(linked.state, { now: '2026-04-01T00:00:00.000Z' })
    expect(again.created).toEqual([])
    expect(again.state.customers).toHaveLength(source.expected.customerCount)
  })

  it('uses the earliest sale id when the same buyer is spelled with a different grind', () => {
    const state = emptyState()
    state.sales = [
      sale({ id: 2, notes: 'Alex Whole' }),
      sale({ id: 1, notes: 'Alex Ground' }),
    ]
    const linked = linkUnlinkedSales(state, { now: CREATED_AT })
    expect(linked.state.customers).toEqual([
      expect.objectContaining({ name: 'Alex', grindPreference: 'ground' }),
    ])
    expect(linked.state.sales.every((item) => item.customerId === linked.state.customers[0].id)).toBe(true)
  })

  it('refuses a duplicate name on create and rename, and allows a case-only rename', () => {
    const created = addCustomer(emptyState(), { name: '  Sam  ', grindPreference: 'ground', now: CREATED_AT })
    expect(created.ok).toBe(true)
    if (!created.ok) return
    expect(created.state.customers[0]).toMatchObject({ name: 'Sam', grindPreference: 'ground', createdAt: CREATED_AT })

    const duplicate = addCustomer(created.state, { name: 'sam', grindPreference: 'whole' })
    expect(duplicate.ok).toBe(false)
    if (duplicate.ok) return
    expect(duplicate.error.message).toBe('A customer with that name already exists.')
    expect(duplicate.state.customers).toHaveLength(1)

    const renamed = updateCustomer(created.state, created.state.customers[0].id, {
      name: 'SAM',
      grindPreference: 'whole',
      notes: '  window seat  ',
    })
    expect(renamed.ok).toBe(true)
    if (!renamed.ok) return
    expect(renamed.state.customers[0]).toMatchObject({ name: 'SAM', grindPreference: 'whole', notes: 'window seat' })

    const other = addCustomer(renamed.state, { name: 'Jordan', grindPreference: 'unknown', now: CREATED_AT })
    expect(other.ok).toBe(true)
    if (!other.ok) return
    const clash = updateCustomer(other.state, other.state.customers[1].id, {
      name: 'sam',
      grindPreference: 'unknown',
      notes: '',
    })
    expect(clash.ok).toBe(false)
    if (clash.ok) return
    expect(clash.error.message).toBe('A customer with that name already exists.')
  })

  it('reuses an existing customer from record sale and still allows an unlinked sale', () => {
    const seeded = addCustomer(emptyState(), { name: 'Casey', grindPreference: 'ground', now: CREATED_AT })
    expect(seeded.ok).toBe(true)
    if (!seeded.ok) return
    const withBag = {
      ...seeded.state,
      bags: [
        {
          id: 1,
          batchId: 1,
          bagSizeOz: 8,
          weight: 200,
          classification: 'for-sale' as const,
          status: 'available' as const,
          createdAt: CREATED_AT,
        },
      ],
    }
    const reused = recordSale(withBag, {
      baggedUnitIds: [1],
      saleAmount: 12,
      date: '2026-03-04T00:00:00.000Z',
      newCustomer: { name: ' casey ', grindPreference: 'whole' },
      now: '2026-03-04T00:00:00.000Z',
    })
    expect(reused.ok).toBe(true)
    if (!reused.ok) return
    expect(reused.state.customers).toHaveLength(1)
    expect(reused.state.customers[0].grindPreference).toBe('ground')
    expect(reused.state.sales[0].customerId).toBe(reused.state.customers[0].id)
    expect(customerOptionLabel(reused.state.customers[0]).toLowerCase()).toContain('ground')

    const secondBag = {
      ...reused.state,
      bags: reused.state.bags.map((bag) => ({ ...bag, id: 2, status: 'available' as const })),
    }
    const unlinked = recordSale(secondBag, {
      baggedUnitIds: [2],
      saleAmount: 9,
      date: '2026-03-05T00:00:00.000Z',
    })
    expect(unlinked.ok).toBe(true)
    if (!unlinked.ok) return
    expect(unlinked.state.sales[1].customerId).toBeUndefined()
    expect(unlinked.state.customers).toHaveLength(1)
  })

  it('does not create a customer when the sale itself is refused', () => {
    const refused = recordSale(emptyState(), {
      baggedUnitIds: [],
      saleAmount: 5,
      date: '2026-01-01T00:00:00.000Z',
      newCustomer: { name: 'Sam', grindPreference: 'ground' },
    })
    expect(refused.ok).toBe(false)
    expect(refused.state.customers).toHaveLength(0)
  })

  it('imports a customer file in order, skips duplicates, and creates nothing the second time', () => {
    const file = {
      format: CUSTOMER_IMPORT_FORMAT,
      customers: [
        { name: 'Alex', grindPreference: 'ground' },
        { name: 'Jordan' },
        { name: ' alex ' },
        { name: 'Sam', grindPreference: 'whole' },
      ],
    }
    const first = importCustomerList(emptyState(), JSON.stringify(file), CREATED_AT)
    expect(first.ok).toBe(true)
    if (!first.ok) return
    expect(first.state.customers.map((customer: Customer) => [customer.name, customer.grindPreference])).toEqual([
      ['Alex', 'ground'],
      ['Jordan', 'unknown'],
      ['Sam', 'whole'],
    ])
    expect(first.info).toBe('Created 3 customers: Alex, Jordan, Sam. Skipped 1 duplicate: alex.')

    const second = importCustomerList(first.state, JSON.stringify(file), '2026-04-01T00:00:00.000Z')
    expect(second.ok).toBe(true)
    if (!second.ok) return
    expect(second.state.customers).toHaveLength(3)
    expect(second.state.customers.every((customer) => customer.createdAt === CREATED_AT)).toBe(true)
    expect(second.info).toBe('Created 0 customers. Skipped 4 duplicates: Alex, Jordan, alex, Sam.')
  })

  it('rejects a bad customer import without changing the directory', () => {
    const start = addCustomer(emptyState(), { name: 'Sam', grindPreference: 'unknown', now: CREATED_AT })
    expect(start.ok).toBe(true)
    if (!start.ok) return
    const bad = importCustomerList(start.state, JSON.stringify({
      format: CUSTOMER_IMPORT_FORMAT,
      customers: [{ name: 'Jordan', grindPreference: 'beans' }],
    }))
    expect(bad.ok).toBe(false)
    if (bad.ok) return
    expect(bad.error.message).toBe('That customer import has an invalid grind preference.')
    expect(bad.state.customers).toEqual(start.state.customers)
  })

  it('is on the operator navigation', () => {
    expect(APP_ROUTES.map((route) => route.path)).toContain('/customers')
  })
})

describe('customer standing', () => {
  it('counts a voided-only buyer as interested with no bags and no spend', () => {
    const state = emptyState()
    state.customers = [{ id: 1, name: 'Morgan', grindPreference: 'unknown', createdAt: CREATED_AT }]
    state.sales = [
      sale({
        id: 1,
        notes: 'Morgan',
        customerId: 1,
        saleAmount: 40,
        baggedUnitIds: [1, 2],
        voidedAt: CREATED_AT,
        voidReason: 'Mistake',
      }),
    ]
    expect(customerStanding(state, state.customers[0])).toEqual({
      status: 'interested',
      bagsBought: 0,
      totalSpent: 0,
      lastPurchaseDate: null,
    })
    expect(customerDirectorySummary(state)).toBe('1 customer · 0 ground · 0 whole · 1 unknown · 1 interested')
  })
})
