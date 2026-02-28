import { describe, expect, it } from 'vitest'
import type { Note } from '../../../sources/models/note.js'
import AbbreviationAfterColonFinder from '../../../sources/processors/finders/abbreviation-after-colon-finder.js'

const finder = new AbbreviationAfterColonFinder()

describe('AbbreviationAfterColonFinder', () => {
  describe('find', () => {
    it('半角コロンの略称展開から Hint を返す', () => {
      const note: Note = {
        source: 'inline.md',
        text: 'TLS: Transport Layer Security',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.name).toBe('TLS')
      expect(hints[0]?.description).toBe('Transport Layer Security')
      expect(hints[0]?.span?.text).toBe('TLS: Transport Layer Security')
      expect(hints[0]?.span?.offset).toBe(0)
    })

    it('全角コロンにもマッチする', () => {
      const note: Note = {
        source: 'inline.md',
        text: 'CORS：Cross-Origin Resource Sharing',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.name).toBe('CORS')
      expect(hints[0]?.description).toBe('Cross-Origin Resource Sharing')
    })

    it('複数のパターンを検出する', () => {
      const note: Note = {
        source: 'inline.md',
        text: 'TLS: Transport Layer Security\nCORS: Cross-Origin Resource Sharing',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(2)
      expect(hints[0]?.name).toBe('TLS')
      expect(hints[1]?.name).toBe('CORS')
    })

    it('左側が小文字の場合はマッチしない', () => {
      const note: Note = {
        source: 'inline.md',
        text: 'api: Application Programming Interface',
        origins: [{ offset: 0, line: 1 }],
      }
      expect(finder.find(note)).toHaveLength(0)
    })

    it('右側が日本語の場合はマッチしない', () => {
      const note: Note = {
        source: 'inline.md',
        text: 'API: アプリケーション・プログラミング・インターフェース',
        origins: [{ offset: 0, line: 1 }],
      }
      expect(finder.find(note)).toHaveLength(0)
    })

    it('左側が日本語の場合はマッチしない', () => {
      const note: Note = {
        source: 'inline.md',
        text: '認証: Authentication',
        origins: [{ offset: 0, line: 1 }],
      }
      expect(finder.find(note)).toHaveLength(0)
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
