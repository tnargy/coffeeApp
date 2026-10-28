import { formatTime, parseTime } from '../units.ts'

// Optional /roast query params. Missing or unparsable values are ignored.
// beans: beans name. green: grams. charge: °C. total: mm:ss. fc: mm:ss. drop: °C. dtr: %.
export interface RoastFormPrefill {
  beansName?: string
  green?: string
  chargeTemp?: string
  totalTime?: string
  firstCrack?: string
  dropTemp?: string
  dtr?: string
}

export function roastFormPrefill(params: URLSearchParams): RoastFormPrefill {
  const prefill: RoastFormPrefill = {}
  const beans = textParam(params.get('beans'))
  if (beans) prefill.beansName = beans
  const green = numberParam(params.get('green'))
  if (green) prefill.green = green
  const charge = numberParam(params.get('charge'))
  if (charge) prefill.chargeTemp = charge
  const total = timeParam(params.get('total'))
  if (total) prefill.totalTime = total
  const firstCrack = timeParam(params.get('fc'))
  if (firstCrack) prefill.firstCrack = firstCrack
  const drop = numberParam(params.get('drop'))
  if (drop) prefill.dropTemp = drop
  const dtr = numberParam(params.get('dtr'))
  if (dtr) prefill.dtr = dtr
  return prefill
}

function textParam(value: string | null): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function numberParam(value: string | null): string | undefined {
  const trimmed = value?.trim()
  if (!trimmed || !Number.isFinite(Number(trimmed))) return undefined
  return trimmed
}

function timeParam(value: string | null): string | undefined {
  if (value == null) return undefined
  const seconds = parseTime(value)
  if (seconds == null) return undefined
  return formatTime(seconds)
}
