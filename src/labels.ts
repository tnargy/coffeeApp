import type { BatchStatus, Classification } from './types.ts'

export function classificationLabel(value: Classification): string {
  return value === 'internal' ? 'Internal / personal use' : 'For sale'
}

export function statusLabel(status: BatchStatus): string {
  return status === 'bagged' ? 'Bagged' : 'Ready to bag'
}
