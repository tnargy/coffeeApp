import type { ActivityKind } from './domain/rules.ts'
import type { IconName } from './components/Icon.tsx'

export function chipFor(kind: ActivityKind): string {
  if (kind === 'bagged' || kind === 'received') return 'bag'
  if (kind === 'sold') return 'bean'
  return 'bean'
}

export function iconFor(kind: ActivityKind): IconName {
  if (kind === 'received') return 'leaf'
  if (kind === 'roasted') return 'bean'
  if (kind === 'bagged') return 'bag'
  return 'cup'
}
