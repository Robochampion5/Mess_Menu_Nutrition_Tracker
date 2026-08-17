import { describe, it, expect } from 'vitest'
import { safeParseJson } from '../ai/utils'

describe('safeParseJson', () => {
  it('parses clean JSON', () => {
    const result = safeParseJson<{ foo: string }>('{"foo":"bar"}')
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.data).toEqual({ foo: 'bar' })
  })

  it('strips ```json fences', () => {
    const result = safeParseJson<number[]>('```json\n[1,2,3]\n```')
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.data).toEqual([1, 2, 3])
  })

  it('strips plain ``` fences', () => {
    const result = safeParseJson<{ x: number }>('```\n{"x":42}\n```')
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.data).toEqual({ x: 42 })
  })

  it('handles leading/trailing whitespace', () => {
    const result = safeParseJson<boolean[]>('  \n[true, false]\n  ')
    expect(result.ok).toBe(true)
  })

  it('returns ok:false for invalid JSON', () => {
    const result = safeParseJson<unknown>('this is not json')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.raw).toBe('this is not json')
      expect(result.error).toBeInstanceOf(Error)
    }
  })

  it('returns ok:false for truncated JSON', () => {
    const result = safeParseJson<unknown>('{"foo": ')
    expect(result.ok).toBe(false)
  })

  it('returns ok:false for empty string', () => {
    const result = safeParseJson<unknown>('')
    expect(result.ok).toBe(false)
  })

  it('handles JSON inside fences with extra whitespace', () => {
    const raw = '```json\n  {\n    "a": 1\n  }\n```'
    const result = safeParseJson<{ a: number }>(raw)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.data.a).toBe(1)
  })
})
