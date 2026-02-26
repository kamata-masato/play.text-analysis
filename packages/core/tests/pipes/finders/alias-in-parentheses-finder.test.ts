import { describe, expect, it } from 'vitest'
import type { Note } from '../../../models/note.js'
import { AliasInParenthesesFinder } from '../../../pipes/finders/alias-in-parentheses-finder.js'

describe('AliasInParenthesesFinder', () => {
  describe('find - 日英ペアの検出', () => {
    it('日本語（English）の形式にマッチすること', () => {
      const finder = new AliasInParenthesesFinder()
      const note: Note = {
        source: '日本料理.md',
        text: '天ぷら（Tempura）は日本の代表的な揚げ物料理です',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.name).toBe('天ぷら')
      expect(hints[0]?.description).toBe('Tempura')
    })

    it('半角括弧でもマッチすること', () => {
      const finder = new AliasInParenthesesFinder()
      const note: Note = {
        source: '日本料理.md',
        text: '味噌汁(Miso Soup)を使って通信する',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.name).toBe('味噌汁')
      expect(hints[0]?.description).toBe('Miso Soup')
    })

    it('マッチ位置と行番号を正しく設定すること', () => {
      const finder = new AliasInParenthesesFinder()
      const note: Note = {
        source: '日本料理.md',
        text: '天ぷら（Tempura）は重要です',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints[0]?.span?.offset).toBe(0)
      expect(hints[0]?.span?.text).toContain('天ぷら')
      expect(hints[0]?.span?.text).toContain('Tempura')
      expect(hints[0]?.line).toBe(1)
    })
  })

  describe('find - 略称展開の検出', () => {
    it('略称（正式名称）の形式にマッチすること', () => {
      const finder = new AliasInParenthesesFinder()
      const note: Note = {
        source: '日本料理.md',
        text: 'MSG（Monosodium Glutamate）は旨味成分の一つです',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.name).toBe('MSG')
      expect(hints[0]?.description).toBe('Monosodium Glutamate')
    })

    it('正式名称（略称）の形式でも略称を用語にすること', () => {
      const finder = new AliasInParenthesesFinder()
      const note: Note = {
        source: '日本料理.md',
        text: 'Fermented Soybean Paste（FSP）は発酵食品です',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.name).toBe('FSP')
      expect(hints[0]?.description).toBe('Fermented Soybean Paste')
    })
  })

  describe('find - 全般の振る舞い', () => {
    it('日本語（日本語）のパターンにはマッチしないこと', () => {
      const finder = new AliasInParenthesesFinder()
      const note: Note = {
        source: '日本料理.md',
        text: '味噌汁（衣をつけて油で揚げる伝統的な調理法）を使って通信する',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(0)
    })

    it('テキストが空の場合は空配列を返すこと', () => {
      const finder = new AliasInParenthesesFinder()
      const note: Note = {
        source: '日本料理.md',
        text: '',
        origins: [{ offset: 0, line: 1 }],
      }
      expect(finder.find(note)).toHaveLength(0)
    })

    it('複数のパターンを検出すること', () => {
      const finder = new AliasInParenthesesFinder()
      const note: Note = {
        source: '日本料理.md',
        text: '天ぷら（Tempura）と出汁（Dashi）は和食の基本です',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(2)
      expect(hints[0]?.name).toBe('天ぷら')
      expect(hints[1]?.name).toBe('と出汁')
    })

    it('括弧の外側の先頭空白を除去すること', () => {
      const finder = new AliasInParenthesesFinder()
      const note: Note = {
        source: '日本料理.md',
        text: 'これは重要。 天ぷら（Tempura）は代表的です',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.name).toBe('天ぷら')
    })

    it('行番号対応一覧で後半パターンの行番号を正しく解決すること', () => {
      const finder = new AliasInParenthesesFinder()
      const note: Note = {
        source: '日本料理.md',
        text: '前半のテキスト。寿司（Sushi）は握りが代表的です',
        origins: [
          { offset: 0, line: 3 },
          { offset: 8, line: 10 },
        ],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.name).toBe('寿司')
      expect(hints[0]?.line).toBe(10)
    })
  })
})
