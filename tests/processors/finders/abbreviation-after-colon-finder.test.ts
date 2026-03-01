import { describe, expect, it } from 'vitest'
import type { Note } from '../../../sources/models/note.js'
import AbbreviationAfterColonFinder from '../../../sources/processors/finders/abbreviation-after-colon-finder.js'

describe('AbbreviationAfterColonFinder', () => {
  describe('find', () => {
    it('半角コロンの略称展開から Hint を返す', () => {
      const finder = new AbbreviationAfterColonFinder()
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
      const finder = new AbbreviationAfterColonFinder()
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
      const finder = new AbbreviationAfterColonFinder()
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
      const finder = new AbbreviationAfterColonFinder()
      const note: Note = {
        source: 'inline.md',
        text: 'api: Application Programming Interface',
        origins: [{ offset: 0, line: 1 }],
      }
      expect(finder.find(note)).toHaveLength(0)
    })

    it('右側が日本語の場合はマッチしない', () => {
      const finder = new AbbreviationAfterColonFinder()
      const note: Note = {
        source: 'inline.md',
        text: 'API: アプリケーション・プログラミング・インターフェース',
        origins: [{ offset: 0, line: 1 }],
      }
      expect(finder.find(note)).toHaveLength(0)
    })

    it('左側が日本語の場合はマッチしない', () => {
      const finder = new AbbreviationAfterColonFinder()
      const note: Note = {
        source: 'inline.md',
        text: '認証: Authentication',
        origins: [{ offset: 0, line: 1 }],
      }
      expect(finder.find(note)).toHaveLength(0)
    })

    it('hint.line を正しく設定する', () => {
      const finder = new AbbreviationAfterColonFinder()
      const note: Note = {
        source: 'inline.md',
        text: 'TLS: Transport Layer Security',
        origins: [{ offset: 0, line: 8 }],
      }
      const hints = finder.find(note)
      expect(hints[0]?.line).toBe(8)
    })

    it('複数 Origin で後半のパターンの line を正しく解決する', () => {
      const finder = new AbbreviationAfterColonFinder()
      const note: Note = {
        source: 'inline.md',
        text: '前半のテキスト\nCORS: Cross-Origin Resource Sharing',
        origins: [
          { offset: 0, line: 3 },
          { offset: 8, line: 12 },
        ],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.name).toBe('CORS')
      expect(hints[0]?.line).toBe(12)
    })

    it('ドットを含む略称にマッチする', () => {
      const finder = new AbbreviationAfterColonFinder()
      const note: Note = {
        source: 'inline.md',
        text: 'U.S.A: United States of America',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.name).toBe('U.S.A')
    })

    it('ハイフンを含む略称にマッチする', () => {
      const finder = new AbbreviationAfterColonFinder()
      const note: Note = {
        source: 'inline.md',
        text: 'UTF-8: Unicode Transformation Format',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.name).toBe('UTF-8')
    })

    it('スラッシュを含む略称にマッチする', () => {
      const finder = new AbbreviationAfterColonFinder()
      const note: Note = {
        source: 'inline.md',
        text: 'I/O: Input Output',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.name).toBe('I/O')
    })

    it('テキストが空の場合は空配列を返す', () => {
      const finder = new AbbreviationAfterColonFinder()
      const note: Note = {
        source: 'inline.md',
        text: '',
        origins: [{ offset: 0, line: 1 }],
      }
      expect(finder.find(note)).toHaveLength(0)
    })
  })
})
