import { describe, expect, it } from 'vitest'
import type { Note } from '../../../models/note.js'
import { JapaneseSupplementInParenthesesFinder } from '../../../pipes/finders/japanese-supplement-in-parentheses-finder.js'

describe('JapaneseSupplementInParenthesesFinder', () => {
  describe('find - 日本語補足の検出', () => {
    it('日本語（日本語補足）のパターンにマッチすること', () => {
      const finder = new JapaneseSupplementInParenthesesFinder()
      const note: Note = {
        source: '和食材.md',
        text: '出汁（昆布や鰹節から旨味を抽出した煮汁）を使って料理する',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.name).toBe('出汁')
      expect(hints[0]?.description).toBe('昆布や鰹節から旨味を抽出した煮汁')
    })

    it('半角括弧でもマッチすること', () => {
      const finder = new JapaneseSupplementInParenthesesFinder()
      const note: Note = {
        source: '和食材.md',
        text: '出汁(昆布で取る和風の基本)を利用する',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.name).toBe('出汁')
    })

    it('日英ペアにはマッチしないこと', () => {
      const finder = new JapaneseSupplementInParenthesesFinder()
      const note: Note = {
        source: '和食材.md',
        text: '天ぷら（Tempura）は食材に衣をつけて揚げる',
        origins: [{ offset: 0, line: 1 }],
      }
      expect(finder.find(note)).toHaveLength(0)
    })

    it('略称展開にはマッチしないこと', () => {
      const finder = new JapaneseSupplementInParenthesesFinder()
      const note: Note = {
        source: '和食材.md',
        text: 'MSG（Monosodium Glutamate）は旨味調味料です',
        origins: [{ offset: 0, line: 1 }],
      }
      expect(finder.find(note)).toHaveLength(0)
    })

    it('マッチ位置と行番号を正しく設定すること', () => {
      const finder = new JapaneseSupplementInParenthesesFinder()
      const note: Note = {
        source: '和食材.md',
        text: '出汁（昆布から取る）を使う',
        origins: [{ offset: 0, line: 1 }],
      }
      const hints = finder.find(note)
      expect(hints[0]?.span?.offset).toBe(0)
      expect(hints[0]?.span?.text).toContain('出汁')
      expect(hints[0]?.line).toBe(1)
    })

    it('テキストが空の場合は空配列を返すこと', () => {
      const finder = new JapaneseSupplementInParenthesesFinder()
      const note: Note = {
        source: '和食材.md',
        text: '',
        origins: [{ offset: 0, line: 1 }],
      }
      expect(finder.find(note)).toHaveLength(0)
    })

    it('両側が非日本語の括弧にはマッチしないこと', () => {
      const finder = new JapaneseSupplementInParenthesesFinder()
      const note: Note = {
        source: '和食材.md',
        text: 'cgroup（07-cgroup）の知識が重要です',
        origins: [{ offset: 0, line: 1 }],
      }
      expect(finder.find(note)).toHaveLength(0)
    })

    it('行番号対応一覧で後半パターンの行番号を正しく解決すること', () => {
      const finder = new JapaneseSupplementInParenthesesFinder()
      const note: Note = {
        source: '和食材.md',
        text: '前半のテキスト。味噌（大豆を発酵させた調味料）は和食に欠かせない',
        origins: [
          { offset: 0, line: 3 },
          { offset: 8, line: 12 },
        ],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.name).toBe('味噌')
      expect(hints[0]?.line).toBe(12)
    })
  })
})
