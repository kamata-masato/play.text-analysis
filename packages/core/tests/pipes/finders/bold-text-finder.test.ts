import { describe, expect, it } from 'vitest'
import type { Note } from '../../../models/note.js'
import { BoldTextFinder } from '../../../pipes/finders/bold-text-finder.js'

describe('BoldTextFinder', () => {
  describe('find - 強調マーク一覧からの抽出', () => {
    it('強調マーク一覧から手がかりを抽出すること', () => {
      const finder = new BoldTextFinder()
      const note: Note = {
        source: '絵画技法.md',
        text: 'フレスコ画とは、壁面に顔料を...',
        origins: [{ offset: 0, line: 3 }],
        emphases: [{ span: { text: 'フレスコ画', offset: 0 }, kind: 'strong' }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.name).toBe('フレスコ画')
      expect(hints[0]?.span?.text).toBe('フレスコ画')
      expect(hints[0]?.span?.offset).toBe(0)
      expect(hints[0]?.line).toBe(3)
    })

    it('強調マーク一覧を持たない場合は空配列を返すこと', () => {
      const finder = new BoldTextFinder()
      const note: Note = {
        source: '絵画技法.md',
        text: 'テキストのみ',
        origins: [{ offset: 0, line: 1 }],
      }
      expect(finder.find(note)).toHaveLength(0)
    })

    it('空白のみの強調マークをスキップすること', () => {
      const finder = new BoldTextFinder()
      const note: Note = {
        source: '絵画技法.md',
        text: '  テキスト',
        origins: [{ offset: 0, line: 1 }],
        emphases: [{ span: { text: '  ', offset: 0 }, kind: 'strong' }],
      }
      expect(finder.find(note)).toHaveLength(0)
    })

    it('強調マーク一覧から複数の手がかりを返すこと', () => {
      const finder = new BoldTextFinder()
      const note: Note = {
        source: '絵画技法.md',
        text: 'テンペラとパステルの違い',
        origins: [{ offset: 0, line: 5 }],
        emphases: [
          { span: { text: 'テンペラ', offset: 0 }, kind: 'strong' },
          { span: { text: 'パステル', offset: 13 }, kind: 'strong' },
        ],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(2)
      expect(hints[0]?.name).toBe('テンペラ')
      expect(hints[1]?.name).toBe('パステル')
    })

    it('行番号対応一覧で後半の強調マークの行番号を正しく解決すること', () => {
      const finder = new BoldTextFinder()
      const note: Note = {
        source: '絵画技法.md',
        text: '前半のテキストと後半のパステル',
        origins: [
          { offset: 0, line: 3 },
          { offset: 8, line: 10 },
        ],
        emphases: [{ span: { text: 'パステル', offset: 11 }, kind: 'strong' }],
      }
      const hints = finder.find(note)
      expect(hints).toHaveLength(1)
      expect(hints[0]?.name).toBe('パステル')
      expect(hints[0]?.line).toBe(10)
    })

    it('強調マーク一覧が空配列の場合は空配列を返すこと', () => {
      const finder = new BoldTextFinder()
      const note: Note = {
        source: '絵画技法.md',
        text: 'テキストのみ',
        origins: [{ offset: 0, line: 1 }],
        emphases: [],
      }
      expect(finder.find(note)).toHaveLength(0)
    })

    it('説明文を設定しないこと', () => {
      const finder = new BoldTextFinder()
      const note: Note = {
        source: '絵画技法.md',
        text: 'フレスコ画とは...',
        origins: [{ offset: 0, line: 1 }],
        emphases: [{ span: { text: 'フレスコ画', offset: 0 }, kind: 'strong' }],
      }
      const hints = finder.find(note)
      expect(hints[0]?.description).toBeUndefined()
    })
  })
})
