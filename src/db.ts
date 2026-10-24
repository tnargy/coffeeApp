import Dexie, { type EntityTable } from 'dexie'
import type { AuditEntry, BaggedUnit, GreenLot, RoastBatch, RoastProfile, Sale, Settings } from './types.ts'

export const db = new Dexie('CoffeeRoasterDB') as Dexie & {
  lots: EntityTable<GreenLot, 'id'>
  profiles: EntityTable<RoastProfile, 'id'>
  batches: EntityTable<RoastBatch, 'id'>
  bags: EntityTable<BaggedUnit, 'id'>
  sales: EntityTable<Sale, 'id'>
  audit: EntityTable<AuditEntry, 'id'>
  settings: EntityTable<Settings, 'id'>
}

db.version(1).stores({
  lots: '++id, dateReceived',
  profiles: '++id, beansName',
  batches: '++id, greenLotId, profileId, roastDate, status',
  bags: '++id, batchId, status, createdAt',
  sales: '++id, date',
  settings: 'id',
})

db.version(2).stores({
  audit: '++id, at, entity, entityKey',
})

export async function resetDatabase(): Promise<void> {
  await db.delete()
  await db.open()
}
