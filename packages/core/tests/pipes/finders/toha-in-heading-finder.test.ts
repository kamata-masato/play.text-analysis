import { describe, expect, it } from 'vitest'
import type { Note } from '../../../models/note.js'
import { TohaInHeadingFinder } from '../../../pipes/finders/toha-in-heading-finder.js'

describe('TohaInHeadingFinder', () => {
  describe('find - 見出しパターンの検出', () => {
    it('見出しの「Xとは」パターンにマッチすること', () => {
      const finder = new TohaInHeadingFinder()
      const note: Note = {
        source: '球技.md',
        text: 'オフサイドとは、攻撃側の選手が守備側の最終ラインより前に出た状態のことです',
        origins: [{ offset: 0, line: 4 }],
        headings: [{ depth: 3, text: 'オフサイドとは', line: 3 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.name).toBe('オフサイド')
      expect(hints[0]?.description).toBe(note.text)
      expect(hints[0]?.line).toBe(3)
    })

    it('見出し一覧を持たない場合は空配列を返すこと', () => {
      const finder = new TohaInHeadingFinder()
      const note: Note = {
        source: '球技.md',
        text: '冒頭テキスト',
        origins: [{ offset: 0, line: 1 }],
      }
      expect(finder.find(note)).toHaveLength(0)
    })

    it('末尾の見出しのみを対象とすること', () => {
      const finder = new TohaInHeadingFinder()
      const note: Note = {
        source: '球技.md',
        text: '本文テキスト',
        origins: [{ offset: 0, line: 5 }],
        headings: [
          { depth: 1, text: '概要とは', line: 1 },
          { depth: 2, text: '基本概念', line: 3 },
        ],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(0)
    })

    it('半角疑問符が付くケースにマッチすること', () => {
      const finder = new TohaInHeadingFinder()
      const note: Note = {
        source: '球技.md',
        text: '説明テキスト',
        origins: [{ offset: 0, line: 4 }],
        headings: [{ depth: 2, text: 'ドリブルとは?', line: 3 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.name).toBe('ドリブル')
    })

    it('全角疑問符にもマッチすること', () => {
      const finder = new TohaInHeadingFinder()
      const note: Note = {
        source: '球技.md',
        text: '説明テキスト',
        origins: [{ offset: 0, line: 4 }],
        headings: [{ depth: 2, text: 'トラップとは？', line: 3 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.name).toBe('トラップ')
    })

    it('本文が空の場合は説明文を省略すること', () => {
      const finder = new TohaInHeadingFinder()
      const note: Note = {
        source: '球技.md',
        text: '',
        origins: [],
        headings: [{ depth: 2, text: 'ハットトリックとは', line: 5 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.name).toBe('ハットトリック')
      expect(hints[0]?.description).toBeUndefined()
    })

    it('見出し一覧が空配列の場合は空配列を返すこと', () => {
      const finder = new TohaInHeadingFinder()
      const note: Note = {
        source: '球技.md',
        text: '冒頭テキスト',
        origins: [{ offset: 0, line: 1 }],
        headings: [],
      }
      expect(finder.find(note)).toHaveLength(0)
    })

    it('「とは」を含まない見出しにはマッチしないこと', () => {
      const finder = new TohaInHeadingFinder()
      const note: Note = {
        source: '球技.md',
        text: '本文テキスト',
        origins: [{ offset: 0, line: 2 }],
        headings: [{ depth: 1, text: '基本概念', line: 1 }],
      }
      expect(finder.find(note)).toHaveLength(0)
    })

    it('マッチ位置を設定しないこと', () => {
      const finder = new TohaInHeadingFinder()
      const note: Note = {
        source: '球技.md',
        text: '本文テキスト',
        origins: [{ offset: 0, line: 4 }],
        headings: [{ depth: 2, text: 'ドリブルとは', line: 3 }],
      }
      const hints = finder.find(note)
      expect(hints[0]?.span).toBeUndefined()
    })
  })
})
