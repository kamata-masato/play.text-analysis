import { describe, expect, it } from 'vitest'
import type { Note } from '../../../sources/models/note.js'
import BoldTextFinder from '../../../sources/processors/finders/bold-text-finder.js'

const finder = new BoldTextFinder()

describe('BoldTextFinder', () => {
  describe('find', () => {
    it('strong の Emphasis から Hint を返す', () => {
      const note: Note = {
        source: 'inline.md',
        text: 'コアダンプとは、プロセスが...',
        origins: [{ offset: 0, line: 3 }],
        emphases: [{ span: { text: 'コアダンプ', offset: 0 }, kind: 'strong' }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.name).toBe('コアダンプ')
      expect(hints[0]?.span?.text).toBe('コアダンプ')
      expect(hints[0]?.span?.offset).toBe(0)
      expect(hints[0]?.line).toBe(3)
    })

    it('emphases が undefined の場合は空配列を返す', () => {
      const note: Note = {
        source: 'inline.md',
        text: 'テキストのみ',
        origins: [{ offset: 0, line: 1 }],
      }
      expect(finder.find(note)).toHaveLength(0)
    })

    it('空白のみの太字をスキップする', () => {
      const note: Note = {
        source: 'inline.md',
        text: '  テキスト',
        origins: [{ offset: 0, line: 1 }],
        emphases: [{ span: { text: '  ', offset: 0 }, kind: 'strong' }],
      }
      expect(finder.find(note)).toHaveLength(0)
    })

    it('複数の strong から複数の Hint を返す', () => {
      const note: Note = {
        source: 'inline.md',
        text: 'プロセスとスレッドの違い',
        origins: [{ offset: 0, line: 5 }],
        emphases: [
          { span: { text: 'プロセス', offset: 0 }, kind: 'strong' },
          { span: { text: 'スレッド', offset: 13 }, kind: 'strong' },
        ],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(2)
      expect(hints[0]?.name).toBe('プロセス')
      expect(hints[1]?.name).toBe('スレッド')
    })

    it('description を設定しない', () => {
      const note: Note = {
        source: 'inline.md',
        text: 'コアダンプとは...',
        origins: [{ offset: 0, line: 1 }],
        emphases: [{ span: { text: 'コアダンプ', offset: 0 }, kind: 'strong' }],
      }
      const hints = finder.find(note)
      expect(hints[0]?.description).toBeUndefined()
    })
  })
})
