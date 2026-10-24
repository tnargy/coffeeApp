export const GRAMS_PER_LB = 453.59237
export const GRAMS_PER_OZ = 28.349523125
export const DEFAULT_RESERVE_GRAMS = GRAMS_PER_LB
export const DEFAULT_BAG_SIZE_OZ = 8
export const SETTINGS_ID = 1

export type WeightUnit = 'g' | 'kg' | 'lb' | 'oz'

export function roundGrams(value: number): number {
  return Math.round(value * 1000) / 1000
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100
}

export function toGrams(value: number, unit: WeightUnit): number {
  if (unit === 'kg') return value * 1000
  if (unit === 'lb') return value * GRAMS_PER_LB
  if (unit === 'oz') return value * GRAMS_PER_OZ
  return value
}

export function gramsToOz(grams: number): number {
  return grams / GRAMS_PER_OZ
}

export function formatPounds(grams: number): string {
  return `${trimNumber(grams / GRAMS_PER_LB)} lb`
}

export function formatWeight(grams: number): string {
  return formatGrams(grams)
}

export function currentLocalDate(): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

export function calendarDateToIso(value: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return null
  const local = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  if (Number.isNaN(local.getTime())) return null
  return local.toISOString()
}

export function formatDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString()
}

export function formatGrams(grams: number): string {
  return `${roundGrams(grams).toLocaleString('en-US')} g`
}

export function formatMoney(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

export function formatWhen(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString()
}

export function formatDuration(ms: number): string {
  const abs = Math.abs(Math.floor(ms / 1000))
  const days = Math.floor(abs / 86400)
  const hours = Math.floor((abs % 86400) / 3600)
  const minutes = Math.floor((abs % 3600) / 60)
  const parts: string[] = []
  if (days) parts.push(`${days}d`)
  if (hours || days) parts.push(`${hours}h`)
  parts.push(`${minutes}m`)
  return parts.join(' ')
}

export function currentLocalInput(): string {
  return toLocalInput(new Date().toISOString())
}

export function toLocalInput(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function fromLocalInput(value: string): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

function trimNumber(value: number): string {
  return value.toLocaleString('en-US', { maximumFractionDigits: 2 })
}
