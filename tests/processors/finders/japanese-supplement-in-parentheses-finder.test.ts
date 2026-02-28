import { describe, expect, it } from 'vitest'
import type { Note } from '../../../sources/models/note.js'
import JapaneseSupplementInParenthesesFinder from '../../../sources/processors/finders/japanese-supplement-in-parentheses-finder.js'

const finder = new JapaneseSupplementInParenthesesFinder()

describe('JapaneseSupplementInParenthesesFinder', () => {
  describe('find', () => {
    it('日本語（日本語補足）のパターンから Hint を返す', () => {
      const note: Note = {
        source: 'inline.md',
        text: '共有メモリ（データをコピーする必要がないので高速）を使って通信する',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.name).toBe('共有メモリ')
      expect(hints[0]?.description).toBe('データをコピーする必要がないので高速')
    })

    it('半角括弧でもマッチする', () => {
      const note: Note = {
        source: 'inline.md',
        text: '共有メモリ(高速な通信手段)を利用する',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.name).toBe('共有メモリ')
    })

    it('日英ペアにはマッチしない', () => {
      const note: Note = {
        source: 'inline.md',
        text: '認証（Authentication）はユーザーの身元を確認する',
        origins: [{ offset: 0, line: 1 }],
      }
      expect(finder.find(note)).toHaveLength(0)
    })

    it('略称展開にはマッチしない', () => {
      const note: Note = {
        source: 'inline.md',
        text: 'HTTP（HyperText Transfer Protocol）は通信プロトコルです',
        origins: [{ offset: 0, line: 1 }],
      }
      expect(finder.find(note)).toHaveLength(0)
    })

    it('span と line を正しく設定する', () => {
      const note: Note = {
        source: 'inline.md',
        text: '共有メモリ（高速）を使う',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints[0]?.span?.offset).toBe(0)
      expect(hints[0]?.span?.text).toContain('共有メモリ')
      expect(hints[0]?.line).toBe(1)
    })

    it('テキストが空の場合は空配列を返す', () => {
      const note: Note = {
        source: 'inline.md',
        text: '',
        origins: [{ offset: 0, line: 1 }],
      }
      expect(finder.find(note)).toHaveLength(0)
    })
  })
})
