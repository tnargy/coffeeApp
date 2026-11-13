import type { Sale, Settings } from '../types.ts'

/** A sale or setting with no stored standard price means this price. */
export const DEFAULT_STANDARD_BAG_PRICE = 12

/** Fraction above the earlier lot's $/kg that flags a cost jump. */
export const COST_JUMP_FRACTION = 0.1

export function currentStandardPrice(settings: Settings): number {
  const price = settings.standardBagPrice
  return typeof price === 'number' && Number.isFinite(price) && price > 0 ? price : DEFAULT_STANDARD_BAG_PRICE
}

export function saleStandardPrice(sale: Sale): number {
  const price = sale.standardPriceAtSale
  return typeof price === 'number' && Number.isFinite(price) && price > 0 ? price : DEFAULT_STANDARD_BAG_PRICE
}
