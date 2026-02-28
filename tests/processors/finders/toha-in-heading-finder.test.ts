import { describe, expect, it } from 'vitest'
import type { Note } from '../../../sources/models/note.js'
import TohaInHeadingFinder from '../../../sources/processors/finders/toha-in-heading-finder.js'

const finder = new TohaInHeadingFinder()

describe('TohaInHeadingFinder', () => {
  describe('find', () => {
    it('見出しの「Xとは」パターンから Hint を返す', () => {
      const note: Note = {
        source: 'inline.md',
        text: 'コアダンプとは、プロセスが異常終了したときにメモリの内容をファイルに保存したものです',
        origins: [{ offset: 0, line: 4 }],
        headings: [{ depth: 3, text: 'コアダンプとは', line: 3 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.name).toBe('コアダンプ')
      expect(hints[0]?.description).toBe(note.text)
      expect(hints[0]?.line).toBe(3)
    })

    it('headings が undefined の場合は空配列を返す', () => {
      const note: Note = {
        source: 'inline.md',
        text: '冒頭テキスト',
        origins: [{ offset: 0, line: 1 }],
      }
      expect(finder.find(note)).toHaveLength(0)
    })

    it('末尾の見出しのみを対象とする', () => {
      const note: Note = {
        source: 'inline.md',
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

    it('「Xとは？」のように疑問符が付くケースにマッチする', () => {
      const note: Note = {
        source: 'inline.md',
        text: '説明テキスト',
        origins: [{ offset: 0, line: 4 }],
        headings: [{ depth: 2, text: 'プロセスとは？', line: 3 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.name).toBe('プロセス')
    })

    it('全角疑問符にもマッチする', () => {
      const note: Note = {
        source: 'inline.md',
        text: '説明テキスト',
        origins: [{ offset: 0, line: 4 }],
        headings: [{ depth: 2, text: 'スレッドとは？', line: 3 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.name).toBe('スレッド')
    })

    it('本文が空の場合は description を省略する', () => {
      const note: Note = {
        source: 'inline.md',
        text: '',
        origins: [],
        headings: [{ depth: 2, text: 'ミューテックスとは', line: 5 }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.name).toBe('ミューテックス')
      expect(hints[0]?.description).toBeUndefined()
    })

    it('「とは」を含まない見出しにはマッチしない', () => {
      const note: Note = {
        source: 'inline.md',
        text: '本文テキスト',
        origins: [{ offset: 0, line: 2 }],
        headings: [{ depth: 1, text: '基本概念', line: 1 }],
      }
      expect(finder.find(note)).toHaveLength(0)
    })

    it('span を設定しない', () => {
      const note: Note = {
        source: 'inline.md',
        text: '本文テキスト',
        origins: [{ offset: 0, line: 4 }],
        headings: [{ depth: 2, text: 'プロセスとは', line: 3 }],
      }
      const hints = finder.find(note)
      expect(hints[0]?.span).toBeUndefined()
    })
  })
})
