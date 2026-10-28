import { describe, expect, it } from 'vitest'
import { parseTime } from '../units.ts'
import { roastFormPrefill } from './roastPrefill.ts'

const example = 'beans=Guatemala&green=500&charge=176.2&total=14:37&fc=11:57&drop=194.2&dtr=18.2'

describe('roast form URL prefill', () => {
  it('maps a shareable link into editable form strings', () => {
    const prefill = roastFormPrefill(new URLSearchParams(example))
    expect(prefill).toEqual({
      beansName: 'Guatemala',
      green: '500',
      chargeTemp: '176.2',
      totalTime: '14:37',
      firstCrack: '11:57',
      dropTemp: '194.2',
      dtr: '18.2',
    })
    const edited = { ...prefill, beansName: 'Kenya', totalTime: '12:00', green: '450' }
    expect(edited.beansName).toBe('Kenya')
    expect(edited.green).toBe('450')
    expect(parseTime(prefill.totalTime ?? '')).toBe(14 * 60 + 37)
    expect(parseTime(prefill.firstCrack ?? '')).toBe(11 * 60 + 57)
    expect(parseTime(edited.totalTime)).toBe(12 * 60)
  })

  it('ignores missing and invalid values', () => {
    const prefill = roastFormPrefill(new URLSearchParams('charge=176.2&total=not-a-time&green=abc&fc=&drop='))
    expect(prefill).toEqual({ chargeTemp: '176.2' })
    expect(prefill.totalTime).toBeUndefined()
    expect(prefill.green).toBeUndefined()
    expect(prefill.firstCrack).toBeUndefined()
    expect(prefill.dropTemp).toBeUndefined()
    expect(prefill.beansName).toBeUndefined()
    expect(prefill.dtr).toBeUndefined()
  })

  it('leaves the form empty when there is no query string', () => {
    expect(roastFormPrefill(new URLSearchParams())).toEqual({})
    expect(roastFormPrefill(new URLSearchParams('lot=1&notes=hi'))).toEqual({})
    expect(roastFormPrefill(new URLSearchParams('beans=   '))).toEqual({})
  })
})
