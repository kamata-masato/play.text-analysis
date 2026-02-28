import { describe, expect, it } from 'vitest'
import type { Note } from '../../../../sources/models/note.js'
import resolve from '../../../../sources/processors/finders/supports/line.js'

describe('resolve', () => {
  it('単一の Origin でその行番号を返す', () => {
    const note: Note = {
      source: 'inline.md',
      text: '',
      origins: [{ offset: 0, line: 3 }],
    }
    expect(resolve(note, 0)).toBe(3)
  })

  it('複数の Origin でオフセットに対応する行番号を返す', () => {
    const note: Note = {
      source: 'inline.md',
      text: '',
      origins: [
        { offset: 0, line: 1 },
        { offset: 10, line: 3 },
        { offset: 20, line: 5 },
      ],
    }
    expect(resolve(note, 0)).toBe(1)
    expect(resolve(note, 5)).toBe(1)
    expect(resolve(note, 10)).toBe(3)
    expect(resolve(note, 15)).toBe(3)
    expect(resolve(note, 20)).toBe(5)
    expect(resolve(note, 25)).toBe(5)
  })

  it('境界値ちょうどの offset で正しい行番号を返す', () => {
    const note: Note = {
      source: 'inline.md',
      text: '',
      origins: [
        { offset: 0, line: 1 },
        { offset: 10, line: 2 },
      ],
    }
    expect(resolve(note, 9)).toBe(1)
    expect(resolve(note, 10)).toBe(2)
  })
})
